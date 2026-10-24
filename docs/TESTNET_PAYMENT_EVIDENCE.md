# Stellar Testnet payment evidence

Verified October 23, 2026, 08:34:58 WAT (07:34:58 UTC). The maintainer explicitly authorized two disposable accounts, Friendbot funding, and valueless Testnet transfers. No existing wallet or real funds were used.

| Field | Observed value |
|---|---|
| Network | Stellar Testnet (`Test SDF Network ; September 2015`) |
| Transaction | `83f99505a45062c47d1ea4ca2d81dc2ea0f85f90b562dac20d979d73201251e2` |
| Explorer | [Confirmed transaction](https://stellar.expert/explorer/testnet/tx/83f99505a45062c47d1ea4ca2d81dc2ea0f85f90b562dac20d979d73201251e2) |
| Sender | `GCTS24LQ43III5NOHD3KXU7AHZAGVEGRSMHQLM7U24ZJWNODIW2CNISA` |
| Recipient | `GD4F56JY6DXRITU5XZFPCCERIWXJ4VHQBG3HYMGMFVN4P7WFQJ4A4OXD` |
| Asset / amount | XLM / `1.0000001` |
| Actual fee bid | `279349` stroops, dynamically derived from Horizon fee statistics |
| Intent | `2aeebb66-1e4f-4c05-9c02-3b62a198e5b2` |
| Result | SUCCEEDED after an independent Horizon ledger-inclusion query |

Executed `scripts/testnet-payment.cjs` with explicit opt-in and an isolated PostgreSQL database. It used the actual wallet encryption/decryption and reviewed local-signing helpers, backend preflight, durable intent creation, signed-envelope submission, transaction polling, history lookup, identical-envelope retry, and store restart verification. Only public evidence was written to [testnet-payment.json](evidence/testnet-payment.json); disposable secrets were generated in process and were not printed, transmitted to the backend, or saved.

This is a real library/API integration test running in Node. It does not prove browser interaction, a public deployed payment, mobile compatibility, MoMo settlement, or a Soroban gateway invocation. Separate component tests cover review-before-signing and repeated clicks. No independent audit is implied.

Reproduction requires Node dependencies, an isolated migrated PostgreSQL database, explicit maintainer permission, `TEST_DATABASE_URL`, and `AFRIPAY_ALLOW_TESTNET_TRANSFER=yes`. Run `node scripts/testnet-payment.cjs` from the repository root. The opt-in guard deliberately prevents accidental transfers during ordinary CI. Testnet can reset; preserve the dated record and re-query links before relying on it.

Historical contract IDs and deployment hashes are in [STELLAR_TESTNET_DEPLOYMENT](STELLAR_TESTNET_DEPLOYMENT.md). The read-only October 23 probes found all four instances and all eight listed upload/deployment transactions. Those deployments precede this branch's contract authorization changes; no redeployment occurred.
