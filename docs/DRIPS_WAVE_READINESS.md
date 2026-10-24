# Drips Wave reconsideration evidence

Prepared October 23, 2026. This is an evidence packet, not a submitted appeal or acceptance prediction.

## Project summary and technical evidence

AfriPay is open-source African payment infrastructure using a native non-custodial browser wallet, Stellar Testnet XLM settlement, a NestJS/PostgreSQL API, Soroban contracts, and unfinished mobile-money/USSD adapters. Stellar usage is real: a signed XLM payment has independent Horizon settlement/history evidence. Soroban provides programmable authorization/asset transfers; it is not used by the native XLM send path and no complete MoMo-to-gateway bridge is claimed.

- [Native Testnet payment evidence](TESTNET_PAYMENT_EVIDENCE.md): authentic hash, public addresses, amount, explorer URL, same-envelope retry and restart verification.
- [Historical contract evidence](STELLAR_TESTNET_DEPLOYMENT.md): four IDs/eight upload-deploy hashes; all were queried read-only. The updated branch is not redeployed.
- [Validation report](../PROJECT_READINESS_REPORT.md): executed backend/frontend/contract tests and builds, real isolated PostgreSQL validation, production CSP rendering, and unsuppressed advisory gate.
- [Security report](SECURITY_REMEDIATION_REPORT.md): signing, settlement, persistence, authorization, CSP and workflow improvements with residual risks.
- [Remaining work](REMAINING_WORK.md): honest feature/issue classification and technically scoped contributor work.

## Improvements after the reported appeal dismissal

The maintainer supplied an appeal-dismissal date of **September 18, 2026**, with **two appeals remaining**. This is user-provided correspondence, not independently read from the Drips account. The original rejection date is unknown. Baseline main ended at September 17; no baseline commits after September 18 were found. Do not relabel prior deployments, old tests or historical PRs as post-dismissal progress.

New October 23 commits include:

1. [9f1c359](https://github.com/Afri-pay/AfriPay/commit/9f1c359): reviewed native signing, durable intent/hash binding, independent settlement verification, API/provider protections and real Testnet evidence.
2. [ec3c4ed](https://github.com/Afri-pay/AfriPay/commit/ec3c4ed): escrow consent/expiry, multisig initialization invariants, gateway initialization consent, checked arithmetic and expanded adversarial tests.
3. [869bb98](https://github.com/Afri-pay/AfriPay/commit/869bb98): framework/dependency upgrade, nonce CSP and reliable build configuration.

Subsequent validation, dependency and documentation commits are listed in the PR/git log. All current work must be reviewed before it is described as maintained/released capability.

## Open-source health and limitations

The repository has an MIT license, contribution/security/conduct documentation, issue forms and a repaired Markdown PR template. The audit read 12 open issues, 15 closed issues and 16 PR descriptions/discussions. These are inspection counts, not adoption metrics. Historical examples: [native-wallet continuity #43](https://github.com/Afri-pay/AfriPay/pull/43), [deployment evidence #39](https://github.com/Afri-pay/AfriPay/pull/39), [MoMo sandbox #28](https://github.com/Afri-pay/AfriPay/pull/28), and [gateway #26](https://github.com/Afri-pay/AfriPay/pull/26). Brief maintainer approvals are not independent audits.

No new users, contributors, releases, production usage or funding eligibility are claimed. No activity was created to inflate repository statistics. No open issues were indiscriminately closed. Full browser/mobile/provider validation, durable scheduled reconciliation, USSD authorization, simulated vault behavior and production rollout remain material limitations.

## Current official process

Checked against Drips' [maintainer participation documentation](https://docs.drips.network/wave/maintainers/participating-in-a-wave/) and [Terms and Rules](https://docs.drips.network/wave/terms-and-rules/) on October 23, 2026. A repository applies to the relevant ecosystem program and organizers decide admission; engineering improvements do not guarantee selection. The official guidance requires substantive progress for reconsideration and uses the in-app Maintainers -> Orgs and Repos appeal path. It specifies two weeks before the first appeal, a one-month cooldown after a declined appeal, and at most three appeals per repository. Rejected repositories cannot simply reapply to bypass that process.

Based on the reported September 18 dismissal, one calendar month ended October 18. **This is a date calculation, not verification that the dashboard currently enables another appeal.** Confirm the dashboard's eligibility and remaining count before taking action. Do not submit through email/Discord or create another repository/account to circumvent the decision.

## Draft evidence-based appeal summary

Since the reported September 18 appeal dismissal, we repaired the native Stellar Testnet payment workflow and added explicit local transaction review, exact intent validation, same-envelope idempotency, awaited PostgreSQL persistence and independent Horizon confirmation. We recorded a real authorized disposable-account payment and tested history/restart behavior. We strengthened escrow and multisig authorization, added adversarial asset-conservation/replay tests, upgraded vulnerable frontend packages, and added nonce CSP and stronger CI checks. The attached reports separate tested functionality from missing integrations and known security findings. The final dependency audits report zero vulnerabilities, while operational/browser/provider work remains unfinished; we do not claim Mainnet readiness or independent audit.

Before submitting, replace draft validation references with the final reviewed PR/CI/deployment evidence and resolve material operational blockers. The maintainer must decide when progress is sufficient to use a remaining appeal. No appeal is submitted automatically.
