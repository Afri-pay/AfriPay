# Security Policy

## Reporting a Vulnerability

If you discover a security issue in AfriPay, please report it responsibly.

**Do not** open a public GitHub issue for security vulnerabilities.

Email: **security@afripay.io**

Include:

- A description of the issue and potential impact
- Steps to reproduce
- Affected components (frontend, backend, Soroban contracts)
- Any proof-of-concept you can share safely

We aim to acknowledge reports within 72 hours. We will coordinate disclosure once a fix is available.

## Scope

This policy covers the AfriPay repository, frontend, backend, Soroban contracts, payment integrations, webhook integrations, and deployment documentation.

Third-party services such as MTN, Africa's Talking, and Stellar infrastructure are out of scope unless the vulnerability is introduced by AfriPay's integration code.

## Secret Management

- Never commit API keys, webhook tokens, database credentials, or Stellar secret keys.
- Use environment variables described in `backend/.env.example` and `frontend/.env.example`.
- Rotate credentials if they are exposed.
- MTN MoMo credentials are read from `MTN_MOMO_*` environment variables at runtime.
- Do not treat a frontend `NEXT_PUBLIC_*` value as a secret; it is delivered to browser users.

Secret scanning of git history is recommended but is not automated in this repository yet.

## Wallet Security

AfriPay's primary wallet is a native, non-custodial browser wallet. Freighter or another browser wallet is not required.

- Stellar keypairs are generated or imported in the browser with the Stellar SDK.
- The raw secret seed is never sent to the AfriPay backend, database, analytics, URLs, cookies, or API requests.
- The secret is encrypted locally with Web Crypto AES-GCM.
- The encryption key is derived from the wallet password with PBKDF2-SHA-256 using a random salt and the versioned iteration count stored in the encrypted wallet metadata.
- Only the encrypted payload, salt, IV, public key, network, and non-secret metadata are stored in browser localStorage.
- The decrypted secret exists in application memory only while the wallet is unlocked and is cleared when the wallet is locked or the inactivity timer expires, as far as practical in a browser environment.
- Transactions are signed locally. The backend receives a public key and, when submission is required, a signed transaction envelope/XDR.
- QR codes and normal clipboard actions contain the public address only. The recovery secret is shown only during deliberate backup/import flows and must be stored offline by the user.

This design is non-custodial, but browser storage is not a hardware wallet. An XSS vulnerability, malicious browser extension, compromised dependency, malware, or an unlocked device could access signing material. Encryption does not protect an already-unlocked wallet. Users must verify the recipient, amount, asset, fee, memo, and Testnet network before signing.

There is no backend wallet custody or server-side recovery mechanism. Losing both the local encrypted wallet and the recovery backup can permanently remove access to the Stellar account.

See `docs/WALLET_SECURITY.md` for the detailed wallet threat model and Mainnet review requirements.

## Soroban Contract Security

Contracts live under `contracts/`:

| Contract | Purpose | Notes |
|---|---|---|
| `gateway` | Payment intents with authorized confirmer | Pending to Confirmed lifecycle; confirmer rotation supported |
| `escrow` | P2P escrow payments | Basic create flow; release/refund not yet implemented |
| `multisig` | Threshold approvals | Execute marks proposal done; token transfer not wired |
| `vault` | Savings with fixed APY accrual | Simulated yield; no external DeFi integration |

Assumptions:

- Contracts target Stellar Testnet for development.
- Contracts have not received an independent third-party audit.
- Authorization uses Soroban `require_auth()` where implemented.

Known gaps:

- Escrow release/refund paths are incomplete.
- Multisig execute does not transfer assets on-chain yet.
- No contract upgrade/admin pattern is documented.

## Payment Verification

The gateway lifecycle currently moves from `Created/Pending` to `Confirmed`. There is no on-chain `Failed` state today. Off-chain failures must be handled by the backend before calling `confirm_payment_intent`.

Only the address set via `init` or `set_confirmer` may confirm intents.

For MTN Mobile Money:

- Collections and disbursements use MTN sandbox or production APIs according to configuration.
- Transaction records are loaded into an in-memory cache and persisted to PostgreSQL only when `DATABASE_URL` is configured.
- The current implementation is not safe as the sole source of truth across multiple instances until durable repository access and write-confirmation behavior are completed.
- Status refresh polls MTN API endpoints.
- Webhook callbacks update transaction status when `externalId` matches.

Production MoMo integration has not been verified in this repository's CI.

## Webhook Verification

MTN MoMo webhook endpoints are protected by a shared token when `MTN_MOMO_WEBHOOK_TOKEN` is configured:

- The callback URL includes the token as a `?token=` query parameter.
- The token is compared using a timing-safe comparison.
- Requests with a missing or incorrect configured token are rejected.
- If the token is unset, verification is intentionally bypassed for local sandbox development and must not be treated as a production configuration.

Limitations:

- No provider HMAC signature verification is implemented.
- Durable webhook event claiming and replay protection are not implemented.
- Idempotency for duplicate webhook delivery is partial.

## Authentication and Authorization

| Area | Status |
|---|---|
| Backend API key guard | Implemented on payment-intent, payment-link, rates, and MoMo controller routes when `API_KEY` is configured |
| Stellar account/read, submission, funding, Soroban, health, and USSD routes | Public at the HTTP layer; require rate limiting and further authorization hardening before production traffic |
| MoMo webhook token | Implemented as a timing-safe query-token check when configured |
| Soroban payer/confirmer auth | Implemented in contracts where `require_auth()` is used |
| Frontend session/auth | Not implemented; the native wallet address is not an AfriPay user account |

`NEXT_PUBLIC_API_KEY` must not be treated as a secret. Any value with the `NEXT_PUBLIC_` prefix is visible to browser users. It can be used only as a temporary development or low-trust routing measure, not as production-grade authorization for privileged operations.

## Input Validation and Abuse Controls

- MTN DTOs validate request shapes in the controller layer.
- USSD input is parsed from Africa's Talking `text` fields.
- Exchange-rate queries validate currency pair parameters.
- Stellar public keys and signed Testnet transaction envelopes are validated before relevant operations.

Current limitations:

- No global rate-limiting middleware is implemented.
- No durable replay protection is implemented for webhooks.
- Request-size limits should be explicitly configured before public production use.
- Public Stellar submission and funding routes need abuse controls.

## External Provider Trust Boundaries

| Provider | Trust boundary |
|---|---|
| MTN MoMo | AfriPay trusts MTN API responses and webhook payloads after token validation |
| Open Exchange Rates | Rate data is fetched over HTTPS and may be cached in Redis |
| Africa's Talking | USSD POST bodies are accepted without provider signature verification |
| Stellar/Soroban | On-chain state is authoritative for contract operations |

## Safe Deployment Checklist

Before deploying to a shared or production environment:

1. Set secrets through the deployment platform, not source code.
2. Configure `MTN_MOMO_WEBHOOK_TOKEN` and use a protected callback URL.
3. Use Stellar Testnet until Mainnet readiness is explicitly reviewed.
4. Replace in-memory payment, MoMo, and USSD state with durable PostgreSQL-backed state.
5. Add global rate limiting and request-size limits.
6. Do not use a `NEXT_PUBLIC_*` value as a backend secret or privileged credential.
7. Implement durable webhook event claiming and replay protection.
8. Run frontend, backend, and contract tests in CI.
9. Review CSP, XSS exposure, dependencies, browser storage, and mobile-browser behavior.

## Security Limitations Summary

The following remain open work:

- Complete authentication and authorization for privileged backend routes.
- Rate limiting and explicit request-size limits.
- Webhook replay protection and provider signature verification where supported.
- Durable transaction storage as the production source of truth.
- KYC integration, which is currently a module stub.
- Independent smart-contract security audit.
- Independent review of the browser wallet threat model before Mainnet.

See the contributor backlog and tracked issue specifications for planned hardening work.
