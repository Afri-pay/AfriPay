import { decryptWallet, encryptWallet, generateKeypair, validateSecret } from './wallet';

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
});
