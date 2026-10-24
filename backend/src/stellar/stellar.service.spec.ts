import { BadRequestException } from '@nestjs/common';
import { Account, Asset, Keypair, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { StellarService } from './stellar.service';
import { parsePayment, stroops } from './payment-validation';

describe('Stellar payment verification', () => {
  const sender = Keypair.random();
  const recipient = Keypair.random().publicKey();
  const input = { sender: sender.publicKey(), recipient, amount: '2', asset: 'XLM' };
  const build = (destination = recipient) => {
    const tx = new TransactionBuilder(new Account(sender.publicKey(), '1'), { fee: '100', networkPassphrase: Networks.TESTNET })
      .addOperation(Operation.payment({ destination, asset: Asset.native(), amount: '2' })).setTimeout(300).build();
    tx.sign(sender);
    return tx;
  };
  it('compares all intent fields rather than only the source', () => {
    expect(parsePayment(build().toXDR(), input).source).toBe(sender.publicKey());
    expect(() => parsePayment(build(Keypair.random().publicKey()).toXDR(), input)).toThrow(BadRequestException);
    expect(() => parsePayment(build().toXDR(), { ...input, amount: '3' })).toThrow(BadRequestException);
    expect(stroops('1.0000001')).toBe(BigInt(10000001));
    const unsigned = new TransactionBuilder(new Account(sender.publicKey(), '1'), { fee: '100', networkPassphrase: Networks.TESTNET }).addOperation(Operation.payment({ destination: recipient, asset: Asset.native(), amount: '2' })).setTimeout(300).build();
    expect(() => parsePayment(unsigned.toXDR(), input)).toThrow('signature');
    const mainnet = new TransactionBuilder(new Account(sender.publicKey(), '1'), { fee: '100', networkPassphrase: Networks.PUBLIC }).addOperation(Operation.payment({ destination: recipient, asset: Asset.native(), amount: '2' })).setTimeout(300).build();
    mainnet.sign(sender);
    expect(() => parsePayment(mainnet.toXDR(), input)).toThrow('signature');
  });
  it.each([true, false])('requires independently queried ledger inclusion, success=%s', async (successful) => {
    const service = new StellarService();
    const tx = build();
    const hash = Buffer.from(tx.hash()).toString('hex');
    const call = jest.fn().mockResolvedValue({ hash, ledger: 123, successful });
    const server = { submitTransaction: jest.fn().mockResolvedValue({ hash }), transactions: () => ({ transaction: () => ({ call }) }) };
    Object.assign(service, { server });
    const result = await service.submitSignedTransaction(tx.toXDR(), input.sender, input);
    expect(result.status).toBe(successful ? 'SUCCEEDED' : 'FAILED');
    expect(call).toHaveBeenCalledTimes(1);
  });
  it('keeps timed out or missing transactions pending', async () => {
    const service = new StellarService();
    Object.assign(service, { server: { submitTransaction: jest.fn().mockRejectedValue(new Error('timeout')), transactions: () => ({ transaction: () => ({ call: jest.fn().mockRejectedValue(new Error('not indexed')) }) }) } });
    expect((await service.submitSignedTransaction(build().toXDR(), input.sender, input)).status).toBe('PENDING');
  });
  it('refuses Mainnet configuration', async () => {
    const previous = process.env.STELLAR_NETWORK;
    process.env.STELLAR_NETWORK = 'mainnet';
    try { await expect(new StellarService().verifyTransaction('a'.repeat(64))).rejects.toThrow(BadRequestException); }
    finally { if (previous === undefined) delete process.env.STELLAR_NETWORK; else process.env.STELLAR_NETWORK = previous; }
  });
});
