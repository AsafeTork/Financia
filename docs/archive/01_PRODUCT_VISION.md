# 01 PRODUCT VISION

## Visão Geral do Produto

Financia é um **app de gestão financeira pessoal simplificado** e offline-first.
Mais que um simples controle de gastos, é uma maneira **simples de visualizar, gerenciar dinheiro e inventário** — sem interface de admin complicada e sincronização automática desperdiçando bateria.

**Tempo de uso**: Gerenciar ativos sem stream de sync infinito. Mostrar fluxos em tempo real, sem orphan cleanup e qualidade de regeneração.

## Problema Central

Usuários de apps pequenos, precisando de **controle total de transações sobre a gestão do account owner**, querem:
- **Um único, intuitivo fluxo de cashflow** para movimentos diários
- **Extensão do produto apenas para core finance** e não features de admin pré-engenharia
- **Gerenciamento offline-first** como default, não como opção
- **White-label gratuito**: ajuste de cores, nome e logo do cliente — mas sem editor de design.

## Estrutura Atual (Sobre-Engenharia)

| Domínio | Estado Atual | Estado Almejado |
|--------|-------------|---------------- |
| Emissão de conta | Impar via `profiles.user_metadata`, inconsistência incompleta com `session.user.metadata` | Um `usuário.perfil consolidado`, com escrita unilateral apenas na migração de auth da Supabase |
| Banco de dados | 4 tabelas + brand_presets; sync all + orchestrator N^2 + orphan cleanup | 2-3 tabelas, sync processual, sem cascade delete |
| Gerenciamento de plano | 3 planos + preços customizados, upgrade/downgrade e white-label | Apenas free vs Pro + white-label custom color/name/logo |
| UI principal | 5+ screens (dashboard, Income/Expense, inventário, Email, Relatório, Configurações, Planos, BrandStudio) | **1 é screen** de transação, **2 é screen** de inventory, **3 é painel de admin** |
| State hooks | 10+ hooks, 40+ estados | ~3-4 hooks de estado essencial |

## Features Essenciais (Core Product)

### Retângulo 1: Controle de Cashflow
- **Principais**
  - Entrada/saída – apenas fluxo simples de cashflow
  - Aprimoramento na gestão de categorias, tags multilinha e/ou uma dica aleatória de economia (\"desconto em mantimentos hoje\")
  - Exibido e exportado como junho, julho, agosto, ano e detalhamento personalizado de período por cliente (sem sorting complexo)
- **Excluído das features**
  - Recorrência (parcelamento)
  - Entrega e/ou pagamento de fatura
  - Livre de fatura no cartão (vendas por dispositivo)
  - Page de mercado

### Retângulo 2: Gerenciamento de Inventory de Produto
- **Principais**
  - Add/remove produto por nome, category e custo/preço de venda/perda
  - Stock tracking local, sem sync em background para cada movimento
  - Ver lucro/prejuízo e exportar
- **Excluído das features**
  - Reorder points
  - Multi-department/entry

### Retângulo 3: White-label Customization (Baseline)
- **Principais**
  - Cor primária, opcional secondary e accent por conta
  - Nome e opcional logo (apenas para estilização, não para upload APK)
  - Light theme, dark theme opcional
- **Excluído das features**
  - Temas prontos por segmento (8 presets)
  - Pacote de editor de identidade visual de 15 arquivos

### Retângulo 4: Controle de Admin (Futuro)
- **Principais**
  - Painel de acesso para atualização de plano, detalhes do usage, atribuição de plano de cliente a cada usuário
  - Aceitar/entregar white-label (cor, nome, logo)
  - Email e função app-convite para convidar novos clientes
- **Excluído das features**
  - Gamificação de nuvens, game-coin, ranking, plano de inscrição premium
  - Imersão completa do admin como outros usuários

## Fluxo de Usuário Simplificado

### Fluxo Principal (Usuário Logado)

**1. Transação** – fluxo simples de tupla

```
[Home/TxEntry Screen]
 Principais mais recente:
  • Entrada: +R$ 100 (Salário) - [%mês]
  • Saída: -R$ 50 (Mantimentos) - [%mês]
 Opções:
  • + Entrada / + Saída
  • Ver lista roll-out
  • Exportar CSV/JSON
```

**2. Inventory** – Stock control simples

```
[Inventory Screen]
 Tabela:
  • Caixa, R$ 2,00 cada, total 10
  • Detergente, R$ 5,00 cada, 20
  • Bananas, R$ 1,50 cada, 0 (acabou)
 Também atualizar:
  • Baixa – perder R$ 1,50 (perda)
  • Adicionar quantidade
  • Excluir prateleira

Ações:
  • + Produto
  • Exportar produto para lucro/prejuízo
```

**3. Admin** – Apenas painel de acesso principal

```
Dashboard:
  • Detalhes do Uso (transações efetivas, prateleira, etc)
  • Gerenciamento e upgrade de plano do cliente (free/pro)
  • Adicionar/editar cor branca
```

## Decisão Matriz

### Features Matrix
| Feature | Status | Justificativa |
|---------|--------|-----------|
| TxEntry (add/view) | Mantém | Controle financeiro essencial simples |
| Produtos (add/remove/stock) | Mantém | E-commerce essencial |
| Perdas (add/view/editar) | Exclui | O controle de perdas por si só (sem canais de receita) é redundante com saídas |
| Relatórios e Exportação | Mantém | Análise de cashflow sem luxo de cartas de saídas avançadas |
| Planos (free/pro) | Mantém | Modelo de receita só baseado na venda de pro |
| White-label (basic) | Mantém | Identidade customizada de cliente |
| BrandStudio (20+ files) | Exclui | Visual editor de design puro, avaliação separada para pequenos designers |
| Edição de tema (tags de tema, etc) | Exclui | Rebalanceamento de design, muito custoso para o core |
| Impressão E2E e Checkout/Stripe | Exclui | Usuários de fluxo de caixa que não precisam de pagamento OEM |
| Content roteiro de email | Exclui | Provavelmente um bloco inerte baixo nítido na interface do usuário |
| Impersonation complex (Admin👑Feature) | Exclui | Shu complex flow de Login corrente/None ou demons “impersonate user” |
| Sync auto (Debbuged orphan cleanup) | Exclui | Reduce churn de bateria |

### Arquitetura de Gerenciamento

| Requisito | Sistema Atual | LÍquido Destino |
|-------------|---------------|---------------- |
| Controle de autoridade de acesso | `auth/session` mismatch, features de impersonate | Um ‘profile uid consolidado, leitura APENAS da session.user.metadata (Supabase) |
| Sincronização DB | syncAll de 4 tabelas + syncProfiles n^2 + orphan cleanup | Leitura gravação Set de 2-3 tabelas + sync processual |
| Hooks | 10+ useHooks, 40+ estados interfaces | ~4 hooks, menos de 10 estados essenciais |
| UI | 5+ telas de abas, 100+ componentes | 1 TxEntry, 1 Inventory, 1 Admin (vertical) |
| Controle de 3º plano | 3 planos + Preço customizado, temas variados | Free vs Pro simples + kits de white-label |

## Roadmap de Implementação

### FASE 1: Core Essentials (MVP de cliente)

- **5-10 dias**
- Core\n  - Usar tabelas `transactions` e `products`
  - Após inscrever-se (não white-label), o plano free pode ter as pervas exatas sobre os counts que atualizam em tempo real (sem sync external)
  - Exportação CSV/JSON só de cashflow
  - Gerenciamento offline SQLite local (Sem sync)
- **3-5 dias**
- Admin panel
  - Web-only, sem aparelho separado
  - Visão de uso do cliente (transação/produto/perda real)
  - Gerenciar planos do usuário (free/pro/active)
- **2-4 dias**
- White-label (baseline)
  - Cor primária, secundária opcional, acento
  - Nome do cliente, logo
- **1-3 dias**
- UI/UX + Hooks
  - Interface de home simplificada

### FASE 2: Basic White-label + Extra Features

- **10-15 dias**
- Solid white-label API – pago 497 ao cliente, receber name logo colors du jour diretamente do backend API.
- Primeira integração de tema: adicionar modo dark/light.
- Exportação em PDF de relatório simples (SVG é tanto em bytes baixos).

### FASE 3: Opcional + Melhorias de Rua

- **5-20 dias**
- Não white-label: Temas existentes (8 presets de segmentação)
- Admin panel: Email, configuração de custo de plano, PDF de versão de email
- Admin panel: Authenticate by code, not by password
- Usuário explodindo.
- Checkout/Stripe, se o mercado reclamar.
- Recorrência simples para parcelamento, roteiro baixo risco.

## Limites de Alcance

- Não aceitar pedidos de features extras sem planejamento de design de um sistema de gerenciamento de features.
- API e DB modificados APENAS para FASE 1. Restrição de despesas de custo produtor.

## Checklist de Implementação

- [ ] Definir tabelas/schemas reduzidas (2-3 tabelas)
- [ ] Eliminar 40+ hooks em 5 hooks essenciais
- [ ] Reestruturação de função de controle de feat (\"testar limite\")
- [ ] Redesenhar fluxo de usuário (uma TxEntry, uma prateleira)
- [ ] Implementar interface de banco de dados minimalista
- [ ] Adicionar basic white-label (color, theme, nome, logo)
- [ ] Criar admin panel (painel de visualização é apenas)
- [ ] Code-less design (workflow para novo tema/lembretes)
- [ ] Integrar app com base em Supabase Auth + RLS

## Metas de Qualidade

- **Tamanho do código**
  - Aplicativo principal % do código original (/10)
  - Usável sem sync de estado adicional (estados/efeitos colaterais)
  - Sem automático app-convite IP desde app[iOS/Android]
- **Esforço de manutenção**
  - Sem urgente \"apenas negociação de imposto\" é apenas não assinado \"remover como fumar um cigarro\"
  - Baixo friso de qualidade/segurança na interface do usuário em adaptável
- **Posição competitiva**
  - Tratar como composicionismo: manter fluxo principal pequeno, estratégia de saída detalhada: feature para repository governamental.
  - Sucesso de mercado não ao quantity de resources, mas a quanlity ofUX estética.

## Resumo da Visão

Reverter Financia de um unicórnio com 40+ features e sync maluca para ser um **gerenciamento de app financeiro explicitamente simples e offline-first**:

- **⚙️ 2 telas principais – atalho para cashflow e prateleira, sem fluxos infinitos**
- **💳 1 admin panel – apenas para upgrade, uso de cliente, white-label**
- **🎨 Baseline white-label – apenas cor, theme e nome/logotomo do cliente**

Manter o core livre de cloud bloat. Não executar mais sync de excessos, limitados apenas a processos de merge.

> Tu fazes um app diário/muito pequeno, gigante porque o monitor `Current_project_costs` em UTC tokenarium dos meios de financia.

## Tarefa Assinada (Responsabilidades)

Esta visão chumbada servirão como um ` .js`:

```javascript
// Sr IMPLEMENTEDER:

const task = {
  description: 'Gerenciar todos os pontos de entrada sobre o que con ferraments. Exclui brand, email, report, configuração, planos, casos especiais de issue de impersonation',
  scope: ['Tabelas DB', 'auth/session sync', 'hooks & UI', 'processos Sync'],
  limites: ['Sem 20 files de brandstudio', 'Sem design de impressão', 'Sem auto-impersonation', 'Sem orphan cleanup'],
  metodo: 'Simplificar, reduzir a quantia das tables, hooks e screens sem generic interfaces. manter apenas apllication chrome essencial justificável.',
  revisão: 'Phase 1: Core, Phase 2: White-label(szenar), Phase 3: Optional incl inicial]'
}
```

Buzzword: “Simplificar, não cometer social carreira.”
Dizer: “Deletamos tudo que não seja cashflow próximos da moda de aquella representa a chegar em home.”

---

*Bi-para monacha de hoje, não enxergar o dia \` 1111111\`, exprimir o harsh SIMPLES: O pequeno fluxo de caixa que nosso usuário ou não precisa mais de 25 features, em 5 screens. Apenas add/editar, atualizar prateleira e comprar conersiva core white-label.”

---

# FINANCIA BASELINE WHITE-LABEL BRAND KIT V1

## OVERVIEW

A toolkit for baseline white-label customization. Only provide
user-configurable color scheme, logo and theme -- no design editor.
No phone sync. No fancy email templates. No stored brand presets.

## COLOR VARIABLES

---

### Primary Color
#002f59
Dark corporate blue.

---

### Secondary Color
#e8f0f7
Light blue-gray.

---

### Accent Color
#3bbfa0
Teal accent for CTAs and highlights.

---

## THEMES

- **Light** - colors as listed above
- **Dark** - inverted (use --bg-page: #111, --text: #e5e5e5)

---

## LOGO SLOT

Brand logo (client-provided PNG/SVG). Size: 150px width, no max-height.
Color: invert with --logo-invert (auto-detected by brightness).

<br><figure><img src="file:///C:/Users/gilma/.gemini/antigravity/brain/e2d5e85a-036a-41d9-b05c-10c2c2556b0d/financia_logo_1783388186537.jpg" alt="Baseline brand logo" style="max-width:150px"><br><figcaption><em>Replace with client logo in production.</em></figcaption></figure>

---

## BRAND METADATA

```json
{
  "name": "<CLIENT_NAME>",
  "logo": "/logos/<client_hash>.png",
  "color": "#002f59",
  "color_secondary": "#e8f0f7",
  "color_accent": "#3bbfa0",
  "theme": "light",
  "phone": "<optional phone number>",
  "white_label": true,
  "visual_version": 1
}
```

---

## DEPLOYMENT PATH

1. Admin panel accepts JSON PATCH under `/admin/brand`
2. Migration updates `profiles.user_metadata` (idempotent)
3. Client app reads dynamic CSS vars (hydrated via `useBrandAppearance`)

---

## STORING CLIENT PAYLOAD

Migrations target `profiles` (auth.id ↔ profiles.user_id).
All fields are optional; missing ones fall back to baseline.

---

## NO BRAND-STUDIO EDITOR

No UI for preset management. No stored presets. No theme builder.

---

## SUPPORTED CLIENT ACTIONS

- Update `name` (text, max 80 chars)
- Replace `logo` (PNG/SVG, <500KB, S3 path)
- Patch `color`, `color_secondary`, `color_accent` (hex with #)
- Toggle `theme` (light/dark)
- Add optional `phone` (E.164, strip non-digits)

> `white_label` flag stays true; no toggle to non-white-label.

---

## CONSISTENCY RULE

All modifications are serialized into profile metadata. No separate brand_presets table. Client app reads via `profile.user_metadata` or live DB sync.

---

## REMOVAL

Client can enter admin panel → clear brand data (set name to null, logo_url null, colors to baseline). This reverts to default Financia brand.

---

## NOTES

- Dark mode: set on html as `[data-theme=\"dark\"]`
- Logo invert: use filter: invert(1) (auto via JS)
- Theme sync persisted via `localStorage\"brand_theme\"` (optional)

---

## USAGE EXAMPLE (frontend)

```javascript
const BRANDING = {
  name: window.__BRAND_INFO__.name || 'Financia',
  logo: window.__BRAND_INFO__.logo_url,
  colors: {
    primary: window.__BRAND_INFO__.color,
    secondary: window.__BRAND_INFO__.color_secondary,
    accent: window.__BRAND_INFO__.color_accent,
  },
  theme: window.__BRAND_INFO__.theme || 'light',
  phone: window.__BRAND_INFO__.phone || ''
};
```

---

## NEXT STEPS FOR CLIENT `white-label`

- Package branding as static JSON served by admin.
- Use edge function to write to Supabase profiles.
- Client app reads once, caches in store; sync refreshes via profile updates.

---

