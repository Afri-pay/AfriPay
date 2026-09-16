# AfriPay Wallet Security

The native wallet is a Testnet-only, non-custodial browser wallet. The Stellar secret is generated or imported in the browser, encrypted with Web Crypto AES-GCM using a PBKDF2-SHA-256 derived key, and stored only as versioned ciphertext, salt, IV, and public metadata in local storage. The secret is decrypted into memory only while the wallet is unlocked and is cleared when locked.

The backend receives public keys and signed transaction XDR only. It does not need, accept, persist, or log secret seeds. QR codes and clipboard actions in the wallet contain the public address only; recovery-secret display is deliberate and must be handled offline by the user.

## Threat model and limitations

Encryption protects stored wallet data from casual local inspection, but it does not protect an unlocked wallet from malicious JavaScript, browser extensions, malware, or an XSS vulnerability. The password is not recoverable by AfriPay. Losing the device data and the recovery backup can permanently lose control of the account. Users must verify transaction recipient, amount, network, fee, and memo before signing.

This implementation has not had an independent security review and is not a claim of production readiness. Before Mainnet, review XSS/CSP, dependencies, browser storage, mobile browsers, cryptographic parameters, transaction validation, recovery UX, and incident response.
