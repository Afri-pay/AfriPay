import { Horizon, Networks, TransactionBuilder, Operation, Asset, Keypair, Memo, StrKey } from '@stellar/stellar-sdk';

export const TESTNET_PASSPHRASE = Networks.TESTNET;
// Deliberately fixed: a deployment variable must not redirect wallet data to Mainnet.
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const horizon = new Horizon.Server(HORIZON_URL);

export async function buildAndSignXlmPayment(secret: string, recipient: string, amount: string, memo?: string) {
  if (!StrKey.isValidEd25519SecretSeed(secret)) throw new Error('Unable to unlock wallet');
  if (!StrKey.isValidEd25519PublicKey(recipient)) throw new Error('Invalid Stellar recipient address');
  if (!/^\d+(\.\d{1,7})?$/.test(amount) || Number(amount) <= 0) throw new Error('Enter a positive amount with at most 7 decimal places');
  const source = Keypair.fromSecret(secret);
  const account = await horizon.loadAccount(source.publicKey());
  let builder = new TransactionBuilder(account, { fee: '100', networkPassphrase: TESTNET_PASSPHRASE })
    .addOperation(Operation.payment({ destination: recipient, asset: Asset.native(), amount }));
  if (memo?.trim()) builder = builder.addMemo(Memo.text(memo));
  const transaction = builder.setTimeout(300).build();
  transaction.sign(source);
  return transaction.toXDR();
}

export type PaymentReview = { recipient: string; amount: string; memo?: string; fee: string };

function amountUnits(amount: string) {
  if (!/^\d{1,12}(\.\d{1,7})?$/.test(amount)) throw new Error('Invalid XLM amount');
  const [whole, fraction = ''] = amount.split('.');
  return BigInt(whole) * BigInt(10000000) + BigInt(fraction.padEnd(7, '0'));
}

export function signTransactionXdr(secret: string, xdr: string, review: PaymentReview) {
  if (!StrKey.isValidEd25519SecretSeed(secret)) throw new Error('Unable to unlock wallet');
  const source = Keypair.fromSecret(secret);
  const transaction = TransactionBuilder.fromXDR(xdr, TESTNET_PASSPHRASE);
  if (!('source' in transaction) || transaction.source !== source.publicKey()) throw new Error('Transaction source does not match wallet');
  const operation = transaction.operations[0];
  if (transaction.operations.length !== 1 || operation.type !== 'payment' || operation.source || !operation.asset.isNative() || operation.destination !== review.recipient || amountUnits(operation.amount) !== amountUnits(review.amount) || amountUnits(review.amount) <= BigInt(0)) throw new Error('Transaction does not match reviewed payment');
  if (transaction.fee !== review.fee || BigInt(transaction.fee) > BigInt(1000000)) throw new Error('Unexpected transaction fee');
  const memo = review.memo ?? '';
  if (memo ? transaction.memo.type !== 'text' || String(transaction.memo.value) !== memo : transaction.memo.type !== 'none') throw new Error('Transaction memo does not match review');
  if (!transaction.timeBounds || Number(transaction.timeBounds.maxTime) <= Date.now() / 1000 || Number(transaction.timeBounds.maxTime) > Date.now() / 1000 + 360) throw new Error('Transaction expired or invalid time bounds');
  if (transaction.signatures.length) throw new Error('Unexpected existing signatures');
  transaction.sign(source);
  return transaction.toXDR();
}

export async function prepareSorobanTransaction(apiUrl: string, xdr: string, publicKey: string, apiKey?: string) {
  const response = await fetch(`${apiUrl}/stellar/soroban/prepare`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) }, body: JSON.stringify({ xdr, publicKey }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? 'Soroban preparation failed');
  return result as { xdr: string; network: 'testnet' };
}

export async function submitSorobanTransaction(apiUrl: string, signedXdr: string, publicKey: string, apiKey?: string) {
  const response = await fetch(`${apiUrl}/stellar/soroban/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) }, body: JSON.stringify({ signedXdr, publicKey }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? 'Soroban submission failed');
  return result as { hash: string; status: string; explorerUrl: string };
}
