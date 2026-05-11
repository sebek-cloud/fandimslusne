// DOČASNÝ debug endpoint. Po vyřešení smazat.
const ECOMAIL_API_KEY = process.env.ECOMAIL_API_KEY;
const ECOMAIL_LIST_ID = process.env.ECOMAIL_LIST_ID;

const URLS = [
  'https://server.ecomailapp.cz/api/v2/lists',
  'https://server.ecomailapp.cz/api/lists',
  'https://api2.ecomailapp.cz/lists',
  'https://api2.ecomailapp.cz/v2/lists',
  'https://api.ecomailapp.cz/lists',
  'https://api.ecomailapp.cz/v2/lists',
  'https://app.ecomailapp.cz/api/v2/lists',
  'https://api.ecomail.app/v2/lists',
];

const AUTH_VARIANTS = [
  { name: 'key', headers: { key: ECOMAIL_API_KEY } },
  { name: 'Authorization-Bearer', headers: { Authorization: `Bearer ${ECOMAIL_API_KEY}` } },
  { name: 'X-Api-Key', headers: { 'X-Api-Key': ECOMAIL_API_KEY } },
];

async function probe(url, authName, headers, timeoutMs = 4000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'fandimslusne-debug/1.0',
      },
      signal: ctrl.signal,
    });
    const ct = r.headers.get('content-type') || '';
    const text = await r.text();
    return {
      url,
      auth: authName,
      status: r.status,
      contentType: ct,
      isJson: ct.includes('application/json'),
      bodyPreview: text.slice(0, 250),
    };
  } catch (err) {
    return { url, auth: authName, error: String(err).slice(0, 150) };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (!ECOMAIL_API_KEY) {
    return res.status(500).json({ error: 'Missing ECOMAIL_API_KEY' });
  }

  const which = (req.query?.auth || 'key').toLowerCase();
  const variants =
    which === 'all'
      ? AUTH_VARIANTS
      : which === 'bearer'
      ? AUTH_VARIANTS.filter((v) => v.name === 'Authorization-Bearer')
      : which === 'xapi'
      ? AUTH_VARIANTS.filter((v) => v.name === 'X-Api-Key')
      : AUTH_VARIANTS.filter((v) => v.name === 'key');

  // Spustit všechny probes paralelně
  const tasks = [];
  for (const variant of variants) {
    for (const u of URLS) {
      tasks.push(probe(u, variant.name, variant.headers));
    }
  }
  const results = await Promise.all(tasks);

  const interesting = results.filter(
    (r) => r.isJson || (r.status && r.status !== 404 && r.status !== 405)
  );

  return res.status(200).json({
    keyPrefix: ECOMAIL_API_KEY ? ECOMAIL_API_KEY.slice(0, 6) + '...' : null,
    keySuffix: ECOMAIL_API_KEY ? '...' + ECOMAIL_API_KEY.slice(-4) : null,
    keyLength: ECOMAIL_API_KEY ? ECOMAIL_API_KEY.length : 0,
    configuredListId: ECOMAIL_LIST_ID,
    authVariantTested: which,
    totalProbes: results.length,
    interesting,
    all: results,
  });
}
