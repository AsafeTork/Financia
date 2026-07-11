---
type: WORKING
status: APPROVED
owner: Integrador
version: 2.0
reviewed_by: Integrador
ready_for_integration: true
last_review: 2026-07-11
dependencies: [WORKSPACE.md, EXECUTOR_PROMPT.md, EXECUTION_STATE.md, SCRATCH_PAD.md, VALIDATION_MODULE.md, CHECKPOINT_AUDITOR.md, CHANGELOG_AI.md]
next_review: 2026-07-18
---

# MASTER REFACTOR PLAN — Financia

> **⚠️ Nota sobre numeração:** Este documento originalmente usava "Fase 1-7" baseado em prioridade (P0, P1, P2, P3). Para eliminar conflito com o sistema de governança atual (WORKSPACE.md F1=Orquestração, F2=Banco, F3=Branding, etc.), todos os números foram renomeados para "Bloco 1-7". Consulte `docs/WORKSPACE.md` para o sistema oficial de fases.

**Gerado em:** 2026-07-10
**Última atualização:** 2026-07-11 (governança v2.1 — protocolo definitivo)
**Branch atual:** `main`
**Último merge:** `refactor/v2` (fabricações críticas, hardening, 1178 testes)
**Método:** Consolidação de 12+ documentos de auditoria + validação contra código real + banco real + Supabase MCP + pesquisa web comparativa

---

## 0. Protocolo de Governança v2.1 (DEFINITIVO)

Este plano agora opera sob o protocolo de governança v2.1 definido em `CLAUDE.md` e `EXECUTOR_PROMPT.md v2.1`:

- **Dois chats permanentes:** Integrador (governança) + Executor (implementação)
- **Subagentes temporários:** Criados dinamicamente pelo Executor
- **Checkpoint obrigatório:** Após cada subtarefa em `EXECUTION_STATE.md` + `SCRATCH_PAD.md`
- **Continuidade entre modelos:** Modelo Reserva (Nemotron) retoma do último checkpoint válido
- **Evidência obrigatória:** `git diff` + `npm run build` + `npm run lint` + `npm test` + `git diff --name-only`
- **Auditoria obrigatória:** `CHECKPOINT_AUDITOR.md` valida cada checkpoint
- **Registro imutável:** `CHANGELOG_AI.md` registra toda mudança
- **Estados do Integrador:** PESQUISA → IMPLEMENTANDO → VALIDADO (não existe "implementado" sem "validado")
- **Regra da Verdade Oficial:** Se documento tem `status: APPROVED` + `ready_for_integration: true` → FONTE OFICIAL DA VERDADE
- **Proibido:** Re-pesquisar, re-auditar, questionar, gerar novo plano sobre documentos APPROVED
- **Interrupções permitidas:** Apenas conflito APPROVED, perda de dados, impossibilidade técnica, mudança arquitetural, risco crítico de segurança

---

## 1. Documentos Consolidados

| Arquivo | Assunto | Data | Origem | Confiabilidade |
|---------|---------|------|--------|---------------|
| `docs/QA/FUNCTIONAL_AUDIT.md` | Auditoria funcional completa | 2026-07-09 | Especialista QA | Alta |
| `docs/QA/STRESS_AUDIT.md` | Estresse, segurança, performance, código | 2026-07-09 | Especialista Stress | Alta |
| `docs/INCIDENT_REPORT.md` | Bugs produção (RLS recursion + grants) | 2026-07-09 | Especialista Bug | Alta |
| `docs/FIX_REPORT.md` | Correção arquitetural aplicada | 2026-07-09 | Engenharia | Alta |
| `docs/PRODUCTION_REPORT.md` | Status produção v5.2.0 | 2026-07-09 | Engenharia | Alta |
| `docs/RELEASE_CHECKLIST.md` | Checklist release v5.1.0 | 2026-07-09 | Engenharia | Média (pré-fix) |
| `docs/ARCHITECTURE.md` | Manual técnico e arquitetura | Anterior | Engenharia | Média |
| `docs/UX-AUDIT-REFERENCE.md` | Referência de design patterns | 2026-07-10 | Especialista UX | Referência |
| `docs/archive/ARCHITECTURE/REALITY_AUDIT.md` | Auditoria de realidade vs docs | 2026-07-08 | Especialista | Média (1 erro crítico) |
| `docs/archive/ARCHITECTURE/AUDIT_REVIEW.md` | Validação da realidade audit | 2026-07-08 | Revisor | Média |
| `docs/archive/ARCHITECTURE/MASTER_REFACTOR_V2.md` | Plano de refatoração anterior | 2026-07-08 | Arquiteto | Parcialmente obsoleto |
| Validação ao vivo (10/07) | Código real + banco + Supabase | 2026-07-10 | Arquiteto-Chefe | Fonte única |

**Documentos descartados por obsolescência:**
- `docs/archive/ARCHITECTURE/MASTER.md` — informações falsas (Zustand)
- `docs/archive/ARCHITECTURE/PRODUCT_VISION.md` — descreve app diferente do real
- `docs/archive/ARCHITECTURE/FRONTEND.md`, `02_FRONTEND_ARCHITECTURE.md`, `03_BACKEND_ARCHITECTURE.md` — substituídos por `docs/ARCHITECTURE.md`
- `docs/archive/ai/*.md` — substituídos por `docs/ai/` atuais
- `docs/AI_CONTEXT.md` — deprecated (substituído por CLAUDE.md)

---

## 2. Estado Real do Projeto (Validado em 2026-07-11 — Sincronização Obrigatória)

### Stack Real

| Camada | Tecnologia | Versão | Status |
|--------|-----------|--------|--------|
| Frontend | React + Vite | 18.3 + 5.4 | ✅ Produção |
| Estilos | Tailwind CSS | 3.4 | ✅ Produção |
| Roteamento | React Router v7 | Instalado | ✅ Migrado do hash manual |
| Server State | @tanstack/react-query | Instalado | ✅ Provider injetado |
| Offline | Dexie.js | 3.2.7 | ✅ Core offline-first |
| Backend | Supabase (PG17 + Auth + RLS) | — | ✅ Produção |
| Pagamentos | Stripe | — | ✅ Edge Functions |
| Testes | Vitest | — | ✅ ~1178 testes |
| PWA | Service Worker manual | public/sw.js | ✅ Funcional (sem plugin) |
| TypeScript | — | — | ❌ 0% |
| CI/CD | GitHub Actions | — | ✅ APK + EXE |

### Fases Concluídas e Validadas

| Fase | Status | Descrição |
|------|--------|-----------|
| **Fase 1** | ✅ VALIDADA | Orquestração: WORKSPACE, CLAUDE, EXECUTOR_PROMPT v2.1, docs de execução |
| **Fase 2** | ✅ VALIDADA | Banco: 14 itens C1-C4, A1-A6, M1-M3, I1-I5 implementados |
| **Fase 3** | ⏳ PENDENTE | Branding: 12 itens P1-P12 aguardando implementação |
| **Fase 4** | ✅ VALIDADA | Frontend: ARIA, Error handling, Code-split, var→const, schemaRegistry simplificado |
| **Fase 5** | ⏳ PENDENTE | Supabase/Backend: Edge Functions, RLS hardening, Stripe AbortController, PWA cleanup |
| **Fase 6** | ⏳ PENDENTE | QA Implementação: Playwright, LHCI, data-testid, MSW, thresholds |
| **Fase 7** | ⏳ PENDENTE | Integração: bloqueada pelas Fases 3, 5, 6 |

### O que já foi concluído (do plano anterior)

| Item | Status | Fase Original |
|------|--------|--------------|
| App.jsx refatorado (333 linhas, React Router) | ✅ | Fase 4 |
| core/boot.js + core/providers.jsx + routes/routes.jsx | ✅ | Fase 4 |
| Error Boundaries (3 níveis: Global, Feature, Widget) | ✅ | Fase 1 |
| brandStudio/ deletado (raiz), mantido features/branding/ | ✅ | Fase 2 |
| components/ui/, components/examples/ deletados | ✅ | Fase 2 |
| views/ deletado (migrado para features/) | ✅ | Fase 2 |
| hooks/ deletado (migrado para shared/hooks/) | ✅ | Fase 2 |
| .cursorrules deletado | ✅ | Fase 7 |
| CSP unificada em index.html | ✅ | Fase 1 |
| sideEffects: false em package.json | ✅ | Fase 5 |
| manualChunks no vite.config.js | ✅ | Fase 5 |
| fake-indexeddb em devDependencies | ✅ | Fase 1 |
| lazy loading (Landing, Privacy, Terms) | ✅ | Fase 4 |
| Auth tests (auth.test.js) | ✅ | Fase 6 |
| nodemailer, playwright declarados | ✅ | Fase 1 |
| Database: RLS initplan fix, TO authenticated, indexes | ✅ | Fase 2 |
| ai_cache RLS enabled | ✅ | Fase 2 |
| Infinite recursion fix (company_profiles) | ✅ | Incidente |
| EXECUTE grants restaurados | ✅ | Incidente |
| Schema Registry + AI Layer + Events removidos do branding | ✅ | Fase 3 |

---

## 3. Pendências Validadas

### 🔴 P0 — Produção ou Segurança Crítica

| # | Issue | Arquivo | Risco | Origem |
|---|-------|---------|-------|--------|
| **P0-1** | GitHub token como parâmetro em `triggerApkBuild` | `src/lib/sync.js:179` | Comprometimento total do pipeline de build APK | STRESS_AUDIT P0-1 |
| **P0-2** | ~~Lint quebrado: parsing error em TxView.jsx:230~~ | ~~`src/features/transactions/TxView.jsx:229-230`~~ | ❌ **FALSO POSITIVO** — lint passa limpo (0 erros, 0 warnings). O código está correto. Provavelmente erro de ferramenta de auditoria que não considerou a sintaxe JSX válida | Descoberto 2026-07-10 |
| **P0-3** | ~~Bundle principal 432KB~~ | ~~Build output~~ | ❌ **JÁ RESOLVIDO** — após `manualChunks` + `sideEffects`, o maior chunk é `vendor` (179KB raw / 59KB gzip) e o principal `index` (145KB raw / 44KB gzip). Otimizações adicionais movidas para P2 | FUNCTIONAL_AUDIT |
| **P0-4** | HaveIBeenPwned desabilitado no Supabase Auth | Supabase settings | Senhas vazadas permitidas | Supabase Advisor |

### 🟡 P1 — Alto Impacto

| # | Issue | Arquivo | Risco | Origem | Status |
|---|-------|---------|-------|--------|--------|
| **P1-1** | Impersonação: senha exposta via `signInWithPassword` no network tab | `features/auth/useImpersonation.js:21` | Admin pode capturar senha via DevTools | STRESS_AUDIT P1-12 | ⏳ Pendente |
| **P1-2** | `var` em vez de `const/let` em auth.js | `src/lib/auth.js` (9 ocorrências) | Código inconsistente com padrão do projeto | FUNCTIONAL_AUDIT | ✅ **RESOLVIDO (Fase 4)** |
| **P1-3** | `var` em vez de `const/let` no branding (299 ocorrências) | `src/features/branding/*` (299 ocorrências) | Código inconsistente, risco de hoisting | REALITY_AUDIT | ⏳ Fase 3 |
| **P1-4** | `var` em App.jsx (~15 ocorrências) | `src/App.jsx` (linhas 42,43,44,47,66,69,78,82,85,91,101,213,218,234,282) | Código inconsistente | REALITY_AUDIT | ✅ **RESOLVIDO (Fase 4)** |
| **P1-5** | schemaRegistry.js com plugin system não utilizado | `src/features/branding/schemaRegistry.js` | Complexidade desnecessária, 0 plugins adicionais | MASTER_REFACTOR_V2 R2 | ✅ **RESOLVIDO (Fase 4)** |
| **P1-6** | useBrandStudio.js superdimensionado (262+ linhas) | `src/features/branding/useBrandStudio.js` | Manutenibilidade reduzida | MASTER_REFACTOR_V2 R7 | ⏳ Fase 3 |
| **P1-7** | D1: Perda registrada ANTES do ajuste de estoque | `features/inventory/InventoryView.jsx:98-101` | Inconsistência de estoque se ajuste falhar | FUNCTIONAL_AUDIT D1 | ⏳ Pendente |
| **P1-8** | D2: Match de produto por nome em vez de ID | `features/inventory/InventoryView.jsx:100` | Match errado em produtos similares | FUNCTIONAL_AUDIT D2 | ⏳ Pendente |
| **P1-9** | A11: Login sem gerenciamento de foco | `features/auth/Login.jsx` | Usuário de teclado perde posição | FUNCTIONAL_AUDIT A11 | ⏳ Pendente |
| **P1-10** | E1-E4: `.catch()` silenciosos em chamadas de API | PlansView, SettingsView, AdminPanel | Usuário sem feedback de erro | FUNCTIONAL_AUDIT E1-E4 | ✅ **RESOLVIDO (Fase 4)** |
| **P1-11** | AdminPanel N chamadas paralelas sem batch | `AdminPanel.jsx:65-77` | Rate limit no Supabase/Stripe | STRESS_AUDIT P1-14 | ⏳ Pendente |
| **P1-12** | `file.type` não validado em uploads (4 componentes) | ClientEditModal, ModuleEditor, BrandGlobalEditor, SettingsView | Upload de arquivos arbitrários | STRESS_AUDIT P1-3 | ⏳ Pendente |

### 🟠 P2 — Médio Impacto

| # | Issue | Arquivo | Risco | Origem | Status |
|---|-------|---------|-------|--------|--------|
| **P2-1** | ARIA: modais sem `role="dialog"` (A1) | `ClientEditModal.jsx:235` | Quebra screen readers | FUNCTIONAL_AUDIT A1 | ✅ **RESOLVIDO (Fase 4)** |
| **P2-2** | ARIA: virtual list sem `role="list"` (A2) | `TxView.jsx` | Screen readers não navegam | FUNCTIONAL_AUDIT A2 | ✅ **RESOLVIDO (Fase 4)** |
| **P2-3** | ARIA: abas Settings sem `role="tab"` (A3) | `SettingsView.jsx:198` | Falta padrão WAI-ARIA Tab | FUNCTIONAL_AUDIT A3 | ✅ **RESOLVIDO (Fase 4)** |
| **P2-4** | ARIA: botões login/signup sem `role="tab"` (A4) | `Login.jsx:176` | Falta aria-selected | FUNCTIONAL_AUDIT A4 | ✅ **RESOLVIDO (Fase 4)** |
| **P2-5** | ARIA: GoogleBtn sem `aria-label` (A5) | `Login.jsx:10` | Screen reader não identifica | FUNCTIONAL_AUDIT A5 | ✅ **RESOLVIDO (Fase 4)** |
| **P2-6** | ARIA: input busca sem `aria-label` (A6) | `AdminPanel.jsx:429` | Só placeholder | FUNCTIONAL_AUDIT A6 | ✅ **RESOLVIDO (Fase 4)** |
| **P2-7** | ARIA: gráfico SVG sem `role="img"` (A7) | `Dashboard.jsx:251` | Sem descrição para screen reader | FUNCTIONAL_AUDIT A7 | ✅ **RESOLVIDO (Fase 4)** |
| **P2-8** | ARIA: KPI cards sem `onKeyDown` (A8) | `Dashboard.jsx:191` | Inacessível por teclado | FUNCTIONAL_AUDIT A8 | ✅ **RESOLVIDO (Fase 4)** |
| **P2-9** | ARIA: botões collapse sem `aria-expanded` (A9) | `InventoryView.jsx:247` | Estado não anunciado | FUNCTIONAL_AUDIT A9 | ✅ **RESOLVIDO (Fase 4)** |
| **P2-10** | ARIA: indicador entrada/saída só por cor (A10) | `Dashboard.jsx:224,228` | Sem sr-only text | FUNCTIONAL_AUDIT A10 | ✅ **RESOLVIDO (Fase 4)** |
| **P2-11** | PWA: SW manual sem vite-plugin-pwa | `public/sw.js` + `vite.config.js` | Sem cache automático de assets, sem precaching | AUDIT_REVIEW | ⏳ Pendente |
| **P2-12** | AbortController ausente em Stripe checkout | Stripe checkout flow | Possível criação duplicada de setup intents | STRESS_AUDIT P2-14 | ⏳ Pendente |
| **P2-13** | setInterval em pwa.js sem cleanup adequado | `src/lib/pwa.js:83` | Polling infinito em HMR | STRESS_AUDIT P0-9 | ⏳ Pendente |
| **P2-14** | SECURITY DEFINER functions executáveis por authenticated (4) | Supabase RPCs | Risco aceito por design, mas deve ser documentado | Supabase Advisor | ⏳ Pendente |

### 🔵 P3 — Baixo Impacto / Cosméticos

| # | Issue | Risco | Origem |
|---|-------|-------|--------|
| **P3-1** | 45 lint warnings (unused vars) | Código mais difícil de ler | FUNCTIONAL_AUDIT L1 |
| **P3-2** | Índices não utilizados (4) | Overhead mínimo | Supabase Advisor |
| **P3-3** | Components/Layout sem teste | Sidebar, BottomNav, Header | AUDIT_REVIEW |
| **P3-4** | auth.js sem teste completo | auth.test.js existe mas incompleto? | AUDIT_REVIEW |
| **P3-5** | Design tokens em 2 lugares (index.css + design-system/) | Inconsistência potencial | MASTER_REFACTOR_V2 U3 |
| **P3-6** | Documentação archive com 8+ arquivos obsoletos | Confusão para novos devs | REALITY_AUDIT |

---

## 4. Matriz de Priorização (Atualizada 2026-07-11)

```
Prioridade  Critério                                Qtd (Pendentes)
─────────────────────────────────────────────────────────
P0          Quebra produção ou segurança crítica      2 (P0-1, P0-4)
P1          Impacto usuário, integridade, segurança   8 (P1-1, P1-2, P1-3, P1-4, P1-5, P1-6, P1-7, P1-8, P1-9, P1-11, P1-12) — 2 resolvidos
P2          Acessibilidade, UX, código                4 (P2-11, P2-12, P2-13, P2-14) — 10 resolvidos
P3          Cosméticos, boas práticas                 6
             Total                                     20 (ativos)
```

---

## 5. Roadmap de Execução (Blocos por Prioridade)

### Bloco 1: 🔧 Correções Críticas (P0)

**Objetivo:** Resolver bloqueios de produção e segurança

| Item | Arquivos | Ação | Dependências |
|------|----------|------|-------------|
| 1.1 GitHub token | `src/lib/sync.js:179` | Criar Edge Function `/v1/build-trigger` que proxy o GitHub API com token armazenado como `supabase secrets set GITHUB_TOKEN`; frontend chama Edge Function autenticada (anon key + JWT). Workaround imediato: `sessionStorage` em vez de localStorage+parâmetro URL | Nenhuma |
| ~~1.2 Lint error TxView~~ | ~~`src/features/transactions/TxView.jsx:229-230`~~ | **FALSO POSITIVO** — lint passa limpo. Nenhuma ação necessária | N/A |
| ~~1.3 Bundle 432KB~~ | ~~`vite.config.js`~~ | **JÁ RESOLVIDO** — `manualChunks` e `sideEffects` já aplicados no refactor/v2. Chunk principal 145KB (raw), vendor 179KB. Nenhuma ação P0 necessária | N/A |
| 1.4 HaveIBeenPwned | Supabase Auth settings | Ativar no painel (requer Pro) | Upgrade de plano |

**Impacto:** 2 issues (P0-2 falso positivo, P0-3 já resolvido) | **Risco:** Baixo (mudanças localizadas) | **Duração:** 0.5 dia | **Critério de aceite:** `npm run lint` 0 erros; `npm test` passa; nenhum token no client-side; Edge Function existente; build OK (29 chunks, nenhum > 200KB)

---

### Bloco 2: 🔒 Segurança (P1)

**Objetivo:** Fechar vetores de ataque conhecidos

| Item | Arquivos | Ação |
|------|----------|------|
| 2.1 Impersonação senha | `features/auth/useImpersonation.js:21` | Usar `setSession()` em vez de `signInWithPassword` |
| 2.2 Upload MIME validation | 4 componentes | Adicionar whitelist de `file.type` |
| 2.3 D1: Ordem saveLoss | `InventoryView.jsx:98-101` | Mover `addLoss` para depois de `adjustStock` |
| 2.4 D2: Match por ID | `InventoryView.jsx:100` | Usar product.id em vez de `name.toLowerCase()` |
| 2.5 A11: Foco Login | `Login.jsx` | Adicionar `useRef` + `focus()` |

**Impacto:** 5 issues | **Risco:** Baixo | **Duração:** 1 dia | **Dependências:** Fase 1 | **Critério de aceite:** Nenhuma senha no network tab; uploads validados; estoque consistente

---

### Bloco 3: 🧹 Limpeza de Código (P1)

**Objetivo:** Padronizar código, remover `var`, simplificar branding

| Item | Arquivos | Ação |
|------|----------|------|
| 3.1 `var` → `const/let` | `src/lib/auth.js` | 9 ocorrências |
| 3.2 `var` → `const/let` | `src/features/branding/*` | 299 ocorrências |
| 3.3 `var` → `const/let` | `src/App.jsx` | ~15 ocorrências |
| 3.4 schemaRegistry simplificação | `src/features/branding/schemaRegistry.js` | Remover plugin system (registerModule) |
| 3.5 useBrandStudio simplificação | `src/features/branding/useBrandStudio.js` | Reduzir de 262+ linhas para ~100 |

**Impacto:** 5 issues | **Risco:** Médio (299 ocorrências em branding) | **Duração:** 2 dias | **Dependências:** Bloco 2 | **Critério de aceite:** `npm test` passa; nenhuma ocorrência de `var` em src/; lint passa

---

### Bloco 4: ♿ Acessibilidade (P2)

**Objetivo:** WCAG AA compliance

| Item | Arquivos | Ação |
|------|----------|------|
| 4.1 ARIA modais (A1) | `ClientEditModal.jsx:235` | `role="dialog"`, `aria-modal`, `aria-labelledby` |
| 4.2 ARIA virtual list (A2) | `TxView.jsx` | `role="list"`, `aria-setsize`, `aria-posinset` |
| 4.3 ARIA tabs (A3) | `SettingsView.jsx:198` | WAI-ARIA Tab pattern |
| 4.4 ARIA login tabs (A4) | `Login.jsx:176` | `role="tab"`, `aria-selected` |
| 4.5 ARIA GoogleBtn (A5) | `Login.jsx:10` | `aria-label="Entrar com Google"` |
| 4.6 ARIA busca (A6) | `AdminPanel.jsx:429` | `aria-label` |
| 4.7 ARIA gráfico (A7) | `Dashboard.jsx:251` | `role="img"` + aria-label |
| 4.8 ARIA KPI (A8) | `Dashboard.jsx:191` | `onKeyDown` + `tabIndex` |
| 4.9 ARIA collapse (A9) | `InventoryView.jsx:247` | `aria-expanded` |
| 4.10 ARIA indicador (A10) | `Dashboard.jsx:224,228` | Texto `sr-only` |

**Impacto:** 10 issues | **Risco:** Baixo | **Duração:** 1 dia | **Dependências:** Fase 3 | **Critério de aceite:** Lighthouse Accessibility ≥ 95; tab navigation funcional

---

### Bloco 5: 🎯 Tratamento de Erros (P1)

**Objetivo:** Eliminar catch silenciosos, adicionar feedback

| Item | Arquivos | Ação |
|------|----------|------|
| 5.1 E1: PlansView | `PlansView.jsx:231` | Propagar erro ou mostrar toast |
| 5.2 E2: SettingsView | `SettingsView.jsx:60,77` | Feedback de erro |
| 5.3 E3: AdminPanel | `AdminPanel.jsx:59` | `.catch()` no Promise.all |
| 5.4 E4: subscription-status | `AdminPanel.jsx:69-74` | Batch com delay + AbortController |
| 5.5 PWA setInterval | `src/lib/pwa.js:83` | Cleanup adequado no HMR |
| 5.6 AbortController Stripe | Stripe checkout flow | Usar `AbortController` nas chamadas |

**Impacto:** 6 issues | **Risco:** Baixo | **Duração:** 1 dia | **Dependências:** Fase 2 | **Critério de aceite:** Nenhum `.catch()` vazio no código; todos erros mostram feedback na UI

---

### Bloco 6: 📦 Performance (P0-P1)

**Objetivo:** Otimizar bundle e PWA

| Item | Ação |
|------|------|
| 6.1 Code-split adicional | Adicionar `dynamic import()` para componentes grandes (TxView, Dashboard charts) |
| 6.2 Análise de bundle | Rodar `npm run analyze` com `rollup-plugin-visualizer`, documentar baseline |
| 6.3 Tree-shaking de ícones | Verificar uso real de lucide-react |
| 6.4 Verificar pacotes não utilizados | `depcheck` |
| 6.5 PWA: investigar migração para vite-plugin-pwa | `injectManifest` strategy para manter `public/sw.js` lógica existente + build integration; ~0.13KB bundle impact, SW 10-15KB |

**Impacto:** 5 issues | **Risco:** Médio | **Duração:** 1 dia | **Dependências:** Fase 1 | **Critério de aceite:** Nenhum chunk > 200KB (gzip < 60KB); bundle analysis documentada; PWA build integrado

---

### Bloco 7: 📋 Documentação (P3)

**Objetivo:** Limpar archive, consolidar docs

| Item | Ação |
|------|------|
| 7.1 Arquivar docs obsoletos | Mover para `docs/archive/` o que resta |
| 7.2 Consolidar design tokens | Unificar `index.css` e `design-system/` |
| 7.3 Atualizar CHANGELOG | Registrar todas as fases |

**Impacto:** 3 issues | **Risco:** Baixo | **Duração:** 0.5 dia | **Dependências:** Nenhuma | **Critério de aceite:** Nenhum doc obsoleto fora de archive/

---

## 6. Estratégia de Execução

### Ordem (Governança Fases — F1 a F7)
```
Fase 1 — Orquestração (✅ VALIDADA)
    ↓
Fase 2 — Banco (✅ VALIDADA)
Fase 4 — Frontend (✅ VALIDADA)
    ↓
Fase 3 — Branding (12 itens P1-P12) ← PRÓXIMA
    ↓
Fase 5 — Supabase/Backend (Edge Functions, RLS, Stripe, PWA)
    ↓
Fase 6 — QA Implementação (Playwright, LHCI, MSW, thresholds)
    ↓
Fase 7 — Integração
```

> **Nota:** Fases 5 e 6 podem rodar em paralelo após Fase 3 validada. Fase 7 bloqueada até F3, F5, F6 concluídas.
> **Blocos (prioridade):** Bloco 1-7 referem-se a pacotes de trabalho por prioridade (P0-P3), não às fases de governança.

### Validações obrigatórias após cada fase
1. `npm test` (Vitest)
2. `npm run lint` (ESLint)
3. `npm run build` (Vite)
4. Auditoria funcional (verificação manual de fluxos)
5. Auditoria de console (0 erros inesperados)
6. Auditoria de rede (0 HTTP 4xx/5xx inesperados)
7. Auditoria de acessibilidade (Tab nav, contraste)

### Rollback
Se alguma fase quebrar produção: `git revert <commit>` + diagnosticar no branch

---

## 7. Baseline Atual (Reconciliado 2026-07-11)

| Métrica | Valor | Data |
|---------|-------|------|
| Testes | 612 pass / 28 fail (640 total, 112s) | 2026-07-11 |
| Lint errors | 1 (null char em src/lib/utils.js:207) | 2026-07-11 |
| Lint warnings | 14 (unused vars em testes) | 2026-07-11 |
| Build | ❌ FAILED (null char em src/lib/utils.js:207) | 2026-07-11 |
| Main chunk | 145 KB (gzip 44 KB) — último build OK conhecido | 2026-07-11 |
| Supabase Advisor WARN | 5 (4 SECDEF + 1 HIBP) | 2026-07-10 |
| Supabase Advisor INFO | 5 (unused indexes) | 2026-07-10 |
| `var` em src/ | ~30 ocorrências (resolvido Fase 4: auth.js, App.jsx; branding 299 pendente) | 2026-07-11 |
| ARIA issues | 0 (resolvido Fase 4) | 2026-07-11 |
| Error handling issues | 0 (resolvido Fase 4) | 2026-07-11 |
| Documentos docs/ | 33 ativos + 12 archive = 45 total | 2026-07-11 |

---

## 8. Riscos Residuais (não bloqueantes)

1. **Electron 31** — 7 vulnerabilidades HIGH (requer breaking upgrade para 43.x)
2. **4 SECURITY DEFINER functions executáveis por `authenticated`** — Aceito por design, cada função tem gate interno de admin
3. **TypeScript 0%** — Decisão adiada; infraestrutura pronta mas não ativada
4. **E2E tests** — Ainda não implementados (fora do escopo desta refatoração)

---

## 9. Research Notes (2026-07-10)

Pesquisas web realizadas para validação do plano:

### Code Splitting (Vite)
- Route-based splitting = maior impacto com menor esforço
- Split only componentes >50KB que estejam fora da rota crítica
- Vendor chunks devem ser agrupados por frequência de mudança (React ecossistema junto)
- Target: 50-500KB por chunk (gzip)
- Sempre medir com bundle visualizer antes/depois
- Fonte: vitejs.dev/guide/build.html#chunking-strategy

### GitHub Token Security
- Token NUNCA deve estar em localStorage ou client-side
- Mover para Edge Function com `service_role` ou secret armazenada via `supabase secrets set`
- Frontend → Edge Function (JWT protegida) → GitHub API
- Fonte: supabase.com/docs/guides/functions/secrets

### PWA: vite-plugin-pwa vs Manual SW
- Manual SW atual funciona mas sem: cache automático de build assets, dev mode support, update prompt
- vite-plugin-pwa com `injectManifest` strategy = melhor dos dois mundos
- Impacto bundle: ~0.13KB (main) + 10-15KB (SW context separado)
- Fonte: v3.vite-plugin-pwa.netlify.app/guide/inject-manifest

### Error Boundaries (react-error-boundary)
- 3 níveis atuais (Global, Feature, Widget) confirmados como best practice
- `react-error-boundary` oferece hook `useErrorHandler` para error recovery
- ResetKeys e fallback granular por domínio
- Fonte: npmjs.com/package/react-error-boundary

### Supabase RLS Performance
- `auth.uid()` vs `(SELECT auth.uid())` — diferença mínima em PG17
- `auth.uid()` é STABLE, avalia uma vez por statement
- Fonte: supabase.com/docs/guides/auth/row-level-security
- Advisor recomenda: ativar HaveIBeenPwned, documentar SECDEF functions
