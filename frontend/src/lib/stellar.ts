import { Horizon, Networks, TransactionBuilder, Operation, Asset, Keypair, Memo, StrKey } from '@stellar/stellar-sdk';

export const TESTNET_PASSPHRASE = Networks.TESTNET;
export const HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
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

export function signTransactionXdr(secret: string, xdr: string) {
  if (!StrKey.isValidEd25519SecretSeed(secret)) throw new Error('Unable to unlock wallet');
  const source = Keypair.fromSecret(secret);
  const transaction = TransactionBuilder.fromXDR(xdr, TESTNET_PASSPHRASE);
  if (!('source' in transaction) || transaction.source !== source.publicKey()) throw new Error('Transaction source does not match wallet');
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
