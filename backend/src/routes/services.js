const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');

// GET /api/services — public, active services only
router.get('/', async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(services);
  } catch (e) { next(e); }
});

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /api/services/admin
router.get('/admin', requireAuth, async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(services);
  } catch (e) { next(e); }
});

// POST /api/services/admin
router.post('/admin', requireAuth, async (req, res, next) => {
  try {
    const { name, number, description, includes, durationMin, price, depositAmount, bufferMin, active } = req.body;
    const count = await prisma.service.count();
    const service = await prisma.service.create({
      data: {
        name, number: number ?? count + 1, description,
        includes: includes || null,
        durationMin: parseInt(durationMin),
        price: parseFloat(price),
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        bufferMin: parseInt(bufferMin || 30),
        active: active !== false,
        sortOrder: count,
      },
    });
    res.json(service);
  } catch (e) { next(e); }
});

// PUT /api/services/admin/:id
router.put('/admin/:id', requireAuth, async (req, res, next) => {
  try {
    const { name, number, description, includes, durationMin, price, depositAmount, bufferMin, active, sortOrder } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (number !== undefined) data.number = number;
    if (description !== undefined) data.description = description;
    if (includes !== undefined) data.includes = includes || null;
    if (durationMin !== undefined) data.durationMin = parseInt(durationMin);
    if (price !== undefined) data.price = parseFloat(price);
    if (depositAmount !== undefined) data.depositAmount = depositAmount ? parseFloat(depositAmount) : null;
    if (bufferMin !== undefined) data.bufferMin = parseInt(bufferMin);
    if (active !== undefined) data.active = active;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    const service = await prisma.service.update({ where: { id: req.params.id }, data });
    res.json(service);
  } catch (e) { next(e); }
});

// DELETE /api/services/admin/:id
router.delete('/admin/:id', requireAuth, async (req, res, next) => {
  try {
    const bookingCount = await prisma.booking.count({ where: { serviceId: req.params.id } });
    if (bookingCount > 0) {
      return res.status(409).json({ error: 'Cannot delete: service has existing bookings.' });
    }
    await prisma.service.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
