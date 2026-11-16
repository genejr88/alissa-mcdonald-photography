const router = require('express').Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { sendFromMailbox } = require('../lib/mailer');
const { decrypt } = require('../lib/crypto');
const mailbox = require('../lib/mailbox');
const prisma = require('../lib/prisma');
const sanitizeHtml = require('sanitize-html');

// Quill (the compose editor) has an open, unpatched XSS advisory in its own
// HTML export (GHSA-v3m3-f69x-jf25) — sanitize server-side before this HTML
// is ever sent out or stored, the same way inbound mail HTML is sanitized.
function sanitizeComposeHtml(html) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.filter((t) => t !== 'script' && t !== 'style'),
    allowedAttributes: { '*': ['style', 'href', 'alt', 'title'] },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}

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

// This is the photographer's/staff's own inbox — admin-only, same login as
// the rest of /admin. No public routes here. Each admin connects their own
// mailbox (Users → My Mailbox), so which inbox shows up depends on who's
// signed in — there's no single shared mailbox anymore.
async function getMailboxConfig(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.mailImapHost || !user?.mailUser || !user?.mailPassEnc) return null;
  return {
    host: user.mailImapHost,
    port: user.mailImapPort || 993,
    user: user.mailUser,
    pass: decrypt(user.mailPassEnc),
    fromName: user.mailFromName || user.name,
    signature: user.mailSignature || '',
  };
}

function requireMailbox(req, res, next) {
  getMailboxConfig(req.user.id).then((config) => {
    if (!config) return res.status(400).json({ error: 'Connect your mailbox first, from Users → My Mailbox.' });
    req.mailboxConfig = config;
    next();
  }).catch(next);
}

// Mailbox/network failures (bad host, auth rejected, timeout) are real,
// expected failure modes here, not bugs — surface the actual reason instead
// of letting Express's generic error handler swallow it into "Something
// went wrong". Safe to expose: this whole router is requireAuth-gated.
function respondMailError(res, e) {
  console.error('[mail] error:', e.message);
  res.status(502).json({ error: `Mailbox error: ${e.message}` });
}

// GET /api/mail/config — whether *my* mailbox is wired up, plus my signature
router.get('/config', requireAuth, async (req, res, next) => {
  try {
    const config = await getMailboxConfig(req.user.id);
    res.json({ configured: !!config, signature: config?.signature || '' });
  } catch (err) { next(err); }
});

// GET /api/mail/messages?folder=INBOX&page=1
router.get('/messages', requireAuth, requireMailbox, async (req, res) => {
  try {
    const folder = req.query.folder || 'INBOX';
    const page = parseInt(req.query.page || '1', 10);
    const data = await mailbox.listMessages(req.mailboxConfig, { folder, page });
    res.json(data);
  } catch (e) { respondMailError(res, e); }
});

// GET /api/mail/messages/search?folder=INBOX&q=...&page=1
// Registered before /messages/:uid — "search" would otherwise be parsed as a uid.
router.get('/messages/search', requireAuth, requireMailbox, async (req, res) => {
  try {
    const folder = req.query.folder || 'INBOX';
    const page = parseInt(req.query.page || '1', 10);
    const query = (req.query.q || '').trim();
    if (!query) return res.status(400).json({ error: 'q is required.' });
    const data = await mailbox.searchMessages(req.mailboxConfig, { folder, query, page });
    res.json(data);
  } catch (e) { respondMailError(res, e); }
});

// GET /api/mail/messages/:uid?folder=INBOX
router.get('/messages/:uid', requireAuth, requireMailbox, async (req, res) => {
  try {
    const folder = req.query.folder || 'INBOX';
    const uid = parseInt(req.params.uid, 10);
    const message = await mailbox.getMessage(req.mailboxConfig, { folder, uid });
    res.json(message);
  } catch (e) { respondMailError(res, e); }
});

// GET /api/mail/messages/:uid/attachments/:index?folder=INBOX — download one attachment
router.get('/messages/:uid/attachments/:index', requireAuth, requireMailbox, async (req, res) => {
  try {
    const folder = req.query.folder || 'INBOX';
    const uid = parseInt(req.params.uid, 10);
    const index = parseInt(req.params.index, 10);
    const attachment = await mailbox.getAttachment(req.mailboxConfig, { folder, uid, index });
    res.setHeader('Content-Type', attachment.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename.replace(/[^\x20-\x7e]/g, '_')}"`);
    res.send(attachment.content);
  } catch (e) { respondMailError(res, e); }
});

// PUT /api/mail/messages/:uid/seen?folder=INBOX  { seen: true|false }
router.put('/messages/:uid/seen', requireAuth, requireMailbox, async (req, res) => {
  try {
    const folder = req.query.folder || 'INBOX';
    const uid = parseInt(req.params.uid, 10);
    const seen = req.body?.seen !== false;
    const result = await mailbox.setSeen(req.mailboxConfig, { folder, uid, seen });
    res.json(result);
  } catch (e) { respondMailError(res, e); }
});

// DELETE /api/mail/messages/:uid?folder=INBOX — moves to Trash, or permanently
// deletes if already in Trash
router.delete('/messages/:uid', requireAuth, requireMailbox, async (req, res) => {
  try {
    const folder = req.query.folder || 'INBOX';
    const uid = parseInt(req.params.uid, 10);
    const result = await mailbox.deleteMessage(req.mailboxConfig, { folder, uid });
    res.json(result);
  } catch (e) { respondMailError(res, e); }
});

// POST /api/mail/send — compose or reply, multipart/form-data so attachments can ride along
// Fields: to, cc?, subject, html, inReplyToText? — Files: attachments[] (up to 5)
router.post('/send', requireAuth, requireMailbox, uploadAttachments, async (req, res) => {
  try {
    const { to, cc, subject, inReplyToText } = req.body;
    if (!to || !subject || !req.body.html) {
      return res.status(400).json({ error: 'to, subject, and a message body are required.' });
    }
    const html = sanitizeComposeHtml(req.body.html);

    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const bodyHtml = inReplyToText
      ? `${html}<br><br>--- Original message ---<br>${inReplyToText.replace(/\n/g, '<br>')}`
      : html;
    const bodyText = inReplyToText ? `${text}\n\n--- Original message ---\n${inReplyToText}` : text;

    const attachments = (req.files || []).map((f) => ({
      filename: f.originalname,
      content: f.buffer,
      contentType: f.mimetype,
    }));

    await sendFromMailbox({
      mailboxConfig: req.mailboxConfig,
      to,
      cc: cc || undefined,
      subject,
      text: bodyText,
      html: bodyHtml,
      attachments,
    });

    res.json({ ok: true });
  } catch (e) { respondMailError(res, e); }
});

module.exports = router;
