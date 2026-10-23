import { BadRequestException } from '@nestjs/common';
import { Keypair, Networks, StrKey, Transaction, TransactionBuilder } from '@stellar/stellar-sdk';

export interface NativePayment { sender: string; recipient: string; amount: string; asset: string; memo?: string }

export function stroops(value: string): bigint {
  if (typeof value !== 'string' || !/^\d{1,12}(\.\d{1,7})?$/.test(value)) throw new BadRequestException('Invalid XLM amount');
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * BigInt(10000000) + BigInt(fraction.padEnd(7, '0'));
}

export function validatePayment(input: NativePayment): void {
  if (!StrKey.isValidEd25519PublicKey(input.sender) || !StrKey.isValidEd25519PublicKey(input.recipient)) throw new BadRequestException('Invalid Stellar address');
  if (input.sender === input.recipient || input.asset !== 'XLM' || stroops(input.amount) <= 0) throw new BadRequestException('A positive XLM payment to another account is required');
  if (input.memo !== undefined && (typeof input.memo !== 'string' || Buffer.byteLength(input.memo, 'utf8') > 28)) throw new BadRequestException('Memo exceeds 28 UTF-8 bytes');
}

export function parsePayment(xdr: string, expected?: NativePayment): Transaction {
  let tx;
  try { tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET); } catch { throw new BadRequestException('Invalid Testnet transaction'); }
  if (!(tx instanceof Transaction)) throw new BadRequestException('Fee-bump envelopes are not supported');
  const signer = Keypair.fromPublicKey(tx.source);
  if (!tx.signatures.some((signature) => {
    try { return signer.verify(tx.hash(), signature.signature()); } catch { return false; }
  })) throw new BadRequestException('A valid Testnet source-account signature is required');
  if (expected) {
    validatePayment(expected);
    const op = tx.operations[0];
    if (tx.source !== expected.sender || tx.operations.length !== 1 || op.type !== 'payment' || op.source || !op.asset.isNative() || op.destination !== expected.recipient || stroops(op.amount) !== stroops(expected.amount)) throw new BadRequestException('Transaction does not match payment intent');
    if (expected.memo ? tx.memo.type !== 'text' || String(tx.memo.value) !== expected.memo : tx.memo.type !== 'none') throw new BadRequestException('Transaction memo does not match intent');
  }
  if (!tx.timeBounds || Number(tx.timeBounds.maxTime) === 0) throw new BadRequestException('Finite transaction time bounds required');
  if (BigInt(tx.fee) > BigInt(1000000)) throw new BadRequestException('Transaction fee exceeds Testnet wallet limit');
  return tx;
}
