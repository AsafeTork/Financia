# BEST PRACTICES — UX & Acessibilidade (Financia v5.1.1)

> Padrões de UX que **você já sabe aplicar sem perguntar**.

---

## WCAG 2.2 AA (Mínimo para cada feature)

### Color & Contrast

- **Text text (18px+ or bold 14px+):** 4.5:1 contrast
- **Large text (24px+ or bold 18px+):** 3:1 contrast
- ** UI components:** 3:1 contrast (buttons, form labels)
- **Brand colors:** Validar com `color-contrast-checker` ou runtime check

### Touch Targets

- **Buttons, taps:** >= 44×44px (enlarged hit area)
- **Tabs, navigation:** >= 44px height (mobile)
- **Select dropdown:** >= 44×44px por item
- **Form inputs:** >= 44×44px (label + input combined)

### Keyboard Navigation

- **Tab order:** logical (top→bottom, left→right)
- **Focus indicator:** 3px ring, visible on light/dark
- **Skip links:** "Pular para conteúdo", "Pular para navegação"
- **Form labels:** Each input has explicit `label htmlFor`

### Screen Reader

- **HTML semantics:** `<main>`, `<nav>`, `<section>`, `<article>`
- **ARIA roles:** `role="list"` in virtual lists, `role="progressbar"` for spinners
- **Descriptive links:** "Ver detalhes da transação #123" não "Clique aqui"
- **Skip nav:** on focus, announce "Skip to main content"
- **Live regions:** `aria-live="polite"` for dynamic updates (notifications)

### Motion & Animation

- **Reduce motion:** `@media (prefers-reduced-motion: reduce)` — no animation
- **Animation duration:** 200-400ms (não > 1s)
- **Easing:** `ease-in-out` or `cubic-bezier(0.4, 0, 0.2, 1)` (material)
- **Stagger:** 40ms for lists (not 100ms — too slow)

---

## Mobile UX (Priority 1 for 2026)

### Gestures

- **Pull-to-refresh:** Native feel on lists (transactions, inventory)
- **Swipe actions:** Archive/delete/edit on list items (right-to-left)
- **Vertical scroll:** Smooth, no jank (> 60fps)
- **Tap feedback:** Visual / tactile if available (`navigator.vibrate(50)`)

### Touch Targets

| Element | Size | Notes |
|---------|------|-------|
| Button | 44×44px | Extra hit area around visible asset |
| Tab bar | 56px height | Top + bottom padding 6px each |
| Bottom navigation | 56px | Icons + labels, no more than 4 items |
| Select dropdown | 44×44px | Per item (not combined) |
| Form input | 44×44px | Label + input combined |

### Typography

- **Minimum font size:** 16px (iOS zoom prevention)
- **Line height:** 1.5 for body, 1.25 for headings
- **Max line length:** 60-80 characters (title, headings) / 45-75 (body)
- **Contrast:** 4.5:1 minimum (body text on background)

---

## Dark Mode (Priority 1)

### CSS Variables (SEMPRE)

```css
:root {
  --text-main: #111827;
  --text-muted: #6b7280;
  --brand: #002f59;
  --success: #3bbfa0;
  --danger: #ef4444;
}

@media (prefers-color-scheme: dark) {
  :root {
    --text-main: #e5e7eb;
    --text-muted: #9ca3af;
    --brand: #60a5fa;
    --success: #6ee7b7;
    --danger: #f87171;
  }
}
```

### Components

- **Cards:** Slight elevation (shadow), not solid color
- **Charts:** Dark background, light text (web-vitals friendly)
- **Inputs:** Border visible in dark mode (not just background)
- **Buttons:** Hover state visible (not just background color change)

---

## Onboarding Flow

### First-time User Experience

- **Steps:** 1 feature per screen (max 5 screens)
- **Progress:** Clear indicator (1/5, 2/5...)
- **Trust signals:** Showcase data after onboarding (no empty states)
- **Skip option:** Always available (not forced)
- **Persistence:** Save progress (localStorage per user)

### Performance

- **First screen load:** < 1s (cold start)
- **Step transition:** < 300ms (animate, not reload)
- **Total onboarding time:** < 90 seconds

---

## Dashboard UX

### First View

- **Headline metric:** Single, clear KPI ("Resultado Líquido: R$ 12.450")
- **Supporting metrics:** 3 cards (Receita, Despesas, saldo atual)
- **Period selector:** Hidden by default (show only on interaction)
- **Empty state:** If no data, show "Comece adicionando sua primeira transação"

### Interactions

- **Quick actions:** FAB (Floating Action Button) on dashboard + lists
- **Navigation:** Swipe or sidebar (not tab bar on desktop)
- **Refresh:** Pull-to-refresh on lists, "Atualizar" button if needed

### Accessibility

- **Landmarks:** `<main>`, `<aside>`, `<section>` properly used
- **Heading hierarchy:** No skipped levels (H1 → H2 → H3)
- **Color only info:** Never (always text label + icon)
- **Focus ring:** 3px, consistent offset, visible on dark

---

## Forms & Inputs

### Phone Input

- **Format hint:** Example shown ("Ex: (11) 99999-9999")
- **Auto-limit:** Max 15 digits (international)
- **Validation:** Inline, on blur (not on keypress)
- **Error message:** "Formato inválido. Ex: (11) 99999-9999"

### Date Input

- **Picker:** Native `<input type="date">` (not custom)
- **Format:** ISO (YYYY-MM-DD) for data, dd/MM/yyyy for display
- **Relative:** "Hoje", "Ontem", "Últimos 7 dias"

### Radio/Select

- **Touch target:** 44×44px for mobile
- **Label in name:** "Radio option 1" not just "Option 1"
- **Grouping:** `<fieldset> + <legend>` for related options

---

## Performance Perception

### Loading States

- **Skeleton:** Render immediately (no "Loading..." text)
- **Progress:** For long operations (> 1s), show bar
- **Spinners:** AnimateSmooth (not "jump")

### Interaction Feedback

- **Button tap:** Scale 0.95 + shadow change (not just background)
- **Form submit:** "Submitting..." text or spinner
- **Toast:** Auto-dismiss (4s), dismiss button, ARIA live region

### Animation

- **Entrance:** Fade + slide (300ms, stagger 40ms)
- **Exit:** Fade (200ms)
- **Hover:** 150ms (not 300ms — too slow)

---

## Accessibility Checklist (Auto-run Before Deploy)

- [ ] All images have `alt` text
- [ ] All buttons have accessible name (`aria-label` or text)
- [ ] All links have descriptive text
- [ ] All form inputs have labels (`htmlFor` + `id`)
- [ ] Table has proper headers (`<th scope="col">`)
- [ ] Focus ring visible on keyboard navigation
- [ ] Color contrast 4.5:1 (text) and 3:1 (UI components)
- [ ] Touch targets >= 44×44px
- [ ] No keyboard traps (can tab out of everything)
- [ ] Skip links present (hidden by default, visible on focus)
- [ ] `lang="pt-BR"` on `<html>`
- [ ] `<title>` page descriptive

**Executar:** `npm run test:fast -- --run accessibility-checker` (if screen reader in env)

---

## Mobile-First Patterns (Replication is NOT Allowed — Follow Existing)

**Current patterns (copy these, don't invent):**

- `src/shared/ui/BottomNav.jsx` — Bottom navigation bar (4 items max)
- `src/shared/ui/Header.jsx` — App header with title + actions
- `src/shared/ui/QuickActions.jsx` — FAB menu (quick capture)
- `src/features/onboarding/Onboarding.jsx` — Wizard pattern
- `src/features/dashboard/Dashboard.jsx` — KPI grid (4 cards)

**When adding new screen:**
1. Check existing patterns
2. Copy structure (HTML + ARIA + classes)
3. Adapt to your content
4. Validate: touch targets + contrast + keyboard nav

---

## Dark Mode Patterns (Copy Exactly)

**Current implementation (copy):**

- `src/index.css`: `--bg`, `--text-main`, `--text-muted`, `--brand`, `--success`, `--danger`
- `src/animations.css`: Motion tokens (easing, duration, stagger)
- `src/features/auth/Login.jsx`: Theme toggle in footer

**New feature implementation:**
1. Use CSS vars only (no hardcoded colors)
2. Dark mode auto-applicable (via `@media (prefers-color-scheme: dark)`)
3. No "dark mode" toggle (auto_detect is standard 2026)

---

## Emergency UX Fixes (Do Without Asking)

If found, fix immediately (auto:

- [ ] Touch target < 44px → Expand hit area
- [ ] Contrast < 4.5:1 → Use CSS var with correct value
- [ ] Focus ring invisible → Check 3px ring on all focusable
- [ ] Keyboard trap → Add `tabIndex={-1}` on modals, `autoFocus` on content
- [ ] No `alt` on image → Add descriptive alt text
- [ ] Form label missing → Add `<label htmlFor="...">`

**Pattern:** "Fix UX accessibility issue: [short description]"

---

## Mobile Responsiveness Matrix (Test)

| Device | Width | Check |
|--------|-------|-------|
| iPhone SE | 320px | Touch targets, font size |
| iPhone 12/13 | 375px | History (item height), BottomNav |
| iPad Air | 768px | Sidebar + content side-by-side |
| Desktop | 1440px | Max-width container, grid lipsum |
| Wide desktop | 1920px | Centered content, not stretched |

**Executar:** `npm run test:fast -- --run playwright:mobile-report`