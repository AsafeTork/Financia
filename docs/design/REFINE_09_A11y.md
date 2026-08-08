# REFINE_09 — Acessibilidade Premium (design elevado, sem perder estilo)

> ⚠️ Preencher seguindo `docs/design/TEMPLATE.md` (seções 0-8, ≥300 linhas).

## Objetivo
Levar o app para WCAG 2.2 AA com estética alta (acessibilidade invisível): foco 3px visível com
tokens, contraste AA nas combinações novas, aria-live em loading/toasts/skeletons, keyboard
navigation em listas/abas/command palette, reduced-motion (já), touch ≥48px? (o projeto tem
min 44px — confirmar coberturas), zoom 200% sem quebra, screen reader na página de gráficos
(usage bar já virou table? verificar), label em todos inputs.

## Contexto
- `docs/UX/UX_UI_AUDIT_REPORT.md` (audit atual ~45% → P1 fechado; conferir avanços)
- `src/index.css` (--focus-ring já exist?), grep por `role=`, `aria-` em `src/features/` amostra
- `src/shared/ui/ui.jsx` (componentes comuns precisam de focus mgmt)
- e2e a11y specs: `e2e/` (glob) se houver

## Pesquisa obrigatória (≥10 buscas)
WCAG 2.2 AA checklist 2026 (focus appearance, target size, accessible authentication),
screen reader table vs SVG (aria), aria-live polite on toasts, keyboard navigation patterns,
color contrast tools (colorbrewer2? apca vs wcag), "premium accessible design" (formas de
acessibilidade bonita), multiple ways (keyboard shortcuts ⌘K já existe — a11y check),
reduced-motion media query.

## Retorno
`buscas=.., urls=.., lidos=.., doc_linhas=.. | top3 P0`