import { getApiUrl, LOCAL_API_URL } from './api';

describe('API URL configuration', () => {
  it('uses the documented local backend port when unset', () => expect(getApiUrl('')).toBe(`${LOCAL_API_URL}`));
  it('removes trailing slashes', () => expect(getApiUrl('https://api.example.test///')).toBe('https://api.example.test'));
  it('rejects invalid URLs', () => expect(() => getApiUrl('not a url')).toThrow(/Invalid NEXT_PUBLIC_API_URL/));
});
