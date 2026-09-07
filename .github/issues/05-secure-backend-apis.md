## Summary

Add **authentication, authorization, and rate limiting** to AfriPay backend API routes before public deployment.

## Background

Health, rates, MoMo, and USSD endpoints are currently unauthenticated. SECURITY.md documents this as a known gap. Payment infrastructure exposed to the internet requires API keys or JWT auth and basic abuse protection.

## Current state

- [x] MoMo webhooks protected by `MomoWebhookGuard` (shared token)
- [ ] API authentication for `/momo/*`, `/rates/*`, `/ussd`
- [ ] Role-based authorization (admin vs service vs read-only)
- [ ] Rate limiting middleware
- [ ] Request validation hardening

## Technical scope

- New `backend/src/auth/` module (or NestJS guards)
- `@UseGuards()` on sensitive controllers
- Rate limiting (e.g. `@nestjs/throttler` or express-rate-limit)
- `backend/.env.example` — `API_KEY` or JWT secret placeholders
- Update tests for 401/403/429 responses
- `SECURITY.md` — document auth model

## Requirements

1. Protect MoMo collection/disbursement endpoints (service API key minimum)
2. Optional: public read-only rates with stricter rate limits
3. USSD endpoint: validate Africa's Talking signature or shared secret if available
4. Consistent error responses (no stack traces in production)
5. Document which routes remain public (`/health`)

## Acceptance criteria

- [ ] Unauthenticated calls to protected routes return 401
- [ ] Invalid API key returns 401
- [ ] Rate limit returns 429 after threshold (test with lowered limit)
- [ ] Existing webhook tests still pass
- [ ] `cd backend && npm test && npm run lint` pass

## Tests

- Guard unit tests
- Controller integration tests: authorized vs unauthorized
- Rate limit test with mock clock or low threshold

## Security considerations

- API keys via env only; support rotation
- Do not break webhook token auth when adding global guards
- Log auth failures without leaking keys

## Definition of done

- PR merged; SECURITY.md updated with implemented vs planned auth

## Difficulty

**Medium / Hard** — 500–750 points
