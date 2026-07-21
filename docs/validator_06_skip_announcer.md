---
type: REPORT
status: APPROVED
owner: VALIDATOR-6
version: 1.0
reviewed_by: VALIDATOR-6
ready_for_integration: true
last_review: 2026-07-21
---

# VALIDATOR-6: Skip Link + Route Announcer Audit

**Files examined:**
- `src/App.jsx` (lines 192–197, 316, 326, 343)
- `src/index.css` (line 346–347)

---

## 1. Skip Link: `:focus` vs `:focus-visible` —— FALSE ALARM

The CSS uses `.skip-link:focus { top: 0; }`. For skip links, `:focus` is correct — the element must be visible whenever it has keyboard focus, regardless of input modality. `:focus-visible` would prevent the link from appearing after mouse interaction, which is not the intended behavior for skip links.

**No fault.**

---

## 2. `<main>` missing `tabindex="-1"` in initial markup —— CONFIRMED FAULT

**Code:** `src/App.jsx:316,326`

The skip link adds `tabindex="-1"` dynamically via JavaScript, but the `<main>` element has no `tabindex` in the initial HTML render:

```jsx
<main id="main-content" className="flex-1 ...">
```

If JavaScript fails, the skip link's `e.preventDefault()` + `focus()` will not execute. Without `tabindex="-1"` in the markup, the native fragment navigation (`href="#main-content"`) scrolls the page but **does not move keyboard focus** in some browser/AT combinations.

**Sources:**
- WCAG Technique G1: "adding `tabindex="-1"` to the target element so it can receive focus" (w3.org/WAI/WCAG21/Techniques/general/G1)
- Deque `skip-link` rule: "The target element must have `tabindex="-1"` so the browser can move focus to them when the skip link is activated." (dequeuniversity.com/rules/axe/4.3/skip-link)
- WebAIM: "The target ... needs `tabindex="-1"`. This lets an element that isn't normally focusable receive focus when we tell it to with JavaScript." (webaim.org/techniques/skipnav/)

**Fix:** Add `tabindex="-1"` to `<main id="main-content" tabindex="-1">`.

---

## 3. Route announcer: NO FOCUS RESTORATION after navigation —— CONFIRMED CRITICAL FAULT (WCAG 2.4.3)

**Code:** `src/App.jsx:192-197`

The route announcer's `useEffect` sets `announceMsg` but **does not move keyboard focus** anywhere. After a client-side route change:

- Focus remains on the clicked link
- The screen reader announces the new page name
- But the keyboard user's next Tab press continues from the stale position

This violates WCAG 2.4.3 Focus Order (Level A). Multiple authoritative sources mandate focus restoration on SPA navigation:

- React Router accessibility guide: "What element receives focus when the route changes? This is important for keyboard users and can be helpful for screen-reader users." (reactrouter.com/7.16.0/how-to/accessibility)
- MFA11y: "Focus restoration. Announcing the page but leaving focus on the clicked link fails 2.4.3 Focus Order and strands keyboard users." (modern-framework-accessibility.com/react-nextjs-accessibility-patterns)
- A11yPath: "After each route change, move focus to the `<h1>` of the new page. This causes the screen reader to announce the heading, giving the user immediate context." (a11ypath.com/guides/spa-accessibility)

**Fix:** Add a `useEffect` on `[path]` that calls `document.getElementById('main-content')?.focus()` after the route renders.

---

## 4. No first-load guard: double announcement on initial mount —— CONFIRMED FAULT

**Code:** `src/App.jsx:192-197`

The effect runs on every `path` change, including the **initial mount**. On first page load:

- The screen reader already announces the page via the document title
- The route announcer simultaneously writes `announceMsg` with the same route name
- This creates a double announcement

The MFA11y pattern explicitly guards against this with a `firstRender` ref:
```ts
if (firstRender.current) {
  firstRender.current = false;
  return; // Skip — browser already announced first load
}
```

Next.js's own route announcer also skips first load: `if (previouslyLoadedPath.current === asPath) return`.

**Sources:**
- MFA11y: "Announcing on first load. Double-announcing the initial page is noisy. Skip the first effect run." (modern-framework-accessibility.com)
- react-router accessibility guide: "Skip the initial mount — the browser already announced the first load."

**Fix:** Add a `useRef` guard to skip the first effect execution.

---

## 5. Timeout clears before screen reader finishes speaking —— CONFIRMED FAULT

**Code:** `src/App.jsx:195`

```jsx
var t = setTimeout(function() { setAnnounceMsg(''); }, 1500);
```

`aria-live="polite"` announcements are queued behind the user's current speech. If the user is actively navigating content when a route change occurs, the polite announcement waits until the user pauses. At that point, 1500ms may have already elapsed and the text is cleared.

Screen reader speech rate is user-configurable (words per minute). Users with slower speech rates or cognitive disabilities may require longer to finish hearing an announcement.

**Sources:**
- MDN: "aria-live='polite' tells screen readers to announce the content when there is a natural pause in speech." (developer.mozilla.org)
- Screen Reader Announcement Strategies: "Using `setTimeout` to clear live region text is unreliable. The screen reader's speech queue may not have processed the text before the timeout fires." (www.accessible-data-interfaces.com)
- Next.js route announcer: Does NOT clear the announcement text — it persists in a Shadow DOM so it never disappears (github.com/vercel/next.js)

**Fix:** Either remove the clearing timeout entirely (let the next navigation overwrite the text) or increase to 3000ms+ with a guard that only clears after confirming the text was likely spoken.

---

## 6. No re-announcement on duplicate path navigation —— CONFIRMED FAULT

**Code:** `src/App.jsx:192-197`

If a user navigates away from `/dashboard` and back, the `path` dependency changes to `'dashboard'` again, so the effect re-runs. However, if the route changes between pages with the same route name (e.g., two different sub-routes that both map to "Configurações"), the DOM text node changes from empty to the name, which triggers a screen reader mutation. This partially works.

The **real** issue: the announcer does not re-announce when navigating to a different route that produces the **same announcement string** because React's reconciliation may not detect a DOM mutation when the string is identical. The fix is the clear-then-set pattern:

```ts
// Clear first, then set on next frame to force mutation detection
setAnnounceMsg('');
requestAnimationFrame(() => setAnnounceMsg(newName));
```

Without this, navigating between `/settings/a` and `/settings/b` (same announcement) produces silence.

**Sources:**
- MFA11y: "Clear the live region's text and re-set it on a fresh animation frame. Because the text node value changes from empty back to a string, assistive technology detects a mutation and announces again." (modern-framework-accessibility.com)
- ARIA live regions MDN: "Screen readers only announce changes. If the text doesn't change, nothing is announced." (developer.mozilla.org)

**Fix:** Clear `announceMsg` to `''` and use `requestAnimationFrame` to set the new value.

---

## 7. Deep sub-routes fall through to raw path string —— CONFIRMED FAULT

**Code:** `src/App.jsx:193`

```jsx
var names = { dashboard:'Dashboard', income:'Vendas e Ganhos', expense:'Despesas', ... };
setAnnounceMsg(names[path] || path);
```

Deep paths like `settings/profile`, `settings/billing`, or `inventory/123` are not in the `names` object. The fallback `names[path] || path` emits the raw path string (e.g., `"settings/profile"`) which is not human-readable and may be confusing when spoken by a screen reader.

**Fix:** Use a prefix-based match or parse the first segment: `names[path.split('/')[0]] || path`.

---

## 8. Skip link animates `top` (layout property) instead of `transform` —— CONFIRMED (minor)

**Code:** `src/index.css:346`

```css
.skip-link { transition: top .2s; }
.skip-link:focus { top: 0; }
```

Animating `top` triggers layout recalculations on every frame. While not a WCAG violation per se, it can cause jarring visual jumps in some browsers when the link appears. `transform: translateY()` would be GPU-composited and smoother.

**Sources:**
- CSSTricks: "Animating transform and opacity is cheap. Animating top/left triggers layout." (css-tricks.com/performance)

---

## 9. Announcer text persists in DOM virtual buffer —— CONFIRMED FAULT

**Code:** `src/App.jsx:343`

```jsx
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announceMsg}</div>
```

The `.sr-only` class hides the announcer visually, but the text remains in the DOM. Screen reader users navigating in virtual cursor/browse mode can still discover the announcement text ("Dashboard", "Vendas e Ganhos", etc.) in the page content, which is confusing — it appears as orphaned text outside the visual layout.

Next.js solves this by rendering the announcement inside a **Shadow DOM** (app-router-announcer), which makes it invisible to the virtual cursor while still being announced via the live region.

**Fix:** Render the announcer via `createPortal` into a container outside React's render tree, or use a Shadow DOM wrapper. Alternatively, ensure `announceMsg` is always `''` except during the brief announcement window.

---

## 10. No focus outline control on `<main>` after skip link —— CONFIRMED (minor)

When the skip link focuses `<main>`, the browser renders a default focus outline on the `<main>` element. The code does not include:
```css
main:focus { outline: none; } /* or similar */
```

While some argue the outline should remain (for visual feedback), the current `button:focus-visible, a:focus-visible` rule does not apply to `<main>`, so the browser uses a native outline that may be inconsistent across browsers.

---

## Summary Table

| # | Fault | WCAG | Severity |
|---|-------|------|----------|
| 2 | `<main>` lacks `tabindex="-1"` in HTML | 2.4.1 | Medium |
| 3 | No focus restoration on route change | 2.4.3 | **Critical** |
| 4 | First-load double announcement | 4.1.3 | High |
| 5 | 1500ms timeout can clear before AT speaks | 4.1.3 | Medium |
| 6 | No re-announcement for same-string routes | 4.1.3 | Medium |
| 7 | Deep sub-routes get raw path string | 4.1.3 | Low |
| 8 | `top` animation (layout thrashing) | — | Low |
| 9 | Announcer visible in virtual buffer | 4.1.3 | Low |
| 10 | No outline control on `<main>` after focus | 2.4.7 | Low |

**Faults 3 and 4 must be fixed before this module can be considered accessible.** Faults 2 and 5 are medium-severity and should be addressed in the same cycle.
