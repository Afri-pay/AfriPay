import { getAllowedOrigins, LOCAL_ORIGINS, PRODUCTION_ORIGIN } from './cors';

describe('CORS configuration', () => {
  it('allows the production frontend and local development origins', () => {
    const origins = getAllowedOrigins('https://custom.example.test/');
    expect(origins).toEqual(expect.arrayContaining([PRODUCTION_ORIGIN, ...LOCAL_ORIGINS, 'https://custom.example.test']));
  });

  it('does not allow an unknown origin', () => {
    expect(getAllowedOrigins()).not.toContain('https://malicious.example.test');
  });
});
