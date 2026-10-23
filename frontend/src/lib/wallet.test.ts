import { decryptWallet, encryptWallet, generateKeypair, validateSecret, saveEncryptedWallet, readEncryptedWallet, removeEncryptedWallet } from './wallet';

describe('native wallet key handling', () => {
  it('generates a valid Stellar keypair locally', () => {
    const pair = generateKeypair();
    expect(pair.publicKey).toMatch(/^G[A-Z2-7]{55}$/);
    expect(pair.secret).toMatch(/^S[A-Z2-7]{55}$/);
  });

  it('validates imports and derives the matching public key', () => {
    const pair = generateKeypair();
    expect(validateSecret(pair.secret)).toEqual({ valid: true, publicKey: pair.publicKey });
    expect(validateSecret('not-a-stellar-secret')).toEqual({ valid: false });
  });

  it('encrypts and decrypts with the correct password while never storing plaintext', async () => {
    const pair = generateKeypair();
    const wallet = await encryptWallet(pair.secret, pair.publicKey, 'correct horse battery staple');
    expect(wallet.ciphertext).not.toContain(pair.secret);
    await expect(decryptWallet(wallet, 'correct horse battery staple')).resolves.toBe(pair.secret);
    await expect(decryptWallet(wallet, 'wrong password')).rejects.toBeTruthy();
  });

  it('uses independent salts and nonces and rejects tampered metadata and ciphertext', async () => {
    const pair = generateKeypair();
    const first = await encryptWallet(pair.secret, pair.publicKey, 'long password');
    const second = await encryptWallet(pair.secret, pair.publicKey, 'long password');
    expect(first.salt).not.toBe(second.salt);
    expect(first.iv).not.toBe(second.iv);
    await expect(decryptWallet({ ...first, publicKey: generateKeypair().publicKey }, 'long password')).rejects.toThrow();
    await expect(decryptWallet({ ...first, kdfParameters: { iterations: 1 } }, 'long password')).rejects.toThrow();
    await expect(decryptWallet({ ...first, ciphertext: 'AAAA' }, 'long password')).rejects.toBeTruthy();
    saveEncryptedWallet(first);
    await expect(decryptWallet(readEncryptedWallet()!, 'long password')).resolves.toBe(pair.secret);
    removeEncryptedWallet();
    expect(readEncryptedWallet()).toBeNull();
  });

  it('rejects weak passwords and mismatched imported keys', async () => {
    const pair = generateKeypair();
    await expect(encryptWallet(pair.secret, pair.publicKey, 'short')).rejects.toThrow();
    await expect(encryptWallet(pair.secret, generateKeypair().publicKey, 'long password')).rejects.toThrow();
  });
});
