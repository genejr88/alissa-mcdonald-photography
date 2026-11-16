const nodemailer = require('nodemailer');
const MailComposer = require('nodemailer/lib/mail-composer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // Explicit timeouts so a stalled connection fails with a clear error
    // instead of hanging the request indefinitely.
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });
  return transporter;
}

function buildRawMessage(mail) {
  return new Promise((resolve, reject) => {
    new MailComposer(mail).compile().build((err, message) => {
      if (err) reject(err);
      else resolve(message);
    });
  });
}

// Resend is an HTTPS API, not SMTP — it works around Railway blocking
// outbound SMTP on both 587 and 465 (confirmed via deployment logs).
async function sendViaResend(mail) {
  const body = {
    from: mail.from,
    to: [].concat(mail.to),
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  };
  if (mail.cc) body.cc = [].concat(mail.cc);
  if (mail.replyTo) body.reply_to = mail.replyTo;
  if (mail.attachments?.length) {
    body.attachments = mail.attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content,
    }));
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Resend API error (${res.status}): ${errText}`);
  }
}

// Resend sends over HTTPS, so the IMAP mailbox (Zoho) never sees the
// message go out — append a copy into its Sent folder so the admin Mail
// page's Sent tab stays accurate. Best-effort: a sync failure shouldn't
// fail the send itself, since the email already went out.
async function saveToSent(mail) {
  try {
    const mailbox = require('./mailbox');
    if (!mailbox.isConfigured()) return;
    const raw = await buildRawMessage(mail);
    await mailbox.appendMessage({ folder: mailbox.SENT_FOLDER, raw, flags: ['\\Seen'] });
  } catch (e) {
    console.error('[mail] could not save sent copy to Zoho Sent folder:', e.message);
  }
}

async function sendMail({ to, cc, subject, text, html, replyTo, attachments }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const mail = { from, to, cc, subject, text, html: html || text, replyTo, attachments };

  if (process.env.RESEND_API_KEY) {
    await sendViaResend(mail);
    await saveToSent(mail);
    return;
  }

  const t = getTransporter();
  if (!t) {
    console.log(`[MAIL skipped — no SMTP/Resend] To: ${to}\nSubject: ${subject}\n${text}`);
    return;
  }
  await t.sendMail({
    from,
    to,
    subject,
    text,
    html: html || text,
    ...(cc ? { cc } : {}),
    ...(replyTo ? { replyTo } : {}),
    ...(attachments?.length ? { attachments } : {}),
  });
  await saveToSent(mail);
}

// Appends a sent copy into a SPECIFIC admin's own IMAP Sent folder, using
// their own credentials — distinct from saveToSent() above, which always
// targets the single global mailbox used for system/transactional mail.
async function saveToSentFor(mailboxConfig, mail) {
  try {
    const mailbox = require('./mailbox');
    if (!mailbox.isConfigured(mailboxConfig)) return;
    const raw = await buildRawMessage(mail);
    await mailbox.appendMessage(mailboxConfig, { folder: mailbox.SENT_FOLDER, raw, flags: ['\\Seen'] });
  } catch (e) {
    console.error('[mail] could not save sent copy to Sent folder:', e.message);
  }
}

// Used by the admin Mail page: sends as a specific admin's own mailbox
// identity (their connected address, optionally with a display name) and
// syncs the sent copy into THEIR Sent folder, not the shared one.
async function sendFromMailbox({ mailboxConfig, to, cc, subject, text, html, replyTo, attachments }) {
  const from = mailboxConfig.fromName ? `"${mailboxConfig.fromName}" <${mailboxConfig.user}>` : mailboxConfig.user;
  const mail = { from, to, cc, subject, text, html: html || text, replyTo, attachments };

  if (!process.env.RESEND_API_KEY) {
    console.log(`[MAIL skipped — no Resend configured] To: ${to}\nSubject: ${subject}\n${text}`);
    return;
  }
  await sendViaResend(mail);
  await saveToSentFor(mailboxConfig, mail);
}

module.exports = { sendMail, sendFromMailbox };
