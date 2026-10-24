// Explicit opt-in only. Creates new disposable accounts; never reads a seed from env.
if (process.env.AFRIPAY_ALLOW_TESTNET_TRANSFER !== 'yes' || !process.env.TEST_DATABASE_URL) {
  throw new Error('Requires explicit Testnet transfer authorization and an isolated TEST_DATABASE_URL');
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.STELLAR_NETWORK = 'testnet';
process.env.TS_NODE_PROJECT = require('path').join(__dirname, '../backend/tsconfig.json');
require('../backend/node_modules/ts-node/register');
const { mkdir, writeFile } = require('fs/promises');
const { join } = require('path');
const { StellarService } = require('../backend/src/stellar/stellar.service');
const { PaymentIntentStore } = require('../backend/src/payments/payment-intent.store');
const { PaymentIntentService } = require('../backend/src/payments/payment-intent.service');
const { generateKeypair, encryptWallet, decryptWallet } = require('../frontend/src/lib/wallet');
const { signTransactionXdr } = require('../frontend/src/lib/stellar');

async function main() {
  const sender = generateKeypair();
  const recipient = generateKeypair();
  const password = crypto.randomUUID() + crypto.randomUUID();
  const encrypted = await encryptWallet(sender.secret, sender.publicKey, password);
  const stellar = new StellarService();
  const store = new PaymentIntentStore();
  await store.onModuleInit();
  try {
    console.log('Funding two new disposable Testnet accounts.');
    await stellar.fundTestnet(sender.publicKey);
    await stellar.fundTestnet(recipient.publicKey);
    const payments = new PaymentIntentService(store);
    const input = { sender: sender.publicKey, recipient: recipient.publicKey, amount: '1.0000001', memo: 'AfriPay verification', asset: 'XLM', idempotencyKey: crypto.randomUUID() };
    const intent = await payments.create(input);
    const prepared = await stellar.buildNativePayment(input.sender, input.recipient, input.amount, input.memo);
    const signed = signTransactionXdr(await decryptWallet(encrypted, password), prepared.xdr, { ...input, fee: prepared.fee });
    let result = await payments.submit(intent.id, signed, stellar);
    for (let attempt = 0; result.status === 'PENDING' && attempt < 12; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      result = await payments.reconcile(intent.id, stellar);
    }
    if (result.status !== 'SUCCEEDED') throw new Error('Payment was not independently confirmed');
    const duplicate = await payments.submit(intent.id, signed, stellar);
    if (duplicate.transactionHash !== result.transactionHash) throw new Error('Duplicate submission changed settlement evidence');
    const history = await stellar.getHistory(sender.publicKey);
    if (!history.records.some((item) => item.transactionHash === result.transactionHash)) throw new Error('Confirmed payment absent from Horizon history');
    const restarted = new PaymentIntentStore();
    await restarted.onModuleInit();
    try {
      if ((await restarted.findIntent(intent.id)).status !== 'SUCCEEDED') throw new Error('Payment did not survive repository restart');
    } finally { await restarted.onModuleDestroy(); }
    const evidence = { verifiedAt: new Date().toISOString(), network: 'Stellar Testnet', sender: input.sender, recipient: input.recipient, amount: input.amount, asset: 'XLM', memo: input.memo, feeStroops: prepared.fee, paymentIntentId: intent.id, transactionHash: result.transactionHash, explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.transactionHash}`, status: result.status, historyVerified: true, repositoryRestartVerified: true, duplicateSubmissionVerified: true, limitation: 'Node execution of wallet and backend helpers against real Testnet and isolated PostgreSQL; browser UI and public deployments were not exercised.' };
    await mkdir(join(__dirname, '../docs/evidence'), { recursive: true });
    evidence.sdk = require('../backend/package.json').dependencies['@stellar/stellar-sdk'];
    await writeFile(join(__dirname, `../docs/evidence/testnet-payment-${result.transactionHash}.json`), JSON.stringify(evidence, null, 2) + '\n');
    console.log(JSON.stringify(evidence, null, 2));
  } finally { await store.onModuleDestroy(); }
}
main().catch((error) => { console.error(`Testnet verification failed: ${String(error?.message ?? 'unknown error').replace(/\bS[A-Z2-7]{55}\b/g, '[redacted seed]')}. No success evidence was generated; inspect account history before retrying.`); process.exitCode = 1; });
