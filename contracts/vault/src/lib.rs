#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidAmount = 3,
    InsufficientBalance = 4,
}

#[contracttype]
#[derive(Clone)]
pub struct VaultAccount {
    pub balance: i128,
    pub last_updated: u64,
}

#[contracttype]
enum DataKey {
    YieldRateBps,
    Account(Address),
}

const SECONDS_PER_YEAR: u64 = 365 * 24 * 60 * 60;
const BPS_DENOMINATOR: i128 = 10_000;

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    /// One-time setup: sets the fixed annual yield rate in basis points
    /// (e.g. 500 = 5% APY). A future issue can replace this with a
    /// variable/DeFi-sourced rate.
    pub fn initialize(env: Env, yield_rate_bps: u32) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::YieldRateBps) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage()
            .instance()
            .set(&DataKey::YieldRateBps, &yield_rate_bps);
        Ok(())
    }

    /// Deposits `amount` into the caller's vault balance, first accruing
    /// any yield owed since the last interaction.
    pub fn deposit(env: Env, user: Address, amount: i128) -> Result<i128, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        user.require_auth();

        let mut account = Self::accrue(&env, &user)?;
        account.balance += amount;
        account.last_updated = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::Account(user), &account);

        Ok(account.balance)
    }

    /// Withdraws `amount` from the caller's vault balance, first accruing
    /// any yield owed since the last interaction.
    pub fn withdraw(env: Env, user: Address, amount: i128) -> Result<i128, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        user.require_auth();

        let mut account = Self::accrue(&env, &user)?;
        if account.balance < amount {
            return Err(Error::InsufficientBalance);
        }

        account.balance -= amount;
        account.last_updated = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::Account(user), &account);

        Ok(account.balance)
    }

    pub fn balance_of(env: Env, user: Address) -> Result<i128, Error> {
        let account = Self::accrue(&env, &user)?;
        Ok(account.balance)
    }

    /// Computes yield owed since `last_updated` and folds it into the
    /// stored balance, returning the updated (but not yet persisted for
    /// new accounts) account snapshot.
    fn accrue(env: &Env, user: &Address) -> Result<VaultAccount, Error> {
        let yield_rate_bps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::YieldRateBps)
            .ok_or(Error::NotInitialized)?;

        let now = env.ledger().timestamp();

        let mut account: VaultAccount = env
            .storage()
            .persistent()
            .get(&DataKey::Account(user.clone()))
            .unwrap_or(VaultAccount {
                balance: 0,
                last_updated: now,
            });

        let elapsed = now.saturating_sub(account.last_updated);
        if elapsed > 0 && account.balance > 0 {
            let interest = (account.balance * yield_rate_bps as i128 * elapsed as i128)
                / (BPS_DENOMINATOR * SECONDS_PER_YEAR as i128);
            account.balance += interest;
        }
        account.last_updated = now;

        Ok(account)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    #[test]
    fn test_deposit_and_withdraw() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, VaultContract);
        let client = VaultContractClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        client.initialize(&500); // 5% APY

        let balance = client.deposit(&user, &1000);
        assert_eq!(balance, 1000);

        let balance = client.withdraw(&user, &400);
        assert_eq!(balance, 600);
    }

    #[test]
    fn test_yield_accrues_over_time() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, VaultContract);
        let client = VaultContractClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        client.initialize(&1000); // 10% APY
        client.deposit(&user, &1_000_000);

        // Advance the ledger by half a year.
        env.ledger().with_mut(|l| {
            l.timestamp += SECONDS_PER_YEAR / 2;
        });

        let balance = client.balance_of(&user);
        // ~10% APY over half a year => ~5% growth => ~1,050,000
        assert!(balance > 1_000_000);
        assert!(balance < 1_100_000);
    }

    #[test]
    fn test_withdraw_zero_balance_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, VaultContract);
        let client = VaultContractClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        client.initialize(&500);

        let result = client.try_withdraw(&user, &100);
        assert!(result.is_err());
    }

    #[test]
    fn test_double_withdrawal_past_balance_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, VaultContract);
        let client = VaultContractClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        client.initialize(&0); // no yield, simplifies the arithmetic check
        client.deposit(&user, &500);
        client.withdraw(&user, &300);

        // Only 200 left; withdrawing 300 again should fail.
        let result = client.try_withdraw(&user, &300);
        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_amount_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, VaultContract);
        let client = VaultContractClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        client.initialize(&500);

        let result = client.try_deposit(&user, &0);
        assert!(result.is_err());

        let result = client.try_deposit(&user, &-50);
        assert!(result.is_err());
    }
}
