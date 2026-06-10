const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { sendMail } = require('../lib/mailer');
const { generateContractPdf } = require('../lib/generateContractPdf');

const BASE_URL = process.env.SITE_URL || 'https://alissamcdonaldphotography.com';

function fillMergeFields(body, fields) {
  return body
    .replace(/\{\{client_name\}\}/g, fields.clientName || '')
    .replace(/\{\{session_type\}\}/g, fields.sessionType || '')
    .replace(/\{\{session_date\}\}/g, fields.sessionDate || '')
    .replace(/\{\{price\}\}/g, fields.price || '')
    .replace(/\{\{deposit\}\}/g, fields.deposit || 'N/A');
}

// ── Templates (admin) ─────────────────────────────────────────────────────────

router.get('/templates', requireAuth, async (req, res, next) => {
  try {
    const templates = await prisma.contractTemplate.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(templates);
  } catch (e) { next(e); }
});

router.post('/templates', requireAuth, async (req, res, next) => {
  try {
    const { name, body } = req.body;
    const t = await prisma.contractTemplate.create({ data: { name, body, active: true } });
    res.json(t);
  } catch (e) { next(e); }
});

router.put('/templates/:id', requireAuth, async (req, res, next) => {
  try {
    const { name, body, active } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (body !== undefined) data.body = body;
    if (active !== undefined) data.active = active;
    const t = await prisma.contractTemplate.update({ where: { id: req.params.id }, data });
    res.json(t);
  } catch (e) { next(e); }
});

router.delete('/templates/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.contractTemplate.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Send contract (admin) ─────────────────────────────────────────────────────

// POST /api/contracts/send
// Body: { templateId, bookingId?, clientName, clientEmail, sessionType, sessionDate, price, deposit? }
router.post('/send', requireAuth, async (req, res, next) => {
  try {
    const { templateId, bookingId, clientName, clientEmail, sessionType, sessionDate, price, deposit } = req.body;
    if (!templateId || !clientName || !clientEmail) {
      return res.status(400).json({ error: 'templateId, clientName, and clientEmail are required.' });
    }

    const template = await prisma.contractTemplate.findUnique({ where: { id: templateId } });
    if (!template) return res.status(404).json({ error: 'Template not found.' });

    const renderedBody = fillMergeFields(template.body, {
      clientName, sessionType, sessionDate, price, deposit,
    });

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const contract = await prisma.contract.create({
      data: {
        templateId,
        bookingId: bookingId || null,
        renderedBody,
        expiresAt,
      },
    });

    const signingLink = `${BASE_URL}/sign/${contract.token}`;

    sendMail({
      to: clientEmail,
      subject: `Your photography contract is ready to sign — Alissa McDonald Photography`,
      text: `Hi ${clientName},\n\nYour photography contract is ready! Please review and sign it at the link below:\n\n${signingLink}\n\nThis link expires in 14 days.\n\nLooking forward to your session!\n— Alissa`,
      html: `<p>Hi ${clientName},</p><p>Your photography contract is ready to sign. Please click the link below to review and sign it:</p><p><a href="${signingLink}" style="font-size:16px;font-weight:bold;">Sign Your Contract →</a></p><p style="color:#999;font-size:12px;">This link expires in 14 days.</p><p>Looking forward to your session!<br>— Alissa</p>`,
    }).catch(console.error);

    res.json({ token: contract.token, signingLink });
  } catch (e) { next(e); }
});

// ── Admin: list contracts ─────────────────────────────────────────────────────

router.get('/admin', requireAuth, async (req, res, next) => {
  try {
    const contracts = await prisma.contract.findMany({
      orderBy: { createdAt: 'desc' },
      include: { template: { select: { name: true } }, booking: { select: { clientName: true, clientEmail: true } } },
    });
    res.json(contracts);
  } catch (e) { next(e); }
});

// ── Public: signing ───────────────────────────────────────────────────────────

// GET /api/contracts/sign/:token
router.get('/sign/:token', async (req, res, next) => {
  try {
    const contract = await prisma.contract.findUnique({ where: { token: req.params.token } });
    if (!contract) return res.status(404).json({ error: 'Contract not found.' });
    if (contract.signedAt) return res.status(410).json({ error: 'This contract has already been signed.' });
    if (new Date() > contract.expiresAt) return res.status(410).json({ error: 'This signing link has expired.' });
    // Return only what the signing page needs (no signature data)
    res.json({
      id: contract.id,
      renderedBody: contract.renderedBody,
      expiresAt: contract.expiresAt,
    });
  } catch (e) { next(e); }
});

// GET /api/contracts/sign/:token/pdf — download the signed contract PDF.
// Regenerated from the contract record on every request; only available once signed.
router.get('/sign/:token/pdf', async (req, res, next) => {
  try {
    const contract = await prisma.contract.findUnique({ where: { token: req.params.token } });
    if (!contract || !contract.signedAt) {
      return res.status(404).json({ error: 'Signed contract not found.' });
    }
    const pdfBuffer = await generateContractPdf(contract);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="agreement-${(contract.signerName || 'signed').replace(/[^a-z0-9 _-]/gi, '')}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (e) { next(e); }
});

// POST /api/contracts/sign/:token — submit signature + client details
router.post('/sign/:token', async (req, res, next) => {
  try {
    const { signerName, signatureData, intake } = req.body;
    if (!signerName || !signatureData) {
      return res.status(400).json({ error: 'Name and signature are required.' });
    }

    // Client-filled details (parent/guardian contact, participants, model release)
    const clean = (v, max) => String(v ?? '').trim().slice(0, max);
    const intakeData = {
      guardianName: clean(intake?.guardianName, 120),
      phone: clean(intake?.phone, 40),
      email: clean(intake?.email, 160),
      address: clean(intake?.address, 240),
      participants: clean(intake?.participants, 1000),
      modelRelease: intake?.modelRelease === true,
    };
    const missing = ['guardianName', 'phone', 'email', 'address', 'participants'].filter(
      (k) => !intakeData[k]
    );
    if (missing.length > 0) {
      return res.status(400).json({ error: 'Please fill in all of your details before signing.' });
    }
    if (typeof intake?.modelRelease !== 'boolean') {
      return res.status(400).json({ error: 'Please choose a model release option.' });
    }

    const contract = await prisma.contract.findUnique({
      where: { token: req.params.token },
      include: { booking: { include: { service: true } } },
    });
    if (!contract) return res.status(404).json({ error: 'Contract not found.' });
    if (contract.signedAt) return res.status(410).json({ error: 'Already signed.' });
    if (new Date() > contract.expiresAt) return res.status(410).json({ error: 'Link expired.' });

    const signerIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;

    const signed = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        signedAt: new Date(),
        signerName,
        signatureData,
        signerIp,
        intakeData,
      },
    });

    // The signed PDF is generated on demand by GET /sign/:token/pdf — no file
    // storage needed (Cloudinary restricts public raw/PDF delivery).
    const pdfUrl = `${BASE_URL}/api/contracts/sign/${contract.token}/pdf`;
    await prisma.contract.update({ where: { id: contract.id }, data: { pdfUrl } });

    // Email confirmation to client — booking email, or the one they just gave us
    const clientEmail = contract.booking?.clientEmail || intakeData.email;
    const clientName = signerName;
    if (clientEmail) {
      sendMail({
        to: clientEmail,
        subject: `Contract signed — Alissa McDonald Photography`,
        text: `Hi ${clientName},\n\nThank you for signing your photography contract. You're all set!\n\nI look forward to seeing you at your session.\n— Alissa`,
        html: `<p>Hi ${clientName},</p><p>Thank you for signing your photography contract. You're all set!</p>${pdfUrl ? `<p><a href="${pdfUrl}">Download your signed contract (PDF) →</a></p>` : ''}<p>I look forward to seeing you at your session.<br>— Alissa</p>`,
      }).catch(console.error);
    }

    // Email admin — signed contract with the client's details at a glance
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendMail({
        to: adminEmail,
        replyTo: intakeData.email ? `${signerName} <${intakeData.email}>` : undefined,
        subject: `Contract signed: ${signerName} ✓`,
        text:
          `${signerName} just signed their contract.\n\n` +
          `Phone: ${intakeData.phone}\nEmail: ${intakeData.email}\nAddress: ${intakeData.address}\n` +
          `Participants:\n${intakeData.participants}\n\n` +
          `Model release: ${intakeData.modelRelease ? 'GRANTED' : 'DECLINED'}\n\n` +
          (pdfUrl ? `Signed PDF: ${pdfUrl}` : ''),
        html:
          `<p><strong>${signerName}</strong> just signed their contract.</p>` +
          `<p>Phone: ${intakeData.phone}<br>Email: ${intakeData.email}<br>Address: ${intakeData.address}</p>` +
          `<p><strong>Participants:</strong><br>${String(intakeData.participants).replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>` +
          `<p><strong>Model release:</strong> ${intakeData.modelRelease ? '✅ GRANTED' : '❌ DECLINED'}</p>` +
          (pdfUrl ? `<p><a href="${pdfUrl}">Download the signed PDF →</a></p>` : ''),
      }).catch(console.error);
    }

    res.json({ ok: true, pdfUrl });
  } catch (e) { next(e); }
});

module.exports = router;
