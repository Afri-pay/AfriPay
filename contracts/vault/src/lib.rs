#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

/// Placeholder savings vault contract. See issue "Savings vault contract
/// with yield mechanism" for deposit/withdraw/yield logic.
#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    pub fn ping(_env: Env) -> u32 {
        1
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_ping() {
        let env = Env::default();
        let contract_id = env.register_contract(None, VaultContract);
        let client = VaultContractClient::new(&env, &contract_id);
        assert_eq!(client.ping(), 1);
    }
}
