#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env};

#[contracttype]
#[derive(Clone)]
pub struct Payment {
    pub sender: Address,
    pub recipient: Address,
    pub amount: i128,
    pub released: bool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    InvalidAmount = 1,
    PaymentNotFound = 2,
    AlreadyReleased = 3,
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Creates a new escrow payment. Placeholder implementation — see
    /// issue "Implement escrow contract create_payment function" for the
    /// full storage + persistence logic.
    pub fn create_payment(
        env: Env,
        sender: Address,
        recipient: Address,
        amount: i128,
    ) -> Result<u64, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        sender.require_auth();

        let payment_id: u64 = env
            .storage()
            .instance()
            .get(&"next_id")
            .unwrap_or(0);

        let payment = Payment {
            sender,
            recipient,
            amount,
            released: false,
        };

        env.storage().persistent().set(&payment_id, &payment);
        env.storage().instance().set(&"next_id", &(payment_id + 1));

        Ok(payment_id)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_create_payment_success() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, EscrowContract);
        let client = EscrowContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);

        let payment_id = client.create_payment(&sender, &recipient, &1000);
        assert_eq!(payment_id, 0);
    }

    #[test]
    fn test_create_payment_invalid_amount() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, EscrowContract);
        let client = EscrowContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);

        let result = client.try_create_payment(&sender, &recipient, &-100);
        assert!(result.is_err());
    }
}
