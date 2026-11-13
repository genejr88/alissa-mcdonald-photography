const router = require('express').Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { sendMail } = require('../lib/mailer');
const mailbox = require('../lib/mailbox');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 5 }, // 15MB/file, 5 files — most SMTP relays cap total message size well under this
});

// multer rejects an over-limit upload from inside its own middleware, before
// the route handler runs — its error never reaches our try/catch there, so
// it needs handling right here or it falls through to the generic 500.
function uploadAttachments(req, res, next) {
  upload.array('attachments', 5)(req, res, (err) => {
    if (err) return res.status(400).json({ error: `Attachment upload failed: ${err.message}` });
    next();
  });
}

// All of this is the photographer's own inbox — admin-only, same login as
// the rest of /admin. No public routes here.

// Mailbox/network failures (bad host, auth rejected, timeout) are real,
// expected failure modes here, not bugs — surface the actual reason instead
// of letting Express's generic error handler swallow it into "Something
// went wrong". Safe to expose: this whole router is requireAuth-gated.
function respondMailError(res, e) {
  console.error('[mail] error:', e.message);
  res.status(502).json({ error: `Mailbox error: ${e.message}` });
}

// GET /api/mail/config — whether the mailbox is wired up at all
router.get('/config', requireAuth, (req, res) => {
  res.json({ configured: mailbox.isConfigured() });
});

// GET /api/mail/messages?folder=INBOX&page=1
router.get('/messages', requireAuth, async (req, res) => {
  try {
    const folder = req.query.folder || 'INBOX';
    const page = parseInt(req.query.page || '1', 10);
    const data = await mailbox.listMessages({ folder, page });
    res.json(data);
  } catch (e) { respondMailError(res, e); }
});

// GET /api/mail/messages/search?folder=INBOX&q=...&page=1
// Registered before /messages/:uid — "search" would otherwise be parsed as a uid.
router.get('/messages/search', requireAuth, async (req, res) => {
  try {
    const folder = req.query.folder || 'INBOX';
    const page = parseInt(req.query.page || '1', 10);
    const query = (req.query.q || '').trim();
    if (!query) return res.status(400).json({ error: 'q is required.' });
    const data = await mailbox.searchMessages({ folder, query, page });
    res.json(data);
  } catch (e) { respondMailError(res, e); }
});

// GET /api/mail/messages/:uid?folder=INBOX
router.get('/messages/:uid', requireAuth, async (req, res) => {
  try {
    const folder = req.query.folder || 'INBOX';
    const uid = parseInt(req.params.uid, 10);
    const message = await mailbox.getMessage({ folder, uid });
    res.json(message);
  } catch (e) { respondMailError(res, e); }
});

// GET /api/mail/messages/:uid/attachments/:index?folder=INBOX — download one attachment
router.get('/messages/:uid/attachments/:index', requireAuth, async (req, res) => {
  try {
    const folder = req.query.folder || 'INBOX';
    const uid = parseInt(req.params.uid, 10);
    const index = parseInt(req.params.index, 10);
    const attachment = await mailbox.getAttachment({ folder, uid, index });
    res.setHeader('Content-Type', attachment.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename.replace(/[^\x20-\x7e]/g, '_')}"`);
    res.send(attachment.content);
  } catch (e) { respondMailError(res, e); }
});

// PUT /api/mail/messages/:uid/seen?folder=INBOX  { seen: true|false }
router.put('/messages/:uid/seen', requireAuth, async (req, res) => {
  try {
    const folder = req.query.folder || 'INBOX';
    const uid = parseInt(req.params.uid, 10);
    const seen = req.body?.seen !== false;
    const result = await mailbox.setSeen({ folder, uid, seen });
    res.json(result);
  } catch (e) { respondMailError(res, e); }
});

// DELETE /api/mail/messages/:uid?folder=INBOX — moves to Trash, or permanently
// deletes if already in Trash
router.delete('/messages/:uid', requireAuth, async (req, res) => {
  try {
    const folder = req.query.folder || 'INBOX';
    const uid = parseInt(req.params.uid, 10);
    const result = await mailbox.deleteMessage({ folder, uid });
    res.json(result);
  } catch (e) { respondMailError(res, e); }
});

// POST /api/mail/send — compose or reply, multipart/form-data so attachments can ride along
// Fields: to, cc?, subject, text, inReplyToText? — Files: attachments[] (up to 5)
router.post('/send', requireAuth, uploadAttachments, async (req, res) => {
  try {
    const { to, cc, subject, text, inReplyToText } = req.body;
    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'to, subject, and text are required.' });
    }

    const body = inReplyToText
      ? `${text}\n\n--- Original message ---\n${inReplyToText}`
      : text;

    const attachments = (req.files || []).map((f) => ({
      filename: f.originalname,
      content: f.buffer,
      contentType: f.mimetype,
    }));

    await sendMail({
      to,
      cc: cc || undefined,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
      attachments,
    });

    res.json({ ok: true });
  } catch (e) { respondMailError(res, e); }
});

module.exports = router;
