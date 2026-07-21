# VALIDATOR-02: Image Loading & Decoding Audit

**Date:** 2026-07-21
**Scope:** All `<img>` tags in `src/` (19 total across 10 files)

---

## Summary

**VERDICT: FAIL — 4 systemic issues found across 17 of 19 images.**

The codebase applies `loading="eager" decoding="async"` as a **cargo-cult template** on every above-fold image. This combination is actively wrong for LCP candidates.

---

## Sources (research)

| Source | Key finding |
|--------|-------------|
| [web.dev — Fetch Priority](https://web.dev/articles/fetch-priority) | `fetchpriority="high"` makes LCP images start at "High" priority immediately; `loading="eager"` is the default and does nothing to accelerate loading |
| [addyosmani.com — fetchpriority=high](https://addyosmani.com/blog/fetch-priority) | "Priority Hints sped up Etsy's LCP by 4%; some sites saw 20-30% improvement" |
| [ignsolutions.io — decoding async & LCP](https://ignsolutions.io/blog/decoding-async-and-lcp) | `decoding="async"` on the LCP image is **actively wrong** — it delays painting that image. Use `decoding="sync"` or unset (`auto`) for LCP candidates |
| [stackoverflow — fetchpriority + loading=eager](https://stackoverflow.com/questions/77744344/is-it-okay-to-use-both-fetchpriority-high-and-loading-eager-in-img-tag) | `loading="eager"` "does not imply the image is loaded any quicker" |
| [solid-web.com — Lazy Loading Done Right](https://solid-web.com/lazy-loading-done-right-performance-guide/) | "Images visible in initial viewport get `loading="eager"` — or omit entirely. Add `fetchpriority="high"`." |
| [joanleon.dev — practical img guide](https://joanleon.dev/en/guia-practica-elemento-img) | "For the LCP image, `decoding="sync"` ensures it is displayed as soon as possible once downloaded" |
| [adame.io — Async Image Decoding](https://adame.io/techniques/image-lazy-decode/) | "Applying decoding='async' to the hero or LCP image" listed as a Common Mistake |

---

## Issue 1: MISSING `fetchpriority="high"` on all above-fold images

`loading="eager"` is **the default browser behavior**. It does not accelerate loading (per web.dev and the HTML spec). The attribute that actually moves LCP is `fetchpriority="high"`.

**Every image below has `loading="eager"` but ZERO have `fetchpriority="high"`.**

### Affected (14 images across 8 files):

| File | Line | Current attrs | Missing |
|------|------|---------------|---------|
| `Landing.jsx` | 125 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `Login.jsx` | 155 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `Login.jsx` | 156 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `Login.jsx` | 185 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `Login.jsx` | 186 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `PrivacyPolicy.jsx` | 55 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `TermsOfService.jsx` | 58 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `SettingsView.jsx` | 239 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `SettingsView.jsx` | 376 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `AdminPanel.jsx` | 413 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `AdminPanel.jsx` | 415 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `AdminPanel.jsx` | 470 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `AdminPanel.jsx` | 472 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `Sidebar.jsx` | 46 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `Header.jsx` | 15 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `ModuleEditor.jsx` | 128 | `loading="eager" decoding="async"` | `fetchpriority="high"` |
| `BrandGlobalEditor.jsx` | 20 | `loading="eager" decoding="async"` | `fetchpriority="high"` |

**Fix:** Add `fetchpriority="high"` to the LCP candidate (likely the nav logo in Landing/Login/Privacy/Terms). For other `eager` images, evaluate whether they truly need priority — most icons in settings/admin panels are not LCP candidates and can remain as-is but without the `loading` noise.

---

## Issue 2: `decoding="async"` on every image, including LCP candidates

**Wrong for LCP/hero images.** `decoding="async"` tells the browser it may delay painting that image until decode completes in background. For the LCP image, this can add visible delay.

### Sources:
- ignsolutions.io: *"`decoding="async"` is actively wrong"* on the LCP image
- joanleon.dev: *"For the LCP image, `decoding="sync"` ensures it is displayed as soon as possible"*
- adame.io: *"Applying decoding='async' to the hero or LCP image"* listed as a Common Mistake

### Affected (same 17 images as Issue 1 — all `loading="eager" decoding="async"`):

The images on Landing.jsx:125, Login.jsx:155-186, PrivacyPolicy.jsx:55, TermsOfService.jsx:58, Header.jsx:15, and Sidebar.jsx:46 are **actual LCP candidates** (nav logos, hero logos). They should have `decoding="sync"` or no `decoding` attribute (defaults to `auto`).

The images in SettingsView.jsx, AdminPanel.jsx, ModuleEditor.jsx, BrandGlobalEditor.jsx are inside admin panels — they are **not** likely LCP candidates, so `decoding="async"` is acceptable there.

**Fix:** Remove `decoding="async"` (or set `decoding="sync"`) on:
- `Landing.jsx:125`
- `Login.jsx:155, 156, 185, 186`
- `PrivacyPolicy.jsx:55`
- `TermsOfService.jsx:58`
- `Sidebar.jsx:46`
- `Header.jsx:15`

---

## Issue 3: `loading="lazy"` on a modal image (may cause flash)

**File:** `ClientEditModal.jsx:285`
**Current:** `loading="lazy" decoding="async"`

This image appears inside a **modal** that the user explicitly opens. By the time the modal renders, the user expects to see content immediately. `loading="lazy"` defers the fetch until the image is near the viewport, which can cause a visible flash/swap when the modal opens faster than the image loads.

**Fix:** Change to `loading="eager"`. (The `decoding="async"` is fine here since it is not an LCP candidate.)

---

## Issue 4: `loading="lazy"` on footer icons — correct (no action needed)

For completeness, these are correctly configured:

| File | Line | Attrs | Status |
|------|------|-------|--------|
| `Landing.jsx` | 592 | `loading="lazy" decoding="async"` | ✅ Correct |
| `PrivacyPolicy.jsx` | 108 | `loading="lazy" decoding="async"` | ✅ Correct |
| `TermsOfService.jsx` | 112 | `loading="lazy" decoding="async"` | ✅ Correct |

---

## Complete image inventory

| # | File | Line | Current Attrs | LCP candidate? | Problems |
|---|------|------|---------------|----------------|----------|
| 1 | Landing.jsx | 125 | `loading="eager" decoding="async"` | **YES (nav logo)** | Missing `fetchpriority="high"`, should be `decoding="sync"` |
| 2 | Landing.jsx | 592 | `loading="lazy" decoding="async"` | No (footer) | ✅ Correct |
| 3 | Login.jsx | 155 | `loading="eager" decoding="async"` | **YES (hero logo)** | Missing `fetchpriority="high"`, should be `decoding="sync"` |
| 4 | Login.jsx | 156 | `loading="eager" decoding="async"` | **YES (hero icon)** | Missing `fetchpriority="high"`, should be `decoding="sync"` |
| 5 | Login.jsx | 185 | `loading="eager" decoding="async"` | **YES (hero logo)** | Missing `fetchpriority="high"`, should be `decoding="sync"` |
| 6 | Login.jsx | 186 | `loading="eager" decoding="async"` | **YES (hero icon)** | Missing `fetchpriority="high"`, should be `decoding="sync"` |
| 7 | PrivacyPolicy.jsx | 55 | `loading="eager" decoding="async"` | **YES (nav logo)** | Missing `fetchpriority="high"`, should be `decoding="sync"` |
| 8 | PrivacyPolicy.jsx | 108 | `loading="lazy" decoding="async"` | No (footer) | ✅ Correct |
| 9 | TermsOfService.jsx | 58 | `loading="eager" decoding="async"` | **YES (nav logo)** | Missing `fetchpriority="high"`, should be `decoding="sync"` |
| 10 | TermsOfService.jsx | 112 | `loading="lazy" decoding="async"` | No (footer) | ✅ Correct |
| 11 | SettingsView.jsx | 239 | `loading="eager" decoding="async"` | Maybe (admin) | Missing `fetchpriority="high"` |
| 12 | SettingsView.jsx | 376 | `loading="eager" decoding="async"` | Maybe (admin) | Missing `fetchpriority="high"` |
| 13 | AdminPanel.jsx | 413 | `loading="eager" decoding="async"` | Maybe (admin) | Missing `fetchpriority="high"` |
| 14 | AdminPanel.jsx | 415 | `loading="eager" decoding="async"` | Maybe (admin) | Missing `fetchpriority="high"` |
| 15 | AdminPanel.jsx | 470 | `loading="eager" decoding="async"` | Maybe (admin) | Missing `fetchpriority="high"` |
| 16 | AdminPanel.jsx | 472 | `loading="eager" decoding="async"` | Maybe (admin) | Missing `fetchpriority="high"` |
| 17 | ClientEditModal.jsx | 285 | `loading="lazy" decoding="async"` | No (modal) | Should be `loading="eager"` (modal) |
| 18 | Sidebar.jsx | 46 | `loading="eager" decoding="async"` | **YES (sidebar)** | Missing `fetchpriority="high"`, should be `decoding="sync"` |
| 19 | Header.jsx | 15 | `loading="eager" decoding="async"` | **YES (header)** | Missing `fetchpriority="high"`, should be `decoding="sync"` |
| 20 | ModuleEditor.jsx | 128 | `loading="eager" decoding="async"` | No (editor) | Missing `fetchpriority="high"` |
| 21 | BrandGlobalEditor.jsx | 20 | `loading="eager" decoding="async"` | No (editor) | Missing `fetchpriority="high"` |

---

## Recommended fixes (ordered by LCP impact)

### P0 — Landing page (public-facing, LCP-sensitive)

```diff
- <img src="/icon-192.svg" alt="Financia" loading="eager" decoding="async" className="w-7 h-7" />
+ <img src="/icon-192.svg" alt="Financia" fetchpriority="high" decoding="sync" className="w-7 h-7" />
```

Apply to: `Landing.jsx:125`, `PrivacyPolicy.jsx:55`, `TermsOfService.jsx:58`

### P1 — Login page (auth entry point)

```diff
- <img src={brandLogo} alt="logo" loading="eager" decoding="async" className="w-12 h-12 ..." />
+ <img src={brandLogo} alt="logo" fetchpriority="high" decoding="sync" className="w-12 h-12 ..." />
```

Apply to: `Login.jsx:155, 156, 185, 186`

### P1 — Persistent chrome (header/sidebar)

```diff
- <img src={brand.logo_url} alt="" loading="eager" decoding="async" className="w-8 h-8 ..."/>
+ <img src={brand.logo_url} alt="" fetchpriority="high" decoding="sync" className="w-8 h-8 ..."/>
```

Apply to: `Header.jsx:15`, `Sidebar.jsx:46`

### P2 — Modal image

```diff
- <img src={logoUrl} alt="logo" loading="lazy" decoding="async" className="w-12 h-12 ..."/>
+ <img src={logoUrl} alt="logo" loading="eager" decoding="async" className="w-12 h-12 ..."/>
```

Apply to: `ClientEditModal.jsx:285`

### P3 — Admin/settings/editor images (lowest impact)

Either add `fetchpriority="high"` if they are verified LCP candidates, or remove the redundant `loading="eager"` attribute (since it's the default and adds noise). `decoding="async"` is acceptable here.

---

## Summary of findings

| Issue | Severity | Count |
|-------|----------|-------|
| Missing `fetchpriority="high"` on LCP candidates | **HIGH** | 17 images |
| `decoding="async"` on LCP candidates (should be `sync`) | **HIGH** | 8 images |
| `loading="lazy"` on modal image | **MEDIUM** | 1 image |
| No missing `width`/`height` dimensions (all use CSS sizing) | ✅ OK | — |
| Footer `loading="lazy"` images | ✅ OK | 3 images |

**17 of 19 images with `loading`/`decoding` attributes are misconfigured.** The `loading="eager" decoding="async"` pattern is applied as a template without understanding what each attribute actually does.
