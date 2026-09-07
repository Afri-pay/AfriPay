## Summary

Replace the in-memory MTN MoMo transaction store with **PostgreSQL persistence**, durable transaction state, and **idempotency** for collection/disbursement requests.

## Background

`MomoTransactionStore` keeps transactions in a process-local `Map`. Restarts lose state, webhooks may race with polls, and duplicate `externalId` requests are not safely deduplicated. Durable storage is required for a credible payment infrastructure project.

## Current state

- [x] MTN MoMo collection, disbursement, status refresh, webhooks
- [x] In-memory store with upsert by `referenceId`
- [x] Webhook token guard
- [x] 38+ backend tests passing with in-memory store
- [ ] TypeORM entity + migration for transactions
- [ ] Idempotency on `externalId` + operation type
- [ ] AppModule database connection

## Technical scope

- `backend/src/momo/momo-transaction.store.ts` — refactor to PostgreSQL-backed repository
- New TypeORM entity (e.g. `MomoTransaction`)
- `backend/src/app.module.ts` — configure TypeORM + `DATABASE_URL`
- Migration script or documented schema
- Update existing momo specs to use test DB or repository mock
- `backend/.env.example` — `DATABASE_URL`

## Requirements

1. Persist: `referenceId`, `type`, `status`, `amount`, `currency`, `externalId`, `partyId`, timestamps, optional `reason`
2. **Idempotency:** duplicate `requestToPay`/`transfer` with same `externalId` returns existing record (HTTP 200/409 — document choice)
3. Webhook upsert must be safe under duplicate delivery
4. Status transitions: `PENDING` → `SUCCESSFUL` | `FAILED` (match MTN semantics)
5. Graceful behavior when DB unavailable (typed error, no silent data loss)

## Acceptance criteria

- [ ] Transactions survive backend restart
- [ ] Duplicate `externalId` does not create duplicate charge attempts (or returns existing pending record)
- [ ] All existing `momo/*.spec.ts` tests pass (updated as needed)
- [ ] Migration or schema documented in README/CONTRIBUTING
- [ ] `cd backend && npm test && npm run build` pass

## Tests

- Unit tests with mocked repository or in-memory SQLite for CI
- Idempotency: same externalId twice → one logical transaction
- Webhook duplicate delivery → idempotent status update

## Security considerations

- Do not store MSISDN in logs at info level in production
- Parameterized queries only (TypeORM default)
- Database credentials via env only

## Definition of done

- PR merged; backend CI green
- SECURITY.md updated: MoMo store no longer in-memory

## Difficulty

**Advanced** — 750 points
