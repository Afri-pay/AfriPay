# Dependency Audit Classification

Last reviewed: 2026-09-07

This document classifies `npm audit` findings for AfriPay. **Do not run `npm audit fix --force`** without a dedicated upgrade PR — several fixes require NestJS 12 or Next.js major bumps.

## Summary

| Workspace | Vulnerabilities | Critical | High | Moderate | Low |
|-----------|-----------------|----------|------|----------|-----|
| `backend/` | 26 | 0 | 9 | 13 | 4 |
| `frontend/` | 12 | 1 | 11 | 0 | 0 |

## Backend (`backend/`)

### Safe to fix in a focused PR (`npm audit fix` — no `--force`)

| Package | Severity | Risk context | Action |
|---------|----------|--------------|--------|
| `brace-expansion` | High | Dev/transitive (eslint, jest) | Patch via `npm audit fix` |
| `browserslist` | High | Build toolchain | Patch via `npm audit fix` |
| `js-yaml` | High | Dev (jest/istanbul) | Patch via `npm audit fix` |
| `qs` | Moderate | Transitive (body-parser chain) | Patch via `npm audit fix` |
| `typeorm` | Moderate | Dev CLI `migration:generate` only | Patch when DB wired; low runtime risk today |

### Requires breaking upgrade (defer to dedicated issue)

| Package | Severity | Blocker | Recommended action |
|---------|----------|---------|-------------------|
| `@nestjs/core`, `@nestjs/platform-express` | Moderate | Fix requires NestJS **12.x** | Track as "Upgrade NestJS 10 → 12" issue |
| `body-parser`, `multer` | High | Bundled with NestJS platform-express 12 | Same NestJS upgrade |
| `@nestjs/cli`, `webpack`, `glob`, `ajv`, `tmp` | Moderate–High | DevDependencies only | Upgrade with NestJS CLI bump |
| `uuid` via `@nestjs/typeorm` | Moderate | Fix requires `@nestjs/typeorm@12` | Defer until TypeORM integration lands |

**Runtime exposure today:** Backend is primarily JSON/USSD APIs; multer/file-upload paths are not heavily used. Primary production risk is **DoS via body-parser/qs** if deployed publicly without rate limits — mitigated by [#35](https://github.com/Afri-pay/AfriPay/issues/35).

## Frontend (`frontend/`)

### Safe to fix in a focused PR

| Package | Severity | Action |
|---------|----------|--------|
| `brace-expansion`, `browserslist`, `js-yaml`, `nanoid`, `minimatch` | High | `npm audit fix` (transitive/dev) |

### Requires targeted upgrade (recommended before production)

| Package | Severity | Notes | Recommended action |
|---------|----------|-------|-------------------|
| **`next@14.2.5`** | **Critical** | Multiple CVEs; patched in **14.2.35** (same major) | Bump to `next@14.2.35` + matching `eslint-config-next` in a small PR |
| `postcss` | High | Pulled via Next.js | Fixed with Next.js patch bump |
| `glob` via `eslint-config-next` | High | Dev only (lint) | Updates with eslint-config-next |

**Do not** jump to Next.js 16 via `--force` unless planning a full App Router migration test pass.

## Recommended upgrade order

1. **Frontend:** `next@14.2.35` (patch, low risk) — separate PR
2. **Both:** `npm audit fix` (non-breaking) — separate PR, run full test suite
3. **Backend:** NestJS 12 upgrade — after MoMo persistence (#32) lands
4. **Ongoing:** Re-run `npm audit` monthly

## CI note

Contract tests run on **Ubuntu** in GitHub Actions (`cargo test`, `cargo clippy`). Local Windows linker errors (`msvcrt.lib`) do not reflect CI status — verify via Actions after merge.
