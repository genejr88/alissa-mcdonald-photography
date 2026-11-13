// Thin wrapper around ImapFlow for the admin inbox view. Opens a fresh
// connection per call and closes it — this is a low-traffic, single-user
// admin tool, not a long-lived mail server, so there's no connection pool
// to manage and nothing to leak if the process restarts mid-request.

const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const sanitizeHtml = require('sanitize-html');

const PAGE_SIZE = 25;

function isConfigured() {
  return !!(process.env.IMAP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function withClient(fn) {
  if (!isConfigured()) {
    throw new Error('Mailbox is not configured — set IMAP_HOST, SMTP_USER, SMTP_PASS.');
  }
  const client = new ImapFlow({
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    logger: false,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.logout().catch(() => client.close());
  }
}

// imapflow's envelope.from is a plain array of {name, address} — distinct
// from mailparser's AddressObject (which has a pre-built .text string).
function formatEnvelopeAddress(list) {
  if (!list?.length) return null;
  const { name, address } = list[0];
  return name ? `${name} <${address}>` : address;
}

// GET a page of messages, most recent first — envelope data only (fast).
async function listMessages({ folder = 'INBOX', page = 1 } = {}) {
  return withClient(async (client) => {
    const mailbox = await client.mailboxOpen(folder);
    const total = mailbox.exists;
    if (total === 0) return { messages: [], total: 0, page, pageSize: PAGE_SIZE };

    const end = total - (page - 1) * PAGE_SIZE;
    const start = Math.max(1, end - PAGE_SIZE + 1);
    if (end < 1) return { messages: [], total, page, pageSize: PAGE_SIZE };

    const messages = [];
    for await (const msg of client.fetch(`${start}:${end}`, { envelope: true, flags: true, uid: true })) {
      messages.push({
        uid: msg.uid,
        from: formatEnvelopeAddress(msg.envelope?.from),
        subject: msg.envelope?.subject || '(no subject)',
        date: msg.envelope?.date || null,
        seen: msg.flags?.has('\\Seen') || false,
      });
    }
    messages.reverse(); // newest first
    return { messages, total, page, pageSize: PAGE_SIZE };
  });
}

// GET one full message, parsed and sanitized.
async function getMessage({ folder = 'INBOX', uid }) {
  return withClient(async (client) => {
    await client.mailboxOpen(folder);
    const { content } = await client.download(uid, undefined, { uid: true });
    const parsed = await simpleParser(content);

    const html = parsed.html
      ? sanitizeHtml(parsed.html, {
          allowedTags: sanitizeHtml.defaults.allowedTags.filter((t) => t !== 'script' && t !== 'style'),
          allowedAttributes: { '*': ['style', 'href', 'src', 'alt', 'title'] },
          allowedSchemes: ['http', 'https', 'mailto', 'cid'],
        })
      : null;

    return {
      uid,
      from: parsed.from?.text || null,
      to: parsed.to?.text || null,
      subject: parsed.subject || '(no subject)',
      date: parsed.date || null,
      text: parsed.text || null,
      html,
      attachments: (parsed.attachments || []).map((a) => ({
        filename: a.filename,
        size: a.size,
        contentType: a.contentType,
      })),
    };
  });
}

// Search subject+from+body in one pass (IMAP TEXT searches header and body),
// paginated the same shape as listMessages so the frontend can reuse it.
async function searchMessages({ folder = 'INBOX', query, page = 1 } = {}) {
  return withClient(async (client) => {
    await client.mailboxOpen(folder);
    const uids = await client.search({ text: query }, { uid: true });
    if (!uids || uids.length === 0) return { messages: [], total: 0, page, pageSize: PAGE_SIZE };

    const sorted = [...uids].sort((a, b) => b - a); // newest (highest UID) first
    const total = sorted.length;
    const start = (page - 1) * PAGE_SIZE;
    const pageUids = sorted.slice(start, start + PAGE_SIZE);
    if (pageUids.length === 0) return { messages: [], total, page, pageSize: PAGE_SIZE };

    const byUid = new Map();
    for await (const msg of client.fetch(pageUids, { envelope: true, flags: true, uid: true }, { uid: true })) {
      byUid.set(msg.uid, msg);
    }
    const messages = pageUids
      .map((uid) => byUid.get(uid))
      .filter(Boolean)
      .map((msg) => ({
        uid: msg.uid,
        from: formatEnvelopeAddress(msg.envelope?.from),
        subject: msg.envelope?.subject || '(no subject)',
        date: msg.envelope?.date || null,
        seen: msg.flags?.has('\\Seen') || false,
      }));
    return { messages, total, page, pageSize: PAGE_SIZE };
  });
}

// One specific attachment's raw content, for download — re-fetches and
// re-parses the message rather than caching, same stateless-per-call shape
// as everything else here.
async function getAttachment({ folder = 'INBOX', uid, index }) {
  return withClient(async (client) => {
    await client.mailboxOpen(folder);
    const { content } = await client.download(uid, undefined, { uid: true });
    const parsed = await simpleParser(content);
    const attachment = (parsed.attachments || [])[index];
    if (!attachment) throw new Error('Attachment not found.');
    return {
      filename: attachment.filename || `attachment-${index}`,
      contentType: attachment.contentType || 'application/octet-stream',
      content: attachment.content,
    };
  });
}

async function setSeen({ folder = 'INBOX', uid, seen }) {
  return withClient(async (client) => {
    await client.mailboxOpen(folder);
    if (seen) {
      await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
    } else {
      await client.messageFlagsRemove(String(uid), ['\\Seen'], { uid: true });
    }
    return { ok: true };
  });
}

module.exports = { isConfigured, listMessages, searchMessages, getMessage, getAttachment, setSeen };
