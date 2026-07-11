---
type: REPORT
---

# QA Master Audit — Financia

> **Data:** 2026-07-10
> **Stack:** React 18 + Vite 5 + Tailwind 3 + Dexie + Supabase + Stripe + Electron + PWA
> **Test Runner:** Vitest 4 (jsdom) + Playwright (installed, config ausente)
> **Estado:** 1.168 passed, 10 failed, 0 lint errors, 21 issues (FUNCTIONAL_AUDIT), 47 issues (STRESS_AUDIT)

---

## Pré-requisito: Corrigir Relatórios Existentes

Antes de qualquer implementação de testes nova, corrigir os P0/P1 de:

- **STRESS_AUDIT.md** (9 P0 + 14 P1) — índices faltantes, promises sem `.catch()`, `setInterval` sem cleanup, segurança (token GitHub em localStorage, impersonação com senha exposta, CSP ausente, upload sem validação MIME)
- **FUNCTIONAL_AUDIT.md** (4 P1) — inventory saveLoss race condition, GitHub token, foco no Login, match de produto por nome

> ⚠️ **Estes bugs existem em produção. Testes novos sobre código quebrado produzem falsos positivos.**

---

## 1. Estado Atual vs. Meta

### Testes Existentes (21 arquivos, 1.168 passed)

| Categoria | Status | Detalhes |
|-----------|--------|----------|
| Funções puras (cores, formatação) | ✅ Completo | 700+ casos em generated.test.js |
| Lib (auth, stripe, crud, sync, plans) | ✅ Moderado | ~250 testes com mock |
| Hooks (useTx, useProducts, etc.) | ✅ Moderado | ~70 testes com renderHook |
| Componentes (ThemeToggle, ColorField, PhoneInput) | ❌ **3 de 50+** | 17 testes, só fireEvent |
| **10 testes falhando** (uid digits) | ❌ Bug existente | generated.test.js |

### Dimensões Não Cobertas (escopo deste documento)

| # | Dimensão | Coberto por relatório existente? |
|---|----------|----------------------------------|
| 1 | Visual Regression | ❌ Nenhum |
| 2 | Lighthouse CI / Performance Budgets | ❌ Config existe, nunca roda |
| 3 | Web Vitals (LCP/CLS/INP) | ❌ Nenhum |
| 4 | PWA (manifest, SW lifecycle, cache, install) | ❌ Nenhum |
| 5 | Screen Reader (NVDA/VoiceOver) | ❌ Nenhum (só auditoria ARIA manual) |
| 6 | Memory Leak (requestGC, heap snapshot) | ⚠️ Stress script manual, sem automação |
| 7 | IndexedDB/Dexie (corrupção, crash, eviction, sync) | ❌ Nenhum |
| 8 | Stripe Elements (iframe, 3DS, erros) | ❌ Nenhum |
| 9 | Multi-tab (BroadcastChannel, sync loop, IndexedDB) | ⚠️ Stress test manual, 2 abas |
| 10 | Vitest Browser Mode (componentes com interação real) | ❌ Nenhum |
| 11 | Electron (janela, menu, dialogs, IPC) | ❌ Nenhum |
| 12 | CI/CD Pipeline (Playwright + LHCI + Visual) | ❌ Nenhum |

---

## 2. Dimensões de Teste (Apenas o Que FALTA)

### 2.1 Visual Regression

**Problema:** Mudanças de CSS, fontes, cores, layout passam despercebidas. App white-label com branding dinâmico agrava o risco.

**Ferramenta:** Playwright `toHaveScreenshot()` + Docker image oficial para consistência cross-OS.

**O que testar:**
- Cada rota principal em light/dark mode (full page)
- Componentes do design system (botões, cards, modais)
- Responsivo (320px, 768px, 1280px, 1920px)
- Branding dinâmico (cada paleta de plano: free/pro/premium)

**Config:**
```ts
expect: {
  toHaveScreenshot: {
    maxDiffPixelRatio: 0.001,
    threshold: 0.2,
    animations: 'disabled',
  },
}
```

**Complexidade:** Média. Baselines precisam ser commitados e atualizados em PRs de UI.

---

### 2.2 Lighthouse CI + Performance Budgets

**Problema:** `.lighthouseci.config.js` existe com budgets agressivos (performance > 90, LCP < 2.5s, CLS < 0.1) mas **nunca executa**.

**Ferramenta:** `@lhci/cli` no CI.

**Budgets propostos (baseline atual):**
- LCP < 2.5s
- CLS < 0.1
- TBT < 200ms
- JS bundle < 350KB (atual: 432KB — chunk grande identificado)
- Total page < 1.8MB

**Pré-requisito:** Code-splitting do chunk `index-Ba7NV00H.js` (432kB).

---

### 2.3 Web Vitals (Lab + Field)

**Problema:** Zero medição de Core Web Vitals.

**Ferramenta:** `web-vitals` library + `PerformanceObserver` em testes Playwright.

**Métrica alvo (lab):**
- LCP < 2.5s
- CLS < 0.1
- INP < 200ms

---

### 2.4 PWA Completo

**Problema:** App é PWA offline-first com service worker (`src/lib/pwa.js`). Zero testes. Relatório identificou `setInterval` sem cleanup (P0-9) e 6 event listeners sem `removeEventListener` (P1-13).

**Ferramenta:** Playwright + `launchPersistentContext`.

**O que testar:**
- SW registra e ativa em primeira visita
- Manifest.json é válido (name, icons 192+512, display: standalone)
- App carrega do cache quando offline (após visita inicial)
- Fallback offline para rotas não cacheadas
- Cache invalidation (update + activate)
- `beforeinstallprompt` é disparado
- Background sync (se implementado)
- Limpeza entre testes: `afterEach` com unregister + clear caches

**Atenção:** SW não persiste em contextos temporários. Usar `chromium.launchPersistentContext()`.

---

### 2.5 Screen Reader (NVDA + VoiceOver)

**Problema:** axe-core pega ~30-40% dos problemas. Os 60-70% restantes (ordem de leitura, foco, widgets customizados) exigem screen reader real.

**Ferramenta:** `@guidepup/playwright` (NVDA no Windows, VoiceOver no macOS).

**O que testar:**
- Navegação por headings (H → H) cobre a página em ordem lógica
- Landmarks são anunciados corretamente
- Modais: foco preso dentro, `Escape` fecha, `aria-labelledby` correto
- Tabelas/virtual list: `aria-setsize` e `aria-posinset` presentes
- Abas (`SettingsView`): `role="tab"`, `aria-selected`, `aria-controls`
- Erros de formulário: associados via `aria-describedby`

**Limitação:** Só roda em headed mode. CI precisa de ambiente com desktop. `workers: 1` obrigatório.

---

### 2.6 Memory Leak

**Problema:** Relatório encontrou `setInterval` sem cleanup (P0-9), 6 listeners sem `removeEventListener` (P1-13), `setTimeout` em toast sem cleanup (P1-4). Nenhum teste automatizado.

**Ferramenta:** Playwright `page.requestGC()` + `performance.memory` + navegação cíclica.

**O que testar:**
- 20 iterações de navegação entre 6 rotas → heap cresce < 10MB
- Logout → login → heap não acumula (listeners do sync loop limpos)
- HMR/reload não duplica listeners (módulo pwa.js)
- WeakRefs não retêm detached DOM nodes (Playwright bug #41462)

**Threshold:** < 10MB de crescimento após 120 navegações.

---

### 2.7 IndexedDB / Dexie

**Problema:** App é offline-first com Dexie. IndexedDB pode ser evictado silenciosamente pelo Chrome sob pressão de disco. Zero testes de resiliência.

**Ferramenta:** Playwright `page.evaluate()` para manipular IndexedDB diretamente + `browser.newContext({ storageState: undefined })` para simular storage limpo.

**O que testar:**
- Corrupção do IndexedDB: app recovery sem white screen
- Storage pressure eviction: `navigator.storage.persist()` está sendo chamado?
- Schema migration (versão Dexie): additive-only, versão antiga → nova
- Escrita simultânea em 2 contexts diferentes → race condition no sync
- Quota excedida: app mostra erro, não quebra silenciosamente

**Padrão:**
```ts
await page.evaluate(() => {
  const req = indexedDB.deleteDatabase('FinanciaDB');
  return new Promise(r => { req.onsuccess = r; req.onerror = r; });
});
await page.reload();
// App deve recriar DB e mostrar estado vazio, não white screen
```

---

### 2.8 Stripe Elements (iframe)

**Problema:** Stripe Elements renderiza em iframe cross-origin. Qualquer teste que passar por checkout precisa de `frameLocator`. Zero testes.

**Ferramenta:** Playwright `frameLocator()` + Stripe test cards.

**O que testar:**
- CardElement happy path (4242...)
- PaymentElement com métodos de pagamento dinâmicos
- 3DS challenge (card 4000002500003155) — iframe aninhado
- Erros de validação inline (cartão inválido, expirado)
- SetupIntent para salvar cartão

**Padrão:**
```ts
const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
await stripeFrame.getByLabel('Card number').fill('4242424242424242');
```

**Atenção:** Stripe muda nomes de iframe regularmente. Usar `name^=` (prefixo) + `title`, não nome exato.

---

### 2.9 Multi-tab (BroadcastChannel + Sync)

**Problema:** App tem sync loop via BroadcastChannel + `visibilitychange`. Zero testes. Erro comum: usar `browser.newContext()` em vez de `context.newPage()` — contexts diferentes isolam BroadcastChannel.

**Ferramenta:** Playwright `context.newPage()` (mesmo context = mesmo storage).

**O que testar:**
- Criar transação na aba A → aparece na aba B
- Excluir na aba A → desaparece na aba B
- Editar branding na aba A → cores atualizam na aba B
- Sync loop dispara corretamente em `visibilitychange`

**Padrão:**
```ts
const tab1 = await context.newPage();
const tab2 = await context.newPage();
// tabs 1 e 2 compartilham IndexedDB e BroadcastChannel
```

---

### 2.10 Vitest Browser Mode (Componentes)

**Problema:** Componentes testados com jsdom + `fireEvent` (eventos sintéticos). Não capturam: layout real, `getComputedStyle`, foco, `IntersectionObserver`.

**Ferramenta:** Vitest Browser Mode (`@vitest/browser` + `vitest-browser-react`) — estável desde Vitest 4.0.

**O que migrar (prioridade):**
- ColorField — interação com color picker nativo
- PhoneInput — formatação com cursor position
- Sidebar, Header, BottomNav — navegação, foco, responsivo
- Login — erros inline, gerenciamento de foco, teclado
- Dashboard — gráficos SVG, KPIs, tabela virtual

**Config:**
```ts
test: {
  browser: {
    enabled: true,
    provider: 'playwright',
    instances: [{ browser: 'chromium' }],
  },
}
```

**Não migrar:** Funções puras, hooks com mock (continuam em jsdom — mais rápido).

---

### 2.11 Electron

**Problema:** Build produz executável Windows via Electron. Zero testes.

**Ferramenta:** Playwright `_electron.launch()` (API experimental) + `electron-playwright-helpers` para menus e dialogs.

**O que testar:**
- App inicia e janela principal abre
- Título correto
- Navegação carrega
- Native dialogs (Open/Save) mockados via `stubDialog`
- IPC entre main/renderer

**Padrão:**
```ts
const app = await playwright._electron.launch({
  args: [path.join(__dirname, '../../electron/main.cjs')],
});
const window = await app.firstWindow();
await expect(window).toHaveTitle(/Financia/);
```

**Risco:** API experimental. Testes quebram com updates do Electron.

---

### 2.12 CI/CD Pipeline

**Problema:** Zero automação de QA em CI. Sem GitHub Actions configurado.

**Pipeline proposto:**
```yaml
jobs:
  lint-unit:      # npm run lint + npm test (rápido, ~2min)
  e2e:            # Playwright chromium (fluxos críticos, ~5min)
  lighthouse:     # LHCI (LCP/CLS/TBT, ~3min)
  visual:         # toHaveScreenshot (Docker, ~3min)
```

- `e2e` + `lighthouse` + `visual` rodam em paralelo após `lint-unit`
- Visual e Lighthouse com path filter (só UI changes disparam)
- Playwright browsers cacheados entre runs

---

## 3. Matriz de Esforço vs. Impacto

| Dimensão | Esforço | Impacto | Prioridade |
|----------|---------|---------|------------|
| Visual Regression | 3d | Alto | P1 |
| Lighthouse CI + Budgets | 1d | Alto | P1 |
| PWA (SW + cache + manifest) | 3d | **Crítico** (app offline-first) | **P0** |
| Screen Reader | 3d | Médio (60% dos problemas de a11y) | P2 |
| Memory Leak | 1d | Alto (P0-9, P1-4, P1-13) | P1 |
| IndexedDB/Dexie | 2d | **Crítico** (app offline-first) | **P0** |
| Stripe Elements | 3d | Alto (fluxo de pagamento) | P1 |
| Multi-tab Sync | 2d | Alto (BroadcastChannel) | P1 |
| Vitest Browser Mode | 5d | Médio (50+ componentes) | P2 |
| Electron | 2d | Baixo (build desktop) | P3 |
| CI/CD Pipeline | 1d | **Crítico** (sem automação) | **P0** |

---

## 4. Plano de Implementação

### Fase 0 — Corrigir Existente (Antes de qualquer teste novo)
- [ ] 9 P0 do STRESS_AUDIT (índices, promises, setInterval, segurança)
- [ ] 4 P1 do FUNCTIONAL_AUDIT (inventory race, token, focus, product match)
- [ ] 10 testes falhando (uid digits em generated.test.js)

### Fase 1 — Fundação (Semana 1-2)
- [ ] Playwright config (`playwright.config.ts`)
- [ ] CI/CD Pipeline (GitHub Actions)
- [ ] PWA: SW lifecycle + manifest + offline cache
- [ ] IndexedDB/Dexie: recovery + migration + eviction
- [ ] Multi-tab: BroadcastChannel + sync loop

### Fase 2 — Qualidade (Semana 3-4)
- [ ] Lighthouse CI + budgets
- [ ] Visual Regression (rotas principais)
- [ ] Memory Leak (navegação cíclica)
- [ ] Web Vitals (LCP/CLS/INP)
- [ ] Stripe Elements (card + 3DS + erros)

### Fase 3 — Cobertura (Semana 5-6)
- [ ] Screen Reader (Guidepup)
- [ ] Vitest Browser Mode (componentes prioritários)
- [ ] Electron (janela, diálogos)
- [ ] Visual Regression (componentes + responsivo)

---

## 5. Referências aos Relatórios Existentes

| Documento | Issues | Status |
|-----------|--------|--------|
| `docs/QA/FUNCTIONAL_AUDIT.md` | 21 (4 P1, 10 P2, 7 P3) | Baseline — deve ser referenciado |
| `docs/QA/STRESS_AUDIT.md` | 47 (9 P0, 14 P1, 15 P2, 9 P3) | Baseline — deve ser referenciado |
| Este documento | 12 dimensões não cobertas | Complementar |

> **Regra:** Nenhum teste deste plano deve ser implementado antes da correção dos P0/P1 dos relatórios acima.

---

## 6. Resumo de Riscos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| IndexedDB evictado sem `navigator.storage.persist()` | Perda total de dados offline | Testar + adicionar persist |
| Stripe iframe selectors mudam | Testes de pagamento quebram | Usar prefixo `name^=` + title |
| SW não persiste em context temporários | Testes PWA falsos negativos | Usar `launchPersistentContext` |
| Guidepup só roda headed, sem CI | Screen reader não automatizado | VM Windows + NVDA |
| Electron API experimental | Testes quebram com update | Cobertura mínima (só janela) |
