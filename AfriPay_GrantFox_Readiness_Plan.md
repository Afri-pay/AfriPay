# AfriPay — GrantFox Acceptance & Payment Readiness Plan

Repository: https://github.com/Afri-pay/AfriPay

## Objective

Prepare AfriPay for GrantFox submission by bringing the repository to a professional open-source standard comparable to projects that have successfully received GrantFox funding/payments.

The goal is **not** to game GrantFox, fabricate activity, or guarantee payment. The goal is to make the project genuinely strong, technically credible, easy for maintainers/reviewers to evaluate, and aligned with observed GrantFox OSS contribution practices.

---

# 1. GrantFox Positioning

Position AfriPay as:

> **An open-source Stellar payment infrastructure for African cross-border payments, combining Soroban smart contracts with mobile-money, USSD, and traditional payment rails.**

Emphasize:

- Stellar/Soroban smart contracts
- African payment infrastructure
- Escrow and payment intents
- Mobile-money integrations
- USSD accessibility
- Wallet integration
- Multisig/security
- Exchange-rate infrastructure
- Webhooks and payment reconciliation
- Open-source contribution opportunities

Do not describe planned/scaffolded functionality as fully implemented.

---

# 2. Repository Audit

Perform a complete repository audit before making changes.

Inspect:

- README.md
- LICENSE
- CODE_OF_CONDUCT.md
- CONTRIBUTING.md
- SECURITY.md
- .gitignore
- .env.example
- package manifests
- Cargo manifests
- GitHub Actions
- frontend
- backend
- Soroban contracts
- tests
- documentation
- issue templates
- PR templates

Search the entire repository for accidental references to unrelated projects.

Especially search for:

- `Xconfess`
- `xconfess`
- `Godsmiracle`
- unrelated repository names
- unrelated URLs
- placeholder credentials
- secrets/API keys
- test/demo values that look like production credentials

Fix every accidental cross-project reference.

Known issue to verify/fix:

The USSD implementation has previously contained:

`CON Welcome to Xconfess`

This must be changed to an AfriPay-specific message.

---

# 3. README Requirements

Rewrite/improve README.md so a new contributor can understand AfriPay quickly.

Include:

## AfriPay

Short professional description.

## What AfriPay Does

Explain the product and its purpose.

## Core Architecture

Explain:

```text
Next.js Frontend
       |
       v
NestJS Backend
       |
       +---- PostgreSQL
       |
       +---- Payment Services
       |
       +---- Mobile Money / USSD
       |
       v
Stellar / Soroban
```

Adjust the diagram to match the real codebase.

## Implemented Features

Only list features that actually exist and work.

Examples to verify:

- Soroban escrow/payment logic
- Payment gateway
- Payment intents
- Stellar wallet/Freighter connection
- Multisig
- Savings vault
- MTN Mobile Money integration
- USSD integration
- Exchange-rate service
- Notifications
- Webhooks
- Payment links

Do not claim a feature is production-ready unless the implementation supports that claim.

## In Progress

List partially implemented features.

## Planned

List features that are not implemented.

## Technology Stack

Document actual technologies.

## Project Structure

Show the actual repository structure.

## Local Development

Give exact setup commands.

## Environment Variables

Document variables using `.env.example`.

Never include real secrets.

## Testing

Give exact commands for:

- frontend tests
- backend tests
- contract tests
- lint
- typecheck
- build
- CI

Only document commands that actually work.

## Stellar Network

Clearly state whether the project currently targets:

- Stellar Testnet
- Stellar Mainnet
- local development
- Soroban sandbox

Include relevant configuration.

## Security

Explain important security assumptions and limitations.

## Contributing

Point contributors to CONTRIBUTING.md.

## License

Clearly identify the license.

---

# 4. Security Improvements

Create or improve SECURITY.md.

Cover:

- reporting vulnerabilities
- secret management
- wallet security
- Soroban contract security
- payment verification
- webhook verification
- idempotency
- authentication
- authorization
- replay protection
- transaction validation
- input validation
- rate limiting
- external payment-provider trust boundaries

Do not invent security guarantees.

If something is not implemented, document it as a limitation or TODO.

---

# 5. Environment Configuration

Create `.env.example` files where appropriate.

Use placeholders such as:

```env
DATABASE_URL=
STELLAR_NETWORK=
STELLAR_RPC_URL=
MTN_API_BASE_URL=
MTN_API_KEY=
AFRICASTALKING_USERNAME=
AFRICASTALKING_API_KEY=
```

Do not commit real secrets.

Search Git history/current files for accidentally exposed credentials where possible.

---

# 6. Testing & Quality

Run the project's actual validation suite.

At minimum, determine whether these work:

```bash
npm test
npm run lint
npm run build
npm run typecheck
cargo test
cargo fmt --check
cargo clippy
```

Use the correct commands for each workspace rather than blindly adding commands that do not exist.

Fix:

- failing tests
- TypeScript errors
- lint errors
- Rust compilation errors
- formatting problems
- broken imports
- stale tests
- incorrect mocks
- broken builds

Add tests for important payment logic.

Prioritize:

1. payment intent lifecycle
2. escrow
3. authorization
4. idempotency
5. payment confirmation
6. MTN MoMo
7. webhook reconciliation
8. USSD
9. multisig
10. savings vault
11. Stellar transaction handling

Do not add meaningless tests merely to inflate coverage.

---

# 7. Payment Gateway Quality

Audit the payment gateway.

Verify:

- payment intent creation
- pending state
- confirmation
- failure state
- authorization
- idempotency
- duplicate request handling
- typed errors
- confirmer authorization
- confirmer rotation
- transaction verification

Document the lifecycle.

Example:

```text
Created
  |
  v
Pending
  |
  +---- Failed
  |
  v
Confirmed
```

Only use states that exist in the implementation.

---

# 8. MTN Mobile Money

Audit the MTN MoMo integration.

Verify:

- authentication/token handling
- token caching
- token expiry
- collection
- disbursement
- transaction status
- webhook handling
- webhook verification
- failure handling
- timeout handling
- retries
- idempotency

Ensure tests cover both success and failure paths.

Do not claim live production integration unless it has actually been tested in a production environment.

---

# 9. USSD

Audit the USSD integration.

Verify:

- request parsing
- URL-encoded requests
- session handling
- menu flow
- Send Money
- Check Balance
- Transaction History
- Help
- invalid input
- session termination
- error handling

Fix all unrelated branding/references.

Use AfriPay branding consistently.

---

# 10. Soroban Contracts

Perform a security-oriented audit of every contract.

Check:

- authorization
- signer validation
- access control
- replay protection
- state transitions
- arithmetic safety
- asset validation
- token validation
- error handling
- storage
- event emission
- upgrade/admin controls
- multisig threshold logic
- escrow release/refund conditions
- savings-vault withdrawal conditions

Add tests for important failure cases, not only successful cases.

Document assumptions.

Do not claim a contract has been independently audited unless it actually has.

---

# 11. GitHub Actions

Inspect all workflows under:

```text
.github/workflows/
```

Ensure CI is useful and reproducible.

Prefer checks covering:

- dependency installation
- lint
- typecheck
- frontend build
- backend build
- backend tests
- contract tests
- Rust formatting
- Rust clippy

Do not create fake CI success.

After changes, verify the workflow configuration itself is valid.

---

# 12. Open-Source Documentation

Improve:

## CONTRIBUTING.md

Include:

- setup
- architecture
- development workflow
- branch naming
- commit conventions if applicable
- testing requirements
- PR expectations
- issue workflow
- code review expectations

## CODE_OF_CONDUCT.md

Use a recognized standard such as Contributor Covenant if appropriate.

## Issue Templates

Create templates for:

- bug
- feature
- security issue
- documentation

## PR Template

Include:

- summary
- related issue
- implementation
- tests
- screenshots where relevant
- security considerations
- breaking changes

---

# 13. GrantFox-Ready Issues

Review all open issues.

Improve the strongest issues so they are actionable for external contributors.

A strong issue should contain:

## Summary

What needs to be built.

## Background

Why it matters.

## Technical Scope

What files/modules/components are expected to change.

## Requirements

Concrete implementation requirements.

## Acceptance Criteria

Specific conditions that can be tested.

## Tests

Required tests.

## Security Considerations

Relevant security concerns.

## Definition of Done

Clear completion requirements.

## Difficulty

Good first issue / Intermediate / Advanced / Expert.

Do not add campaign labels unless they are actually appropriate and permitted by the current GrantFox/maintainer workflow.

---

# 14. Priority GrantFox Issues

Prioritize high-value issues around:

1. Soroban escrow improvements
2. Payment gateway improvements
3. Stellar settlement
4. MTN MoMo reliability/security
5. USSD transaction flows
6. KYC integration
7. Exchange-rate service
8. Payment links
9. Webhook/reconciliation infrastructure
10. Security and test improvements

Each issue should represent a real engineering task, not an artificial task created only to obtain rewards.

---

# 15. Compare Against Successful OSS Patterns

Use GrantFox's official documentation plus examples of projects that have received GrantFox payments.

Look for common qualities:

- active open-source repository
- real contributors
- meaningful merged PRs
- clear issues
- strong documentation
- tests
- CI
- Stellar/Soroban relevance
- security awareness
- clear acceptance criteria
- reviewable contribution scope
- transparent implementation status

Distinguish between:

**Official GrantFox requirements**

and

**Observed patterns from paid projects.**

Do not present repository-specific campaign rules as universal GrantFox requirements.

---

# 16. GitHub Hygiene

Check:

- branch naming
- commit messages
- stale branches
- duplicate issues
- duplicate PRs
- accidental files
- generated files
- secrets
- node_modules
- build output
- unnecessary binaries
- stale documentation
- broken links
- incorrect repository URLs

Remove only files that are genuinely unnecessary.

Do not destroy useful project history.

---

# 17. Product Credibility

The repository should answer these questions clearly:

1. What problem does AfriPay solve?
2. Why Stellar?
3. Why Soroban?
4. Why Africa?
5. Who is the intended user?
6. What is already implemented?
7. What remains?
8. How can a developer contribute?
9. How is payment handled?
10. What are the security assumptions?

---

# 18. Do Not Fake Anything

Never:

- create fake users
- create fake transactions
- create fake stars
- create fake contributors
- fabricate production usage
- fabricate audits
- fabricate test results
- fabricate GrantFox approval
- add meaningless commits
- artificially manipulate GitHub activity

The objective is genuine project quality.

---

# 19. Final Audit Report

After completing the work, produce a report with:

## A. Changes Made

List every meaningful change.

## B. Tests Run

For each command:

```text
Command:
Result:
Pass/Fail:
Notes:
```

## C. Remaining Problems

List anything that could not be fixed.

## D. GrantFox Readiness Score

Score:

- Repository quality /10
- Documentation /10
- Code quality /10
- Testing /10
- Security /10
- Stellar/Soroban relevance /10
- Contributor readiness /10
- Issue quality /10
- CI/CD /10
- Overall readiness /10

## E. Submission Recommendation

Answer:

- Is AfriPay ready to submit?
- What must be fixed first?
- What can wait?
- Which issues should be prioritized?
- What is the strongest project pitch?

---

# 20. Important Working Rule

Do not make broad destructive changes.

Before modifying anything:

1. inspect the existing implementation
2. understand the architecture
3. identify the smallest correct change
4. implement it
5. test it
6. inspect the diff
7. verify no unrelated behavior was broken

Keep the project technically honest.

---

# LLM EXECUTION PROMPT

Use the following prompt with your coding LLM:

---

You are the senior engineer responsible for preparing the GitHub repository below for serious GrantFox OSS review.

Repository:

https://github.com/Afri-pay/AfriPay

Your objective is to **audit, fix, improve, test, document, and prepare the repository for GrantFox submission**.

Do not merely give recommendations. Work directly on the repository and implement the fixes you can verify.

## Primary objective

Make AfriPay a high-quality, credible open-source Stellar/Soroban project that is genuinely ready for external contributors and GrantFox review.

Do NOT attempt to game GrantFox.

Do NOT fabricate:

- contributors
- users
- transactions
- stars
- tests
- audits
- production usage
- payment history
- GrantFox approval

Everything must remain technically truthful.

## Phase 1 — Repository reconnaissance

Before changing anything, inspect the entire repository.

Identify:

- frontend
- backend
- Soroban contracts
- database
- integrations
- tests
- CI
- documentation
- issue-related files
- environment configuration

Read:

- README
- package.json files
- Cargo.toml files
- GitHub workflows
- contributing docs
- security docs
- relevant source code
- tests

Then produce a concise architecture map.

## Phase 2 — Search for contamination

Search the entire repository for:

- Xconfess
- xconfess
- unrelated project names
- unrelated URLs
- old branding
- placeholder secrets
- API keys
- credentials
- stale comments

There is a known possible problem in the USSD implementation:

`CON Welcome to Xconfess`

Find and fix it.

Also search for other accidental cross-project references.

## Phase 3 — Documentation

Upgrade the repository documentation.

README must clearly explain:

- what AfriPay is
- problem being solved
- why Stellar
- why Soroban
- African payment use case
- architecture
- implemented features
- in-progress features
- planned features
- technology stack
- project structure
- setup
- environment variables
- testing
- Stellar network configuration
- security considerations
- contribution workflow
- license

Do not claim planned functionality is implemented.

Create/improve:

- CONTRIBUTING.md
- SECURITY.md
- CODE_OF_CONDUCT.md
- .env.example
- issue templates
- PR template

Only add files that are appropriate for the actual project.

## Phase 4 — Code audit

Audit:

### Backend

Check:

- authentication
- authorization
- validation
- error handling
- idempotency
- payment lifecycle
- webhook handling
- database access
- external API calls
- configuration
- logging

### Frontend

Check:

- wallet connection
- API integration
- error states
- loading states
- environment variables
- TypeScript errors
- build

### Soroban

Check:

- access control
- authorization
- signer validation
- state transitions
- arithmetic
- storage
- asset validation
- escrow conditions
- multisig
- savings vault
- events
- error handling
- replay/duplicate transaction risks

## Phase 5 — Payment gateway

Verify the actual implementation of:

- payment intent creation
- pending
- confirmation
- failure
- authorization
- idempotency
- confirmer authorization
- confirmer rotation

Add meaningful tests for important paths.

## Phase 6 — MTN MoMo

Audit:

- authentication
- token caching
- token expiration
- collections
- disbursements
- transaction status
- webhooks
- reconciliation
- failure handling
- timeout handling
- retries
- idempotency

Keep the implementation truthful about whether it is testnet/demo/live.

## Phase 7 — USSD

Audit the Africa's Talking integration.

Verify:

- request parsing
- URL-encoded payloads
- sessions
- menu flow
- Send Money
- Balance
- Transaction History
- Help
- invalid input
- termination
- errors

Fix all unrelated branding.

## Phase 8 — Tests

Run the real project test commands.

Discover the correct commands instead of assuming them.

At minimum investigate:

- backend tests
- frontend tests
- contract tests
- lint
- typecheck
- builds
- Rust formatting
- Rust clippy

Fix genuine failures.

Do not weaken tests simply to make CI pass.

Do not delete tests unless they are genuinely obsolete and replace them with correct coverage.

## Phase 9 — CI

Inspect `.github/workflows`.

Ensure CI checks the important parts of the repository.

Do not claim CI is green unless you can verify it.

## Phase 10 — GitHub issue quality

Inspect the existing AfriPay issues.

Identify the strongest real engineering tasks.

Improve issue descriptions where appropriate with:

- summary
- context
- technical scope
- requirements
- acceptance criteria
- tests
- security considerations
- definition of done
- difficulty

Prioritize issues that create meaningful Stellar/Soroban/payment infrastructure contributions.

Do not create artificial tasks merely for GrantFox rewards.

## Phase 11 — GrantFox comparison

Use:

https://analytics.grantfox.xyz/

and GrantFox's official documentation to understand the current ecosystem.

Compare AfriPay against paid projects in terms of:

- repository maturity
- documentation
- tests
- CI
- Stellar/Soroban relevance
- contributor activity
- issue quality
- security
- meaningful engineering scope

Clearly distinguish:

1. official GrantFox requirements
2. observed patterns from projects that have been paid

Never invent GrantFox requirements.

## Phase 12 — Final validation

After all fixes:

1. run tests
2. run lint
3. run typecheck
4. run builds
5. run contract checks
6. inspect Git diff
7. search again for accidental Xconfess references
8. search for secrets
9. verify README claims against actual code
10. verify no unrelated functionality was broken

## Phase 13 — Final report

Return:

### Changes Made

Detailed but concise list.

### Tests

For every relevant command:

```text
Command:
Result:
Status:
```

### Remaining Issues

Anything unresolved.

### GrantFox Readiness

Score:

- Repository quality /10
- Documentation /10
- Code quality /10
- Testing /10
- Security /10
- Stellar/Soroban relevance /10
- Contributor readiness /10
- Issue quality /10
- CI/CD /10
- Overall /10

### Submission Decision

State one:

- READY
- READY AFTER MINOR FIXES
- NOT READY

If not ready, give the exact blockers.

### Recommended GrantFox Pitch

Provide a concise, truthful project description emphasizing AfriPay's strongest differentiators.

## Critical instruction

Do not stop after finding problems.

For every problem that you can safely fix:

**inspect → implement → test → verify → report.**

Do not make speculative architectural rewrites.

Prefer small, reviewable, production-quality changes.

The final repository must be cleaner, more testable, more secure, better documented, and easier for an external open-source contributor to work on than it was before.
