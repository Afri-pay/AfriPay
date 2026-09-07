## Summary

Implement a **centralized webhook and reconciliation service** that validates provider callbacks and routes them to domain handlers (MoMo, future KYC, etc.).

## Background

MTN MoMo webhooks live under `backend/src/momo/` with token verification. As AfriPay adds providers, duplicating auth and routing logic does not scale. A single entry point improves security review and contributor clarity.

## Current state

- [x] `MomoWebhookGuard` + collection/disbursement callback handlers
- [x] In-memory status upsert on webhook delivery
- [ ] `backend/src/webhooks/` module (stub only)
- [ ] Provider router with typed dispatch
- [ ] Reconciliation job/pattern for missed webhooks

## Technical scope

- `backend/src/webhooks/webhooks.module.ts` — controller + router service
- Refactor MoMo webhooks to delegate through router (keep backward-compatible paths or redirect)
- Reconciliation: poll pending transactions older than N minutes (optional follow-up in same or second PR)
- `SECURITY.md` — per-provider verification matrix

## Requirements

1. Route `/webhooks/momo/collection` and `/webhooks/momo/disbursement` (or equivalent) through centralized module
2. Reject unknown providers and invalid auth
3. Preserve existing MoMo webhook behavior (all current tests pass)
4. Structured logging with `referenceId` / `externalId` correlation
5. Document extension point for future providers

## Acceptance criteria

- [ ] Valid MoMo webhook updates transaction status (existing specs green)
- [ ] Missing/invalid token → 401
- [ ] Unknown provider path → 404 or 400
- [ ] New unit tests for router
- [ ] Optional: reconciliation script or cron hook documented

## Tests

- Keep `momo-webhook.controller.spec.ts` passing
- Add `webhooks/*.spec.ts` for routing and auth failures

## Security considerations

- Never log webhook secrets
- Document replay-protection gap if not implemented in v1
- Idempotent handler dispatch (safe under duplicate delivery)

## Definition of done

- PR merged; SECURITY.md webhook section updated

## Difficulty

**Medium** — 500 points
