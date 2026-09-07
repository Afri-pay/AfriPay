# AfriPay Contributor Backlog

This backlog describes legitimate engineering work discovered during the GrantFox readiness audit. It is a planning artifact only; none of these entries imply an existing GitHub issue, contributor, PR, or completed work.

## Implement a Stellar testnet payment settlement service

**Problem/context:** The repository has wallet connection UI, but no backend payment-intent or Stellar submission path. A reviewer cannot complete a payment from the UI to a persisted testnet transaction.

**Technical scope:** Add an idempotent payment-intent API, transaction persistence, Soroban transaction construction, Freighter signing handoff, Horizon/RPC submission, status polling, and explorer links. Keep private keys out of the backend.

**Out of scope:** Mainnet support, custodial wallets, seed phrases, or production payment-provider guarantees.

**Acceptance criteria:** A funded testnet account can create, sign, submit, and inspect one payment; duplicate idempotency keys return the original intent; rejected and failed transactions have terminal states; successful records contain a verified hash.

**Tests:** Service unit tests with Stellar SDK mocks, idempotency tests, rejected-signature tests, RPC failure tests, and one opt-in testnet smoke test requiring explicit credentials.

**Security considerations:** Validate network and asset identifiers, never log signed envelopes or secrets, enforce recipient/amount bounds, and require an authenticated caller for server-side state changes.

**Difficulty:** Expert.

**Likely files/modules:** `backend/src/payments/`, `backend/src/stellar/`, `frontend/src/`, database migrations, CI, and README testnet evidence.

## Complete escrow token movement and lifecycle tests

**Problem/context:** The escrow crate currently creates records but does not fund, release, refund, expire, or move an asset.

**Technical scope:** Define explicit states, token contract address, expiry semantics, authorized actors, and replay protection. Add Soroban token test fixtures and events.

**Out of scope:** Arbitrary multi-asset exchange or dispute arbitration.

**Acceptance criteria:** Fund, release, refund, expiry, unauthorized calls, invalid amounts, and every terminal-state replay are covered by contract tests; balances change exactly once.

**Tests:** Soroban unit tests for all transitions and token balances, plus an optional CLI testnet invocation.

**Security considerations:** Require authorization at the state-changing actor, reject zero/negative amounts, and avoid ambiguous expiry boundaries.

**Difficulty:** Advanced.

**Likely files/modules:** `contracts/escrow/src/lib.rs`, contract snapshots, `contracts/README.md`.

## Make multisig execute token transfers

**Problem/context:** Multisig approval currently marks a proposal executed but does not move an asset.

**Technical scope:** Add an asset-aware proposal path, signer authorization, threshold checks, duplicate approval protection, one-time execution, and execution events.

**Out of scope:** DAO governance, arbitrary contract call encoding, or mainnet deployment.

**Acceptance criteria:** Reaching threshold transfers the requested amount to the recipient exactly once; non-signers cannot approve; duplicate approvals and repeated execution fail.

**Tests:** Threshold 1/N, outsider, duplicate signer, insufficient balance, and repeated execution tests with a Soroban token fixture.

**Security considerations:** Validate positive amounts and signer set uniqueness; protect initialization and ensure the contract is the transfer authority.

**Difficulty:** Advanced.

**Likely files/modules:** `contracts/multisig/src/lib.rs`, contract snapshots, deployment docs.

## Replace MoMo in-memory state with PostgreSQL

**Problem/context:** MoMo records disappear on restart and duplicate callbacks are not backed by a durable uniqueness constraint.

**Technical scope:** Add a TypeORM/SQL schema for transactions and webhook events, unique external/reference identifiers, legal status transitions, transaction boundaries, and a reconciliation query/service.

**Out of scope:** Live provider credentials or pretending sandbox calls succeeded.

**Acceptance criteria:** Restart preserves records; duplicate callbacks are no-ops; invalid backward transitions are rejected; pending records can be reconciled through provider polling.

**Tests:** Repository integration tests against PostgreSQL, duplicate webhook tests, transition matrix tests, and provider mocks.

**Security considerations:** Store no MoMo secrets in rows or logs, verify callbacks, and redact provider payloads.

**Difficulty:** Advanced.

**Likely files/modules:** `backend/src/momo/`, `backend/src/database/`, migrations, `.env.example`, CI services.

## Build a persistent USSD session engine

**Problem/context:** The current controller parses text but does not persist session state or initiate a real payment.

**Technical scope:** Model session ID, phone identifier, current step, validated inputs, expiry, safe restart, and a provider adapter for MoMo.

**Out of scope:** Storing or authenticating a PIN as a payment credential.

**Acceptance criteria:** Repeated callbacks resume the correct session; malformed input and expired sessions terminate safely; successful input creates a traceable pending payment.

**Tests:** State-machine transition tests, expiry tests, replay tests, and mocked MoMo success/failure tests.

**Security considerations:** Never log PIN input, validate MSISDN and amounts, verify provider callback signatures, and rate-limit the public endpoint.

**Difficulty:** Advanced.

**Likely files/modules:** `backend/src/ussd/`, `backend/src/momo/`, session migration, simulator UI.

## Add API authentication and abuse controls

**Problem/context:** Most backend routes are currently unauthenticated, which is unsafe for a public deployment.

**Technical scope:** Add API-key or JWT guards, route-level policy, webhook exceptions, request validation, and rate limits.

**Out of scope:** Full user identity/KYC product design.

**Acceptance criteria:** Protected routes reject missing/invalid credentials; public health and documented provider callbacks remain usable; errors do not leak secrets.

**Tests:** Guard unit tests, authorized/unauthorized controller tests, and rate-limit tests.

**Security considerations:** Environment-only secrets, rotation guidance, constant-time comparisons where applicable, and safe auth-failure logs.

**Difficulty:** Medium/Hard.

**Likely files/modules:** `backend/src/auth/`, `backend/src/main.ts`, controllers, `SECURITY.md`.

## Publish OpenAPI and verified testnet evidence

**Problem/context:** The project needs developer-readable API contracts and reproducible evidence without inventing deployment data.

**Technical scope:** Add Swagger/OpenAPI schemas, error examples, local setup, deployment commands, and a clearly marked testnet evidence section populated only after actual execution.

**Out of scope:** Publishing secrets or unverified hashes.

**Acceptance criteria:** A clean clone can start the documented services; API docs match routes; every contract ID/hash links to a real explorer record or is explicitly marked unavailable.

**Tests:** Documentation smoke check and clean-clone CI job.

**Security considerations:** Redact credentials and identify all testnet-only assumptions.

**Difficulty:** Intermediate.

**Likely files/modules:** `backend/src/`, `README.md`, `docs/`, CI.
