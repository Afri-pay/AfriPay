import { Account, Asset, Keypair, Memo, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { signTransactionXdr } from './stellar';

describe('reviewed native payment signing', () => {
  const sender = Keypair.random();
  const recipient = Keypair.random().publicKey();
  const review = { recipient, amount: '2.5', memo: 'invoice', fee: '100' };
  function build(options: { recipient?: string; amount?: string; memo?: string; fee?: string; extra?: boolean; source?: string; timeout?: number } = {}) {
    let builder = new TransactionBuilder(new Account(sender.publicKey(), '1'), { fee: options.fee ?? '100', networkPassphrase: Networks.TESTNET })
      .addOperation(Operation.payment({ destination: options.recipient ?? recipient, amount: options.amount ?? '2.5', asset: Asset.native(), source: options.source }));
    if (options.extra) builder = builder.addOperation(Operation.manageData({ name: 'unreviewed', value: 'data' }));
    return builder.addMemo(Memo.text(options.memo ?? 'invoice')).setTimeout(options.timeout ?? 300).build().toXDR();
  }
  it('signs only the reviewed payment locally', () => {
    const tx = TransactionBuilder.fromXDR(signTransactionXdr(sender.secret(), build(), review), Networks.TESTNET);
    expect(tx.signatures).toHaveLength(1);
    expect(sender.verify(tx.hash(), tx.signatures[0].signature)).toBe(true);
  });
  it.each([
    { recipient: Keypair.random().publicKey() }, { amount: '3' }, { memo: 'different' },
    { fee: '200' }, { extra: true }, { source: sender.publicKey() }, { timeout: 0 },
  ])('rejects unreviewed changes %j', (options) => {
    expect(() => signTransactionXdr(sender.secret(), build(options), review)).toThrow();
  });
});
