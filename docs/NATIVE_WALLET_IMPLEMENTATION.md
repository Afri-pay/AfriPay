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

The frontend adds `src/lib/wallet.ts`, `src/lib/stellar.ts`, `src/hooks/useNativeWallet.ts`, and `src/components/Wallet/NativeWallet.tsx`. The backend adds `src/stellar/stellar.controller.ts` and extends `StellarService` with account loading and Testnet funding. Existing Freighter and payment components remain available as an optional external path.

## Signing and network

Native XLM payments load the source account from Horizon, build and sign a Testnet transaction in the browser, then submit signed XDR. The backend verifies the signed transaction source matches the supplied public key before submission. Testnet configuration is centralized in the frontend environment and existing backend environment. Soroban contracts and IDs were preserved; a complete native Soroban RPC client remains a follow-up because the current repository has no frontend Soroban invocation flow.

## Tests and limitations

The existing tests and build commands remain the verification baseline. The new wallet service should receive browser-crypto unit coverage before Mainnet. Current UI balance loading uses Horizon directly and reports account-not-found/network states; history reconciliation and full asset/Soroban dashboard integration are not yet complete.

## Mainnet checklist

- Independent wallet cryptography and transaction-signing review
- XSS, CSP, dependency, storage, and mobile-browser review
- Recovery and backup testing with incident response procedures
- Mainnet-specific Horizon/RPC/network configuration and reserve/fee handling
- Native Soroban authorization, simulation, preparation, polling, and failure testing
