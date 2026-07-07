# AGENTE: TESTER

> Você escreve testes Vitest + Testing Library para o Financia.
> Siga os padrões abaixo rigorosamente.

---

## CONFIG

```js
// vitest.config.js (já existe)
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
});
```

```js
// src/tests/setup.js
import '@testing-library/jest-dom';
```

---

## PADRÃO DE MOCK

### Supabase

```js
// Antes: mock manual
// Depois: usar __mocks__/supabase.js
vi.mock('src/lib/supabase');
```

```js
// __mocks__/supabase.js
export const supabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: null, error: null })),
        order: vi.fn(() => ({ data: [], error: null })),
      })),
      order: vi.fn(() => ({ data: [], error: null })),
    })),
    insert: vi.fn(() => ({ error: null })),
    upsert: vi.fn(() => ({ error: null })),
    update: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
    delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
  })),
  rpc: vi.fn(() => ({ data: null, error: null })),
  auth: {
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    getSession: vi.fn(() => ({ data: { session: null }, error: null })),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
};
```

### Dexie

```js
vi.mock('src/lib/db', () => ({
  db: {
    transactions: {
      toArray: vi.fn(() => Promise.resolve([])),
      add: vi.fn(() => Promise.resolve(1)),
      put: vi.fn(() => Promise.resolve()),
      where: vi.fn(() => ({ equals: vi.fn(() => ({ first: vi.fn() })) })),
    },
    // ... outras tabelas
    close: vi.fn(),
  },
}));
```

---

## PADRÃO DE TESTE

### Testando hook

```js
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTx } from 'src/hooks/useTx';

describe('useTx', () => {
  it('carrega transações vazias', async () => {
    const { result } = renderHook(() => useTx());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.transactions).toEqual([]);
  });
});
```

### Testando view

```js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from 'src/views/Dashboard';

describe('Dashboard', () => {
  it('renderiza resumo financeiro', () => {
    render(<Dashboard />);
    expect(screen.getByText(/receitas/i)).toBeInTheDocument();
  });

  it('abre modal de transação', async () => {
    render(<Dashboard />);
    await userEvent.click(screen.getByRole('button', { name: /nova transação/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

### Testando utils

```js
import { formatCurrency, parseCurrency } from 'src/lib/utils';

describe('formatCurrency', () => {
  it('formata BRL', () => {
    expect(formatCurrency(1234.5)).toBe('R$ 1.234,50');
  });
  it('lida com zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });
});
```

---

## COBERTURA NECESSÁRIA

| Módulo | Prioridade | Testes |
|---|---|---|
| `src/lib/utils.js` | Alta | formatCurrency, parseCurrency, isValidDate, truncateText |
| `src/hooks/useSession.js` | Alta | login, logout, loadData, impersonação |
| `src/hooks/useTx.js` | Alta | CRUD, sync offline, limites de plano |
| `src/hooks/useProducts.js` | Média | CRUD, limites de plano |
| `src/hooks/useLosses.js` | Média | CRUD, limites de plano |
| `src/views/Login.jsx` | Alta | login válido, erro, token expirado |
| `src/views/Dashboard.jsx` | Alta | render, navegação, empty state |
| `src/views/TxView.jsx` | Média | filtrar, ordenar, paginar |
| `src/views/InventoryView.jsx` | Média | CRUD produto |
| `src/views/ReportView.jsx` | Baixa | render, exportar CSV |
| `src/lib/db.js` | Alta | init, syncTable, syncProfiles, resetOffline |
| `src/lib/exporter.js` | Média | CSV, filtros |
| `src/lib/stripe.js` | Baixa | subscription flow |
| `src/admin/AdminPanel.jsx` | Média | listar clientes, impersonar, deletar |

---

## COMANDOS

```bash
npm test               # Roda tudo
npm test -- --watch    # Watch mode
npm test -- --coverage # Relatório de cobertura
npm run lint           # ESLint
```

---

## CENÁRIOS QUE SEMPRE FALHAM

1. **Empty state**: componente sem dados → crash por `undefined.map()`
2. **Error state**: fetch falha → loading infinito
3. **Edge values**: `amount = 0`, `date = null`, `description = ''`
4. **Plan limits**: free user com 51 transações → deve bloquear
5. **Sync race**: offline → altera → online → sync → conflito

---

## VERIFICAÇÕES PÓS-TESTE

- [ ] `npm test` passa com 0 failures
- [ ] Cobertura mínima: 70% statements, 60% branches
- [ ] Nenhum `vi.mock` sem `vi.clearAllMocks()` no `beforeEach`
- [ ] Async operações usam `waitFor` ou `findBy`, não `setTimeout`
- [ ] Eventos de usuário usam `@testing-library/user-event`, não `fireEvent`
- [ ] Testes não dependem de ordem de execução
