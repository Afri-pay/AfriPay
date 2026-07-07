#![no_std]

//! Payment gateway contract.
//!
//! Bridges on-chain payments with off-chain payment-provider webhooks:
//!
//! 1. A payer (or the dApp on their behalf) creates a `PaymentIntent`
//!    on-chain, recording the amount, token and payer for a purchase.
//! 2. The off-chain payment provider processes the payment and, once its
//!    webhook fires, the backend service (an authorized "confirmer"
//!    address configured at contract init) calls `confirm_payment_intent`
//!    to mark the intent as confirmed on-chain.
//!
//! Only the authorized backend signer configured via `init` may confirm
//! a payment intent. Anyone else attempting to confirm is rejected.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env,
};

/// Storage keys used by the contract.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// The address authorized to confirm payment intents (the backend
    /// service that listens to the off-chain payment provider's
    /// webhooks).
    Confirmer,
    /// Monotonically increasing counter used to assign new intent ids.
    IntentCounter,
    /// A single payment intent, keyed by its id.
    Intent(u64),
}

/// Lifecycle state of a payment intent.
#[contracttype]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PaymentStatus {
    Pending,
    Confirmed,
}

/// A record of an on-chain payment intent that is expected to be
/// fulfilled and confirmed via an off-chain payment provider.
#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PaymentIntent {
    pub id: u64,
    pub payer: Address,
    pub token: Address,
    pub amount: i128,
    pub status: PaymentStatus,
    pub created_at: u64,
    pub confirmed_at: u64,
}

/// Errors returned by the contract.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum GatewayError {
    /// The contract has not been initialized with `init`.
    NotInitialized = 1,
    /// The contract has already been initialized.
    AlreadyInitialized = 2,
    /// Caller is not the authorized confirmer.
    NotAuthorized = 3,
    /// No payment intent exists for the given id.
    IntentNotFound = 4,
    /// The payment intent has already been confirmed.
    AlreadyConfirmed = 5,
    /// The requested payment amount was not positive.
    InvalidAmount = 6,
}

#[contract]
pub struct GatewayContract;

#[contractimpl]
impl GatewayContract {
    /// Initialize the contract, setting the address authorized to
    /// confirm payment intents (the backend service).
    ///
    /// Can only be called once.
    pub fn init(env: Env, confirmer: Address) -> Result<(), GatewayError> {
        if env.storage().instance().has(&DataKey::Confirmer) {
            return Err(GatewayError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Confirmer, &confirmer);
        env.storage().instance().set(&DataKey::IntentCounter, &0u64);
        Ok(())
    }

    /// Return the address currently authorized to confirm payment
    /// intents.
    pub fn get_confirmer(env: Env) -> Result<Address, GatewayError> {
        env.storage()
            .instance()
            .get(&DataKey::Confirmer)
            .ok_or(GatewayError::NotInitialized)
    }

    /// Rotate the authorized confirmer address. Only callable by the
    /// current confirmer.
    pub fn set_confirmer(env: Env, new_confirmer: Address) -> Result<(), GatewayError> {
        let current: Address = env
            .storage()
            .instance()
            .get(&DataKey::Confirmer)
            .ok_or(GatewayError::NotInitialized)?;
        current.require_auth();
        env.storage().instance().set(&DataKey::Confirmer, &new_confirmer);
        Ok(())
    }

    /// Record a new payment intent on-chain. Requires the payer's
    /// authorization. Returns the newly created intent's id.
    pub fn create_payment_intent(
        env: Env,
        payer: Address,
        token: Address,
        amount: i128,
    ) -> Result<u64, GatewayError> {
        if !env.storage().instance().has(&DataKey::Confirmer) {
            return Err(GatewayError::NotInitialized);
        }
        if amount <= 0 {
            return Err(GatewayError::InvalidAmount);
        }

        // The payer authorizes the creation of an intent in their name.
        payer.require_auth();

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::IntentCounter)
            .unwrap_or(0);
        let next_id = id + 1;
        env.storage().instance().set(&DataKey::IntentCounter, &next_id);

        let now = env.ledger().timestamp();
        let intent = PaymentIntent {
            id,
            payer,
            token,
            amount,
            status: PaymentStatus::Pending,
            created_at: now,
            confirmed_at: 0,
        };
        env.storage().persistent().set(&DataKey::Intent(id), &intent);

        Ok(id)
    }

    /// Mark a payment intent as confirmed. Callable only by the
    /// authorized backend confirmer address set via `init`/`set_confirmer`.
    ///
    /// This is the function the backend service calls once it receives
    /// and validates a webhook from the off-chain payment provider.
    pub fn confirm_payment_intent(
        env: Env,
        confirmer: Address,
        intent_id: u64,
    ) -> Result<(), GatewayError> {
        let authorized: Address = env
            .storage()
            .instance()
            .get(&DataKey::Confirmer)
            .ok_or(GatewayError::NotInitialized)?;

        if confirmer != authorized {
            return Err(GatewayError::NotAuthorized);
        }
        // Prove the caller genuinely controls the authorized address.
        confirmer.require_auth();

        let mut intent: PaymentIntent = env
            .storage()
            .persistent()
            .get(&DataKey::Intent(intent_id))
            .ok_or(GatewayError::IntentNotFound)?;

        if intent.status == PaymentStatus::Confirmed {
            return Err(GatewayError::AlreadyConfirmed);
        }

        intent.status = PaymentStatus::Confirmed;
        intent.confirmed_at = env.ledger().timestamp();
        env.storage().persistent().set(&DataKey::Intent(intent_id), &intent);

        Ok(())
    }

    /// Fetch a payment intent by id.
    pub fn get_payment_intent(env: Env, intent_id: u64) -> Result<PaymentIntent, GatewayError> {
        env.storage()
            .persistent()
            .get(&DataKey::Intent(intent_id))
            .ok_or(GatewayError::IntentNotFound)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::Env;

    fn setup(env: &Env) -> (Address, GatewayContractClient<'_>) {
        let contract_id = env.register_contract(None, GatewayContract);
        let client = GatewayContractClient::new(env, &contract_id);
        (contract_id, client)
    }

    #[test]
    fn test_init_and_get_confirmer() {
        let env = Env::default();
        env.mock_all_auths();
        let (_id, client) = setup(&env);

        let confirmer = Address::generate(&env);
        client.init(&confirmer);

        assert_eq!(client.get_confirmer(), confirmer);
    }

    #[test]
    fn test_double_init_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (_id, client) = setup(&env);

        let confirmer = Address::generate(&env);
        client.init(&confirmer);

        let result = client.try_init(&confirmer);
        assert_eq!(result, Err(Ok(GatewayError::AlreadyInitialized)));
    }

    #[test]
    fn test_create_payment_intent() {
        let env = Env::default();
        env.mock_all_auths();
        let (_id, client) = setup(&env);

        let confirmer = Address::generate(&env);
        client.init(&confirmer);

        let payer = Address::generate(&env);
        let token = Address::generate(&env);

        let intent_id = client.create_payment_intent(&payer, &token, &1_000i128);
        assert_eq!(intent_id, 0);

        let intent = client.get_payment_intent(&intent_id);
        assert_eq!(intent.payer, payer);
        assert_eq!(intent.token, token);
        assert_eq!(intent.amount, 1_000i128);
        assert_eq!(intent.status, PaymentStatus::Pending);
    }

    #[test]
    fn test_create_payment_intent_rejects_non_positive_amount() {
        let env = Env::default();
        env.mock_all_auths();
        let (_id, client) = setup(&env);

        let confirmer = Address::generate(&env);
        client.init(&confirmer);

        let payer = Address::generate(&env);
        let token = Address::generate(&env);

        let result = client.try_create_payment_intent(&payer, &token, &0i128);
        assert_eq!(result, Err(Ok(GatewayError::InvalidAmount)));
    }

    #[test]
    fn test_authorized_confirmation_succeeds() {
        let env = Env::default();
        env.mock_all_auths();
        let (_id, client) = setup(&env);

        let confirmer = Address::generate(&env);
        client.init(&confirmer);

        let payer = Address::generate(&env);
        let token = Address::generate(&env);
        let intent_id = client.create_payment_intent(&payer, &token, &500i128);

        // Advance the ledger so confirmed_at differs from created_at,
        // demonstrating the timestamp is actually recorded.
        env.ledger().with_mut(|l| l.timestamp += 60);

        client.confirm_payment_intent(&confirmer, &intent_id);

        let intent = client.get_payment_intent(&intent_id);
        assert_eq!(intent.status, PaymentStatus::Confirmed);
        assert!(intent.confirmed_at > 0);
    }

    #[test]
    fn test_unauthorized_confirmation_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (_id, client) = setup(&env);

        let confirmer = Address::generate(&env);
        client.init(&confirmer);

        let payer = Address::generate(&env);
        let token = Address::generate(&env);
        let intent_id = client.create_payment_intent(&payer, &token, &500i128);

        // A random, unrelated address tries to confirm the intent.
        let attacker = Address::generate(&env);
        let result = client.try_confirm_payment_intent(&attacker, &intent_id);
        assert_eq!(result, Err(Ok(GatewayError::NotAuthorized)));

        // The intent must remain untouched.
        let intent = client.get_payment_intent(&intent_id);
        assert_eq!(intent.status, PaymentStatus::Pending);
        assert_eq!(intent.confirmed_at, 0);
    }

    #[test]
    fn test_cannot_confirm_twice() {
        let env = Env::default();
        env.mock_all_auths();
        let (_id, client) = setup(&env);

        let confirmer = Address::generate(&env);
        client.init(&confirmer);

        let payer = Address::generate(&env);
        let token = Address::generate(&env);
        let intent_id = client.create_payment_intent(&payer, &token, &500i128);

        client.confirm_payment_intent(&confirmer, &intent_id);

        let result = client.try_confirm_payment_intent(&confirmer, &intent_id);
        assert_eq!(result, Err(Ok(GatewayError::AlreadyConfirmed)));
    }

    #[test]
    fn test_confirm_nonexistent_intent_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (_id, client) = setup(&env);

        let confirmer = Address::generate(&env);
        client.init(&confirmer);

        let result = client.try_confirm_payment_intent(&confirmer, &42u64);
        assert_eq!(result, Err(Ok(GatewayError::IntentNotFound)));
    }

    #[test]
    fn test_set_confirmer_rotation() {
        let env = Env::default();
        env.mock_all_auths();
        let (_id, client) = setup(&env);

        let confirmer = Address::generate(&env);
        client.init(&confirmer);

        let new_confirmer = Address::generate(&env);
        client.set_confirmer(&new_confirmer);
        assert_eq!(client.get_confirmer(), new_confirmer);

        // Old confirmer can no longer confirm intents.
        let payer = Address::generate(&env);
        let token = Address::generate(&env);
        let intent_id = client.create_payment_intent(&payer, &token, &10i128);

        let result = client.try_confirm_payment_intent(&confirmer, &intent_id);
        assert_eq!(result, Err(Ok(GatewayError::NotAuthorized)));

        // New confirmer can.
        client.confirm_payment_intent(&new_confirmer, &intent_id);
        let intent = client.get_payment_intent(&intent_id);
        assert_eq!(intent.status, PaymentStatus::Confirmed);
    }
}