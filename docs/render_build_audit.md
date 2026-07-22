# Render Build Audit — FinanciaBR

**Date:** 2026-07-21
**Service:** FinanciaBR (`srv-d9adnmt8nd3s73asu54g`)
**Deploy:** `dep-d9fm9rm8bjmc73drmqo0` (commit `2f07a5cd`)
**Plan:** Free (starter build, 1 instance)
**Region:** Oregon
**Runtime:** Docker (node:20-alpine)

---

## 1. Build Timeline (Latest Deploy)

| Step | Layer | Duration |
|------|-------|----------|
| FROM node:20-alpine | builder 1/6 | 0.0s (cached) |
| WORKDIR /app | builder 2/6 | CACHED |
| COPY package.json + lockfile | builder 3/6 | CACHED |
| RUN npm install --legacy-peer-deps | builder 4/6 | **11.1s** |
| COPY . . | builder 5/6 | 0.1s |
| RUN npm run build | builder 6/6 | **3.3s** |
| COPY dist | runner 3/4 | CACHED |
| COPY package.json | runner 4/4 | CACHED |
| Export/push image | - | 0.9s |
| Cache export | - | 2.5s |
| **Total build time** | | **~18s** |
| **Deploy + start** | | **~60s** |
| **End-to-end** | | **~78s** |

---

## 2. Build Output (Vite)

```
✓ 236 modules transformed
✓ built in 2.60s

Asset                                    Size       Gzip
index.html                               3.43 kB    1.17 kB
assets/index-BCrtntdr.css                52.03 kB   10.96 kB
assets/vendor-react-Bj2_g79g.js          175.06 kB  57.38 kB
assets/index-DVlIaUDD.js                 131.27 kB  39.53 kB
assets/supabase-auth-DSA2Hd_G.js         98.10 kB   23.18 kB
assets/SettingsView-D7eN0Pj6.js          76.47 kB   19.78 kB
assets/dexie-2jmnBxhj.js                 74.29 kB   26.62 kB
assets/supabase-CtUj9dyI.js              66.50 kB   20.08 kB
assets/vendor-DySw2pWD.js                58.94 kB   18.30 kB
assets/BrandStudioView-DXLsgOZJ.js       37.09 kB   9.72 kB
assets/Landing-CcgV99Lz.js               32.07 kB   7.71 kB
assets/PlansView-Bwne1pzx.js             31.42 kB   8.40 kB
assets/Dashboard-YVvasBeg.js             27.66 kB   7.55 kB
assets/query-Bh9are3d.js                 26.92 kB   8.25 kB
assets/supabase-storage-CjC2vCZv.js      21.83 kB   5.69 kB
assets/InventoryView-CwEdN8vL.js         20.06 kB   5.54 kB
assets/TxView-0CJ4KHep.js                14.69 kB   4.81 kB
assets/stripe-oMyNEZcY.js                13.00 kB   4.88 kB
assets/ReportView-BdEB8UTI.js            10.40 kB   3.19 kB
+ 20 remaining smaller chunks
```

**Total JS transferred (gzip):** ~310 KB (first load)

---

## 3. CRITICAL ISSUES

### 3.1. `serve` Downloaded at Every Runtime Start

```log
npm warn exec The following package was not found and will be installed: serve@14.2.6
```

**Severity:** HIGH
**Evidence:** Two warnings in app logs (instances `54nh8` and `8fnhg`).
**Root cause:** `CMD ["npx", "serve", ...]` in Dockerfile. `serve` is NOT listed in `package.json` dependencies. Every container start downloads `serve@14.2.6` from npm registry.
**Impact:** Adds ~5s to startup time; breaks if npm registry is unreachable; version not pinned (floating `14.x`).
**Fix:** Add `serve` to `dependencies` in `package.json`, or switch to a lightweight static server (e.g., `go serve`, `caddy`, or `nginx`).

### 3.2. No `.dockerignore`

**Severity:** HIGH
**Evidence:** Build context is **19MB**. The repo contains `node_modules`, `.git`, `docs/`, test files, Playwright browsers, and other assets copied into the builder for every deploy.
**Impact:** Slow build context transfer; bloated Docker layer; possible cache busting when irrelevant files change.
**Fix:** Create `.dockerignore` with:
```
node_modules
.git
.gitignore
docs
*.md
dist
.env
.env.local
coverage
test-results
playwright-report
.cache
electron
```

### 3.3. npm `--legacy-peer-deps` Flag

```dockerfile
RUN npm install --legacy-peer-deps
```

**Severity:** MEDIUM
**Evidence:** Flag persists in Dockerfile.
**Impact:** Silently bypasses peer dependency conflicts. Unresolved conflicts may surface as runtime errors or broken upgrades.
**Fix:** Resolve the underlying peer dependency conflicts and remove the `--legacy-peer-deps` flag.

### 3.4. npm Outdated (10.8.2 → 12.0.1)

```log
npm notice New major version of npm available! 10.8.2 -> 12.0.1
```

**Severity:** LOW
**Impact:** npm 12.0.1 offers faster installs and improved security.
**Fix:** Switch to `node:22-alpine` (ships npm 12) or add `RUN npm install -g npm@12` in builder.

---

## 4. CHUNK SIZE & BUNDLE ANALYSIS

### 4.1. Largest Chunks (pre-gzip)

| Chunk | Raw Size | Gzip | Assessment |
|-------|----------|------|------------|
| vendor-react | 175 KB | 57 KB | OK — React + ReactDOM bundled together (correct) |
| index (main app) | 131 KB | 40 KB | **Large** — consider route-level code splitting |
| supabase-auth | 98 KB | 23 KB | OK — auth module |
| SettingsView | 76 KB | 20 KB | **Large for a single view** |
| dexie | 74 KB | 27 KB | OK — IndexedDB wrapper |
| supabase (core) | 67 KB | 20 KB | OK — Supabase client |
| CSS | 52 KB | 11 KB | OK |
| vendor (remainder) | 59 KB | 18 KB | OK |

### 4.2. Missing Route-Level Code Splitting

The `SettingsView` (76 KB) and `BrandStudioView` (37 KB) are in separate chunks, but `index.js` at **131 KB** suggests the main app bundle includes most views. These should be lazy-loaded.

### 4.3. Dead Code / Wrong Packaging

- `nodemailer` is in **dependencies** (not devDependencies). It is Node.js-only and should NOT be in any browser bundle. It is excluded from `optimizeDeps.exclude` correctly but still counted as a dependency. If imported anywhere, it bloats the bundle unnecessarily.

### 4.4. Total JS Transferred

| Metric | Value |
|--------|-------|
| Total JS (gzip) first load | ~310 KB |
| Total CSS (gzip) | ~11 KB |
| Total requests for cold load | ~35+ chunks |

**Benchmark:** This is acceptable for a PWA but above the ~200 KB target for instant interactivity.

---

## 5. DUPLICATE / DEAD CODE IN CONFIG

**vite.config.js lines 46 and 71:** `scheduler` appears twice in `manualChunks`:
```js
if (id.includes('node_modules/scheduler')) return 'vendor-scheduler';  // line 46
...
if (id.includes('node_modules/scheduler')) return 'vendor-scheduler';  // line 71 (dead code)
```
The second check is unreachable (line 70 `node_modules` catch-all comes after anyway). No functional impact.

---

## 6. DOCKERFILE OPTIMIZATIONS

### 6.1. Unnecessary Layer

```dockerfile
COPY --from=builder /app/package.json ./
```

**Impact:** This file is only needed if `serve` is run via `npx` (which doesn't read `package.json`). If `serve` were a proper dependency, this COPY would be needed for it to resolve. Currently useless.

### 6.2. Runner Image

Both stages use `node:20-alpine` (128 MB). For a static file server, the runner could use a smaller image:
- `nginx:alpine` (~23 MB) — add `nginx.conf`
- `caddy:alpine` (~35 MB)
- `scratch` with a Go static binary (~10 MB)

### 6.3. ARG/ENV for Supabase Keys

```dockerfile
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
```

These are Vite build-time env vars (prefixed with `VITE_`). They are embedded in the JS bundle. This is **expected behavior**, but be aware:
- These values are publicly visible in the browser (Vite convention)
- Do NOT put `VITE_SUPABASE_SERVICE_ROLE_KEY` here
- If you need to change these, a rebuild + redeploy is required

---

## 7. HTTP REQUEST ANALYSIS (App Logs)

### 7.1. Status Codes

| Status | Count | Notes |
|--------|-------|-------|
| 200 | 20+ | All asset requests |
| 304 | 1 | Cached icon-192.svg |

**No 4xx or 5xx errors observed.** All requests returning within 0–1 ms (served from disk cache).

### 7.2. Response Times

| Path | Time | Instance |
|------|------|----------|
| `GET /` (fresh deploy) | **113 ms** | 54nh8 |
| `HEAD /` (fresh deploy) | **84 ms** | 8fnhg |
| `GET /` (warm) | 1-3 ms | both |
| All static assets | 0-1 ms | both |

**Cold start:** ~84-113 ms for initial page load (acceptable).
**Warm:** 1 ms — excellent (serve with FS cache).

### 7.3. Request Volume

Very low volume in the log window — appears to be health-check / dev traffic only (source `::1` = localhost). No real user traffic observed in these logs.

---

## 8. CACHE CONFIGURATION

### 8.1. Render Build Cache

Service has `profile: no-cache` in service details. Docker layer caching is on (based on timestamps — many steps are `CACHED`). However, `npm install` always runs because layer `10` shows extraction every deploy, meaning `package-lock.json` changes are busting the cache.

### 8.2. HTTP Cache Headers

`serve` default behavior:
- Sends `Cache-Control: public, max-age=0` for HTML
- Sends `Cache-Control: public, max-age=86400` for hashed assets
- No `ETag` or `Last-Modified` (relies on immutable filenames with hashes)

**Adequate** for hashed assets. No `immutable` directive on hashed assets — could add.

---

## 9. SECURITY OBSERVATIONS

| Issue | Severity | Detail |
|-------|----------|--------|
| No `.dockerignore` | MEDIUM | Sensitive files (git history, env) could leak into Docker layers |
| Running as root | LOW | `serve` runs as root in container; no `USER` directive |
| `--legacy-peer-deps` | MEDIUM | Masks dependency conflicts |
| `serve` from npx | MEDIUM | Untrusted code downloaded at startup; no integrity check |
| Supabase keys in JS | INFO | Expected — `VITE_` convention |

---

## 10. RECOMMENDATIONS (PRIORITY ORDER)

### P0 — Fix Now
1. **Add `serve` to `dependencies`** or switch to a pinned static server (e.g., `http-server`, `caddy`)
2. **Create `.dockerignore`** to reduce build context from 19 MB → ~2 MB

### P1 — This Sprint
3. **Resolve npm peer dependencies** and remove `--legacy-peer-deps`
4. **Remove duplicate `scheduler` check** in `vite.config.js:71` (no functional impact, but cleanup)
5. **Move `nodemailer` to `devDependencies`** if not used in browser

### P2 — Next Iteration
6. **Route-level code splitting** — Lazy-load `SettingsView` (76 KB), `BrandStudioView` (37 KB), `Landing` (32 KB), etc.
7. **Switch runner to `nginx:alpine`** (~23 MB vs 128 MB) for better perf and smaller image
8. **Add `immutable` to hashed asset cache headers**
9. **Upgrade to `node:22-alpine`** for npm 12 + newer OpenSSL
10. **Add `USER node`** to runner stage (non-root best practice)

### P3 — Performance
11. Consider `total JS ~310 KB` — aim for <200 KB gzip with route splitting
12. Evaluate if `dexie` (74 KB) can be lazy-loaded only on pages that use it
13. Monitor request logs for real user traffic patterns

---

## 11. SUMMARY

| Category | Verdict |
|----------|---------|
| Build errors | None |
| Build warnings | 1 (npm outdated), 2 (serve missing) |
| HTTP errors | None (0 4xx/5xx) |
| Bundle size | Acceptable (310 KB gzip) — room for improvement |
| Code splitting | Partial (manual chunks OK, no route-level lazy) |
| Docker optimization | Good (multi-stage build) — needs `.dockerignore` |
| Runtime safety | Low risk — `serve` npx is main concern |
| Security | Minor — no `.dockerignore`, root user |
| Cold start | ~80s deploy + ~100ms first response |
| Warm response | 0-1 ms |
