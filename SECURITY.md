# Security policy

Report sensitive issues privately to security@afripay.io, the existing maintainer-published contact. Maintainers should verify that mailbox is monitored. Do not post seeds, provider credentials, database URLs or exploit details in public issues.

AfriPay is Testnet-only and has not had an independent security audit. See the [security remediation report](docs/SECURITY_REMEDIATION_REPORT.md) for verified fixes, remaining advisories and trust assumptions.

## Wallet and payment boundary

Secrets are generated/imported and AES-GCM/PBKDF2 encrypted locally. Backend services receive public addresses and signed XDR only. Review destination, XLM amount, memo, fee and Testnet network before signing. Signature verification binds intent submission to a genuine source-account Testnet signature; a submitted envelope is not confirmed until Horizon independently reports successful ledger inclusion.

Public intent/link metadata is public. API_KEY protects MoMo/rates/USSD service operations and must never be exposed through NEXT_PUBLIC variables. Public keys alone are not authenticated user identity. Any service key previously shipped to browsers should be rotated through an explicitly authorized host update.

Uncertain payments stay PENDING; retry the same envelope or check the same hash. Do not create a fresh payment because a timeout occurred. Automatic expired/absent transaction recovery remains incomplete.

## Database, callbacks and abuse controls

Production requires PostgreSQL. Apply reviewed migrations explicitly; preserve existing data and investigate duplicate historical hashes before adding the unique index. SQL reads are authoritative and writes awaited. Isolated local/tests can use memory; this is not production durability.

MoMo remains sandbox-only. Shared callback tokens fail closed in production; tokens in callback URLs can appear in host access logs, so restrict/redact those logs. No provider HMAC verification or centralized durable event claiming is claimed. Provider status polling and operational reconciliation remain necessary. Vercel process timers are not durable schedulers.

### Webhook Security & Verification Matrix

The centralized webhook router at `POST /webhooks/:provider/:endpoint` standardizes incoming callback handling:

| Provider | Endpoint | Authentication Mechanism | Correlation ID | Replay Protection | Failure Mode |
|---|---|---|---|---|---|
| **MTN MoMo** | `/webhooks/momo/collection` | Query param token (`timingSafeEqual`) | `externalId` / `referenceId` | Idempotent upsert by `referenceId` (replay safe) | 401 Unauthorized on token mismatch |
| **MTN MoMo** | `/webhooks/momo/disbursement` | Query param token (`timingSafeEqual`) | `externalId` / `referenceId` | Idempotent upsert by `referenceId` (replay safe) | 401 Unauthorized on token mismatch |
| **Future Providers** | `/webhooks/:provider/:endpoint` | Provider-specific signature / token | Normalized payload identifier | Provider contract dependent | 404 Not Found on unregistered provider |

#### Extension Point for New Providers:
1. Register new provider slug in `WebhooksService.dispatch()`.
2. Add provider-specific cryptographic signature verification guard / assertion.
3. Delegate to domain service handler returning normalized `WebhookResult`.
4. Register reconciliation poll in `WebhookReconciliationService.reconcilePending()`.

The API enforces per-instance rate limits and 32KB bodies. Distributed edge limits, role-based/user authorization, authenticated USSD account binding and stronger provider operations remain open. CORS is not an access-control substitute.

## Browser and contract limitations

Production scripts use per-request CSP nonces; inline styles remain allowed. Device compromise, malicious extensions, XSS, unlocked memory and compromised dependencies remain threats. Deletion from localStorage does not guarantee forensic erasure. No backend recovery exists.

Escrow release now requires depositor approval before expiry; refunds require expiry and depositor authorization. Multisig validates signer uniqueness/consent and transfers assets only after threshold. Gateway trusts a configured confirmer instead of independently proving an external payment. Vault balances and yield are simulated and do not custody assets. Changes require separately approved deployment/migration and independent review.

## Dependency and CI status

Final npm audits report zero vulnerabilities in both workspaces; the high-advisory CI gate remains enforced without suppressions. See [DEPENDENCY_AUDIT](docs/DEPENDENCY_AUDIT.md). History pattern scanning found no matches for its configured seed/key/token rules; this is not an exhaustive secret audit.

Keep Mainnet and real-money providers disabled. Do not deploy this branch or rotate production credentials without explicit maintainer authorization.