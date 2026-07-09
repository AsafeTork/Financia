![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-1178+-blue)
![Coverage](https://img.shields.io/badge/coverage-40%25-yellow)

# Financia

Offline-first white-label financial management app for small businesses.  
Runs as PWA, Electron desktop app (Windows), and Android TWA.

## Tech Stack

**Frontend** React 18, Vite 5, Tailwind CSS 3, shadcn/ui, Radix  
**State & Offline** Dexie.js 3 (IndexedDB)  
**Backend** Supabase 2 (PostgreSQL, Auth, RLS, Edge Functions)  
**Payments** Stripe  
**Desktop** Electron 31  
**Mobile** Android TWA (WebView)  
**Testing** Vitest 4 + Testing Library + Playwright  
**Bundle** Vite manualChunks (vendor, supabase, query, dexie, radix, stripe)

## Commands

```bash
npm run dev        # → http://localhost:5173
npm test           # Vitest (1178+ tests)
npm run test:coverage # Vitest + coverage
npm run lint       # eslint src/
npm run typecheck  # tsc --noEmit
npm run build      # Vite build
npm run check      # lint + typecheck + test
npm run analyze    # Vite + rollup-visualizer
```

## Architecture

```
src/
  features/       # Domain modules (auth, transactions, admin, etc.)
    admin/
    auth/
    dashboard/
    inventory/
    transactions/
    ...
  shared/         # Cross-cutting code
    hooks/        # Shared hooks (useAuth, useBusca, etc.)
    layout/       # App shell, navigation
    ui/           # shadcn/ui components (Button, Input, Dialog, etc.)
  lib/            # Utils, services (Dexie, Supabase client)
  core/           # Boot, providers, app initialization
  routes/         # Route definitions
  ai/             # AI prompts and integrations
  context/        # React context providers
  test/           # Test setup, mocks, generated tests
  docs/           # Project documentation
```

## PWA

- **Service Worker** (`public/sw.js`): custom SW with network-first navigation, cache-first hashed assets, asset precaching on install, progress reporting, and controlled (user-driven) updates via `SKIP_WAITING`.
- **Manifest** (`public/manifest.json`): static `<link rel="manifest">` with `standalone` display, theme color `#002f59`, SVG icons, `pt-BR` locale.
- **Offline**: Dexie IndexedDB stores all business data locally; sync module reconciles with Supabase when online.
- **Install**: captura `beforeinstallprompt`; `InstallButton` component for manual install.

## Testing

- **Framework**: Vitest 4 with `jsdom` environment, threads pool, 15s timeout
- **Coverage**: v8 provider, 40% minimum thresholds, `lcov` + `text-summary` reporters
- **Files**: ~21 test files across features, lib, shared, and test/gen (1178+ tests)
- **Mocks**: `fake-indexeddb` for Dexie, `src/test/setup.js` for global setup
- **E2E**: Playwright available via `@playwright/test`

## Architecture Decisions

- **Feature-first**: each domain module lives in `src/features/<domain>/` with its own components, hooks, and tests
- **Lazy loading**: routes are code-split by feature via `React.lazy`
- **Manual chunks**: build splits into `vendor` (React, router), `supabase`, `query` (TanStack), `dexie`, `radix`, `stripe` — supabase further split into auth/db/realtime/storage sub-chunks
- **Offline-first**: Dexie as local source of truth; Supabase sync happens asynchronously
- **Service worker**: custom (no Workbox), network-first HTML, cache-first assets, user-controlled updates
- **Side effects**: `"sideEffects": false` in `package.json` enables aggressive tree-shaking

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in keys:
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase project
   - `VITE_STRIPE_PUBLISHABLE_KEY` from Stripe dashboard
   - `VITE_APP_URL` for email links
3. For local Supabase dev: `npx supabase start` (needs Docker)
4. `npm run dev`
