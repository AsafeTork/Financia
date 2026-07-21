# PLANO DE OTIMIZAÇÃO DA VALIDAÇÃO — Financia

**Objetivo:** Reduzir tempo de validação (lint + build + test) de ~2-3 min para < 1 min, mantendo qualidade.

---

## Análise Atual (Baseline 2026-07-11)

| Comando | Tempo | Observação |
|---------|-------|------------|
| `npm run lint` | ~8s | ESLint sem cache |
| `npm run build` | ~8s | Vite sem cache persistente |
| `npm test` | ~70s | Vitest roda todos 1177 testes |
| **Total** | **~86s** | Sem cache, full run |

---

## Otimizações Prioritárias

### 1. Cache de Lint (ESLint) — **Impacto: ~6s → <1s**

```json
// package.json
"lint": "eslint src/ --cache --cache-location .eslintcache"
```

- `--cache` evita re-analisar arquivos inalterados
- Primeiro run: normal; subsequentes: <500ms

### 2. Cache de Build (Vite) — **Impacto: ~8s → ~3s**

```js
// vite.config.js
export default defineConfig({
  build: {
    cacheDir: 'node_modules/.vite-build-cache', // persistente
  }
});
```

### 3. Test Impact Analysis (TIA) — **Impacto: 70s → 10-20s**

**Ferramenta:** `vitest --changed` ou `nx affected:test`

```json
// package.json
"test:changed": "vitest run --changed",
"test:affected": "vitest run --reporter=verbose --filter=/changed/"
```

**Estratégia:**
- CI roda `test:changed` em PRs (apenas testes tocando arquivos modificados)
- `test:full` apenas em `main` branch / release tags
- `test:watch` em dev com `--reporter=verbose`

### 4. Parallel Test Execution — **Impacto: 70s → 25s**

```json
// vitest.config.js
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: { threads: { singleThread: false } },
    maxConcurrency: 4, // ou CPU cores - 1
  }
});
```

### 5. Changed-Build (Vite) — **Impacto: 8s → 2s**

```json
// package.json
"build:changed": "vite build --mode=production --changed"
```

---

## Scripts Recomendados (`package.json`)

```json
{
  "scripts": {
    "lint": "eslint src/ --cache --cache-location .eslintcache",
    "lint:ci": "eslint src/ --cache --cache-location .eslintcache --max-warnings=0",
    "build": "vite build",
    "build:ci": "vite build --mode=production",
    "build:changed": "vite build --mode=production --changed",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:changed": "vitest run --changed",
    "test:affected": "vitest run --filter=/changed/",
    "test:ci": "vitest run --reporter=verbose --coverage",
    "validate": "npm run lint && npm run build && npm run test",
    "validate:fast": "npm run lint && npm run build:changed && npm run test:changed",
    "validate:ci": "npm run lint:ci && npm run build:ci && npm run test:ci"
  }
}
```

---

## CI/CD Pipeline Otimizado (GitHub Actions)

```yaml
# .github/workflows/ci.yml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Cache ESLint
      - name: Cache ESLint
        uses: actions/cache@v4
        with:
          path: .eslintcache
          key: eslint-${{ runner.os }}-${{ hashFiles('**/*.{js,jsx}') }}
      
      # Cache Vite
      - name: Cache Vite
        uses: actions/cache@v4
        with:
          path: node_modules/.vite-build-cache
          key: vite-${{ runner.os }}-${{ hashFiles('vite.config.js', 'package-lock.json') }}
      
      # Cache node_modules
      - name: Cache deps
        uses: actions/cache@v4
        with:
          path: node_modules
          key: deps-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      
      - name: Install
        run: npm ci --prefer-offline
      
      # Fast validation para PRs
      - name: Fast Validate (PR)
        if: github.event_name == 'pull_request'
        run: npm run validate:fast
      
      # Full validation para main/release
      - name: Full Validate (Main/Release)
        if: github.event_name != 'pull_request'
        run: npm run validate:ci
```

---

## Test Impact Analysis (TIA) — Implementação

### Opção A: `vitest --changed` (Simples)

```bash
# Detecta arquivos modificados vs main e roda testes relacionados
npx vitest run --changed
```

**Limitação:** Precisa de git history; não funciona bem em shallow clones.

### Opção B: `nx affected:test` (Robusto)

```bash
# Requer nx.json com project graph
npx nx affected:test --base=origin/main --parallel=4
```

**Vantagem:** Grafo de dependências real; sabe exatamente quais testes rodar.

### Opção C: Custom Script (Flexível)

```js
// scripts/changed-tests.js
import { execSync } from 'child_process';

const changedFiles = execSync('git diff --name-only origin/main...HEAD -- src/')
  .toString().trim().split('\n').filter(Boolean);

const testFiles = changedFiles
  .map(f => f.replace(/\.(js|jsx)$/, '.test.$1'))
  .filter(f => require('fs').existsSync(f));

if (testFiles.length > 0) {
  execSync(`npx vitest run ${testFiles.join(' ')}`, { stdio: 'inherit' });
} else {
  console.log('Nenhum teste afetado');
}
```

---

## Métricas de Sucesso (KPIs)

| Métrica | Baseline | Target | Medição |
|---------|----------|--------|---------|
| `lint` (PR) | 8s | < 1s | CI log |
| `build` (PR) | 8s | 2s | CI log |
| `test` (PR) | 70s | 15s | CI log |
| **Total PR** | **86s** | **< 20s** | CI duration |
| `validate:ci` (main) | 86s | 86s | CI duration (full) |
| Cache hit rate | 0% | > 80% | CI cache stats |

---

## Rollout Plan

| Fase | Ação | Responsável | Deadline |
|------|------|-------------|----------|
| 1 | Adicionar `--cache` ao lint | Subagente Frontend | Dia 1 |
| 2 | Configurar `build.cacheDir` no Vite | Subagente Frontend | Dia 1 |
| 3 | Habilitar `pool: threads` no Vitest | Subagente Frontend | Dia 1 |
| 4 | Criar `test:changed` script | Subagente Frontend | Dia 2 |
| 5 | Atualizar GitHub Actions com caches | Subagente CI/CD | Dia 2 |
| 6 | Medir baselines pós-mudança | Subagente QA | Dia 3 |
| 7 | Documentar em `VALIDATION_MODULE.md` | Integrador | Dia 3 |

---

## Validação Rápida (Local)

```bash
# Validação completa (release)
npm run validate:ci    # ~86s

# Validação rápida (desenvolvimento/PR)
npm run validate:fast  # <20s target

# Apenas o que mudou
npm run test:changed   # ~10s
npm run build:changed  # ~2s
npm run lint           # <1s (cached)
```

---

## Monitoramento Contínuo

- Adicionar step no CI que loga duração de cada step
- Alertar se `validate:fast` > 30s
- Revisar mensalmente: cache hit rates, test flakiness, bundle size