const router = require('express').Router();
const express = require('express');
const prisma = require('../lib/prisma');
const square = require('../lib/square');
const { sendMail } = require('../lib/mailer');

const BASE_URL = process.env.SITE_URL || 'https://alissamcdonaldphotography.com';
const NOTIFICATION_URL = `${BASE_URL}/api/square/webhook`;

// Square signs the webhook over the exact raw request bytes, so this route
// parses the body itself (express.raw) instead of the app-wide JSON parser —
// it must be mounted in index.js BEFORE app.use(express.json()).
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const rawBody = req.body.toString('utf8');
    const signatureHeader = req.headers['x-square-hmacsha256-signature'];

    if (!square.verifyWebhookSignature({ rawBody, signatureHeader, notificationUrl: NOTIFICATION_URL })) {
      console.error('[square] webhook signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody);

    if (event.type === 'payment.updated') {
      const payment = event.data?.object?.payment;
      if (payment?.status === 'COMPLETED' && payment.order_id) {
        // Re-fetch the payment from Square rather than trusting the webhook
        // body's status alone — belt and suspenders against a replayed or
        // stale event.
        const confirmed = await square.getPayment(payment.id);
        if (confirmed?.status === 'COMPLETED') {
          const booking = await prisma.booking.findUnique({
            where: { squareOrderId: payment.order_id },
            include: { service: true },
          });
          if (booking && !booking.depositPaid) {
            await prisma.booking.update({
              where: { id: booking.id },
              data: { depositPaid: true, squarePaymentId: payment.id },
            });

            // amount_money.amount is in cents, straight from Square's own
            // record of what was actually paid — not whatever the service's
            // preset deposit happens to be, since a contract-sent link can
            // use a different amount.
            await prisma.payment.create({
              data: {
                bookingId: booking.id,
                type: 'DEPOSIT',
                method: 'SQUARE',
                amount: (confirmed.amount_money?.amount || 0) / 100,
                squarePaymentId: payment.id,
                note: 'Paid via Square',
              },
            }).catch((e) => console.error('[payments] could not log Square deposit:', e.message));

            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
              sendMail({
                to: adminEmail,
                subject: `Deposit paid: ${booking.clientName} — ${booking.service.name}`,
                text: `${booking.clientName} just paid their deposit for ${booking.service.name} via Square.`,
              }).catch(console.error);
            }
          }
        }
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('[square] webhook error:', e);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
