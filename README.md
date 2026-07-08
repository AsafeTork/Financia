# Financia

Offline-first white-label financial management app for small businesses.  
Runs as PWA, Electron desktop app (Windows), and Android TWA.

## Tech Stack

**Frontend** React 18, Vite 5, Tailwind CSS 3, shadcn/ui  
**State & Offline** Dexie.js (IndexedDB)  
**Backend** Supabase (PostgreSQL, Auth, RLS, Edge Functions)  
**Payments** Stripe  
**Desktop** Electron 31  
**Mobile** Android TWA (WebView)

## Commands

```bash
npm run dev       # → http://localhost:5173
npm test          # Vitest
npm run lint      # eslint src/
npm run build     # Vite build
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
  context/        # React context providers
```

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and add Supabase keys
3. `npm run dev`
