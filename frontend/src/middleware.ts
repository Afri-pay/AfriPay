import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const development = process.env.NODE_ENV === 'development';
  const csp = [
    "default-src 'self'",
    development ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
    `connect-src 'self' https://afripay-api-seven.vercel.app https://horizon-testnet.stellar.org https://soroban-testnet.stellar.org https://friendbot.stellar.org${development ? ' http://localhost:3101 ws://localhost:3000' : ''}`,
    "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'",
  ].join('; ');
  const headers = new Headers(request.headers);
  // Next.js reads the request CSP to attach this nonce to its runtime scripts.
  headers.set('Content-Security-Policy', csp);
  headers.set('x-nonce', nonce);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json).*)'] };
