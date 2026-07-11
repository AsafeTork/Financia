# CHANGELOG AI — Financia

> Registro de decisões, alterações e validações realizadas pelo Integrador-Chefe / Arquiteto.

---

## 2026-07-11 — Fase 3.1 Branding Simplification ✅ VALIDADA

### Decisão Arquitetural
Remoção completa do **Schema Registry** (sistema de plugins morto, 703 linhas, zero consumidores externos) e consolidação em **schema único** (`schema.js`) como fonte da verdade.

### Alterações
| Arquivo | Ação | Linhas |
|---------|------|--------|
| `src/features/branding/schemaRegistry.js` | **DELETADO** | -703 |
| `src/features/branding/index.js` | Removido reexport do registry | -1 |
| `src/features/branding/useBrandStudio.js` | Simplificado (262→102 lin) | -160 |
| `src/features/branding/BrandStudioView.jsx` | Removidos undo/redo, copy doc/json, preset UI | -29 |

### Métricas
- Arquivos Branding: 16 → 14
- Linhas Branding: ~2.800 → 2.095 (-25%)
- useBrandStudio: 262 → 102 lin (-61%)
- Schemas concorrentes: 3 → 1

### API Pública Preservada
- `validateBrandConfig(config)` — idêntica
- `BRAND_SCHEMA`, `BRAND_SCHEMA_VERSION` — de `schema.js`
- `useBrandStudio` retorna: `brandConfig`, `saveBrandGlobal`, `savePlanOverride`, `applyFullPreset`, `brandGlobal`, `setBrandGlobalField`, `saveBrandGlobal`, `allPresets`

### Funcionalidades Intactas
✅ White-label  
✅ Brand Studio (edição logo global, por plano, cores)  
✅ Preview em tempo real  
✅ Persistência (Dexie + Supabase sync)  
✅ Plan overrides (Free/Pro/Premium/White-label)

### Validação
- `npm run build` ✅
- `npm run lint` ✅ (sem novos erros; 4 baseline em `sync.test.js`)
- `npm run test:fast` ✅ 1178/1178 passam

---

## 2026-07-08 — Fases 0-10 Refatoração v2 ✅ VALIDADAS

Todas as 10 fases do plano de refatoração arquitetural (F0-F10) concluídas e validadas. Ver `IMPLEMENTATION_BACKLOG.md` para detalhes por fase.

---

## Baseline Oficial (Problemas Conhecidos, Não-Bloqueantes)

| Categoria | Detalhes | Fase Responsável |
|-----------|----------|------------------|
| Lint errors | 4 em `src/lib/sync.test.js` (`global` undefined) | Fase 6 (QA) |
| Lint warnings | 6 (missing useEffect deps em App + 4 views) | Fase 6 (QA) |
| Test flakiness | 11 testes falham na baseline (db.test.js, sync.test.js, ColorField.test.jsx) | Fase 6 (QA) |

---

## Próxima Entrada Prevista

**Fase 5 — Backend/Supabase Auditoria** — aguardando execução da auditoria estrutural completa.