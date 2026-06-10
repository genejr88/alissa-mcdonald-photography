const router = require('express').Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// Public — featured testimonials for Kind Words page
router.get('/', async (req, res, next) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { featured: true },
      orderBy: { sortOrder: 'asc' },
      include: { photo: { select: { url: true, width: true, height: true } } },
    });
    res.json(testimonials);
  } catch (err) {
    next(err);
  }
});

// Admin — all testimonials
router.get('/admin', requireAuth, async (req, res, next) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { photo: { select: { url: true } } },
    });
    res.json(testimonials);
  } catch (err) {
    next(err);
  }
});

router.post('/admin', requireAuth, async (req, res, next) => {
  try {
    const { quote, pullQuote, attribution, photoId, featured, sortOrder } = req.body;
    const t = await prisma.testimonial.create({
      data: {
        quote,
        pullQuote,
        attribution,
        photoId: photoId || null,
        featured: !!featured,
        sortOrder: sortOrder ?? 0,
      },
    });
    res.status(201).json(t);
  } catch (err) {
    next(err);
  }
});

router.put('/admin/:id', requireAuth, async (req, res, next) => {
  try {
    const { quote, pullQuote, attribution, photoId, featured, sortOrder } = req.body;
    const t = await prisma.testimonial.update({
      where: { id: req.params.id },
      data: {
        quote,
        pullQuote,
        attribution,
        photoId: photoId || null,
        featured: !!featured,
        sortOrder: sortOrder ?? 0,
      },
    });
    res.json(t);
  } catch (err) {
    next(err);
  }
});

router.delete('/admin/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.testimonial.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
