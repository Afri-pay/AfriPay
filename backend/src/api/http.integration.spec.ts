import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { configureHttp } from '../config/http';

describe('HTTP route policy', () => {
  let app: INestApplication;
  let base: string;
  beforeAll(async () => {
    process.env.API_KEY = 'isolated-http-test-key';
    process.env.API_RATE_LIMIT = '100';
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication({ bodyParser: false });
    configureHttp(app);
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
  });
  afterAll(async () => { await app?.close(); delete process.env.API_KEY; delete process.env.API_RATE_LIMIT; });
  it('keeps health public and protects service operations', async () => {
    expect((await fetch(`${base}/health`)).status).toBe(200);
    expect((await fetch(`${base}/rates`)).status).toBe(401);
    expect((await fetch(`${base}/rates`, { headers: { 'x-api-key': 'incorrect' } })).status).toBe(401);
    expect((await fetch(`${base}/rates`, { headers: { 'x-api-key': 'isolated-http-test-key' } })).status).toBe(400);
    expect((await fetch(`${base}/ussd`, { method: 'POST' })).status).toBe(401);
  });
  it('allows public wallet metadata without exposing the service key', async () => {
    expect((await fetch(`${base}/payments/intents`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status).toBe(400);
  });
  it('rejects oversized bodies and applies the global request limit', async () => {
    const large = await fetch(`${base}/payments/intents`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: 'x'.repeat(40000) }) });
    expect(large.status).toBe(413);
    process.env.API_RATE_LIMIT = '1';
    expect((await fetch(`${base}/health`)).status).toBe(429);
  });
});
