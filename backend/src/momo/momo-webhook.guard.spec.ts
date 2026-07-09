import { verifyWebhookToken, assertWebhookToken } from './momo-webhook.guard';

describe('momo-webhook.guard', () => {
  afterEach(() => {
    delete process.env.MTN_MOMO_WEBHOOK_TOKEN;
  });

  it('allows any request when no webhook token is configured', () => {
    expect(verifyWebhookToken(undefined)).toBe(true);
    expect(verifyWebhookToken('anything')).toBe(true);
  });

  it('rejects a missing token when one is configured', () => {
    process.env.MTN_MOMO_WEBHOOK_TOKEN = 'secret';
    expect(verifyWebhookToken(undefined)).toBe(false);
  });

  it('rejects a mismatched token', () => {
    process.env.MTN_MOMO_WEBHOOK_TOKEN = 'secret';
    expect(verifyWebhookToken('not-secret')).toBe(false);
  });

  it('accepts a matching token', () => {
    process.env.MTN_MOMO_WEBHOOK_TOKEN = 'secret';
    expect(verifyWebhookToken('secret')).toBe(true);
  });

  it('assertWebhookToken throws for an invalid token', () => {
    process.env.MTN_MOMO_WEBHOOK_TOKEN = 'secret';
    expect(() => assertWebhookToken('nope')).toThrow();
  });

  it('assertWebhookToken does not throw for a valid token', () => {
    process.env.MTN_MOMO_WEBHOOK_TOKEN = 'secret';
    expect(() => assertWebhookToken('secret')).not.toThrow();
  });
});
