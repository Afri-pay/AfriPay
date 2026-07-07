# gateway contract

Status: implemented

Bridges on-chain payments with off-chain payment-provider webhooks.

## Flow

1. **Init** — the contract is deployed and initialized (`init`) with the
   address of the authorized backend confirmer (the service that
   listens to the payment provider's webhooks).
2. **Create intent** — a payer (or a dApp acting on their behalf, with
   their authorization) calls `create_payment_intent(payer, token,
   amount)`, which records a `Pending` `PaymentIntent` on-chain and
   returns its id.
3. **Off-chain processing** — the payer completes payment through the
   off-chain provider (e.g. card, bank transfer). The provider fires a
   webhook at the backend service once payment succeeds.
4. **Confirm intent** — the backend service, using the address
   configured as the confirmer, calls
   `confirm_payment_intent(confirmer, intent_id)` to mark the intent
   `Confirmed` on-chain. Any other address attempting this call is
   rejected with `NotAuthorized`.

## Public interface

| Function | Description |
|---|---|
| `init(confirmer)` | One-time setup of the authorized confirmer address. |
| `get_confirmer()` | Returns the current authorized confirmer. |
| `set_confirmer(new_confirmer)` | Rotates the confirmer; only callable by the current confirmer. |
| `create_payment_intent(payer, token, amount)` | Records a new `Pending` intent; requires `payer` authorization. Returns the intent id. |
| `confirm_payment_intent(confirmer, intent_id)` | Marks an intent `Confirmed`; only callable by the authorized confirmer. |
| `get_payment_intent(intent_id)` | Reads back a stored intent. |

## Errors

`GatewayError`: `NotInitialized`, `AlreadyInitialized`, `NotAuthorized`,
`IntentNotFound`, `AlreadyConfirmed`, `InvalidAmount`.

## Tests

`src/lib.rs` includes unit tests covering:

- initialization and confirmer rotation,
- successful payment intent creation and validation of the amount,
- **authorized** confirmation succeeding and updating status/timestamp,
- **unauthorized** confirmation attempts being rejected and leaving the
  intent untouched,
- rejecting double confirmation and confirmation of unknown intents.

Run with:

```sh
cargo test -p gateway
```