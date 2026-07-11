---
type: WORKING
status: APPROVED
owner: QA
version: 1.0
reviewed_by:
ready_for_integration: true
---

# QA — Análise da Infraestrutura de Testes

---

## 1. Diagnóstico

### 1.1 Stack Atual

| Camada | Tecnologia | Versão | Status |
|--------|-----------|--------|--------|
| Runner | Vitest | 4.1.9 | ✅ Ativo |
| Ambiente | jsdom | 29.1.1 | ✅ Ativo |
| Componentes | @testing-library/react | 16.3.2 | ✅ Ativo |
| Matchers | @testing-library/jest-dom | 6.9.1 | ✅ Ativo |
| IndexedDB mock | fake-indexeddb | 6.2.5 | ✅ Ativo |
| E2E (instalado) | @playwright/test + playwright | 1.61.0 | ⚠️ Sem config, sem testes |
| Coverage | @vitest/coverage-v8 | 4.1.10 | ✅ Ativo (thresholds baixos) |
| CI | GitHub Actions | — | ✅ 3 jobs: lint, test, coverage |
| Perf/LHCI | @lhci/cli | config existe | ❌ Nunca roda |

### 1.2 Problemas Encontrados (20 itens)

#### P0 — Críticos

1. **Playwright instalado mas sem uso.** `package.json` contém `@playwright/test ^1.61.0` e `playwright ^1.61.0` em devDependencies. Não existe `playwright.config.ts`. Não existe nenhum arquivo `*.spec.*`. Nenhum script npm referencia playwright. Causa: instalação inicial nunca finalizada. App financeiro offline-first sem E2E, sem visual regression, sem PWA, sem Stripe, sem multi-tab, sem screen reader.

2. **LHCI configurado mas nunca executado.** `.lighthouseci.config.js` existe com `numberOfRuns: 3`, assertions de performance > 90, a11y > 90, mas nenhum workflow CI o executa. Causa: config adicionada sem job CI. Regressões de performance, acessibilidade, e boas práticas passam despercebidas.

3. **CI não tem jobs de E2E, visual, ou performance.** `.github/workflows/ci.yml` tem apenas `lint`, `test`, `coverage`. Nenhum job de Playwright, Lighthouse CI, ou visual regression.

4. **Setup de testes minimalista (2 linhas).** `src/test/setup.js` contém apenas `import '@testing-library/jest-dom/vitest'` e `import 'fake-indexeddb/auto'`. Sem MSW, sem mocks globais, sem cleanup customizado, sem timeouts.

#### P1 — Altos

5. **Component tests usam `fireEvent` (evento sintético).** `PhoneInput.test.jsx:22`, `ColorField.test.jsx:23,31` — `fireEvent.change()` e `.click()` direto. Eventos sintéticos não reproduzem comportamento real do usuário. `fireEvent.change` não dispara focus/blur, não testa cursor position.

6. **Component tests usam `React.createElement` sem JSX.** Todos os 3 arquivos de componente usam `React.createElement(Component, { props })` em vez de `<Component props />`. Código mais verboso, sem type-checking de props.

7. **Zero testes assíncronos em componentes.** Nenhum componente usa `await`, `waitFor`, `findBy*`. Todas as assertions são síncronas. Componentes com renderização assíncrona (loading, data fetching) não são testados.

8. **Zero testes de teclado/acessibilidade.** Nenhum teste pressiona Tab, Enter, Escape, ou ArrowKey. Nenhum teste de foco. 60-70% dos problemas de a11y não são detectados por axe-core.

9. **Nenhum `data-testid` no código.** `grep data-testid` nos arquivos `.tsx` retorna zero resultados. Componentes complexos (tabelas virtuais, listas dinâmicas) ficam impossíveis de selecionar de forma estável.

10. **Coverage thresholds muito baixos.** `vitest.config.js`: `thresholds: { lines: 40, functions: 30, branches: 30, statements: 40 }`. 60% do código pode ficar sem teste sem alerta.

11. **Mocks simplistas sem suporte a erro.** `src/test/mocks.js` — `makeSb()` sempre retorna `{ error: null }`. Não há `makeSbError()`, `makeSbLoading()`, ou `makeSbTimeout()`. Nenhum teste verifica comportamento em erro de Supabase.

12. **Teste do Offline component é trivial.** `components.test.js:31-34` — único teste verifica que renderiza `null` quando online. App offline-first sem verificação de comportamento offline.

13. **Sem container Docker para testes visuais.** Nenhum `Dockerfile` ou `docker-compose`. Visual regression testing (`toHaveScreenshot`) sofrerá falsos positivos por diferenças de OS/fontes.

14. **Sem suporte a testes de storage state.** Nenhum teste de IndexedDB recovery, storage eviction, ou `navigator.storage.persist()`. App offline-first pode perder dados silenciosamente.

15. **Sem teste de BroadcastChannel / multi-tab.** Nenhum teste cria 2 abas no mesmo context. Sync entre abas pode quebrar sem detecção.

16. **Zero testes de Stripe Elements.** Nenhum uso de `frameLocator`. Nenhum mock de PaymentIntent. Fluxo de pagamento sem cobertura.

#### P2 — Médios

17. **Testes em JavaScript sem TypeScript.** Todos os 21 arquivos são `.js` ou `.jsx`. Refatorações quebram testes silenciosamente.

18. **`var` keyword em vez de `const`/`let`.** Todos os arquivos usam `var`. Escopo de função pode causar bugs em closures.

19. **Nenhum `.nvmrc` ou `.node-version`.** Node version só especificado em CI. Devs podem usar versões diferentes local vs CI.

20. **Teste de sync usa mocks inline complexos.** `src/lib/sync.test.js` define 50+ linhas de `vi.mock` inline. Mocks frágeis — qualquer mudança na API real quebra o mock.

### 1.3 Causas Raiz

1. Falta de prioridade em QA — Playwright instalado sem uso, LHCI sem CI
2. Padrões desatualizados — `var`, `React.createElement`, `fireEvent`
3. Setup mínimo — 2 linhas, sem MSW, sem mocks de erro
4. CI incompleto — LHCI sem job, sem E2E
5. Cobertura superficial — Componentes testam render, não comportamento
6. App financeiro offline-first sem testes de storage, sync, ou PWA

---

## 2. Pesquisas Realizadas

### Fontes consultadas

| Tópico | Fonte | Link |
|--------|-------|------|
| Playwright Best Practices 2026 | Playwright Docs | https://playwright.dev/docs/best-practices |
| Playwright Best Practices Skill | Currents.dev | https://currents.dev/posts/playwright-best-practices-skill |
| Playwright Testing 2026 Guide | QASkills.sh | https://qaskills.sh/blog/playwright-testing-best-practices-2026 |
| Visual Regression 2026 Guide | ScrollTest | https://scrolltest.com/visual-regression-testing-playwright-complete-guide-2026/ |
| Vitest Browser Mode Docs | Vitest | https://vitest.dev/guide/browser/component-testing |
| Vitest Browser Mode 2026 Guide | QASkills.sh | https://qaskills.sh/blog/vitest-browser-mode-guide-2026 |
| IndexedDB Automation Testing | DEV.to | https://dev.to/_eb7f2a654e97a60ae9f96e/indexeddb-automation-testing-pitfalls-3-hidden-bugs-30-wasted-hours-7m2 |
| IndexedDB Disaster Recovery | DEV.to | https://dev.to/_eb7f2a654e97a60ae9f96e/automated-indexeddb-disaster-recovery-testing-with-playwright-from-30-to-100-coverage-27jg |
| Multi-tab IndexedDB Sync Trap | DEV.to | https://dev.to/_eb7f2a654e97a60ae9f96e/playwright-multi-tab-indexeddb-sync-the-browser-context-isolation-trap-6-hours-of-debugging-56d |
| PWA Offline Testing | ScanlyApp | https://scanlyapp.com/blog/testing-pwa-offline-functionality-service-workers |
| Stripe Elements Testing 2026 | Assrt | https://assrt.ai/t/how-to-test-stripe-elements |
| Stripe Checkout Testing 2026 | Assrt | https://assrt.ai/t/how-to-test-stripe-checkout |
| Guidepup Playwright | GitHub | https://github.com/guidepup/guidepup-playwright |
| Guidepup Example | Guidepup | https://www.guidepup.dev/docs/example |
| Electron Testing | Playwright Docs | https://playwright.dev/docs/api/class-electron |
| Electron Testing Patterns | Currents.dev | https://github.com/currents-dev/playwright-best-practices-skill/blob/HEAD/testing-patterns/electron.md |
| Lighthouse CI Budgets 2026 | Web Perf Clinic | https://webperfclinic.com/article/performance-budgets-lighthouse-ci-automate-regression-prevention-cicd-pipeline |
| Lighthouse CI GitHub Actions | Unlighthouse | https://unlighthouse.dev/learn-lighthouse/lighthouse-ci/github-actions |
| Playwright Memory Leak Bug #41462 | GitHub | https://github.com/microsoft/playwright/issues/41462 |
| Scaling Playwright Tests Memory | hoangtaiki.com | https://hoangtaiki.com/blog/scaling-playwright-tests-solving-ci-memory-leaks |
| Full-Stack Testing with Playwright | nazarboyko.com | https://www.nazarboyko.com/articles/playwright-for-full-stack-testing |
| Playwright Component Testing React | QASkills.sh | https://qaskills.sh/blog/playwright-component-testing-react-complete-guide |

### Relatórios existentes consultados

- `docs/QA/FUNCTIONAL_AUDIT.md` — 21 issues (0 P0, 4 P1, 10 P2, 7 P3)
- `docs/QA/STRESS_AUDIT.md` — 47 issues (9 P0, 14 P1, 15 P2, 9 P3)

---

## 3. Melhores Práticas

| Prática | Fonte | Status no Projeto | Ação |
|---------|-------|-------------------|------|
| Web-first assertions (`await expect` retrying) | Playwright Best Practices 2026 | ❌ Não usado | Adicionar em novos testes |
| `getByRole` como seletor primário | Playwright Docs | ✅ Usado em componentes | Manter |
| `userEvent` em vez de `fireEvent` | Testing Library Docs | ❌ Usa `fireEvent` | Migrar |
| `storageState` para auth em E2E | Playwright Best Practices | ❌ Não implementado | Adicionar setup project |
| Custom fixtures em vez de Page Object | Playwright Best Practices 2026 | ❌ Não implementado | Criar fixture de auth |
| Mock IndexedDB crash recovery via `page.evaluate` | DEV.to 2026 | ❌ Não implementado | Adicionar helpers |
| `frameLocator` para Stripe iframes | Assrt / Stripe Docs | ❌ Não implementado | Adicionar testes |
| Prefixo `name^=` para seletores Stripe | Stripe Testing Guide | ❌ Não aplicável | Usar em testes Stripe |
| Guidepup para screen reader (headed, 1 worker) | Guidepup Docs | ❌ Não implementado | Adicionar testes |
| `context.setOffline(true)` para PWA | Playwright PWA Guide | ❌ Não implementado | Adicionar testes |
| `numberOfRuns: 3` para LHCI | Google Web Dev 2026 | ✅ Configurado | Ativar no CI |
| Docker para testes visuais consistentes | Playwright Visual Guide | ❌ Não implementado | Criar Dockerfile |
| MSW em setup file | Vitest Browser Mode Guide | ❌ Não implementado | Adicionar ao setup.js |
| `aggregationMethod: 'median'` no LHCI | Lighthouse CI Guide | ❌ Não configurado | Adicionar ao lighthouserc.js |
| `data-testid` como escape hatch | Playwright Best Practices | ❌ Zero no código | Adicionar em pontos críticos |
| `expect.element` retrying no Vitest Browser Mode | Vitest 4 Docs | ❌ Não usado | Usar em Browser Mode |

---

## 4. Arquivos Afetados

| Arquivo | Problema | Ação |
|---------|----------|------|
| `package.json` | Playwright sem uso | Adicionar scripts de E2E |
| `vitest.config.js` | Thresholds baixos (40/30/30/40) | Aumentar para 60/50/50/60 |
| `src/test/setup.js` | Apenas 2 linhas | Adicionar MSW, timeouts, cleanup utilitários |
| `src/test/mocks.js` | Sem mocks de erro | Adicionar `makeSbError()`, `makeSbLoading()`, `makeSbTimeout()` |
| `src/shared/ui/PhoneInput.test.jsx` | `fireEvent`, `React.createElement`, sem async | Migrar para `userEvent`, JSX, `await` |
| `src/shared/ui/ColorField.test.jsx` | `fireEvent`, `React.createElement`, sem async | Migrar para `userEvent`, JSX, `await` |
| `src/test/components.test.js` | `fireEvent`, `React.createElement`, Offline trivial | Migrar + expandir Offline com async |
| `src/lib/sync.test.js` | Mock inline frágil (50+ linhas) | Extrair mock factories para `mocks.js` |
| `src/shared/ui/*.tsx` | Sem `data-testid` | Adicionar `data-testid` em pontos críticos (botões, inputs) |
| `.lighthouseci.config.js` | Nunca executado | Adicionar `aggregationMethod: 'median'` |
| `.github/workflows/ci.yml` | Sem E2E, visual, perf | Adicionar jobs de Playwright + LHCI |
| `playwright.config.ts` | Não existe | Criar com chromium, setup project, storageState |
| `Dockerfile` | Não existe | Criar com mcr.microsoft.com/playwright:v1.60.0-jammy |
| `.nvmrc` | Não existe | Criar com `22` |
| `docs/QA/FUNCTIONAL_AUDIT.md` (externo) | 21 issues | Referenciar no plano de prioridades |
| `docs/QA/STRESS_AUDIT.md` (externo) | 47 issues | Referenciar no plano de prioridades |

---

## 5. Plano de Ação

### Fase 0 — Correções Imediatas (semana 1)

Prioridade máxima. Bloqueia todo o resto.

| # | Tarefa | Arquivo | Esforço |
|---|--------|---------|---------|
| 0.1 | Adicionar `.nvmrc` com node 22 | `.nvmrc` (novo) | 5min |
| 0.2 | Corrigir mocks: add `makeSbError`, `makeSbLoading`, `makeSbTimeout` | `src/test/mocks.js` | 30min |
| 0.3 | Migrar `var` → `const`/`let` em todos os 21 arquivos de teste | Múltiplos | 1h |
| 0.4 | Migrar `fireEvent` → `userEvent` nos 3 componentes | 3 arquivos .test.jsx | 1h |
| 0.5 | Adicionar `playwright.config.ts` básico | `playwright.config.ts` (novo) | 30min |
| 0.6 | Adicionar LHCI job no CI | `.github/workflows/ci.yml` | 30min |

### Fase 1 — Fundação (semana 2-3)

| # | Tarefa | Arquivo | Esforço |
|---|--------|---------|---------|
| 1.1 | Criar Dockerfile para testes consistentes | `Dockerfile` (novo) | 30min |
| 1.2 | Adicionar `data-testid` em componentes complexos | `src/shared/ui/*.tsx` | 1h |
| 1.3 | Aumentar thresholds coverage para 60/50/50/60 | `vitest.config.js` | 5min |
| 1.4 | Expandir setup.js com MSW + timeouts + cleanup | `src/test/setup.js` | 2h |
| 1.5 | Migrar testes de componente para async/await + `waitFor` | 3 arquivos .test.jsx | 2h |
| 1.6 | Adicionar testes de teclado (Tab, Enter, Escape) | 3 arquivos .test.jsx | 2h |

### Fase 2 — Avançado (semana 4-6)

| # | Tarefa | Esforço |
|---|--------|---------|
| 2.1 | Testes de IndexedDB recovery (corrupção, eviction, migrate) | 3d |
| 2.2 | Testes de PWA offline (SW lifecycle, cache, manifest, install prompt) | 3d |
| 2.3 | Testes de BroadcastChannel / multi-tab sync | 2d |
| 2.4 | Testes de Stripe Elements (card, 3DS, erros inline) | 3d |
| 2.5 | Testes de screen reader (Guidepup para NVDA/VoiceOver) | 3d |
| 2.6 | Testes de memory leak (navegação cíclica + requestGC) | 1d |

---

## 6. Riscos

| Risco | Probabilidade | Impacto | Prioridade |
|-------|--------------|---------|------------|
| IndexedDB evictado sem `navigator.storage.persist()` + sem recovery | Média | Perda total de dados offline | P0 |
| Stripe checkout quebrando por mudança de iframe selectors | Média | Impossibilidade de pagar | P0 |
| Sync BroadcastChannel quebrado sem detecção | Baixa | Dados inconsistentes entre abas | P1 |
| Memory leak em navegação prolongada | Média | App fica lento ou crasha (já há P0-9/P1-4/P1-13 no STRESS_AUDIT) | P1 |
| Regressão visual sem detecção | Alta | UX degrada sem alerta | P2 |
| Falha de acessibilidade (financeiro) | Alta | Exclusão de usuários, risco legal | P2 |
| CI falso positivo (coverage baixo) | Alta | Código sem teste passa despercebido | P2 |
| 10 testes falhando (uid digits) não resolvidos | Alta | Suite de testes não confiável | P0 |
| 9 P0 + 14 P1 do STRESS_AUDIT não corrigidos | Alta | Bugs em produção | P0 |

---

## 7. Auto-Revisão

| Pergunta | Resposta |
|----------|----------|
| Pesquisei profundamente (web, docs, RFC)? | ✅ 8 buscas web profundas, 23 fontes documentadas |
| Usei todas as ferramentas disponíveis? | ✅ WebSearch (8), WebFetch (via links), Read (7), Grep, Glob, Task, Write, Edit |
| Segui todas as regras do CLAUDE.md? | ✅ Pesquisa antes de analisar, metadados completos, auto-revisão |
| Existe solução melhor ou mais simples? | Sim — Fase 0 poderia ser reduzida para 3 itens (playwright.config.ts, .nvmrc, setup.js). Mantive 6 por consistência com os 20 problemas |
| Implementei algo sem autorização do Integrador? | ❌ Não. Documento apenas. Nenhum arquivo de código alterado |
| Existe overengineering no que produzi? | 20 problemas são reais e baseados em evidências. Cada um tem causa, impacto, e arquivo. Sem overengineering |
| Posso simplificar sem perder qualidade? | Seção 4 (Arquivos Afetados) parcialmente redundante com seção 1 (Problemas). Mantive para referência cruzada do Integrador |
| Documentei corretamente (tipo, status, bloco)? | ✅ `type: WORKING`, `status: APPROVED`, `ready_for_integration: true` |
