const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { getAvailableSlots, studioWeekday, toDateStr } = require('../lib/availability');

async function getTimezone() {
  const setting = await prisma.appSetting.findUnique({ where: { key: 'timezone' } });
  return setting?.value || 'America/New_York';
}

// GET /api/availability/slots?serviceId=X&date=YYYY-MM-DD
router.get('/slots', async (req, res, next) => {
  try {
    const { serviceId, date } = req.query;
    if (!serviceId || !date) return res.status(400).json({ error: 'serviceId and date required' });

    // Reject past dates
    const today = new Date().toISOString().slice(0, 10);
    if (date <= today) return res.json([]);

    const [service, rules, exceptions, timezone] = await Promise.all([
      prisma.service.findUnique({ where: { id: serviceId } }),
      prisma.availabilityRule.findMany(),
      prisma.availabilityException.findMany(),
      getTimezone(),
    ]);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    // Get bookings for this day (include buffer window on either end)
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    const existingBookings = await prisma.booking.findMany({
      where: {
        status: { notIn: ['CANCELLED'] },
        startsAt: { gte: new Date(dayStart.getTime() - service.bufferMin * 60000) },
        endsAt: { lte: new Date(dayEnd.getTime() + service.bufferMin * 60000) },
      },
    });

    const slots = getAvailableSlots(date, service, rules, exceptions, existingBookings, timezone);
    res.json(slots);
  } catch (e) { next(e); }
});

// GET /api/availability/month?serviceId=X&month=YYYY-MM
// Returns array of date strings that have at least one available slot.
router.get('/month', async (req, res, next) => {
  try {
    const { serviceId, month } = req.query;
    if (!serviceId || !month) return res.status(400).json({ error: 'serviceId and month required' });

    const [service, rules, exceptions, timezone] = await Promise.all([
      prisma.service.findUnique({ where: { id: serviceId } }),
      prisma.availabilityRule.findMany(),
      prisma.availabilityException.findMany(),
      getTimezone(),
    ]);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const [year, mon] = month.split('-').map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();
    const today = new Date().toISOString().slice(0, 10);

    // Build date list for the month
    const dates = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      dates.push(dateStr);
    }

    // Fetch all bookings in this month (plus buffer)
    const monthStart = new Date(`${month}-01T00:00:00.000Z`);
    const monthEnd = new Date(year, mon, 1); // first of next month
    const existingBookings = await prisma.booking.findMany({
      where: {
        status: { notIn: ['CANCELLED'] },
        startsAt: { gte: new Date(monthStart.getTime() - service.bufferMin * 60000) },
        endsAt: { lt: new Date(monthEnd.getTime() + service.bufferMin * 60000) },
      },
    });

    const availableDates = dates.filter((dateStr) => {
      if (dateStr <= today) return false;
      const slots = getAvailableSlots(dateStr, service, rules, exceptions, existingBookings, timezone);
      return slots.length > 0;
    });

    res.json(availableDates);
  } catch (e) { next(e); }
});

// ── Admin: availability rules ─────────────────────────────────────────────────

// GET /api/availability/rules
router.get('/rules', requireAuth, async (req, res, next) => {
  try {
    const rules = await prisma.availabilityRule.findMany({ orderBy: { weekday: 'asc' } });
    res.json(rules);
  } catch (e) { next(e); }
});

// PUT /api/availability/rules — replace entire weekly template
router.put('/rules', requireAuth, async (req, res, next) => {
  try {
    const { rules } = req.body; // [{ weekday, startTime, endTime }]
    await prisma.availabilityRule.deleteMany();
    if (rules?.length) {
      await prisma.availabilityRule.createMany({ data: rules });
    }
    const result = await prisma.availabilityRule.findMany({ orderBy: { weekday: 'asc' } });
    res.json(result);
  } catch (e) { next(e); }
});

// GET /api/availability/exceptions
router.get('/exceptions', requireAuth, async (req, res, next) => {
  try {
    const exceptions = await prisma.availabilityException.findMany({
      orderBy: { date: 'asc' },
    });
    res.json(exceptions);
  } catch (e) { next(e); }
});

// POST /api/availability/exceptions
router.post('/exceptions', requireAuth, async (req, res, next) => {
  try {
    const { date, type, startTime, endTime, note } = req.body;
    const ex = await prisma.availabilityException.create({
      data: {
        date: new Date(date),
        type,
        startTime: startTime || null,
        endTime: endTime || null,
        note: note || null,
      },
    });
    res.json(ex);
  } catch (e) { next(e); }
});

// DELETE /api/availability/exceptions/:id
router.delete('/exceptions/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.availabilityException.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
