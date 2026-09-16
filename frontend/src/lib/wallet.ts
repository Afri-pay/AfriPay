import { Keypair } from '@stellar/stellar-sdk';

export const WALLET_STORAGE_KEY = 'afripay.native-wallet.v1';
const ITERATIONS = 310_000;

export type EncryptedWallet = {
  version: 1;
  publicKey: string;
  ciphertext: string;
  salt: string;
  iv: string;
  kdf: 'PBKDF2-SHA-256';
  kdfParameters: { iterations: number };
  createdAt: string;
  network: 'testnet';
};

const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export function generateKeypair() {
  const keypair = Keypair.random();
  return { publicKey: keypair.publicKey(), secret: keypair.secret() };
}

export function validateSecret(secret: string) {
  try {
    const keypair = Keypair.fromSecret(secret.trim());
    return { valid: true as const, publicKey: keypair.publicKey() };
  } catch {
    return { valid: false as const };
  }
}

export async function encryptWallet(secret: string, publicKey: string, password: string): Promise<EncryptedWallet> {
  if (!password || password.length < 8) throw new Error('Wallet password must be at least 8 characters');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource }, key, new TextEncoder().encode(secret));
  return { version: 1, publicKey, ciphertext: bytesToBase64(new Uint8Array(ciphertext)), salt: bytesToBase64(salt), iv: bytesToBase64(iv), kdf: 'PBKDF2-SHA-256', kdfParameters: { iterations: ITERATIONS }, createdAt: new Date().toISOString(), network: 'testnet' };
}

export async function decryptWallet(wallet: EncryptedWallet, password: string) {
  const key = await deriveKey(password, base64ToBytes(wallet.salt));
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(wallet.iv) as unknown as BufferSource }, key, base64ToBytes(wallet.ciphertext) as unknown as BufferSource);
  return new TextDecoder().decode(plaintext);
}

export function readEncryptedWallet(): EncryptedWallet | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(WALLET_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as EncryptedWallet;
    if (parsed.version !== 1 || parsed.network !== 'testnet' || !parsed.publicKey || !parsed.ciphertext) return null;
    return parsed;
  } catch { return null; }
}

export function saveEncryptedWallet(wallet: EncryptedWallet) {
  window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
}

export function removeEncryptedWallet() { window.localStorage.removeItem(WALLET_STORAGE_KEY); }
