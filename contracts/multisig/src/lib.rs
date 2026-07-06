#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

/// Placeholder multisig contract. See issue "Multisig wallet contract
/// skeleton" for signer/threshold/proposal/execution logic.
#[contract]
pub struct MultisigContract;

#[contractimpl]
impl MultisigContract {
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
        let contract_id = env.register_contract(None, MultisigContract);
        let client = MultisigContractClient::new(&env, &contract_id);
        assert_eq!(client.ping(), 1);
    }
}
