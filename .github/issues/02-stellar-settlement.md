## Summary

Add Soroban contract invocation and transaction verification to the existing Testnet payment path.

## Current behavior

AfriPay builds native XLM payment transactions through Horizon, supports Freighter signing, and submits signed XDR on Testnet. The backend does not yet invoke the deployed payment-gateway contract or verify a confirmed Soroban result end to end.

## Technical scope

- Add Testnet-only Soroban RPC configuration and typed invocation helpers.
- Add transaction polling and confirmation/error normalization.
- Connect payment-intent settlement to the deployed gateway contract without introducing server-side user-key custody.
- Add mocked RPC tests and a documented manual Testnet runbook.

## Out of scope

Mainnet deployment, custodial private keys, unrelated contract features, or fabricated Testnet evidence.

## Acceptance criteria

- A payment intent can produce a gateway invocation XDR for Testnet.
- A Freighter-signed invocation can be submitted and polled to a terminal result.
- Failed, expired, and rejected transactions map to explicit application states.
- Explorer links and public evidence are added only after real execution.

## Tests

Mock successful, rejected, timeout, and malformed Soroban RPC responses; add a manual Testnet verification record when credentials are available.

## Security considerations

Keep signing in Freighter, enforce Testnet configuration, redact XDR/signature data from logs, and never commit secret keys.

## Difficulty

Advanced.

## Likely files/modules

`backend/src/stellar/`, `backend/src/payments/`, `frontend/src/components/Payments/`, `docs/STELLAR_TESTNET_DEPLOYMENT.md`.
