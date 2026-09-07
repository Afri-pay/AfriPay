# AfriPay GrantFox Readiness Report

## Executive summary

This audit found a promising but early-stage AfriPay monorepo: a Next.js wallet-connect shell, a NestJS MoMo/rates/USSD backend, and four Soroban crates. This pass adds a tracked payment-intent API/UI, Horizon transaction construction, Freighter signing and Testnet submission, explicit escrow lifecycle methods, an asset-aware multisig execution path, MoMo idempotency protections, PostgreSQL-backed loading/persistence, scheduled reconciliation, API-key protection, and USSD session validation. Live Stellar deployment evidence remains blocked by missing CLI/deployer credentials.

No contract IDs, transaction hashes, live demo links, contributor counts, stars, forks, or PR activity were fabricated.

## Original state found during audit

- Frontend: Next.js 14 with a single wallet connection page and one Freighter component test.
- Backend: NestJS modules for rates, MoMo, USSD, health, and empty payments/Stellar module shells.
- MoMo: sandbox request/status/webhook behavior exists and is unit tested; state uses PostgreSQL when configured and an in-memory fallback for isolated tests.
- USSD: menu and prompt flow exist, but session persistence and real payment initiation are absent.
- Escrow: only a create-record path existed; no fund/release/refund/expiry lifecycle.
- Multisig: signer/threshold/duplicate approval checks existed, but execution only flipped an `executed` flag and did not move assets.
- CI: frontend, backend, and contract jobs exist. The invalid crates.io patch was removed; local Rust execution now reaches the linker but requires the Windows C runtime library.
- Existing working-tree files were preserved, including the user-provided fix plan and `contracts/Cargo.lock`.

## Completed in this pass

- Completed a repository-wide structure and baseline audit.
- Confirmed backend baseline, then expanded it to 11 suites and 46 tests passing.
- Confirmed frontend baseline: 1 suite, 1 test passing.
- Added `docs/GRANTFOX_CONTRIBUTOR_BACKLOG.md` with legitimate, scoped future work and acceptance criteria.
- Added this report with explicit limitations and evidence boundaries.
- Added payment intents with idempotency-key deduplication and a frontend send/history surface.
- Added escrow states and asset transfer entry points for fund, release, refund, and expiry-aware authorization.
- Added asset-aware multisig proposals, threshold approvals, one-time execution, and token transfer.
- Added MoMo duplicate-request protection and terminal-state transition protection.
- Added `backend/migrations/001_payment_state.sql` for durable MoMo transactions and webhook events.
- Added durable PostgreSQL tables and repository loading/upserts for payment intents and payment links.
- Added a five-minute configurable MoMo reconciliation scheduler with test-environment suppression and graceful shutdown.
- Added USSD session tracking, expiry, recipient validation, and amount validation.
- Removed the invalid crates.io patch from `contracts/Cargo.toml`; the lockfile already pins the compatible dependency graph.
- Upgraded the Soroban workspace to SDK 22.0.11 and pinned the lockfile to `ed25519-dalek 2.2.0` for a reproducible host/test dependency graph.
- Installed/repaired Visual Studio C++ Build Tools and the WASM target; all contract checks and release WASM builds now run locally.
- Added verified deployment instructions and evidence placeholders in `docs/STELLAR_TESTNET_DEPLOYMENT.md`.

## Partially completed or not implemented

The full requested P0/P1 scope is not complete. PostgreSQL runtime use requires a configured database and migration execution; live MoMo reconciliation requires provider credentials; Testnet deployment requires a Stellar CLI and funded deployer account.

P0 remains incomplete: live end-to-end settlement evidence and production provider reconciliation. Database-backed payment-intent persistence is implemented when `DATABASE_URL` is configured; it still needs a live PostgreSQL integration run.

P1 remains incomplete: QR image generation, OpenAPI publication, provider-backed USSD payments, and verified testnet evidence. Payment links, transaction history/details, session tracking, and production API-key protection are implemented.

P2/P3 are partly present before this pass: README, SECURITY.md, CONTRIBUTING.md, code of conduct, issue templates, PR template, and CI already exist. The new contributor backlog supplements them without creating GitHub activity.

## Tests and validation

Executed:

- `cd backend && npm test -- --runInBand` — PASS, 11 suites / 46 tests.
- `cd frontend && npm test -- --runInBand` — PASS, 1 suite / 1 test.
- `cd contracts && cargo test --locked` — PASS, 20 contract tests plus doc-test runs.
- `cd contracts && cargo fmt --check` — PASS.
- `cd contracts && cargo clippy --all-targets --all-features -- -D warnings` — PASS.
- `cd contracts && cargo build --release --target wasm32-unknown-unknown` — PASS; gateway, escrow, multisig, and vault WASM artifacts produced.
- `cd backend && npm run build` — PASS.
- `cd frontend && npm run build` — PASS.
- `cd backend && npm run lint` — PASS.
- `cd frontend && npm run lint` — PASS.

`npm audit fix --package-lock-only` applied nonbreaking lockfile remediation. `npm audit --audit-level=high` now reports 24 backend findings and 8 frontend findings. Remaining fixes require coordinated Nest 12/Next 14.2.35 or newer migration work, so automatic force-fixes were not applied.

## Final evidence table

| Validation | Status | Evidence |
|---|---|---|
| Soroban tests | PASS | 20 contract tests passed locally |
| Payment Gateway Testnet deployment | BLOCKED | No Stellar CLI/deployer account available |
| Escrow Testnet deployment | BLOCKED | No Stellar CLI/deployer account available |
| Multisig Testnet deployment | BLOCKED | No Stellar CLI/deployer account available |
| Savings Vault Testnet deployment | BLOCKED | No Stellar CLI/deployer account available |
| Freighter-signed Testnet payment | BLOCKED | No funded Testnet wallet/Freighter session available |
| PostgreSQL live persistence | BLOCKED | Docker daemon unavailable; no `DATABASE_URL` configured |
| MTN MoMo sandbox | BLOCKED | Official sandbox credentials unavailable |
| Backend tests | PASS | 11 suites / 46 tests |
| Frontend tests | PASS | 1 suite / 1 test |
| Production builds | PASS | Backend and frontend builds passed; release WASM built |
| Contributor backlog cleanup | PASS | Completed drafts removed and remaining drafts rewritten |

## Files created

- `GRANTFOX_FINAL_READINESS_REPORT.md`
- `docs/GRANTFOX_CONTRIBUTOR_BACKLOG.md`
- `backend/migrations/001_payment_state.sql`
- `backend/src/payments/payment-intent.controller.ts`
- `backend/src/payments/payment-intent.service.ts`
- `backend/src/payments/payment-intent.store.ts`
- `backend/src/payments/payment-intent.service.spec.ts`
- `backend/src/momo/momo-reconciliation.service.ts`
- `frontend/src/components/Payments/PaymentDashboard.tsx`

## Migrations and CI

Added `backend/migrations/001_payment_state.sql` as an explicit PostgreSQL schema for MoMo transactions, webhook deduplication, payment intents, and payment links. `MomoTransactionStore` and `PaymentIntentStore` apply this migration and reload records when `DATABASE_URL` is configured; local tests use the in-memory fallback. `MomoReconciliationService` runs pending-record reconciliation on a configurable interval. The existing CI workflow was audited but not altered.

## Testnet evidence

No contracts were deployed and no transactions were generated during this pass. The environment has no Stellar CLI, deployer secret/account, or funded Testnet account. Consequently there are no contract IDs or transaction hashes to report. WASM artifacts were produced and deployment instructions are in `docs/STELLAR_TESTNET_DEPLOYMENT.md`.

## Security findings and fixes

- Positive: no private keys, seed phrases, provider credentials, or production secrets were added.
- Positive: application routes use the API-key guard in production and MoMo webhooks use a dedicated shared-token guard.
- Open: rate limiting and database-backed auditability still need implementation; API-key authentication is now applied to the protected application routes.
- Open: provider credentials and callback verification must be exercised with real sandbox configuration before claiming production-like reliability.
- Open: `npm audit` reports unresolved transitive vulnerabilities; upgrading Nest/Next/tooling should be handled as a dedicated compatibility change.

## External credential blockers

Real MTN MoMo sandbox calls require provider credentials. Real Stellar Testnet evidence requires funded testnet accounts, deployed contract addresses, and a controlled signing flow. The Stellar CLI build was attempted under the repaired Visual Studio toolchain but stopped after an extended compile with no completed binary; no deployment was attempted or simulated. Freighter signing was implemented but not exercised against a funded wallet.

## Items intentionally left for external contributors

The detailed backlog in `docs/GRANTFOX_CONTRIBUTOR_BACKLOG.md` covers Soroban settlement verification, live PostgreSQL CI validation, MoMo-backed USSD, rate limiting, webhook replay claims, and contract invariant coverage. Completed escrow-release, basic persistence, and basic API-authentication drafts were removed from `.github/issues/`.

## Final readiness checklist

- [ ] End-to-end Stellar Testnet payment works
- [x] Escrow create/fund/release/refund/expiry entry points implemented
- [x] Multisig real asset movement entry point implemented
- [x] PostgreSQL persistence and migrations are wired when `DATABASE_URL` is configured
- [x] MoMo state reloads and scheduled reconciliation are wired when configured
- [x] Frontend supports receive, transaction details, and explorer links
- [x] Frontend supports payment intent creation and history
- [x] Existing backend tests pass
- [x] Existing frontend tests pass
- [x] Rust checks pass in the repaired dependency environment
- [x] No fabricated evidence or secrets added
- [x] Contributor backlog is documented
- [x] Stellar WASM artifacts build locally
- [x] Rust clippy passes with warnings denied
- [x] README and architecture/status evidence updated for the implemented paths

## Recommended next actions

1. Configure a funded Testnet deployer and Stellar CLI, deploy each WASM artifact, and record explorer-verified IDs/hashes.
2. Configure PostgreSQL and MTN MoMo sandbox credentials, then exercise migration/reconciliation paths end to end.
3. Run the frontend with Freighter on Testnet and record one verified payment hash.
4. Plan a coordinated Nest 12/Next security upgrade, with compatibility tests before merging.
5. Add CI coverage for database-backed integration tests and the Rust toolchain environment.
