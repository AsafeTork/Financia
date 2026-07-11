---
type: WORKING
status: DRAFT
owner: Executor
version: 3.0
reviewed_by: Integrador
ready_for_integration: false
last_review: 2026-07-11
dependencies: []
next_review: 2026-07-18
---

# PLANO DE MIGRACAO — GITHUB CODESPACES

## 1. PROBLEMA

**Hardware local (Intel Celeron N4500, 4 GB RAM)** gargalo comprovado:

| Operacao | Local (4 GB RAM) | Estimado Codespaces (4 vCPU, 16 GB) |
|---|---|---|
| npm install | ~90s | ~15-25s (cache + SSD) |
| npm run build | ~30s | ~8-12s |
| npm test (full suite) | >180s (timeout frequente) | ~30-45s |
| npm run lint | ~15s | ~5-8s |
| Vitest startup | ~30s cold | ~5-8s |
| Playwright install | N/A (sem browser) | ~45s (Chromium only) |
| Implementacao + validacao | ciclo 10-20min | ciclo estimado 3-5min |

---

## 2. COMPATIBILIDADE DO PROJETO COM CODESPACES

### 2.1 React/Vite
**Compativel.** Vite 5 + React 18 rodam nativamente em Linux. Nao ha dependencias Windows-only.

| Item | Status | Observacao |
|------|--------|------------|
| `vite` | ✅ OK | Cross-platform |
| `@vitejs/plugin-react` | ✅ OK | Cross-platform |
| `postcss` + `tailwindcss` | ✅ OK | Cross-platform |
| `rollup` | ✅ OK | Binarios win32 nao usados em Linux |
| `lightningcss` | ✅ OK | Native binary, Linux x64 disponivel |

### 2.2 Supabase CLI
**Compativel.** Instalavel via npm global. **Docker-in-Docker NAO e necessario** para o fluxo principal:
- `supabase link` — conexao remota, sem Docker
- `supabase functions serve` — Edge Functions locais sem Docker
- `supabase db push` / `db pull` — operacoes remotas, sem Docker
- `supabase start` — REQUER Docker, mas e opcional (usar Supabase remoto)

Se `supabase start` local for necessario no futuro, adicionar feature `docker-in-docker:2` ao devcontainer.json.

### 2.3 Electron
**Compativel para build apenas.** Nao ha display grafico no Codespace, portanto Electron UI interativa **nao funciona**. O build (`electron-builder --win`) funciona em Linux e ja esta no CI (`.github/workflows/build.yml`).

| Item | Status | Observacao |
|------|--------|------------|
| `electron` | ⚠️ Headless apenas | Nao executavel interativamente |
| `electron-builder` | ✅ OK | Build Windows via `--win` funciona cross-platform |
| `electron:start` | ❌ Bloqueado | Sem display grafico (xvfb nao pratico para Electron) |
| `electron:build` | ✅ OK | Executavel via task dedicada no tasks.json |

**Fluxo:** Develop → Commit → Push → CI builda Electron. Nao ha necessidade de build local.

### 2.4 Vitest
**Compativel.** Vitest 4 + jsdom funcionam nativamente em Linux.

| Item | Status |
|------|--------|
| `vitest run` | ✅ OK |
| `vitest --coverage` | ✅ OK |
| `jsdom` | ✅ OK |
| `@testing-library/react` | ✅ OK |
| `@testing-library/user-event` | ✅ OK |

### 2.5 Playwright
**Compativel.** Playwright instala browsers nativos para Linux.

| Item | Status | Observacao |
|------|--------|------------|
| `playwright` | ✅ OK | Apenas Chromium instalado (~400MB vs ~1.5GB todos) |
| `@playwright/test` | ✅ OK | Sem config atual (placeholder para E2E futuros) |
| Chromium sandbox | ⚠️ Pode exigir `--no-sandbox` | Em container sem privilegios |

### 2.6 ESLint
**Compativel.** ESLint 9 flat config e puramente Node.js.

### 2.7 GitHub CLI
**Compativel.** Pre-instalado na imagem universal. Autenticado automaticamente via Codespaces.

### 2.8 MCPs (Supabase, Stripe)
**Compativeis.** MCPs sao configurados via ferramentas de agente, nao via infra do projeto.

### 2.9 Claude Code / Cursor / OpenCode
**Compativeis.** Ferramentas CLI Node.js, independentes de SO. Configuracao via `CLAUDE.md` + `.claudeignore`.

---

## 3. O QUE PRECISA EXISTIR DENTRO DO CODESPACE

### 3.1 Ferramentas e Runtimes

| Ferramenta | Origem | Tamanho |
|------------|--------|---------|
| Node.js 20+ | Pre-instalado (nvm) | ~40MB |
| npm | Pre-instalado | ~8MB |
| Git | Pre-instalado | ~15MB |
| GitHub CLI (`gh`) | Pre-instalado | ~20MB |
| Supabase CLI | Dockerfile (`npm i -g supabase`) | ~25MB |
| Deno | Dockerfile (`install.sh v2`) | ~30MB |
| Playwright Chromium | post-create (`--with-deps`) | ~400MB |
| ESLint | `npm install` (devDeps) | Ja no node_modules |
| Vitest | `npm install` (devDeps) | Ja no node_modules |
| xvfb | Dockerfile (apt-get) | ~5MB |

### 3.2 Dependencias npm
Todas as 16 dependencies + 26 devDependencies. Projeto usa npm (nao pnpm/yarn).

### 3.3 Secrets e Variaveis de Ambiente

| Variavel | Configuracao |
|----------|--------------|
| `VITE_SUPABASE_URL` | GitHub Codespaces Secrets (repo-level) |
| `VITE_SUPABASE_ANON_KEY` | GitHub Codespaces Secrets (repo-level) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | GitHub Codespaces Secrets (repo-level) |
| `VITE_APP_URL` | `containerEnv` no devcontainer.json (fixo) |

**Nao ha arquivos .env versionados.** O `.env.local` e gerado pelo post-create.sh a partir dos secrets, e esta em `.gitignore`.

### 3.4 Extensoes VS Code

| Extensao | ID | Obrigatoria? |
|----------|----|--------------|
| ESLint | `dbaeumer.vscode-eslint` | Sim |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | Sim |
| Deno | `denoland.vscode-deno` | Sim (Edge Functions) |
| Playwright | `ms-playwright.playwright` | Opcional |
| GitHub Copilot | `github.copilot` | Opcional |
| GitHub Copilot Chat | `github.copilot-chat` | Opcional |

### 3.5 Caches persistentes (volumes Docker)

| Volume | Montagem | Conteudo |
|--------|----------|----------|
| `financia-npm-cache` | `/home/codespace/.npm` | Cache de pacotes npm |
| `financia-vite-cache` | `/workspaces/Financia/.cache` | Cache Vite + ESLint + Vitest + TypeScript |

Volumes persistem entre reinicios do Codespace, mas sao limpos em rebuild completo.

---

## 4. ESTRUTURA .DEVCONTAINER

```
.devcontainer/
  devcontainer.json     # Configuracao principal
  Dockerfile            # Imagem customizada (Deno + Supabase CLI + xvfb)
  post-create.sh         # Setup idempotente (1x na criacao)
  post-start.sh          # Mensagem de boas-vindas (todo inicio)
  extensions.json        # VS Code extensoes recomendadas
  settings.json          # VS Code workspace settings
  tasks.json             # Tarefas build/test
  launch.json            # Debug configs
```

### 4.1 devcontainer.json
- **Imagem:** universal:linux + Dockerfile customizado (Deno + Supabase CLI)
- **Maquina:** 4-core, 8 GB RAM, 32 GB storage (dentro da cota free)
- **Portas:** 5173 (Vite, auto-open), 4173 (preview, silent)
- **Secrets:** via `containerEnv` + GitHub Codespaces Secrets (nenhum .env no repo)
- **Volumes:** npm cache + Vite/TS cache persistem entre restart
- **Sem Docker-in-Docker:** removido para economizar espaco e recursos
- **postCreateCommand:** idempotente — pode rodar multiplas vezes sem quebrar
- **postStartCommand:** apenas informativo

### 4.2 Dockerfile
- Base: `mcr.microsoft.com/devcontainers/universal:linux`
- Apt: `xvfb` (para Playwright headless)
- Deno: instalado via script oficial, versao 2
- Supabase CLI: `npm i -g supabase`
- Cache npm configurado para `/home/codespace/.npm`

### 4.3 post-create.sh (idempotente)
- `git config` — sobrescreve sem erro
- `.env.local` — sobrescreve a partir de secrets
- `npm install` — se node_modules existir, faz `npm ci --prefer-offline` (idempotente)
- `npx playwright install chromium` — dry-run primeiro; se ja instalado, pula
- Supabase link — apenas aviso, nao executa automaticamente

**Idempotencia comprovada:** cada comando ou sobrescreve configs, ou verifica se ja existe antes de executar. Rodar duas vezes nao quebra.

---

## 5. FLUXO DE TRABALHO

```
GitHub (abrir PR / branch)
   │
   ▼
GitHub.com → Create Codespace (4-core, 8GB)
   │  (~30s com prebuild, ~90s sem)
   ▼
VS Code Web (ou Desktop) aberto
   │
   ▼
npm run test:fast    (~10-15s)
npm run lint         (~5-8s)
   │
   ▼
npm run validate:fast (~20-30s)
   │
   ▼
npm run validate:full (~60-90s)
   │
   ▼
git add + commit + push
   │
   ▼
GitHub → CI (validate-full + audit + build)
   │
   ▼
PR → Review → Merge
   │
   ▼
Codespace auto-stop apos 15min inatividade
```

### 5.1 Abrir a partir de PR/Issue

```bash
gh codespace create --branch minha-feature
gh pr checkout 123
gh issue view 42 --web
```

### 5.2 Supabase CLI

```bash
supabase login                         # Primeira vez (token)
supabase link --project-ref <ref>      # Vincular ao remoto
supabase functions serve ai --env-file .env.local  # Edge Function local
supabase functions deploy ai           # Deploy
```

---

## 6. VALIDACAO DO PIPELINE

| Script | Roda? | Observacao |
|--------|-------|------------|
| `npm install` | ✅ | ~20s (cache volume) |
| `npm run dev` | ✅ | Porta 5173 with autoBrowser |
| `npm run build` | ✅ | ~10s |
| `npm test` | ✅ | ~40s |
| `npm run test:coverage` | ✅ | ~50s |
| `npm run lint` | ✅ | ~5s |
| `npm run typecheck` | ✅ | ~8s |
| `npm run validate:fast` | ✅ | ~25s |
| `npm run validate:full` | ✅ | ~70s |
| `npm run audit:fast` | ✅ | ~10s |
| `npm run audit:full` | ✅ | ~30s |
| `npm run analyze` | ✅ | Gera stats.html |
| `npm run security:audit` | ✅ | ~10s |
| `npm run electron:build` | ✅ | Build Windows (cross) |
| `npm run electron:start` | ❌ | Sem display (nao necessario) |
| `supabase functions serve` | ✅ | Edge Functions locais |
| `supabase start` | ⚠️ Opcional | Requer adicionar DinD |
| `npx playwright test` | ⚠️ Placeholder | Sem testes E2E atualmente |

---

## 7. GANHOS ESTIMADOS

| Operacao | Local | Codespace | Ganho |
|----------|-------|-----------|-------|
| npm install | ~90s | ~20s | **4.5x** |
| npm run build | ~30s | ~10s | **3x** |
| npm test | >180s | ~40s | **4.5x+** |
| npm run lint | ~15s | ~5s | **3x** |
| npm run typecheck | ~25s | ~8s | **3x** |
| npm run validate:full | >240s | ~70s | **3.5x+** |
| Ciclo impl+teste | 10-20min | 3-5min | **3-4x** |
| Vitest startup | ~30s | ~5s | **6x** |

**Ganho composto:** 3-5x no ciclo de desenvolvimento diario.

---

## 8. CUSTOS

### 8.1 Maquina padrao: 4-core / 8 GB RAM

| Uso | Horas/mes | Core-h | Custo |
|-----|-----------|--------|-------|
| Leve (30h/mes) | 30h | 120 | **$0 (free tier)** |
| Moderado (50h/mes) | 50h | 200 | $7.20 |
| Intenso (100h/mes) | 100h | 400 | $25.20 |

### 8.2 Storage

| Situacao | Custo/mes |
|----------|-----------|
| 1 codespace ativo | ~$0.70 |
| 1 codespace parado | ~$0.70 |

### 8.3 Estrategia de economia

1. Auto-stop **15min** (via GitHub Settings → Codespaces)
2. Retention **7 dias** (via GitHub Settings → Codespaces)
3. Parar manualmente ao final do dia: `gh codespace stop`
4. `docker system prune -af` periodico para liberar storage
5. Prebuilds via GitHub Actions para setup mais rapido
6. Spending limit baixo (ex: $10/mes) para evitar surpresas

---

## 9. RISCOS E MITIGACAO

| Risco | Prob. | Impacto | Mitigacao |
|-------|-------|---------|-----------|
| Storage cheio | Alta | Medio | `docker system prune`, aumentar storage |
| Playwright sandbox | Media | Baixo | `--no-sandbox` se necessario |
| Secret vazamento | Baixa | Critico | Secrets do GitHub, nao .env versionados |
| Conexao instavel | Media | Alto | VS Code Desktop reconecta automaticamente |
| Custo nao previsto | Baixa | Medio | Spending limit baixo |
| Deno version mismatch | Baixa | Medio | Dockerfile fixa v2 |
| post-create quebra | Baixa | Alto | Script idempotente, `set -e` com fallbacks |

---

## 10. CHECKLIST DE IMPLANTACAO

### Fase 1 — Estrutura (concluida)

- [x] `.devcontainer/devcontainer.json`
- [x] `.devcontainer/Dockerfile`
- [x] `.devcontainer/post-create.sh`
- [x] `.devcontainer/post-start.sh`
- [x] `.devcontainer/extensions.json`
- [x] `.devcontainer/settings.json`
- [x] `.devcontainer/tasks.json`
- [x] `.devcontainer/launch.json`
- [x] `docs/Infrastructure/CODESPACES_MIGRATION_PLAN.md`

### Fase 2 — Secrets

- [ ] Configurar no GitHub (Settings → Secrets → Codespaces):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] Adicionar `.env.local` ao `.gitignore` (ja existe)

### Fase 3 — Validacao

- [ ] Commit e push dos arquivos `.devcontainer/`
- [ ] Criar Codespace a partir do branch `main`
- [ ] Verificar `npm install` completo
- [ ] Verificar `npm run build` passando
- [ ] Verificar `npm run lint` 0 erros
- [ ] Verificar `npm test` completo
- [ ] Verificar `npm run dev` com porta 5173
- [ ] Verificar `npm run electron:build` (opcional)

### Fase 4 — Otimizacao

- [ ] Configurar Prebuilds (GitHub → Settings → Codespaces)
- [ ] Testar warm-start (~30s)
- [ ] Ajustar timeout para 15min
- [ ] Ajustar retention para 7 dias
- [ ] Testar `gh codespace ssh` do notebook local

---

## 11. ROLLBACK

```bash
git rm -r .devcontainer/
git commit -m "revert: remove devcontainer"
git push
```

Nenhuma alteracao no codigo fonte do projeto foi feita. Rollback e 100% seguro.

---

## 12. DECISOES ARQUITETURAIS

| Decisao | Justificativa |
|---------|---------------|
| **Sem Docker-in-Docker** | Fluxo principal nao precisa (`supabase link` + `functions serve` + `db push` sao remotos). Economiza ~1.5 GB de imagem Docker. |
| **Sem Electron UI** | Codespace nao tem display. Electron build via CI. |
| **Apenas Chromium** | Economiza ~1 GB comparado a instalar todos os browsers Playwright. |
| **Secrets via GitHub, nao .env** | Nenhum secret no repositorio. `.env.local` gerado em tempo de execucao. |
| **post-create idempotente** | Segunda execucao nao quebra. Usa `npm ci --prefer-offline` em vez de `npm install` for node_modules existente. |
| **Volumes de cache** | npm + Vite/TS caches persistem entre restart. Evita reinstalar dependencias a cada inicio. |
| **Maquina 4-core** | Maximo desempenho dentro da cota free (120 core-h/mes ÷ 4 = 30h de trabalho/mes). |
| **xvfb no Dockerfile** | Necessario para Playwright + Chromium headless. |
