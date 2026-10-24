# Dependency audit

Checked October 23, 2026 with the live npm advisory database. Counts include transitive/metavulnerable packages and development tools; they are not distinct confirmed application exploits.

| Workspace | Baseline total | Baseline critical | Current total | Current critical | Current high | Current moderate | Current low |
|---|---:|---:|---:|---:|---:|---:|---:|
| backend | 66 | 2 | 61 | 0 | 47 | 10 | 4 |
| frontend | 50 | 2 | 39 | 0 | 37 | 2 | 0 |

Raw advisory JSON is in evidence/backend-dependency-audit.json and evidence/frontend-dependency-audit.json. Run npm audit in each workspace to refresh; counts and available fixes can change.

Compatible npm fixes were applied. Next.js 14.2.5 was first patched to 14.2.35, but current advisories still affected that release. The compatibility-reviewed migration to Next.js 15.5.28 / React 19 and the PostCSS 8.5.23 override removed critical frontend findings; tests, TypeScript, lint, production build and nonce rendering checks passed. The vendor [SVG optimizer advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw) identifies 15.5.28 as patched. Changes were not force-upgraded blindly.

Remaining families include Nest/CLI/platform dependencies, Stellar SDK/TOML, Jest tooling, Tailwind/glob/parser dependencies and associated transitive advisories. SDK 17 requires Node >=22.12 and a coordinated module/Horizon/RPC migration. Some parser dependencies are not called by AfriPay directly, but remain a supply-chain risk. Do not declare production security based solely on zero critical findings.

CI runs npm audit --audit-level=high without suppressions or continue-on-error. **The security job is expected to fail with current high findings.** Review individual advisories and affected code paths; use tested compatible patches or focused migrations instead of overriding arbitrary transitive major versions.