const router = require('express').Router();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { requireAuth, signToken } = require('../middleware/auth');

// POST /api/auth/login — username OR email
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const user = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: username }] },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({
      token: signToken(user),
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ id: user.id, username: user.username, name: user.name, role: user.role });
  } catch (err) {
    next(err);
  }
});

router.put('/password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ── User management (any authenticated user — this is a single-studio app) ──

router.get('/users', requireAuth, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.post('/users', requireAuth, async (req, res, next) => {
  try {
    const { username, email, name, password } = req.body;
    if (!username || !email || !name || !password || password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Username, email, name, and a password of at least 8 characters are required' });
    }
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      return res.status(409).json({ error: 'A user with that username or email already exists' });
    }
    const user = await prisma.user.create({
      data: { username, email, name, passwordHash: await bcrypt.hash(password, 10) },
    });
    res.status(201).json({ id: user.id, username: user.username, email: user.email, name: user.name });
  } catch (err) {
    next(err);
  }
});

// Reset another user's password (no current password needed)
router.put('/users/:id/password', requireAuth, async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id', requireAuth, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const count = await prisma.user.count();
    if (count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last user' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
