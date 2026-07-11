---
type: REFERENCE
owner: Executor
version: 1.0
last_review: 2026-07-11
---

# CODESPACES RUNBOOK — FINANCIA

Runbook operacional para uso do GitHub Codespaces como ambiente principal de desenvolvimento.

---

## 1. CRIAR UM CODESPACE

### 1.1 Pela interface web

1. Acessar `https://github.com/gilma/financia`
2. Clicar em **Code** → **Codespaces** → **Create codespace on main**
3. Aguardar ~90s (build + setup)
4. VS Code Web abre automaticamente

### 1.2 Pelo GitHub CLI

```bash
# Criar a partir da branch atual
gh codespace create --branch <branch-name>

# Criar a partir de uma issue
gh codespace create --issue 42

# Listar codespaces ativos
gh codespace list
```

### 1.3 Abrir no VS Code Desktop (mais performatico)

```bash
gh codespace code
```

Ou: VS Code → Extensao "GitHub Codespaces" → Conectar

---

## 2. CONFIGURACAO DE SECRETS

**Uma vez por repositorio.** Os secrets sao injetados automaticamente no Codespace.

### 2.1 GitHub Web

1. `https://github.com/gilma/financia/settings/secrets/codespaces`
2. Adicionar:

| Nome | Valor |
|------|-------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |

### 2.2 Supabase CLI (primeira vez)

```bash
supabase login
# Abre browser para autenticar

supabase link --project-ref <project-ref>
# project-ref esta em supabase/.temp/project-ref
```

---

## 3. ABRIR O PROJETO

### 3.1 Ao iniciar o Codespace

O post-create.sh ja executa automaticamente:
- `git config` (user.name, user.email)
- `.env.local` criado a partir dos secrets
- `npm install` (ou `npm ci --prefer-offline` se node_modules existe)
- `npx playwright install chromium --with-deps` (se nao instalado)

### 3.2 Verificar ambiente

```bash
# Node
node --version  # Esperado: v20+

# npm
npm --version

# Supabase CLI
supabase --version

# Deno
deno --version

# Playwright
npx playwright --version

# Git
git config user.name
git config user.email
```

---

## 4. COMANDOS DIARIOS

### 4.1 Desenvolvimento

```bash
npm run dev              # Vite dev server (porta 5173)
```

O Codespace abre automaticamente o browser com `https://<hash>.githubpreview.dev`.

### 4.2 Validacao rapida (antes de commit)

```bash
npm run validate:fast
```

Executa: lint changed + typecheck changed + test changed (~20s).

### 4.3 Validacao completa

```bash
npm run validate:full
```

Executa: lint + typecheck + test + build (~70s).

### 4.4 Testes

```bash
npm test                 # Todos os testes (~40s)
npm run test:fast        # Testes sem isolate (~15s)
npm run test:changed     # Apenas arquivos alterados
npm run test:coverage    # Com cobertura
```

### 4.5 Lint

```bash
npm run lint             # Todos os arquivos
npm run lint:changed     # Apenas alterados
```

### 4.6 Typecheck

```bash
npm run typecheck              # Completo
npm run typecheck:changed      # Apenas alterados
```

### 4.7 Auditoria

```bash
npm run audit:changed    # Arquivos alterados
npm run audit:full       # Projeto completo
```

### 4.8 Build

```bash
npm run build            # Build Vite
npm run electron:build   # Build Electron (Windows) — opcional, ja no CI
```

---

## 5. GIT E GITHUB

```bash
# Status
git status
git diff

# Commit
git add -A
git commit -m "tipo: descricao concisa"

# Push (cria PR se for branch nova)
git push -u origin <branch>

# PR via CLI
gh pr create --fill
gh pr view --web

# Checkout PR de outro dev
gh pr checkout <numero>
```

---

## 6. SUPABASE

### 6.1 Producao (remoto, sem Docker)

```bash
# Edge Functions
supabase functions serve ai --env-file .env.local
supabase functions deploy ai

# Migrations
supabase db push
supabase db pull

# Tipos TypeScript
supabase gen types typescript --local > src/types/supabase.ts
```

### 6.2 Local (com Docker, opcional)

Se precisar rodar Supabase local:

1. Adicionar `docker-in-docker:2` ao `devcontainer.json`
2. Rebuild do Codespace
3. `supabase start` (leva ~2min, consome ~4GB de storage)

---

## 7. PARAR O CODESPACE

### 7.1 Para parar (salvar horas)

```bash
gh codespace stop
```

Ou: VS Code → Canto inferior esquerdo → "Codespaces: Stop Current Codespace"

### 7.2 Para verificar consumo

```bash
# Listar com status
gh codespace list

# Ver uso no mes
# https://github.com/settings/billing
```

### 7.3 Auto-stop configurado

- Inatividade: **15 minutos** (configuravel em GitHub → Settings → Codespaces)
- Retention apos stop: **7 dias** (configuravel)

---

## 8. RECRIAR AMBIENTE

### 8.1 Rebuild (mantem arquivos, recria container)

```bash
gh codespace rebuild
```

Ou: VS Code → "Codespaces: Rebuild Container"

### 8.2 Full rebuild (limpa Docker cache)

```bash
gh codespace rebuild --full
```

### 8.3 Novo Codespace (zero)

```bash
gh codespace delete
gh codespace create --branch main
```

---

## 9. ACESSO DO NOTEBOOK LOCAL

### 9.1 VS Code Desktop remoto

```bash
# Conectar ao Codespace ativo
code --remote codespace+<name> /workspaces/Financia
```

### 9.2 SSH

```bash
gh codespace ssh
```

### 9.3 Cursor

```bash
cursor --goto vscode-remote://codespace+<name>/workspaces/Financia/src
```

### 9.4 Copiar/baixar arquivos

```bash
# Copiar arquivo do Codespace para local
gh codespace cp remote:/workspaces/Financia/coverage/index.html ./coverage.html

# Copiar arquivo local para Codespace
gh codespace cp ./arquivo.local remote:/workspaces/Financia/
```

---

## 10. SOLUCAO DE PROBLEMAS

| Problema | Causa provavel | Solucao |
|----------|---------------|---------|
| `npm install` falha | Cache corrompido | `rm -rf node_modules package-lock.json && npm install` |
| `vitest` timeout | Maquina 2-core | Usar 4-core (`hostRequirements.cpus: 4`) |
| `supabase` nao encontrado | Dockerfile nao rebuildou | `gh codespace rebuild` |
| Deno nao encontrado | PATH nao atualizado | `export PATH="$HOME/.deno/bin:$PATH"` |
| Porta 5173 nao abre | Vite nao rodou | `npm run dev` |
| Git pede credenciais | Config faltando | `git config --global user.name "..."` |
| Espaco em disco cheio | Docker images + cache | `docker system prune -af`, depois `gh codespace rebuild --full` |
| Playwright timeout | Sem `--with-deps` | `npx playwright install chromium --with-deps` |
| `VITE_SUPABASE_URL` undefined | Secret nao configurada | Verificar GitHub → Settings → Codespaces secrets |
| Codespace lento | Maquina compartilhada | Criar novo Codespace |

---

## 11. BOAS PRATICAS

1. **Sempre parar** o Codespace ao final do expediente (`gh codespace stop`)
2. **Nao manter** multiplos Codespaces rodando simultaneamente
3. **Executar** `npm run validate:fast` antes de cada commit
4. **Usar** `git pull --rebase` em vez de `git merge`
5. **Nao modificar** `.devcontainer/` sem testar em Codespace novo
6. **Monitorar** storage mensal em `https://github.com/settings/billing`
7. **Secrets** nunca no codigo — so via GitHub Codespaces Secrets
8. **.env.local** e gerado automaticamente — nao editar manualmente

---

## 12. REFERENCIAS

- `docs/Infrastructure/CODESPACES_MIGRATION_PLAN.md` — Plano completo
- `.devcontainer/devcontainer.json` — Configuracao do ambiente
- `https://docs.github.com/en/codespaces` — Documentacao oficial
- `https://containers.dev/features` — Features disponiveis
