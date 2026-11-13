const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { sendMail } = require('../lib/mailer');
const mailbox = require('../lib/mailbox');

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

// GET /api/mail/messages/:uid?folder=INBOX
router.get('/messages/:uid', requireAuth, async (req, res) => {
  try {
    const folder = req.query.folder || 'INBOX';
    const uid = parseInt(req.params.uid, 10);
    const message = await mailbox.getMessage({ folder, uid });
    res.json(message);
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

// POST /api/mail/send — compose or reply
// Body: { to, subject, text, inReplyToText? }
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { to, subject, text, inReplyToText } = req.body;
    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'to, subject, and text are required.' });
    }

    const body = inReplyToText
      ? `${text}\n\n--- Original message ---\n${inReplyToText}`
      : text;

    await sendMail({
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    });

    res.json({ ok: true });
  } catch (e) { respondMailError(res, e); }
});

module.exports = router;
