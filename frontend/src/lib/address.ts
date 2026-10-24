import { StrKey } from '@stellar/stellar-sdk';

export function isValidPublicKey(value: string) {
  return StrKey.isValidEd25519PublicKey(value.trim());
}

/** Stellar text memos are limited to 28 bytes, not characters. */
export function memoByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

export const MEMO_MAX_BYTES = 28;
