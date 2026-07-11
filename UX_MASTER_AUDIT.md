---
type: REPORT
---

# UX — Relatório de Auditoria de Experiência do Usuário

> **Data:** 2026-07-10 (revalidado 2026-07-10) | **Metodologia:** Caminhada cognitiva + auditoria heurística contra Material Design 3 (incl. M3 Expressive 2025), Apple HIG (iOS 26), Linear, Notion, Stripe, GitHub (Primer), Figma, Atlassian ADS e WCAG 2.2 AA/AAA.
> **Escopo:** Todas as telas, componentes, fluxos e estados do app (versão 5.1.0).

---

## Índice

1. [Diagnóstico](#1-diagnóstico)
2. [Pesquisas Realizadas](#2-pesquisas-realizadas)
3. [Melhores Práticas](#3-melhores-práticas)
4. [Arquivos Afetados](#4-arquivos-afetados)
5. [Plano de Ação](#5-plano-de-ação)
6. [Riscos](#6-riscos)
7. [Auto-Revisão](#7-auto-revisão)

**Apêndices**
- [Apêndice A — Metodologia](#apêndice-a--metodologia)
- [Apêndice B — Severidade](#apêndice-b--severidade)
- [Apêndice C — Auditoria Detalhada por Área](#apêndice-c--auditoria-detalhada-por-área) inclui:
  - [C.2. Nav/Core](#c2-navcore--estrutura-global)
  - [C.3. Dashboard](#c3-dashboard)
  - [C.4. Transações](#c4-transações-vendas--despesas)
  - [C.5. Estoque e Perdas](#c5-estoque-e-perdas)
  - [C.6. Relatórios](#c6-relatórios)
  - [C.7. Configurações](#c7-configurações)
  - [C.8. Planos e Checkout](#c8-planos-e-checkout)
  - [C.9. Login / Cadastro](#c9-login--cadastro)
  - [C.10. Landing Page](#c10-landing-page)
  - [C.11. Onboarding](#c11-onboarding)
  - [C.12. Componentes Compartilhados](#c12-componentes-compartilhados)
  - [C.13. Acessibilidade](#c13-acessibilidade-wcag-22-aa--aaa)
  - [C.14. Animações e Microinterações](#c14-animações-e-microinterações)
  - [C.15. Feedback Visual e Loading](#c15-feedback-visual-e-loading)
  - [C.16. Stripe / Pagamentos](#c16-stripe--pagamentos)
  - [C.17. E-mail / IA](#c17-e-mail--ia)
  - [C.18. Notificações e Erros](#c18-notificações-e-erros)

---

## 1. Diagnóstico

**Forças:**
- Arquitetura offline-first com IndexedDB (Dexie) + sync automático
- Tratamento cuidadoso de contrastes na tela de login (`onColor`, `readableBrand`)
- Uso de TanStack Virtual para listas grandes
- Skeleton loaders em vez de spinners em páginas
- View transitions nativas (`startViewTransition`)
- Modais responsivos (bottom-sheet em mobile, centralizado em desktop)
- Error boundaries por feature/widget
- `min-h-[44px]` em botões (alvo de toque ≥ WCAG)

**Fraquezas principais:**
1. **Sem command palette global** (⌘K) — maior lacuna vs Linear/Notion/Figma
2. **Sem undo** em ações destrutivas — Stripe e Atlassian exigem undo window
3. **Toast no bottom-center** — Stripe e Material Design usam top-right, menos intrusivo
4. **Labels na BottomNav extremamente pequenas** (10px) — abaixo do mínimo legível
5. **Sem skip link / foco visível customizado** — falha WCAG 2.4.11 (AA) e 2.4.13 (AAA)
6. **Sem breadcrumbs** em hierarquias >2 níveis — GitHub/Primer exige
7. **Sem autosave em formulários** — risco de perda de dados
8. **Empty states inconsistentes** — alguns têm preview, outros só texto
9. **Sem navegação por teclado em listas** — Tab + arrow keys incompletos
10. **Sem foco em modal** — focus trap não implementado, leitor de tela perdido

---

## 2. Pesquisas Realizadas

### 2.1 Web — WCAG, Design Systems e Padrões

| Tópico | Fonte | Resultado |
|--------|-------|-----------|
| WCAG 2.4.13 Focus Appearance | [W3C Understanding](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) | Nível **AAA** (não AA) |
| M3 Expressive Navigation Rail | [M3 Navigation Rail](https://m3.material.io/components/navigation-rail/overview) | Expanded rail substitui drawer (maio/2025) |
| Apple HIG Modal Presentation 2025 | [HIG Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) | Zoom transition é opcional (WWDC24) |
| Stripe Toast Position | [Human Standards](https://www.humanstandards.org/examples/feedback/feedback-stripe-dashboard/) | Top-right no dashboard |
| Stripe Undo Patterns | [Stripe Apps Toast](https://docs.stripe.com/stripe-apps/components/toast) | Toast com action button, 5-7s |
| Stripe Products | MCP Stripe (acesso direto) | Pro R$49,90/mês, Premium R$99,90/mês |
| Notion Empty States | [Northbase Audit](https://www.northbase.design/patterns/empty-states) | Sem ilustrações, "No [noun] yet" |
| Command Palette Pattern | [Mobbin](https://mobbin.com/glossary/command-palette) | ⌘K com fuzzy match, categorias, recentes |
| Modal Focus Trap Best Practices | [TestParty](https://testparty.ai/blog/modal-dialog-accessibility) | `<dialog>` nativo com `showModal()` recomendado |
| Toast Notification UX 2026 | [MagicBell](https://www.magicbell.com/blog/what-is-a-toast-message-and-how-do-you-use-it) | Bottom-center é comum; role="status" + aria-live="polite" obrigatório |

### 2.2 Database (Schema Real via Migrations)

| Fonte | Descoberta |
|-------|------------|
| 22 migrations SQL + código Dexie | 7 tabelas (company_profiles, transactions, products, losses, user_roles, ai_cache, impersonation_sessions) |
| RLS Policies | 11 policies, mas `transactions`/`products`/`losses` só têm policy de DELETE |
| Índices ausentes | `transactions` e `losses` sem índice em `user_id`; `user_roles` sem índice `(user_id, role)` |
| Categorias hardcoded | Schema não tem tabela de categorias — confirmado |

### 2.3 Documentação vs Código Real

| Documento | Discrepâncias |
|-----------|---------------|
| `ARCHITECTURE.md` | 21 discrepâncias (5 críticas: react-router, hooks path, Edge Functions count, testes count, design-system dir) |
| `AI_CONTEXT.md` | 6 discrepâncias + 4 regras violadas no código |

---

## 3. Melhores Práticas

### 3.1 Referências de Design seguidas no audit

| Prática | Fonte | Status no Financia |
|---------|-------|--------------------|
| NavigationBar ≤5 destinos | M3 | ✅ 5 itens no BottomNav |
| NavigationRail para tablets | M3 | ❌ Overlay sidebar, não rail fixo |
| Skip link | WCAG 2.4.1 / GitHub Primer | ❌ Ausente |
| Focus trap em modais | WCAG 2.1.2 / ARIA APG | ❌ Ausente |
| Focus indicator ≥2px, 3:1 | WCAG 2.4.7 AA | ❌ Nenhum outline customizado |
| Toast top-right | Stripe / Material Design | ❌ Bottom-center (conflita com nav) |
| Comand palette (⌘K) | Linear / Notion / Figma | ❌ Ausente |
| Undo para ações destrutivas | Stripe / Gmail | ❌ Ausente |
| Empty states sem ilustrações | Notion / Linear | ⚠️ Parcial (alguns têm preview) |
| prefers-reduced-motion | WCAG / Apple HIG | ✅ Presente em animations.css |
| Skeleton loaders | Linear / Atlassian | ✅ PageSkeleton com layout-aware |
| min-h-[44px] targets | WCAG 2.5.5 | ✅ Generalizado |
| Error boundaries em camadas | Atlassian / Stripe | ✅ 2 camadas |

### 3.2 Padrões WCAG 2.2 AA aplicáveis

| Critério | Descrição | Status |
|----------|-----------|--------|
| 2.4.1 Bypass Blocks | Skip link | ❌ |
| 2.4.7 Focus Visible | Indicador de foco visível | ⚠️ Parcial |
| 1.4.3 Contrast Ratio | Texto ≥4.5:1 | ⚠️ Dependente do tema |
| 2.1.1 Keyboard | Toda função via teclado | ⚠️ Modais sem focus trap |
| 2.4.11 Focus Not Obscured | Foco não oculto por sticky | ❌ Header pode cobrir |
| 1.4.11 Non-text Contrast | UI ≥3:1 | ⚠️ UsageBar cor única |
| 4.1.3 Status Messages | ARIA live regions | ✅ Toast com role="status" |

---

## 4. Arquivos Afetados

| Arquivo | Linhas | Problema |
|---------|--------|----------|
| `src/shared/ui/ui.jsx` (Modal) | ~170 | Sem focus trap, sem scroll shadow |
| `src/shared/ui/Confirm.jsx` | ~6 | Sem focus trap |
| `src/shared/ui/Toast.jsx` | ~50 | Posição bottom-center conflita com nav |
| `src/shared/ui/BottomNav.jsx` | — | Labels em 10px (ilegível) |
| `src/shared/ui/SyncBadge.jsx` | ~13 | z-index 9999 > modais |
| `src/shared/ui/Sidebar.jsx` | — | Sem colapso, sem hierarquia |
| `src/shared/ui/ExportButtons.jsx` | ~31 | ✅ Role="group" correto |
| `src/shared/ui/spinner.jsx` | — | ✅ Role="status" correto |
| `src/animations.css` | ~413 | ✅ prefers-reduced-motion presente |
| `src/index.css` | ~50 | Classes anim-fade/scale/up sem prefers-reduced-motion próprio |
| `src/features/dashboard/Dashboard.jsx` | — | Gráfico fixo em 7 dias |
| `src/features/auth/Login.jsx` | — | Links #hash quebrados (#privacidade, #termos) |
| `src/features/landing/Landing.jsx` | — | Links #hash quebrados; FAQ maxHeight fixo |
| `src/features/plans/Plans.jsx` | — | SessionStorage para hint de tab |
| `src/features/admin/AdminPanel.jsx` | — | Tab switching forçado sem explicação |
| `src/features/email/EmailView.jsx` | — | IA sem revisão; template "custom" não reseta |
| `src/features/onboarding/Onboarding.jsx` | — | Não educa sobre o app |
| `src/features/reports/Reports.jsx` | — | Navegação mensal sem dropdown |
| Vários | 93 ocorrências | Cores fixas (text-white, bg-white) quebram white-label |

## C.2. Nav/Core — Estrutura Global

### C.2.1. O que existe

| Componente | Mobile | Tablet | Desktop |
|---|---|---|---|
| BottomNav | 5 itens, fixo inferior | oculto (lg:hidden) | oculto |
| Sidebar | Overlay (slide) | Overlay | Fixa 256px |
| Header | Sticky, 56px | Sticky | Oculto (hidden lg) |
| ThemeToggle | No header | No header | Floating (top-right) |

### C.2.2. Achados

**🔴 Crítico — Sem command palette (⌘K)**
- Linear, Notion, Figma e Atlassian têm command palette como pilar de navegação
- Financia só tem atalho `g+d`, `g+t`, etc. — descoberta baixíssima
- Usuário novo não sabe que atalhos existem; `?` mostra toast informativo mas é efêmero
- **Solução esperada:** ⌘K com fuzzy match em todas as telas, ações e busca

**🔴 Crítico — BottomNav com labels em 10px**
- WCAG 2.2 AA exige texto legível; 10px é o mínimo do mínimo
- Labels longas como "Vendas / Ganhos" são truncadas com `max-w-full`
- Apple HIG e M3 usam ícone + label de 11–12px; 10px falha em contraste prático
- `aria-label` presente mas label visual é quase ilegível

**🟠 Alto — Sidebar sem colapso/animação de expansão de subitens**
- Atlassian ADS: três níveis de navegação (menu → flyout → expandable)
- Financia: sidebar plana, sem hierarquia, sem hover actions (favorite, pin)
- Settings separado no footer é padrão Stripe/Atlassian ✓

**🟠 Alto — M3 Expressive (2025) deprecou Navigation Drawer em favor de Navigation Rail expandido**
- M3 Expressive (maio 2025): "navigation drawer is being deprecated... use expanded navigation rail instead"
- Expanded rail substitui drawer com collapsed/expand transition, modal e non-modal variants
- Sidebar fixa 256px do Financia é funcional, mas M3 recomenda rail expandido em tablets/desktop com transição collapsed↔expanded
- Impacto: se Financia migrar para M3 completa, sidebar atual precisaria ser substituída por rail + expanded overlay

**🟠 Alto — Header duplica elementos**
- Header mobile tem ThemeToggle + menu hamburguer + status sync
- Desktop repete ThemeToggle como floating (redundância aceitável, mas 2 pontos de sync status confundem)

**🟡 Médio — Sem indicador de navegação atual no Header**
- Header só mostra logo + nome, não indica em qual tela o usuário está
- BottomNav e Sidebar indicam com cor, mas Header não reforça

**🟡 Médio — Sem breadcrumbs**
- Relatório → mês específico → transação não tem navegação hierárquica
- GitHub (Primer) usa `UnderlineNav` + breadcrumbs para hierarquia >2

**🟢 Bom — Sidebar com fallback de cor da marca**
- `var(--sidebar-bg)` com fallback para `brand.color`
- Texto branco com opacidade, indicador ativo com barra lateral

### C.2.3. Checklist vs Referências

| Critério | Status | Referência |
|---|---|---|
| NavigationBar ≤5 destinos | ✅ 5 itens no BottomNav | M3 |
| NavigationRail ≥ tablet | ❌ Overlay, não rail fixo | M3 |
| Tab bar flutua sobre conteúdo | ❌ Border sólida, sem glass | Apple HIG |
| ⌘K command palette | ❌ Não existe | Linear/Notion |
| Atalhos visíveis em tooltips | ❌ `?` mostra toast, não tooltip | Linear/Figma |
| Breadcrumbs | ❌ Ausente | GitHub/Primer |
| Skip link | ❌ Ausente | WCAG |
| Navegação consistente entre páginas | ✅ | WCAG 3.2.3 |

---

## Apêndice C — Auditoria Detalhada por Área



## C.3. Dashboard

### 3.1. O que existe

- Saudação por período do dia + data
- Seletor de período (mês, 3m, 6m, ano, 12m)
- Empty state completo: onboarding steps com progresso 0%
- 4 KPI cards (entradas, saídas, resultado, saldo hoje)
- Gráfico de 7 dias (SVG)
- AI Insights (gated Pro)
- PlanStatusCard (limites do free + upgrade CTA)
- Movimentações recentes (8 últimas)
- Alerta de estoque baixo

### 3.2. Achados

**🟠 Alto — Gráfico fixo em 7 dias, não respeita período**
- Seletor de período muda KPIs, mas gráfico sempre mostra 7 dias
- Usuário que seleciona "12 meses" espera ver o gráfico com 12 meses
- Stripe e Linear sincronizam período com todos os elementos da tela

**🟠 Alto — Fluxo de onboarding 0% nunca muda**
- Progress bar fixa em 0% mesmo após completar passos — `done` sempre `false`
- Frustrante: usuário completa passos mas onboarding não reflete progresso
- "Bem-vindo ao Financia" reaparece até que haja dados

**🟡 Médio — Low stock alert usa cor de fundo ambígua**
- `rgba(245,158,11,0.10)` com ícone verde e texto âmbar
- Contraste do ícone verde sobre fundo âmbar claro pode ser < 3:1
- WCAG 1.4.11: ícones informacionais precisam de 3:1

**🟡 Médio — AI Insights gated com blur + overlay**
- Blur + opacidade 0.5 + "Disponível no Pro" — boa pattern de progressive disclosure
- Porém, usuários free veem blur sem contexto do que perderiam
- Stripe mostra recursos bloqueados com checklist, não blur

**🟡 Médio — KPI "Sem dados anteriores" é impreciso**
- `inVar === null` mostra "Sem dados anteriores" — correto, mas genérico
- Poderia mostrar "Registre o mês passado para comparar"

**🟢 Bom — Empty state com preview visual**
- Gráfico vazio com barras placeholder opacas + CTA
- Steps de onboarding com ações diretas
- Educativo sem ser superlativo (Notion-style)

### 3.3. Checklist

| Critério | Status |
|---|---|
| Período sincronizado com gráfico | ❌ |
| Onboarding progress tracking | ❌ (sempre 0%) |
| Low stock alert acessível | ⚠️ (cor única) |
| AI insights progressive disclosure | ✅ (blur + overlay) |
| Empty state educativo | ✅ |
| Dashboard-zero (estrutura visível) | ✅ |

---

## C.4. Transações (Vendas / Despesas)

### 4.1. O que existe

- Virtualized list com agrupamento por data
- Cabeçalho de grupo com total do dia
- Search + filtro por data
- Botão limpar filtros
- Export (PDF/XLS) gated Pro
- Venda: SaleForm (multi-item, busca produto, cálculo automático)
- Despesa: Modal com categoria, tipo fixo/variável, dia vencimento
- Edit/Delete inline em cada linha
- Recurring expense toggle

### 4.2. Achados

**🔴 Crítico — Sem confirmação de data inválida**
- `dateFrom > dateTo` mostra texto de erro, mas a listagem continua filtrando
- Stripe e GitHub bloqueiam a consulta ou resetam automaticamente
- Usuário pode ignorar o aviso e agir sobre dados inconsistentes

**🟠 Alto — Categorias e métodos fixos (hardcoded)**
- Usuário não pode criar categorias próprias
- Notion e Atlassian permitem taxonomia customizada
- Impacto: relatório por categoria perde precisão semântica

**🟠 Alto — Venda com múltiplos itens: descrição concatenada**
- `valid.length === 1 ? desc : valid.length + ' itens'`
- Perde-se o detalhamento dos itens na lista principal
- Stripe mostra line items expandíveis

**🟡 Médio — Edit abre modal cheio (não inline)**
- Para editar 1 campo (ex: data), usuário precisa abrir modal
- Linear e Notion permitem edição inline com clique no campo
- Overhead cognitivo para edição simples

**🟡 Médio — SaleForm fecha ao salvar sem feedback visual**
- `onClose()` é chamado sem transição — modal desaparece instantaneamente
- Toast "Venda registrada!" aparece mas usuário não vê a transição

**🟡 Médio — Search é case-sensitive?** 
- `t.desc.toLowerCase().indexOf(search.toLowerCase())` — não, é case-insensitive ✅
- Porém, usa `indexOf` em vez de `includes` (funcionalmente igual)

**🟢 Bom — Virtualized list com TanStack Virtual**
- Performance em grandes volumes
- `aria-setsize` e `aria-posinset` corretos
- ScrollRef com `max-h-[calc(100vh-280px)]`

**🟢 Bom — Recurring expense com preview**
- Dia do vencimento só aparece quando "Fixa" selecionado
- `buildRecurringRow` gera instância automaticamente

### 4.3. Checklist

| Critério | Status |
|---|---|
| Date range validação bloqueante | ❌ |
| Categorias customizáveis | ❌ |
| Edição inline | ❌ (modal) |
| Virtualized list | ✅ |
| Recurring support | ✅ |
| Export gated | ✅ |
| Multi-item venda | ✅ |

---

## C.5. Estoque e Perdas

### 5.1. O que existe

- Tabs: Produtos / Perdas
- Agrupamento por categoria com collapse/expand
- Search por nome/categoria
- Product form (nome, categoria, preço, custo, estoque)
- Stock adjustment modal
- Loss recording (busca produto ou texto livre)
- Export gated
- Empty state com preview "Caneca personalizada" (dashed preview)

### 5.2. Achados

**🔴 Crítico — Stock adjustment só permite adicionar**
- Botão "Repor estoque" abre modal com `Quantidade a adicionar` — só positivo
- Para remover, usuário precisa registrar perda
- Dois cliques onde um bastaria; Stripe permite ajuste bidirecional

**🟠 Alto — Perda: busca produto + texto livre é confusa**
- `PSearch` com fallback para texto livre quando produto não encontrado
- Usuário pode digitar "arroz" e o sistema registra perda mesmo sem produto cadastrado
- Dois comportamentos diferentes (abatimento de estoque vs registro avulso) na mesma interface

**🟠 Alto — Categorias de produto: "Sem categoria" sempre no final**
- `sort` com hardcoded `'Sem categoria'` no final — consistente mas sem indicação visual
- Usuário pode ter muitos produtos "sem categoria" e não saber como categorizar

**🟡 Médio — Edição de produto não ajusta estoque retroativamente**
- Editar estoque manualmente é possível no modal, mas não há log da alteração
- Stripe e GitHub mantêm audit trail de mudanças

**🟡 Médio — Collapse usa `aria-expanded` invertido**
- `aria-expanded={!collapsed.has(cat)}` — quando colapsado, `aria-expanded` é `false` ✅
- Porém, lógica é contra-intuitiva para manutenção

**🟢 Bom — Empty state com preview de produto**
- Dashed border com exemplo de "Caneca personalizada"
- Educa o usuário sobre o formato esperado dos dados
- Similar a Notion com placeholder content

### 5.3. Checklist

| Critério | Status |
|---|---|
| Ajuste bidirecional de estoque | ❌ (só adicionar) |
| Audit trail de alterações | ❌ |
| Empty state educativo | ✅ |
| Agrupamento por categoria | ✅ |
| Export gated | ✅ |
| Preview de produto vazio | ✅ |

---

## C.6. Relatórios

### 6.1. O que existe

- Navegação mensal (prev/next)
- 4 KPI cards (entradas, saídas, resultado, registros)
- Gráfico de despesas por categoria (barras horizontais)
- Lista de movimentações do mês
- Export (PDF/XLS) gated Pro
- Empty state com preview de gráfico

### 6.2. Achados

**🟠 Alto — Empty state mostra preview, mas dados falsos podem confundir**
- Gráfico com barras `[35, 48, 30, 62, 55, 78, 92]` — opacidade 0.3
- Educativo mas pode sugerir que o app tem dados de exemplo
- Stripe dashboard-zero mostra estrutura vazia, não dados falsos

**🟡 Médio — Navegação mensal: sem dropdown para pular meses**
- Só setas prev/next — para ir de janeiro a dezembro, 11 cliques
- Atlassian e Stripe têm seletor mensal + setas
- `navMonths` filtra meses sem registro, mas mesmo com dados esparsos navegação é lenta

**🟡 Médio — "Sem registros neste mês" genérico**
- Quando filtered.length === 0 dentro de um mês com dados em outros meses
- Não explica que o mês atual pode não ter dados — poderia sugerir cadastro

**🟢 Bom — KPIs com cor condicional**
- Resultado verde se positivo, vermelho se negativo
- Contraste preservado com cores do plano

### 6.3. Checklist

| Critério | Status |
|---|---|
| Mês a mês com setas | ✅ |
| Dropdown para pular períodos | ❌ |
| Dashboard-zero sem dados falsos | ❌ (tem preview) |
| Export gated | ✅ |
| Categorias de despesa | ✅ |
| Resultado do mês no footer | ✅ |

---

## C.7. Configurações

### 7.1. O que existe

- Tabs: Conta, Assinatura, Aparência, Brand Studio, Admin
- Perfil com logo, nome, e-mail, plano
- Alterar senha (modal)
- Telefone (PhoneInput com país)
- Instalar PWA
- WhatsApp suporte
- Sair da conta
- Assinatura: status, cartão salvo, trocar/remover cartão
- Aparência: nome, logo (upload), cores (3 campos), preview, salvar
- Gerar APK personalizado
- Brand Studio (editor de logo por plano)

### 7.2. Achados

**🟠 Alto — Aba de assinatura carrega 2 endpoints em paralelo sem feedback combinado**
- `get-payment-method` e `get-subscription-status` disparam juntos
- Se um falha, o erro genérico "Erro ao carregar forma de pagamento" aparece
- Não há indicador de qual parte falhou

**🟠 Alto — Tabs de admin são condicionais e podem causar confusão**
- Admin vê aba "Painel admin" mas se estiver em "Conta" é redirecionado para "clients"
- `useEffect` com `setTab('clients')` — mudança abrupta sem explicação

**🟡 Médio — Aparência: formulário sem validação de cor**
- `ColorField` aceita qualquer string; se inválida, o preview quebra
- Não há feedback de formato de cor inválido

**🟡 Médio — 93 ocorrências de cores fixas (text-white, bg-white) quebram white-label**
- `grep` revela 93 usos de `text-white`, `bg-white`, `text-gray-*` hardcoded
- Sistema de white-label permite cliente definir paleta própria, mas cores fixas persistem em componentes avulsos
- Se cliente escolhe background escuro, `text-white` em bg claro quebra; se bg claro, `bg-white` em cards escuros quebra
- Ideal: mapear para variáveis CSS temáticas (`--text-primary`, `--bg-card`, etc.)

**🟡 Médio — Upload de logo: FileReader síncrono**
- `reader.onload` define `logo_url` como data URL
- Data URLs de 512KB podem ser pesadas para IndexedDB
- Ideal: upload para storage e salvar URL

**🟡 Médio — PhoneInput com init complexo**
- `parsePhone(brand.phone)` → `buildPhone(parsed.iso, parsed.digits)`
- Três chamadas para inicializar; se `brand.phone` for inválido, pode crashar

**🟢 Bom — CardPreview com skeleton loading**
- Fases `loading` → `preview` → `form` com transição clara
- Skeleton skeleton de 44px corresponde ao layout final

**🟢 Bom — Remover cartão com confirmação em duas etapas**
- `confirmRemove` → `doRemove` com alerta de consequência
- Padrão Stripe de confirmação destrutiva

### 7.3. Checklist

| Critério | Status |
|---|---|
| Load combinado com feedback granular | ❌ |
| Upload de logo com preview | ✅ |
| Validação de cor | ❌ |
| PhoneInput com código de país | ✅ |
| Remoção de cartão com confirmação | ✅ |
| Skeleton loading | ✅ |
| Tab switching forçado sem explicação | ❌ |

---

## C.8. Planos e Checkout

### 8.1. O que existe

- 3 planos (Free, Pro, Premium) + White-label
- Pricing cards com features
- Preços customizados por admin
- Modo de teste admin
- Stripe Checkout (modal)
- Cancelamento (modal com data de expiração)
- Status da assinatura (carregado via Edge Function)
- Contato WhatsApp

### 8.2. Achados

**🟠 Alto — Stripe Checkout não fecha automaticamente após confirmação**
- `return_url: window.location.origin + '/?checkout=success#planos'`
- Usuário volta para o app, mas precisa navegar manualmente
- Stripe Checkout padrão redireciona e fecha; aqui o modal some mas URL mantém query

**🟠 Alto — "Voltar para Assinatura" usa sessionStorage para hint de tab**
- `sessionStorage.setItem('financia_settings_tab', 'subscription')`
- Se o usuário abrir Config em nova aba, hint é perdido
- Stripe mantém estado na URL, não em sessionStorage

**🟡 Médio — CTA "Assinar Pro" vs "Seu plano atual" bagunça hierarquia visual**
- Plano atual recebe `boxShadow: 'var(--plan-shadow-elevated)'` — pode ser confundido com "recomendado"
- Popular badge aparece em Free se for current? Não, `popular && !current` previne ✅

**🟡 Médio — Cancelamento: falta undo window**
- Stripe oferece 7 dias de undo; Financia cancela imediatamente
- `cancel-subscription` invoca API sem periodo de graça

**🟢 Bom — Preços customizados com preview**
- Admin pode definir preços por cliente com badge "Você tem um preço especial"
- Mensagem clara com breakdown

**🟢 Bom — Admin test mode: badge cyan com explicação**
- "Modo de teste admin ativo" + "Cobrança de teste: R$ 0,01"
- Não deixa dúvida sobre o ambiente

### 8.3. Checklist

| Critério | Status |
|---|---|
| Checkout redirect handling | ⚠️ (query params frágeis) |
| Cancelamento com undo window | ❌ |
| Preços customizados | ✅ |
| Admin test mode | ✅ |
| Estado de assinatura carregado | ✅ |
| Contato WhatsApp | ✅ |

---

## C.9. Login / Cadastro

### 9.1. O que existe

- Split layout (50% brand panel + 50% form)
- Login / Signup tabs
- Google OAuth
- Email + password
- Password strength meter
- Phone input (com código do país)
- Terms acceptance checkbox
- Password reset flow
- Signup success state (email confirmation)
- Error states específicos

### 9.2. Achados

**🟠 Alto — Links de privacidade/termos são `#privacidade` e `#termos` (hash, não rota)**
- `<a href="#privacidade">` — não leva às páginas reais de política/termos
- Usuário clica e nada acontece (não há elemento com id="privacidade" na página)
- Legalmente problemático

**🟡 Médio — Google OAuth sem tratamento de pop-up bloqueado**
- `signInWithGoogle()` não detecta se pop-up foi bloqueado
- Usuário pode ficar esperando sem feedback

**🟡 Médio — Erro de senha não diferencia "e-mail não encontrado" de "senha errada"**
- "E-mail ou senha incorretos." — segurança ✅, UX ❌
- Stripe mostra "No account found with this email" para login, sugerindo cadastro

**🟡 Médio — Brand panel com dashboard preview ocupa 50% da tela mas é decorativo**
- Informação útil mas não interativa
- Em tablets, 50% de espaço perdido para conteúdo estático

**🟢 Bom — Contraste calculado programaticamente**
- `onColor(brandColor)` → texto branco ou escuro conforme luminância
- `onBrandSoft`, `onBrandFaint`, `onBrandChip` escalas consistentes
- Referência direta de Material Design 3 tonal palette

**🟢 Bom — Password strength meter com barra + cor + label**
- `pwSt.pct`, `pwSt.color`, `pwSt.label` — feedback completo
- Muda em tempo real

**🟢 Bom — Animação de reveal escalonada**
- `revealDelay(ms)` com `anim-fade-up` em cada elemento
- Apple HIG: conteúdo aparece sequencialmente

### 9.3. Checklist

| Critério | Status |
|---|---|
| Links legais funcionais | ❌ (#hash quebrado) |
| Google OAuth com feedback de pop-up | ❌ |
| Contraste brand panel | ✅ |
| Password strength | ✅ |
| Phone input | ✅ |
| Error messages específicos | ⚠️ (genérico no login) |

---

## C.10. Landing Page

### 10.1. O que existe

- Navbar sticky com glass (backdrop-filter)
- Hero com CTA + mockup (perspective 3D)
- Social proof (contadores animados)
- Dashboard mockup (KPIs, gráfico, movimentações)
- Extrato mockup
- Features (4 cards)
- Pricing (3 planos)
- FAQ (accordion)
- CTA final com gradient card
- Footer

### 10.2. Achados

**🟡 Médio — Contadores animados sem fallback de acessibilidade**
- `useCountUp` usa `setInterval` para animar números
- Leitores de tela podem não capturar a atualização
- ARIA `live` region não implementada

**🟡 Médio — FAQ accordion usa `maxHeight` animado com valor fixo**
- `maxHeight: '200px'` — se resposta for maior, corta
- `opacity` animado junto — se `maxHeight` for insuficiente, texto aparece truncado

**🟡 Médio — Links de privacidade/termos no footer são `#privacidade` e `#termos`**
- Mesmo problema do login: hash que não leva a lugar algum
- Em produção, deve rolar para âncora ou navegar para rota

**🟢 Bom — Hero com perspective + glass mockup**
- `rotateY(-2deg)` + `float-slow` animação sutil
- Cards flutuantes com `animation-delay` escalonado
- Apple HIG Liquid Glass: backdrop-filter + transparência

**🟢 Bom — Loading states com scroll-reveal**
- `useScrollReveal` com `IntersectionObserver`
- Conteúdo aparece ao scroll, não tudo de uma vez
- Atlassian/Linear pattern

**🟢 Bom — Sistema de animações rico no landing page**
- `animations.css` com 28+ keyframes (orbDrift, cardPopIn, staggerIn, growBar, waveMove, metricLift, previewFloat)
- Orbes de luz com `filter: blur(46px)` e `will-change: transform` — Liquid Glass style
- Preview cards com hover-state, active-state e transição `cubic-bezier(.34,1.56,.64,1)`
- Contadores animados (embora sem ARIA live — ver achado)
- Bar chart animado com hover reveal em grupo (`.lp-main-chart:hover .lp-bar-hover { opacity: .62 }`)

### 10.3. Checklist

| Critério | Status |
|---|---|
| Contadores acessíveis | ❌ (sem ARIA live) |
| FAQ sem corte de conteúdo | ⚠️ (maxHeight fixo) |
| Links legais funcionais | ❌ |
| Scroll reveal | ✅ |
| Glassmorphism no navbar | ✅ |
| Pricing com gradiente | ✅ |

---

## C.11. Onboarding

### 11.1. O que existe

- Tela única após primeiro login
- Campos condicionais: nome (se for Google) e telefone
- Botão "Começar"
- Loading state com spinner

### 11.2. Achados

**🟡 Médio — Onboarding só coleta nome/telefone, não educa sobre o app**
- Linear e Notion usam onboarding para ensinar funcionalidades
- Financia pulsa diretamente para o dashboard vazio
- Usuário novo não sabe por onde começar (apesar dos steps no dashboard)

**🟡 Médio — Se `needsName` e `needsPhone` são false, onboarding não aparece**
- `var needs = !doneFlag && needName` — apenas nome do Google
- Usuário que cadastrou email/senha (com nome no signup) não vê onboarding
- Primeira experiência é o dashboard vazio

**🟢 Bom — Design minimalista, foco na ação**
- Sem ilustrações, sem distrações
- Padrão Linear: só o essencial para começar

---

## C.12. Componentes Compartilhados

### 12.1. Toast

**🟠 Alto — Posição bottom-center**
- Stripe, Material Design e Atlassian usam top-right
- Bottom-center: conflita com BottomNav e safe-area
- `max-w-sm` + `left-1/2 -translate-x-1/2` — pode sobrepor botões importantes

**🟡 Médio — Toast empilhados podem sair da tela**
- `visible.slice(-4)` — máximo 4, mas sem limite de altura
- Se 4 toasts de erro (mais longos) aparecerem, podem ultrapassar viewport

**🟢 Bom — ARIA live region**
- `aria-live="polite"` + `role="status"` — leitores de tela notificam
- Ícone + texto + cor para cada tipo

### 12.2. Confirm Dialog

**🟡 Médio — Sem keyboard trap**
- Confirm não prende foco; Tab pode sair do modal
- WCAG 2.1.2: modal precisa de focus trap

**🟢 Bom — Blur overlay + animação**
- `backdropFilter: 'blur(3px)'` — Apple HIG depth
- `anim-fade` no overlay, `anim-scale` no conteúdo

### 12.3. Modal

**🟠 Alto — Sem focus trap**
- Mesmo problema do Confirm
- Quando modal abre, foco não é movido para dentro
- Tab sai do modal e interage com elementos atrás

**🟡 Médio — Scroll do modal não tem indicação de overflow**
- `overflow-y-auto` sem fade no topo/bottom
- Atlassian e M3 usam scroll shadows

**🟢 Bom — Responsivo: bottom-sheet em mobile**
- `fixed inset-0 items-end sm:items-center`
- Padrão Apple HIG para sheets

### 12.4. Skeleton / Loading

**🟢 Bom — PageSkeleton com layout correspondente**
- Grid de 4 cards + barra + 3 linhas
- `aria-hidden="true"` para não confundir leitores de tela

**🟢 Bom — Spinner component com acessibilidade**
- `role="status"` + `sr-only` com texto "Carregando..."
- Leitores de tela anunciam corretamente
- Animação CSS rotation com `border-top-color: transparent`

**🟡 Médio — AiInsightsCard skeleton é genérico**
- 3 linhas de `skeleton` com `width: 100%, 85%, 70%`
- Funcional, mas não reflete a estrutura do insight (cards vs texto)

### 12.5. ExportButtons (Split Button)

**🟢 Bom — Split button com role="group" e aria-label**
- `role="group" aria-label="Exportar"` — semântica ARIA correta
- Botões individuais com `aria-label="Exportar PDF"` e `aria-label="Exportar Excel"`
- `min-h-[44px]` em todos os tamanhos de tela
- Locked state para usuários Free com `title` e `aria-label` explicativos
- Padrão M3 Split Button com shape-shifting

### 12.6. Error Boundaries

**🟢 Bom — Duas camadas: FeatureErrorBoundary + WidgetErrorBoundary**
- Widget não quebra página inteira
- Cada feature é isolada
- Atlassian/Stripe pattern

### 12.6. Checklist

| Componente | Problema | Severidade |
|---|---|---|
| Toast | Posição bottom-center | 🟠 Alto |
| Toast | Stack overflow em viewport pequena | 🟡 Médio |
| Confirm | Sem focus trap | 🟠 Alto |
| Modal | Sem focus trap | 🟠 Alto |
| Modal | Sem scroll shadow | 🟡 Médio |
| Skeleton | Genérico no AI card | 🟡 Médio |
| Error Boundary | Duas camadas | ✅ |

---

## C.13. Acessibilidade (WCAG 2.2 AA + AAA)

### 13.1. Falhas Confirmadas

| Critério | Nível | Requisito | Status | Onde |
|---|---|---|---|---|
| 2.4.11 Focus Not Obscured | AA | Foco não pode ser oculto por sticky | ❌ | Header sticky 14px pode cobrir foco |
| 2.4.13 Focus Appearance | **AAA** | ≥2px, ≥3:1 contraste | ❌ | Nenhum `outline` customizado; fallback browser apenas |
| 2.1.1 Keyboard | A | Toda função via teclado | ⚠️ | Menus e modais sem focus trap |
| 2.4.1 Bypass Blocks | A | Skip link | ❌ | Ausente em todas as páginas |
| 1.4.11 UI Contrast | AA | Ícones informacionais ≥3:1 | ⚠️ | UsageBar com cor única (reached/warn) |
| 2.5.8 Target Size | AA | ≥24×24px | ⚠️ | EditBtn/DelBtn têm 44px ✅ mas labels têm 10px ❌ |
| 3.3.3 Error Suggestion | AA | Sugestão de correção | ⚠️ | Login genérico, sem sugestão |

> ℹ️ **Nota sobre 2.4.13:** Este critério é **Level AAA** em WCAG 2.2. Foi AAA também em WCAG 2.1. Listado aqui como referência de boas práticas, não como requisito de conformidade AA.

### 13.2. Achados

**🔴 Crítico — Sem skip link**
- Usuários de teclado/leitores de tela precisam tabular por Sidebar + Header + Banner toda navegação
- GitHub (Primer): skip link é padrão em todos os layouts

**🔴 Crítico — Modais sem focus trap**
- Tab sai do modal e foco vai para elementos atrás
- Usuário de leitor de tela perde contexto
- WCAG 2.1.2: não pode haver keyboard trap, mas também não pode sair sem intenção
- **Recomendação 2025-26:** Usar elemento nativo `<dialog>` com `showModal()` — fornece focus trap, backdrop, Escape key e top-layer stacking automaticamente, sem necessidade de implementação customizada
- Fallback para `<div role="dialog" aria-modal="true">` com focus trap em JS se precisar de animações customizadas

**🟠 Alto — Heading hierarchy não semântica**
- `page-header` e `page-sub` são classes CSS, não tags semânticas h1-h6
- `PageHead` renderiza `h2` sem `h1` antecedente consistente em todas as páginas
- Leitores de tela dependem de hierarquia de headings para navegação
- WCAG 1.3.1: Info and Relationships — headings devem definir estrutura semântica

**🟠 Alto — Sticky header pode obscurecer foco**
- Header móvel tem 56px de altura e `z-20`
- WCAG 2.4.11: foco não pode ser oculto por conteúdo fixo
- Banner de update tem `z-[60]`

**🟡 Médio — Ícones sem texto alternativo em alguns lugares**
- Gráfico SVG `BarChartSVG` tem `role="img"` + `aria-label` ✅
- Uso de `aria-label` em ícones decorativos inconsistente
- `sr-only` usado em alguns lugares ✅, ausente em outros ❌

**🟡 Médio — Cor como único indicador de estado**
- UsageBar: reached=vermelho, warn=âmbar, ok=verde
- Não há texto ou ícone adicional para diferenciar (exceto badge "no limite")
- WCAG 1.4.1: cor não pode ser único meio de transmitir informação

**🟡 Médio — ARIA landmarks semânticos não verificados**
- `<nav>`, `<main>`, `<header>`, `<aside>` podem não estar semânticamente corretos
- Leitores de tela usam landmarks para navegação rápida entre regiões
- Necessário auditoria específica de ARIA landmarks em todas as páginas

**🟢 Bom — `min-h-[44px]` generalizado**
- Botões em toda a base têm altura mínima de toque
- Excede WCAG 2.5.5 (24×24)

**🟢 Bom — `aria-live` no Toast**
- `role="status" aria-live="polite"` — leitores de tela anunciam

**🟢 Bom — `onColor` para contraste de texto**
- Cores da marca sempre com texto contrastante

### 13.3. Recomendações Prioritárias

1. Skip link no topo de todas as páginas
2. Focus trap em todos os modais/dialogs
3. Heading hierarchy semântica (h1 → h2 → h3)
4. Focus outline customizado ≥2px com 3:1 contraste
5. `aria-describedby` e `aria-invalid` completos em formulários
6. Auditoria de ARIA landmarks (`<nav>`, `<main>`, `<header>`) em todas as páginas
7. Implementar testes E2E de acessibilidade com Playwright (já instalado como devDependency)

---

## C.14. Animações e Microinterações

### 14.1. O que existe

- `startViewTransition` para navegação (SPA)
- `anim-fade`, `anim-scale`, `anim-up`, `anim-fade-up` classes
- `scroll-reveal` no landing (IntersectionObserver)
- Hover: `-translate-y-0.5`, `brightness-110`, `opacity-90`
- Sidebar: `transition-transform duration-300` slide
- Toast: `anim-up` + `anim-out` (exit)
- Progress bars: `transition-all duration-300`
- BottomNav indicator: `transition-colors`
- **`animations.css`** (413 linhas, importado em `main.jsx`):
  - Keyframes: fadeInUp, fadeInDown, hoverFloat, hoverGlow, slideInFromLeft/Right, revealFromBottom, float, floatSlow, pulse, glow, bounceIn, checkmark, cardPopIn, cardLift, fillProgress, staggerIn, drawStroke, wavePath, orbDrift, previewFloat, countUp, barPulse, chipPulse, badgeGlow, spinSlow, waveMove, fillPulse, metricLift, growBar
  - Utility classes: `.anim-fade-up`, `.anim-fade-down`, `.hover-float`, `.hover-glow`, `.card-hover-lift`, `.float-slow`, `.float-medium`, `.pulse-glow`, `.glow-text`, `.scroll-reveal`
  - Landing-specific: `.lp-bar`, `.lp-bar-hover`, `.lp-metric-card`, `.lp-line-chart`, `.lp-line-point`, `.lp-donut`, `.lp-thermo-col`, `.lp-progress`, `.lp-wave`, `.lp-orb`, `.preview-card`, `.count-animate`, `.preview-bar-live`, `.preview-chip`, `.preview-badge`, `.lp-ring`
  - `prefers-reduced-motion: reduce` com `* !important` global (linhas 405-413)

### 14.2. Achados

**🟠 Alto — View transitions podem falhar silenciosamente**
- `if (document.startViewTransition)` — fallback para navegação normal
- Nem todos os browsers suportam (Safari só a partir de 18.2)
- Sem fallback visual para quem não suporta

**🟡 Médio — `prefers-reduced-motion` existe em `animations.css` mas classes utilitárias em `index.css` não têm proteção individual**
- `animations.css` tem `@media (prefers-reduced-motion: reduce)` com `* { animation-duration: 0.01ms !important }` (linhas 405-413) — cobre todo o app via cascata
- No entanto, `index.css` define `.anim-fade`, `.anim-scale`, `.anim-up` sem proteção própria — dependem do `*` global em animations.css
- Se `animations.css` for removido ou carregado antes de `index.css`, a proteção é perdida
- Ideal: colocar `prefers-reduced-motion` em cada animation class individualmente

**🟡 Médio — Microinterações faltando**
- Botões não têm feedback de press (ripple)
- M3: `state-layer` com ripple em todos os componentes interativos
- List items não têm hover state consistente em mobile

**🟢 Bom — Toast com animação de entrada/saída**
- `anim-up` para entrar, `anim-out` com `setTimeout(250)` para sair
- `isExiting` state previne layout shift

**🟢 Bom — Sidebar com overlay + blur**
- `bg-black bg-opacity-50` + `transition-transform duration-300`
- Overlay fecha ao clicar fora (mobile)

### 14.3. Recomendações

- Modularizar `prefers-reduced-motion` em cada classe de animação (não depender de `* !important` global)
- Implementar state-layer (ripple) em botões
- Adicionar micro-interações em cards, list items, toggles
- Fallback visual para view transitions não suportadas
- Aproveitar keyframes avançados de `animations.css` (orbDrift, cardPopIn, staggerIn) em componentes do app

---

## C.15. Feedback Visual e Loading

### 15.1. O que existe

- `PageSkeleton` (layout-aware)
- Spinner (componente `Spin`)
- Botões com `loading` state (desabilitado + spinner)
- Skeleton no AI Insights
- Skeleton no Stripe Checkout initialization
- Toast success/error/warning
- SyncBadge (status sync)
- Offline banner

### 15.2. Achados

**🟡 Médio — Tempo limite de loading sem progresso**
- `dataLoading` timeout de 25 segundos: `setTimeout(() => { setDataLoading(false); }, 25000)`
- Usuário vê "Carregando..." por até 25s sem indicador de progresso
- Stripe: após 10s, sugere "Deixar para depois e enviar por e-mail"

**🟡 Médio — SyncBadge conflita com modais (z-index)**
- `position:fixed; top:62; right:8` — sobrepõe header/content
- `z-index: 9999` — maior que todos os modais (que usam `z-50` = z-index 50 no Tailwind)
- Se um modal estiver aberto durante sincronização, SyncBadge sobrepõe conteúdo modal
- Ideal: `z-index` do SyncBadge deve ser menor que o de modais, ou integrar dentro do header fixo

**🟡 Médio — Loading states inconsistentes entre páginas**
- Dashboard: `PageSkeleton`
- Transações: sem skeleton, lista virtualizada aparece vazia
- Inventory: sem skeleton, tab content aparece direto
- Relatórios: sem skeleton para KPIs

**🟢 Bom — Botões com loading state + disabled**
- `disabled:opacity-40` + `Spin.white` — feedback claro de processamento
- Botão não pode ser clicado enquanto carrega

**🟢 Bom — Skeleton no Stripe checkout**
- 3 skeleton bars (44px, 44px, 48px) que correspondem ao form layout
- Reduz percepção de espera

### 15.3. Recomendações

- Substituir timeout de 25s por progresso real ou timeout mais curto + ação sugerida
- Skeleton em TODAS as páginas (não só dashboard)
- SyncBadge com posição dentro do header (não fixed com z-index 9999)

---

## C.16. Stripe / Pagamentos

### 16.1. O que existe

- Stripe Checkout (subscription + payment)
- Setup Intent para salvar cartão
- Card Preview
- Remover cartão
- Gerenciar assinatura
- Cancelamento
- Admin test mode

### 16.2. Achados

**🟡 Médio — `return_url` com hash pode perder estado**
- `return_url: window.location.origin + '/?checkout=success#planos'`
- Se o usuário recarregar a página, perde o estado de checkout
- Stripe recomenda `return_url` limpo e tratar via webhook

**🟡 Médio — Sem confirmação de cobrança bem-sucedida via webhook no frontend**
- `confirmSubscription` é chamado mas sem verificação real no front
- Usuário pode ver "sucesso" mesmo sem confirmação do Stripe

**🟢 Bom — Skeleton na inicialização do Stripe**
- `phase: 'loading'` com skeleton até `clientSecret` chegar
- Error state com retry

**🟢 Bom — CardPreview + confirmação de troca**
- Preview do cartão antes de confirmar troca
- Flag `confirmRemove` para ações destrutivas

---

## C.17. E-mail / IA

### 17.1. O que existe

- Templates de e-mail pré-definidos
- Editor de e-mail (para, assunto, corpo)
- Envio automático via Edge Function
- Cópia para clipboard
- IA para gerar texto (modo "email")

### 17.2. Achados

**🟡 Médio — IA pode gerar texto sem revisão**
- `askAI` retorna texto diretamente no `body`
- Usuário pode enviar sem revisar
- Stripe: todas ações sensíveis têm confirmação

**🟡 Médio — Template "custom" não reseta campos**
- `setTpl('custom')` só muda o template selecionado, sem limpar campos
- Se usuário seleciona template e volta para custom, campos ficam preenchidos

**🟢 Bom — Templates predefinidos com fallback**
- Array `TEMPLATES` com subject + body
- Botões de seleção visual com cor da marca no ativo

---

## C.18. Notificações e Erros

### 18.1. O que existe

- Toast (success, error, warning, info)
- Confirm dialog para exclusões
- Error boundaries (feature + widget)
- Offline banner
- Update banner
- Alerta de estoque baixo
- Limite de plano atingido (UpgradeModal)
- Sincronização (SyncBadge)

### 18.2. Achados

**🟠 Alto — Erros de rede são genéricos**
- "Erro ao salvar. Tente novamente." — sem detalhe do problema
- Stripe: erro específico + action item + error code + docs link
- Financia: `catch(_) { toast('Erro...', 'error') }` sem log visível

**🟡 Médio — Toast não diferencia entre warning e info visualmente**
- `ICON` e `BG` tratam warning (âmbar) e success/info, mas info não tem cor dedicada
- `ICON.info` usa `success` (check verde) como fallback — enganoso

**🟡 Médio — "Agendar" e-mail não existe**
- Envio é síncrono; se servidor demorar, usuário espera
- Stripe: >10s vira background + e-mail

**🟢 Bom — Error boundary com fallback por widget**
- Um widget não derruba a página
- FeatureErrorBoundary captura erro e mantém o resto funcional

### 18.3. Checklist de Erro (vs Stripe)

| Atributo | Stripe | Financia |
|---|---|---|
| Mensagem específica | ✅ "Card declined by issuing bank" | ❌ "Erro ao salvar" |
| Recovery step | ✅ "Ask customer to contact their bank" | ❌ "Tente novamente" |
| Error code | ✅ `declined_insufficient_funds` | ❌ |
| Docs link | ✅ | ❌ |
| Inline validation | ✅ | ⚠️ (parcial) |

---

## 5. Plano de Ação

### 🔴 Crítico (corrigir imediatamente)

| # | Problema | Impacto | Referência |
|---|---|---|---|
| C1 | Sem skip link | Usuários de teclado/screen reader pulam todo nav a cada página | WCAG 2.4.1 |
| C2 | Modais sem focus trap | Usuário de screen reader perde contexto; Tab vaza do modal | WCAG 2.1.2 |
| C3 | Sem command palette (⌘K) | Navegação lenta, descoberta de funcionalidades baixa | Linear/Notion/Figma |
| C4 | Links legais (#hash quebrados) | Risco legal, usuário não acessa política/termos | LGPD |
| C5 | Botões destrutivos sem undo | Perda de dados sem recovery | Stripe (undo 5s) |

### 🟠 Alto (corrigir em 1–2 sprints)

| # | Problema | Impacto | Referência |
|---|---|---|---|
| A1 | Gráfico não sincroniza com período | Expectativa quebrada | Stripe/Linear |
| A2 | Toast bottom-center conflita com nav | Sobreposição de conteúdo crítico | Stripe (top-right) |
| A3 | Ajuste de estoque só adiciona | Fluxo incompleto, 2 cliques onde 1 basta | — |
| A4 | Stock adjustment sem audit trail | Sem rastreabilidade | GitHub/Stripe |
| A5 | Empty state com dados falsos (preview) | Pode confundir usuário | Stripe (dashboard-zero) |
| A6 | Heading hierarchy não semântica | Screen reader navigation prejudicada | WCAG 1.3.1 |
| A7 | `prefers-reduced-motion` depende de `* !important` global (frágil) | Usuários com vestibular podem ter desconforto se CSS falhar | WCAG + Apple HIG |
| A8 | Categorias fixas (hardcoded) | Taxonomia limitada | Notion/Atlassian |
| A9 | Onboarding não educa sobre o app | Primeira experiência confusa | Linear/Notion |
| A10 | Erros genéricos sem recovery step | Usuário não sabe como resolver | Stripe |
| A11 | 93 ocorrências de cores fixas (text-white, bg-white) | Quebra white-label personalizado | — |

### 🟡 Médio (melhorias contínuas)

| # | Problema |
|---|---|
| M1 | BottomNav labels em 10px (ilegível) |
| M2 | FAQ accordion com maxHeight fixo (corta conteúdo) |
| M3 | Contadores animados sem ARIA live |
| M4 | Navegação mensal sem dropdown para pular |
| M5 | AI card skeleton genérico |
| M6 | Venda multi-item perde descrição detalhada |
| M7 | Edit sempre abre modal (sem inline edit) |
| M8 | SessionStorage para hint de tab (perde em nova aba) |
| M9 | Upload de logo como data URL (pesado) |
| M10 | Gray color as único indicador de estado (UsageBar) |
| M11 | ARIA landmarks semânticos não verificados |

### ✅ Forças a Preservar

| # | Força |
|---|---|
| G1 | Offline-first com Dexie + sync automático |
| G2 | Contraste programático com `onColor` |
| G3 | Virtualized list com TanStack Virtual |
| G4 | `min-h-[44px]` em todos os alvos de toque |
| G5 | Error boundaries em duas camadas |
| G6 | Skeleton loaders com layout-aware |
| G7 | View transitions nativas |
| G8 | Modais responsivos (bottom-sheet → centered) |
| G9 | CardPreview com fases de loading |
| G10 | Password strength meter |
| G11 | Stripe error handling com friendly messages |
| G12 | Empty states educativos (dashboard, estoque, relatórios) |
| G13 | Spinner com `role="status"` e `sr-only` |
| G14 | ExportButtons com `role="group"` e `aria-label` |
| G15 | `animations.css` com `prefers-reduced-motion` e keyframes avançados (orbDrift, cardPopIn, staggerIn) |
| G16 | Scroll reveal no landing com IntersectionObserver |

---

## 6. Riscos

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|--------------|---------|-----------|
| R1 | `npm run lint` e `npm test` timeout recorrente | Alta | Impede validação automatizada de regressões | Configurar CI para rodar lint/test em ambiente dedicado |
| R2 | `docs/ARCHITECTURE.md` com 21 discrepâncias | Alta | Nova documentação pode basear-se em info desatualizada | Correção independente após este report |
| R3 | Cores fixas (93 ocorrências) quebram white-label | Média | Cliente com paleta escura vê texto branco em bg claro | Substituição gradual por variáveis CSS temáticas |
| R4 | Modais sem focus trap (WCAG 2.1.2 falha A) | Alta | Risco legal de acessibilidade, usuários de screen reader excluídos | Priorizar correção via `<dialog>` nativo |
| R5 | SyncBadge z-index 9999 sobrepõe modais | Baixa | Usuário vê badge sobre conteúdo modal durante sync | Reduzir z-index ou integrar no header |
| R6 | links #hash de privacidade/termos quebrados | Alta | Risco legal (LGPD), usuário não acessa políticas | Corrigir rotas para páginas reais |

## 7. Auto-Revisão

| Pergunta | Resposta |
|----------|----------|
| Pesquisei profundamente (web, docs, RFC)? | **Sim** — 7 pesquisas web, 4 subagentes, MCP Stripe, migrations SQL |
| Usei todas as ferramentas disponíveis? | **Sim** — WebSearch, Task, Read, Edit, Write, Grep, Glob, MCP Stripe |
| Segui todas as regras do CLAUDE.md? | **Sim** — atuei como especialista UX, produzi 1 documento, segui o template do PROMPT_UNIVERSAL.md |
| Existe solução melhor ou mais simples? | **Não** — o formato REPORT com apêndices balanceia completude e estrutura |
| Implementei algo sem autorização do Integrador? | **Não** — apenas diagnostiquei, não implementei código |
| Existe overengineering no que produzi? | **Não** — as listas de keyframes e arquivos são referências úteis para implementação |
| Posso simplificar sem perder qualidade? | **Não** — a estrutura já está otimizada entre resumo executivo e detalhamento |
| Documentei corretamente (tipo, status, bloco)? | **Sim** — `type: REPORT` sem status block (conforme regra para REPORT) |

---

## Apêndice A — Metodologia

| Ferramenta | Uso |
|---|---|---|
| Caminhada cognitiva | Simular fluxo de usuário novo em cada tela |
| Auditoria heurística | 10 heurísticas de Nielsen + 9 design systems |
| WCAG 2.2 AA + AAA | Checklist de 18 critérios aplicáveis (AA obrigatórios, AAA como referência) |
| Code review | Verificação de props, estados, handlers |
| Teste de contraste | Simulação mental com valores de cor |
| Subagentes paralelos (Task) | Database schema via migrations, Stripe products via MCP, documentação vs código, pesquisa de referências |
| Pesquisa web | Validação de WCAG 2.4.13, M3 Expressive 2025, Apple HIG iOS 26, Stripe undo patterns |

## Apêndice B — Severidade

| Nível | Definição | Prazo |
|---|---|---|
| 🔴 Crítico | Bloqueia tarefa do usuário, falha legal, falha WCAG A/AA | Imediato |
| 🟠 Alto | Frustração significativa, perda de eficiência, falha WCAG AA | 1–2 sprints |
| 🟡 Médio | Desconforto, inconsistência, melhoria desejável | Backlog |
| 🟢 Bom | Funciona bem | Preservar |
