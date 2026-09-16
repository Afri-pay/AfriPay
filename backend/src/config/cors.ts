export const LOCAL_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];
export const PRODUCTION_ORIGIN = 'https://afri-pay-beta.vercel.app';

export function getAllowedOrigins(configuredOrigin = process.env.FRONTEND_ORIGIN) {
  return Array.from(new Set([configuredOrigin?.trim().replace(/\/$/, ''), PRODUCTION_ORIGIN, ...LOCAL_ORIGINS].filter((origin): origin is string => Boolean(origin))));
}
