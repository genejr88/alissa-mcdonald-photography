const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { getAvailableSlots, studioTimeToUtc } = require('../lib/availability');
const { sendMail } = require('../lib/mailer');
const square = require('../lib/square');

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
      include: { service: true, payments: true },
    });
    res.json(bookings);
  } catch (e) { next(e); }
});

// Creates the Square deposit payment link once, the first time it's needed
// (on confirm, or on demand from admin) — never recreated once it exists,
// since the booking's squareOrderId is what the webhook matches payment
// events back to.
async function ensureDepositLink(booking) {
  if (!square.isConfigured() || booking.squarePaymentLinkUrl || !booking.service.depositAmount) {
    return booking;
  }
  try {
    const { url, orderId } = await square.createDepositPaymentLink({
      booking,
      service: booking.service,
      redirectUrl: `${BASE_URL}/booking/${booking.token}`,
    });
    return prisma.booking.update({
      where: { id: booking.id },
      data: { squarePaymentLinkUrl: url, squareOrderId: orderId },
      include: { service: true },
    });
  } catch (e) {
    console.error('[square] could not create deposit link:', e.message);
    return booking;
  }
}

// Shared with the admin-create route below — same "you're confirmed" email
// the public flow sends when a pending booking is confirmed.
async function sendConfirmedEmail(booking, timezone) {
  const displayTime = formatLocalDateTime(booking.startsAt, timezone);
  const clientLink = `${BASE_URL}/booking/${booking.token}`;
  const contractLink = `${BASE_URL}/contract`;
  const depositLine = booking.squarePaymentLinkUrl
    ? `\n\nPlease pay your deposit here to secure your spot:\n${booking.squarePaymentLinkUrl}`
    : '';
  const depositHtml = booking.squarePaymentLinkUrl
    ? `<p><a href="${booking.squarePaymentLinkUrl}" style="font-weight:bold;">Pay your deposit →</a></p>`
    : '';

  return sendMail({
    to: booking.clientEmail,
    subject: `You're confirmed! — Alissa McDonald Photography`,
    text: `Hi ${booking.clientName},\n\nYour ${booking.service.name} is confirmed for ${displayTime}.\n\nBefore your session, please complete the photography contract here:\n${contractLink}${depositLine}\n\nView your booking details: ${clientLink}\n\nSo excited to work with you!\n— Alissa`,
    html: `<p>Hi ${booking.clientName},</p><p>Your <strong>${booking.service.name}</strong> is confirmed for <strong>${displayTime}</strong>.</p><p>Please complete your <a href="${contractLink}">photography contract</a> before your session.</p>${depositHtml}<p><a href="${clientLink}">View booking details →</a></p><p>So excited to work with you!<br>— Alissa</p>`,
  });
}

// PUT /api/bookings/admin/:id — update status / notes / depositPaid, or
// correct the session's own details (service, date/time, client info).
router.put('/admin/:id', requireAuth, async (req, res, next) => {
  try {
    const {
      status, adminNotes, depositPaid,
      serviceId, date, time, clientName, clientEmail, clientPhone, notes,
    } = req.body;
    const data = {};
    if (status !== undefined) data.status = status;
    if (adminNotes !== undefined) data.adminNotes = adminNotes;
    if (depositPaid !== undefined) data.depositPaid = depositPaid;
    if (clientName !== undefined) data.clientName = clientName;
    if (clientEmail !== undefined) data.clientEmail = clientEmail;
    if (clientPhone !== undefined) data.clientPhone = clientPhone || null;
    if (notes !== undefined) data.notes = notes || null;

    const prev = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { service: true } });
    if (!prev) return res.status(404).json({ error: 'Booking not found.' });

    // Editing the session itself — recompute the time window if the service
    // and/or date/time changed, same duration math as creating one.
    if (serviceId !== undefined || date !== undefined || time !== undefined) {
      const service = serviceId !== undefined && serviceId !== prev.serviceId
        ? await prisma.service.findUnique({ where: { id: serviceId } })
        : prev.service;
      if (!service) return res.status(404).json({ error: 'Service not found.' });

      if (date !== undefined || time !== undefined) {
        const timezone = await getTimezone();
        // Reuse whichever half (date/time) wasn't changed from the existing start.
        const existingLocal = new Date(prev.startsAt).toISOString();
        const fallbackDate = existingLocal.slice(0, 10);
        const fallbackTime = existingLocal.slice(11, 16);
        const startsAt = studioTimeToUtc(date ?? fallbackDate, time ?? fallbackTime, timezone);
        data.startsAt = startsAt;
        data.endsAt = new Date(startsAt.getTime() + service.durationMin * 60000);
      } else if (serviceId !== undefined && serviceId !== prev.serviceId) {
        data.endsAt = new Date(prev.startsAt.getTime() + service.durationMin * 60000);
      }
      if (serviceId !== undefined) data.serviceId = serviceId;
    }

    let booking = await prisma.booking.update({
      where: { id: req.params.id },
      data,
      include: { service: true },
    });

    // Email client on confirm
    if (status === 'CONFIRMED' && prev?.status !== 'CONFIRMED') {
      booking = await ensureDepositLink(booking);
      const timezone = await getTimezone();
      sendConfirmedEmail(booking, timezone).catch(console.error);
    }

    // Keep the Accounting ledger in sync with the manual toggle — without
    // this, flipping depositPaid here directly would mark it paid without
    // ever recording a payment, and the ledger would miss it entirely.
    if (depositPaid === true && !prev?.depositPaid) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          type: 'DEPOSIT',
          method: 'OTHER',
          amount: booking.service.depositAmount || 0,
          note: 'Marked paid manually',
          recordedByName: req.user.name,
        },
      }).catch((e) => console.error('[payments] could not log manual deposit:', e.message));
    }

    res.json(booking);
  } catch (e) { next(e); }
});

// POST /api/bookings/admin — staff creating a booking directly (phone call,
// walk-in, etc.), as opposed to the public flow above. Defaults to
// CONFIRMED since a staff member entering this already knows it's happening;
// PENDING is available too if it still needs confirming later.
router.post('/admin', requireAuth, async (req, res, next) => {
  try {
    const {
      serviceId, date, time, clientName, clientEmail, clientPhone, notes,
      status = 'CONFIRMED', skipAvailabilityCheck, sendConfirmationEmail = true,
    } = req.body;

    if (!serviceId || !date || !time || !clientName || !clientEmail) {
      return res.status(400).json({ error: 'Service, date, time, client name, and email are required.' });
    }
    if (!['PENDING', 'CONFIRMED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be PENDING or CONFIRMED.' });
    }

    const [service, rules, exceptions, timezone] = await Promise.all([
      prisma.service.findUnique({ where: { id: serviceId } }),
      prisma.availabilityRule.findMany(),
      prisma.availabilityException.findMany(),
      getTimezone(),
    ]);
    if (!service) return res.status(404).json({ error: 'Service not found.' });

    const startsAt = studioTimeToUtc(date, time, timezone);
    const endsAt = new Date(startsAt.getTime() + service.durationMin * 60000);

    if (!skipAvailabilityCheck) {
      const existing = await prisma.booking.findMany({
        where: {
          status: { notIn: ['CANCELLED'] },
          startsAt: { gte: new Date(startsAt.getTime() - (service.durationMin + service.bufferMin * 2) * 60000) },
          endsAt: { lte: new Date(endsAt.getTime() + (service.durationMin + service.bufferMin * 2) * 60000) },
        },
      });
      const available = getAvailableSlots(date, service, rules, exceptions, existing, timezone);
      if (!available.includes(time)) {
        return res.status(409).json({ error: 'That slot conflicts with an existing booking or your schedule. Check "override" to book it anyway.' });
      }
    }

    let booking = await prisma.booking.create({
      data: {
        serviceId, clientName, clientEmail,
        clientPhone: clientPhone || null,
        notes: notes || null,
        startsAt, endsAt, status,
      },
      include: { service: true },
    });

    if (status === 'CONFIRMED') {
      booking = await ensureDepositLink(booking);
      if (sendConfirmationEmail) {
        sendConfirmedEmail(booking, timezone).catch(console.error);
      }
    }

    res.status(201).json(booking);
  } catch (e) { next(e); }
});

// POST /api/bookings/admin/:id/deposit-link — create the deposit link on
// demand (e.g. Square wasn't configured yet when the booking was confirmed).
router.post('/admin/:id/deposit-link', requireAuth, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { service: true } });
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (!square.isConfigured()) return res.status(400).json({ error: 'Square is not configured.' });
    if (!booking.service.depositAmount) return res.status(400).json({ error: 'This service has no deposit amount set.' });

    const updated = await ensureDepositLink(booking);
    if (!updated.squarePaymentLinkUrl) return res.status(502).json({ error: 'Could not create a deposit link.' });
    res.json({ url: updated.squarePaymentLinkUrl });
  } catch (e) { next(e); }
});

module.exports = router;
