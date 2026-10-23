#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env,
};

#[contracttype]
#[derive(Clone)]
pub struct Payment {
    pub sender: Address,
    pub recipient: Address,
    pub amount: i128,
    pub released: bool,
}

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum EscrowStatus {
    Created,
    Funded,
    Released,
    Refunded,
}

#[contracttype]
#[derive(Clone)]
pub struct Escrow {
    pub asset: Address,
    pub sender: Address,
    pub recipient: Address,
    pub amount: i128,
    pub expires_at: u64,
    pub status: EscrowStatus,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    InvalidAmount = 1,
    PaymentNotFound = 2,
    AlreadyReleased = 3,
    InvalidExpiry = 4,
    EscrowNotFound = 5,
    InvalidState = 6,
}

#[contracttype]
enum DataKey {
    NextEscrowId,
    Escrow(u64),
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Legacy metadata-only payment record; no assets are deposited.
    pub fn create_payment(
        env: Env,
        amount: i128,
        sender: Address,
        recipient: Address,
    ) -> Result<u64, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        sender.require_auth();

        let payment_id: u64 = env.storage().instance().get(&"next_id").unwrap_or(0);

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

    /// Creates an asset-backed escrow. The sender funds it in a separate
    /// authorized call so clients can show the user the exact transaction.
    pub fn create_escrow(
        env: Env,
        asset: Address,
        amount: i128,
        sender: Address,
        recipient: Address,
        expires_at: u64,
    ) -> Result<u64, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if expires_at <= env.ledger().timestamp() {
            return Err(Error::InvalidExpiry);
        }
        sender.require_auth();
        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextEscrowId)
            .unwrap_or(0);
        env.storage().persistent().set(
            &DataKey::Escrow(id),
            &Escrow {
                asset,
                sender,
                recipient,
                amount,
                expires_at,
                status: EscrowStatus::Created,
            },
        );
        env.storage()
            .instance()
            .set(&DataKey::NextEscrowId, &(id + 1));
        Ok(id)
    }

    pub fn fund(env: Env, escrow_id: u64) -> Result<(), Error> {
        let mut escrow = Self::load_escrow(&env, escrow_id)?;
        if escrow.status != EscrowStatus::Created {
            return Err(Error::InvalidState);
        }
        if env.ledger().timestamp() >= escrow.expires_at {
            return Err(Error::InvalidExpiry);
        }
        escrow.sender.require_auth();
        token::Client::new(&env, &escrow.asset).transfer(
            &escrow.sender,
            &env.current_contract_address(),
            &escrow.amount,
        );
        escrow.status = EscrowStatus::Funded;
        Self::save_escrow(&env, escrow_id, &escrow);
        Ok(())
    }

    pub fn release(env: Env, escrow_id: u64) -> Result<(), Error> {
        let mut escrow = Self::load_escrow(&env, escrow_id)?;
        if escrow.status != EscrowStatus::Funded {
            return Err(Error::InvalidState);
        }
        if env.ledger().timestamp() >= escrow.expires_at {
            return Err(Error::InvalidExpiry);
        }
        // The depositor authorizes settlement to the fixed beneficiary.
        escrow.sender.require_auth();
        token::Client::new(&env, &escrow.asset).transfer(
            &env.current_contract_address(),
            &escrow.recipient,
            &escrow.amount,
        );
        escrow.status = EscrowStatus::Released;
        Self::save_escrow(&env, escrow_id, &escrow);
        Ok(())
    }

    pub fn refund(env: Env, escrow_id: u64) -> Result<(), Error> {
        let mut escrow = Self::load_escrow(&env, escrow_id)?;
        if escrow.status != EscrowStatus::Funded {
            return Err(Error::InvalidState);
        }
        if env.ledger().timestamp() < escrow.expires_at {
            return Err(Error::InvalidExpiry);
        }
        escrow.sender.require_auth();
        token::Client::new(&env, &escrow.asset).transfer(
            &env.current_contract_address(),
            &escrow.sender,
            &escrow.amount,
        );
        escrow.status = EscrowStatus::Refunded;
        Self::save_escrow(&env, escrow_id, &escrow);
        Ok(())
    }

    pub fn get_escrow(env: Env, escrow_id: u64) -> Result<Escrow, Error> {
        Self::load_escrow(&env, escrow_id)
    }

    fn load_escrow(env: &Env, escrow_id: u64) -> Result<Escrow, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(Error::EscrowNotFound)
    }

    fn save_escrow(env: &Env, escrow_id: u64, escrow: &Escrow) {
        env.storage()
            .persistent()
            .set(&DataKey::Escrow(escrow_id), escrow);
        env.events()
            .publish((symbol_short!("escrow"), escrow_id), escrow.status);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    #[test]
    fn test_asset_conservation_release_and_replay() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(EscrowContract, ());
        let client = EscrowContractClient::new(&env, &contract_id);
        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);
        let admin = Address::generate(&env);
        let asset = env.register_stellar_asset_contract_v2(admin).address();
        token::StellarAssetClient::new(&env, &asset).mint(&sender, &1000);
        let token = token::Client::new(&env, &asset);
        let id = client.create_escrow(&asset, &100, &sender, &recipient, &100);
        assert!(client.try_release(&id).is_err());
        client.fund(&id);
        assert_eq!(token.balance(&sender), 900);
        assert_eq!(token.balance(&contract_id), 100);
        assert!(client.try_fund(&id).is_err());
        assert!(client.try_refund(&id).is_err());
        env.mock_auths(&[]);
        assert!(client.try_release(&id).is_err());
        assert_eq!(token.balance(&contract_id), 100);
        env.mock_all_auths();
        client.release(&id);
        assert_eq!(token.balance(&recipient), 100);
        assert_eq!(token.balance(&contract_id), 0);
        assert!(client.try_release(&id).is_err());
        assert!(client.try_refund(&id).is_err());
    }

    #[test]
    fn test_expiry_refund_and_failed_deposit() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(EscrowContract, ());
        let client = EscrowContractClient::new(&env, &contract_id);
        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);
        let asset = env
            .register_stellar_asset_contract_v2(Address::generate(&env))
            .address();
        let id = client.create_escrow(&asset, &100, &sender, &recipient, &100);
        assert!(client.try_fund(&id).is_err());
        assert!(client.get_escrow(&id).status == EscrowStatus::Created);
        token::StellarAssetClient::new(&env, &asset).mint(&sender, &100);
        client.fund(&id);
        env.ledger().with_mut(|ledger| ledger.timestamp = 100);
        assert!(client.try_release(&id).is_err());
        client.refund(&id);
        assert_eq!(token::Client::new(&env, &asset).balance(&sender), 100);
        assert!(client.try_refund(&id).is_err());
        let expired = client.create_escrow(&asset, &1, &sender, &recipient, &101);
        env.ledger().with_mut(|ledger| ledger.timestamp = 101);
        assert!(client.try_fund(&expired).is_err());
    }

    #[test]
    fn test_create_payment_success() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(EscrowContract, ());
        let client = EscrowContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);

        let payment_id = client.create_payment(&1000, &sender, &recipient);
        assert_eq!(payment_id, 0);
    }

    #[test]
    fn test_create_payment_invalid_amount() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(EscrowContract, ());
        let client = EscrowContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);

        let result = client.try_create_payment(&-100, &sender, &recipient);
        assert!(result.is_err());
    }
}
