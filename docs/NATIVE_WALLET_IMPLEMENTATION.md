# Native Wallet Implementation

## Architecture

```text
User browser
  ├─ encrypted wallet (localStorage; AES-GCM/PBKDF2)
  ├─ local transaction signing
  └──────────────> Stellar Testnet (Horizon / Friendbot)
  └──────────────> AfriPay API (public key + signed XDR only)
                         └── PostgreSQL application metadata
```

Private keys do not go to the backend.

## Files

The frontend adds `src/lib/wallet.ts`, `src/lib/stellar.ts`, `src/hooks/useNativeWallet.ts`, and `src/components/Wallet/NativeWallet.tsx`. The backend adds `src/stellar/stellar.controller.ts` and extends `StellarService` with account summaries, history, Testnet funding, and Soroban RPC transaction preparation/submission.

## Signing and network

Native XLM payments load the source account from Horizon, build and sign a Testnet transaction in the browser, then submit signed XDR. The backend verifies the signed transaction source matches the supplied public key before submission. Soroban transactions can be simulated/prepared and submitted through Testnet RPC endpoints using the same local native signer boundary. Testnet configuration is centralized in the frontend and backend environments.

## Tests and limitations

The existing tests and build commands remain the verification baseline. Current UI balance loading and history use backend-proxied Horizon data, with account activation and network error states. Mainnet remains disabled.

## Mainnet checklist

- Independent wallet cryptography and transaction-signing review
- XSS, CSP, dependency, storage, and mobile-browser review
- Recovery and backup testing with incident response procedures
- Mainnet-specific Horizon/RPC/network configuration and reserve/fee handling
- Native Soroban authorization, simulation, preparation, polling, and failure testing
