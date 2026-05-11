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

  try {
    await redis.set('signatures', BASE_COUNT);
    await redis.del('signed_emails');
    return res.status(200).json({ ok: true, count: BASE_COUNT, signedEmailsCleared: true });
  } catch (err) {
    return res.status(500).json({ error: String(err).slice(0, 300) });
  }
}
