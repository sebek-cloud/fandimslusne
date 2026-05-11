import { redis, BASE_COUNT } from './_redis.js';

export default async function handler(req, res) {
  try {
    let count = await redis.get('signatures');
    if (count === null || count === undefined) {
      await redis.set('signatures', BASE_COUNT);
      count = BASE_COUNT;
    }
    res.setHeader('Cache-Control', 'public, max-age=5, s-maxage=5');
    return res.status(200).json({ count: typeof count === 'number' ? count : parseInt(count, 10) || BASE_COUNT });
  } catch (err) {
    console.error('count handler error', err);
    return res.status(200).json({ count: BASE_COUNT });
  }
}
