import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.fandimslusne_counter_KV_REST_API_URL,
  token: process.env.fandimslusne_counter_KV_REST_API_TOKEN,
});

export const BASE_COUNT = parseInt(process.env.COUNT_BASE || '2137', 10);
