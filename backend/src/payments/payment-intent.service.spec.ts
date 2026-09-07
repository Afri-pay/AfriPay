import { ConflictException } from '@nestjs/common';
import { PaymentIntentService } from './payment-intent.service';

describe('PaymentIntentService', () => {
  it('returns the original intent for a repeated idempotency key', () => {
    const service = new PaymentIntentService();
    const input = { idempotencyKey: 'checkout-1', sender: 'Gsender', recipient: 'Grecipient', amount: '2.5', asset: 'XLM' };
    const first = service.create(input);
    const second = service.create(input);
    expect(second).toEqual(first);
    expect(service.list()).toHaveLength(1);
  });

  it('rejects invalid amount and self-payment', () => {
    const service = new PaymentIntentService();
    expect(() => service.create({ idempotencyKey: 'bad-amount', sender: 'a', recipient: 'b', amount: '0', asset: 'XLM' })).toThrow(ConflictException);
    expect(() => service.create({ idempotencyKey: 'self', sender: 'a', recipient: 'a', amount: '1', asset: 'XLM' })).toThrow(ConflictException);
  });
});
