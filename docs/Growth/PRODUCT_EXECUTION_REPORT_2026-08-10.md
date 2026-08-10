# FINANCIABR.ME — Product Execution Report

**Data:** 2026-08-10
**Ciclo:** execução do plano produto → primeiro cliente

## Status

- **Product readiness:** médio-alto. O produto tem fluxo claro de registro e Dashboard, mas primeiro valor ainda é uma hipótese medida, não uma métrica histórica.
- **UX readiness:** médio-alto. Cadastro, onboarding, checklist de primeira venda e estados vazios existem; falta observar usuários reais.
- **Commercial readiness:** médio. Preços recorrentes foram alinhados com a fonte Stripe e termos foram atualizados, mas revisão jurídica continua pendente.
- **Acquisition readiness:** inicial. Existe roteiro de abordagem e experimento de baixo custo; ainda não há resultados de contatos reais.
- **B2B readiness:** inicial. White-label tem código e oferta interna, mas não tem operação de parceiro validada.

## Executado

- Criadas as migrations `supabase/migrations/20260810110357_product_funnel_events.sql` e `supabase/migrations/20260810111527_product_events_user_index.sql`.
- Migration aplicada no projeto Supabase `kxeqhorxhlgwcgywovqr`.
- Criado `src/lib/analytics.js` com eventos whitelisted, fila offline, limite de fila e propriedades sanitizadas.
- Instrumentados landing view, cliques de CTA, início/conclusão de cadastro, onboarding, primeira venda, retorno, checkout e pagamento.
- Primeiro valor operacional definido como **primeira venda**, com classificação **HIPÓTESE validável**.
- Termos atualizados de dois para três planos e de Pro R$ 70 para Pro R$ 49,90 / Premium R$ 99,90.
- `_shared/stripe.ts` alinhado de white-label R$ 997 para R$ 497, compatível com `create-payment` e a oferta pública do código.
- Política de Privacidade passou a mencionar eventos agregados de funil sem conteúdo financeiro, nome ou e-mail no evento.
- Criado `docs/Growth/COMMERCIAL_PLAYBOOK.md` com pitch, demo, objeções e experimentos.

## Evidências

- `supabase_list_tables`: confirmou `product_events` com RLS habilitado no projeto remoto.
- `supabase_apply_migration`: migration aplicada com sucesso.
- `supabase_execute_sql`: `product_events` está vazio após a aplicação; ainda não houve tráfego de produção instrumentado.
- `supabase_get_advisors`: nenhuma nova falha crítica de RLS; o advisor existente continua apontando proteção contra senhas vazadas desativada e índices de tabelas antigas. O índice de `product_events.user_id` foi adicionado após o alerta de chave estrangeira sem índice.
- `src/lib/constants.js:104-123`: preços exibidos ao usuário.
- `supabase/functions/_shared/stripe.ts:6`: preços recorrentes usados para criar/resolver Prices.
- `supabase/functions/create-payment/index.ts:12`: white-label em R$ 497.
- `src/features/dashboard/Dashboard.jsx:111-155`: checklist e primeiro passo observável.
- `src/features/transactions/useTx.js:10-22`: ponto real de criação de venda, usado para `first_value`/`first_sale`.
- `src/shared/hooks/useStripeCheckoutInit.js`: ponto de sucesso do checkout.

## Métricas Agora Disponíveis

Eventos em `public.product_events`:

| Evento | Disparo |
|---|---|
| `landing_view` | montagem da landing |
| `landing_cta_click` | CTA com placement hero/pricing/final |
| `signup_start` | aba de cadastro ativa |
| `signup_complete` | Supabase aceita o cadastro |
| `onboarding_started` | montagem do onboarding |
| `onboarding_complete` | dados do onboarding salvos |
| `first_value` | primeira transação de entrada criada |
| `first_sale` | mesma primeira venda, com origem |
| `return` | primeiro carregamento autenticado do dia |
| `checkout_started` | botão de plano pago/upgrade acionado |
| `payment_success` | checkout conclui pagamento |
| `subscription_active` | sucesso de assinatura recorrente |

Propriedades permitidas são strings curtas, números finitos e booleanos; não são enviados nome, e-mail, descrição de transação, valor financeiro ou IP. Usuários comuns só têm permissão de `insert`; não existe política de leitura para `anon` ou `authenticated`.

Consulta administrativa futura:

```sql
select event_name, count(*)
from public.product_events
where created_at >= now() - interval '30 days'
group by event_name
order by event_name;
```

## Experimentos

- **Primeiro cliente:** 10 negócios presenciais; oferta Free assistida; medir respostas, demos, cadastro, primeira venda, D7, checkout e pagamento.
- **Posicionamento:** comparar mensagem “venda offline + resultado da semana” contra “vendas, despesas e estoque em um app”; critério é primeira venda por cadastro.
- **White-label:** 10 contadores/consultores; medir reuniões e pedidos de proposta antes de construir painel de parceiros.

Detalhes e critérios estão em `docs/Growth/COMMERCIAL_PLAYBOOK.md`.

## Validação Técnica

- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npx eslint` nos arquivos alterados: passou.
- `npm run build`: passou em 1m40s, incluindo geração do service worker.
- Testes direcionados de planos e onboarding: 44 passaram.
- Suíte completa: 974 passaram e 47 falharam em setup/isolation pré-existente (`document.documentElement`, IndexedDB e hooks de swipe/plan effects); nenhuma falha foi associada aos arquivos de analytics, pricing ou Termos.

## Decisões

### Fatos verificados

- Stripe compartilha preços recorrentes de 4990 e 9990 centavos no utilitário comum.
- Frontend e `create-payment` compartilham white-label de 49700 centavos.
- O banco remoto agora recebe apenas eventos de funil permitidos e sem PII direta.
- A primeira venda é o ponto real em que uma transação de entrada é persistida.

### Inferências

- Primeira venda é o melhor proxy operacional de primeiro valor porque é o primeiro evento que alimenta Dashboard, saldo e relatórios.
- Eventos first-party são suficientes para validar o funil inicial sem adicionar ferramenta de publicidade ou perfilamento.

### Hipóteses

- Offline é mais persuasivo para negócios presenciais com conexão irregular.
- O usuário aceita R$ 49,90/mês após perceber valor com dados próprios.
- Contadores/consultores são parceiros iniciais mais plausíveis que agências genéricas.

## Bloqueios Humanos

- Aprovação jurídica dos Termos e Política atualizados.
- Confirmação final da oferta comercial e política de reembolso.
- Autorização para depoimentos e prova social reais.
- Execução dos contatos com potenciais clientes e parceiros.

## Oportunidades Não Implementadas

- Dashboard administrativo de conversão sobre `product_events`.
- Demo mode reproduzível dentro do app.
- Página dedicada para parceiros.
- Domínio, painel e suporte white-label.

Essas ações aguardam dados do experimento ou decisão comercial; não foram construídas por antecipação.

## Próxima Ação de Maior Impacto

Executar o experimento de 10 negócios, observar o funil instrumentado e revisar a mensagem com base em primeira venda e retorno D7, não em preferência visual.
