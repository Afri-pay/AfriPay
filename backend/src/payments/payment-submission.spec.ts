import { Account, Asset, Keypair, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { PaymentIntentService } from './payment-intent.service';
import { StellarService } from '../stellar/stellar.service';

describe('intent transaction binding', () => {
  const sender = Keypair.random();
  const recipient = Keypair.random().publicKey();
  const input = { sender: sender.publicKey(), recipient, amount: '2', asset: 'XLM', idempotencyKey: 'test' };
  function signed(sequence: string) {
    const tx = new TransactionBuilder(new Account(sender.publicKey(), sequence), { fee: '100', networkPassphrase: Networks.TESTNET }).addOperation(Operation.payment({ destination: recipient, amount: '2', asset: Asset.native() })).setTimeout(300).build();
    tx.sign(sender); return tx.toXDR();
  }
  it('retains uncertain state and rejects a second transaction for the same intent', async () => {
    const service = new PaymentIntentService();
    const intent = await service.create(input);
    const submitSignedTransaction = jest.fn().mockResolvedValue({ status: 'PENDING' });
    const verifyTransaction = jest.fn().mockResolvedValue('SUCCEEDED');
    const stellar = { submitSignedTransaction, verifyTransaction } as unknown as StellarService;
    expect((await service.submit(intent.id, signed('1'), stellar)).status).toBe('PENDING');
    await expect(service.submit(intent.id, signed('2'), stellar)).rejects.toThrow('another transaction');
    expect(submitSignedTransaction).toHaveBeenCalledTimes(1);
    expect((await service.reconcile(intent.id, stellar)).status).toBe('SUCCEEDED');
    expect((await service.reconcile(intent.id, stellar)).status).toBe('SUCCEEDED');
    expect(verifyTransaction).toHaveBeenCalledTimes(1);
  });
});
