## Summary

Implement a **Stellar settlement service** in the backend that submits and verifies Soroban transactions against Stellar Testnet (Horizon + Soroban RPC).

## Background

AfriPay's on-chain payment gateway and escrow contracts exist, but the backend `stellar/` module is a stub. Connecting the NestJS backend to Soroban enables end-to-end flows: payment intent creation → off-chain MoMo collection → on-chain confirmation via the gateway confirmer.

## Current state

- [x] Soroban `gateway` contract: create intent, confirm intent, confirmer rotation
- [x] `backend/src/stellar/stellar.module.ts` — empty stub
- [ ] Horizon/RPC client configuration
- [ ] Transaction build, sign (server-side confirmer key), submit
- [ ] Transaction status polling / verification
- [ ] Integration with payment/MoMo lifecycle

## Technical scope

- `backend/src/stellar/` — `StellarService`, config, types
- `backend/.env.example` — `STELLAR_NETWORK`, `STELLAR_RPC_URL`, `STELLAR_HORIZON_URL`, confirmer secret (document as env-only, never committed)
- Wire into `AppModule` and a controller or internal service API
- Tests with mocked Horizon/RPC responses

## Requirements

1. Read network config from environment (default: **testnet**)
2. Provide methods to:
   - Verify a transaction hash succeeded on network
   - Submit a Soroban contract invocation (e.g. `confirm_payment_intent`) using confirmer credentials
3. Typed errors for network failures, submission failures, and verification mismatches
4. Structured logging without leaking secrets
5. Unit tests with mocked fetch/RPC; no mainnet calls in CI

## Acceptance criteria

- [ ] Service connects to Stellar Testnet RPC and Horizon using env config
- [ ] Can verify a known testnet transaction hash (mocked in unit tests; manual testnet optional in PR description)
- [ ] Can submit a contract call path (mocked or sandbox) with clear error handling
- [ ] `cd backend && npm test && npm run lint && npm run build` pass
- [ ] README/SECURITY updated for confirmer key handling

## Tests

- Mock RPC/Horizon in Jest
- Test: successful verification, failed verification, network timeout, missing config

## Security considerations

- Confirmer secret key must never be logged or committed
- Document that server-side signing is a trust assumption
- Rate-limit submission endpoints when exposed via HTTP
- Default to testnet only until mainnet runbook exists

## Definition of done

- PR merged; backend CI green
- Honest documentation of testnet-only status

## Difficulty

**Advanced / Epic** — 750–1000 points
