import { generateKeypair, validateSecret } from './wallet';

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
});
