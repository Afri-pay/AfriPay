# Contributing to AfriPay

Thank you for your interest in contributing to AfriPay. Contributions are welcome from developers, designers, documentation authors, testers, and community members.

AfriPay is an open-source project. Contributions are reviewed on their technical merit, clarity, testing, security, and alignment with the project’s goals.

## Before you start

Please read:

- [README.md](README.md)
- [SECURITY.md](SECURITY.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

Search existing issues and pull requests before opening a new one. For significant changes, open an issue first so the scope can be discussed.

## What you can contribute

- Bug fixes and regression tests
- Frontend accessibility and responsive UX
- Backend API improvements
- Stellar and Soroban integrations
- Contract tests and documentation
- Testnet verification and reproducible bug reports
- Developer documentation and examples
- Performance and reliability improvements

## Development principles

- Keep changes focused and easy to review.
- Preserve the Stellar Testnet-only default unless a change is explicitly approved.
- Do not make Freighter or another external wallet mandatory.
- Preserve the native wallet’s non-custodial security model.
- Never send, log, commit, or persist private keys, recovery secrets, credentials, or real environment files.
- Do not change blockchain calculations or contract behavior without tests and documentation.
- Do not add fake balances, transactions, integrations, or deployment evidence.
- Update documentation when setup or behavior changes.

## Local setup

### Prerequisites

- Node.js 20 or newer
- npm
- Rust and Cargo for Soroban contracts
- PostgreSQL for durable application metadata
- Redis is optional for exchange-rate caching

### Clone your fork

1. Fork the repository on GitHub.
2. Clone your fork.
3. Add the AfriPay repository as the upstream remote.

    git clone https://github.com/YOUR_USERNAME/AfriPay.git
    cd AfriPay
    git remote add upstream https://github.com/Afri-pay/AfriPay.git

### Install dependencies

    cd backend
    npm ci
    copy .env.example .env

    cd ../frontend
    npm ci
    copy .env.example .env.local

On macOS/Linux, use cp instead of copy.

Configure local values using backend/.env.example and frontend/.env.example. Do not commit .env or .env.local files.

## Branches and changes

Start from an up-to-date main branch:

    git fetch upstream
    git checkout main
    git pull upstream main
    git checkout -b feature/short-description

Use a focused branch name such as:

- feature/add-payment-validation
- fix/history-timeout
- docs/update-testnet-setup
- test/native-wallet-unlock

Keep unrelated formatting or refactoring out of the pull request.

## Testing

Run the checks relevant to your change.

Backend:

    cd backend
    npm test -- --runInBand
    npm run lint
    npm run build

Frontend:

    cd frontend
    npm test -- --runInBand
    npm run lint
    npm run build

Contracts:

    cd contracts
    cargo test
    cargo clippy --all-targets --all-features -- -D warnings

If a check cannot run locally, explain why in the pull request. Do not delete or weaken tests to make a check pass.

## Pull requests

Before opening a pull request:

- Confirm the branch is based on the latest main.
- Explain what changed and why.
- Add or update tests for behavior changes.
- Update documentation when needed.
- Include screenshots for meaningful UI changes.
- Describe security, database, API, contract, and breaking-change impact.
- Redact secrets from logs and screenshots.

Push your branch to your fork:

    git push origin feature/short-description

Open a pull request against AfriPay main. Maintainers will review the implementation, tests, documentation, and project compatibility. Please respond to review feedback and keep the branch focused.

## Commit messages

Use a concise conventional style:

- feat: add a wallet capability
- fix: handle Horizon timeout
- docs: clarify local setup
- test: cover invalid Stellar address
- refactor: simplify API helper
- chore: update tooling

## Reporting bugs

Use the GitHub bug-report template. Include:

- Expected behavior
- Actual behavior
- Reproduction steps
- Relevant component
- Browser, operating system, Node, or Rust version
- Redacted logs or screenshots
- Whether the issue occurred on Testnet or in local development

## Security reports

Do not disclose sensitive vulnerabilities in a public issue. Follow [SECURITY.md](SECURITY.md) and email security@afripay.io when appropriate.

Never include private keys, recovery secrets, API credentials, database passwords, or unredacted production logs in an issue or pull request.

## Code of Conduct

All contributors must follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
