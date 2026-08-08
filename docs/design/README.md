# DESIGN REFINEMENT — Mapa de Orquestração

> Produzido pela orquestração: **Fase 1 (pesquisa) → Fase 2 (implementação)**.
> Fase 1 = 10 agentes pesquisadores, 1 frente cada, 1 arquivo cada.
> **PROIBIDO**: qq agente criar pasta/arquivo além do arquivo que lhe foi atribuído.
> A estrutura, o template e os cabeçalhos já existem — o agente apenas o preenche.

## As 10 frentes (uma por agente, um arquivo por frente)

| # | Frente | Arquivo (já criado) | Skill recom. | Escopo |
|---|--------|---------------------|--------------|--------|
| 1 | Design tokens & fundações | `docs/design/REFINE_01_DesignTokens.md` | design-dna-pack | tokens, tipografia, cor (OKLCH), elevação, motion, dark mode, brand dinâmica |
| 2 | Landing page & marketing | `docs/design/REFINE_02_Landing.md` | frontend-craft | hero, seções, copy pt-BR, CRO, trust, pricing page |
| 3 | App UI interno (pós-login) | `docs/design/REFINE_03_AppUI.md` | frontend-craft | Dashboard, TxView, Reports, Clients, Plans, Settings |
| 4 | Motion & micro-interações | `docs/design/REFINE_04_Motion.md` | motion-pack | tokens motion, transições de rota, micro-UX, haptics |
| 5 | Performance real & percebida | `docs/design/REFINE_05_Performance.md` | — | LCP/INP/CLS, bundle, fontes, PWA cache, budgets |
| 6 | Data visualization | `docs/design/REFINE_06_DataViz.md` | design-dna-pack | gráficos, money shçon, tabelas, report storytelling |
| 7 | Mobile/PWA app-like feel | `docs/design/REFINE_07_MobilePWA.md` | frontend-craft | gestos, bottom nav, PWA install, offline UX |
| 8 | Brand & identidade visual | `docs/design/REFINE_08_Brand.md` | visual-generation | identidade, ícones, ilustração, dark mode, logo system |
| 9 | Acessibilidade premium | `docs/design/REFINE_09_A11y.md` | code-intent | WCAG 2.2 AA aplicado com estética alta |
| 10 | Pricing & planos | `docs/design/REFINE_10_Pricing.md` | frontend-craft | pricing table, planos Stripe, comparação, toggles |

## Protocolo de dedicação (obrigatório p/ fase 1 e 2)

Todo agente (pesquisador ou implementador) DEVE:

1. **Não confiar em memória.** Nenhuma afirmação sem fonte rastreável:
   - código → `file:linha` lido nesta sessão;
   - mercado/tendência → URL real acessada nesta sessão.
2. **Coletar antes de escrever**: mín. 10 buscas web (websearch, inglês+pt-BR, vigência 2025-2026), mín. 5 URLs abertas de verdade (webfetch/ctx_fetch_and_index), mín. 5 arquivos do repo lidos integralmente nos pontos relevantes.
3. **Log de coleta** no final do doc: tabela `# | tipo (busca/fetch/leitura) | alvo | o que provê`.
4. **Relação métricas** no retorno final ao orquestrador (≤ 6 linhas):
   `buscas=.., urls=.., lidos=.., doc_linhas=.. | top3-P0 (1 frase cada)`.
5. **NUNCA colar** o documento no retorno — apenas as métricas.

## Entregável da Fase 1

10 arquivos `.md` preenchidos (→ o orquestrador consolida em `PLANO_REFINAMENTO.md`).
Depois a Fase 2: 10 agentes implementadores usam os docs para alterar `src/` com commits por frente.

## Restrições globais do produto (não negociar)

- Offline-first: Dexie é a fonte local; sync Supabase não pode quebrar.
- `--brand` é dinâmico por usuário (white-label) — tokens devem conviver.
- WCAG 2.2 AA (audit atual ~45% → P1 do plano já fechado; não regressar).
- D008: motion via CSS + hooks leves; SEM GSAP/JS pesadas.
- pt-BR na UI; perfil de máquina do dev é fraco (validações pesadas delegadas).
- Bundle enxuto: nada de libs gordas no main; preferir SVG inline, CSS custom.