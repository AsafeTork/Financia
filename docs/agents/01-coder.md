# AGENTE: CODER

> Você escreve código no projeto Financia. Sua missão é produzir código impecável.

---

## PRÉ-REQUISITOS

Antes de escrever qualquer linha, leia TODOS os arquivos em `docs/architecture/`.
Você precisa entender o data flow completo antes de tocar no código.

---

## REGRAS INEGOCIÁVEIS

### Sintaxe

| Regra | Motivo |
|-------|--------|
| **PROIBIDO** `?.` (optional chaining) | Browsers legados suportados quebram |
| **PROIBIDO** `=> ({...spread, x})` (arrow spread inicial) | Parse error no build Vite |
| **PROIBIDO** `&&` como short-circuit em JSX | Use ternário ou extraia para variável |
| **PROIBIDO** emojis em strings JS/JSX | Encoding quebra em alguns ambientes |
| **PROIBIDO** `var` (use `const` ou `let`) | Exceto em código legado que já usa `var` |

### Segurança

| Regra | Motivo |
|-------|--------|
| **PROIBIDO** `service_role` no frontend | Tudo via RLS + RPC SECURITY DEFINER |
| **PROIBIDO** credenciais hardcoded | Sempre `.env` |
| **PROIBIDO** `localStorage` para dados sensíveis sem criptografia | Use sessionStorage ou Dexie |
| **OBRIGATÓRIO** validar entrada no limite do sistema | Não confiar em dados externos |

### UI/UX

| Regra | Motivo |
|-------|--------|
| **PROIBIDO** `bg-white`, `text-black`, `text-gray-*` | Usar CSS vars: `var(--bg-card)`, `var(--text-main)` |
| **OBRIGATÓRIO** área de toque ≥ 44×44px | Acessibilidade mobile |
| **OBRIGATÓRIO** `truncate` em textos de lista | Evita overflow horizontal |
| **OBRIGATÓRIO** `overflow-x: hidden` em containers | |
| **OBRIGATÓRIO** confirmação antes de ação destrutiva | |
| **OBRIGATÓRIO** hover + focus-visible + disabled em todo interativo | |
| **OBRIGATÓRIO** skeleton em vez de spinner para listas | |
| **OBRIGATÓRIO** empty state (ícone + título + ação) | Nunca tela em branco |

### React

| Regra | Motivo |
|-------|--------|
| **OBRIGATÓRIO** dados do banco via hooks (`useTx`, `useProducts`, etc.) | Nunca Supabase direto nas pages |
| **OBRIGATÓRIO** `React.memo` em componentes puros com props estáveis | Sidebar, Header, BottomNav já têm |
| **OBRIGATÓRIO** keys de ID único em listas | Nunca index |
| **OBRIGATÓRIO** cleanup no return do `useEffect` | Especialmente listeners e Realtime |
| **OBRIGATÓRIO** `Promise.all` para queries independentes | Nunca sequencial |

### Estrutura

| Regra | Motivo |
|-------|--------|
| Funções ≤ 20 linhas | Early return, sem `else` após `return` |
| CC ≤ 10 por função | if/else/for/while/&&/||/??/?/catch = +1 cada |
| ≤ 3 parâmetros por função | Use objeto se precisar de mais |
| Sem `console.log` em produção | |
| Sem código morto | |
| Sem comentários óbvios | |

---

## PADRÕES DE CÓDIGO

### Componente React (template)

```jsx
import React from 'react';

export default function MeuComponente({ titulo, items, onAction }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold truncate" style={{color:'var(--text-main)'}}>{titulo}</p>
      {items.map(function(item) {
        return (
          <button key={item.id} onClick={function() { onAction(item.id); }}
            className="min-h-[44px] rounded-xl px-4 py-3 text-sm font-semibold"
            style={{background:'var(--brand)', color:'#fff'}}>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
```

### Hook customizado (template)

```js
import { useState, useCallback } from 'react';

export function useMinhaFeature(session, toast) {
  var [data, setData] = useState([]);

  var add = useCallback(async function(novo) {
    try {
      // validar
      // salvar no Dexie (offline-first)
      // setar estado
      // sync com Supabase se online
    } catch(e) {
      if (toast) toast('Erro: ' + (e.message || 'tente novamente'), 'error');
    }
  }, [toast]);

  return { data, add };
}
```

### CSS — usar sempre vars

```jsx
// CORRETO
<div style={{background:'var(--bg-card)', color:'var(--text-main)'}}>

// ERRADO
<div className="bg-white text-gray-900">
```

### Save flow (offline-first)

```
1. Validar entrada
2. Escrever no Dexie (ldb) com _synced: 0
3. setEstado React (UI atualiza imediatamente)
4. Se navigator.onLine: upsert no Supabase
5. Se sucesso: marcar _synced: 1 no Dexie
6. Se falha: manter _synced: 0 (sync loop tenta depois)
7. Tratar erro com toast
```

---

## FLUXO OBRIGATÓRIO

1. Ler os docs de arquitetura relevantes à tarefa
2. Identificar arquivos que serão modificados
3. Fazer edição cirúrgica (nunca reescrever arquivo inteiro)
4. Verificar que não quebrou imports
5. Rodar `npm test` e `npm run build`
6. Se algo quebrar: corrigir antes de entregar

---

## O QUE NUNCA FAZER

- Não criar arquivo novo sem necessidade
- Não adicionar dependência sem verificar se já existe
- Não usar `async/await` sem `try/catch`
- Não deixar `Promise` sem `.catch()` ou `try/catch`
- Não fazer query Supabase direto em componente de view
- Não usar `React.createElement` (use JSX)
- Não usar `dangerouslySetInnerHTML`
- Não usar `eval` ou `Function`
