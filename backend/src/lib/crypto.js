// Symmetric encryption for each admin's own mailbox password at rest.
// Keyed off JWT_SECRET (already a server-only secret) rather than a new
// env var — this app's threat model is "don't leave IMAP passwords sitting
// in the database in plaintext," not defense against a fully compromised
// server, so reusing the existing secret is an acceptable tradeoff here.

const crypto = require('crypto');
const { JWT_SECRET } = require('../middleware/auth');

const KEY = crypto.createHash('sha256').update(JWT_SECRET).digest();

function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}

function decrypt(encoded) {
  const buf = Buffer.from(encoded, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
