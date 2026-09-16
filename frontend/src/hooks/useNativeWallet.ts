'use client';
import { useCallback, useEffect, useState } from 'react';
import { decryptWallet, encryptWallet, generateKeypair, readEncryptedWallet, removeEncryptedWallet, saveEncryptedWallet, validateSecret, type EncryptedWallet } from '@/lib/wallet';

export function useNativeWallet() {
  const [encrypted, setEncrypted] = useState<EncryptedWallet | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { setEncrypted(readEncryptedWallet()); setReady(true); }, []);

  const create = useCallback(async (password: string) => {
    const pair = generateKeypair();
    const wallet = await encryptWallet(pair.secret, pair.publicKey, password);
    saveEncryptedWallet(wallet); setEncrypted(wallet); setAddress(pair.publicKey); setSecret(pair.secret);
    return pair;
  }, []);
  const importWallet = useCallback(async (rawSecret: string, password: string) => {
    const result = validateSecret(rawSecret);
    if (!result.valid) throw new Error('Invalid Stellar secret key');
    const wallet = await encryptWallet(rawSecret.trim(), result.publicKey, password);
    saveEncryptedWallet(wallet); setEncrypted(wallet); setAddress(result.publicKey); setSecret(rawSecret.trim());
    return result.publicKey;
  }, []);
  const unlock = useCallback(async (password: string) => {
    if (!encrypted) throw new Error('No encrypted wallet found');
    const decrypted = await decryptWallet(encrypted, password);
    setSecret(decrypted); setAddress(encrypted.publicKey); return encrypted.publicKey;
  }, [encrypted]);
  const lock = useCallback(() => { setSecret(null); setAddress(null); }, []);
  const remove = useCallback(() => { removeEncryptedWallet(); setEncrypted(null); setSecret(null); setAddress(null); }, []);
  return { ready, encryptedWallet: encrypted, address, secret, isUnlocked: Boolean(secret), create, importWallet, unlock, lock, remove };
}
