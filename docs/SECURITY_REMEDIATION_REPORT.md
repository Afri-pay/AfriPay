# Security remediation report

Date: 2026-10-23. This is a source review and regression-test record, not an independent security audit or Mainnet approval.

## Confirmed findings and remediation

| Finding | Impact | Implemented remediation / evidence |
|---|---|---|
| Source-only XDR signing/intent checks | A changed recipient, amount, operation, memo or fee could be signed or misattributed | Browser checks single native payment, exact decimal units, source, destination, memo, fee, bounds and signatures; backend validates intent and authentic Testnet source signature |
| Submission equated with success | False payment confirmation | Independent Horizon hash, ledger and successful-result query; uncertain/transport failures stay PENDING |
| Unawaited metadata writes and stale process caches | Success responses despite data loss; races across instances | Awaited writes, authoritative SQL reads, atomic idempotency-key insert, conditional terminal updates, unique hash index; real PostgreSQL concurrency/restart/failure tests |
| New transaction on retry | Duplicate settlement risk | Durable one-hash-per-intent claim before broadcast; retries preserve signed envelope; pending public ID survives browser refresh |
| Fixed fee and missing reserve checks | Failed or overspending transactions | Fee statistics, activated destination, integer-stroop arithmetic, ledger reserve, sponsorship and selling-liability checks |
| Wallet metadata/key inconsistency | Imported/modified metadata could misidentify unlocked wallet | Validate format/KDF/iterations/nonce/salt/network and recovered public key; corrupted ciphertext/wrong password/restoration/removal tests |
| Escrow unilateral release/refund before expiry | Intended escrow protection bypassed | Depositor authorizes release before expiry; refund requires depositor and expiry; duplicate and failed-transfer conservation tests |
| Multisig duplicate signers and unconsented init | Invalid threshold set/initialization | Unique signers, signer consent, amount checks, threshold/replay/token-balance tests |
| Vault arithmetic overflow | Uncontrolled arithmetic failure | Checked additions/multiplications and unchanged-balance regression test; still simulated accounting |
| MoMo writes after provider side effect | Duplicate/unrecoverable provider attempts | Persist reference before call, DB uniqueness, terminal conditional updates, resource amount/currency/product checks, request timeouts and safe errors |
| Unprotected production callbacks | Forged statuses with missing webhook config | Production fails closed without shared token; no claim of provider cryptographic signatures |
| Browser service credential | Publishing a key could expose privileged MoMo operations | Public signed Testnet wallet routes no longer require service key; browser stopped attaching NEXT_PUBLIC_API_KEY; service routes retain API-key protection |
| Public abuse / oversized inputs | Resource exhaustion | Global per-instance bounded rate guard, 32KB parsers, parameter limit, HTTP 401/413/429 tests; guarded USSD |
| False USSD success and unauthenticated PIN prompt | Misleading users and collecting unnecessary secrets | Explicit unavailable response; no PIN prompt or claimed transfer/SMS |
| Critical framework dependencies | Known published vulnerabilities | Next 14 to reviewed 15.5.28 / React 19 migration; PostCSS 8 security override; compatible npm remediation |
| Weak CSP | Broad script execution | Per-request random script nonce, strict-dynamic, no unsafe-inline/eval scripts in production, dynamic rendering, no-store responses; style inline remains allowed |
| Workflow supply chain | Mutable action references/excess privileges | Verified immutable action SHAs, read-only permissions, no persisted credentials, no privileged PR triggers; security job enforces high-advisory gate |

## Outstanding security work

- Final npm audits report zero vulnerabilities in either workspace. Baselines were 66 backend and 50 frontend advisories, including critical findings. Compatible fixes plus coordinated Nest 12, Stellar SDK 17, Jest 30 and Tailwind 4 migrations removed the reported dependency chains. See the saved reports and [DEPENDENCY_AUDIT](DEPENDENCY_AUDIT.md). No advisory suppressions or forced success checks were introduced. This is dated advisory evidence, not a guarantee that dependencies are vulnerability-free.
- The SDK 17 migration adapted byte-array hashes, signature properties and UTF-8 memo decoding, preserving existing encrypted-wallet compatibility. Nest 12 uses ESM; backend tests use native VM-module support on Node 24.9+. Browser tests transform ESM byte helpers and align TextEncoder byte-array realms. Tailwind 4 requires modern browsers (Safari 16.4+, Chrome 111+, Firefox 128+); mobile visual verification remains outstanding.
- Public wallet metadata is public, not per-user private authorization. Source-account-key signing is supported; fee-bumps, hardware wallets, muxed destinations and custom signer thresholds need explicit support.
- A PENDING transaction absent from Horizon remains uncertain. The wallet refuses another payment while a locally recorded pending ID is unresolved. Automatic expiry recovery and background native reconciliation still need a ledger-aware policy; do not clear pending records merely because a request timed out.
- Production needs distributed edge limits; process-local guards do not coordinate across serverless instances. CORS is not authentication. Service API keys are coarse service authorization, not roles or user identity. Rotate any previously published service key through a separately authorized deployment action.
- MoMo shared-token callback authentication cannot prove provider origin cryptographically. Durable centralized event claims/router and provider-state reconciliation under operational failure remain incomplete. A reserved request that never reached MTN stays pending; do not create a fresh reference blindly. Vercel process timers do not provide durable scheduled jobs.
- Browser memory cannot be reliably zeroed, and deleting localStorage does not guarantee forensic erasure. XSS, malicious extensions, unlocked devices and compromised dependencies remain risks. The wallet retains the existing eight-character minimum; choose long unique passwords. Versioned KDF migration and independent cryptographic review remain needed.
- Gateway confirmation is a trusted-confirmer attestation, not autonomous payment-proof verification. Vault balances/yield are not asset-backed. Contract TTL/restore, upgrades, initialization deployment procedure, malicious-token/reentrancy assumptions and broader property testing need independent review. Do not redeploy without authorization.

## Secret and execution review

`node scripts/scan-secrets.cjs --history` found no matches for its Stellar seed, private-key marker, GitHub token and AWS access-ID patterns in tracked files/reachable diffs. This heuristic does not certify absence of credentials in external logs, inaccessible refs, arbitrary provider tokens or deleted remote history. No production credentials were rotated or exposed in evidence.

No tracked automatic VS Code execution tasks/settings or executable binaries were found. Existing lifecycle scripts were ordinary tooling; installs initially disabled lifecycle scripts. Actions were inspected for untrusted PR execution and pinned. Independent application/contract review is still required before any real-money use.
