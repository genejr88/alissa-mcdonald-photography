const router = require('express').Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const TYPES = ['DEPOSIT', 'BALANCE', 'OTHER'];
const METHODS = ['SQUARE', 'CASH', 'CHECK', 'OTHER'];

// GET /api/payments/admin?from=&to= — flat payment log, newest first
router.get('/admin', requireAuth, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from || to) {
      where.paidAt = {};
      if (from) where.paidAt.gte = new Date(from);
      if (to) where.paidAt.lte = new Date(to);
    }
    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      include: { booking: { include: { service: true } } },
    });
    res.json(payments);
  } catch (e) { next(e); }
});

// POST /api/payments/admin — record a payment by hand (cash, check, a
// balance due on session day, or correcting something Square didn't catch).
router.post('/admin', requireAuth, async (req, res, next) => {
  try {
    const { bookingId, type, method, amount, note } = req.body;
    if (!bookingId || !type || !method || !amount) {
      return res.status(400).json({ error: 'Session, type, method, and amount are required.' });
    }
    if (!TYPES.includes(type)) return res.status(400).json({ error: 'Invalid payment type.' });
    if (!METHODS.includes(method)) return res.status(400).json({ error: 'Invalid payment method.' });
    const parsedAmount = parseFloat(amount);
    if (!(parsedAmount > 0)) return res.status(400).json({ error: 'Amount must be greater than zero.' });

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        type,
        method,
        amount: parsedAmount,
        note: note || null,
        recordedByName: req.user.name,
      },
    });

    if (type === 'DEPOSIT' && !booking.depositPaid) {
      await prisma.booking.update({ where: { id: bookingId }, data: { depositPaid: true } });
    }

    res.status(201).json(payment);
  } catch (e) { next(e); }
});

// DELETE /api/payments/admin/:id — correct a mistaken entry
router.delete('/admin/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.payment.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
