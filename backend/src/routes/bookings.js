const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { getAvailableSlots, studioTimeToUtc } = require('../lib/availability');
const { sendMail } = require('../lib/mailer');

const BASE_URL = process.env.SITE_URL || 'https://alissamcdonaldphotography.com';

async function getTimezone() {
  const s = await prisma.appSetting.findUnique({ where: { key: 'timezone' } });
  return s?.value || 'America/New_York';
}

function formatLocalDateTime(date, timezone) {
  return new Date(date).toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ── Public ────────────────────────────────────────────────────────────────────

// POST /api/bookings — create booking
router.post('/', async (req, res, next) => {
  try {
    const { serviceId, date, time, clientName, clientEmail, clientPhone, notes } = req.body;

    if (!serviceId || !date || !time || !clientName || !clientEmail) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const [service, rules, exceptions, timezone] = await Promise.all([
      prisma.service.findUnique({ where: { id: serviceId } }),
      prisma.availabilityRule.findMany(),
      prisma.availabilityException.findMany(),
      getTimezone(),
    ]);

    if (!service || !service.active) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    const startsAt = studioTimeToUtc(date, time, timezone);
    const endsAt = new Date(startsAt.getTime() + service.durationMin * 60000);

    // Collision check — server-side, atomic
    const existing = await prisma.booking.findMany({
      where: {
        status: { notIn: ['CANCELLED'] },
        startsAt: { gte: new Date(startsAt.getTime() - (service.durationMin + service.bufferMin * 2) * 60000) },
        endsAt: { lte: new Date(endsAt.getTime() + (service.durationMin + service.bufferMin * 2) * 60000) },
      },
    });

    const available = getAvailableSlots(date, service, rules, exceptions, existing, timezone);
    if (!available.includes(time)) {
      return res.status(409).json({ error: 'That slot is no longer available. Please choose another time.' });
    }

    const booking = await prisma.booking.create({
      data: {
        serviceId,
        clientName,
        clientEmail,
        clientPhone: clientPhone || null,
        notes: notes || null,
        startsAt,
        endsAt,
      },
      include: { service: true },
    });

    // Send emails (fire and forget)
    const displayTime = formatLocalDateTime(booking.startsAt, timezone);
    const clientLink = `${BASE_URL}/booking/${booking.token}`;
    const adminEmail = process.env.ADMIN_EMAIL;

    sendMail({
      to: clientEmail,
      subject: `Your session request is confirmed — Alissa McDonald Photography`,
      text: `Hi ${clientName},\n\nThank you for booking! I've received your request for a ${service.name} on ${displayTime}.\n\nI'll be in touch soon to confirm your spot.\n\nYou can view your booking details here:\n${clientLink}\n\nCan't wait to meet you!\n— Alissa`,
      html: `<p>Hi ${clientName},</p><p>Thank you for booking! I've received your request for a <strong>${service.name}</strong> on <strong>${displayTime}</strong>.</p><p>I'll be in touch soon to confirm your spot.</p><p><a href="${clientLink}">View your booking →</a></p><p>Can't wait to meet you!<br>— Alissa</p>`,
    }).catch(console.error);

    if (adminEmail) {
      sendMail({
        to: adminEmail,
        subject: `New booking request: ${clientName} — ${service.name}`,
        text: `New booking from ${clientName} (${clientEmail}).\n\nService: ${service.name}\nDate: ${displayTime}\nPhone: ${clientPhone || '—'}\nNotes: ${notes || '—'}\n\nManage: ${BASE_URL}/admin/bookings`,
      }).catch(console.error);
    }

    res.status(201).json({ token: booking.token });
  } catch (e) { next(e); }
});

// GET /api/bookings/token/:token — client view of their booking
router.get('/token/:token', async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { token: req.params.token },
      include: { service: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    res.json(booking);
  } catch (e) { next(e); }
});

// POST /api/bookings/token/:token/cancel — client cancel
router.post('/token/:token/cancel', async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { token: req.params.token },
      include: { service: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      return res.status(409).json({ error: `Booking is already ${booking.status.toLowerCase()}.` });
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' },
    });

    const timezone = await getTimezone();
    const displayTime = formatLocalDateTime(booking.startsAt, timezone);
    const adminEmail = process.env.ADMIN_EMAIL;

    if (adminEmail) {
      sendMail({
        to: adminEmail,
        subject: `Booking cancelled: ${booking.clientName} — ${booking.service.name}`,
        text: `${booking.clientName} has cancelled their ${booking.service.name} booking for ${displayTime}.`,
      }).catch(console.error);
    }

    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /api/bookings/admin?status=&page=
router.get('/admin', requireAuth, async (req, res, next) => {
  try {
    const { status, upcoming } = req.query;
    const where = {};
    if (status) where.status = status;
    if (upcoming === 'true') where.startsAt = { gte: new Date() };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: { service: true },
    });
    res.json(bookings);
  } catch (e) { next(e); }
});

// PUT /api/bookings/admin/:id — update status / notes / depositPaid
router.put('/admin/:id', requireAuth, async (req, res, next) => {
  try {
    const { status, adminNotes, depositPaid } = req.body;
    const data = {};
    if (status !== undefined) data.status = status;
    if (adminNotes !== undefined) data.adminNotes = adminNotes;
    if (depositPaid !== undefined) data.depositPaid = depositPaid;

    const prev = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { service: true } });
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data,
      include: { service: true },
    });

    // Email client on confirm
    if (status === 'CONFIRMED' && prev?.status !== 'CONFIRMED') {
      const timezone = await getTimezone();
      const displayTime = formatLocalDateTime(booking.startsAt, timezone);
      const clientLink = `${BASE_URL}/booking/${booking.token}`;
      const contractLink = `${BASE_URL}/contract`;
      sendMail({
        to: booking.clientEmail,
        subject: `You're confirmed! — Alissa McDonald Photography`,
        text: `Hi ${booking.clientName},\n\nYour ${booking.service.name} is confirmed for ${displayTime}.\n\nBefore your session, please complete the photography contract here:\n${contractLink}\n\nView your booking details: ${clientLink}\n\nSo excited to work with you!\n— Alissa`,
        html: `<p>Hi ${booking.clientName},</p><p>Your <strong>${booking.service.name}</strong> is confirmed for <strong>${displayTime}</strong>.</p><p>Please complete your <a href="${contractLink}">photography contract</a> before your session.</p><p><a href="${clientLink}">View booking details →</a></p><p>So excited to work with you!<br>— Alissa</p>`,
      }).catch(console.error);
    }

    res.json(booking);
  } catch (e) { next(e); }
});

module.exports = router;
