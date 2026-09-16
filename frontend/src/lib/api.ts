export const LOCAL_API_URL = 'http://localhost:3101';

export function getApiUrl(value = process.env.NEXT_PUBLIC_API_URL, environment = process.env.NODE_ENV) {
  if (!value?.trim() && environment === 'production') throw new Error('Production API URL is not configured. Set NEXT_PUBLIC_API_URL in Vercel.');
  const candidate = (value?.trim() || LOCAL_API_URL).replace(/\/+$/, '');
  if (environment === 'production' && /^https?:\/\/localhost(?::\d+)?$/i.test(candidate)) throw new Error('Production API URL cannot point to localhost.');
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Unsupported API protocol');
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_API_URL. Use an absolute http(s) URL.');
  }
}

export class ApiError extends Error {
  constructor(message: string, readonly kind: 'configuration' | 'unavailable' | 'authentication' | 'not-found' | 'cors' | 'server', readonly status?: number) { super(message); }
}

export async function apiFetch(path: string, init?: RequestInit) {
  let baseUrl: string;
  try { baseUrl = getApiUrl(); } catch (error) { throw new ApiError(error instanceof Error ? error.message : 'Production API URL is not configured.', 'configuration'); }
  let response: Response;
  const crossOrigin = typeof window !== 'undefined' && new URL(baseUrl).origin !== window.location.origin;
  try { response = await fetch(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, init); }
  catch { throw new ApiError(crossOrigin ? 'Backend unavailable or CORS is blocking the production API. Verify NEXT_PUBLIC_API_URL and FRONTEND_ORIGIN.' : 'Backend unavailable. Start the AfriPay backend on port 3101.', crossOrigin ? 'cors' : 'unavailable'); }
  if (response.ok) return response;
  if (response.status === 401 || response.status === 403) throw new ApiError('API authentication failed. Check the configured API key.', 'authentication', response.status);
  if (response.status === 404) throw new ApiError('The requested AfriPay API route was not found.', 'not-found', response.status);
  let detail = 'AfriPay backend request failed.';
  try { const body = await response.json() as { message?: string }; if (body.message) detail = body.message; } catch { /* response may not be JSON */ }
  throw new ApiError(detail, 'server', response.status);
}
