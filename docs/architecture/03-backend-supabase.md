# Backend — Supabase

## Stack

PostgreSQL 17 + Supabase (Auth, RLS, Edge Functions, Storage, Realtime).

## Projeto

| Campo | Valor |
|-------|-------|
| ID | `kxeqhorxhlgwcgywovqr` |
| Regiao | sa-east-1 |
| URL | `https://kxeqhorxhlgwcgywovqr.supabase.co` |
| Dashboard | `https://supabase.com/dashboard/project/kxeqhorxhlgwcgywovqr` |

## Tabelas

### `company_profiles` (perfil + branding)

| Coluna | Tipo | Default | Notas |
|--------|------|---------|-------|
| `user_id` | uuid PK | — | FK auth.users |
| `name` | text | — | Nome da empresa |
| `email` | text | — | |
| `logo` | text | — | Letra inicial (fallback) |
| `color` | text | — | Cor primaria hex #RRGGBB |
| `color_secondary` | text | null | Cor secundaria |
| `color_accent` | text | null | Cor de destaque |
| `theme` | text | 'light' | 'light' ou 'dark' |
| `logo_url` | text | null | URL Storage ou data URI |
| `phone` | text | — | Telefone WhatsApp |
| `niche` | text | null | Segmento |
| `white_label` | boolean | false | Pacote de personalizacao ativo |
| `custom_palette` | boolean | false | Usuario definiu paleta manual |
| `visual_version` | integer | 0 | Cache busting |
| `plan` | text | 'free' | 'free', 'pro', 'premium' |
| `plan_expires_at` | timestamptz | null | Expiracao do plano |
| `plan_activated_by` | text | null | Quem ativou |
| `custom_price_cents` | integer | null | Desconto generico |
| `custom_price_cents_pro` | integer | null | Desconto Pro |
| `custom_price_cents_premium` | integer | null | Desconto Premium |
| `custom_price_cents_white_label` | integer | null | Desconto White-label |
| `updated_at` | timestamptz | — | Timestamp ultima alteracao |

**CHECK constraints**: `plan IN ('free','pro','premium')`, cores em formato `#RRGGBB`.

### `transactions` (lancamentos)

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `type` | text | 'income' ou 'expense' |
| `description` | text | |
| `amount` | numeric | |
| `date` | date | |
| `method` | text | |
| `category` | text | |
| `items` | text | |
| `registered_by` | text | |

### `products` (estoque)

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `name` | text | |
| `category` | text | |
| `price` | numeric | |
| `cost` | numeric | |
| `stock` | integer | |
| `created_at` | timestamptz | |

### `losses` (perdas)

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `description` | text | |
| `qty` | integer | |
| `reason` | text | |
| `date` | date | |

### `user_roles`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `user_id` | uuid FK | |
| `role` | text | 'admin' ou 'client' |

### `impersonation_sessions`

Tabela de controle para impersonacao admin. Limpa por cron a cada 1min.

### `ai_cache`

Cache + rate-limit da integracao de IA (modo palette, email, insights).

## RLS (Row Level Security)

TODAS as tabelas tem RLS habilitado. Isolamento por `auth.uid() = user_id`.

### Policies principais

| Tabela | Policy | Regra |
|--------|--------|-------|
| `company_profiles` | `select_own_or_admin` | SELECT: owner OU admin |
| `company_profiles` | `update_own_branding_only` | UPDATE: owner, plan protegido, branding so se white_label OU admin |
| `company_profiles` | `admin_delete_profiles` | DELETE: owner OU admin |
| `transactions/products/losses` | CRUD | Owner: `auth.uid() = user_id` |
| `storage.objects` (bucket `logos`) | CRUD | Pasta = `auth.uid()` OU admin |

### Policy de branding (endurecida)

```sql
-- update_own_branding_only: WITH CHECK
auth.uid() = user_id
AND plan nao mudou
AND plan_expires_at nao mudou
AND plan_activated_by nao mudou
AND (
  branding_fields nao mudaram
  OR white_label = true
  OR existe admin role
)
```

## Triggers

| Trigger | Quando | O que faz |
|---------|--------|-----------|
| `prevent_plan_change()` | BEFORE UPDATE | Bloqueia alteracao direta de plan/plan_expires_at/plan_activated_by. Permite apenas quando `app.allow_plan_change = '1'` (setado por RPCs SECURITY DEFINER) |
| `guard_white_label()` | BEFORE UPDATE | Reverte `white_label` para valor antigo se caller nao for service_role |
| `handle_new_user()` | AFTER INSERT auth.users | Cria company_profiles + user_roles automaticamente |

## Funcoes RPC (SECURITY DEFINER)

| Funcao | Quem chama | O que faz |
|--------|-----------|-----------|
| `set_client_plan(a_target, b_plan, c_actor)` | Admin | Altera plano + expiracao (31 dias). Valida role=admin |
| `stripe_activate_plan(p_user, p_plan, p_expires)` | service_role | Ativa plano apos pagamento Stripe |
| `set_white_label(target_uid, enabled)` | Admin (via Edge Function) | Ativa/desativa white-label |
| `admin_impersonate_start(target_uid)` | Admin | Gera senha temporaria |
| `admin_impersonate_restore(target_uid)` | Admin | Restaura senha original |
| `admin_delete_client(target_uid)` | Admin | Deleta dados + auth.users |
| `admin_set_custom_price(...)` | Admin | Define preco customizado por plano |
| `admin_db_stats()` | Admin | Estatisticas do banco |
| `admin_client_usage()` | Admin | Uso por cliente |

> Prefixos `a_/b_/c_` sao obrigatorios: PostgREST serializa JSON em ordem alfabetica.

## Edge Functions (Deno)

### Stripe

| Funcao | Rota | O que faz |
|--------|------|-----------|
| `create-subscription` | POST | Cria/gerencia assinatura mensal |
| `cancel-subscription` | POST | Agenda cancelamento no fim do periodo |
| `create-setup-intent` | POST | SetupIntent para adicionar cartao |
| `set-default-payment-method` | POST | Define cartao padrao |
| `get-payment-method` | POST | Retorna bandeira + 4 finais |
| `remove-payment-method` | POST | Remove cartao + cancela assinatura |
| `get-subscription-status` | POST | Status da assinatura |
| `stripe-config` | POST | Retorna publishable key |
| `stripe-webhook` | POST | Webhook Stripe (ativacao, cancelamento, falhas) |
| `create-payment` | POST | PaymentIntent pagamento unico (white-label R$497) |

### Admin

| Funcao | Rota | O que faz |
|--------|------|-----------|
| `admin-stripe-overview` | POST | Saldo Stripe + MRR |
| `admin-set-custom-price` | POST | Preco customizado por plano |
| `admin-set-white-label` | POST | Ativa/desativa white-label |
| `admin-create-client` | POST | Cria usuario + perfil |
| `send-custom-email` | POST | Email customizado via SMTP |

### Outras

| Funcao | Rota | O que faz |
|--------|------|-----------|
| `ai` | POST | Proxy para IA (Deepseek/OpenAI) com cache + rate-limit |
| `stripe-config` | POST | Retorna publishable key |

### Shared (`_shared/`)

| Arquivo | O que faz |
|---------|-----------|
| `security.ts` | Sanitizacao (UUID, email, hex, plan_id, URL), rate-limit, cache, `getAdminClient()` |
| `mailer.ts` | Envio de email via SMTP (nodemailer) |

## Storage

### Bucket `logos`

- **Tipo**: public read, authenticated write
- **Path**: `{user_id}/logo.{ext}`
- **Formatos**: PNG, JPEG, WebP, SVG
- **Max**: 2MB
- **RLS**: pasta = auth.uid() OU admin
- **Public URL**: `sb.storage.from('logos').getPublicUrl(path)`

## Migracoes (18 arquivos)

```
supabase/migrations/
  20260609_add_plan_to_company_profiles.sql
  20260609_rls_admin_read_profiles.sql
  20260609_rls_admin_delete_client.sql
  20260609_fix_plan_protection.sql
  20260624_audit_harden_admin_gates.sql
  20260624_impersonation_cron.sql
  20260624_impersonation_security.sql
  20260624_stripe_activate_plan.sql
  20260626000000_white_label_addon.sql
  20260626000001_harden_guard_white_label.sql
  20260628_allow_premium_plan.sql
  20260629_admin_custom_price_and_db_stats.sql
  20260701154000_add_ai_cache_rate_limit.sql
  20260701183500_plan_specific_discounts.sql
  20260703000000_fix_set_client_plan_expiry.sql
  20260705_harden_security.sql
  20260705_add_idx_products_user_id.sql
  20260706180000_white_label_discount.sql
  20260707000000_visual_version_custom_palette.sql
```

> `prevent_plan_change()` e `handle_new_user()` existem no banco mas NAO tem migration versionada. Risco de reprodutibilidade.

## Supabase Client (frontend)

```js
import { sb } from './lib/supabase.js';

// Queries normais (RLS filtra automaticamente)
const { data, error } = await sb.from('transactions').select('*').eq('user_id', uid);

// RPCs privilegiados
const { error } = await sb.rpc('set_client_plan', { a_target: uid, b_plan: 'pro', c_actor: 'admin' });

// Storage
const { error } = await sb.storage.from('logos').upload(path, file, { upsert: true });
const { data } = sb.storage.from('logos').getPublicUrl(path);

// Edge Functions
const res = await sb.functions.invoke('create-subscription', { body: payload });
```

## Realtime

Subscricoes em `useRealtime.js`:
- `transactions` (INSERT/UPDATE/DELETE)
- `products` (INSERT/UPDATE/DELETE)
- `losses` (INSERT/UPDATE/DELETE)
- `company_profiles` (UPDATE) — dispara `runSync()` com debounce 800ms
