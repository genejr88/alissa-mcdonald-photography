const router = require('express').Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const PUBLIC_KEYS = [
  'siteTitle',
  'tagline',
  'aboutText',
  'instagramUrl',
  'facebookUrl',
  'contactEmail',
  'accentColor',
  'timezone',
];

// GET /api/settings/public — settings the public site renders from
router.get('/public', async (req, res, next) => {
  try {
    const rows = await prisma.appSetting.findMany({ where: { key: { in: PUBLIC_KEYS } } });
    res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await prisma.appSetting.findMany();
    res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  } catch (err) {
    next(err);
  }
});

router.put('/', requireAuth, async (req, res, next) => {
  try {
    const entries = Object.entries(req.body || {});
    for (const [key, value] of entries) {
      await prisma.appSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
