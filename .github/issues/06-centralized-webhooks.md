## Summary

Centralize provider webhook routing and strengthen replay protection around the existing MoMo handlers.

## Current behavior

MoMo webhook controllers and token validation work independently, and scheduled reconciliation polls pending records. There is no provider-neutral router or durable webhook event claim/check before dispatch.

## Technical scope

- Add a provider router with typed event contracts.
- Record and uniquely claim webhook event IDs before dispatch.
- Preserve existing collection and disbursement endpoints for compatibility.
- Add structured correlation logging and a provider verification matrix.

## Out of scope

Replacing the existing MoMo API client, adding unrelated providers, or weakening the current webhook token guard.

## Acceptance criteria

- Valid MoMo callbacks route to the existing handlers and remain idempotent.
- Invalid tokens and unknown providers are rejected.
- Replayed event IDs do not run domain updates twice.
- Reconciliation and webhook paths share the same legal state-transition rules.

## Tests

Add router tests for valid, invalid, unknown-provider, duplicate-event, and handler-failure cases.

## Security considerations

Use parameterized persistence, verify provider signatures/tokens, redact payloads, and document replay assumptions.

## Difficulty

Intermediate to advanced.

## Likely files/modules

`backend/src/webhooks/`, `backend/src/momo/`, `backend/migrations/001_payment_state.sql`, `SECURITY.md`.
