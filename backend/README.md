# Backend

NestJS + TypeORM + PostgreSQL + Redis service.

- `src/api/` — REST API routes
- `src/payments/` — Payment processing
- `src/stellar/` — Blockchain integration
- `src/momo/` — Mobile money services (MTN MoMo collections + disbursements, see below)
- `src/ussd/` — USSD gateway
- `src/kyc/` — KYC/compliance
- `src/rates/` — Exchange rates
- `src/notifications/` — SMS, push, email
- `src/webhooks/` — Provider webhooks
- `migrations/` — Database migrations

**Status:** scaffolding in place, modules in progress. See open issues labeled `backend`.

## Mobile Money (MTN MoMo)

`src/momo/` implements the MTN MoMo Collections and Disbursements APIs.

- `POST /momo/collections` — request a payment from a customer's MTN wallet (Collections).
- `GET /momo/collections/:referenceId` — poll MTN for the latest status of a collection.
- `POST /momo/disbursements` — send a payout to an MTN wallet (Disbursements).
- `GET /momo/disbursements/:referenceId` — poll MTN for the latest status of a disbursement.
- `POST /momo/webhook/collection` / `POST /momo/webhook/disbursement` — receive MTN's
  asynchronous callback once a transaction reaches a final state (`SUCCESSFUL`/`FAILED`).

MTN MoMo access tokens are fetched via the Collections/Disbursements `token/` endpoints
using Basic auth and cached in memory until shortly before they expire.

Since MTN does not cryptographically sign its callback payloads, the webhook endpoints are
protected with a shared secret appended as a `?token=` query parameter on the callback URL
you register with MTN (`MTN_MOMO_WEBHOOK_TOKEN`). If unset, verification is skipped — only
do this for local sandbox testing.

Transactions are currently tracked in an in-memory store (`MomoTransactionStore`) keyed by
the `X-Reference-Id` we generate, with a reverse lookup by `externalId` for webhook
reconciliation. See required env vars in `.env.example` (prefixed `MTN_MOMO_`).
