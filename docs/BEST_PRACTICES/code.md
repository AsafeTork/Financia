# BEST PRACTICES — Código (Financia v5.1.1)

> Padrões de código que **você já sabe implementar sem perguntar**.

---

## React

### Componentes

- **Functional components only** (no classes)
- **Hooks > HOC/render prop** (padrão atual,追加: useDashboardState, useTransactionFilter)
- **React.memo** para componentes renderizam frequentemente mas props raramente mudam
- **Lazy loading** para routes (`import().then()`), não基建
- **useCallback** para funções passadas como dependency (ex.: `useMemo(() => filterTx(tx), [filter])`)

### State

- **Dexie** para state local (IndexedDB)
- **Supabase Realtime** para sync entre tabs
- **useState/useReducer** para UI state local
- **Context** apenas para global state que precisa de subscription (Auth, Brand, Settings)

### Performance

- **Context split** — não um Contextзонão (use多个 smaller contexts)
- **Render only active route** — `<Suspense>` com fallback
- **useMemo/useState lazy initialization** — avoid expensive computation on mount
- **React.memo** em componentes com list rendering (ex.: TransactionCard, KpiCard)

---

## CSS / Design System

### Variables (SEMPRE)

- **Cores:** `var(--brand)`, `var(--green-600)`, `var(--error-50)`
- **Spacing:** `var(--space-4)`, `var(--space-16)`, `var(--space-24)`
- **Typography:** `var(--font-heading)`, `var(--font-ui)`, `var(--font-mono)`
- **Motion:** `var(--easing-soft)`, `var(--duration-200ms)`, `var(--stagger-40ms)`

**NUNCA:** Hex hardcoded (#111827), pixels direct (margin: 16px), inline styles (style={{color: 'red'}})

### Layouts

- **Flexbox** para alignment simples (row/column)
- **CSS Grid** para layouts复杂 (kpi grid, dashboard bento)
- **position: sticky** para headers de lista (data grouping)
- **overflow: hidden** para truncated text (ellipsis)

### Responsive

- **Mobile-first** breakpoints: 320px, 375px, 768px, 1024px, 1440px
- **max-width** container ( Cards, forms) → nāo centrum fixed width
- **Touch targets >= 44×44px** (buttons, inputs, labels)
- **Minimum font size 16px** (iOS zoom prevention)

---

## TypeScript

### Rules (STRICT MODE)

- **noImplicitAny** — always
- **strictNullChecks** — always
- **noUnusedLocals** — always (lint error)
- **noExplicitAny** — always

### Patterns

```ts
// Type-safe IDs
type TransactionId = string & { __brand: 'Transaction' };

// Error handling
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// Optional with default
interface Config {
  theme?: 'light' | 'dark';
  locale?: string;
}
const config: Config = { theme: 'light', locale: 'pt-BR' };

//Guardas de tipo
function isTransactionId(id: string): id is TransactionId {
  return id.startsWith('tx_');
}
```

---

## Styling Patterns

### CSS Classes (animações, motion)

```css
/* animations.css */
.anim-page-view {
  animation: fadeIn var(--duration-300ms) ease-in-out;
}

.anim-slide-in {
  animation: slideIn var(--duration-400ms) var(--easing-soft);
}

.anim-shake {
  animation: shake var(--duration-200ms) var(--easing-sharp);
}
```

### Spiral component pattern

```
ComponentName.jsx
  ├─ hooks/
  │  └─ useComponentState.js (state + logic)
  ├─ data/
  │  └─ schema.js (Dexie table, indexes, RLS placeholder)
  ├─ ui/
  │  └─ ComponentNameUI.jsx (pure presentational)
  └─ index.js (export default, wire hooks + UI)
```

### State management

```js
// hooks/useDashboardState.js
export const useDashboardState = () => {
  const [range, setRange] = useState('thisMonth');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  // Auto-refresh on range change
  useEffect(() => {
    fetchData(range).then(setData).finally(() => setLoading(false));
  }, [range]);

  return { range, setRange, loading, data };
};
```

---

## Testing

### Patterns

- **Unit tests** → `*.test.js` (vitest)
- **Integration tests** → `*.integration.test.js` (mock API responses)
- **E2E tests** → `*.e2e.spec.js` (playwright, separate workflow)

### Test naming

```js
test('when range changes, data is refreshed', async () => {
  // Given
  render(<Dashboard />);
  // When
  await user.click(screen.getByText('Last 30 days'));
  // Then
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  expect(await screen.findByText(/Total:/)).toBeInTheDocument();
});
```

---

## Deployment

### Pre-deploy checklist (auto-run)

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

### Post-deploy verification (no user action)

- [ ] Site loads (`curl -I https://financiabr.me`)
- [ ] Lighthouse CI pass (`lhci autorun`)
- [ ] IndexedDB works (open app, refresh, offline mode)
- [ ] Supabase Realtime sync (open in 2 tabs, change in one, see in other)

---

## Gotchas (Things to Never Do)

1. **`auth.uid()` sem `(SELECT)`** → RLS 19x lento
2. **State no Context global** → redraw every keystroke
3. **Hardcoded colors** →/theme não funciona
4. **Console.log em produção** → remove before commit
5. **Large dependencies** → check bundle size first
6. **Blocking render** → use useMemo, lazy, code-splitting
7. **Missing ARIA** → WCAG fail