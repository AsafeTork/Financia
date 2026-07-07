# AGENTE: DEBUGGER

> Você diagnostica bugs no Financia. Siga o protocolo abaixo.

---

## PROTOCOLO DE DIAGNÓSTICO

### Passo 1 — Colete Sintomas

Perguntar ao usuário (ou ler issue):
- O que aconteceu? (texto do erro, comportamento)
- O que deveria acontecer?
- Reproduzível? Passos?
- Logs? Network tab?
- Qual tela/hook/operação?

### Passo 2 — Identifique a Origem

Fontes mais comuns de bugs:

```
┌─────────────────────────────────────────────┐
│  erro.subclass() → TypeError: x is undefined│
├─────────────────────────────────────────────┤
│  Causa: optional chaining removido          │
│  ou: estado inicial vazio                    │
│  Fix: fallback ou initBrand completo         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  dados somem após sync / refresh            │
├─────────────────────────────────────────────┤
│  Causa: PROFILE_WRITE_FIELDS incompleto     │
│  Fix: adicionar campo faltante em db.js     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  cor não persiste / tema não aplica         │
├─────────────────────────────────────────────┤
│  Causa: setBrand sem propagação             │
│  Fix: adicionar campo em useDataLoader      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  RPC retorna erro 424/500                   │
├─────────────────────────────────────────────┤
│  Causa: prefixos a_, b_, c_ ausentes        │
│  Fix: renomear params no SQL + frontend     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  build Vite quebra (parse error)            │
├─────────────────────────────────────────────┤
│  Causa: => ({...spread, x})                 │
│  Fix: retornar { } explícito               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  login funciona, mas dados não carregam     │
├─────────────────────────────────────────────┤
│  Causa: safety timer de 20s não disparou    │
│  Fix: ver onAuthStateChange SIGNED_IN       │
└─────────────────────────────────────────────┘
```

---

## BUGS CONHECIDOS (NÃO CONSERTADOS)

| ID | Sintoma | Causa Raiz | Impacto |
|---|---|---|---|
| BUG-001 | Trigger `prevent_plan_change` não está na migration | Criado manual no SQL editor | Migration incompleta |
| BUG-002 | Trigger `handle_new_user` não está na migration | Criado manual no SQL editor | Migration incompleta |
| BUG-003 | Impersonação: `pagehide` pode não disparar | Browser kill forçado | Senha temporária presa |
| BUG-004 | Pro ativado só aparece após logout/login | Sync de 2min + cache local | Experiência do usuário |
| BUG-005 | Admin precisa re-logar em nova aba | `sessionStorage` limpa | Esperado, documentado |
| BUG-006 | Build 555 kB (155 kB gzip) | Vite warning, não erro | Apenas aviso |

---

## FONTES ESPECÍFICAS DE BUG

### db.js — syncProfiles

`src/lib/db.js:120`

```
Bug típico: PROFILE_WRITE_FIELDS não inclui campo novo
→ push não envia campo
→ pull não traz campo
→ campo some após sync
```

### db.js — syncTable

`src/lib/db.js:200`

```
Bug típico: sync sem paginação em tabela grande
→ timeout no Edge Function
→ dados truncados
```

### useSession.js — loadData

`src/hooks/useSession.js:60`

```
Bug típico: safety timer de 20s com race condition
→ loadData não termina
→ spinner eterno
→ fix: verificar abortController removido
```

### useBrandManager.js — saveBrand

`src/hooks/useBrandManager.js:50`

```
Bug típico: white_label não propagado no upsert
→ saveBrand sobrescreve white_label=false
→ upsert perde dado do servidor
```

### RPC — set_client_plan

`supabase/migrations/*.sql`

```
Bug típico: prefixos a_, b_, c_ não respeitados
→ PostgREST serializa fora de ordem
→ parâmetros trocados
→ erro 424
```

---

## COMO REPRODUZIR BUGS DE SYNC

1. Abrir app no Chrome
2. DevTools → Network → Offline
3. Criar transação, alterar cor, criar produto (tudo offline)
4. DevTools → Network → Online
5. Aguardar 2 min (sync interval)
6. Recarregar página
7. Verificar se dados persistiram

---

## COMO DEBUGAR RENDER PROBLEMAS

```jsx
// Adicionar no componente (REMOVER ANTES DO COMMIT)
console.log('renderizou', props);
```

```jsx
// Para ver por que re-renderizou
import { whyDidYouUpdate } from 'why-did-you-render';
```

```jsx
// No React DevTools
// Components → Highlight updates when components render
```

---

## CHECKLIST DE DEBUG REMOTO

- [ ] Ver console do navegador (erros, warnings)
- [ ] Ver Network tab (403? 424? 500?)
- [ ] Ver Supabase Dashboard → Logs → Edge Functions
- [ ] Ver localStorage: `_imp`, `nancia_gh_token`
- [ ] Ver sessionStorage: `is_admin`, `_imp_uid`
- [ ] Ver Dexie: `ldb.transactions.toArray()`, `ldb.meta.toArray()`
- [ ] Ver plan do usuário: `ldb.meta.where('key').equals('plan').first()`
- [ ] Ver se `_synced = 0` em registros (não sincronizados)
