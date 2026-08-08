# UI REFINEMENT PLAN — Consolidado
> Orquestrado pela Fase 1. Cada frente tem seu próprio arquivo em `docs/design/` (ver README.md).
> Fase 2: 10 agentes implementadores.

## 1. Ficha das frentes (mapa)

| # | Frente | Doc | Status |
|---|--------|-----|--------|
| 01 | Design tokens | `REFINE_01_DesignTokens.md` | ✅ 485 linhas, 3 P0 |
| 02 | Landing page | `REFINE_02_Landing.md` | ✅ 435 linhas, 3 P0 |
| 03 | App UI interno | `REFINE_03_AppUI.md` | ✅ 327 linhas, 3 P0 |
| 04 | Motion | `REFINE_04_Motion.md` | ✅ 463 linhas, 3 P0 |
| 05 | Performance real | `REFINE_05_Performance.md` | ✅ 478 linhas, 3 P0 |
| 06 | Data viz | `REFINE_06_DataViz.md` | ✅ 424 linhas, 3 P0 |
| 07 | Mobile/PWA | `REFINE_07_MobilePWA.md` | ✅ 457 linhas, 3 P0 |
| 08 | Brand & identity | `REFINE_08_Brand.md` | ✅ 551 linhas, 3 P0 |
| 09 | Acessibilidade | `REFINE_09_A11y.md` | ✅ 470 linhas, 3 P0 |
| 10 | Pricing & planos | `REFINE_10_Pricing.md` | ✅ 365 linhas, 3 P0 |

## 2. Resumo dos 3 P0 priorizados

### P0-1: Tokens de série + zerar hex hardcoded
- `REFINE_01_DesignTokens.md` → token system completo (OKLCH, semânticos, dimensões, elevação, motion, focus)
- P0-2: Neutrales cromáticos em OKLCH ancorados na marca
- P0-3: Derivados `--brand` + `color-mix()` + focus ring token alinhado ao WCAG 2.4.13

### P0-2: Landing page CRO premium
- `REFINE_02_Landing.md` → hero com CRO, copy pt-BR, prova social, preload LCP
- P0-3: Hero visual real preloadado (LCP) substituindo mockup

### P0-3: App UI interno premium
- `REFINE_03_AppUI.md` → Dashboard, TxView, Reports, Clients, Plans, Settings
- P0-1: Empty state unificado + progresso real do onboarding
- P0-2: Remover hex hardcoded (D007)
- P0-3: Command palette usando `--brand` (white-label)

### P0-4: Motion tokens, View Transitions API + skeleton shimmer
- `REFINE_04_Motion.md` → tokens de animação, transições de rota, micro-interações por componente
- P0-1: View Transitions API na rota (CSS + JS)
- P0-2: Tokenizar motion (easing, dur, fade)
- P0-3: Skeleton shimmer transform-only + gate reduced-motion

### P0-5: Performance real e percebida
- `REFINE_05_Performance.md` → LCP/INP/CLS, bundle, fontes, PWA cache, budgets
- P0-1: Font load strategies (subset, preload, swap)
- P0-2: Route-level code split (React.lazy + manualChunks)
- P0-3: PWA cache strategies + prefetch pós-idle

### P0-6: Data viz (Sparklines, MoneyText, bar chart SVG)
- `REFINE_06_DataViz.md` → Sparkline SVG zero-dep, MoneyText tabular-nums, BarChartSVG flexível
- P0-1: Sparkline SVG zero-dep no KPICard+forecast (padrão Mercury balance+trend)
- P0-2: BarChartSVG flexível ao período + CLS + tooltip + eixo Y (G1/G7/G10)

### P0-7: Mobile/PWA app-like feel
- `REFINE_07_MobilePWA.md` → 100dvh/svh (Rx view scroll), safe-area (100dvh), offline real fetch, PWA install por engajamento
- P0-1: 100dvh/100svh (TxView:317, ReportView:209, Landing:100, PrivacyPolicy:43, TermsOfService:47)
- P0-2: Offline real fetch-check + contador de pendências (Offline.jsx:16 App.jsx:156)
- P0-3: Install por engajamento + iOS hint (pwa.js:122-168 InstallButton.jsx:14-17)

### P0-8: Brand & identidade visual
- `REFINE_08_Brand.md` → Logo system unificado, ícones canônicos, empty states de marca
- P0-1: Logo system vivo (unificar geometria em logoUtils.js)
- P0-2: Sistema de ícones canônico (18 SVG grid, stroke 1.5-2.5)
- P0-3: Empty states de marca (Northbase: "Create your first…")

### P0-9: Acessibilidade premium
- `REFINE_09_A11y.md` → WCAG 2.2 AA com estética premium
- P0-1: Toast aria-live=polite fix (4.1.3)
- P0-2: Focus-visible vs dynamic brand color 3:1 garantia
- P0-3: BottomNav role=tablist/tab semântico
- P0-4: CommandPalette/PhoneInput combobox completude
- P0-5: 280px reflow-safe grid

### P0-10: Pricing & planos premium
- `REFINE_10_Pricing.md` → Toggle anual/mensal, comparação ARIA table, proration + garantia
- P0-1: Toggle anual/mensal — default annual (15-20% ARPU)
- P0-2: Feature comparison matrix ARIA table
- P0-3: Trust architecture + proration preview (garantia 7d)

## 3. Implementação Fase 2
1. Executar os 10 agentes de implementação (um frente)
2. Cada agente usa `docs/design/REFINE_XX_*.md` como guia
3. Commit + push — commit Conventional com descrição "feat(...)" — sem editar código de produção
4. Após cada agente, validar com `npm run validate:fast` (lint + typecheck + test)
5. Consolidar commits + push após cada frente, depois de todas terminarem

## 4. Checklist para agentes implementadores (Fase 2)
- Verificar que `docs/design/REFINE_XX_*.md` está atualizado
- Não criar pasta, não criar outros arquivos (só o doc atribuído)
- Não editar código de produção — apenas modificar `src/`
- Commitar no `main` (convenção) e não commitar a pasta docs/design/
- Validação local: `npm run validate:fast` e `npm run check`
- Repositório: `docs/design/` (só docs, nunca código de produção)

## 5. Restrições globais (do PROJETO)
- Offline-first: Dexie é a fonte local; sync Supabase — nunca quebrar
- `--brand` dinâmico por usuário (white-label) — tokens devem conviver com isso
- WCAG 2.2 AA (audit atual ~45%, P1 já fechado; não regredir)
- D008: motion via CSS + useScrollReveal; SEM GSAP
- pt-BR na UI; perfil de máquina do dev é fraco (validações pesadas delegadas)
- Bundle enxuto: nada de libs gordas no main; preferir SVG inline, CSS custom