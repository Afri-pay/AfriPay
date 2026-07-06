#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidThreshold = 3,
    NotASigner = 4,
    ProposalNotFound = 5,
    AlreadyApproved = 6,
    AlreadyExecuted = 7,
    ThresholdNotMet = 8,
}

#[contracttype]
#[derive(Clone)]
pub struct Proposal {
    pub to: Address,
    pub amount: i128,
    pub approvals: Vec<Address>,
    pub executed: bool,
}

#[contracttype]
enum DataKey {
    Signers,
    Threshold,
    NextProposalId,
    Proposal(u64),
}

#[contract]
pub struct MultisigContract;

#[contractimpl]
impl MultisigContract {
    /// One-time setup: registers the signer set and approval threshold.
    pub fn initialize(env: Env, signers: Vec<Address>, threshold: u32) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Signers) {
            return Err(Error::AlreadyInitialized);
        }
        if threshold == 0 || threshold > signers.len() {
            return Err(Error::InvalidThreshold);
        }

        env.storage().instance().set(&DataKey::Signers, &signers);
        env.storage().instance().set(&DataKey::Threshold, &threshold);
        env.storage().instance().set(&DataKey::NextProposalId, &0u64);

        Ok(())
    }

    /// Any registered signer can propose a transaction. Returns the new
    /// proposal's id.
    pub fn propose_transaction(
        env: Env,
        proposer: Address,
        to: Address,
        amount: i128,
    ) -> Result<u64, Error> {
        proposer.require_auth();
        Self::require_signer(&env, &proposer)?;

        let proposal_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextProposalId)
            .ok_or(Error::NotInitialized)?;

        let mut approvals = Vec::new(&env);
        approvals.push_back(proposer);

        let proposal = Proposal {
            to,
            amount,
            approvals,
            executed: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);
        env.storage()
            .instance()
            .set(&DataKey::NextProposalId, &(proposal_id + 1));

        Ok(proposal_id)
    }

    /// A registered signer approves an existing proposal.
    pub fn approve(env: Env, signer: Address, proposal_id: u64) -> Result<(), Error> {
        signer.require_auth();
        Self::require_signer(&env, &signer)?;

        let mut proposal = Self::get_proposal(&env, proposal_id)?;

        if proposal.executed {
            return Err(Error::AlreadyExecuted);
        }
        if proposal.approvals.contains(&signer) {
            return Err(Error::AlreadyApproved);
        }

        proposal.approvals.push_back(signer);
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);

        Ok(())
    }

    /// Executes a proposal once it has reached the required threshold of
    /// approvals. Marking-executed is the extent of the MVP; actual asset
    /// transfer wiring is left for a follow-up issue once the token
    /// interface is decided.
    pub fn execute(env: Env, proposal_id: u64) -> Result<(), Error> {
        let mut proposal = Self::get_proposal(&env, proposal_id)?;

        if proposal.executed {
            return Err(Error::AlreadyExecuted);
        }

        let threshold: u32 = env
            .storage()
            .instance()
            .get(&DataKey::Threshold)
            .ok_or(Error::NotInitialized)?;

        if proposal.approvals.len() < threshold {
            return Err(Error::ThresholdNotMet);
        }

        proposal.executed = true;
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);

        Ok(())
    }

    pub fn get_proposal(env: &Env, proposal_id: u64) -> Result<Proposal, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(Error::ProposalNotFound)
    }

    fn require_signer(env: &Env, address: &Address) -> Result<(), Error> {
        let signers: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Signers)
            .ok_or(Error::NotInitialized)?;

        if !signers.contains(address) {
            return Err(Error::NotASigner);
        }
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    fn setup(env: &Env) -> (Address, Address, Address, Address) {
        let contract_id = env.register_contract(None, MultisigContract);
        let signer_a = Address::generate(env);
        let signer_b = Address::generate(env);
        let signer_c = Address::generate(env);
        (contract_id, signer_a, signer_b, signer_c)
    }

    #[test]
    fn test_initialize_and_propose_approve_execute() {
        let env = Env::default();
        env.mock_all_auths();
        let (contract_id, signer_a, signer_b, _signer_c) = setup(&env);
        let client = MultisigContractClient::new(&env, &contract_id);

        let mut signers = Vec::new(&env);
        signers.push_back(signer_a.clone());
        signers.push_back(signer_b.clone());
        client.initialize(&signers, &2);

        let recipient = Address::generate(&env);
        let proposal_id = client.propose_transaction(&signer_a, &recipient, &500);
        assert_eq!(proposal_id, 0);

        // Below threshold: only the proposer's implicit approval so far.
        let result = client.try_execute(&proposal_id);
        assert!(result.is_err());

        client.approve(&signer_b, &proposal_id);
        client.execute(&proposal_id);

        let proposal = client.get_proposal(&proposal_id);
        assert!(proposal.executed);
    }

    #[test]
    fn test_non_signer_cannot_propose() {
        let env = Env::default();
        env.mock_all_auths();
        let (contract_id, signer_a, _signer_b, outsider) = setup(&env);
        let client = MultisigContractClient::new(&env, &contract_id);

        let mut signers = Vec::new(&env);
        signers.push_back(signer_a.clone());
        client.initialize(&signers, &1);

        let recipient = Address::generate(&env);
        let result = client.try_propose_transaction(&outsider, &recipient, &100);
        assert!(result.is_err());
    }

    #[test]
    fn test_double_approval_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        let (contract_id, signer_a, signer_b, _signer_c) = setup(&env);
        let client = MultisigContractClient::new(&env, &contract_id);

        let mut signers = Vec::new(&env);
        signers.push_back(signer_a.clone());
        signers.push_back(signer_b.clone());
        client.initialize(&signers, &2);

        let recipient = Address::generate(&env);
        let proposal_id = client.propose_transaction(&signer_a, &recipient, &200);

        let result = client.try_approve(&signer_a, &proposal_id);
        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_threshold_rejected() {
        let env = Env::default();
        let (contract_id, signer_a, _signer_b, _signer_c) = setup(&env);
        let client = MultisigContractClient::new(&env, &contract_id);

        let mut signers = Vec::new(&env);
        signers.push_back(signer_a);

        let result = client.try_initialize(&signers, &0);
        assert!(result.is_err());

        let result = client.try_initialize(&signers, &5);
        assert!(result.is_err());
    }
}
