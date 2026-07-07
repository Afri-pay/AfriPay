#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env};

// ---------------------------------------------------------------------------
// Storage key enum
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// The one address that is allowed to confirm payment intents.
    BackendSigner,
    /// Monotonically-increasing counter used to derive intent IDs.
    NextId,
    /// Per-intent record keyed by its u64 ID.
    Intent(u64),
}

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PaymentStatus {
    Pending,
    Confirmed,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct PaymentIntent {
    pub sender: Address,
    pub recipient: Address,
    pub amount: i128,
    pub status: PaymentStatus,
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    /// Contract has already been initialised.
    AlreadyInitialized = 1,
    /// Contract has not been initialised yet.
    NotInitialized = 2,
    /// Amount must be a positive integer.
    InvalidAmount = 3,
    /// No intent exists for the supplied ID.
    IntentNotFound = 4,
    /// The intent has already been confirmed.
    AlreadyConfirmed = 5,
    /// Caller is not the authorised backend signer.
    Unauthorized = 6,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct GatewayContract;

#[contractimpl]
impl GatewayContract {
    // -----------------------------------------------------------------------
    // Initialisation
    // -----------------------------------------------------------------------

    /// Set the authorised backend signer.  Must be called exactly once.
    pub fn initialize(env: Env, backend_signer: Address) -> Result<(), Error> {
        if env
            .storage()
            .instance()
            .has(&DataKey::BackendSigner)
        {
            return Err(Error::AlreadyInitialized);
        }
        env.storage()
            .instance()
            .set(&DataKey::BackendSigner, &backend_signer);
        Ok(())
    }

    // -----------------------------------------------------------------------
    // Payment intent helpers
    // -----------------------------------------------------------------------

    /// Create a new pending payment intent.  The sender must authorise the
    /// call so that funds cannot be earmarked on someone else's behalf.
    pub fn create_payment_intent(
        env: Env,
        sender: Address,
        recipient: Address,
        amount: i128,
    ) -> Result<u64, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        sender.require_auth();

        if !env.storage().instance().has(&DataKey::BackendSigner) {
            return Err(Error::NotInitialized);
        }

        let intent_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(0u64);

        let intent = PaymentIntent {
            sender,
            recipient,
            amount,
            status: PaymentStatus::Pending,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Intent(intent_id), &intent);
        env.storage()
            .instance()
            .set(&DataKey::NextId, &(intent_id + 1));

        Ok(intent_id)
    }

    /// Confirm a payment intent.  Only the authorised backend signer may
    /// call this function.
    pub fn confirm_payment(
        env: Env,
        signer: Address,
        intent_id: u64,
    ) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::BackendSigner) {
            return Err(Error::NotInitialized);
        }

        // Require the caller to prove they are the stored backend signer.
        let backend_signer: Address = env
            .storage()
            .instance()
            .get(&DataKey::BackendSigner)
            .unwrap();

        if signer != backend_signer {
            return Err(Error::Unauthorized);
        }
        signer.require_auth();

        let mut intent: PaymentIntent = env
            .storage()
            .persistent()
            .get(&DataKey::Intent(intent_id))
            .ok_or(Error::IntentNotFound)?;

        if intent.status == PaymentStatus::Confirmed {
            return Err(Error::AlreadyConfirmed);
        }

        intent.status = PaymentStatus::Confirmed;
        env.storage()
            .persistent()
            .set(&DataKey::Intent(intent_id), &intent);

        Ok(())
    }

    /// Return the current state of a payment intent.
    pub fn get_payment_intent(env: Env, intent_id: u64) -> Result<PaymentIntent, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Intent(intent_id))
            .ok_or(Error::IntentNotFound)
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    fn setup() -> (Env, soroban_sdk::Address, GatewayContractClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, GatewayContract);
        let client = GatewayContractClient::new(&env, &contract_id);
        let backend_signer = Address::generate(&env);
        client.initialize(&backend_signer);
        (env, backend_signer, client)
    }

    // -----------------------------------------------------------------------
    // create_payment_intent
    // -----------------------------------------------------------------------

    #[test]
    fn test_create_payment_intent_success() {
        let (env, _signer, client) = setup();
        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);

        let id = client.create_payment_intent(&sender, &recipient, &500);
        assert_eq!(id, 0);

        let intent = client.get_payment_intent(&0);
        assert_eq!(intent.amount, 500);
        assert_eq!(intent.status, PaymentStatus::Pending);
    }

    #[test]
    fn test_create_payment_intent_invalid_amount() {
        let (env, _signer, client) = setup();
        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);

        let result = client.try_create_payment_intent(&sender, &recipient, &0);
        assert_eq!(
            result,
            Err(Ok(Error::InvalidAmount))
        );
    }

    #[test]
    fn test_create_payment_intent_increments_id() {
        let (env, _signer, client) = setup();
        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);

        let id0 = client.create_payment_intent(&sender, &recipient, &100);
        let id1 = client.create_payment_intent(&sender, &recipient, &200);
        assert_eq!(id0, 0);
        assert_eq!(id1, 1);
    }

    // -----------------------------------------------------------------------
    // confirm_payment — authorised path
    // -----------------------------------------------------------------------

    #[test]
    fn test_confirm_payment_authorized() {
        let (env, signer, client) = setup();
        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);

        let id = client.create_payment_intent(&sender, &recipient, &1000);

        // Backend signer confirms the intent.
        client.confirm_payment(&signer, &id);

        let intent = client.get_payment_intent(&id);
        assert_eq!(intent.status, PaymentStatus::Confirmed);
    }

    #[test]
    fn test_confirm_payment_already_confirmed() {
        let (env, signer, client) = setup();
        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);

        let id = client.create_payment_intent(&sender, &recipient, &1000);
        client.confirm_payment(&signer, &id);

        let result = client.try_confirm_payment(&signer, &id);
        assert_eq!(result, Err(Ok(Error::AlreadyConfirmed)));
    }

    // -----------------------------------------------------------------------
    // confirm_payment — unauthorised path
    // -----------------------------------------------------------------------

    #[test]
    fn test_confirm_payment_unauthorized_random_address() {
        let (env, _signer, client) = setup();
        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);

        let id = client.create_payment_intent(&sender, &recipient, &1000);

        // A random address that is NOT the backend signer tries to confirm.
        let impostor = Address::generate(&env);
        let result = client.try_confirm_payment(&impostor, &id);
        assert_eq!(result, Err(Ok(Error::Unauthorized)));
    }

    #[test]
    fn test_confirm_payment_unauthorized_sender_cannot_confirm() {
        let (env, _signer, client) = setup();
        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);

        let id = client.create_payment_intent(&sender, &recipient, &1000);

        // The payment sender is not the backend signer.
        let result = client.try_confirm_payment(&sender, &id);
        assert_eq!(result, Err(Ok(Error::Unauthorized)));
    }

    #[test]
    fn test_confirm_payment_nonexistent_intent() {
        let (env, signer, client) = setup();
        let _ = env;

        let result = client.try_confirm_payment(&signer, &999);
        assert_eq!(result, Err(Ok(Error::IntentNotFound)));
    }

    // -----------------------------------------------------------------------
    // initialisation guards
    // -----------------------------------------------------------------------

    #[test]
    fn test_double_initialize_rejected() {
        let (env, _signer, client) = setup();
        let another = Address::generate(&env);

        let result = client.try_initialize(&another);
        assert_eq!(result, Err(Ok(Error::AlreadyInitialized)));
    }
}
