import { getApiUrl, LOCAL_API_URL } from './api';

describe('API URL configuration', () => {
  it('uses the documented local backend port when unset', () => expect(getApiUrl('')).toBe(`${LOCAL_API_URL}`));
  it('removes trailing slashes', () => expect(getApiUrl('https://api.example.test///')).toBe('https://api.example.test'));
  it('rejects invalid URLs', () => expect(() => getApiUrl('not a url')).toThrow(/Invalid NEXT_PUBLIC_API_URL/));
  it('rejects localhost in production', () => expect(() => getApiUrl('http://localhost:3101', 'production')).toThrow(/cannot point to localhost/));
  it('requires an API URL in production', () => expect(() => getApiUrl('', 'production')).toThrow(/not configured/));
  it('accepts a public production API URL', () => expect(getApiUrl('https://api.example.test/', 'production')).toBe('https://api.example.test'));
});
