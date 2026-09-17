## Summary

Connect the existing in-memory USSD send-money session state machine to a real MoMo collection adapter and durable payment state.

## Current behavior

USSD sessions currently live in an in-memory map and validate menu input, recipient, amount, expiry, and replay behavior. The flow does not yet persist payment state, initiate a real MoMo request-to-pay operation, or expose a provider-backed pending/success/failure response.

## Technical scope

- Inject the existing `MomoService` through an explicit USSD payment adapter.
- Persist a traceable payment reference for completed sessions.
- Map pending, successful, failed, and provider-timeout states to safe `CON`/`END` responses.
- Add sandbox-mock integration tests.

## Out of scope

PIN-based authentication, storing PINs, new mobile-money providers, or claiming a live sandbox flow without credentials.

## Acceptance criteria

- A valid completed session creates exactly one MoMo request with an idempotent external ID.
- Duplicate callbacks and retries do not double-credit or create a second request.
- Invalid input, provider rejection, timeout, and pending states return documented responses.
- No PIN or provider secret is logged.

## Tests

Mock MoMo success, failure, timeout, duplicate request, duplicate callback, and expired-session cases.

## Security considerations

Verify provider callbacks, rate-limit the public endpoint, validate MSISDN format, and never treat a USSD PIN as a payment credential.

## Difficulty

Advanced.

## Likely files/modules

`backend/src/ussd/`, `backend/src/momo/`, `backend/migrations/001_payment_state.sql`.
