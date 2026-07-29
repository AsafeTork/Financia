# PRODUCTION STATUS — Financia

> **Generated:** 2026-07-29T03:00:00Z
> **Version:** `v20260706134726-129-gd03d9f6`
> **Latest commit:** `d03d9f6` — Fix: lint no-empty, prod-audit error extraction, CI deploy EF, admin-impersonate direct fetch, trigger-apk-build graceful error

---

## 1. EXECUTIVE SUMMARY

**Status: ⚠️ DEGRADED**

The application itself is live and functional — core CI jobs (lint, build, unit tests, E2E smoke, security audit) all pass, and all 19 Edge Functions are deployed and ACTIVE. However, the Production Audit CI pipeline is **fully broken across all 5 browser profiles** due to a `localStorage` `SecurityError`, and the Deploy Edge Functions CI job is failing because `SUPABASE_ACCESS_TOKEN` is missing from CI secrets. Two CI workflow issues (malformed template, missing secret) need addressing before the pipeline can be considered healthy.

| Indicator | Status |
|-----------|--------|
| Site | ✅ Online (https://financiabr.me) |
| Build | ✅ Passing |
| Lint + Typecheck | ✅ 0 errors |
| Unit Tests | ✅ Passing |
| E2E (chromium) | ✅ Passing |
| Security Audit (npm) | ✅ Passing |
| Prod Audit (all browsers) | ❌ Failing |
| Edge Functions | ✅ 19/19 ACTIVE |
| Supabase Security | ⚠️ 7 warnings |
| CI Deploy EF Job | ❌ Missing token |

---

## 2. CI PIPELINE STATUS

**Run:** #30416228337 — `main` — 2026-07-29

| Job | Status | Details |
|-----|--------|---------|
| Lint + Typecheck | ✅ PASSED | 0 errors |
| Unit Tests | ✅ PASSED | All passing |
| E2E (chromium) | ✅ PASSED | Smoke tests |
| Build | ✅ PASSED | |
| Security Audit | ✅ PASSED | `npm run security:audit` |
| Prod Audit (chromium) | ❌ FAILED | `SecurityError: Failed to read 'localStorage'` |
| Prod Audit (firefox) | ❌ FAILED | `SecurityError: The operation is insecure` |
| Prod Audit (webkit) | ❌ FAILED | `SecurityError: The operation is insecure` |
| Prod Audit (mobile-chrome) | ❌ FAILED | `SecurityError: Failed to read 'localStorage'` |
| Prod Audit (mobile-safari) | ❌ FAILED | `SecurityError: The operation is insecure` |
| Extract Audit Errors | ✅ PASSED | Downloaded 5 artifacts, parsed OK |
| Deploy Edge Functions | ❌ FAILED | `SUPABASE_ACCESS_TOKEN` not set in CI |
| Test Summary | ❌ FAILED | Malformed `fromJson` template expression |

**Last fully successful run:** Prior to prod-audit and deploy-EF being added to CI.

---

## 3. LIVE SITE STATUS

| Check | Result |
|-------|--------|
| **HTTP Status** | ✅ 200 OK |
| **SSL/TLS** | ✅ Valid (Let's Encrypt / Render auto) |
| **Assets (JS/CSS)** | ✅ Loading (verified via webfetch) |
| **Service Worker** | ⚠️ Not verified (requires browser) |
| **Manifest** | ⚠️ Not verified (requires browser) |
| **CSP Headers** | ⚠️ Not verified |

**URL:** https://financiabr.me
**Title:** Financia — Gestão financeira para pequenos negócios

---

## 4. EDGE FUNCTIONS

**All 19 functions deployed ✅ ACTIVE**

| Function | Status | JWT | Version |
|----------|--------|-----|---------|
| `ai` | ✅ ACTIVE | verified | v8 |
| `admin-create-client` | ✅ ACTIVE | verified | v6 |
| `admin-impersonate` | ✅ ACTIVE | none (public) | v5 |
| `admin-set-custom-price` | ✅ ACTIVE | verified | v4 |
| `admin-set-white-label` | ✅ ACTIVE | verified | v1 |
| `admin-stripe-overview` | ✅ ACTIVE | verified | v1 |
| `cancel-subscription` | ✅ ACTIVE | verified | v6 |
| `create-checkout-session` | ✅ ACTIVE | verified | v7 |
| `create-payment` | ✅ ACTIVE | verified | v13 |
| `create-setup-intent` | ✅ ACTIVE | verified | v3 |
| `create-subscription` | ✅ ACTIVE | verified | v17 |
| `get-payment-method` | ✅ ACTIVE | verified | v4 |
| `get-subscription-status` | ✅ ACTIVE | verified | v1 |
| `remove-payment-method` | ✅ ACTIVE | verified | v5 |
| `send-custom-email` | ✅ ACTIVE | verified | v1 |
| `stripe-config` | ✅ ACTIVE | none (public) | v8 |
| `stripe-webhook` | ✅ ACTIVE | verified | v12 |
| `trigger-apk-build` | ✅ ACTIVE | verified | v2 |
| `update-brand-config` | ✅ ACTIVE | verified | v1 |

---

## 5. SECURITY ADVISORS

**7 warnings remaining** (down from 12 in F8)

### SECURITY DEFINER Functions (6 warnings)
All are `authenticated_security_definer_function_executable` — signed-in users can call these `SECURITY DEFINER` functions:

| Function | Arguments | Risk |
|----------|-----------|------|
| `change_user_password` | (target_user_id uuid, new_password text) | Any authenticated user can change any user's password |
| `create_user_with_role` | (user_email, user_password, user_name, user_role) | Any auth user can create new users with any role |
| `delete_user_with_role` | (target_user_id uuid) | Any auth user can delete any user |
| `handle_new_user_igreja` | () | Trigger function, lower risk |
| `increment_campaign_views` | (campaign_uuid uuid) | Low risk (counter) |
| `stripe_activate_plan` | (p_user uuid, p_plan text, p_expires timestamptz) | Any auth user can activate any plan |

**Remediation:** https://supabase.com/docs/guides/database/database-linter?lint=0029

### Leaked Password Protection (1 warning)
| Issue | Severity |
|-------|----------|
| Leaked password protection disabled | ⚠️ Low/Medium |

**Remediation:** Enable via Supabase Dashboard → Auth → Settings → Leaked password protection

---

## 6. DATABASE STATUS

| Check | Status | Notes |
|-------|--------|-------|
| Schema health | ✅ Stable | Post-refactor migration applied |
| `admin_db_stats` permission | ✅ Fixed | Previously blocked admin dashboard |
| `campaign_views` RLS | ✅ Fixed | Previously caused recursion |
| Images bucket policy | ✅ Fixed | RLS policy applied |
| Indexes | ✅ Applied | 3 migrations from F8 |
| Search path | ✅ Fixed | Security fix applied |

---

## 7. PERFORMANCE

### Known bottlenecks (resolved in F3-F8)
- **Branding state:** Global mutable state → factory closures + Dexie-only storage
- **CSS vars:** Missing fallbacks → explicit `var(--name, fallback)` pattern
- **Dead code:** `schema.js`, `validateBrandConfig.js`, `ignoredProps` removed
- **Edge Functions:** Cursor pagination added to `admin-stripe-overview` (p95 < 2s)
- **Sync:** `syncAll` 10k rows in 0.17ms avg

### Test structure
`e2e/performance.spec.ts` exists and measures:
- Navigation timing, FCP, LCP per route
- Button interaction latency (click-to-paint)
- Long tasks (>50ms) detection
- Memory heap usage
- Resource sizes (JS/CSS)
- Score classification (FAST <1s / MODERATE 1-3s / SLOW >3s)

Routes tested: Dashboard, Income, Expense, Inventory, Email, Report, Settings, Planos, Brand Studio

This test is **not run as a CI job** — it's a standalone spec that requires `PLAYWRIGHT_PASSWORD` to log in.

---

## 8. RECENT CHANGES

```
d03d9f6 Fix: lint no-empty, prod-audit error extraction, CI deploy EF,
        admin-impersonate direct fetch, trigger-apk-build graceful error
4695d7a Add debug mode toggle (admin-only), debug badge, prod audit login
9cd5f81 Fix: prod audit timeout and resilience
73e1014 Add production audit with all browsers capturing console errors
3139bb9 Fix: 3 test assertions (jsdom rgb format, CSS var regex)
869dd30 CI: parallel jobs, smoke test only, 3min target
29d7030 CI: E2E continue-on-error, unit tests fast mode
aca957b Split E2E tests into 15 smaller parallel files
053fa35 Fix: unit tests and E2E improvements
3956621 Fix: test timeouts and assertions
```

---

## 9. KNOWN ISSUES

### 🔴 Prod Audit localStorage SecurityError
**File:** `e2e/prod-audit.spec.ts:231`
**Error:** `page.evaluate(() => localStorage.setItem('financia_debug_mode', '1'))` fails with `SecurityError` in Safari, Firefox, WebKit, and mobile browsers.
**Root cause:** The `page.evaluate` runs on `about:blank` or before the page's origin is established, or in third-party context where `localStorage` is blocked. Chromium reports "Access is denied for this document", others report "The operation is insecure".
**Impact:** All 5 prod audit jobs fail on every run.
**Fix:** Wrap in try/catch, navigate to origin first, or skip the debug mode set for non-Chromium browsers.

### 🔴 PLAYWRIGHT_PASSWORD not in CI secrets
**Impact:** Prod audit and performance tests skip login entirely — they run against the public site unauthenticated. `PLAYWRIGHT_PASSWORD` defaults to `''` when unset, and the login block is gated on `if (adminPass)`.
**Fix:** Add `PLAYWRIGHT_PASSWORD` to GitHub Actions secrets + pass to prod audit and perf jobs.

### 🔴 SUPABASE_ACCESS_TOKEN missing in CI
**Impact:** `Deploy Edge Functions` job fails at the `supabase functions deploy` step with "Access token not provided".
**Fix:** Add `SUPABASE_ACCESS_TOKEN` to GitHub Actions secrets + pass to the deploy job.

### 🔴 Test Summary CI template error
**Error:** `.github/workflows/ci.yml` line 308 — `fromJson(needs.prod-audit.results)['0']` fails because `needs.prod-audit.results` is not a valid JSON string when the matrix strategy produces results differently than expected.
**Impact:** Test Summary job fails, no summary table posted to the CI run.
**Fix:** Restructure the `fromJson` call to use `toJson(needs.prod-audit.results)` or rework the summary step to handle the matrix output format.

### ⚠️ 7 Supabase Security Advisor Warnings
6 SECURITY DEFINER functions callable by authenticated users + leaked password protection disabled. These are pre-existing and documented. Fix requires revoking EXECUTE or switching to SECURITY INVOKER for admin-only functions.

### ⚠️ 2 Lint Warnings (pre-existing)
`react-hooks/exhaustive-deps` — pre-existing, low priority.

---

## 10. NEXT STEPS

| Priority | Task | Area |
|----------|------|------|
| 🔴 P0 | Fix `localStorage` SecurityError in `e2e/prod-audit.spec.ts` | CI/Prod Audit |
| 🔴 P0 | Add `SUPABASE_ACCESS_TOKEN` to CI secrets | CI/CD |
| 🔴 P0 | Add `PLAYWRIGHT_PASSWORD` to CI secrets | CI/QA |
| 🔴 P0 | Fix `fromJson` template in `ci.yml` Test Summary | CI/CD |
| 🟡 P1 | Fix 6 SECURITY DEFINER functions (revoke EXECUTE or switch to INVOKER) | Database/Security |
| 🟡 P1 | Enable leaked password protection in Supabase Auth dashboard | Auth/Security |
| 🟢 P2 | Run `e2e/performance.spec.ts` with PLAYWRIGHT_PASSWORD to get baseline | Performance |
| 🟢 P2 | Add Lighthouse CI thresholds as a blocking CI gate | CI/QA |
| 🔵 P3 | Document remaining 7 security warnings in a tracking doc | Documentation |

---

*Report generated from live data sources: GitHub API, Supabase MCP, Render webfetch, git log.*