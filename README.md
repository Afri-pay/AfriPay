# AfriPay


**Send money home instantly. No more waiting days or losing money to fees.**

AfriPay is a mobile-first payment platform that makes sending money across Africa as easy as sending a text. Powered by Stellar's lightning-fast blockchain, your family gets their money in seconds, not days—and you keep more of what you send.


---

## Features

- **Instant Transfers** - Money arrives in 3-5 seconds, not 3-5 days
- **Ultra-Low Fees** - Pay less than 1% vs 8-10% with traditional services
- **Mobile Money Integration** - Send directly to MTN, Airtel, M-Pesa wallets
- **Multi-Currency Support** - NGN, KES, GHS, ZAR, USD, EUR and more
- **USSD for Feature Phones** - No smartphone? No problem. Dial *123# to send
- **Smart Exchange Rates** - Best rates from multiple providers
- **Payment Links** - Share links for easy collection
- **Bill Payments** - Pay utilities, airtime, subscriptions
- **Savings Vaults** - Earn yield on your savings with DeFi
- **No Bank Account Needed** - Just a phone number to get started

---

## Why AfriPay?

We've all been there: sending money home means standing in line, paying outrageous fees, and waiting days for delivery. Your family needs that money now, not next week. AfriPay fixes this:

- **No more Western Union lines** - Send from your phone, anytime, anywhere
- **Keep your money** - Save 90% on fees (send $100, they get $99, not $92)
- **Real-time delivery** - Money arrives before you finish your coffee
- **Reach everyone** - Works with smartphones AND feature phones
- **Total transparency** - See exactly what you pay and what they receive
- **Built for Africa** - By Africans, for Africans, solving African problems

---

## Tech Stack

**Frontend**: React, Next.js 14, TypeScript, TailwindCSS, PWA
**Backend**: NestJS, TypeORM, PostgreSQL, Redis, Bull
**Blockchain**: Stellar Network, Soroban Smart Contracts (Rust)
**Mobile Money**: MTN MoMo API, Airtel Money API, M-Pesa API
**USSD Gateway**: Africa's Talking, Flutterwave USSD
**Wallet Integration**: Freighter, Lobstr, xBull
**KYC/Compliance**: Smile Identity, Onfido
**Exchange Rates**: Currency Layer, Open Exchange Rates
**Real-time**: WebSockets, Server-Sent Events
**Infrastructure**: Docker, GitHub Actions, Vercel, Railway

---

## Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Rust 1.70+ and Cargo
- PostgreSQL 14+
- Redis (for job queues)
- Stellar CLI (`stellar-cli`)
- Docker (optional)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/afripay-contracts.git
cd afripay-contracts

# Install dependencies
npm install

# For smart contracts
cargo build

# Copy environment variables
cp .env.example .env

# Configure your .env file with:
# - Database credentials
# - Stellar network (testnet/mainnet)
# - Mobile money API keys
# - KYC provider credentials
# - Exchange rate API keys

# Run database migrations
npm run migrate

# Deploy contracts to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/escrow.wasm \
  --source YOUR_SECRET_KEY \
  --network testnet

# Start development servers
npm run dev
```

Visit `http://localhost:3000` to start sending money!

---

## Quick Start

### Sending Money

1. **Enter Amount** - How much you want to send
2. **Choose Recipient** - Phone number or Stellar address
3. **Select Method** - Mobile money, bank transfer, or crypto wallet
4. **Review Details** - See fees and exchange rate upfront
5. **Confirm & Send** - Approve with your wallet
6. **Done!** - Recipient gets notified instantly

### Receiving Money

1. Get notification via SMS or push
2. Open the payment link
3. Choose how to receive (mobile money, bank, wallet)
4. Confirm your details
5. Money arrives in seconds

### USSD (Feature Phones)

```
Dial: *123*AfriPay#

1. Send Money
2. Check Balance
3. Transaction History
4. Help

Enter recipient number: 0812345678
Enter amount: 5000
Confirm? 1=Yes, 2=No
```

---

## Project Structure

```
afripay/
├── contracts/              # Soroban smart contracts (Rust)
│   ├── escrow/            # P2P escrow contract
│   ├── multisig/          # Multi-signature wallet
│   ├── gateway/           # Payment gateway
│   └── vault/             # Savings vault with yield
├── backend/
│   ├── src/
│   │   ├── api/           # REST API routes
│   │   ├── payments/      # Payment processing
│   │   ├── stellar/       # Blockchain integration
│   │   ├── momo/          # Mobile money services
│   │   ├── ussd/          # USSD gateway
│   │   ├── kyc/           # KYC/compliance
│   │   ├── rates/         # Exchange rates
│   │   ├── notifications/ # SMS, push, email
│   │   └── webhooks/      # Provider webhooks
│   └── migrations/        # Database migrations
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # React components
│   │   │   ├── Send/      # Send money flow
│   │   │   ├── Receive/   # Receive money flow
│   │   │   ├── Wallet/    # Wallet management
│   │   │   ├── History/   # Transaction history
│   │   │   └── Settings/  # User settings
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities
│   │   └── styles/        # Global styles
│   └── public/            # Static assets
└── docs/                  # Documentation
```

---

## Contributing

We welcome contributors! AfriPay is participating in the **Stellar Drips Wave Program** - earn rewards while building the future of African payments.

### Getting Started

1. Read our [CONTRIBUTING.md](CONTRIBUTING.md) guide
2. Browse [open issues](../../issues) tagged with `good first issue`
3. Check out the [Code of Conduct](CODE_OF_CONDUCT.md)
4. Join our [Discord community](https://discord.gg/wbTVX2dP9Y)

### Drips Wave Rewards

Earn points for contributions:
- **Trivial** (100 pts) - Bug fixes, docs, UI tweaks
- **Easy** (250 pts) - Components, tests, simple features
- **Medium** (500 pts) - API endpoints, integrations
- **Hard** (750 pts) - Complex features, security
- **Epic** (1000 pts) - Full modules, major features

Points convert to real rewards through Drips Network!

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/mobile-money-ghana`)
3. Make your changes with clear commits
4. Add tests and documentation
5. Push to your fork
6. Open a Pull Request

---

## Roadmap

### Phase 1: MVP (Current - Testnet)
- [x] Basic P2P transfers (XLM, USDC)
- [x] Web wallet interface
- [x] Transaction history
- [ ] OCR receipt scanning
- [ ] Mobile money integration (Nigeria)
- [ ] Basic KYC verification
- [ ] Exchange rate API

### Phase 2: Scale (Q2 2026)
- [ ] USSD gateway for feature phones
- [ ] Multi-country support (Kenya, Ghana, South Africa)
- [ ] Bill payment integration
- [ ] Savings vaults with yield
- [ ] Native mobile apps (iOS, Android)
- [ ] Agent network program

### Phase 3: Ecosystem (Q3 2026)
- [ ] Merchant payment SDK
- [ ] Business bulk payments
- [ ] API marketplace for developers
- [ ] Loyalty and rewards program
- [ ] Cross-border trade payments
- [ ] Remittance corridors to 20+ countries

### Phase 4: Scale & Impact (Q4 2026)
- [ ] Decentralized identity system
- [ ] Microfinance integration
- [ ] Insurance products
- [ ] Agricultural payments
- [ ] Government disbursements
- [ ] 1M+ active users across Africa

---

## Use Cases

- **Send Money Home** - Workers abroad supporting families
- **Pay Suppliers** - Small businesses paying vendors
- **Receive Payments** - Freelancers getting paid globally
- **Split Bills** - Groups sharing costs
- **Emergency Money** - Urgent transfers when needed
- **Savings** - Earn yield in stable currencies
- **Remittances** - Cross-border personal transfers
- **Payroll** - Companies paying remote workers
- **Marketplace Escrow** - Safe peer-to-peer transactions
- **Donations** - NGOs and community fundraising

---

## Security & Privacy

- **Non-Custodial** - You control your keys, we never hold funds
- **End-to-End Encryption** - Messages and data encrypted
- **KYC Compliant** - Meet regulatory requirements
- **Multi-Sig Protection** - Optional multi-signature for large amounts
- **Transaction Monitoring** - Fraud detection and prevention
- **Open Source** - Code is auditable by anyone
- **Testnet First** - Practice safely before mainnet
- **Bug Bounty Program** - Rewards for security researchers (coming soon)

**Security Reporting**: security@afripay.io

---

## Mobile App Features (PWA)

- **Install on Home Screen** - Works like a native app
- **Offline Mode** - View history and prepare transactions offline
- **Push Notifications** - Real-time payment alerts
- **Biometric Auth** - Face ID, Touch ID, fingerprint
- **Low Data Usage** - Optimized for African mobile networks
- **Works on 2G** - Designed for slow connections
- **Camera Integration** - Scan QR codes for addresses
- **Multi-Language** - English, Hausa, Yoruba, Swahili, Zulu, Amharic

---

## Supported Currencies & Countries

### Fiat Currencies
**West Africa**: NGN (Nigeria), GHS (Ghana), XOF (Senegal, Côte d'Ivoire)
**East Africa**: KES (Kenya), TZS (Tanzania), UGX (Uganda), ETB (Ethiopia)
**Southern Africa**: ZAR (South Africa), BWP (Botswana), ZMW (Zambia)
**North Africa**: EGP (Egypt), MAD (Morocco)
**International**: USD, EUR, GBP

### Crypto Assets
- **XLM** - Stellar Lumens
- **USDC** - USD Coin (stable)
- **USDT** - Tether (stable)
- **Custom Stellar Assets** - Community tokens

### Mobile Money
- MTN Mobile Money (17 countries)
- Airtel Money (14 countries)
- M-Pesa (Kenya, Tanzania)
- Orange Money (francophone Africa)
- Vodacom M-Pesa (South Africa)

---

## Design Philosophy

- **Mobile-First** - Designed for African smartphones
- **Ultra-Fast** - Every action under 2 seconds
- **Data-Light** - Minimal data usage for expensive networks
- **Offline-Ready** - Core features work without internet
- **Simple UI** - Your grandmother should understand it
- **Local Languages** - Speak your language, not just English
- **Trust Signals** - Clear fees, real-time updates, receipts

---

## Compliance & Regulations

AfriPay is designed to comply with:
- **Nigeria**: CBN Guidelines, NDPR (Data Protection)
- **Kenya**: CBK Regulations, Data Protection Act
- **Ghana**: BoG E-Money Guidelines
- **South Africa**: SARB, POPIA
- **International**: AML/CFT Standards, FATF Guidelines

We work with local regulators to ensure legal operation.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built on [Stellar](https://stellar.org) blockchain
- Supported by [Stellar Development Foundation](https://stellar.org/foundation)
- Part of the [Drips Wave Program](https://www.drips.network/wave)
- Mobile money powered by [Africa's Talking](https://africastalking.com)
- KYC by [Smile Identity](https://smileidentity.com)

---

## Contact & Community

- **Website**: [afripay.io](https://afripay.io) (coming soon)
- **Twitter**: [@AfriPayHQ](https://twitter.com/AfriPayHQ)(coming soon)
- **Discord**: [Join our community](https://discord.gg/wbTVX2dP9Y)
- **Telegram**: [AfriPay Community](https://t.me/+VzINO9TdD8M2NjQ0)


---



---


---

## Impact Metrics (Target)

- **$100M+** sent across borders
- **500K+** families supported
- **$8M+** saved in fees vs traditional remittance
- **30+** African countries served
- **1M+** transactions processed

---

**Built with ❤️ in Nigeria, for all of Africa**

**Stop waiting. Stop overpaying. Send money home the African way.** 🌍✨
