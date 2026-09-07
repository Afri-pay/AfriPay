# Stellar Testnet Deployment

AfriPay is configured for Stellar Testnet only. This document intentionally contains no fabricated contract IDs or transaction hashes.

## Current verified evidence

| Contract | Testnet contract ID | Deployment transaction |
| --- | --- | --- |
| Gateway | Not deployed from this checkout | Not available |
| Escrow | Not deployed from this checkout | Not available |
| Multisig | Not deployed from this checkout | Not available |
| Vault | Not deployed from this checkout | Not available |

The contracts compile to WASM locally at:

`contracts/target/wasm32-unknown-unknown/release/{gateway,escrow,multisig,vault}.wasm`

## Prerequisites for a real deployment

- Stellar CLI installed and authenticated/configured for `testnet`.
- A funded Testnet deployer account. Keep the secret key outside the repository.
- `STELLAR_NETWORK=testnet` and the Testnet RPC URL.

## Build

```powershell
cd contracts
cargo build --release --target wasm32-unknown-unknown
```

## Deploy

Use the Stellar CLI for each WASM artifact and record the CLI's actual contract ID and deployment transaction hash here only after successful confirmation. Do not paste secret keys into shell history or documentation.

```powershell
stellar contract deploy `
  --wasm target/wasm32-unknown-unknown/release/gateway.wasm `
  --source-account <configured-testnet-account> `
  --network testnet
```

Repeat for `escrow.wasm`, `multisig.wasm`, and `vault.wasm`. After deployment, verify each ID using a Testnet explorer and add direct explorer links to the table above.

## Payment evidence

The frontend uses Freighter to sign a transaction built by the backend and submits the signed envelope to Horizon Testnet. A successful payment must be recorded with:

- the actual transaction hash;
- the Stellar Expert or Stellar Laboratory Testnet URL;
- sender, recipient, asset, and amount;
- the AfriPay payment-intent ID.

No live evidence is recorded until a funded account and Freighter approval are available.
