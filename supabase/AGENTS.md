# AGENTS.md — supabase/ (Edge Functions & Migrations)

Regras específicas deste diretório. Complementam o `AGENTS.md` da raiz — lidas
automaticamente ao trabalhar aqui. Área de **maior risco** do projeto (auth,
pagamentos, RLS): mudanças críticas exigem revisão adversarial (raiz §4).

## Migrations

- Toda mudança de schema via arquivo em `supabase/migrations/` — **nunca só no
  dashboard** (causa drift; já houve 35 migrations não trackeadas).
- Nome: `YYYYMMDD_descricao_snake_case.sql`. Nunca edite migration já aplicada —
  crie uma nova.
- Migration destrutiva (DROP, DELETE, ALTER de tipo) exige justificativa explícita
  na entrega.

## RLS (Row Level Security)

- **Sempre** `(SELECT auth.uid())` — bare `auth.uid()` é reavaliado por linha
  (19x mais lento).
- Tabela nova sem policy = acesso negado por padrão (correto). Não "corrija"
  abrindo `USING (true)` sem justificativa.
- `service_role` bypassa RLS — policies em tabelas só acessadas via service_role
  são código morto (remova).

## Edge Functions (Deno)

- Padrões obrigatórios em `supabase/functions/_shared/`:
  - `withLogging` + `safeErrorResponse` — nunca vaze stack trace em erro 500.
  - `enforceRateLimit` é **fail-closed** — não reverter para fail-open.
  - `corsResponse` unificado para CORS.
- Funções admin: verificar role no JWT, nunca confiar em input do cliente.
- **Impersonation**: tokens short-lived (5min) com `act` claim (RFC 8693), só em
  memória no frontend — nunca em URL hash, localStorage ou refresh_token.
- Um handler por função — cuidado com `Deno.serve` duplicado ao editar.

## Segredos

- Nunca commitar `.env`, service keys ou tokens. Config de runtime via
  `supabase secrets set` e `current_setting('app.*')` no SQL.
