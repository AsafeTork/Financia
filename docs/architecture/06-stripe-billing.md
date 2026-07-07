# 06 — Stripe e Billing

> Como cobranças, assinaturas e white-label funcionam no Financia.

---

## Visão Geral

O Financia usa Stripe para dois fluxos de cobrança:

1. **Assinaturas recorrentes** — Pro (R$ 49,90/mês) e Premium (R$ 99,90/mês)
2. **White-label** — pagamento único de R$ 497 para personalização visual

Toda comunicação com o Stripe passa por **Edge Functions** (Deno/TypeScript) que rodam no Supabase com a `service_role` key. O frontend **nunca** toca a Stripe API diretamente.

---

## Arquitetura de Pagamento

```
Frontend (React)
  │
  ├─ StripeCheckout.jsx     → coleta cartão via Stripe Elements (PaymentElement)
  ├─ PlansView.jsx          → dispara checkout/upgrade
  ├─ SettingsView.jsx       → gerencia cartão salvo, cancela assinatura
  │
  ▼
Edge Functions (Deno/TypeScript)
  │
  ├─ create-subscription    → cria assinatura no Stripe
  ├─ cancel-subscription    → agenda cancelamento
  ├─ create-setup-intent    → adiciona/atualiza cartão
  ├─ set-default-payment-method → define cartão padrão
  ├─ get-payment-method     → retorna dados do cartão (brand, last4)
  ├─ remove-payment-method  → remove cartão
  ├─ get-subscription-status → status da assinatura
  ├─ create-payment         → PaymentIntent para white-label (R$ 497)
  ├─ stripe-webhook         → processa eventos do Stripe → ativa plano
  │
  ▼
Supabase (PostgreSQL)
  │
  ├─ stripe_activate_plan(p_user, p_plan, p_expires) → RPC SECURITY DEFINER
  │   └─ Seta plan + plan_expires_at + plan_activated_by = 'stripe'
  │
  └─ company_profiles
      ├─ plan                → 'free' | 'pro' | 'premium'
      ├─ plan_expires_at     → timestamptz
      └─ plan_activated_by   → 'admin' | 'stripe' | null
```

---

## Assinaturas (Pro/Premium)

### Fluxo de Assinatura

```
1. Usuário clica "Assinar Pro" no PlansView
2. Frontend chama sb.functions.invoke('create-subscription', { body: { plan_id } })
3. Edge Function:
   a. Busca ou cria customer no Stripe (metadata: user_id)
   b. Busca price_id via lookup_key (estável, não hardcode)
   c. Se sem assinatura → cria subscription com PaymentElement (default_incomplete)
   d. Se já tem assinatura → ajusta item existente (upgrade/downgrade)
   e. Suporta preço customizado (custom_price_cents_pro/premium)
4. Retorna { client_secret, subscription_id }
5. Frontend renderiza Stripe Elements com client_secret
6. Usuário confirma → Stripe processa → webhook stripe_activate_plan
```

### Fluxo de Cancelamento

```
1. Usuário clica "Cancelar" no SettingsView (aba Assinatura)
2. Frontend chama sb.functions.invoke('cancel-subscription', { body: {} })
3. Edge Function:
   a. Busca assinatura ativa
   b. set cancel_at_period_end = true (não cancela imediatamente)
   c. Retorna sucesso
4. Usuário mantém acesso até plan_expires_at
5. No fim do período → webhook → stripe_activate_plan(p_user, 'free', null)
```

### Setup Intent (Adicionar Cartão)

```
1. Usuário clica "Adicionar forma de pagamento"
2. Frontend chama sb.functions.invoke('create-setup-intent', { body: {} })
3. Edge Function cria SetupIntent no Stripe
4. Retorna client_secret
5. Frontend renderiza Stripe Elements (modo setup)
6. Usuário confirma → onSetupComplete → set-default-payment-method
```

---

## White-Label (Pagamento Único)

### Fluxo

```
1. Usuário compra white-label no PlansView (R$ 497)
2. Frontend chama sb.functions.invoke('create-payment', { body: {} })
3. Edge Function:
   a. Cria PaymentIntent no Stripe
   b. Se usuário já tem cartão salvo → permite off_session
   c. Admin paga R$ 0,01 (teste)
   d. Retorna client_secret
4. Após confirmação → webhook payment_intent.succeeded
5. Edge Function chama RPC set_white_label(uid, true)
6. Trigger guard_white_label permite (service_role)
7. company_profiles.white_label = true
```

### Após Ativação

- Cliente vê aba "Aparência" nas Configurações
- Pode editar cores primária, secundária, destaque e tema
- Pode fazer upload de logo
- Pode gerar APK personalizado

---

## Preços Customizados (Admin)

O admin pode definir descontos específicos por cliente:

```typescript
// admin-set-custom-price Edge Function
await admin
  .from('company_profiles')
  .update({ custom_price_cents_pro: 2990 })  // R$ 29,90 em vez de R$ 49,90
  .eq('user_id', targetUserId);
```

Se o cliente já tem assinatura ativa, ajusta o Price no Stripe com `proration_behavior: 'none'`.

Colunas:
- `custom_price_cents_pro` — preço Pro customizado
- `custom_price_cents_premium` — preço Premium customizado
- `custom_price_cents_white_label` — preço white-label customizado

---

## Webhook (stripe-webhook)

Endpoint público (`/functions/v1/stripe-webhook`) que recebe eventos do Stripe.

### Eventos Tratados

| Evento | Ação |
|--------|------|
| `checkout.session.completed` | Ativa plano conforme produto |
| `invoice.payment_succeeded` | Renova plano (`plan_expires_at + 31 dias`) |
| `invoice.payment_failed` | Notifica falha (e-mail) |
| `invoice.upcoming` | Envia lembrete de renovação |
| `payment_intent.succeeded` | Se white-label → `set_white_label(uid, true)` |
| `customer.subscription.updated` | Sincroniza status |
| `customer.subscription.deleted` | Rebaixa para free |

### Ativação de Plano

```sql
-- RPC stripe_activate_plan (SECURITY DEFINER, service_role only)
PERFORM set_config('app.allow_plan_change', '1', true);
UPDATE company_profiles SET
  plan = p_plan,
  plan_expires_at = p_expires,
  plan_activated_by = 'stripe'
WHERE user_id = p_user;
```

---

## Configuração

### Variáveis de Ambiente (Edge Functions)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://kxeqhorxhlgwcgywovqr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Lookup Keys (Stripe Dashboard)

| Lookup Key | Produto |
|------------|---------|
| `pro_monthly` | Assinatura Pro mensal |
| `premium_monthly` | Assinatura Premium mensal |

### Arquivos Relevantes

| Arquivo | Função |
|---------|--------|
| `src/lib/stripe.js` | Helpers de erro, tema Stripe Elements |
| `src/components/StripeCheckout.jsx` | Componente de checkout |
| `src/views/PlansView.jsx` | UI de planos e checkout |
| `src/views/SettingsView.jsx` | Gestão de cartão e cancelamento |
| `supabase/functions/stripe-webhook/` | Webhook handler |
| `supabase/functions/create-subscription/` | Cria assinatura |
| `supabase/functions/_shared/security.ts` | Sanitização + rate-limit |
| `supabase/functions/_shared/mailer.ts` | Envio de e-mails transacionais |

---

## Estado Conhecido

- Stripe está **ativo** (planos Pro e Premium disponíveis)
- White-label R$ 497 disponível como pagamento único
- Webhook configurado e processando eventos
- E-mails transacionais ativos (SMTP via nodemailer)
- Precos customizados por cliente funcionando
