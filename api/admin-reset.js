import { redis, BASE_COUNT } from './_redis.js';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

export default async function handler(req, res) {
  if (!ADMIN_TOKEN) {
    return res.status(500).json({ error: 'ADMIN_TOKEN not configured' });
  }
  const token = req.query?.token;
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // ?count=N → nastav counter na N. Bez count → BASE_COUNT (default 0).
  const requestedCount = parseInt(req.query?.count, 10);
  const newCount = Number.isFinite(requestedCount) && requestedCount >= 0 ? requestedCount : BASE_COUNT;

  // ?keepEmails=1 → nemaž set signed_emails (zachová idempotence)
  const keepEmails = req.query?.keepEmails === '1';

  try {
    await redis.set('signatures', newCount);
    if (!keepEmails) await redis.del('signed_emails');
    return res.status(200).json({
      ok: true,
      count: newCount,
      signedEmailsCleared: !keepEmails,
    });
  } catch (err) {
    return res.status(500).json({ error: String(err).slice(0, 300) });
  }
}
