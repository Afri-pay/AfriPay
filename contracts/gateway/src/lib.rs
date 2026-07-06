#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

/// Placeholder payment gateway contract. See issue "Payment gateway
/// contract (webhook confirmation flow)" for the full implementation.
#[contract]
pub struct GatewayContract;

#[contractimpl]
impl GatewayContract {
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
        let contract_id = env.register_contract(None, GatewayContract);
        let client = GatewayContractClient::new(&env, &contract_id);
        assert_eq!(client.ping(), 1);
    }
}
