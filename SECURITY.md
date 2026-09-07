# Security Policy

## Reporting a Vulnerability

If you discover a security issue in AfriPay, please report it responsibly.

**Do not** open a public GitHub issue for security vulnerabilities.

Email: **security@afripay.io**

Include:

- A description of the issue and potential impact
- Steps to reproduce
- Affected components (frontend, backend, contracts)
- Any proof-of-concept you can share safely

We aim to acknowledge reports within 72 hours. We will coordinate disclosure once a fix is available.

## Scope

This policy covers:

- The AfriPay GitHub repository (frontend, backend, Soroban contracts)
- Payment and webhook integrations implemented in this repo
- Documentation that could lead to unsafe deployments

Out of scope: third-party services (MTN, Africa's Talking, Stellar network infrastructure) unless the vulnerability is introduced by AfriPay's integration code.

---

## Secret Management

- Never commit API keys, webhook tokens, database credentials, or Stellar secret keys.
- Use environment variables (see `backend/.env.example` and `frontend/.env.example`).
- Rotate credentials if they are ever exposed.
- MTN MoMo credentials are read from `MTN_MOMO_*` environment variables at runtime.

**Limitation:** Secret scanning of git history is recommended but not automated in this repository yet.

---

## Wallet Security

- AfriPay's frontend connects to [Freighter](https://www.freighter.app/) for non-custodial wallet access.
- Private keys remain in the user's wallet extension; AfriPay does not store them.
- Users must verify transaction details in Freighter before signing.
- There is no backend wallet custody layer implemented yet.

---

## Soroban Contract Security

Contracts live under `contracts/`:

| Contract | Purpose | Notes |
|----------|---------|-------|
| `gateway` | Payment intents with authorized confirmer | Pending → Confirmed lifecycle; confirmer rotation supported |
| `escrow` | P2P escrow payments | Basic create flow; release/refund not yet implemented |
| `multisig` | Threshold approvals | Execute marks proposal done; token transfer not wired |
| `vault` | Savings with fixed APY accrual | Simulated yield; no external DeFi integration |

**Assumptions:**

- Contracts target Soroban testnet for development.
- Contracts have **not** received an independent third-party audit.
- Authorization uses Soroban `require_auth()` where implemented.

**Known gaps:**

- Escrow release/refund paths are incomplete.
- Multisig execute does not transfer assets on-chain yet.
- No contract upgrade/admin pattern is documented.

---

## Payment Verification

### Payment gateway (on-chain)

Lifecycle implemented in `contracts/gateway`:

```text
Created (Pending)
  |
  v
Confirmed
```

There is no on-chain `Failed` state today. Off-chain payment failures must be handled by the backend before calling `confirm_payment_intent`.

Only the address set via `init` / `set_confirmer` may confirm intents.

### MTN Mobile Money (off-chain)

- Collections and disbursements are initiated via MTN sandbox/production APIs.
- Transaction status is tracked in an in-memory store (`MomoTransactionStore`) — **not durable across restarts**.
- Status refresh polls MTN API endpoints.
- Webhook callbacks update transaction status when `externalId` matches.

**Limitation:** Production MoMo integration has not been verified in this repository's CI.

---

## Webhook Verification

MTN MoMo webhooks are protected by `MomoWebhookGuard`:

- Expects header `X-Mtn-Webhook-Token` to match `MTN_MOMO_WEBHOOK_TOKEN`.
- Rejects requests when the token is missing or incorrect.

**Limitations:**

- No HMAC signature verification from MTN is implemented.
- Webhook replay protection is not implemented.
- Idempotency for duplicate webhook delivery is partial (status upsert only).

---

## Authentication & Authorization

| Area | Status |
|------|--------|
| Backend API authentication | **Not implemented** — health, rates, MoMo, and USSD routes are open |
| MoMo webhook token | Implemented |
| Soroban payer/confirmer auth | Implemented in contracts |
| Frontend session/auth | **Not implemented** |

---

## Input Validation

- MTN DTOs validate request shapes in controller layer.
- USSD input is parsed from Africa's Talking `text` field (star-separated).
- Exchange-rate queries validate currency pair parameters in the rates controller.

**Limitations:**

- No global rate limiting middleware.
- No request size limits beyond NestJS defaults.

---

## External Provider Trust Boundaries

| Provider | Trust boundary |
|----------|----------------|
| MTN MoMo | AfriPay trusts MTN API responses and webhook payloads after token check |
| Open Exchange Rates | Rate data fetched over HTTPS; cached in Redis when available |
| Africa's Talking | USSD POST body is trusted; no signature verification yet |
| Stellar/Soroban | On-chain state is authoritative for contract operations |

---

## Safe Deployment Checklist

Before deploying to any shared or production environment:

1. Set all secrets via environment variables, not source code.
2. Configure `MTN_MOMO_WEBHOOK_TOKEN` and restrict webhook endpoint access.
3. Use Stellar **testnet** until mainnet readiness is explicitly documented.
4. Replace in-memory MoMo transaction store with durable persistence.
5. Add API authentication before exposing payment endpoints publicly.
6. Run contract tests in CI (`cargo test` in `contracts/`).

---

## Security Limitations Summary

The following are **not** implemented yet and should be treated as open work:

- API authentication and authorization for backend routes
- Rate limiting
- Webhook replay protection and HMAC verification
- Durable transaction storage
- Database-backed user accounts
- KYC integration (module stub only)
- Independent smart contract audit

See open GitHub issues for planned security hardening work.
