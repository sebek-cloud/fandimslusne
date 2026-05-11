// DOČASNÝ debug endpoint pro ověření Ecomail API.
// Po vyřešení smazat.

const ECOMAIL_API_KEY = process.env.ECOMAIL_API_KEY;
const ECOMAIL_LIST_ID = process.env.ECOMAIL_LIST_ID;

const TARGETS = [
  'https://server.ecomailapp.cz/api/v2/lists',
  'https://server.ecomailapp.cz/lists',
  'https://server.ecomailapp.cz/api/lists',
];

async function probe(url) {
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: { key: ECOMAIL_API_KEY, 'Content-Type': 'application/json' },
    });
    const ct = r.headers.get('content-type') || '';
    const text = await r.text();
    return {
      url,
      status: r.status,
      contentType: ct,
      bodyPreview: text.slice(0, 600),
      isJson: ct.includes('application/json'),
    };
  } catch (err) {
    return { url, error: String(err) };
  }
}

export default async function handler(req, res) {
  if (!ECOMAIL_API_KEY) {
    return res.status(500).json({ error: 'Missing ECOMAIL_API_KEY' });
  }

  const results = [];
  for (const u of TARGETS) {
    results.push(await probe(u));
  }

  return res.status(200).json({
    keyPrefix: ECOMAIL_API_KEY ? ECOMAIL_API_KEY.slice(0, 6) + '...' : null,
    keyLength: ECOMAIL_API_KEY ? ECOMAIL_API_KEY.length : 0,
    configuredListId: ECOMAIL_LIST_ID,
    probes: results,
  });
}
