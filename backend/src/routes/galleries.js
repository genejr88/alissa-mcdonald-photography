const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Public ────────────────────────────────────────────────────────────────────

// GET /api/galleries
router.get('/', async (req, res, next) => {
  try {
    const galleries = await prisma.gallery.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        photos: { orderBy: { sortOrder: 'asc' }, take: 20 },
      },
    });
    res.json(galleries);
  } catch (e) { next(e); }
});

// GET /api/galleries/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const gallery = await prisma.gallery.findUnique({
      where: { slug: req.params.slug },
      include: { photos: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!gallery || !gallery.published) return res.status(404).json({ error: 'Not found' });
    res.json(gallery);
  } catch (e) { next(e); }
});

// ── Admin: galleries ──────────────────────────────────────────────────────────

// GET /api/galleries/admin/list
router.get('/admin/list', requireAuth, async (req, res, next) => {
  try {
    const galleries = await prisma.gallery.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { photos: true } },
        photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });
    res.json(galleries);
  } catch (e) { next(e); }
});

// POST /api/galleries/admin
router.post('/admin', requireAuth, async (req, res, next) => {
  try {
    const { title, description, mood, published, watermarked } = req.body;
    const slug = slugify(title);
    const count = await prisma.gallery.count();
    const gallery = await prisma.gallery.create({
      data: {
        title,
        slug,
        description: description || null,
        mood: mood || 'LIGHT',
        published: !!published,
        watermarked: !!watermarked,
        sortOrder: count,
      },
    });
    res.json(gallery);
  } catch (e) { next(e); }
});

// PUT /api/galleries/admin/:id
router.put('/admin/:id', requireAuth, async (req, res, next) => {
  try {
    const { title, description, mood, published, watermarked, coverPhotoId, sortOrder } = req.body;
    const data = {};
    if (title !== undefined) { data.title = title; data.slug = slugify(title); }
    if (description !== undefined) data.description = description;
    if (mood !== undefined) data.mood = mood;
    if (published !== undefined) data.published = published;
    if (watermarked !== undefined) data.watermarked = watermarked;
    if (coverPhotoId !== undefined) data.coverPhotoId = coverPhotoId;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    const gallery = await prisma.gallery.update({ where: { id: req.params.id }, data });
    res.json(gallery);
  } catch (e) { next(e); }
});

// DELETE /api/galleries/admin/:id
router.delete('/admin/:id', requireAuth, async (req, res, next) => {
  try {
    const photos = await prisma.photo.findMany({ where: { galleryId: req.params.id } });
    await Promise.allSettled(photos.map(p => cloudinary.uploader.destroy(p.cloudinaryPublicId)));
    await prisma.gallery.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Admin: upload signing ─────────────────────────────────────────────────────

// POST /api/galleries/admin/sign-upload
router.post('/admin/sign-upload', requireAuth, (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'amp-galleries';
  const paramsToSign = { timestamp, folder, colors: true };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({
    signature,
    timestamp,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
});

// ── Admin: photos ─────────────────────────────────────────────────────────────

// POST /api/galleries/admin/:galleryId/photos — save photo record after Cloudinary upload
router.post('/admin/:galleryId/photos', requireAuth, async (req, res, next) => {
  try {
    const { cloudinaryPublicId, url, width, height, dominantColor, caption, alt } = req.body;
    const agg = await prisma.photo.aggregate({
      where: { galleryId: req.params.galleryId },
      _max: { sortOrder: true },
    });
    const photo = await prisma.photo.create({
      data: {
        galleryId: req.params.galleryId,
        cloudinaryPublicId,
        url,
        width: parseInt(width),
        height: parseInt(height),
        dominantColor: dominantColor || null,
        caption: caption || null,
        alt: alt || null,
        sortOrder: (agg._max.sortOrder ?? -1) + 1,
      },
    });
    res.json(photo);
  } catch (e) { next(e); }
});

// PUT /api/galleries/admin/photos/:id
router.put('/admin/photos/:id', requireAuth, async (req, res, next) => {
  try {
    const { caption, alt, sortOrder } = req.body;
    const data = {};
    if (caption !== undefined) data.caption = caption;
    if (alt !== undefined) data.alt = alt;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    const photo = await prisma.photo.update({ where: { id: req.params.id }, data });
    res.json(photo);
  } catch (e) { next(e); }
});

// DELETE /api/galleries/admin/photos/:id
router.delete('/admin/photos/:id', requireAuth, async (req, res, next) => {
  try {
    const photo = await prisma.photo.findUnique({ where: { id: req.params.id } });
    if (!photo) return res.status(404).json({ error: 'Not found' });
    await cloudinary.uploader.destroy(photo.cloudinaryPublicId);
    await prisma.photo.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// PUT /api/galleries/admin/:galleryId/photos/reorder
router.put('/admin/:galleryId/photos/reorder', requireAuth, async (req, res, next) => {
  try {
    const { order } = req.body; // [{ id, sortOrder }, ...]
    await Promise.all(
      order.map(({ id, sortOrder }) =>
        prisma.photo.update({ where: { id }, data: { sortOrder } })
      )
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
