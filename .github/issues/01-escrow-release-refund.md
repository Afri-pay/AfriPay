## Summary

Implement on-chain **release** and **refund** paths for the Soroban escrow contract so escrowed payments can be settled to the recipient or returned to the sender under explicit authorization rules.

## Background

`contracts/escrow/` currently supports `create_payment` with sender authorization and persistent storage, but there is no way to release funds to the recipient or refund the sender. This blocks any real P2P escrow or marketplace use case and is a core gap for AfriPay's Stellar/Soroban story.

## Current state

- [x] `create_payment(amount, sender, recipient)` with `sender.require_auth()`
- [x] Payments stored with `released: false`
- [x] Tests for success and invalid amount
- [ ] `release_payment(payment_id)` — transfer/settle to recipient
- [ ] `refund_payment(payment_id)` — return to sender
- [ ] Authorization rules (who may release vs refund)
- [ ] Events for release/refund
- [ ] Failure cases: double release, unauthorized caller, not found

## Technical scope

- `contracts/escrow/src/lib.rs` — release/refund functions, state transitions
- `contracts/escrow/` — extend tests (happy path + failure cases)
- `contracts/escrow/README.md` — document lifecycle and auth assumptions
- Optional: token transfer integration once asset interface is chosen (document if out of scope for first PR)

## Requirements

1. Define escrow lifecycle states (e.g. `Pending` → `Released` | `Refunded`)
2. Only authorized parties may release or refund (document and enforce via `require_auth()`)
3. Prevent double release/refund (`AlreadyReleased` or equivalent)
4. Emit Soroban events on state transitions (if events pattern exists in repo)
5. Add comprehensive unit tests for all error paths

## Acceptance criteria

- [ ] `release_payment` succeeds when called by authorized party on pending payment
- [ ] `refund_payment` succeeds when called by authorized party on pending payment
- [ ] Unauthorized addresses are rejected
- [ ] Second release/refund attempt fails with typed error
- [ ] `cargo test` and `cargo clippy` pass in `contracts/`
- [ ] README updated with escrow lifecycle diagram

## Tests

```bash
cd contracts && cargo test -p escrow
cd contracts && cargo clippy --all-targets --all-features -- -D warnings
```

Cover: success release, success refund, unauthorized caller, already released, payment not found, invalid state.

## Security considerations

- Clearly document who can release vs refund (sender-only refund? mutual? admin?)
- Use `require_auth()` for every state-changing call
- Validate payment exists before state transition
- Do not allow arithmetic underflow on amounts

## Definition of done

- PR merged with passing CI Contracts job
- No claim of independent audit
- Escrow lifecycle documented honestly in contract README

## Difficulty

**Advanced** — 750 points
