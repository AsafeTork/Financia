# TEMPLATE — Commit Conventional

> Copie e preencha. Sempre use conventional commit fromat.

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type
- `feat:` — Nova funcionalidade (visível ao usuário)
- `fix:` — Bug fix
- `perf:` — Melhoria de performance (com métrica de melhoria)
- `refactor:` — Reestruturação sem mudança de comportamento
- `docs:` — Só documentação
- `chore:` — Manutenção (deps, scripts, CI)
- `test:` — Adicionar/mudar testes
- `ci:` — Mudanças CI/CD

## Scope (opcional)
- Área específica (ex.: `auth`, `sync`, `.transactions`, `ui`)
- Arquivo principal se múltiplos (ex.: `vite.config.js`)

## Subject (obrigatório)
- Máximo 50 caracteres
- Imperativo, presente: "fix" não "fixed" ou "fixes"
- Sem letra maiúscula inicial
- Sem ponto no final

## Body (opcional, mas recomendado)
- Por que a change?
- O que mudou exatamente?
- Métrica de sucesso (ex.: "INP 320ms → 185ms")

## Footer (opcional)
- `BREAKING CHANGE:` se quebra backward compat
- `Closes #123` se resolve issue
- `Refs #456` se relacionado

---

## Exemplos

```
feat(tx): add pull-to-refresh on transactions list

- Triggers refresh when user pulls down on list
- Uses Dexie自动 reinicializa sync loop
- Shows badge while refreshing with indicator

Closes #247
```

```
fix(rls): use (SELECT auth.uid()) em storage.objects

- Bare `auth.uid()` reavaliado por linha → 19x lento
- Políticas agora usam subquery (SELECT) → single evaluation
- Benchmark: upload/download 100ms → 6ms médio

Fixes security advisory #38
```

```
perf(vite): reduce chunk size by 42%

- Manual chunks consolidated (vendor, react, utils)
- Removed empty chunks from Supabase EF builds
- Lighthouse: bundle size 410KB → 235KB gzipped
```
