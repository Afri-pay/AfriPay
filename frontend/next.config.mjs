import path from 'node:path';
import { fileURLToPath } from 'node:url';
/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  reactStrictMode: true,
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ] }];
  },
};

export default nextConfig;
