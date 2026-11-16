// Thin wrapper around Square's Payment Links (Checkout) API and webhook
// signature verification. Deposits only — the deposit amount is collected
// via a Square-hosted checkout page, never card data on our own server.

const crypto = require('crypto');

const API_VERSION = '2026-01-22';

function baseUrl() {
  return process.env.SQUARE_ENVIRONMENT === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';
}

function isConfigured() {
  return !!(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
}

async function squareFetch(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'Square-Version': API_VERSION,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.errors?.map((e) => e.detail).join('; ') || res.statusText;
    throw new Error(`Square API error (${res.status}): ${msg}`);
  }
  return data;
}

// Creates a hosted checkout page for a booking's deposit. "Quick pay" skips
// having to build a full Order object first — Square creates one for us.
async function createDepositPaymentLink({ booking, service, redirectUrl }) {
  if (!isConfigured()) throw new Error('Square is not configured.');
  const amountCents = Math.round(Number(service.depositAmount) * 100);

  const data = await squareFetch('/v2/online-checkout/payment-links', {
    method: 'POST',
    body: {
      idempotency_key: crypto.randomUUID(),
      quick_pay: {
        name: `Deposit — ${service.name}`,
        price_money: { amount: amountCents, currency: 'USD' },
        location_id: process.env.SQUARE_LOCATION_ID,
      },
      checkout_options: { redirect_url: redirectUrl },
    },
  });

  return {
    url: data.payment_link.url,
    orderId: data.payment_link.order_id,
    paymentLinkId: data.payment_link.id,
  };
}

// GET /v2/payments/:id — used by the webhook handler to confirm a payment's
// status server-side rather than trusting the webhook payload alone.
async function getPayment(paymentId) {
  const data = await squareFetch(`/v2/payments/${paymentId}`);
  return data.payment;
}

// Square signs webhooks as base64(HMAC-SHA256(signatureKey, notificationUrl + rawBody)).
// `rawBody` must be the exact bytes Square sent — parsed/re-serialized JSON
// will not reproduce the same signature.
function verifyWebhookSignature({ rawBody, signatureHeader, notificationUrl }) {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!key || !signatureHeader) return false;
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(notificationUrl + rawBody);
  const expected = hmac.digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { isConfigured, createDepositPaymentLink, getPayment, verifyWebhookSignature };
