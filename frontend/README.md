> Current validation and environment requirements: see the root README and PROJECT_READINESS_REPORT.md. Use Node 24.9+; Nest 12, Stellar SDK 17, Next 15/React 19, Jest 30 and Tailwind 4 are the tested versions. Backend tests require the provided VM-module script. Secrets remain local.

# Frontend

Next.js 14 (App Router) + TypeScript + TailwindCSS, PWA-enabled.

- `src/app/` — Next.js pages
- `src/components/` — React components (Send, Receive, Wallet, History, Settings)
- `src/hooks/` — Native wallet lifecycle hooks
- `src/lib/` — Utilities
- `src/styles/` — Global styles
- `public/` — Static assets

**Status:** scaffolding in place, screens in progress. See open issues labeled `frontend`.
