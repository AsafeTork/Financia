---
type: REFERENCE
---

# MANUAL TÉCNICO E ARQUITETURA — FINANCIA

Este documento consolida a arquitetura técnica completa do projeto **Financia**. Ele atua como o manual definitivo do sistema para engenheiros de software e arquitetos.

---

## 1. VISÃO GERAL E TECNOLOGIAS (STACK)

O Financia é um aplicativo *white-label* de gestão financeira para pequenas empresas. O aplicativo é projetado para ser **offline-first** (funciona sem conexão com a internet) e roda como PWA (Web), APK Android (WebView), ou executável Windows (Electron).

| Camada | Tecnologia | Versão | Notas |
| :--- | :--- | :--- | :--- |
| **Frontend** | React + Vite | 18 + 5 | Roteamento por hash, renderizações lazy-loaded |
| **Estilos** | Tailwind CSS + CSS Variables | v3 | Permite mudança dinâmica do tema e cores |
| **Backend** | Supabase | — | PostgreSQL 17 + Auth + RLS + Edge Functions |
| **Offline** | Dexie.js (IndexedDB) | v3 | Banco de dados local com sincronização background |
| **Desktop** | Electron | 31 | Carrega a URL de produção web nativamente |
| **Deploy** | Render | — | Static Site com auto-deploy no push para `main` |
| **CI/CD** | GitHub Actions | — | Compilação automática de APK Android e EXE Windows |
| **Cobrança** | Stripe | — | Stripe Elements + Assinaturas + Venda de White-label |
| **Testes** | Vitest + Testing Library | — | 640+ testes (core: 471+ pass) |

### Estrutura de Diretórios (Organização por Domínio — Feature-First)

O projeto adota uma estrutura **feature-first**: cada domínio de negócio é auto-contido em `src/features/`, com componentes compartilhados em `src/shared/` e infraestrutura em `src/lib/`.

- `src/`: Todo o código-fonte frontend React do projeto.
  - `src/App.jsx`: Estado global centralizado, tratamento de rotas por hash e integração dos hooks customizados.
  - `src/main.jsx`: Ponto de entrada do React.
  - `src/index.css` & `animations.css`: Folha de estilo global com variáveis CSS (tokens) e animações.
  - `src/core/`: Bootstrap e providers raiz (`boot.js`, `providers.jsx`).
  - `src/routes/`: Roteamento centralizado (`routes.jsx`).
  - `src/features/`: Código organizado por domínio de negócio.
    - `features/auth/`: Login, sessão, impersonação.
    - `features/transactions/`: CRUD de receitas e despesas.
    - `features/inventory/`: Produtos e perdas.
    - `features/dashboard/`: Visão geral financeira.
    - `features/reports/`: Relatórios e exportações.
    - `features/settings/`: Configurações do usuário.
    - `features/admin/`: Painel de administração.
    - `features/plans/`: Assinaturas e planos.
    - `features/branding/`: Editor de identidade visual (white-label).
    - `features/landing/`: Páginas públicas (landing, privacidade, termos).
  - `src/shared/`: Componentes reutilizáveis de interface (Sidebar, Header, BottomNav, UI primitives).
  - `src/lib/`: Código JS puro (integrações de APIs, banco local e funções utilitárias).
    - `dexie.js`: Schema Dexie (IndexedDB) + engine de sincronização push-based.
    - `sync.js`: Sincronização bidirecional offline-remoto + consultas de administração.
    - `supabase.js`: Inicialização do cliente Supabase.
    - `auth.js`: Funções de login, logout e reset de senha.
    - `constants.js`: Valores iniciais, limites de plano, presets de cores e objetos de menu.
    - `utils.js`: Lógica de cores (luminância, hexToHsl), formatações numéricas e datas.
    - `stripe.js`: Utilitários Stripe (tradução de erros e estilos de inputs).
    - `aiClient.js`: Integração com a Edge Function de Inteligência Artificial.
    - `recurring.js`: Processador de lançamentos financeiros recorrentes.
    - `exporters.js`: Exportadores de relatórios para formato PDF ou CSV.
    - `crud.js`: Métodos auxiliares de banco local com disparo imediato de sincronização.
    - `pwa.js`: Utilitário de registro e atualização do Service Worker.
  - `src/test/`: Configuração de contextos e testes do frontend.
- `supabase/`: Migrações SQL e Deno Edge Functions.
  - `supabase/migrations/`: Migrações do banco PostgreSQL.
  - `supabase/functions/`: Edge Functions (Stripe, admin, IA).
- `electron/`: Script do processo principal (`main.cjs`) para carregar o app em janela Windows nativa.
- `scripts/`: Scripts utilitários de desenvolvimento (geração de ícones, verificação de sintaxe).

---

## 2. ARQUITETURA FRONTEND E ROTEAMENTO

O Financia evita bibliotecas pesadas de roteamento ou estados compartilhados complexos (como Redux, Zustand ou React Context). 

### Roteamento Baseado em Hash (Hash Routing)
A navegação funciona monitorando o fragmento de hash da URL (`window.location.hash`).
- **Páginas Logadas Válidas**: `#dashboard`, `#income`, `#expense`, `#inventory`, `#email`, `#report`, `#settings`, `#planos`.
- **Páginas Públicas (Sem Login)**: `#landing`, `#privacidade`, `#termos`.
- A mudança de rotas ativa a View Transitions API com suporte a animações nativas de transição de tela:
  ```javascript
  const navTo = function(v) {
    if (document.startViewTransition) {
      document.startViewTransition(function() {
        React.startTransition(function() { setView(v); });
      });
    } else {
      setView(v);
    }
    window.location.hash = v;
  };
  ```

### Gerenciamento de Estado Centralizado
Todo o estado de sessão e dados de negócio reside na raiz (`App.jsx`). Os dados são distribuídos para as views filhas através de propriedades (*props*). 
- O carregamento inicial usa `React.Suspense` com `<PageSkeleton />` para todas as views lazy-loaded.
- **Otimização**: Componentes grandes como `Sidebar.jsx`, `Header.jsx` e `BottomNav.jsx` utilizam `React.memo` para evitar re-renderizações desnecessárias causadas por mudanças frequentes no estado geral de transações ou sincronização.

---

## 3. BANCO DE DADOS E ESTRUTURA OFFLINE-FIRST

O IndexedDB local (Dexie.js) é a **fonte da verdade de gravação imediata**. O Supabase na nuvem atua como o repositório central sincronizado.

### 3.1. Esquema de Tabelas (Local e Nuvem)

#### `company_profiles`
Guarda dados do cliente e regras visuais (branding).
- `user_id` (UUID PK): ID do usuário no Supabase Auth.
- `name` (TEXT): Nome fantasia da empresa.
- `email` (TEXT): E-mail do cliente.
- `logo` (TEXT): Fallback da logo em texto.
- `logo_url` (TEXT): URL pública da imagem da logo no Supabase Storage.
- `color`, `color_secondary`, `color_accent` (TEXT): Hexadecimais `#RRGGBB` para branding.
- `theme` (TEXT): `'light'` ou `'dark'`.
- `phone` (TEXT): WhatsApp do cliente.
- `niche` (TEXT): Segmento comercial.
- `white_label` (BOOLEAN): Habilita visual personalizado e exportação limpa.
- `custom_palette` (BOOLEAN): Registra se o usuário alterou cores manualmente.
- `visual_version` (INTEGER): Incrementador para estourar o cache local das logos/cores.
- `plan` (TEXT): `'free'` | `'pro'` | `'premium'`.
- `plan_expires_at` (TIMESTAMPTZ): Data limite de expiração da assinatura.
- `plan_activated_by` (TEXT): `'stripe'` | `'admin'`.
- `custom_price_cents` / `custom_price_cents_pro` / `custom_price_cents_premium` / `custom_price_cents_white_label` (INTEGER): Descontos aplicados individualmente por um Admin.

#### `transactions` / `products` / `losses`
- Armazenam lançamentos de caixa, dados de estoque e registros de desperdício.
- No banco de dados local (Dexie), essas tabelas possuem três campos de controle essenciais:
  - `_synced` (INTEGER): `0` (pendente de envio) ou `1` (sincronizado).
  - `_deleted` (INTEGER): `1` se o registro foi deletado pelo usuário enquanto estava offline.
  - `_updated_at` (INTEGER): Timestamp numérico da última alteração.

### 3.2. Ciclo de Sincronização (Sync Loop)

O loop de sincronização (`useSyncLoop.js`) roda em background a cada **2 minutos**, ao reconectar à internet (`online`), ou ao reabrir a aba do navegador (`visibilitychange`). 

#### Processo de Sincronização das Tabelas (`syncTable`):
1. **Fase de Push (Envio)**:
   - Filtra linhas no Dexie com `_synced === 0`.
   - Se `_deleted === 1`, executa o DELETE no Supabase e remove o registro permanentemente do Dexie local.
   - Caso contrário, faz o `upsert` no Supabase utilizando apenas os campos permitidos e marca `_synced = 1` na linha local após o retorno bem-sucedido.
2. **Fase de Pull (Recebimento)**:
   - Busca alterações no Supabase ocorridas desde o último sync (`updated_at >= lastSync`).
   - Resolução de Conflitos: **Last-Write-Wins com viés local**.
     - Se o registro local está modificado mas não sincronizado (`_synced === 0`), a linha remota é ignorada. O estado local sempre vence.
     - Se o registro local já está sincronizado (`_synced === 1`), a versão remota substitui a local apenas se o timestamp remoto for mais recente.
3. **Limpeza de Órfãos (Orphan Cleanup)**:
   - Busca todos os IDs da tabela no Supabase e deleta do Dexie qualquer linha com `_synced === 1` cujo ID não exista mais na nuvem (removida por outros dispositivos).

---

## 4. BRANDING E WHITE-LABEL DINÂMICO

O sistema de identidade visual dinâmico do Financia funciona em três níveis de permissão:

```
[Branding do Plano] ──> Paletas de cores padrão fixas (free/pro/premium).
[White-label Adquirido] ──> Permite upload de logo e cores livres via settings.
[Configuração Admin] ──> Controle total do visual no painel do administrador.
```

### Paletas Padrão por Plano (`PLAN_VISUAL_DEFAULTS`):
- **Free**: Primária: `#0f3d3e` (Petróleo) | Secundária: `#ccfbf1` | Ação: `#0d9488`
- **Pro**: Primária: `#2563EB` (Azul) | Secundária: `#e0e7ff` | Ação: `#4F46E5`
- **Premium**: Primária: `#0F172A` (Grafite) | Secundária: `#fef3c7` | Ação: `#D4AF6A`

### Injeção de Estilo na Raiz (`<html>`)
O hook `useBrandAppearance.js` intercepta o perfil de branding ativo, valida se o usuário possui plano `white_label = true` e injeta as variáveis no `documentElement.style`:
- `--brand` (Cor principal da marca)
- `--brand-soft` (Cor principal com 8% de opacidade para fundos sutis)
- `--brand-secondary` (Cor secundária)
- `--brand-accent` (Cor de destaque e botões de chamada)
- `--brand-accent-soft` (Destaque com 12% de opacidade)
- `--brand-grad` (Gradiente linear em ângulo de 135 graus)

Os atributos `data-plan` e `data-theme` são inseridos na tag `<html>` para aplicar layouts diferenciados e habilitar o modo escuro (*Dark Mode*) no arquivo global `index.css`.

---

## 5. INTEGRAÇÃO COM STRIPE E COBRANÇA

Toda a comunicação com o faturamento do Stripe ocorre através de **Supabase Edge Functions** escritas em TypeScript que rodam no ambiente Deno. O frontend não executa chamadas diretas para a API do Stripe por motivos de segurança.

### 5.1. Estrutura de Edge Functions de Faturamento:
- `create-subscription`: Localiza ou cria um Customer no Stripe e inicializa a assinatura no modo `default_incomplete`, aceitando preços normais ou customizados. Retorna o `client_secret` para o Stripe Elements no frontend.
- `cancel-subscription`: Configura a assinatura ativa para ser cancelada no fim do período de faturamento (`cancel_at_period_end = true`).
- `create-setup-intent` & `set-default-payment-method`: Usados para adicionar, validar e padronizar novas formas de pagamento (cartões de crédito).
- `get-payment-method` / `remove-payment-method`: Listagem básica de cartões salvos e exclusão de formas de pagamento.
- `create-payment`: Cria um PaymentIntent para a taxa de adesão única do pacote *white-label* (R$ 497).
- `stripe-webhook`: Recebe chamadas de webhook enviadas pelo Stripe. Eventos principais:
  - `checkout.session.completed` & `invoice.payment_succeeded`: Chamam a RPC `stripe_activate_plan` no Supabase para alterar o plano e expiração do cliente.
  - `customer.subscription.deleted`: Remove o plano do cliente, rebaixando a conta para `'free'`.

---

## 6. SEGURANÇA E POLÍTICAS DE BANCO (RLS)

A segurança dos dados é garantida pelo isolamento no PostgreSQL 17 utilizando RLS (Row Level Security).

### Políticas de RLS
- **Isolamento de Dados**: Tabelas de negócios (`transactions`, `products`, `losses`) possuem políticas baseadas na fórmula:
  ```sql
  auth.uid() = user_id
  ```
- **Proteção do Plano (company_profiles)**: A alteração direta dos campos relacionados a planos (`plan`, `plan_expires_at`, `plan_activated_by`) é impedida pela política `update_own_branding_only` e por triggers de banco de dados (`prevent_plan_change`), permitindo edições desses campos apenas se a flag de contexto do PostgreSQL `app.allow_plan_change = '1'` estiver ativa (habilitada temporariamente por RPCs com o privilégio `SECURITY DEFINER`).
- **Triggers**:
  - `guard_white_label()`: Reseta silenciosamente alterações no campo `white_label` a menos que a query seja originada por uma conta do sistema (`service_role`).
  - `handle_new_user()`: Trata a criação automática do perfil padrão de empresa e permissão de acesso ao criar uma conta no Supabase Auth.

### Fluxo de Impersonação (Admin ──> Cliente)
Permite que o administrador do sistema simule o acesso de qualquer cliente de forma segura:
1. O administrador clica em "Entrar" no painel e chama a RPC `admin_impersonate_start`.
2. A RPC gera credenciais temporárias no Supabase Auth e salva as informações no `localStorage._imp` com um tempo de vida (TTL) de 60 segundos.
3. Uma nova aba é aberta em modo de simulação (`?imp=1`). Ela faz o login automático com as chaves temporárias e remove o token de cache.
4. Ao fechar a aba de simulação (`pagehide`), a aba envia um sinal cruzado ao navegador. A aba principal do administrador detecta e chama a RPC `admin_impersonate_restore` para restaurar o estado original.

---

## 7. DEPLOY, CI/CD E COMPILADOR DE APLICATIVOS

### Deploy Web
O frontend de produção é hospedado como um Static Site no **Render** (com auto-deploy configurado via `render.yaml` no diretório raiz do projeto). O build compila os recursos finais e os deposita na pasta `./dist`.

### Pipeline de Build (GitHub Actions)
Definido no arquivo `.github/workflows/build.yml`. Esse fluxo suporta geração manual de builds (*dispatch*) para aplicativos customizados dos clientes que adquirem o white-label:
1. **APK Android**: Clona o repositório, instala a JDK 17, baixa a logo customizada do cliente (logo_url), executa o script Python `gen_icons.py` para gerar os formatos e tamanhos corretos, compila via Gradle (`assembleRelease`) e assina o instalador final usando chaves secretas gravadas no GitHub.
2. **Windows Desktop**: Compila o frontend React do projeto, gera o ícone do instalador com a cor primária do cliente através do script `gen_icon_win.py` e executa o `electron-builder` para criar um executável do instalador NSIS.
3. **Releases**: Anexa o APK e o EXE compilados na seção de Releases do repositório no GitHub para o cliente baixar.

O frontend dispara esse fluxo de compilação chamando a função `triggerApkBuild` em `src/lib/sync.js`, que faz uma requisição autenticada diretamente para a API de workflows do GitHub. Um limitador local de 5 minutos impede requisições consecutivas duplicadas.
