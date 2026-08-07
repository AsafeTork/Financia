---
type: REFERENCE
last_updated: 2026-08-06
source: websearch (multi-agent AI 2026) + Financia WORKSPACE.md backlog
---

# Mapeamento Backlog Financia → Agentes Especialistas

> Baseado em pesquisa web 2026 (Anthropic, Stripe Minions, LangGraph, CrewAI, DevNote, Technerdo, InfoQ) + backlog atual em `docs/WORKSPACE.md`.

## Resumo dos Padrões 2026 (pesquisa web)

| Padrão | Quando usar | Fonte |
|--------|-------------|-------|
| **Parallel Multi-Agent** | Tarefas independentes simultâneas (ex: analisar performance + UX + segurança) | Redis Blog, DevNote |
| **Hierarchical** | Tarefas complexas longas: manager → team leads → workers | DevNote |
| **Reflection/Self-Critique** | Qualidade de código, revisão adversarial | DevNote, Technerdo |
| **Agent in the Loop** | First-pass implementer → human review → feedback → merge | Technerdo |
| **Plan-Execute** | Separa planejamento da execução; bom para migrações, refactors | AgentBrisk |
| **ReAct** | Tool-heavy workflows com adaptação dinâmica | Redis Blog |
| **Swarm** | Muitos workers paralelos coordenados | Hive Mind, OpenCode |

---

## Mapeamento Backlog P0 (Performance Crítica)

| # | Tarefa Backlog | Agente(s) Recomendado(s) | Padrão | Justificativa |
|---|----------------|--------------------------|--------|---------------|
| 1 | Mover `syncAll` para Web Worker | **Dev Backend** + **DevOps** | Parallel | Isolar sync pesado do main thread; DevOps para worker config |
| 2 | Índices compostos Dexie | **Especialista Banco** | Plan-Execute | Análise de queries → planejar índices → executar → benchmark |
| 3 | Intervalo sync adaptativo + backoff | **Dev Backend** | ReAct | Loop adaptativo com tool-use (medir latência, ajustar) |
| 4 | `useTransition` no TxView | **Dev Frontend** + **UX/UI** | Parallel | Frontend implementa; UX valida percepção |

**Agentes paralelos sugeridos para P0**: 2-3 simultâneos (Backend + Banco podem rodar junto; Frontend + UX junto)

---

## Mapeamento Backlog P1 (WCAG 2.2 AA - ~45% hoje)

| # | Tarefa Backlog | Agente(s) Recomendado(s) | Padrão | Justificativa |
|---|----------------|--------------------------|--------|---------------|
| 5 | Touch targets ≥ 44×44px | **UX/UI** + **Dev Frontend** | Agent in Loop | UX audita + especifica; Frontend implementa; UX valida |
| 6 | Contraste 4.5:1 brand colors | **UX/UI** | Reflection | Auditoria automatizada + revisão visual |
| 7 | `<table>` alternativa gráficos | **Dev Frontend** + **Acessibilidade** | Plan-Execute | Planejar estrutura semântica → implementar → testar screen reader |
| 8 | `role="listitem"` TxView | **Dev Frontend** | ReAct | Implementação incremental com testes |
| 9 | Headline metric dashboard | **UX/UI** + **Analista Produto** | Hierarchical | UX define KPI; Produto valida negócio; Frontend implementa |
| 10 | Sticky headers data | **Dev Frontend** | Parallel | CSS position: sticky - implementação direta |

**Agentes paralelos sugeridos para P1**: UX/UI central + 2-3 Frontend simultâneos

---

## Mapeamento Backlog P2 (Bundle & LCP)

| # | Tarefa Backlog | Agente(s) Recomendado(s) | Padrão | Justificativa |
|---|----------------|--------------------------|--------|---------------|
| 11 | Otimizar `manualChunks` + Terser | **DevOps** + **Performance** | Reflection | Bundle analyzer → identificar → otimizar → medir |
| 12 | `vite-plugin-pwa` injectManifest | **DevOps** | Plan-Execute | Configuração PWA complexa → testar offline |
| 13 | Preload LCP + critical CSS | **Performance** + **Dev Frontend** | Parallel | Análise LCP → otimizações críticas |
| 14 | Upgrade Dexie 3.x → 4.x | **Especialista Banco** + **Dev Backend** | Plan-Execute | Migração breaking changes → testes regressão |

---

## Mapeamento Backlog P3 (Polish / Diferenciais)

| # | Tarefa Backlog | Agente(s) Recomendado(s) | Padrão | Justificativa |
|---|----------------|--------------------------|--------|---------------|
| Onboarding wizard | **UX/UI** + **Dev Frontend** | Hierarchical | UX define fluxo (um campo/tela); Frontend implementa |
| FAB quick capture | **UX/UI** + **Dev Frontend** | Parallel | Cobertura telas → implementação |
| Focus rings 3px / card-padding / dark mode gráficos | **UX/UI** + **Dev Frontend** | Parallel | Design system tokens → aplicação consistente |
| Pull-to-refresh / swipe / ⌘K / deep linking | **Dev Frontend** + **Dev Mobile** | Swarm | Muitas features paralelas independentes |
| WebAuthn/passkey | **Especialista Segurança** + **Dev Backend** | Plan-Execute | Segurança crítica → revisão adversarial obrigatória |
| Logo assets SVG/favicon/app-icon | **Designer** + **DevOps** | Agent in Loop | Designer cria; DevOps integra build |
| `scheduler.yield` useMemo longos | **Performance** + **Dev Frontend** | ReAct | Medir → otimizar → re-medir |
| Background Sync / LHCI budgets CI | **DevOps** + **Performance** | Parallel | CI config + budgets |
| Leaked password protection Supabase | **Especialista Segurança** | Reflection | Configuração dashboard + validação |

---

## Tipos de Agente Disponíveis (conforme prompt CEO + AGENTS.md)

| Tipo | Domínio | Modelo Recomendado |
|------|---------|-------------------|
| **Arquiteto Software** | Decisões arquiteturais, ADR, trade-offs | DeepInfra GLM-5.2 / Kimi-K3 |
| **Dev Backend** | Edge Functions, Supabase, sync, API | DeepInfra DeepSeek-V3.2 / North-mini-code-free |
| **Dev Frontend** | React, Vite, Tailwind, PWA, charts | opencode/north-mini-code-free / DeepSeek-V4-Flash |
| **Especialista Banco** | Dexie, IndexedDB, RLS, migrations | DeepInfra DeepSeek-V3.2 |
| **Especialista IA** | Embeddings, RAG, agents, vector search | opencode/nemotron-3-ultra-free |
| **Especialista Segurança** | Auth, RLS, CSP, WebAuthn, threat model | DeepInfra GLM-5.2 (revisão adversarial) |
| **UX/UI** | WCAG, design system, motion, acessibilidade | opencode/longcat-2.0-free / DeepSeek-V4-Flash |
| **Especialista Testes** | Vitest, Playwright, coverage, e2e | opencode/north-mini-code-free |
| **Especialista DevOps** | CI/CD, Render, Docker, bundle, LHCI | opencode/deepseek-v4-flash-free |
| **Auditor Código** | Code review, anti-patterns, security audit | DeepInfra GLM-5.2 (revisão adversarial) |
| **Pesquisador Mercado** | Concorrência, tendências, monetização | opencode/ling-3.0-flash-free |
| **Analista Monetização** | Pricing, Stripe, freemium, conversion | DeepInfra DeepSeek-V3.2 |

---

## Orquestração Recomendada por Fase

### Fase 1: P0 Performance (2-3 semanas)
```
Semana 1: Parallel [Dev Backend (sync worker) + Especialista Banco (índices)]
Semana 2: Parallel [Dev Backend (sync adaptativo) + Dev Frontend (useTransition)]
Semana 3: Integração + Validação [Arquiteto + Auditor]
```

### Fase 2: P1 Acessibilidade (3-4 semanas)
```
Semana 1-2: UX/UI (auditoria completa WCAG) → especificação
Semana 2-3: Parallel [Dev Frontend (touch targets, sticky, listitem) × 3]
Semana 3-4: UX/UI valida + Dev Frontend (contraste, tabela gráficos, headline)
```

### Fase 3: P2 Bundle (2 semanas)
```
Semana 1: DevOps (manualChunks, PWA, preload)
Semana 2: Especialista Banco (Dexie 4.x) + Performance (LHCI)
```

### Fase 4: P3 Polish (contínuo, paralelo)
```
WebAuthn: Especialista Segurança (revisão adversarial obrigatória)
Onboarding/FAB: UX/UI + Dev Frontend (paralelo)
Assets logo: Designer → DevOps
Background Sync: DevOps
```

---

## Regras de Engajamento (conforme AGENTS.md + CEO Prompt)

1. **Subagentes efêmeros** - responsabilidade única; não herdam contexto
2. **Prompt autossuficiente** - incluir: objetivo, arquivos, restrições, formato retorno
3. **Revisão adversarial obrigatória** para: auth, pagamento, RLS, migrations, WebAuthn
4. **Paralelizar** tarefas independentes (máx 3-4 simultâneos p/ custo)
5. **Modelo certo**: Zen grátis (opencode/*) para execução; DeepInfra para arquitetura/segurança/revisão
6. **Evidência** = diff + validação + resumo; sem evidência não existe
7. **Git = checkpoint** - Conventional Commits; commit só quando usuário pedir
8. **WORKSPACE.md** atualizado ao concluir fase

---

## Próximos Passos Imediatos

1. **Criar issue GitHub** com este mapeamento para tracking
2. **Iniciar Fase 1 P0** - spawn agentes paralelos:
   - `Dev Backend`: syncAll → Web Worker
   - `Especialista Banco`: índices compostos Dexie
3. **Configurar LHCI budgets** no CI (DevOps) - pode rodar em paralelo
4. **Auditoria WCAG completa** (UX/UI) - base para Fase 2