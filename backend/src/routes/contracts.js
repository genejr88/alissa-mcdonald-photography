const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { sendMail } = require('../lib/mailer');
const { generateContractPdf } = require('../lib/generateContractPdf');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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

// POST /api/contracts/sign/:token — submit signature
router.post('/sign/:token', async (req, res, next) => {
  try {
    const { signerName, signatureData } = req.body;
    if (!signerName || !signatureData) {
      return res.status(400).json({ error: 'Name and signature are required.' });
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
      },
    });

    // Generate PDF in background
    let pdfUrl = null;
    try {
      const pdfBuffer = await generateContractPdf(signed);
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            folder: 'amp-contracts',
            public_id: `contract-${contract.id}`,
            format: 'pdf',
          },
          (err, result) => { if (err) reject(err); else resolve(result); }
        ).end(pdfBuffer);
      });
      pdfUrl = upload.secure_url;
      await prisma.contract.update({ where: { id: contract.id }, data: { pdfUrl } });
    } catch (pdfErr) {
      console.error('PDF generation error:', pdfErr);
    }

    // Email confirmation to client (if we have their email from the booking)
    const clientEmail = contract.booking?.clientEmail;
    const clientName = signerName;
    if (clientEmail) {
      sendMail({
        to: clientEmail,
        subject: `Contract signed — Alissa McDonald Photography`,
        text: `Hi ${clientName},\n\nThank you for signing your photography contract. You're all set!\n\nI look forward to seeing you at your session.\n— Alissa`,
        html: `<p>Hi ${clientName},</p><p>Thank you for signing your photography contract. You're all set!</p>${pdfUrl ? `<p><a href="${pdfUrl}">Download your signed contract (PDF) →</a></p>` : ''}<p>I look forward to seeing you at your session.<br>— Alissa</p>`,
      }).catch(console.error);
    }

    // Email admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendMail({
        to: adminEmail,
        subject: `Contract signed: ${signerName}`,
        text: `${signerName} has signed their contract.\n${pdfUrl ? `PDF: ${pdfUrl}` : ''}`,
      }).catch(console.error);
    }

    res.json({ ok: true, pdfUrl });
  } catch (e) { next(e); }
});

module.exports = router;
