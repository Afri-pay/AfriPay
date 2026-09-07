## Summary

Wire the **USSD Send Money flow** end-to-end: Africa's Talking callback → AfriPay backend → MTN MoMo sandbox collection → status/webhook → user confirmation via USSD `END` response.

## Background

USSD is AfriPay's feature-phone access path. A menu scaffold exists in `backend/src/ussd/`, but Send Money stops at demo messages. Connecting USSD to MoMo demonstrates real African payment rail integration.

## Current state

- [x] `POST /ussd` with URL-encoded body parsing
- [x] Menu: Send Money, Balance, History, Help
- [x] Multi-step Send Money prompts (recipient → amount → PIN)
- [x] Unit tests in `ussd.controller.spec.ts`
- [ ] Session persistence via `sessionId`
- [ ] MoMo `requestToPay` on flow completion
- [ ] Status polling or webhook-driven USSD follow-up (document MVP choice)

## Technical scope

- `backend/src/ussd/` — session store, inject `MomoService`
- `backend/src/momo/` — reuse collection API (depends on [#32](https://github.com/Afri-pay/AfriPay/issues/32) persistence recommended)
- `backend/.env.example` — Africa's Talking vars
- Integration tests mocking MoMo API

## Requirements

1. Parse `sessionId`, `phoneNumber`, `text` from Africa's Talking payload
2. Persist multi-step session state between USSD requests
3. On Send Money completion, call MoMo collection with sanitized MSISDN and amount
4. Return user-friendly `CON`/`END` messages for pending, success, and failure
5. Never log PIN values

## Acceptance criteria

- [ ] Complete Send Money flow initiates a MoMo sandbox collection
- [ ] Transaction `referenceId`/`externalId` traceable in backend store
- [ ] Invalid input and unknown menu options handled gracefully
- [ ] Tests cover happy path + MoMo failure + invalid input
- [ ] `cd backend && npm test` pass

## Tests

- Extend `ussd.controller.spec.ts`
- Mock `MomoService.requestToPay` success and failure
- Optional: sandbox manual test steps in PR description

## Security considerations

- Validate MSISDN format before MoMo call
- Rate-limit `/ussd` when publicly exposed
- PIN collected for UX only until real auth exists — document limitation

## Definition of done

- PR merged; demo steps in PR or docs for Africa's Talking sandbox callback URL

## Difficulty

**Advanced / Epic** — 750–1000 points

## Related

- Builds on MoMo persistence ([#32](https://github.com/Afri-pay/AfriPay/issues/32)) for durable transaction tracking
- Complements Stellar settlement for full on-chain/off-chain bridge
