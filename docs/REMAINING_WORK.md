# Remaining work and issue reconciliation

Updated 2026-10-23. The requested definition of done is **not fully satisfied**. Completed engineering and executed checks are in [PROJECT_READINESS_REPORT](../PROJECT_READINESS_REPORT.md).

## Progress checklist

- [x] Fetch clean default branch and create feature branch; inspect source, tests, configs, history, issues and PR discussions.
- [x] Harden native wallet signing/review and local encryption validation.
- [x] Implement real Testnet payment preflight, evidence-based settlement, durable intent/hash binding and same-envelope retries.
- [x] Run authorized disposable Testnet payment and record authentic hash/history/restart evidence.
- [x] Add PostgreSQL concurrency, restart, uniqueness, failure and migration tests.
- [x] Harden core escrow/multisig/gateway authorization and vault arithmetic; test/build all four crates.
- [x] Harden MoMo persistence, callbacks, timeouts and input validation; remove false USSD completion/PIN collection.
- [x] Upgrade vulnerable application and tooling dependencies; add CI database/fmt/WASM/security checks and immutable actions.
- [x] Complete compatibility-reviewed Nest/SDK/Jest/Tailwind migrations; final audits report zero vulnerabilities without suppressions.
- [ ] Complete and verify browser E2E/mobile UX, public deployment, MoMo credentials/provider runs, durable scheduled reconciliation, centralized webhook claims, authenticated USSD payments, and independent security review.
- [ ] Deploy approved application changes and separately authorized new contract versions. No live deployment was performed.
- [ ] Obtain maintainer review and green required checks before reconsideration. Appeal submission is a separate maintainer action.

## All open issues reviewed

No automatic closures: several issues overlap existing code but their complete acceptance criteria are not met or the fixes are not merged.

| Issue | Verified disposition / evidence |
|---|---|
| [#36](https://github.com/Afri-pay/AfriPay/issues/36), [#18](https://github.com/Afri-pay/AfriPay/issues/18) | Central webhook module remains a stub. MoMo auth/status handling and scheduler exist, but typed central routing/durable event claiming tests are missing. Keep open. |
| [#35](https://github.com/Afri-pay/AfriPay/issues/35) | API-key guard, global rate limit, body limits, USSD guard and real HTTP tests now exist; roles/distributed limits/provider USSD identity remain incomplete. Keep open pending review. |
| [#33](https://github.com/Afri-pay/AfriPay/issues/33), [#15](https://github.com/Afri-pay/AfriPay/issues/15) | USSD remains a bounded, guarded demonstration. No real account binding, durable session/payment adapter or provider proof; no PIN is collected. Keep open. |
| [#32](https://github.com/Afri-pay/AfriPay/issues/32) | Awaited MoMo SQL writes/reads and pre-call reference reservation now exist. More provider interruption/restart/concurrency evidence and reviewed recovery policy needed before closure. |
| [#34](https://github.com/Afri-pay/AfriPay/issues/34) | Native XLM settlement verification works; Soroban prepare/submit/poll exists. MoMo-to-gateway confirmation orchestration and authorized confirmer operation remain absent. Keep open. |
| [#31](https://github.com/Afri-pay/AfriPay/issues/31) | Asset-backed escrow authorization/expiry, events and conservation/replay tests now implemented. Legacy create_payment remains metadata-only; interface expectations differ and updated contracts are not deployed/merged. Keep open pending review. |
| [#20](https://github.com/Afri-pay/AfriPay/issues/20) | English-only UI; two-language send flow and switcher absent. Keep open. |
| [#19](https://github.com/Afri-pay/AfriPay/issues/19) | Expiring backend link and resolving /pay/[id] page now exist with locally reviewed payment flow. Full browser interaction/expired-link tests and merge review still needed. Keep open. |
| [#17](https://github.com/Afri-pay/AfriPay/issues/17) | Notifications module stub; SMS/push delivery tracking absent. Keep open. |
| [#16](https://github.com/Afri-pay/AfriPay/issues/16) | KYC module stub; provider client, persisted states and tests absent. Keep open. |

Closed issues #1-#14 and #30 were read. #1-#7/#9 match repository/license/scaffolding work; #8's Freighter connection is historical and the product now uses a native wallet; #10 is an exchange-rate stub/integration, not provider adoption; #11 covers a multisig skeleton; #12 is simulated vault accounting, not actual yield; #13 is trusted confirmer logic, not independently verified asset settlement; #14 is a MoMo sandbox implementation without live credentials. #30 is a historical write-access test and provides no product evidence.

PRs #21-#29 and #37-#43 were inspected, including discussion/review retrieval. Most had no discussion returned. #25 and #28 have brief maintainer approval comments; these do not establish independent security review. Prior PR validation statements were treated as historical claims and current checks were executed again. No contributor/engagement counts were manufactured and no activity issues were created.

## Engineering blockers and scoped contributor work

1. **Contract lifecycle and TTL:** inspect contracts/ and the deployment runbook. Add storage TTL/restore tests and a reviewed deployment initialization procedure. Acceptance: state remains safe across archival/restoration, initialization cannot be hijacked, and generated artifact hashes match reviewed builds. Scope excludes unauthorized redeployment/Mainnet.
2. **Pending-payment recovery:** payments service/store and NativeWallet. Define persisted expiry/reconciliation semantics for indeterminate submissions, recover after browser refresh, and distinguish ledger rejection from transport failure. Acceptance: timeout-after-accept, absent/expired transaction and restart tests prevent a second settlement. Scope excludes automatically treating timeout as failure.
3. **MoMo operational reconciliation:** service/store and webhooks modules. Add durable provider-request stages, centralized event claims and worker/cron scheduling. Acceptance: interruptions before/after MTN acceptance, duplicate callbacks, two-instance races and restart tests use one provider reference; never claim an unverified charge succeeded. Scope excludes production money movement.
4. **Browser end-to-end/accessibility:** native wallet and /pay/[id]. Run a real browser against isolated backend/database, verify backup gating, create/import/lock/restore, delayed account/history requests, link expiry, clipboard/QR, CSP hydration and mobile layouts. Acceptance: sensitive flows work under network failure without secret-bearing requests or duplicate sends. No fabricated screenshots/transactions.
5. **USSD account binding:** USSD/MoMo modules. Specify provider authentication and user-account authorization before initiating collection/disbursement. Acceptance: durable sessions, expiry, invalid input, one request per confirmed session, accurate pending/failure messages, no PIN logging/collection without a designed authentication protocol. Scope excludes making the current demo pretend to send money.

## External dependencies / authorization

- MTN sandbox subscription key, separate collection/disbursement API users and API secrets, EUR sandbox currency, registered callback URLs/token, and reachable callback hosting. Put credentials only in local/platform secrets. Sandbox callbacks can be intermittent; status polling is required. No real MTN success has been claimed.
- Smile Identity and SMS/push provider accounts, consent/data-retention requirements and credentials are absent. Existing stubs are not operational integrations.
- Deployment platform/environment/log/database access and explicit production-update authorization are needed for live rollout. The public API showed intermittent availability; inspect host logs and database readiness.
- Contract deployment is explicitly unauthorized in this task without a later approval. Build artifacts are ready under contracts/target/wasm32v1-none/release; inspect authorization changes, initialization/TTL and migrate references deliberately. Existing deployments do not contain new code.
- Independent wallet/contract/application reviewers and maintainer acceptance are required; automated tests are not an independent audit.

Next maintainer action: review the PR and security findings, complete operational recovery, authorize/stage deployment, complete browser/provider validation, then reassess the evidence before using a remaining Drips appeal.
