# RELATÓRIO DE OTIMIZAÇÃO DE VALIDAÇÃO — FINANCIA

**Versão:** 1.0  
**Data:** 2026-07-11  
**Owner:** Integrador  
**Status:** EM ANÁLISE  

---

## RESUMO EXECUTIVO

Este documento consolida gargalos atuais e otimizações recomendadas para reduzir drasticamente o tempo de validação do pipeline (lint → build → test → audit → integration).

**Tempo atual estimado por validação completa:** ~5-8 min  
**Meta:** < 2 min (redução 70%+)

---

## GARGALOS IDENTIFICADOS

### 1. TESTES (Vitest) — MAIOR GARGALO
| Métrica | Atual | Gargalo |
|---------|-------|---------|
| Tempo total | ~58s | CPU-bound + isolamento excessivo |
| Threads padrão | CPU-1 | Subutilização em CI 2-core |
| Isolamento | `isolate: true` (padrão) | Recarrega módulos a cada arquivo |
| Falhas | 10/1177 | Pré-existentes (`uid` UUID vs dígitos) |

**Causas raiz:**
- `isolate: true` recarrega módulos a cada arquivo
- Threads padrão = CPU-1 = 1 thread em CI 2-core
- `vi.mock()` em module scope repetido
- Testes `uid` falham (pre-existente, não regressão)

### 2. BUILD (Vite/Rolldown)
| Métrica | Atual | Gargalo |
|---------|-------|---------|
| Tempo | ~8.7s | Rolldown já rápido, mas chunking subótimo |
| Chunks | 34 | Alguns chunks > 200KB |
| Cache | Parcial | Vite cache não persistido em CI |

### 3. LINT (ESLint)
| Métrica | Atual | Gargalo |
|---------|-------|---------|
| Tempo | ~3-5s | Cache `metadata` ineficaz em CI (timestamps mudam) |
| Cache | `.eslintcache` | Estratégia `metadata` falha em CI (timestamps) |

---

## OTIMIZAÇÕES RECOMENDADAS (ORDEM DE IMPACTO)

---

### 1. VITEST — MAIOR GANHO (60-70% redução)

#### A. Desabilitar isolamento onde seguro (`isolate: false`)
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    isolate: false,  // ~6x mais rápido
    // Projects para isolar apenas o necessário:
    projects: [
      { name: 'unit', include: ['src/**/*.test.{ts,tsx}'], isolate: false },
      { name: 'isolated', include: ['src/**/*.isolated.test.{ts,tsx}'], isolate: true }
    ]
  }
}
```
> **Ganho estimado:** 6x mais rápido (ex: 58s → ~10s)

#### B. Otimizar pool/threads
```typescript
// vitest.config.ts
test: {
  pool: 'threads',
  poolOptions: {
    threads: {
      minThreads: 2,
      maxThreads: 4,  // CI 4-core
      // ou: maxThreads: process.env.CI ? 2 : undefined
    }
  }
}
```

#### C. Desabilitar isolamento global + projects isolados
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    isolate: false,  // global off
    projects: [
      { name: 'unit', include: ['src/**/*.test.{ts,tsx}'], isolate: false },
      { name: 'isolated', include: ['src/**/*.isolated.test.{ts,tsx}'], isolate: true }
    ]
  }
})
```
> Renomear testes com estado para `*.isolated.test.{ts,tsx}`

#### D. Cache de dependências
```yaml
# .github/workflows/ci.yml
- uses: actions/cache@v4
  with:
    path: |
      node_modules
      .vite/deps
    key: deps-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

#### E. Pool `forks` apenas onde necessário
```typescript
test: {
  projects: [
    { name: 'unit', pool: 'threads', isolate: false, include: ['src/**/*.test.{ts,tsx}'] },
    { name: 'db', pool: 'forks', isolate: true, include: ['src/**/*.db.test.ts'] },
    { name: 'e2e', pool: 'forks', include: ['**/*.e2e.test.ts'] }
  ]
}
```

#### E. Testes paralelos internos (`it.concurrent`)
```typescript
describe.concurrent('api calls', () => {
  it.concurrent('user list', async () => { /* ... */ })
  it.concurrent('product list', async () => { /* ... */ })
})
```

---

### 2. VITE BUILD — ROLLDOWN JÁ RÁPIDO, OTIMIZAR CHUNKING

#### A. Manual Chunks (já parcialmente feito)
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'framework-react';
        if (id.includes('node_modules/@tanstack/react-query')) return 'vendor-tanstack';
        if (id.includes('node_modules/echarts')) return 'vendor-echarts';
        if (id.includes('src/features/admin')) return 'module-admin';
        if (id.includes('src/features/branding')) return 'module-branding';
      }
    }
  }
}
```

#### B. Chunk Import Map (Vite 8.1+ experimental)
```typescript
// vite.config.ts
build: {
  experimental: {
    chunkImportMap: true  // import maps para cache efficiency
  }
}
```

#### C. Brotli pré-compressão
```typescript
import viteCompression from 'vite-plugin-compression';

plugins: [
  viteCompression({ algorithm: 'brotliCompress', ext: '.br', threshold: 512 }),
  viteCompression({ algorithm: 'gzip', ext: '.gz' })
]
```

#### C. Cache Vite em CI
```yaml
# .github/workflows/ci.yml
- uses: actions/cache@v4
  with:
    path: |
      node_modules
      .vite
    key: vite-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

---

### 3. ESLINT — CACHE E PARALELISMO

#### A. Cache Strategy `content` (OBRIGATÓRIO EM CI)
```yaml
# .github/workflows/ci.yml
- run: npx eslint . --cache --cache-strategy content --cache-location .cache/eslint/
```
> **Crítico:** `--cache-strategy content` usa hash do conteúdo, não timestamp (timestamps mudam no CI)

#### B. Cache ESLint + TypeScript persistido
```yaml
- uses: actions/cache@v4
  with:
    path: |
      .eslintcache
      tsconfig.tsbuildinfo
    key: lint-${{ runner.os }}-${{ hashFiles('package-lock.json', '.eslintrc*', 'eslint.config.*', 'tsconfig.json') }}
    restore-keys: lint-${{ runner.os }}-
```

#### C. Lint apenas arquivos alterados (PRs)
```yaml
- name: Lint changed files
  if: github.event_name == 'pull_request'
  run: |
    CHANGED=$(git diff --name-only --diff-filter=d origin/${{ github.base_ref }}...HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx')
    if [ -n "$CHANGED" ]; then
      echo "$CHANGED" | xargs npx eslint --cache --cache-strategy content
    fi
```

#### C. ESLint 9.34+ Multithread
```bash
npx eslint . --cache --cache-strategy content --max-warnings=0
# ESLint 9.34+ usa worker_threads automaticamente
```

---

### 4. TYPESCRIPT — INCREMENTAL

```json
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".cache/tsbuildinfo",
    "skipLibCheck": true
  }
}
```

```yaml
# CI cache
- uses: actions/cache@v4
  with:
    path: .cache/tsbuildinfo
    key: ts-${{ runner.os }}-${{ hashFiles('tsconfig.json') }}
```

---

### 5. TEST IMPACT ANALYSIS — EXECUTAR SOMENTE TESTES AFETADOS

#### A. Ferramenta: `vitest --changed` (experimental) ou `knip`/`dep-graph`

#### B. Abordagem custom (simples):
```bash
#!/bin/bash
# scripts/changed-tests.sh
CHANGED=$(git diff --name-only --diff-filter=d origin/main...HEAD -- '*.ts' '*.tsx')
if [ -n "$CHANGED" ]; then
  # Mapear arquivos alterados → testes relacionados
  npx vitest run --changed
  # Ou: npx vitest run $(echo "$CHANGED" | sed 's/\.tsx\?$/.test.tsx/')
fi
```

#### C. `vitest --changed` (experimental, v1.6+)
```bash
npx vitest run --changed
# Executa apenas testes afetados por mudanças recentes
```

---

### 6. AUDITORIA INCREMENTAL

#### A. Validar apenas alterações
```bash
#!/bin/bash
# scripts/audit-changed.sh
CHANGED_FILES=$(git diff --name-only origin/main...HEAD)

# Validar apenas migrations novas
NEW_MIGRATIONS=$(echo "$CHANGED_FILES" | grep 'supabase/migrations/.*\.sql$' | sort -u)

# Validar apenas edge functions alteradas
CHANGED_EF=$(echo "$CHANGED_FILES" | grep 'supabase/functions/' | sort -u)

# Validar apenas componentes alterados
CHANGED_COMPONENTS=$(echo "$CHANGED_FILES" | grep 'src/features/' | sed 's|src/features/\([^/]*\)/.*|\1|' | sort -u)
```

#### B. Checklist automático
```yaml
# scripts/audit-checklist.yml
checks:
  - name: "Migrations novas"
    condition: "new_migrations_count > 0"
    action: "supabase db push --dry-run"
  - name: "Edge Functions"
    condition: "changed_ef_count > 0"
    action: "supabase functions deploy --verify"
  - name: "Componentes alterados"
    action: "npm run test -- ${CHANGED_COMPONENTS}"
```

---

### 7. SCRIPTS DE VALIDAÇÃO RÁPIDA

```bash
#!/bin/bash
# scripts/validate-fast.sh

echo "🔍 VALIDAÇÃO RÁPIDA — apenas alterações"

# 1. Lint apenas alterados
CHANGED=$(git diff --name-only --diff-filter=d origin/main...HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx')
if [ -n "$CHANGED" ]; then
  echo "$CHANGED" | xargs npx eslint --cache --cache-strategy content
fi

# 2. TypeScript incremental
npx tsc --noEmit --incremental

# 3. Testes apenas alterados
npx vitest run --changed

# 4. Build rápido
npm run build -- --mode=production
```

---

### 8. WORKFLOW CI OTIMIZADO (`.github/workflows/ci.yml`)

```yaml
name: CI Fast Validation
on: [push, pull_request]

jobs:
  fast-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - uses: actions/cache@v4
        with:
          path: .eslintcache
          key: eslint-${{ runner.os }}-${{ hashFiles('.eslintrc*', 'package-lock.json') }}
      - run: npm ci
      - name: Lint changed files
        if: github.event_name == 'pull_request'
        run: |
          CHANGED=$(git diff --name-only --diff-filter=d origin/${{ github.base_ref }}...HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx')
          if [ -n "$CHANGED" ]; then echo "$CHANGED" | xargs npx eslint --cache --cache-strategy content; fi
      - name: Lint all
        if: github.event_name == 'push'
        run: npx eslint . --cache --cache-strategy content

  fast-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - uses: actions/cache@v4
        with:
          path: .cache/tsbuildinfo
          key: ts-${{ runner.os }}-${{ hashFiles('tsconfig.json') }}
      - run: npm ci
      - run: npx tsc --noEmit --incremental

  fast-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - uses: actions/cache@v4
        with:
          path: |
            node_modules
            .vite
          key: test-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - run: npm ci
      - name: Test changed (PR) / all (push)
        if: github.event_name == 'pull_request'
        run: npx vitest run --changed
      - name: Test all
        if: github.event_name == 'push'
        run: npx vitest run --reporter=verbose

  fast-build:
    needs: [fast-lint, fast-typecheck, fast-test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - uses: actions/cache@v4
        with:
          path: |
            node_modules
            .vite
          key: build-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - run: npm ci
      - run: npm run build

  audit:
    needs: [fast-build]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Audit changed only
        run: |
          ./scripts/audit-changed.sh
      - name: Validate docs
        run: node scripts/validate-docs.js

  integrate:
    needs: [audit]
    runs-on: ubuntu-latest
    steps:
      - run: echo "Integration approved"
```

---

## 8. RELATÓRIO DE ECONOMIA ESTIMADA

| Etapa | Tempo Atual | Tempo Otimizado | Economia |
|-------|-------------|-----------------|----------|
| Lint | ~5s | ~1s (cache hit) | **80%** |
| TypeCheck | ~30s | ~5s (incremental) | **83%** |
| Testes | 58s | ~10s (isolate=false + --changed) | **83%** |
| Build | 8.7s | 6s (cache quente) | **30%** |
| Auditoria | ~5 min | ~30s (incremental) | **90%** |
| **TOTAL** | **~6-7 min** | **~1.5 min** | **~78%** |

---

## 9. PRÓXIMOS PASSOS (PRIORIDADE)

| Prioridade | Ação | Esforço | Ganho |
|------------|------|---------|-------|
| 🔴 **1** | `isolate: false` no Vitest + projects isolados | 30 min | 6x test speed |
| 🔴 **2** | `--cache-strategy content` no ESLint CI | 5 min | 80% lint speed |
| 🔴 **3** | TypeScript `--incremental` + cache CI | 15 min | 80% typecheck |
| 🟠 **4** | `vitest --changed` para PRs | 30 min | 80% test time PR |
| 🟠 **5** | Cache Vite/ESLint/TS no CI | 20 min | 30-80% todas etapas |
| 🟡 **6** | `vitest --changed` / test impact analysis | 1h | 80% test time PR |
| 🟡 **7** | `build.chunkImportMap` (Vite 8.1+) | 30 min | 20% build cache |
| 🟢 **8** | Auditoria incremental script | 2h | 90% audit time |

---

## 10. ARQUIVOS A CRIAR/MODIFICAR

| Arquivo | Ação |
|---------|------|
| `vitest.config.ts` | `isolate: false` + projects |
| `.github/workflows/ci.yml` | Cache + `--cache-strategy content` + `--changed` |
| `tsconfig.json` | `incremental: true` |
| `vite.config.ts` | `manualChunks` + `experimental.chunkImportMap` |
| `scripts/validate-fast.sh` | Novo script validação rápida |
| `scripts/audit-changed.sh` | Nova auditoria incremental |
| `.github/workflows/ci.yml` | Pipeline otimizado (ver seção 7) |
| `docs/Performance/VALIDATION_OPTIMIZATION_REPORT.md` | Este documento |

---

## 10. MÉTRICAS DE ACOMPANHAMENTO

| KPI | Baseline | Target | Medição |
|-----|----------|--------|---------|
| `npm run lint` | 5s | < 1s | CI log |
| `npm run tsc` | 30s | < 5s | CI log |
| `npm test` | 58s | < 10s | Vitest JSON reporter |
| `npm run build` | 8.7s | < 6s | Vite build output |
| Auditoria completa | 5 min | < 30s | Script log |
| **Pipeline total** | **~6-7 min** | **< 2 min** | **CI total time** |

---

## 11. CHECKLIST DE IMPLEMENTAÇÃO

- [ ] `vitest.config.ts`: `isolate: false` + projects
- [ ] `vitest.config.ts`: `poolOptions.threads.maxThreads: 4`
- [ ] `package.json`: scripts `test:changed` → `vitest run --changed`
- [ ] `tsconfig.json`: `incremental: true`, `tsBuildInfoFile`
- [ ] `vite.config.ts`: `manualChunks` + `experimental.chunkImportMap`
- [ ] `.github/workflows/ci.yml`: cache steps + `--cache-strategy content` + `--changed`
- [ ] `scripts/validate-fast.sh`: script validação rápida
- [ ] `scripts/audit-changed.sh`: auditoria incremental
- [ ] `docs/Performance/VALIDATION_OPTIMIZATION_REPORT.md` (este arquivo)

---

## 12. RISCOS E MITIGAÇÕES

| Risco | Mitigação |
|-------|-----------|
| `isolate: false` quebra testes com estado compartilhado | Migrar testes sujos para `*.isolated.test.tsx` com `isolate: true` |
| Cache corrompido em CI | `restore-keys` no actions/cache + versionamento no key |
| `--changed` perde testes dependentes | `vitest --changed` usa grafo de dependências; validar em CI |
| Build cache stale | Key inclui `package-lock.json` hash |

---

## 12. PRÓXIMOS PASSOS IMEDIATOS (ESTA SEMANA)

1. **Hoje**: `vitest.config.ts` → `isolate: false` + projects
2. **Hoje**: `package.json` → script `test:changed`
3. **Hoje**: `.github/workflows/ci.yml` → cache + `--cache-strategy content`
4. **Amanhã**: `tsconfig.json` → `incremental: true`
5. **Amanhã**: `.github/workflows/ci.yml` → job `test:changed` para PRs
6. **Esta semana**: `vite.config.ts` → `manualChunks` + `chunkImportMap`
7. **Esta semana**: Scripts `validate-fast.sh` + `audit-changed.sh`

---

**Este documento deve ser atualizado a cada otimização implementada.**  
**Próxima revisão:** 2026-07-18