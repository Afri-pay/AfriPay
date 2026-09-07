# AfriPay

**Open-source Stellar payment infrastructure for African cross-border payments**, combining Soroban smart contracts with mobile-money, USSD, and traditional payment rails.

AfriPay helps diaspora and local users move value quickly and transparently. The project is under active development and targets **Stellar Testnet** and **MTN MoMo sandbox** by default.

Repository: https://github.com/Afri-pay/AfriPay

---

## What AfriPay Does

AfriPay addresses slow, expensive remittance and P2P payment flows in Africa by:

1. Recording payment intents and escrow logic on **Soroban** (Stellar smart contracts)
2. Integrating **MTN Mobile Money** for collections and disbursements
3. Offering a **USSD menu** for feature-phone access
4. Providing a **Next.js frontend** with Freighter wallet connection
5. Caching **exchange rates** for multi-currency display

The product vision is instant, low-cost transfers. The current codebase is an **MVP / testnet foundation** — see [Implemented Features](#implemented-features) for what actually works today.

---

## Why Stellar? Why Soroban? Why Africa?

| Choice | Rationale |
|--------|-----------|
| **Stellar** | Fast finality (~3–5s), low fees, native multi-currency assets, strong presence in emerging markets |
| **Soroban** | On-chain payment intents, escrow, multisig, and savings logic with deterministic execution |
| **Africa** | Mobile-money-first economies, USSD access, high remittance demand, fragmented payment rails |

**Intended users:** diaspora senders, local recipients on mobile money, developers integrating payment APIs, and OSS contributors building Stellar payment infrastructure.

---

## Core Architecture

```text
Next.js Frontend (port 3000)
       |
       |  Payment intents, Freighter signing, receive links
       v
NestJS Backend (port 3001)
       |
       +---- Health / Rates API
       |
       +---- MTN MoMo (collection, disbursement, webhooks)
       |
       +---- USSD (Africa's Talking callback)
       |
       +---- Redis (exchange-rate cache, optional)
       |
       v
Stellar Testnet / Soroban Contracts
  - gateway (payment intents)
  - escrow (P2P escrow)
  - multisig (threshold approvals)
  - vault (savings APY)
```

PostgreSQL-backed MoMo persistence is enabled when `DATABASE_URL` is configured; the migration runs automatically unless `MOMO_AUTO_MIGRATE=false`. Stellar submission remains Testnet-only and requires a funded account plus Freighter approval.

---

## Implemented Features

Verified in the current codebase:

| Feature | Location | Notes |
|---------|----------|-------|
| Soroban payment gateway | `contracts/gateway/` | Create intent, confirmer auth, confirm, rotate confirmer |
| Soroban escrow (basic) | `contracts/escrow/` | Create payment with auth; release/refund pending |
| Soroban multisig | `contracts/multisig/` | Propose, approve, execute (no token transfer yet) |
| Soroban savings vault | `contracts/vault/` | Deposit, withdraw, fixed APY accrual |
| MTN MoMo integration | `backend/src/momo/` | Collection, disbursement, status, webhooks (sandbox) |
| USSD menu | `backend/src/ussd/` | Send money flow, balance/history/help (demo responses) |
| Exchange-rate service | `backend/src/rates/` | Open Exchange Rates + Redis cache |
| Freighter wallet connect | `frontend/src/` | Connect/disconnect public key in UI |
| Health check | `backend/src/api/` | `GET /health` |
| CI | `.github/workflows/ci.yml` | Contracts, backend, frontend jobs |

---

## In Progress

| Feature | Status |
|---------|--------|
| Frontend send/receive flows | Payment-intent and receive-link UI; live signing requires Testnet account |
| Backend ↔ Stellar settlement | Horizon transaction construction and signed Testnet submission endpoints |
| Escrow release/refund | Asset-backed lifecycle entry points implemented; deployment/e2e evidence pending |
| Multisig asset transfer | Asset-aware threshold execution implemented; deployment/e2e evidence pending |
| MoMo persistence | PostgreSQL-backed when `DATABASE_URL` is configured; memory fallback for local tests |
| API security | API key guard enforced in production; local development may omit `API_KEY` |

---

## Planned

- Payment links and reconciliation dashboard
- KYC (Smile Identity / Onfido — module stub exists)
- Notifications (SMS/push — module stub exists)
- Airtel Money, M-Pesa integrations
- Mainnet deployment path
- API authentication and rate limiting
- Durable PostgreSQL transaction storage

---

## Technology Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Jest |
| Backend | NestJS 10, TypeScript, Jest, ioredis |
| Contracts | Rust, Soroban SDK 21 |
| Integrations | MTN MoMo API, Open Exchange Rates, Freighter |
| CI | GitHub Actions (Rust + Node 20) |

---

## Project Structure

```text
AfriPay/
├── contracts/           # Soroban smart contracts (Rust workspace)
│   ├── gateway/         # Payment intent lifecycle
│   ├── escrow/          # P2P escrow
│   ├── multisig/        # Multi-signature approvals
│   └── vault/           # Savings vault
├── backend/             # NestJS API
│   └── src/
│       ├── api/         # Health
│       ├── momo/        # MTN Mobile Money
│       ├── ussd/        # USSD gateway
│       └── rates/       # Exchange rates
├── frontend/            # Next.js app
│   └── src/
│       ├── app/         # Pages
│       ├── components/  # UI (WalletConnect)
│       └── hooks/       # Freighter wallet hook
├── docs/                # Additional documentation
├── .github/workflows/   # CI
├── CONTRIBUTING.md
├── SECURITY.md
└── CODE_OF_CONDUCT.md
```

---

## Local Development

### Prerequisites

- Node.js 20+
- npm
- Rust 1.70+ and Cargo (for contracts)
- Redis (optional; rates service degrades gracefully without it)

### Backend

```bash
cd backend
npm ci
cp .env.example .env
# Edit .env with your sandbox credentials
npm run dev
```

Backend runs at `http://localhost:4000` (default; override with `PORT` in `.env`).

### Frontend

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Frontend runs at `http://localhost:3000`.

### Contracts

```bash
cd contracts
cargo test
cargo clippy --all-targets --all-features -- -D warnings
```

Requires a working Rust toolchain. CI runs these on Ubuntu.

---

## Environment Variables

See:

- [`backend/.env.example`](backend/.env.example) — MTN MoMo, Redis, Stellar, exchange rates
- [`frontend/.env.example`](frontend/.env.example) — public API URL, network label

Never commit real secrets.

---

## Testing

Commands verified in this repository:

```bash
# Backend
cd backend && npm test
cd backend && npm run lint
cd backend && npm run build

# Frontend
cd frontend && npm test
cd frontend && npm run lint
cd frontend && npm run build

# Contracts (requires Rust)
cd contracts && cargo test
cd contracts && cargo clippy --all-targets --all-features -- -D warnings
```

CI runs backend lint + test, frontend lint + test, and contract test + clippy on every pull request.

---

## Stellar Network

| Setting | Default |
|---------|---------|
| Network | **Stellar Testnet** |
| Horizon | `https://horizon-testnet.stellar.org` |
| Soroban RPC | `https://soroban-testnet.stellar.org` |

Configure via `STELLAR_NETWORK`, `STELLAR_HORIZON_URL`, and `STELLAR_RPC_URL` in backend `.env`. Mainnet is not configured or tested in this repo.

---

## Payment Gateway Lifecycle

On-chain payment intents (`contracts/gateway`):

```text
Created (Pending)
  |
  v
Confirmed
```

Off-chain MTN MoMo transactions:

```text
PENDING
  |
  +---- FAILED
  |
  v
SUCCESSFUL
```

Confirmation on-chain requires the authorized confirmer address. MoMo status is updated via API polling or webhook callback.

---

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting, webhook verification, contract assumptions, and known limitations.

**Important:** Backend API routes are not authenticated yet. Do not expose an unsecured deployment to the public internet.

Report vulnerabilities to **security@afripay.io** — do not open public issues for security bugs.

---

## Contributing

We welcome contributions. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, workflow, and PR expectations.

Also see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## License

MIT License — see [LICENSE](LICENSE).

---

## Contact

- **GitHub Issues:** https://github.com/Afri-pay/AfriPay/issues
- **Security:** security@afripay.io
- **Discord:** https://discord.gg/wbTVX2dP9Y

---

*Built for Africa. Technically honest about what works today and what comes next.*
