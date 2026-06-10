const router = require('express').Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// The four pens visitors can write with — anything else falls back to ink
const INK_COLORS = ['#2E2C27', '#A4533F', '#5B6E5A', '#5C6B7A'];

// Public — read the page (visible notes, newest first)
router.get('/', async (req, res, next) => {
  try {
    const entries = await prisma.guestbookEntry.findMany({
      where: { hidden: false },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { id: true, name: true, message: true, inkColor: true, createdAt: true },
    });
    res.json(entries);
  } catch (err) {
    next(err);
  }
});

// Public — leave a note
router.post('/', async (req, res, next) => {
  try {
    const { name, message, inkColor, website } = req.body;
    // Honeypot: real visitors never see this field — bots fill it in
    if (website) return res.status(201).json({ ok: true });

    const cleanName = String(name || '').trim();
    const cleanMessage = String(message || '').trim();
    if (!cleanName || !cleanMessage) {
      return res.status(400).json({ error: 'name and message are required' });
    }
    if (cleanName.length > 40) {
      return res.status(400).json({ error: 'name must be 40 characters or fewer' });
    }
    if (cleanMessage.length > 280) {
      return res.status(400).json({ error: 'message must be 280 characters or fewer' });
    }

    const entry = await prisma.guestbookEntry.create({
      data: {
        name: cleanName,
        message: cleanMessage,
        inkColor: INK_COLORS.includes(inkColor) ? inkColor : INK_COLORS[0],
      },
      select: { id: true, name: true, message: true, inkColor: true, createdAt: true },
    });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// Admin — list everything, hidden included
router.get('/admin', requireAuth, async (req, res, next) => {
  try {
    const entries = await prisma.guestbookEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(entries);
  } catch (err) {
    next(err);
  }
});

// Admin — hide / unhide
router.put('/admin/:id', requireAuth, async (req, res, next) => {
  try {
    const entry = await prisma.guestbookEntry.update({
      where: { id: req.params.id },
      data: { hidden: !!req.body.hidden },
    });
    res.json(entry);
  } catch (err) {
    next(err);
  }
});

// Admin — delete
router.delete('/admin/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.guestbookEntry.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
