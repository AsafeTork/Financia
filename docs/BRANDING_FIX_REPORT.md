---
type: REPORT
title: BRANDING_FIX_REPORT (Fase 9.8)
version: 1.0
date: 2026-08-01
owner: subagente branding-fix
status: entregue para revisao cruzada
---

# BRANDING FIX — Relatório de Implementação (Fase 9.8)

## 1. Escopo

Aplicar o plano de ação do documento APPROVED `docs/BRANDING_DIAGNOSTICO.md` (22 problemas). Verificação confirmou que a maior parte do plano já estava implementada e commitada em fases anteriores (P1–P9, P11–P13, §5, §6, §12). Esta execução fechou os itens remanescentes e validou a compatibilidade com os 162 testes de branding.

## 2. Itens implementados nesta execução

| # | Item | Arquivo | Mudança |
|---|------|---------|---------|
| 1 | P10 — `var` → `const` | `src/features/branding/responseProcessor.js` | `requiresServiceRole` (`var wl` → `const wl`); `updateBrandConfig` (`var res`, `var data` → `const`) |
| 2 | P10 — `var` → `const` | `src/shared/hooks/useBrandAppearance.js` | `useMemo appBrand`: `var next`/`var prev` → `const` (nenhum reatribuído — seguro) |
| 3 | P3 — default drift (logo) | `src/features/branding/BrandStudioView.jsx` | `doReset` usava cores hardcoded `{blue:'#002f59',...}`; agora usa `{...OFFICIAL_LOGO_COLORS}` de `defaults.js` (mesmos valores) |
| 4 | P3 — duplicação de constantes | `src/features/branding/PlanTabsEditor.jsx` | Removido `PLAN_META_LOCAL` (duplicava `PLAN_META` de `defaults.js`, incl. white_label com o mesmo icon); componente agora usa `PLAN_META` diretamente |

## 3. Estado consolidado do plano (fases anteriores + esta execução)

### Prioridade ALTA — 100%
1. **P1/P2 Schema unificado** — `schema.js` (flat) **deletado**; `schemaRegistry.js` refatorado (703→493 linhas) com `MODULE_DEFS` + `createModuleRegistry()`; formato único **modular** (`modules.*`); única validação: `validateAgainstModules`. `docs/AI_BRAND_SCHEMA.md` atualizado para formato modular.
2. **P3 Defaults centralizados** — `src/features/branding/defaults.js` criado com todas as constantes (paleta, tipografia, logo, sidebar, header, cards, buttons, inputs, borderRadius, shadows, spacing, animations, theme, planOverrides, PLAN_META, OFFICIAL_LOGO_COLORS, LOGO_ELEMENTS, CHECK_NORM, PLAN_PALETTE_DEFAULTS, CSS_VAR_DEFAULTS/LIST, DEFAULT_PALETTE_FIELDS, PALETTE_UI_FIELDS); as 6 fontes duplicadas agora importam de lá. **Última duplicata hardcoded removida nesta execução** (BrandStudioView doReset + PLAN_META_LOCAL).
3. **P6 Paleta unificada** — 17 campos de cor oficiais em `DEFAULT_PALETTE_FIELDS` (primary..borderMd + success/warning/danger/info); sincronizado: schema (`schemaRegistry MODULE_DEFS.palette` = 17 campos + mode), UI (`PALETTE_UI_FIELDS` em PlanTabsEditor), CSS vars (`useBrandAppearance` via `PALETTE_DEFAULTS`). `positive/negative/chart1-6` permanecem como leitura tolerante (opcionais) sem UI.
4. **P4/P5 Logo utilities** — `src/features/branding/logoUtils.js` criado (`generateLogoSvg`, `logoSvgToDataUrl`, `buildCheckPath`); BrandStudioView e LogoSchemes importam de lá; `ORIGINAL`/`ELEMENTS_CONFIG` duplicados removidos.

### Prioridade MÉDIA — 100%
5. **P7 Estado global mutável removido** — `_modules`/`_order` → closure `createModuleRegistry()`; `_userPresets`/`_onChange`/`_presetIdCounter` → closure `createPresetStore()`; `_savedPreviewTokens` → removido (refs de hook + aplicação direta via `collectTokensFromBrand`).
6. **P8 Validação no responseProcessor** — `processResponse` chama `mergeWithDefaults` + `validateAgainstModules` antes de aceitar proposta (rejeita JSON inválido com `step: 'validation'`).
7. **P12 Armazenamento unificado** — esquemas de logo migrados de `localStorage` para Dexie (`brand_logo_schemes`); `migrateLogoSchemesFromLocalStorage()` faz migração one-shot (único uso restante de localStorage é a migração).
8. **P9 Fallback CSS variables** — fallbacks explícitos `var(--x, #fallback)` adicionados em BrandStudioView, LogoSchemes, PreviewGeral, PlanTabsEditor (82+ ocorrências).
9. **P11 Editor white_label** — `PLAN_META` (defaults.js) inclui `white_label`; PlanTabsEditor renderiza aba White Label (P11 resolvido).
10. **P13 RLS awareness** — `requiresServiceRole` + `updateBrandConfig` (Edge Function `update-brand-config`) em `responseProcessor.js`; `useBrandManager` e `useBrandStudio` usam a detecção.
11. **§6 Código morto** — `copyPrompt`/`copyCurrentJSON` implementados em `useBrandStudio.js`; `presetCats` recalcula sob demanda; cleanup do preview mode preservado.

### Prioridade BAIXA — 100%
12. **P10** — `var`/`Object.assign` eliminados de TODO o código de produção da área de branding (verificado por grep; resta apenas em arquivos de teste e fora da área).
13. **P10.2 spread** — `Object.assign` → spread em schemaRegistry, presets, useBrandStudio, BrandStudioView, LogoSchemes, PlanTabsEditor, PreviewGeral.
14. **ORIGINAL_LOGO em defaults.js** — `OFFICIAL_LOGO_COLORS` + `LOGO_ELEMENTS` + `CHECK_NORM`; últimas referências hardcoded removidas nesta execução.

## 4. Auto-revisão — compatibilidade com os 162 testes

| Verificação | Resultado |
|---|---|
| `LogoSchemes.test.js` / `.test.jsx` / `logoUtils.test.js` | Importam de `logoUtils.js` e `defaults.js` — ambos exportam todos os nomes esperados (`generateLogoSvg`, `logoSvgToDataUrl`, `buildCheckPath`, `OFFICIAL_LOGO_COLORS`, `CHECK_NORM`) |
| `responseProcessor.test.js` | 19 testes — `processResponse` mantém assinatura, `brand_config` serializa `originalJson` (teste `toEqual`), `theme` usa `originalJson` não normalizado, `requiresServiceRole`/`updateBrandConfig` intactos (const não altera comportamento) |
| `presets.test.js` | 17 testes — API de `presets.js` preservada (`setOnChange`, `savePreset`, `getPreset`, ...); singleton de closure é resetado via `setOnChange(null)` no afterEach — comportamento idêntico |
| `components.test.jsx` | PlanTabsEditor: props `onSavePlan/onCopyJSON/onCopyDocs` inalteradas; aba free é a primeira (default `activePlan='free'`); `PALETTE_UI_FIELDS` inalterado |
| `accessibility.test.jsx` | BrandStudioView/LogoSchemes/PlanTabsEditor: `copyPrompt`/`copyCurrentJSON` agora existem no hook (antes undefined); LogoSchemes acessa Dexie dentro de try/catch — jsdom seguro |
| `useBrandAppearance.test.js` + `.extra.test.js` | `applyBrandVars`, `enterPreviewMode`, `exitPreviewMode` intactos; `collectTokensFromBrand` usa `PALETTE_DEFAULTS` de `defaults.js` (mesmos valores) |
| Formato salvo no banco | Inalterado — `brand_config` continua `{ schemaVersion, modules }`; merge/normalize preservam `logoColors`/`planOverrides` dentro de `modules` |
| Compatibilidade flat→modular | `mergeWithDefaults` + `useBrandAppearance` ainda leem `cfg.palette` OU `cfg.modules.palette` |

## 5. Validação

- `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` — **não executáveis neste ambiente** (Node.js removido, regra do CLAUDE.md). Validação via GitHub Actions (`ci.yml`): lint → typecheck → 162 testes → build, com upload de artefatos.
- Verificações locais realizadas: grep (zero `var`/`Object.assign` em produção branding), leitura completa dos 9 arquivos-alvo, leitura dos 7 arquivos de teste para confirmar compatibilidade de API.

## 6. Arquivos alterados nesta execução

- `src/features/branding/BrandStudioView.jsx` (1 linha)
- `src/features/branding/PlanTabsEditor.jsx` (removidas 8 linhas de duplicata)
- `src/features/branding/responseProcessor.js` (3 linhas)
- `src/shared/hooks/useBrandAppearance.js` (2 linhas)

## 7. Risco residual

- `schemaRegistry.js` mantém `registerModule`/`createRegistry` exportados (compatibilidade), embora nenhum consumidor externo exista — candidato a remoção futura, fora do escopo para preservar a API testada.
- `LogoSchemes.jsx` permanece na lista de ignores do ESLint (decisão de fases anteriores, preservada para não alterar escopo de lint).
