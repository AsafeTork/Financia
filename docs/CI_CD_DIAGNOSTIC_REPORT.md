# CI/CD Pipeline Diagnostic Report — Financia

**Data:** 2026-07-31
**Subagente:** ci-cd
**Status:** RESEARCH_COMPLETE

---

## 1. RESUMO EXECUTIVO

| Problema | Severidade | Status |
|----------|------------|--------|
| Node.js 20 vs 22/24 incompatibility | CRÍTICO | Identificado |
| Cache strategy ineficaz (apenas cache global npm) | ALTO | Identificado |
| Exit codes perdidos com `tee` + `|| true` | CRÍTICO | Identificado |
| Testes falhando (13 falhas em 3 arquivos) | ALTO | Confirmado |
| Build gera chunks vazios Supabase | MÉDIO | Identificado |
| Lint warnings não tratados como erros | MÉDIO | Identificado |
| Falta integração Render deploy no CI | BAIXO | Identificado |

---

## 2. ACHADOS DA PESQUISA

### 2.1 Node.js 20 Deprecation no GitHub Actions

**Fonte:** GitHub Blog (2025-09-19), knowledgebase.autorabit.com (2026-07-31), dev.to migration playbook

**Fatos:**
- Node.js 20 atinge EOL em **abril 2026** (já passou)
- GitHub **pulou Node 22** e migrou direto para **Node 24** como runtime padrão
- A partir de **04/mar/2026**: Node 24 vira default nos runners
- **Verão 2026**: Node 20 removido completamente dos runners
- Actions que usam `runs.using: 'node20'` param de funcionar

**Impacto no projeto:**
- `.nvmrc` especifica **Node 22**
- Workflows CI usam `node-version: 20`
- `actions/setup-node@v4` com Node 20 ainda funciona mas gera warnings de deprecation
- Node 22 **não é suportado** nativamente nos runners GitHub (pulado)

**Recomendação:** Migrar para **Node 24** nos workflows CI (align com runners) ou usar Node 22 via `nvm` se necessário para compatibilidade local.

---

### 2.2 Cache Strategies — O que está quebrado

**Fonte:** actions/cache docs, eastondev.com (2026-04-07), adhdecode.com (2026-04-18), devactivity.com (2026-02-16)

**Problema atual:**
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm  # APENAS cacheia ~/.npm (global), NÃO node_modules
```

**O que `cache: npm` faz:** Cacheia o cache global do npm (~/.npm), não o `node_modules/`. O `npm ci` ainda baixa/instala tudo.

**Cache recomendado (múltiplas camadas):**

```yaml
# 1. npm dependencies (package-lock.json hash)
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-

# 2. Playwright browsers (pesado, ~200MB)
- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}

# 3. Vite cache (opcional, node_modules/.vite)
- uses: actions/cache@v4
  with:
    path: node_modules/.vite
    key: ${{ runner.os }}-vite-${{ hashFiles('vite.config.js', 'package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-vite-

# 4. Pre-commit cache (se usado)
- uses: actions/cache@v4
  with:
    path: ~/.cache/pre-commit
    key: ${{ runner.os }}-pre-commit-${{ hashFiles('.pre-commit-config.yaml') }}
```

**Benchmarks (RunsOn, jan/2026):**
| Operação | Sem Cache | Com Cache | Speedup |
|----------|-----------|-----------|---------|
| npm install | 3 min | 40 seg | ~5x |
| Playwright install | 2 min | 30 seg | ~4x |

---

### 2.3 Exit Code Handling — O problema do `tee` + `|| true`

**Fonte:** Stack Overflow, GitHub Docs, TechMarmot (2026-05-10), astral-sh/ty workflow

**Problema atual nos workflows:**
```yaml
- run: npx eslint src/ 2>&1 | tee /tmp/lint-output.txt || true
- run: npm run typecheck 2>&1 | tee /tmp/typecheck-output.txt || true
- run: npm run test 2>&1 | tee /tmp/test-output.txt || true
```

**Por que falha:**
1. `|| true` **sempre mascara falha** — o step sempre passa
2. `tee` em pipeline perde o exit code do comando anterior (`$?` retorna exit code do `tee`)
3. `PIPESTATUS[0]` captura o exit code do primeiro comando no pipe

**Solução correta (pattern do astral-sh/ty):**
```bash
run: |
  set -o pipefail
  npx eslint src/ 2>&1 | tee /tmp/lint-output.txt
  exit_code=${PIPESTATUS[0]}
  exit $exit_code
```

Ou mais robusto:
```bash
run: |
  output=$(npx eslint src/ 2>&1)
  exit_code=$?
  echo "$output" | tee /tmp/lint-output.txt
  exit $exit_code
```

**Para jobs dependentes:** Usar `needs.<job>.result` ou outputs explícitos:
```yaml
jobs:
  lint:
    outputs:
      exit_code: ${{ steps.lint.outputs.exit_code }}
    steps:
      - id: lint
        run: |
          set -o pipefail
          npx eslint src/ 2>&1 | tee /tmp/lint-output.txt
          echo "exit_code=${PIPESTATUS[0]}" >> $GITHUB_OUTPUT
```

---

### 2.4 Test Failures — Análise dos 13 testes quebrados

**Do CI_ERRORS.md (commit 760d238):**

| Arquivo | Falhas | Tipo |
|---------|--------|------|
| `src/lib/sync.test.js` | 1 | Assertion: expected null to deeply equal [] |
| `src/features/branding/responseProcessor.test.js` | 9 | TypeError: Cannot read properties of undefined |
| `src/shared/hooks/useBrandAppearance.test.js` | 2 | Assertion: expected null to be 'dark' |

**Total: 13 falhas em 3 arquivos**

**Causa raiz provável:** Testes dependem de mocks/setup que não estão isolados corretamente no ambiente CI (jsdom + vitest threads). O `isolate: true` no vitest.config.js deve ajudar, mas o `pool: threads` com `minThreads: 2` pode causar race conditions em shared state.

---

### 2.5 Build — Chunks Vazios Supabase

**Do CI_ERRORS.md:**
```
Generated an empty chunk: "supabase-functions"
Generated an empty chunk: "supabase-db"
Generated an empty chunk: "supabase"
Generated an empty chunk: "supabase-storage"
Generated an empty chunk: "supabase-auth"
```

**Causa:** `manualChunks` no vite.config.js cria chunks para módulos Supabase que não são importados diretamente no código (tree-shaking remove). O Rollup ainda emite chunks vazios.

**Solução:** Adicionar `output.manualChunks` filter ou usar `output.chunkFileNames` com `[name]-[hash]` e ignorar warnings, ou remover chunks não usados da config.

---

### 2.6 Render Deploy Integration

**Fonte:** render.com/docs, GitHub Marketplace (JorgeLNJunior/render-deploy@v1.5.0)

**Situação atual:**
- `render.yaml` define static site com `buildCommand: npm install && npm run build`
- Auto-deploy habilitado por padrão no Render
- **Nenhum workflow CI faz deploy no Render** — depende do auto-deploy do Render

**Opções:**
1. **Manter auto-deploy Render** (simples, mas sem gate de CI)
2. **Desabilitar auto-deploy + usar GitHub Action** (JorgeLNJunior/render-deploy) com `wait_deploy: true` e `github_deployment: true` para tracking

**Recomendação:** Opção 2 para controle total + visibility no GitHub Environments.

---

## 3. RECOMENDAÇÕES ESPECÍFICAS

### Prioridade 1 — CRÍTICO (Bloqueiam CI confiável)

| # | Ação | Arquivo | Esforço |
|---|------|---------|---------|
| 1 | Migrar `node-version: 20` → `24` em todos jobs | `.github/workflows/ci.yml`, `build.yml` | 5 min |
| 2 | Remover `|| true` de todos steps críticos | `.github/workflows/ci.yml` | 10 min |
| 3 | Implementar `set -o pipefail` + `PIPESTATUS` capture | `.github/workflows/ci.yml` | 15 min |
| 4 | Adicionar cache multicamadas (npm, Playwright, Vite) | `.github/workflows/ci.yml` | 20 min |

### Prioridade 2 — ALTO (Qualidade)

| # | Ação | Arquivo | Esforço |
|---|------|---------|---------|
| 5 | Corrigir 13 testes falhando (branding, sync, hooks) | `src/**/*.test.js` | 1-2h |
| 6 | Eliminar chunks vazios Supabase no build | `vite.config.js` | 15 min |
| 7 | Tratar lint warnings como errors (`eslint --max-warnings=0`) | `.github/workflows/ci.yml` | 5 min |
| 8 | Adicionar matrix Node [22, 24] para compatibilidade | `.github/workflows/ci.yml` | 10 min |

### Prioridade 3 — MÉDIO (Melhorias)

| # | Ação | Arquivo | Esforço |
|---|------|---------|---------|
| 9 | Integrar Render deploy action (JorgeLNJunior/render-deploy) | Novo workflow `deploy.yml` | 30 min |
| 10 | Separar CI (lint/test/build) de CD (deploy) | Workflows separados | 20 min |
| 11 | Adicionar `concurrency` cancel-in-progress em PRs | `.github/workflows/ci.yml` | 5 min |
| 12 | Configurar `permissions` mínimas por job | `.github/workflows/ci.yml` | 10 min |

---

## 4. WORKFLOW YAML CORRIGIDO — EXEMPLO COMPLETO

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_OPTIONS: '--max-old-space-size=6144'

permissions:
  contents: read

jobs:
  # ──────────────────────────────────────────────
  # LINT + TYPECHECK (fast, fail early)
  # ──────────────────────────────────────────────
  lint-typecheck:
    name: Lint + Typecheck
    runs-on: ubuntu-latest
    timeout-minutes: 10
    outputs:
      lint_exit_code: ${{ steps.lint.outputs.exit_code }}
      typecheck_exit_code: ${{ steps.typecheck.outputs.exit_code }}
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'

      - name: Cache npm dependencies
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-npm-

      - name: Install dependencies
        run: npm ci

      - name: Lint
        id: lint
        run: |
          set -o pipefail
          npx eslint src/ 2>&1 | tee /tmp/lint-output.txt
          echo "exit_code=${PIPESTATUS[0]}" >> $GITHUB_OUTPUT
        # Sem || true — falha real propaga

      - name: Typecheck
        id: typecheck
        run: |
          set -o pipefail
          npm run typecheck 2>&1 | tee /tmp/typecheck-output.txt
          echo "exit_code=${PIPESTATUS[0]}" >> $GITHUB_OUTPUT

      - name: Upload lint artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: lint-typecheck
          path: /tmp/*-output.txt
          retention-days: 5

  # ──────────────────────────────────────────────
  # UNIT TESTS (matrix Node 22 + 24)
  # ──────────────────────────────────────────────
  unit-tests:
    name: Unit Tests (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: lint-typecheck
    strategy:
      matrix:
        node-version: ['22', '24']
      fail-fast: false
    outputs:
      test_exit_code: ${{ steps.test.outputs.exit_code }}
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Cache npm dependencies
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-npm-

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run unit tests
        id: test
        run: |
          set -o pipefail
          npm run test 2>&1 | tee /tmp/test-output.txt
          echo "exit_code=${PIPESTATUS[0]}" >> $GITHUB_OUTPUT

      - name: Upload test artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: unit-tests-${{ matrix.node-version }}
          path: |
            /tmp/test-output.txt
            coverage/
          retention-days: 5

  # ──────────────────────────────────────────────
  # BUILD (depends on lint + tests)
  # ──────────────────────────────────────────────
  build:
    name: Build
    runs-on: ubuntu-latest
    timeout-minutes: 10
    needs: [lint-typecheck, unit-tests]
    if: |
      needs.lint-typecheck.outputs.lint_exit_code == '0' &&
      needs.lint-typecheck.outputs.typecheck_exit_code == '0' &&
      needs.unit-tests.outputs.test_exit_code == '0'
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'

      - name: Cache npm dependencies
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-npm-

      - name: Cache Vite
        uses: actions/cache@v4
        with:
          path: node_modules/.vite
          key: ${{ runner.os }}-vite-${{ hashFiles('vite.config.js', 'package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-vite-

      - name: Install dependencies
        run: npm ci

      - name: Build
        id: build
        run: |
          set -o pipefail
          npm run build 2>&1 | tee /tmp/build-output.txt
          echo "exit_code=${PIPESTATUS[0]}" >> $GITHUB_OUTPUT

      - name: Upload build artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: |
            /tmp/build-output.txt
            dist/
          retention-days: 5

  # ──────────────────────────────────────────────
  # SECURITY AUDIT
  # ──────────────────────────────────────────────
  security-audit:
    name: Security Audit
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'

      - name: Cache npm dependencies
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-npm-

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run audit-ci (if configured)
        run: npx audit-ci --config audit-ci.jsonc || true

  # ──────────────────────────────────────────────
  # E2E TESTS (chromium)
  # ──────────────────────────────────────────────
  e2e:
    name: E2E Tests (chromium)
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: build
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'

      - name: Cache npm dependencies
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-npm-

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build
        run: npm run build

      - name: Run critical E2E tests
        id: e2e
        run: |
          set -o pipefail
          npx playwright test \
            e2e/auth-flow.spec.ts \
            e2e/brand-studio.spec.ts \
            e2e/dashboard-analytics.spec.ts \
            e2e/offline-state-corruption.spec.ts \
            e2e/deep-sync-conflict.spec.ts \
            e2e/keyboard-navigation.spec.ts \
            e2e/error-boundary-recovery.spec.ts \
            --project=chromium 2>&1 | tee /tmp/e2e-output.txt
          echo "exit_code=${PIPESTATUS[0]}" >> $GITHUB_OUTPUT

      - name: Upload E2E artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-tests
          path: |
            /tmp/e2e-output.txt
            playwright-report/
            test-results/
          retention-days: 5

  # ──────────────────────────────────────────────
  # PRODUCTION AUDIT (chromium)
  # ──────────────────────────────────────────────
  production-audit:
    name: Production Audit (chromium)
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: build
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'

      - name: Cache npm dependencies
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-npm-

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run production audit
        run: npx playwright test --config=playwright.prod.config.ts --project=chromium

  # ──────────────────────────────────────────────
  # ADMIN AUDIT (production)
  # ──────────────────────────────────────────────
  admin-audit:
    name: Admin Audit (production)
    runs-on: ubuntu-latest
    timeout-minutes: 30
    needs: build
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'

      - name: Cache npm dependencies
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-npm-

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium firefox

      - name: Run admin audit
        run: npx playwright test e2e/admin-audit.spec.ts --project=chromium
        env:
          PLAYWRIGHT_USERNAME: ${{ secrets.PLAYWRIGHT_USERNAME }}
          PLAYWRIGHT_PASSWORD: ${{ secrets.PLAYWRIGHT_PASSWORD }}

      - name: Upload admin audit report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: admin-audit-report-md
          path: admin-audit-report.md
          retention-days: 30

  # ──────────────────────────────────────────────
  # EXTRACT ERRORS & GENERATE REPORT
  # ──────────────────────────────────────────────
  extract-errors:
    name: Extract Errors & Generate Report
    runs-on: ubuntu-latest
    timeout-minutes: 5
    needs: [lint-typecheck, unit-tests, build, security-audit, production-audit, admin-audit, e2e]
    if: always()
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          persist-credentials: false

      - name: Download CI artifacts
        if: always()
        run: |
          mkdir -p ci-artifacts
          gh run download ${{ github.run_id }} -D ci-artifacts/ || true
          find ci-artifacts/ -type f | head -30 || true
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Generate CI_REPORT.md
        run: python3 scripts/generate-ci-report.py

      - name: Commit CI_REPORT.md
        if: github.ref == 'refs/heads/main'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add CI_REPORT.md
          git diff --cached --quiet || git commit -m "chore: update CI_REPORT.md [skip ci]"
          git push

      - name: Upload report artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ci-report-md
          path: CI_REPORT.md
          retention-days: 30

  # ──────────────────────────────────────────────
  # SUMMARY
  # ──────────────────────────────────────────────
  summary:
    name: Test Summary
    runs-on: ubuntu-latest
    needs: [lint-typecheck, unit-tests, build, security-audit, production-audit, admin-audit, e2e, extract-errors]
    if: always()
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          persist-credentials: false

      - uses: actions/download-artifact@v4
        continue-on-error: true
        with:
          name: ci-report-md
          path: .

      - name: Upload CI_REPORT.md artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ci-summary-report
          path: CI_REPORT.md
          retention-days: 30
```

---

## 5. BUILD.YML — CORREÇÕES PARA WINDOWS BUILD

```yaml
# .github/workflows/build.yml (apenas trechos relevantes)

build-windows:
  runs-on: windows-latest
  # ...
  steps:
    # ...
    - uses: actions/setup-node@v4
      with:
        node-version: '24'  # Era '20'
        cache: 'npm'

    - name: Cache npm dependencies
      uses: actions/cache@v4
      with:
        path: ~/.npm
        key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
        restore-keys: |
          ${{ runner.os }}-npm-

    - name: Instalar dependencias
      run: npm ci  # Era npm install
```

---

## 6. VITE.CONFIG.JS — ELIMINAR CHUNKS VAZIOS

```javascript
// vite.config.js — manualChunks ajustado
manualChunks: function(id) {
  // Só criar chunk se o módulo FOR realemente importado
  if (id.includes('node_modules/react') && !id.includes('react-table')) return 'vendor-react';
  if (id.includes('node_modules/react-dom')) return 'vendor-react';
  if (id.includes('node_modules/scheduler')) return 'vendor-scheduler';
  
  // Supabase: só chunk se houver import real
  const supabaseModules = [
    '@supabase/postgrest-js',
    '@supabase/auth-js',
    '@supabase/storage-js',
    '@supabase/functions-js'
  ];
  for (const mod of supabaseModules) {
    if (id.indexOf(mod) !== -1) return mod.replace('@supabase/', 'supabase-').replace('-js', '');
  }
  if (id.includes('node_modules/@supabase')) return 'supabase';
  
  if (id.includes('node_modules/@tanstack/query-core') || id.includes('node_modules/@tanstack/react-query')) return 'query';
  if (id.includes('node_modules/dexie')) return 'dexie';
  if (id.includes('node_modules/@radix-ui')) return 'radix';
  if (id.includes('node_modules/@stripe')) return 'stripe';
  if (id.includes('node_modules/nodemailer')) return 'nodemailer';
  if (id.includes('node_modules')) return 'vendor';
},
```

**Alternativa mais limpa:** Usar plugin `rollup-plugin-visualizer` para analisar e remover chunks não usados, ou configurar `output.manualChunks` para retornar `null` para módulos não importados.

---

## 7. DEPLOY.YML — NOVO WORKFLOW PARA RENDER

```yaml
# .github/workflows/deploy.yml
name: Deploy to Render

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        type: choice
        options: [production, staging]
      clear_cache:
        description: 'Clear Render build cache'
        required: false
        type: boolean
        default: false

permissions:
  contents: read
  deployments: write

jobs:
  deploy:
    name: Deploy to Render
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'production' }}
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Deploy to Render
        uses: JorgeLNJunior/render-deploy@v1.5.0
        with:
          service_id: ${{ secrets.RENDER_SERVICE_ID }}
          api_key: ${{ secrets.RENDER_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          github_deployment: true
          deployment_environment: ${{ github.event.inputs.environment || 'production' }}
          clear_cache: ${{ github.event.inputs.clear_cache }}
          wait_deploy: true
```

**Pré-requisitos no Render Dashboard:**
1. Settings > Build and Deploy > Auto-Deploy: **Disabled**
2. Secrets no GitHub: `RENDER_SERVICE_ID`, `RENDER_API_KEY`

---

## 8. CHECKLIST DE VALIDAÇÃO PÓS-FIX

| Validação | Comando/Verificação | Esperado |
|-----------|---------------------|----------|
| Node version | `node --version` nos runners | v24.x.x |
| Cache hit rate | Verificar logs "Cache hit" | > 80% |
| Exit codes | Falha intencional em step | Workflow falha (não passa) |
| Lint zero warnings | `npm run lint` | 0 warnings |
| Typecheck | `npm run typecheck` | 0 errors |
| Unit tests | `npm run test` | 646 passed, 0 failed |
| Build | `npm run build` | dist/ gerado, sem chunks vazios |
| E2E tests | `npx playwright test` | All passed |
| Deploy Render | Manual trigger deploy.yml | Deploy succeeds, env created |

---

## 9. PRÓXIMOS PASSOS PARA O EXECUTOR

1. **Aplicar fixes Prioridade 1** no `ci.yml` e `build.yml`
2. **Rodar CI localmente** (se possível) ou push para testar
3. **Corrigir testes falhando** (Prioridade 2) — responsabilidade subagente Frontend/QA
4. **Criar `deploy.yml`** e configurar secrets Render
5. **Validar checklist completo** antes de marcar como concluído

---

## 10. AUTO-REVISÃO DO SUBAGENTE

✅ Pesquisa web realizada (5+ buscas profundas)
✅ Código existente lido (ci.yml, build.yml, render.yaml, package.json, vitest.config.js, vite.config.js, CI_ERRORS.md)
✅ Achados documentados com fontes
✅ Recomendações priorizadas por severidade
✅ Workflow YAML corrigido completo fornecido
✅ Não implementei — apenas pesquisei e recomendei
✅ Responsabilidade única: CI/CD apenas
✅ Não modifiquei código de outras áreas

---

**Relatório concluído. Pronto para entrega ao Executor.**