const router = require('express').Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { sendMail } = require('../lib/mailer');

const ADMIN_URL = (process.env.SITE_URL || 'https://alissamcdonaldphotography.com') + '/admin/inquiries';

// Public — a client couldn't find a slot that worked on the calendar and
// asked for something else instead.
router.post('/', async (req, res, next) => {
  try {
    const { serviceName, clientName, clientEmail, clientPhone, preferredDate, requestedTime, notes } = req.body;
    if (!clientName || !clientEmail || !requestedTime) {
      return res.status(400).json({ error: 'clientName, clientEmail, and requestedTime are required.' });
    }

    const request = await prisma.timeRequest.create({
      data: {
        serviceName: serviceName || null,
        clientName,
        clientEmail,
        clientPhone: clientPhone || null,
        preferredDate: preferredDate || null,
        requestedTime,
        notes: notes || null,
      },
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendMail({
        to: adminEmail,
        replyTo: `${clientName} <${clientEmail}>`,
        subject: `Time request: ${clientName}${serviceName ? ` — ${serviceName}` : ''}`,
        text:
          `${clientName} (${clientEmail}) couldn't find a time that worked` +
          `${preferredDate ? ` on ${preferredDate}` : ''} and requested:\n\n"${requestedTime}"\n\n` +
          `${notes ? `Notes: ${notes}\n\n` : ''}Phone: ${clientPhone || '—'}\n\nManage: ${ADMIN_URL}`,
        html:
          `<p><strong>${clientName}</strong> (${clientEmail}) couldn't find a time that worked` +
          `${preferredDate ? ` on ${preferredDate}` : ''} and requested:</p>` +
          `<blockquote style="border-left:3px solid #ccc;margin:12px 0;padding:8px 16px;">${String(requestedTime).replace(/</g, '&lt;')}</blockquote>` +
          (notes ? `<p>Notes: ${String(notes).replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>` : '') +
          `<p>Phone: ${clientPhone || '—'}</p><p><a href="${ADMIN_URL}">Manage in admin →</a></p>`,
      }).catch(console.error);
    }

    res.status(201).json({ ok: true, id: request.id });
  } catch (e) { next(e); }
});

// Admin — list
router.get('/admin', requireAuth, async (req, res, next) => {
  try {
    const requests = await prisma.timeRequest.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(requests);
  } catch (e) { next(e); }
});

// Admin — mark handled
router.put('/admin/:id', requireAuth, async (req, res, next) => {
  try {
    const { handled } = req.body;
    const request = await prisma.timeRequest.update({
      where: { id: req.params.id },
      data: { handled: !!handled },
    });
    res.json(request);
  } catch (e) { next(e); }
});

module.exports = router;
