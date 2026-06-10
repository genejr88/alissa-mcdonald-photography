const router = require('express').Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// Public — submit inquiry
router.post('/', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email, and message are required' });
    }
    const inquiry = await prisma.inquiry.create({ data: { name, email, message } });
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
