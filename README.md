# AfriPay

**Cross-border payments, built for Africa.**

AfriPay is an open-source Stellar-powered payment platform with a registration-free native browser wallet, XLM payment APIs, Soroban contract workspace, and mobile-money/USSD integration modules.

> **Current network: Stellar Testnet.** Testnet XLM has no monetary value. AfriPay is under active development and is not Mainnet-ready.

- Live application: https://afri-pay-beta.vercel.app/
- Backend API: https://afripay-api-seven.vercel.app/
- Repository: https://github.com/Afri-pay/AfriPay

## Overview

AfriPay combines a Next.js wallet interface with a NestJS API and Rust/Soroban contracts. The native wallet is the primary wallet experience: users can create or import a Stellar account without creating an AfriPay account or installing Freighter.

The backend provides Stellar account and transaction endpoints, Testnet Friendbot funding, Soroban transaction preparation/submission, payment-intent workflows, MTN MoMo modules, USSD routes, exchange-rate caching, and application metadata persistence when PostgreSQL is configured.

## Features

### Implemented

- Native Stellar Testnet wallet creation and import/restore
- Local password encryption, unlock, lock, backup, and device removal
- Local XLM transaction signing with Stellar SDK
- Public-address receive flow and QR code
- Stellar Testnet account funding through Friendbot
- Real Horizon account balances and payment history
- Signed transaction submission and Testnet explorer links
- Soroban preparation, submission, and transaction polling API routes
- Soroban Rust contract unit tests
- MTN MoMo collection, disbursement, status, and webhook modules in sandbox configuration
- USSD controller flows for balance, history, help, and send-money demonstrations
- Open Exchange Rates integration with optional Redis caching
- Vercel-hosted frontend and backend deployment configuration

### Partially implemented

- Native XLM send uses the payment-intent API and local signing; production use requires the corresponding API configuration and an activated Testnet account.
- Payment links have backend create/read routes and frontend creation UI; full payment reconciliation remains in progress.
- Soroban contracts contain tested core logic, but complete application UI flows and independent deployment evidence are not complete for every contract.
- PostgreSQL persistence is available for payment/MoMo metadata when DATABASE_URL is configured; isolated tests use memory fallbacks.

### Planned

- Independent wallet and application security review
- Broader Stellar asset UX
- Complete mobile-money production integrations and reconciliation
- KYC and notification provider integrations
- Rate limiting and centralized webhook replay protection
- Mainnet-specific configuration and launch process

## Native Stellar Wallet

The AfriPay native wallet does not require an AfriPay account, email registration, Freighter, or another browser wallet.

    Create or import wallet
             ↓
    Encrypt locally with wallet password
             ↓
    Back up recovery secret offline
             ↓
    Fund Stellar Testnet account
             ↓
    View balance, receive, sign/send, and view history

Supported actions include:

- Create a Stellar keypair in the browser
- Import an existing Stellar secret seed in the browser
- Encrypt the secret locally
- Unlock and lock the wallet
- Back up the recovery secret
- Copy the public address and display a public-address QR code
- Remove the encrypted wallet from the current device after confirmation

### Wallet security

The secret seed is generated or imported in the browser. It is encrypted with Web Crypto AES-GCM using a PBKDF2-SHA-256 derived key, random salt, and random IV before being stored in versioned local browser storage. The secret is decrypted into memory only while unlocked.

The AfriPay API receives public addresses and signed transaction data. Raw wallet secrets must never be sent to the backend, logged, or stored in PostgreSQL.

This protects stored wallet data from casual inspection, but not an unlocked browser, malicious extensions, malware, or XSS. AfriPay has not had an independent security audit. Losing both the device wallet and recovery backup can permanently remove access to the account.

Read docs/WALLET_SECURITY.md and docs/NATIVE_WALLET_IMPLEMENTATION.md.

## Architecture

    User
      |
      v
    AfriPay Next.js frontend
      |-- Native wallet: local encryption and signing
      |-- Stellar Horizon and Soroban RPC
      |-- public address and signed XDR --> AfriPay NestJS API
                                            |-- Stellar Horizon/RPC
                                            |-- Stellar Testnet
                                            |-- PostgreSQL application metadata

PRIVATE KEYS DO NOT GO TO THE BACKEND.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, React 18, TypeScript |
| Styling | Tailwind CSS and global CSS design tokens |
| Frontend tests | Jest and Testing Library |
| Backend | NestJS 10 and TypeScript |
| Database | PostgreSQL through pg/TypeORM where configured |
| Cache | Redis through ioredis, optional |
| Blockchain | Stellar SDK 13, Horizon, Soroban RPC |
| Smart contracts | Rust and Soroban SDK 22 |
| Hosting | Vercel frontend and Vercel Node backend |
| CI | GitHub Actions, Node 20, Rust stable |

## Project Structure

    AfriPay/
    ├── frontend/              Next.js application
    │   └── src/
    │       ├── app/           routes and metadata
    │       ├── components/    wallet and UI components
    │       ├── hooks/         native wallet lifecycle
    │       ├── lib/           API, wallet, and Stellar helpers
    │       └── styles/        global design tokens
    ├── backend/               NestJS API
    │   ├── api/               Vercel Node function entry point
    │   ├── migrations/        PostgreSQL migrations
    │   └── src/
    │       ├── payments/      payment intents and links
    │       ├── stellar/       Horizon, Friendbot, and Soroban routes
    │       ├── momo/          MTN MoMo services and webhooks
    │       ├── rates/         exchange rates
    │       └── ussd/          USSD routes
    ├── contracts/              Soroban Rust workspace
    ├── docs/                   security and implementation notes
    └── .github/workflows/      CI checks

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Rust and Cargo for Soroban contracts
- PostgreSQL for durable application metadata
- Redis is optional for exchange-rate caching

### Install

    git clone https://github.com/Afri-pay/AfriPay.git
    cd AfriPay
    cd backend
    npm ci
    copy .env.example .env
    cd ../frontend
    npm ci
    copy .env.example .env.local

On macOS/Linux, replace copy with cp.

### Local environment

Backend defaults:

    PORT=3101
    NODE_ENV=development
    STELLAR_NETWORK=testnet
    STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
    STELLAR_RPC_URL=https://soroban-testnet.stellar.org
    FRONTEND_ORIGIN=http://localhost:3000

Frontend local API:

    NEXT_PUBLIC_API_URL=http://localhost:3101
    NEXT_PUBLIC_STELLAR_NETWORK=testnet

Use backend/.env.example and frontend/.env.example as the source of truth. Never commit real credentials, database passwords, private keys, or recovery secrets.

### Run locally

Terminal 1:

    cd backend
    npm run dev

Terminal 2:

    cd frontend
    npm run dev

Default URLs:

- Frontend: http://localhost:3000
- Backend: http://localhost:3101
- Health: http://localhost:3101/health

If port 3000 is occupied, Next.js may select another frontend port. The backend remains on 3101.

## API Endpoints

    GET  /health
    GET  /stellar/accounts/:publicKey
    GET  /stellar/accounts/:publicKey/history
    POST /stellar/accounts/:publicKey/fund-testnet
    POST /stellar/submit
    POST /stellar/soroban/prepare
    POST /stellar/soroban/submit
    GET  /stellar/soroban/transactions/:hash

Payment-intent and payment-link routes are under /payments. Application routes may require API_KEY depending on route and deployment configuration. Never send a wallet secret seed to any endpoint.

## Trying AfriPay on Stellar Testnet

1. Open the live application or run the frontend locally.
2. Create or import a native wallet.
3. Set a wallet password and back up the recovery secret offline.
4. Choose Fund Testnet Account for an unactivated account.
5. Confirm the XLM balance is loaded from Horizon.
6. Use the public address or QR code to receive Testnet XLM.
7. Use the send flow to review and locally sign a Testnet transaction.
8. View activity and open completed transactions in a Testnet explorer.

Friendbot funding is a developer/testing facility. Testnet assets are not real money.

## Soroban Contracts

| Contract | Purpose | Current status |
|---|---|---|
| gateway | Payment intents and authorized confirmation | Core logic implemented and unit-tested |
| escrow | P2P escrow lifecycle | Core crate/tests present; broader deployment/e2e evidence pending |
| multisig | Threshold approvals and asset transfer logic | Core crate/tests present; broader deployment/e2e evidence pending |
| vault | Deposit, withdrawal, and yield logic | Core crate/tests present; broader deployment/e2e evidence pending |

Contract source and tests are in contracts/. Source presence must not be treated as proof of a production deployment.

## Testing

    cd backend
    npm test -- --runInBand
    npm run lint
    npm run build

    cd ../frontend
    npm test -- --runInBand
    npm run lint
    npm run build

    cd ../contracts
    cargo test
    cargo clippy --all-targets --all-features -- -D warnings

GitHub Actions runs backend, frontend, and contract checks on pushes to main and pull requests.

## Deployment

The public frontend is deployed at https://afri-pay-beta.vercel.app/. The backend is deployed as a separate Vercel Node function at https://afripay-api-seven.vercel.app/.

The backend project uses backend/api/index.ts and backend/vercel.json. Configure FRONTEND_ORIGIN=https://afri-pay-beta.vercel.app and the Testnet Stellar URLs in the backend deployment. Configure NEXT_PUBLIC_API_URL=https://afripay-api-seven.vercel.app in the frontend Vercel Production environment, then redeploy the frontend.

## Project Status and Mainnet Position

AfriPay is an active MVP/testnet project. Native wallet creation, local encryption, Testnet funding, public-address receiving, balance retrieval, history retrieval, and supporting Stellar API routes are implemented. Payment-provider, persistence, Soroban application, and production-hardening work remains partial or planned.

AfriPay is NOT Mainnet-ready. Before real funds are supported, the project needs independent security review, XSS/CSP review, browser-storage and recovery testing, dependency audit, transaction/reserve/fee validation, Soroban authorization review, mobile-browser testing, monitoring, and an incident-response plan.

## Documentation

- docs/WALLET_SECURITY.md
- docs/NATIVE_WALLET_IMPLEMENTATION.md
- docs/STELLAR_TESTNET_DEPLOYMENT.md
- docs/DEPENDENCY_AUDIT.md
- docs/CONTRIBUTOR_BACKLOG.md
- CONTRIBUTING.md
- SECURITY.md
- CODE_OF_CONDUCT.md
- PROJECT_READINESS_REPORT.md

## Contributing

Read CONTRIBUTING.md. The normal workflow is:

    Fork → create a branch → implement → test → open a pull request

Preserve the Testnet-only default, do not add private keys or credentials, and include regression tests for behavior changes.

## License

AfriPay is released under the MIT License. See LICENSE.
