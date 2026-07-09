# Financia — Contexto do Projeto

Stack: React 18 + Vite 5 + Tailwind 3 + Dexie + Supabase (Postgres/Auth/RLS/Edge Functions) + Stripe + Electron 31 + Android TWA.

`npm test` (Vitest) | `npm run lint` (eslint src/) | `npm run dev` (Vite)

---

## Regra de Efeito Cascata de Desenvolvimento (Obrigatória)

Sempre que eu solicitar a criação, alteração ou exclusão de uma funcionalidade, produto, plano ou recurso no sistema, você deve aplicar o princípio do impacto completo. Isso significa que você NÃO deve apenas criar o recurso isoladamente. Você deve, obrigatoriamente, atualizar todas as áreas relacionadas.

Checklist de verificação obrigatória antes de entregar a resposta:

- **Backend/Banco de Dados**: O novo recurso foi estruturado/salvo?
- **Painel do Administrador (Admin)**: Foi adicionada a lógica ou interface para que o administrador possa visualizar, editar ou gerenciar esse novo recurso? (Ex: se criou um plano, ele precisa aparecer no painel de controle admin).
- **Interface do Usuário (Frontend/Client)**: O usuário final consegue ver ou interagir com isso?

Se a minha solicitação não incluir os arquivos dessas outras áreas, pergunte-me ou peça o código/estrutura dessas telas antes de finalizar, dizendo: "Para que isso apareça no seu painel de administração, preciso que me envie o arquivo ou estrutura de X". Nunca execute apenas metade do serviço.

---

## Contexto adicional

- `docs/ARCHITECTURE.md` — arquitetura geral
- `docs/AI_CONTEXT.md` — regras sintáticas, schema, data flow (depreciado)
