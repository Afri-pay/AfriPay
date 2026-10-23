import { BadRequestException, ConflictException } from '@nestjs/common';
import { Keypair } from '@stellar/stellar-sdk';
import { PaymentIntentService } from './payment-intent.service';

describe('PaymentIntentService', () => {
  it('returns the original intent for a repeated idempotency key', async () => {
    const service = new PaymentIntentService();
    const input = { idempotencyKey: 'checkout-1', sender: Keypair.random().publicKey(), recipient: Keypair.random().publicKey(), amount: '2.5', asset: 'XLM' };
    const [first, second] = await Promise.all([service.create(input), service.create(input)]);
    expect(second).toEqual(first);
    expect(await service.list()).toHaveLength(1);
    await expect(service.create({ ...input, amount: '3' })).rejects.toThrow(ConflictException);
  });

  it('rejects invalid amount and self-payment', async () => {
    const service = new PaymentIntentService();
    await expect(service.create({ idempotencyKey: 'bad-amount', sender: 'a', recipient: 'b', amount: '0', asset: 'XLM' })).rejects.toThrow(BadRequestException);
    const sender = Keypair.random().publicKey();
    await expect(service.create({ idempotencyKey: 'self', sender, recipient: sender, amount: '1', asset: 'XLM' })).rejects.toThrow(BadRequestException);
  });
});
