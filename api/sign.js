import { redis, BASE_COUNT } from './_redis.js';

const ECOMAIL_API_KEY = process.env.ECOMAIL_API_KEY;
const ECOMAIL_LIST_ID = process.env.ECOMAIL_LIST_ID;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Env var sanity check
  if (!ECOMAIL_API_KEY || !ECOMAIL_LIST_ID) {
    console.error('Missing env vars', {
      hasKey: !!ECOMAIL_API_KEY,
      hasList: !!ECOMAIL_LIST_ID,
    });
    return res.status(500).json({
      error: 'Server config error.',
      _debug: {
        hasKey: !!ECOMAIL_API_KEY,
        hasList: !!ECOMAIL_LIST_ID,
      },
    });
  }

  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const city = typeof body.city === 'string' ? body.city.trim().slice(0, 100) : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';

  if (!name) return res.status(400).json({ error: 'Jméno je povinné.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Neplatný e-mail.' });

  const parts = name.split(/\s+/);
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : name;
  const surname = parts.length > 1 ? parts[parts.length - 1] : '';

  try {
    const already = await redis.sismember('signed_emails', email);
    if (already) {
      const c = await redis.get('signatures');
      return res.status(200).json({
        count: typeof c === 'number' ? c : (parseInt(c, 10) || BASE_COUNT),
        alreadySigned: true,
      });
    }

    const ecomailUrl = `https://server.ecomailapp.cz/api/v2/lists/${ECOMAIL_LIST_ID}/subscribe`;
    const ecomailPayload = {
      subscriber_data: {
        email,
        name: firstName,
        surname,
        city,
        custom_fields: { message },
      },
      update_existing: true,
      skip_confirmation: true,
    };

    const ecomailRes = await fetch(ecomailUrl, {
      method: 'POST',
      headers: {
        key: ECOMAIL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ecomailPayload),
    });

    if (!ecomailRes.ok) {
      const text = await ecomailRes.text().catch(() => '');
      console.error('Ecomail error', ecomailRes.status, text);
      return res.status(502).json({
        error: 'Nepodařilo se uložit podpis. Zkuste to prosím za chvíli.',
        _debug: {
          url: ecomailUrl,
          status: ecomailRes.status,
          body: text.slice(0, 500),
        },
      });
    }

    await redis.sadd('signed_emails', email);
    const exists = await redis.exists('signatures');
    if (!exists) await redis.set('signatures', BASE_COUNT);
    const newCount = await redis.incr('signatures');

    return res.status(200).json({ count: Number(newCount) });
  } catch (err) {
    console.error('sign handler error', err);
    return res.status(500).json({ error: 'Server error.', _debug: String(err).slice(0, 500) });
  }
}
