# GrantFox Contributor Backlog

This backlog contains legitimate work remaining after the readiness implementation. It is a planning artifact, not evidence of published GitHub activity.

## 1. Complete Soroban Gateway Settlement Verification

**Problem/context:** The backend currently builds and submits native XLM payments on Testnet, but the deployed payment-gateway contract invocation and confirmation path need a complete Soroban RPC integration.

**Technical scope:** Add Testnet-only Soroban invocation helpers, transaction polling, terminal-state mapping, and mocked RPC tests. Preserve Freighter user signing and add a manual evidence runbook.

**Out of scope:** Mainnet, custodial private keys, or fabricated deployment evidence.

**Acceptance criteria:** A payment intent produces a gateway invocation XDR, Freighter can sign it, the backend submits and polls it, and failures map to explicit states.

**Tests:** Mock success, rejection, timeout, malformed response, and polling cases; perform one real Testnet verification when credentials are available.

**Security considerations:** Keep secrets out of logs, enforce Testnet, and never move user signing server-side.

**Difficulty:** Advanced.

**Likely files/modules:** `backend/src/stellar/`, `backend/src/payments/`, `frontend/src/components/Payments/`.

## 2. Validate Live PostgreSQL Persistence in CI

**Problem/context:** PostgreSQL repositories and migrations are implemented, but CI does not yet run a real database and restart-survival test.

**Technical scope:** Add a PostgreSQL service, migration smoke test, persisted payment-intent/history test, and restart/reload verification.

**Out of scope:** Committing credentials, replacing the repository with an ORM without need, or silently falling back when configured.

**Acceptance criteria:** CI starts PostgreSQL, applies migrations, writes an intent, reloads it after repository restart, and fails clearly on connection/schema errors.

**Tests:** Migration idempotency, unique idempotency key, state update, link persistence, and restart reload.

**Security considerations:** Use ephemeral CI credentials and redact connection strings.

**Difficulty:** Advanced.

**Likely files/modules:** `backend/migrations/`, `backend/src/payments/payment-intent.store.ts`, `.github/workflows/ci.yml`.

## 3. Complete MoMo-Backed USSD Send Money

**Problem/context:** USSD session validation and persistence exist, but a completed session does not yet call a real MoMo collection adapter.

**Technical scope:** Add an explicit adapter, traceable idempotent external ID, provider-state mapping, and safe `CON`/`END` responses.

**Out of scope:** PIN authentication, new providers, or claiming sandbox success without credentials.

**Acceptance criteria:** Valid sessions create one request; retries and callbacks are idempotent; pending, failure, timeout, and success responses are documented.

**Tests:** Mock provider success, failure, timeout, duplicate request, duplicate callback, and expiry.

**Security considerations:** Validate MSISDN, verify callbacks, rate-limit the endpoint, and never log PIN input.

**Difficulty:** Advanced.

**Likely files/modules:** `backend/src/ussd/`, `backend/src/momo/`, `backend/migrations/001_payment_state.sql`.

## 4. Add API Rate Limiting and Route Policy Tests

**Problem/context:** API-key authentication protects application routes, but rate limiting and a complete route policy matrix are still needed before public exposure.

**Technical scope:** Add rate limiting, document public/provider routes, preserve webhook guards, and add unauthorized/authorized/throttled tests.

**Out of scope:** Full user identity or KYC design.

**Acceptance criteria:** Protected routes reject missing/invalid keys, documented public routes remain usable, and repeated abuse receives a bounded response.

**Tests:** Guard matrix, rate-limit tests with a fake clock, webhook compatibility, and error-redaction tests.

**Security considerations:** Environment-only secrets, constant-time comparisons, rotation guidance, and no credential logging.

**Difficulty:** Intermediate.

**Likely files/modules:** `backend/src/auth/`, `backend/src/main.ts`, controllers, `SECURITY.md`.

## 5. Centralize Webhook Routing and Replay Claims

**Problem/context:** MoMo webhook endpoints work, but provider routing and durable event claiming are not centralized.

**Technical scope:** Add a typed provider router, unique webhook event claim before dispatch, compatibility routes, and structured correlation logs.

**Out of scope:** Replacing the MoMo client or weakening token verification.

**Acceptance criteria:** Valid callbacks route once, replayed event IDs are no-ops, invalid providers/tokens are rejected, and reconciliation shares legal transitions.

**Tests:** Valid, invalid, unknown-provider, duplicate-event, handler-failure, and race cases.

**Security considerations:** Parameterized queries, payload redaction, provider verification matrix, and documented replay assumptions.

**Difficulty:** Intermediate to advanced.

**Likely files/modules:** `backend/src/webhooks/`, `backend/src/momo/`, `backend/migrations/001_payment_state.sql`.

## 6. Add Contract Invariant and Event Coverage

**Problem/context:** Escrow and multisig behavior now has lifecycle and transfer entry points, but broader invariant and event coverage is still valuable before deployment.

**Technical scope:** Add authorization/state-transition matrices, event assertions, insufficient-balance cases, and property-based or generated scenario tests where practical.

**Out of scope:** New DeFi products, governance, or mainnet deployment.

**Acceptance criteria:** Invalid transitions, duplicate execution, expiry boundaries, signer uniqueness, and balance limits are covered with readable failures.

**Tests:** Soroban unit tests plus generated multi-step scenarios where supported by the SDK.

**Security considerations:** Validate all amounts and authorities; do not claim an audit from tests alone.

**Difficulty:** Advanced.

**Likely files/modules:** `contracts/escrow/`, `contracts/multisig/`, `contracts/gateway/`, contract snapshots.
