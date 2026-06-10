const router = require('express').Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { sendMail } = require('../lib/mailer');

const ADMIN_URL = (process.env.SITE_URL || 'https://alissamcdonaldphotography.com') + '/admin/inquiries';

// Public — submit inquiry
router.post('/', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email, and message are required' });
    }
    const inquiry = await prisma.inquiry.create({ data: { name, email, message } });

    // Notify Alissa — replyTo is the client, so she can just hit Reply
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendMail({
        to: adminEmail,
        replyTo: `${name} <${email}>`,
        subject: `New question from ${name}`,
        text: `${name} (${email}) sent a note through the site:\n\n${message}\n\nReply to this email to answer them directly, or manage it at ${ADMIN_URL}`,
        html: `<p><strong>${name}</strong> (${email}) sent a note through the site:</p><blockquote style="border-left:3px solid #ccc;margin:12px 0;padding:8px 16px;color:#444;">${String(message).replace(/</g, '&lt;').replace(/\n/g, '<br>')}</blockquote><p>Just hit <strong>Reply</strong> to answer them directly, or <a href="${ADMIN_URL}">view it in admin</a>.</p>`,
      }).catch(console.error);
    }

    res.status(201).json({ ok: true, id: inquiry.id });
  } catch (err) {
    next(err);
  }
});

// Admin — list all
router.get('/admin', requireAuth, async (req, res, next) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(inquiries);
  } catch (err) {
    next(err);
  }
});

// Admin — mark handled
router.put('/admin/:id', requireAuth, async (req, res, next) => {
  try {
    const { handled } = req.body;
    const inquiry = await prisma.inquiry.update({
      where: { id: req.params.id },
      data: { handled: !!handled },
    });
    res.json(inquiry);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
