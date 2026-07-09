# MASTER REFACTOR V2 — Plano Mestre de Refatoração Arquitetural

> Gerado em: 2026-07-08
> Método: Auditoria paralela (6 agentes) + consolidação manual contra código real + banco real + dependências instaladas
> Premissa: **código é a única fonte da verdade**. Todo plano é validado contra o estado real do projeto, não contra documentação aspiracional.

---

## Sumário

1. [Estado Atual (Diagnóstico Consolidado)](#1-estado-atual-diagnóstico-consolidado)
2. [Arquitetura Desejada](#2-arquitetura-desejada)
3. [Problemas Encontrados por Domínio](#3-problemas-encontrados-por-domínio)
4. [Prioridades e Riscos](#4-prioridades-e-riscos)
5. [Roadmap de Execução (Fases 0–8)](#5-roadmap-de-execução-fases-0-8)
6. [Estratégia de Migração](#6-estratégia-de-migração)
7. [Critérios de Aceite](#7-critérios-de-aceite)
8. [Glossário de Decisões](#8-glossário-de-decisões)

---

## 1. Estado Atual (Diagnóstico Consolidado)

### Stack Real (verificada em package.json + código)

| Camada | Tecnologia | Versão | Status |
|--------|-----------|--------|--------|
| Frontend | React + Vite | 18.3 + 5.4 | ✅ Produção |
| Estilos | Tailwind CSS | 3.4 | ✅ Produção |
| Roteamento | react-router-dom | 7.18.1 | ✅ Instalado (substituiu hash manual) |
| Server State | @tanstack/react-query | 5.101.2 | ✅ Provider injetado (Phase 10) |
| Ícones | lucide-react | 1.23.0 | ✅ Instalado (29MB — candidato a tree-shake) |
| Offline | Dexie.js | 3.2.7 | ✅ Core da arquitetura |
| Backend | Supabase (Postgres + Auth + RLS) | 17 | ✅ Produção |
| Pagamentos | Stripe | — | ✅ Edge Functions + Elements |
| Testes | Vitest + Testing Library | 4.1 | ✅ 1113 testes |
| CI | GitHub Actions | — | ✅ APK + EXE builds |
| Desktop | Electron | 31 | ✅ main.cjs |
| TypeScript | — | — | ❌ Projeto 100% JS (infra instalada na Phase 10) |
| PWA Service Worker | vite-plugin-pwa | — | ❌ Faltando instalar (Phase 10 incompleta) |

### Estrutura de Diretórios Real (src/)

```
src/
├── App.jsx              ← Controller principal (327 linhas, 14 useState, 8 useCallback, 6 useEffect)
├── main.jsx             ← Entry point
├── test/                ← Testes (16 arquivos)
├── ai/                  ← Cliente AI
├── features/            ← 42+ arquivos organizados por domínio (auth, branding, transactions, inventory, ...)
│   ├── admin/           (3 arquivos)
│   ├── auth/            (4 arquivos)
│   ├── branding/        (16 arquivos)
│   ├── dashboard/       (1 arquivo)
│   ├── email/           (1 arquivo)
│   ├── inventory/       (4 arquivos)
│   ├── landing/         (3 arquivos)
│   ├── plans/           (1 arquivo)
│   ├── reports/         (1 arquivo)
│   ├── settings/        (1 arquivo)
│   └── transactions/    (3 arquivos)
├── shared/              ← Componentes compartilhados
├── context/             ← Contextos React
├── lib/                 ← 19 arquivos (core: db.js, crud.js, utils.js, supabase.js, auth.js, constants.js...)
└── hooks/               ← 14 hooks (useSession, useTx, useProducts, useLosses...)
```

**Nota crítica**: O projeto já tem `src/features/` com 42+ arquivos, mas o código legado ainda está espalhado em `src/hooks/`, `src/lib/`, `src/brandStudio/`, `src/views/`, `src/components/`. É um estado híbrido de migração parcial para feature-first.

### Estado da Dívida Técnica (Métricas Consolidadas)

| Métrica | Valor | Classificação |
|---------|-------|---------------|
| Linhas totais frontend | ~18.000 | Médio |
| Arquivos frontend | ~100 | Médio |
| `var` em vez de `const/let` | ~50 ocorrências (branding) | Crítico (contra regras do projeto) |
| Arquivos > 300 linhas | App.jsx, utils.js (2408!), db.js, useSession.js | Alto |
| Dependências não usadas | lucide-react (29MB) — verificar uso real | Médio |
| Dependências faltando | vite-plugin-pwa | Crítico |
| Componentes vazios | components/ui/ (scaffold) | Baixo |
| Error Boundaries | Zero | Crítico |
| Cobertura de views testadas | 0% | Alto |
| TypeScript | 0% | Alto |

---

## 2. Arquitetura Desejada

### Padrão Feature-First (já iniciado — concluir migração)

```
src/
├── features/                    ← Cada domínio é auto-contido
│   ├── auth/                    (login, session, impersonation)
│   ├── transactions/            (CRUD, view, testes)
│   ├── inventory/               (produtos + perdas)
│   ├── dashboard/               (visão geral)
│   ├── reports/                 (relatórios)
│   ├── settings/                (configurações + branding simplificado)
│   ├── admin/                   (painel admin)
│   ├── plans/                   (assinaturas)
│   ├── branding/                (simplificado: remover AI layer, eventos sazonais)
│   └── landing/                 (páginas públicas)
├── shared/                      ← Componentes reutilizáveis (Button, Card, Modal, etc)
│   ├── ui/                      (componentes de UI puros)
│   └── layout/                  (Sidebar, Header, BottomNav, Layout)
├── core/                        ← Infraestrutura (db, sync, supabase, constants)
│   ├── db/                      (dexie schema + sync engine)
│   ├── api/                     (supabase client + stripe client)
│   └── utils/                   (formatadores, validadores)
├── routes/                      ← Roteamento centralizado (React Router v7)
└── test/                        ← Testes globais + mocks
```

### Stack Alvo

| Componente | Atual | Alvo | Motivo |
|-----------|-------|------|--------|
| Roteamento | Hash manual | React Router v7 | ✅ Já instalado — migrar views |
| Server State | useState manual | TanStack Query | ✅ Já instalado — migrar hooks dados |
| State local | useState | useReducer (complexo) | Settings, form state |
| TypeScript | 0% | ~30% (críticos primeiro) | Infra já pronta |
| Error Boundaries | 0 | 3 níveis (global, rota, widget) | Segurança UX |
| PWA | vite-plugin-pwa faltando | Instalar + configurar | Offline-first quebrado |
| BrandStudio | 16+ arquivos | 4-5 arquivos (essenciais) | Reduzir ~70% do branding |
| Utils.js | 2408 linhas | Quebrar em ~5 módulos | Manutenibilidade |

---

## 3. Problemas Encontrados por Domínio

### 3.1 Frontend Architecture

| # | Problema | Localização | Severidade | Origem |
|---|---------|-------------|-----------|--------|
| F1 | App.jsx god component (327 linhas) | src/App.jsx | Alta | Auditoria Frontend |
| F2 | Zero Error Boundaries | Projeto inteiro | Crítica | Auditoria Frontend |
| F3 | components/ui/ scaffold vazio | src/components/ui/ | Baixa | Auditoria Frontend |
| F4 | components/examples/ scaffold vazio | src/components/examples/ | Baixa | Auditoria Frontend |
| F5 | Navegação: Sidebar + BottomNav + Header sem teste | src/shared/ | Média | Auditoria Frontend |
| F6 | barrel files ausentes | Múltiplos dirs | Média | Auditoria Frontend |
| F7 | PropTypes ausentes em componentes compartilhados | Vários | Média | Auditoria Frontend |
| F8 | brandStudio duplicado (dir raiz vs features/) | src/brandStudio/ + src/features/branding/ | Alta | Auditoria Frontend |

### 3.2 Backend & Database

| # | Problema | Localização | Severidade | Origem |
|---|---------|-------------|-----------|--------|
| B1 | ai_cache sem RLS | supabase/migrations/ | Crítica | Auditoria Backend |
| B2 | Migration drift (drop/cria tabelas em migrações diferentes) | supabase/migrations/ | Alta | Auditoria Backend |
| B3 | Orphan edge function: create-payment sem referência | supabase/functions/create-payment/ | Média | Auditoria Backend |
| B4 | Funções SECURITY DEFINER expostas | Várias RPCs | Alta | Auditoria Backend |
| B5 | RLS policy permissiva em company_profiles (admin pode editar qualquer coluna) | Migrations | Média | Auditoria Backend |
| B6 | Edge Function `list-clients` sem paginação | supabase/functions/admin-list-clients/ | Média | Auditoria Backend |
| B7 | Magic link hardcoded com domínio render.com | Migration SQL | Média | AUDIT_REVIEW.md |

### 3.3 Branding / Overengineering

| # | Problema | Localização | Severidade | Origem |
|---|---------|-------------|-----------|--------|
| R1 | AI Compatibility Layer (nunca usado em produção) | features/branding/aiCompatibilityLayer.js | Alta | Auditoria Branding |
| R2 | Schema Registry com plugin system (zero plugins adicionais) | features/branding/schemaRegistry.js | Alta | Auditoria Branding |
| R3 | Eventos sazonais sem UI ou usuário (7 eventos) | features/branding/eventsManager.js | Média | Auditoria Branding |
| R4 | Normalizador V1→V2 (V1 nunca existiu) | features/branding/normalizer.js | Média | Auditoria Branding |
| R5 | Três sistemas de schema concorrentes | schema.js + schemaRegistry.js + validateBrandConfig.js | Crítica | Auditoria Branding |
| R6 | `var` em vez de `const/let` em branding | Todos arquivos branding | Alta | Auditoria Branding |
| R7 | useBrandStudio (262 linhas) superdimensionado | features/branding/useBrandStudio.js | Alta | Auditoria Branding |
| R8 | Duplicação validação: validateBrandConfig (180 linhas) ~ schemaRegistry.validateAgainstModules | 2 arquivos | Média | Auditoria Branding |

### 3.4 Performance

| # | Problema | Localização | Severidade | Origem |
|---|---------|-------------|-----------|--------|
| P1 | vite-plugin-pwa ausente (service worker não gera) | package.json | Crítica | Auditoria Performance |
| P2 | lucide-react 29MB — verificar tree-shaking | package.json | Alta | Auditoria Performance |
| P3 | manualChunks ausente no rollupOptions | vite.config.js | Média | Auditoria Performance |
| P4 | fake-indexeddb em production deps | package.json | Média | Auditoria Performance |
| P5 | Bundle analysis configurada mas nunca rodada | scripts/ | Média | Auditoria Performance |
| P6 | Todas libs major desatualizadas (eslint 9.7, postcss, etc) | package.json | Média | Auditoria Performance |
| P7 | React.memo ausente em componentes de lista | Vários | Baixa | Auditoria Performance |
| P8 | Font Awesome vs lucide-react — duas libs de ícones | package.json? | Média | Auditoria Performance |

### 3.5 UX / Design System

| # | Problema | Localização | Severidade | Origem |
|---|---------|-------------|-----------|--------|
| U1 | components/ui/ scaffold vazio (prometido no design system) | src/components/ui/ | Média | Auditoria UX |
| U2 | design-system/ tem 5 CSS mas sem documentação de uso | src/design-system/ | Baixa | Auditoria UX |
| U3 | Variáveis CSS definidas em 2 lugares (index.css + design-system) | 2 arquivos | Média | Auditoria UX |
| U4 | Acessibilidade: form labels ausentes em SettingsView | features/settings/SettingsView.jsx | Alta | Auditoria UX |
| U5 | Estados de loading inconsistentes entre views | Várias views | Média | Auditoria UX |
| U6 | Empty state ausente em InventoryView, TxView | 2 views | Média | Auditoria UX |
| U7 | PhoneInput sem teste + comportamento quebra com formatação falha | components/PhoneInput.jsx | Média | Auditoria UX |
| U8 | Toast system sem animação de saída | src/shared/Toast.jsx | Baixa | Auditoria UX |

### 3.6 Segurança

| # | Problema | Localização | Severidade | Origem |
|---|---------|-------------|-----------|--------|
| S1 | ai_cache sem RLS | supabase/migrations/ | Crítica | Auditoria Backend |
| S2 | Token GitHub em localStorage (build APK) | lib/db.js (triggerApkBuild) | Alta | AUDIT_REVIEW.md |
| S3 | Magic link hardcoded com domínio | Migration SQL | Média | AUDIT_REVIEW.md |
| S4 | triggerApkBuild rate limit só no cliente | lib/db.js | Média | AUDIT_REVIEW.md |
| S5 | auth.js sem teste (operações críticas de segurança) | lib/auth.js | Alta | AUDIT_REVIEW.md |
| S6 | Impersonation tokens em localStorage com TTL 60s | lib/auth.js | Baixa | Auditoria Backend |
| S7 | brand_config double-serialization risco | responseProcessor.js | Baixa | AUDIT_REVIEW.md |

### 3.7 Documentação

| # | Problema | Localização | Severidade | Origem |
|---|---------|-------------|-----------|--------|
| D1 | 18 arquivos .md para projeto pequeno | docs/ | Alta | Auditoria Docs |
| D2 | .cursorrules + AI_CONTEXT.md + CLAUDE.md duplicados (3 fontes de regras) | Raiz + docs/ | Crítica | Auditoria Docs |
| D3 | MASTER.md cita Zustand (não existe) | docs/ARCHITECTURE/MASTER.md | Crítica | Auditoria Docs |
| D4 | MASTER.md + ARCHITECTURE.md + FRONTEND.md conflitam | docs/ARCHITECTURE/ | Alta | Auditoria Docs |
| D5 | docs/ai/ com 6 arquivos (excesso para o escopo) | docs/ai/ | Média | Auditoria Docs |
| D6 | Nenhum doc menciona que features/ já existe | Vários | Alta | Auditoria Docs |
| D7 | docs/TEMPLATES/ — templates genéricos sem uso | docs/TEMPLATES/ | Baixa | Auditoria Docs |

### 3.8 Testes

| # | Problema | Localização | Severidade | Origem |
|---|---------|-------------|-----------|--------|
| T1 | Views sem teste (Dashboard, TxView, SettingsView, etc) | src/features/*/ | Alta | Auditoria Frontend |
| T2 | auth.js sem teste | lib/auth.js | Alta | AUDIT_REVIEW.md |
| T3 | PhoneInput sem teste | components/PhoneInput.jsx | Média | AUDIT_REVIEW.md |
| T4 | Sidebar, BottomNav, Header sem teste | shared/ | Média | AUDIT_REVIEW.md |
| T5 | Testes de integração (fluxo completo) ausentes | — | Alta | Auditoria Frontend |
| T6 | MSW ou mocks de API ausentes | — | Alta | Auditoria Frontend |
| T7 | db.test.js tem base boa mas sem teste de conflito real | lib/db.test.js | Média | Auditoria Frontend |
| T8 | fake-indexeddb em production (deveria ser devDependency) | package.json | Média | Auditoria Frontend |

---

## 4. Prioridades e Riscos

### Matriz de Priorização

| Prioridade | Critério | Qtd | Exemplos |
|-----------|----------|-----|----------|
| **P0** | Quebra funcionalidade em produção ou segurança crítica | 3 | P1 (PWA), B1 (ai_cache RLS), F2 (Error Boundaries) |
| **P1** | Impede evolução ou causa dívida técnica severa | 8 | F1 (App.jsx), R5 (3 schemas), P2 (lucide-react), S2 (token GH) |
| **P2** | Qualidade de código e manutenibilidade | 14 | R6-R8 (branding simplificável), U4-U6 (UX), D1-D4 (docs), T1-T4 (testes) |
| **P3** | Cosméticos e melhorias futuras | 8 | F3-F4 (scaffolds vazios), U8 (toast), D7 (templates) |

### Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Remover código branding quebra white-label de cliente | Baixa | Crítico | Validar com testes + revisão manual antes de remover |
| Schema drift entre branches | Média | Alto | Sincronizar migrations antes de iniciar refatoração |
| React Router v7 migration quebra navegação existente | Média | Crítico | Manter fallback hash router durante migração |
| Remover código duplicado (brandStudio/) quebra imports | Alta | Alto | Grep completo de imports antes de deletar |
| Testes existentes quebram com refatoração | Média | Alto | CI deve rodar `npm test` a cada PR |
| vite-plugin-pwa com config errada quebra PWA | Média | Alto | Testar em staging antes de produção |

---

## 5. Roadmap de Execução (Fases 0–8)

### Fase 0: 📋 Plano + Backup (1 dia)
**Objetivo**: Garantir baseline seguro antes de qualquer alteração

- [ ] 0.1 Backup completo do projeto (git tag + branch)
- [ ] 0.2 Rodar `npm test` — confirmar 1113/1113 ✅
- [ ] 0.3 Rodar `npm run lint` — documentar warnings atuais
- [ ] 0.4 Rodar `npm run build` — confirmar build limpo ✅
- [ ] 0.5 Criar branch `refactor/v2-f0-backup`

**Critério de aceite**: git tag `pre-refactor-v2`, todos os checks verdes

---

### Fase 1: 🔧 Correções Críticas (P0) (2-3 dias)
**Objetivo**: Tapar buracos que afetam produção ou segurança

- [ ] 1.1 Instalar `vite-plugin-pwa` e configurar service worker
- [ ] 1.2 Adicionar RLS na tabela `ai_cache` (migration + policy)
- [ ] 1.3 Implementar Error Boundaries (3 níveis: global, rota, widget)
- [ ] 1.4 Mover `fake-indexeddb` de dependencies → devDependencies
- [ ] 1.5 Remover token GitHub de localStorage (mover para backend proxy)

**Critério de aceite**: `npm run build` gera service worker; RLS testado; erro em qualquer view mostra fallback UI, não tela branca

---

### Fase 2: 🧹 Limpeza de Dead Code (P1) (2 dias)
**Objetivo**: Remover código sem uso, scaffolds, duplicatas

- [ ] 2.1 Deletar `src/brandStudio/` (duplicado de `src/features/branding/`), remapear imports do App.jsx
- [ ] 2.2 Remover `src/components/ui/` e `src/components/examples/` (scaffolds vazios)
- [ ] 2.3 Deletar `src/views/` e `src/hooks/` — conteúdo já migrado para `src/features/`
- [ ] 2.4 Verificar e remover ocorrências `var` → `const/let` em branding
- [ ] 2.5 Verificar uso real de lucide-react em todo o projeto; tree-shake se parcial
- [ ] 2.6 Remover Font Awesome se presente (manter apenas lucide-react)

**Critério de aceite**: `npm test` passa; `npm run build` passa; nenhum import quebrado

---

### Fase 3: 🏗️ Simplificação Branding (P1-P2) (3 dias)
**Objetivo**: Reduzir complexidade do branding sem perder funcionalidade white-label

- [ ] 3.1 Remover AI Compatibility Layer (`aiCompatibilityLayer.js`)
- [ ] 3.2 Remover Schema Registry + plugin system (manter schema.js simplificado)
- [ ] 3.3 Remover eventos sazonais (`eventsManager.js`)
- [ ] 3.4 Remover normalizador V1→V2
- [ ] 3.5 Unificar validação: manter validateBrandConfig.js, remover schemaRegistry.validateAgainstModules
- [ ] 3.6 Simplificar useBrandStudio (262 → ~100 linhas)
- [ ] 3.7 Unificar 3 schemas em 1 schema.js (~150 linhas)
- [ ] 3.8 Verificar barrel files (index.js) existentes e criar onde faltar

**Critério de aceite**: White-label continua funcional; teste de brandConfig existente passa; redução de ~70% do código branding; schema único

---

### Fase 4: 🔄 Refatoração App.jsx + Roteamento (P1) (2 dias)
**Objetivo**: Extrair responsabilidades do god component; migrar para React Router v7

- [ ] 4.1 Extrair rotas para `src/routes/routes.jsx` (React Router v7)
- [ ] 4.2 Extrair providers para `src/core/providers.jsx` (QueryClient, Theme, etc)
- [ ] 4.3 Extrair boot sequence para `src/core/boot.js`
- [ ] 4.4 Transformar App.jsx em layout leve (apenas orchestration)
- [ ] 4.5 Migrar de hash routing manual para React Router v7
- [ ] 4.6 Garantir backward compatibility com URLs de hash existentes

**Critério de aceite**: Navegação funcionando com React Router v7; App.jsx < 100 linhas; npm test passa

---

### Fase 5: 📦 Performance + Bundle (P1-P2) (2 dias)
**Objetivo**: Otimizar bundle, configurar análises, atualizar dependências

- [ ] 5.1 Adicionar `manualChunks` no vite.config.js (vendor, features, shared)
- [ ] 5.2 Rodar `npm run analyze` — documentar baseline
- [ ] 5.3 Atualizar libs major desatualizadas (eslint, postcss, etc) com `npx npm-check-updates`
- [ ] 5.4 Verificar tree-shaking de lucide-react
- [ ] 5.5 Adicionar análise de pacotes ao CI

**Critério de aceite**: Bundle analysis mostra redução de chunk único; build passa; testes passam

---

### Fase 6: 🧪 Cobertura de Testes (P1-P2) (3 dias)
**Objetivo:** Elevar cobertura de áreas críticas

- [ ] 6.1 Testes para auth.js (login, logout, reset, impersonation)
- [ ] 6.2 Testes para Sidebar, BottomNav, Header (renderização + navegação)
- [ ] 6.3 Testes para PhoneInput
- [ ] 6.4 Teste de integração: fluxo login → carregar dados → sync
- [ ] 6.5 Adicionar MSW para mocks de API Supabase
- [ ] 6.6 Configurar `vitest --coverage` e estabelecer baseline

**Critério de aceite**: auth.js > 80% cobertura; componentes navegação > 80%; fluxo integração testado

---

### Fase 7: 📄 Documentação + Infra Dev (P2) (1 dia)
**Objetivo**: Limpar documentação, padronizar regras de IA, configurar ferramentas dev

- [ ] 7.1 Consolidar docs/ para estado real (eliminar duplicatas)
- [ ] 7.2 Remover `.cursorrules`, manter só `CLAUDE.md` (unificar com AI_CONTEXT.md)
- [ ] 7.3 Arquivar docs aspiracionais em `docs/archive/`
- [ ] 7.4 Remover `docs/TEMPLATES/`
- [ ] 7.5 Consolidar `docs/ai/` (6 arquivos → 1)
- [ ] 7.6 Verificar .env.example vs variáveis reais usadas
- [ ] 7.7 Adicionar README.md básico (ou atualizar existente)

**Critério de aceite**: Total de arquivos docs/ reduzido de 18 para < 8; nenhuma informação falsa; CLAUDE.md é fonte única

---

### Fase 8: 🎨 UX + Design System (P2-P3) (2 dias)
**Objetivo**: Melhorar consistência visual, acessibilidade, estados da UI

- [ ] 8.1 Implementar componentes básicos em `shared/ui/` (Button, Card, Input, Badge, Modal)
- [ ] 8.2 Adicionar form labels acessíveis em SettingsView
- [ ] 8.3 Adicionar empty states em InventoryView e TxView
- [ ] 8.4 Padronizar loading states entre views
- [ ] 8.5 Melhorar animação de saída do Toast
- [ ] 8.6 Revisar uso de variáveis CSS (index.css vs design-system/)
- [ ] 8.7 Audit acessibilidade rápida (contraste, tab order, aria-labels)

**Critério de aceite**: Lighthouse Accessibility ≥ 90; empty states visíveis; loading consistente

---

## 6. Estratégia de Migração

### Princípios

1. **Nunca quebrar o build**: Toda fase deve terminar com `npm test` + `npm run build` verdes
2. **Feature flags onde possível**: Usar variáveis de ambiente para ativar/desativar migrações
3. **Migração gradual**: Nada de big bang — cada fase é independente
4. **Backward compatibility**: React Router v7 convive com hash router durante migração
5. **Commits atômicos**: Cada mudança é um commit separado, não um monolito

### Ordem de Execução

```
Fase 0 (backup)
   ↓
Fase 1 (correções críticas) — P0
   ↓
Fase 2 (dead code) — P1
   ↓
Fase 3 (branding) — P1/P2
   ↓
Fase 4 (App.jsx + router) — P1
   ↓
Fase 5 (performance) — P1/P2
   ↓
Fase 6 (testes) — P1/P2
   ↓
Fase 7 (docs) — P2
   ↓
Fase 8 (UX) — P2/P3
```

### Rollback Plan

Se alguma fase quebrar produção:
1. `git revert <commit>` ou `git checkout <tag-pre-refactor>`
2. Diagnosticar causa no branch de refatoração
3. Repetir fase com correção

---

## 7. Critérios de Aceite

### Por Fase

| Fase | Comando de Verificação | Resultado Esperado |
|------|----------------------|-------------------|
| 0 | `npm test && npm run build` | 1113/1113, build OK |
| 1 | `npm test && npm run build` | Passa; service worker gerado em dist/ |
| 2 | `npm test && npm run lint` | 0 erros, warnings ≤ baseline |
| 3 | `npm test && grep -r "aiCompatibilityLayer" src/` | Sem ocorrências |
| 4 | `npm test && npm run dev` + navegar | Rotas React Router v7 funcionando |
| 5 | `npm run analyze` | Bundle report gerado sem erros |
| 6 | `npm test -- --coverage` | Cobertura > baseline documentado |
| 7 | `ls docs/*.md` | ≤ 8 arquivos na raiz docs/ |
| 8 | Lighthouse CI | Acc ≥ 90 |

### Globais

- `npm test` = 0 falhas (todos os 1113+ existentes + novos)
- `npm run lint` = 0 erros
- `npm run build` = sem warnings
- `npm run typecheck` = sem erros (quando TS for introduzido)
- Zero novas ocorrências de `var`
- App funciona offline (testar com DevTools offline mode)

---

## 8. Glossário de Decisões

### ADRs Registradas

| Decisão | Estado | Detalhes |
|---------|--------|----------|
| React Router v7 | **Decidido** | Substituir hash manual; mantendo fallback |
| TanStack Query | **Decidido** | Provider já injetado na Phase 10 |
| Branding simplificado | **Decidido** | Remover AI layer, eventos, schema triplicado |
| BrandStudio eliminado | **Decidido** | Manter só features/branding/ (simplificado) |
| TypeScript adiado | **Decidido** | Infra pronta; aplicar após refatoração JS estável |
| Error Boundaries | **Decidido** | 3 níveis (global, feature, widget) |
| lucide-react | **Pendente** | Verificar uso real vs tree-shaking |
| vite-plugin-pwa | **Pendente** | Instalar e configurar |
| fake-indexeddb | **Decidido** | Mover para devDependencies |
| components/ui/ | **Decidido** | Remover scaffold; implementar só shared/ui/ |

### Decisões que NÃO serão tomadas agora

| Decisão | Motivo |
|---------|--------|
| Migrar de Tailwind para CSS Modules | Complexidade sem benefício claro |
| Adicionar Zustand | TanStack Query + useState cobre necessidades |
| E2E Playwright | Adiar para após refatoração estrutural |
| Substituir Dexie por SQLite | Mudança de arquitetura muito arriscada |
| SSR/SSG | App offline-first não se beneficia de SSR |

---

## Apêndice A: Arquivos por Fase

### Fase 1 (P0)
- `package.json` — adicionar vite-plugin-pwa
- `vite.config.js` — configurar PWA
- `supabase/migrations/` — migration RLS ai_cache
- `src/shared/ErrorBoundary.jsx` — novo
- `src/App.jsx` — wrap com ErrorBoundary
- `src/lib/db.js` — remover token GitHub

### Fase 2 (Dead Code)
- Deletar: `src/brandStudio/`, `src/components/ui/`, `src/components/examples/`
- Deletar: `src/views/` (se vazio), `src/hooks/` (se migrado)
- Editar: `src/App.jsx` — remapear imports
- Editar: `src/features/branding/*` — `var` → `const/let`

### Fase 3 (Branding)
- Deletar: `features/branding/aiCompatibilityLayer.js`
- Deletar: `features/branding/eventsManager.js`
- Deletar: `features/branding/normalizer.js`
- Deletar: `features/branding/schemaRegistry.js`
- Manter/editar: `features/branding/schema.js` (unificado)
- Manter/editar: `features/branding/validateBrandConfig.js` (único validador)
- Editar: `features/branding/useBrandStudio.js` (simplificado)

### Fase 4 (App.jsx)
- `src/routes/routes.jsx` — novo (React Router v7 config)
- `src/core/providers.jsx` — novo (providers extraídos)
- `src/core/boot.js` — novo (boot sequence)
- `src/App.jsx` — edit (layout leve)

### Fase 5 (Performance)
- `vite.config.js` — adicionar manualChunks
- `package.json` — atualizar deps

### Fase 6 (Testes)
- `src/lib/auth.test.js` — novo
- `src/shared/Sidebar.test.jsx` — novo
- `src/shared/BottomNav.test.jsx` — novo
- `src/shared/Header.test.jsx` — novo
- `src/components/PhoneInput.test.jsx` — novo
- `src/test/integration/` — novos testes
- `vitest.config.js` — configurar coverage

### Fase 7 (Docs)
- Deletar/arquivar docs antigos
- Editar: `CLAUDE.md` — consolidar regras
- Deletar: `.cursorrules`

### Fase 8 (UX)
- `src/shared/ui/Button.jsx`, `Card.jsx`, `Input.jsx`, etc
- Editar: SettingsView (accessibility)
- Editar: InventoryView, TxView (empty states)

---

## Apêndice B: Baseline Atual

| Métrica | Valor | Data |
|---------|-------|------|
| Testes | 1113/1113 | 2026-07-08 |
| Lint errors | 0 | 2026-07-08 |
| Lint warnings | ~46 | 2026-07-08 |
| Build | OK | 2026-07-08 |
| Arquivos frontend | ~100 | 2026-07-08 |
| Arquivos docs/ | 18 | 2026-07-08 |
| Bundle size (main) | ~393KB | 2026-07-08 (estimado) |
