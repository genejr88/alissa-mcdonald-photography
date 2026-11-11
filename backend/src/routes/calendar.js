const router = require('express').Router();
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { buildEvent, buildCalendar } = require('../lib/ics');

const BASE_URL = process.env.SITE_URL || 'https://alissamcdonaldphotography.com';
const FEED_SETTING_KEY = 'calendarFeedToken';

function feedUrl(token) {
  return `${BASE_URL}/api/calendar/feed/${token}.ics`;
}

async function getOrCreateFeedToken() {
  const existing = await prisma.appSetting.findUnique({ where: { key: FEED_SETTING_KEY } });
  if (existing) return existing.value;
  const token = crypto.randomBytes(24).toString('hex');
  await prisma.appSetting.create({ data: { key: FEED_SETTING_KEY, value: token } });
  return token;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /api/calendar/feed-url — the subscribable feed URL (created on first request)
router.get('/feed-url', requireAuth, async (req, res, next) => {
  try {
    const token = await getOrCreateFeedToken();
    res.json({ url: feedUrl(token) });
  } catch (e) { next(e); }
});

// POST /api/calendar/feed-url/regenerate — rotate the feed's secret token
router.post('/feed-url/regenerate', requireAuth, async (req, res, next) => {
  try {
    const token = crypto.randomBytes(24).toString('hex');
    await prisma.appSetting.upsert({
      where: { key: FEED_SETTING_KEY },
      update: { value: token },
      create: { key: FEED_SETTING_KEY, value: token },
    });
    res.json({ url: feedUrl(token) });
  } catch (e) { next(e); }
});

// ── Public (secret-gated by the feed token, not auth) ─────────────────────────

// GET /api/calendar/feed/:feedToken.ics — confirmed bookings, for calendar app subscriptions
router.get('/feed/:feedToken.ics', async (req, res, next) => {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: FEED_SETTING_KEY } });
    if (!setting || setting.value !== req.params.feedToken) {
      return res.status(404).send('Not found.');
    }

    const bookings = await prisma.booking.findMany({
      where: { status: 'CONFIRMED' },
      include: { service: true },
      orderBy: { startsAt: 'asc' },
    });

    const events = bookings.map((b) => buildEvent({
      uid: `booking-${b.id}@alissamcdonaldphotography.com`,
      summary: `${b.clientName} — ${b.service?.name || 'Session'}`,
      description: [b.notes, b.adminNotes].filter(Boolean).join('\n\n') || undefined,
      start: b.startsAt,
      end: b.endsAt,
      createdAt: b.updatedAt,
    }));

    const ics = buildCalendar(events, { name: 'AMP Bookings' });
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.send(ics);
  } catch (e) { next(e); }
});

module.exports = router;
