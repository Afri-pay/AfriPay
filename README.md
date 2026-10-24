# AfriPay

AfriPay is open-source payment infrastructure exploring cross-border payments for African users through Stellar, a native browser wallet, and mobile-money/USSD adapters.

**Stellar Testnet only. No real-money processing or Mainnet readiness is claimed.** Testnet XLM has no monetary value. Operational recovery, browser/provider validation, and independent review remain open.

- [Application](https://afri-pay-beta.vercel.app/) and [API health](https://afripay-api-seven.vercel.app/health) are existing deployments; this branch is not deployed.
- [Verified audit](docs/CURRENT_STATE_AUDIT.md), [current validation](PROJECT_READINESS_REPORT.md), [security findings](docs/SECURITY_REMEDIATION_REPORT.md), [remaining work](docs/REMAINING_WORK.md).

## What works and what remains

| Area | Verified implementation / limits |
|---|---|
| Native wallet | Create/import Stellar keys, AES-GCM/PBKDF2 local encryption, backup, unlock/lock/removal, address QR |
| XLM payment | Activated-account/reserve/liability/fee checks; exact review and local signing; durable intent/hash binding; independent Horizon confirmation; history/explorer links |
| Real Testnet evidence | [October 23 payment](https://stellar.expert/explorer/testnet/tx/83f99505a45062c47d1ea4ca2d81dc2ea0f85f90b562dac20d979d73201251e2); wallet/backend library test, not deployed/browser E2E proof |
| Payment links | Expiring create/read API and /pay/[id] resolution into native wallet; browser E2E remains pending |
| Persistence | Awaited PostgreSQL operations with uniqueness and conditional updates; actual concurrency/restart tests |
| Soroban | Gateway trusted-confirmer records; escrow token lifecycle; multisig token transfers; simulated vault arithmetic |
| MTN MoMo | Sandbox client/auth/status/callbacks with test coverage; no credential-backed provider success recorded |
| USSD | Guarded menu demonstration; no real transfer, verified account balance/history, or PIN authentication |
| KYC/notifications/i18n | Incomplete or absent; see issues and remaining-work report |

Stellar supplies public transaction evidence and native XLM settlement. Soroban enables programmable authorization and asset transfers, but native XLM sends do not invoke the contracts. The gateway is a trusted attestation model, and the vault is not asset-backed savings or a real yield product. MoMo-to-Stellar bridging is unfinished.

## Architecture

Next.js 15 / React 19 browser wallet -> NestJS 12 API -> PostgreSQL metadata and Stellar Testnet Horizon/RPC. MoMo sandbox and exchange-rate providers are separate backend integrations. Optional Redis caches rates. Four Rust/Soroban SDK 22 crates live in contracts/.

Keys are generated/imported, encrypted, and used for signing locally. APIs receive public addresses and signed envelopes, never raw seeds. Public wallet intent/link routes do not require a browser service credential. MoMo/rates/USSD operations retain service-key guards; never publish API_KEY as NEXT_PUBLIC_API_KEY.

## Local setup

Use Node 24.9+ (Node 24 LTS in CI), npm, PostgreSQL 16 for durable metadata, and Rust with the wasm32v1-none target for contracts. The locked Rust graph needs at least Rust 1.88; CI pins a tested container image. Testnet internet access is needed for live Stellar workflows.

From each workspace:

```sh
cd backend
npm ci --ignore-scripts
cp .env.example .env
# Set DATABASE_URL and service/provider credentials only in your local .env.
# Apply migrations explicitly against the intended local/staging database:
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/001_payment_state.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/002_payment_hash_uniqueness.sql
npm run dev
```

Inspect duplicate historical transaction hashes before migration 002; the unique index deliberately fails instead of deleting records. Back up shared databases first. Production refuses an unset DATABASE_URL and does not automatically apply migrations. The in-memory mode is for isolated local/tests only.

In another terminal:

```sh
cd frontend
npm ci --ignore-scripts
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3101
npm run dev
```

PowerShell users can use Copy-Item instead of cp. Backend dev explicitly loads .env; deployed environments supply variables through the host. Default ports: frontend 3000, backend 3101.

## Wallet workflow

Create/import a disposable Testnet wallet, choose a long unique password, back up the secret offline, fund with Friendbot, then load its real balance. Enter an activated recipient, amount and memo. Review the full address, amount, dynamically fetched fee and network before confirming. Signing remains local.

Submission is not settlement. Uncertain payments remain PENDING and should be checked/retried with the same envelope. A stored pending ID blocks a fresh payment after refresh until its status is resolved. Automatic expiry recovery is unfinished; do not manually clear pending state without checking chain history. Source-key XLM payments are supported; custom thresholds/fee-bumps/muxed addresses are not.

## Validation

```sh
cd backend
npm test -- --runInBand
npm run lint
npm run typecheck
npm run build
# Isolated PostgreSQL only, never a production DATABASE_URL:
TEST_DATABASE_URL=postgresql://... npm test -- --runInBand

cd ../frontend
npm test -- --runInBand
npm run lint
NEXT_PUBLIC_API_URL=http://localhost:3101 npm run build
npm run typecheck

cd ../contracts
cargo test --locked
cargo fmt --check
cargo clippy --locked --all-targets --all-features -- -D warnings
rustup target add wasm32v1-none
cargo build --locked --target wasm32v1-none --release
```

Set environment variables with $env:NAME='value' in PowerShell. PostgreSQL integration tests explicitly skip without TEST_DATABASE_URL; CI supplies an isolated database. The security job runs pattern-based history scanning and npm advisory gates. The final npm advisory checks report zero findings in both workspaces. Hosted CI status must still be checked separately.

See [TESTNET_PAYMENT_EVIDENCE](docs/TESTNET_PAYMENT_EVIDENCE.md) for explicit opt-in live-test reproduction. Ordinary CI never submits a Testnet payment.

## Deployment and security

Local changes need a separately authorized deployment. Configure the public API URL, exact frontend origin, Testnet network, durable database and service credentials through the hosting platform. The public health route is liveness/configuration, not proof of database readiness. Vercel in-process reconciliation timers are not durable scheduling.

A production nonce CSP protects script execution; inline styles remain allowed. Browser storage encryption cannot protect an unlocked device, malicious extension, malware or all XSS, and deletion does not guarantee forensic erasure. There has been no independent security audit. No Mainnet or production mobile-money processing is enabled.

Historical contract deployments and the new-WASM deployment/migration review are in [STELLAR_TESTNET_DEPLOYMENT](docs/STELLAR_TESTNET_DEPLOYMENT.md). Updated contracts were not deployed automatically.

## Contributors

Read [CONTRIBUTING](CONTRIBUTING.md), [SECURITY](SECURITY.md), [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md), and the scoped [remaining engineering work](docs/REMAINING_WORK.md). Existing issues were reconciled with code; unfinished issues remain open. Funding acceptance is discretionary; no adoption or activity metrics are fabricated.

MIT licensed; see [LICENSE](LICENSE).