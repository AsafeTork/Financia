# INSTRUÇÕES DO SISTEMA E CONTEXTO DO PROJETO (FINANCIA)

> **ATENÇÃO IA:** Este arquivo é a Fonte Única de Verdade (*Source of Truth*) do projeto Financia. Você deve ler e seguir TODAS as diretivas, regras sintáticas e estruturas de dados descritas aqui. Não ignore nenhuma regra sob risco de quebrar o build ou introduzir bugs críticos.

---

## 1. VISÃO GERAL E TECNOLOGIAS

O **Financia** é um aplicativo *white-label* de gestão financeira para pequenas empresas. Ele permite personalização completa de branding (logo, cores, nome) e funciona como um PWA, aplicativo Android (APK) ou executável Windows (Electron).

### Stack Tecnológica
- **Frontend**: React 18 + Vite 5
- **Estilização**: Tailwind CSS v3 + CSS Variables (para temas dinâmicos)
- **Banco Local (Offline-first)**: Dexie.js (IndexedDB) v3 com sincronização automática bidirecional
- **Backend (Nuvem)**: Supabase (PostgreSQL 17 + Auth + RLS + Edge Functions)
- **Desktop**: Electron 31 (carrega o build de produção via `electron/main.cjs`)
- **Assinaturas e Pagamentos**: Stripe (Stripe Elements)
- **Testes**: Vitest + Testing Library

---

## 2. DIRETRIZES DE COMPORTAMENTO E QUALIDADE DA IA (OBRIGATÓRIO)

Para garantir a excelência técnica e proatividade no desenvolvimento, você DEVE seguir estas diretivas comportamentais:

- **Serviço Completo e com Qualidade**: Nunca deixe o trabalho inacabado ou com placeholders. Implemente as soluções de ponta a ponta, fazendo o serviço correto e deixando o código melhor do que encontrou (Regra do Escoteiro).
- **Proatividade Técnica**: Tente fazer mais ou melhor do que o usuário pediu. Tome as melhores decisões técnicas autonomamente quando houver ambiguidades, sempre priorizando robustez, performance e segurança.
- **Sincronia com Documentação**: Sempre que você modificar, adicionar ou remover qualquer funcionalidade, código ou ferramenta, você é obrigado a atualizar TODAS as documentações relacionadas (na pasta `docs/` e no `.cursorrules`). A documentação deve refletir fielmente a implementação real imediatamente.
- **Testes Abrangentes e Ocultos**: Escreva testes unitários e de integração abrangentes. Teste caminhos alternativos, fluxos de uso que parecem invisíveis ao usuário comum e cenários de erro complexos que outras IAs geralmente ignoram. Garanta que o software seja robusto contra bugs de concorrência ou sincronização offline.
- **Uso de Agentes Especializados**: Se o usuário pedir ou se a complexidade da tarefa exigir pesquisa paralela, auditoria ou depuração profunda, utilize subagentes especializados para dividir e conquistar o problema com máxima eficiência.
- **Limpeza de Código**: Ao remover ou substituir uma biblioteca ou ferramenta, certifique-se de limpar todos os resíduos, arquivos inutilizados, hooks e imports órfãos relacionados a ela.

---

## 3. REGRAS SINTÁTICAS E ANTI-PADRÕES INEGOCIÁVEIS (CRÍTICO)

Estas regras previnem erros comuns de build no Vite e incompatibilidade com navegadores legados (mobile e desktop).

| Regra | Status | Motivo |
| :--- | :--- | :--- |
| **PROIBIDO** o uso de encadeamento opcional (`?.`) | ❌ **PROIBIDO** | Browsers antigos e WebViews de Android legados quebram o interpretador. Use fallback lógico (`x && x.y`) ou verificações seguras. |
| **PROIBIDO** arrow spread inicial: `=> ({...spread, x})` | ❌ **PROIBIDO** | Causa erro de parse (*Syntax Error*) na minificação do build de produção do Vite. Use return explícito `{ return { ...spread, x }; }`. |
| **PROIBIDO** short-circuit com `&&` em JSX | ❌ **PROIBIDO** | Use operador ternário (`condicao ? <Componente /> : null`) ou guarde o elemento em uma variável fora do JSX. Evita renderizações indesejadas de `0` ou `false`. |
| **PROIBIDO** usar Emojis em strings JS/JSX | ❌ **PROIBIDO** | Quebra o encoding de caracteres em determinadas plataformas ou builds. Use ícones SVG ou classes Lucide/React-Icons. |
| **PROIBIDO** uso de `var` | ❌ **PROIBIDO** | Use estritamente `const` ou `let` (escopo de bloco correto). |
| **PROIBIDO** cores fixas do Tailwind (ex: `bg-white`, `text-black`) | ❌ **PROIBIDO** | Quebra o sistema de *white-label*. Use sempre variáveis CSS declaradas no tema: `var(--bg-card)`, `var(--text-main)`, `var(--brand)`. |

---

## 4. ARQUITETURA DE BANCO DE DADOS

O Financia é **offline-first**. As gravações ocorrem primeiro no IndexedDB (via Dexie.js) e depois são sincronizadas com o Supabase.

### 3.1. Tabelas (IndexedDB & Supabase)

#### `company_profiles` (Dados de Perfil e Marca)
- `user_id` (UUID, Primary Key) - Relacionado com `auth.users` do Supabase.
- `name` (TEXT) - Nome personalizado da empresa do cliente.
- `email` (TEXT) - E-mail do cliente.
- `logo` (TEXT) - Letra inicial ou fallback de texto do logo.
- `logo_url` (TEXT) - Link público da logo hospedada no Supabase Storage.
- `color` (TEXT) - Cor primária em hexadecimal (`#RRGGBB`).
- `color_secondary` (TEXT) - Cor secundária (`#RRGGBB`).
- `color_accent` (TEXT) - Cor de destaque (`#RRGGBB`).
- `theme` (TEXT) - Tema padrão do cliente (`'light'` ou `'dark'`).
- `phone` (TEXT) - Telefone/WhatsApp do cliente.
- `niche` (TEXT) - Segmento do negócio.
- `white_label` (BOOLEAN) - Ativa/desativa customização de marca (plano pago).
- `custom_palette` (BOOLEAN) - Define se o cliente configurou cores personalizadas manualmente.
- `visual_version` (INTEGER) - Versão do visual/branding (controle de cache).
- `plan` (TEXT) - Plano atual do cliente (`'free'`, `'pro'`, `'premium'`).
- `plan_expires_at` (TIMESTAMPTZ) - Data de expiração da assinatura.
- `plan_activated_by` (TEXT) - Identificação da origem da ativação.
- `custom_price_cents` / `custom_price_cents_pro` / `custom_price_cents_premium` / `custom_price_cents_white_label` (INTEGER) - Descontos específicos cadastrados pelo Admin.
- `updated_at` (TIMESTAMPTZ) - Data da última atualização local/remota.

#### `transactions` (Lançamentos de Caixa)
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `type` (TEXT) - `'income'` (receita) ou `'expense'` (despesa).
- `description` (TEXT) - Descrição da transação.
- `amount` (NUMERIC) - Valor.
- `date` (DATE) - Data da transação.
- `method` (TEXT) - Meio de pagamento.
- `category` (TEXT) - Categoria do lançamento.
- `items` (TEXT) - Descrição detalhada dos itens.
- `registered_by` (TEXT) - Usuário que registrou (em caso de multi-usuário).

#### `products` (Estoque)
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `name` (TEXT) - Nome do produto.
- `category` (TEXT) - Categoria do produto.
- `price` (NUMERIC) - Preço de venda.
- `cost` (NUMERIC) - Custo de aquisição.
- `stock` (INTEGER) - Quantidade em estoque.
- `created_at` (TIMESTAMPTZ)

#### `losses` (Perdas e Desperdícios)
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `description` (TEXT) - Descrição da perda.
- `qty` (INTEGER) - Quantidade perdida.
- `reason` (TEXT) - Motivo da perda (ex: avaria, validade).
- `date` (DATE) - Data do registro.

---

## 5. FLUXO DE DADOS E SINCRONIZAÇÃO (DATA FLOW)

A sincronização de dados funciona de forma bidirecional e é crucial para manter os dados seguros quando o usuário estiver offline:

```
[Login] ──> useAuthBootstrap.getSession()
              │
              └──> useSession.loadData(uid)
                     │
                     ├──> useDataLoader.loadFromLocal(uid) ──> [Lê dados do Dexie e carrega no React State]
                     │
                     ├──> db.syncAll(uid) ───────────────────> [Push local para Supabase + Pull do Supabase para local]
                     │
                     └──> useDataLoader.loadFromLocal(uid) ──> [Re-lê o Dexie atualizado e recarrega na UI]
```

### O Loop de Sincronização (`useSyncLoop.js`)
Ocorre a cada **2 minutos** ou sempre que o usuário altera o foco da aba (`visibilitychange`). 

> ⚠️ **IMPORTANTE:** Se você adicionar um campo na tabela `company_profiles`, você DEVE adicioná-lo no array `PROFILE_WRITE_FIELDS` em `src/lib/db.js`. Caso contrário, o processo de sincronização irá ignorar o campo e ele sumirá após o refresh da página.

---

## 6. REGRAS DE ROTEAMENTO E GERENCIAMENTO DE ESTADO

### Roteamento Seguro
O roteamento do app é feito via **Hash Routing puro** (sem o pacote react-router) no `App.jsx`.
- **Views Válidas**: `'dashboard'`, `'income'`, `'expense'`, `'inventory'`, `'email'`, `'report'`, `'settings'`, `'planos'`.
- **Páginas Públicas**: `'landing'`, `'privacidade'`, `'termos'`.
- Toda navegação utiliza `window.location.hash = '#' + view` e inicia transições usando a API `startViewTransition` do navegador.

### Sem Contexto ou Estado Redux/Zustand
O estado é centralizado no `App.jsx` e consumido através de Hooks Customizados em `src/hooks/`.
- `useTx()`: CRUD e controle de limite de transações.
- `useProducts()`: CRUD de inventário e ajuste de estoque.
- `useLosses()`: CRUD de perdas de mercadoria.
- `useSession()`: Manipula sessão do usuário, impersonação administrativa e controle do plano.
- `useBrandAppearance()`: Gerencia as variáveis de cores do CSS (CSS variables) no document element.
- `useStripeCheckoutInit()`: Inicializa fluxo de checkout Stripe para assinaturas e white-label.

---

## 7. PROTOCOLOS DE DESENVOLVIMENTO (COMO TRABALHAR NO PROJETO)

### 7.1. Como Adicionar um Novo Campo no Perfil (`company_profiles`)
Siga este passo-a-passo exato para não quebrar a sincronização:
1. **Migration no Supabase**: Crie uma nova migration SQL em `supabase/migrations/` alterando a tabela:
   ```sql
   ALTER TABLE company_profiles ADD COLUMN meu_novo_campo TIPO DEFAULT padrao;
   ```
2. **Constantes do Frontend**: Adicione o campo e seu valor padrão em `INIT_BRAND` dentro de `src/lib/constants.js`.
3. **Escrita do Banco Local (Dexie)**: Adicione o nome do campo como string no array `PROFILE_WRITE_FIELDS` em `src/lib/db.js`.
4. **Loaders e Estados**:
   - Atualize a chamada `setBrand` dentro de `useDataLoader.js` (no método `loadFromLocal`) para incluir a leitura do novo campo.
   - Atualize o `setBrand` no hook `useSession.js`.
5. **Gerenciador de Marca**: Atualize as funções de salvamento (ex: `saveBrand`) em `src/hooks/useBrandManager.js` para persistir e fazer o upsert correto.
6. **Segurança (RLS)**: Caso o campo seja relacionado ao design/branding, verifique se a policy `update_own_branding_only` no Supabase permite a alteração de acordo com o plano do usuário (`white_label = true` ou admin).

### 7.2. Como Criar uma Nova View/Tela
1. Crie o arquivo da tela em `src/views/MinhaNovaTela.jsx`.
2. O componente deve ser importado via `React.lazy()` no `App.jsx`:
   ```javascript
   const MinhaNovaTela = React.lazy(function() { return import('./views/MinhaNovaTela'); });
   ```
3. Registre o nome da view na lista `VALID_VIEWS` em `src/App.jsx`.
4. Mapeie o componente dentro do objeto `views` no `useMemo` do `App.jsx`.
5. Adicione um item de navegação correspondente na barra lateral em `src/lib/constants.js` (objeto `NAV`).

### 7.3. Como Utilizar Cores e CSS no Design
Todas as cores devem vir das variáveis do tema (Branding). Nunca crie classes estáticas com cores pré-definidas do Tailwind.

```jsx
// ❌ ERRADO (Quebra a personalização do cliente)
<div className="bg-white text-gray-800 border-blue-500">

//  CERTO (Usa o tema do cliente)
<div className="rounded-xl border p-4" 
     style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', borderColor: 'var(--brand-soft)' }}>
```

Cores Disponíveis na Raiz CSS (`<html>`):
- `var(--brand)`: Cor de marca principal.
- `var(--brand-soft)`: Variação suave da cor principal (ex: para bordas ou fundos leves).
- `var(--brand-secondary)`: Cor secundária.
- `var(--brand-accent)`: Cor de destaque/ação.
- `var(--brand-grad)`: Gradiente gerado a partir do branding do cliente.
- `var(--bg-app)`: Cor do fundo do app.
- `var(--bg-card)`: Fundo de cards e modais.
- `var(--text-main)`: Texto principal.
- `var(--text-muted)`: Texto secundário/suave.

---

## 8. DIRETRIZES DE SEGURANÇA E RPC (REMOTE PROCEDURE CALLS)
- **NÃO FAÇA chamadas diretas ao banco usando privilégios altos (service_role)** no frontend. Toda ação com permissão elevada deve passar por funções PostgreSQL (RPC) definidas com `SECURITY DEFINER`.
- **Prefixos em Parâmetros RPC**: Devido a uma limitação na serialização JSON do PostgREST, toda função RPC com 3 ou mais parâmetros DEVE receber prefixos alfabéticos em seus parâmetros (ex: `a_parametro`, `b_parametro`, `c_parametro`).
  ```sql
  -- Exemplo Correto:
  CREATE OR REPLACE FUNCTION set_client_plan(a_target uuid, b_plan text, c_actor text)...
  ```

---

## 9. PROTOCOLO DE TESTES
- Todos os testes unitários utilizam **Vitest**.
- Mocks para o cliente Supabase e Dexie devem ser importados de arquivos de mock específicos ou mockados via `vi.mock()`.
- O comando padrão para rodar a suíte inteira de testes é `npm run test`. Garanta que todos os testes passsem antes de considerar uma feature finalizada.
