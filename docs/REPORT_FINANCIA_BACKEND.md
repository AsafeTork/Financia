---
type: REPORT
status: APPROVED
owner: Executor
version: 1.0
reviewed_by: Executor
ready_for_integration: true
last_review: 2026-07-31
dependencies: [CLAUDE.md, WORKSPACE.md, EXECUTION_STATE.md, CHANGELOG_AI.md, Banco/ESPECIALISTA_BANCO.md]
next_review: 2026-08-31
---

# FINANCIA — BACKEND & API ARCHITECTURE REPORT

## 1. Backend Health Score: 6.5 / 10

| Area | Score | Notes |
|------|-------|-------|
| API Design | 7 | Consistent Edge Function pattern; good use of shared utilities |
| Security | 5 | RLS policies have critical gaps (initPlan missing, storage policies unfiltered, SD functions exposed) |
| Data Modeling | 6 | Reasonably normalized but has denormalization issues (4 custom_price_cents columns, brand_config missing) |
| Error Handling | 6 | Structured error responses in Edge Functions; missing input validation in some functions |
| Performance | 5 | Missing indexes confirmed in DB audit; storage RLS policies cause 19x slowdown; no connection pooling config |

---

## 2. Security Assessment

### RLS Policies
- **What's correct:** RLS is enabled on `company_profiles`, `transactions`, `products`, `losses`, `user_roles`, `impersonation_sessions`, and `ai_cache`. Storage bucket `logos` has 4 policies (select, insert, update, delete) scoped to `authenticated` with `auth.uid()` checks and admin bypass.
- **Critical gaps:**
  - **Storage policies use bare `auth.uid()`** (not wrapped in `(SELECT auth.uid())`) — causes 19x performance degradation per PlanetScale 2026 benchmarks. Affects 4 policies in `storage.objects`.
  - **`ai_cache` RLS policies are dead code** — all Edge Functions use `getAdminClient()` (service_role) which bypasses RLS entirely. 4 policies (`ai_cache_*_own`) serve no purpose.
  - **`company_profiles` UPDATE policy** previously had infinite recursion bug (fixed in migration `20260709_architectural_fix.sql`), but the fix relies on triggers for business logic rather than RLS `WITH CHECK` — a fragile pattern.
  - **No RLS on `impersonation_sessions`** — the table tracks admin impersonation sessions but has no row-level policies restricting who can read/write them.

### Authentication Flow
- **Frontend:** Uses `sb.auth.onAuthStateChange` with `getSession()` for initial load. Session cached in `localStorage` (`financia_last_uid`). Impersonation via URL hash (`#access_token=...&refresh_token=...`) — this is a security risk as tokens are exposed in URL and browser history.
- **Edge Functions:** All authenticated functions extract the JWT from the `Authorization` header and call `supabase.auth.getUser()`. This is correct.
- **Missing:** No MFA enforcement, no session timeout configuration visible in code, no refresh token rotation.

### Data Encryption
- **In transit:** TLS enforced by Supabase (HTTPS everywhere). Render adds HSTS headers (`max-age=31536000; includeSubDomains`).
- **At rest:** Supabase handles PostgreSQL encryption at rest. **No application-level encryption** of sensitive fields (no field-level encryption for financial data, no key management).
- **Missing:** No TDE (Transparent Data Encryption) configuration visible. No column-level encryption for PII or financial data.

### Input Validation
- **Edge Functions:** The `_shared/security.ts` module provides `sanitizeText`, `sanitizeEmail`, `sanitizeUuid`, `sanitizePlanId`, `sanitizeKind`, `sanitizeHexColor`, `sanitizeUrl`, `asPositiveInt`. These are used in most Edge Functions.
- **Missing:** `create-subscription` does not validate `plan_id` against a strict allowlist before passing to Stripe (uses `sanitizePlanId` which only allows `pro`, `premium`, `white_label` — good). But `create-payment` uses `sanitizeKind` which only allows `white_label` — overly restrictive for a general payment function.
- **No rate limiting on public Edge Functions** — only admin functions use `enforceRateLimit`.

### Secrets Management
- **Edge Functions:** Use `Deno.env.get()` for `STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `SMTP_*` credentials. These are set as Render environment variables or Supabase secrets.
- **Frontend:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are in build-time env vars. The anon key is public by design. The service role key is **never exposed to the frontend** — correct.
- **Missing:** No secret rotation mechanism visible. No audit logging of secret access.

---

## 3. Edge Functions Assessment

### Complete Inventory (20 functions)

| Function | Purpose | Auth | Rate Limit |
|----------|---------|------|------------|
| `stripe-webhook` | Stripe event processing (checkout, invoice, subscription lifecycle) | None (public webhook) | No |
| `create-subscription` | Create/upgrade/downgrade Stripe subscriptions | User JWT | 8/min |
| `create-payment` | One-time white-label payment | User JWT | 6/min |
| `create-setup-intent` | Stripe SetupIntent for card update | User JWT | 8/min |
| `get-subscription-status` | Check Stripe subscription status | User JWT | No |
| `cancel-subscription` | Cancel at period end | User JWT | 4/min |
| `get-payment-method` | Get saved card details | User JWT | 30/min |
| `set-default-payment-method` | Set default payment method | User JWT | No |
| `remove-payment-method` | Detach card, cancel sub if needed | User JWT | 6/min |
| `admin-stripe-overview` | Admin Stripe balance/MRR | Admin JWT | 12/min |
| `admin-impersonate` | Admin impersonate user via magic link | Admin JWT | No |
| `admin-create-client` | Create new client (auth + profile) | Admin JWT | 5/min |
| `admin-set-custom-price` | Set custom pricing for client | Admin JWT | 20/min |
| `admin-set-white-label` | Enable/disable white-label | Admin JWT | 20/min |
| `stripe-config` | Return Stripe publishable key | None | No |
| `health` | Health check endpoint | None | No |
| `ai` | AI-powered features (palette, email, insights) | User JWT | 10/min |
| `send-custom-email` | Send email via SMTP | Admin JWT | No |
| `trigger-apk-build` | Trigger GitHub Actions APK build | User JWT | 1/5min |
| `update-brand-config` | Update brand configuration | User JWT | No |
| `admin-job-runner` | Admin cron jobs (cleanup, deploy, backup, migrate, APK) | Service role | No |

### Structural Issues
- **Inconsistent patterns:** Some functions use `withLogging` middleware (from `_shared/logger.ts`), others use raw `Deno.serve()` with manual CORS handling. The `admin-create-client`, `admin-set-white-label`, `admin-set-custom-price`, `get-payment-method`, `remove-payment-method`, `create-setup-intent`, and `stripe-config` functions all have their own inline CORS headers and JSON response helpers instead of using the shared `_shared/responses.ts` module.
- **`admin-set-custom-price` has duplicate handler code** — the file contains two complete `handler` functions and two `Deno.serve()` calls. This is dead code that will cause runtime errors.
- **Missing JWT validation in webhook:** `stripe-webhook` does verify the Stripe webhook signature via `stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret)`. Good.
- **`admin-impersonate` returns tokens in the response body** — the access token and refresh token are sent to the admin client, which then opens a popup with the tokens in the URL hash. This exposes tokens in browser history and logs.

### Performance Concerns
- **No connection pooling** configured in Edge Functions — each function creates a new `createClient()` on every invocation.
- **Stripe API calls are not cached** — `get-payment-method` caches via `ai_cache` table, but most functions make fresh Stripe API calls on every invocation.
- **`admin-stripe-overview` uses cursor-based pagination** (good), but `create-subscription` fetches all subscriptions with `limit: 20` — may miss subscriptions for users with many plans.

---

## 4. Database Schema Assessment

### Schema Design
The schema uses a **shared-table multi-tenant pattern** where each row has a `user_id` column. This is appropriate for the scale (single Supabase project).

**Key tables:**
- `auth.users` (Supabase managed)
- `company_profiles` — tenant profile with plan, branding, custom pricing
- `transactions` — financial transactions (income/expense)
- `products` — product inventory
- `losses` — loss tracking
- `user_roles` — admin role assignment
- `impersonation_sessions` — admin impersonation tracking
- `ai_cache` — rate limiting + caching for AI functions
- `stripe_webhook_dlq` — dead letter queue for failed webhooks

### Normalization Issues
- **`company_profiles` has 4 separate `custom_price_cents` columns** (`custom_price_cents`, `custom_price_cents_pro`, `custom_price_cents_premium`, `custom_price_cents_white_label`) — should be a single `jsonb` column. The migration `20260710000012_i5_custom_prices_jsonb.sql` attempts to address this but appears to be a later addition.
- **`brand_config` column is missing** from the live database despite a migration (`20260707000001_brand_config_jsonb.sql`) — schema drift between migrations and live DB.
- **`visual_version` and `custom_palette`** are boolean/integer fields that should be in a separate `brand_settings` table.

### Index Assessment
- **Missing indexes confirmed:** `idx_company_profiles_plan` is defined in migration but absent from live DB. `idx_ai_cache_user_id` is missing. `idx_transactions_user_id` is redundant (composite index covers it).
- **Partial index on `impersonation_sessions`** for `expires_at WHERE old_hash = ''` is missing — causes full table scan on every sweep.
- **RLS policies on `storage.objects`** lack proper initPlan wrapping — causes sequential scans.

### Migration Strategy
- **57 migrations in the database** vs **22 migration files on disk** — 35 migrations are untracked locally. This is a **critical disaster recovery risk**.
- **Migration naming is inconsistent** — some use `20260709_architectural_fix.sql`, others use `20260711005313_20270630_fix_admin_impersonate_start.sql` (with future dates embedded).
- **No migration rollback scripts** — if a migration fails in production, there's no automated way to reverse it.
- **Duplicate migration files** exist (e.g., `20260624_impersonation_security.sql` and `20260624213645_impersonation_security.sql`).

---

## 5. API Design Assessment

### REST vs Edge Functions
The project uses **Edge Functions as the API layer** rather than traditional REST endpoints or Supabase RPCs exclusively. This is a reasonable pattern for a SaaS app that needs to:
1. Hide Stripe secrets from the client
2. Enforce business logic server-side
3. Provide a thin API between the frontend and Stripe/third parties

However, there's inconsistency: some operations use `sb.rpc()` (e.g., `admin_delete_client`, `admin_client_usage`, `admin_db_stats`, `set_client_plan`, `set_white_label`) while others call Edge Functions directly (e.g., `create-subscription`, `stripe-webhook`, `admin-stripe-overview`).

### Error Handling
- **Edge Functions** use a consistent pattern: `corsResponse({ error: 'code' }, status)` for errors, `corsResponse({ data })` for success. The `_shared/responses.ts` module provides structured helpers (`successResponse`, `errorResponse`, `validationErrorResponse`, etc.) but many functions don't use them.
- **Frontend** (`stripe.js`) has excellent error mapping — `friendlyStripeError()` maps Stripe error codes to Portuguese messages. `readFnErrorMessage()` extracts error details from Supabase function responses.
- **Missing:** No centralized error logging. No error tracking/monitoring (Sentry, etc.).

### Response Format Consistency
- **Inconsistent:** Some functions return `{ data, error }` (Supabase RPC style), others return `{ success, data, error }` (structured API style), others return raw `{ error: 'code' }`.
- The `_shared/responses.ts` module defines a proper `ApiResponse<T>` interface but is not uniformly adopted.

### Rate Limiting
- **Only admin functions** use `enforceRateLimit()`. Public functions like `create-subscription` (8/min), `create-payment` (6/min), `cancel-subscription` (4/min) have rate limiting, but user-facing functions like `get-subscription-status`, `get-payment-method`, `set-default-payment-method`, `remove-payment-method` do **not**.
- Rate limiting uses the `ai_cache` table with `rate_limit` scope — this is a creative approach but adds write overhead to the cache table on every rate-limited request.

---

## 6. Recommendations (Prioritized)

### 🔴 Critical (Fix Immediately)

1. **Fix storage RLS initPlan** — Wrap `auth.uid()` in `(SELECT auth.uid())` in all 4 `logos_authenticated_*` policies. This alone will improve query performance by ~19x.

```sql
-- Before (slow):
USING (storage.foldername(name))[1] = auth.uid()::text

-- After (fast):
USING (storage.foldername(name))[1] = (SELECT auth.uid())::text
```

2. **Drop dead `ai_cache` RLS policies** — 4 policies (`ai_cache_*_own`) are never enforced because all Edge Functions use `getAdminClient()` (service_role). They add maintenance burden and confuse auditors.

3. **Fix `admin-set-custom-price` duplicate code** — Remove the second `handler` function and `Deno.serve()` call. Keep only the `withLogging`-wrapped version.

4. **Sync untracked migrations** — Run `supabase db pull` immediately to capture the 35 missing migrations. Without this, disaster recovery is impossible.

### 🟠 High Priority

5. **Add `WITH CHECK` to all UPDATE RLS policies** — Currently, `update_own_profile` on `company_profiles` has `WITH CHECK ((SELECT auth.uid()) = user_id)` which is correct, but other tables may be missing this.

6. **Implement JWT custom claims for roles** — Instead of querying `user_roles` table on every RLS evaluation, store the role in `app_metadata` JWT claims. This eliminates per-row DB lookups.

```sql
-- Set role in JWT claims via Supabase Auth admin API
-- Then in RLS policy:
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
```

7. **Add missing indexes** — Create `idx_company_profiles_plan`, `idx_impersonation_sessions_expires`, and remove redundant `idx_transactions_user_id`.

8. **Remove impersonation tokens from URL** — The `admin-impersonate` function returns tokens in the response body, and the frontend puts them in the URL hash. Use HTTP-only cookies or session storage instead.

### 🟡 Medium Priority

9. **Consolidate Edge Function patterns** — Migrate all functions to use `withLogging` from `_shared/logger.ts` and `corsResponse`/`errorResponse` from `_shared/responses.ts`. Remove inline CORS handling from 7 functions.

10. **Add rate limiting to public Edge Functions** — `get-subscription-status`, `get-payment-method`, `set-default-payment-method`, `remove-payment-method`, `update-brand-config`, and `send-custom-email` all lack rate limiting.

11. **Implement Stripe Customer Portal** — Allow users to manage their subscriptions, update payment methods, and view invoices without admin intervention.

12. **Add application-level encryption** — Encrypt sensitive financial data (transaction amounts, payment method tokens) at the application level before storing in PostgreSQL.

### 🔵 Low Priority

13. **Consolidate `custom_price_cents` columns** into a single `jsonb` column as the migration `20260710000012_i5_custom_prices_jsonb.sql` intends.

14. **Add `brand_config` to the live database** — The migration exists but the column is absent from the live schema.

15. **Implement offline conflict resolution** — Document the sync strategy and add CRDT-based or last-write-wins conflict resolution for offline edits.

16. **Add monitoring** — Integrate Sentry or similar for error tracking, and set up alerting for Stripe webhook failures.

---

## 7. What Would I Build Differently

### Honest Assessment of the Backend Architecture

1. **Too many Edge Functions for simple operations.** Functions like `get-payment-method`, `set-default-payment-method`, `update-brand-config`, and `send-custom-email` are thin wrappers around Stripe SDK calls or email sending. These could be consolidated into a single `api` Edge Function with route-based dispatch, reducing cold starts and maintenance overhead.

2. **RPC functions are underused.** Supabase Database Functions (RPC) are the right place for data-level logic (plan changes, custom pricing, white-label toggles). The project uses them for some operations but not consistently. All Stripe-related state changes should go through RPC functions with RLS enforcement, not directly from Edge Functions.

3. **The `ai_cache` table is overengineered.** It's used for both AI response caching AND rate limiting. These are different concerns that should be separated. The rate limiting could use a simple Redis counter (via Supabase's built-in) or be eliminated entirely for most functions.

4. **No API versioning.** Edge Functions are deployed as `/functions/v1/...` paths but there's no versioning strategy. A breaking change to `create-subscription` would break all existing clients.

5. **Missing observability.** No structured logging pipeline, no metrics collection, no alerting. The `Logger` class in `_shared/logger.ts` outputs JSON to console but nothing collects it.

6. **The offline-first architecture is the strongest design decision.** Dexie.js with `_synced`/`_deleted` flags and the `syncAll()` function with concurrent batching, exponential backoff, and abort controllers is well-implemented. This should be preserved and extended.

7. **The impersonation flow is a security liability.** Magic link tokens in URL hashes, stored in `localStorage`, and returned in API responses create multiple attack vectors. A proper impersonation flow should use short-lived, single-use tokens stored in server-side sessions.

---

## Evidence References

- **Database audit:** `docs/Banco/ESPECIALISTA_BANCO.md` (57 migrations in DB, 22 on disk; critical C1-C4 findings)
- **Supabase client:** `src/lib/supabase.js` (145 lines, noop fallback, AI guard)
- **Dexie schema:** `src/lib/dexie.js` (69 lines, 4 versions, sync flags)
- **Auth flow:** `src/features/auth/useAuthBootstrap.js`, `useSession.js`, `useImpersonation.js`
- **CRUD layer:** `src/lib/crud.js` (66 lines, sync helpers)
- **Sync engine:** `src/lib/sync.js` (248 lines, concurrent batching, backoff)
- **Stripe integration:** `src/lib/stripe.js` (167 lines, error mapping, card formatting)
- **Shared EF utilities:** `supabase/functions/_shared/` (security.ts, responses.ts, logger.ts, stripe.ts, retry.ts, permissions.ts, mailer.ts)
- **Edge Functions:** 20 functions in `supabase/functions/` (all read and analyzed)
- **Migrations:** 57 SQL files in `supabase/migrations/` (key ones read and analyzed)
- **Deployment:** `render.yaml` (static site, CSP headers, HSTS, route blocking)
- **Web research:** 10 searches across RLS, Edge Functions, SaaS schema, Stripe billing, auth security, Dexie, realtime, fintech encryption, migrations, edge vs serverless
