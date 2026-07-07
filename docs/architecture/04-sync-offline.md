# Sync Offline-First

> Como o Financia funciona sem internet e sincroniza quando volta.

---

## Estrategia

**Dexie (IndexedDB) e a fonte de verdade local.** Toda leitura e escrita acontece no Dexie primeiro. O sync remoto (Supabase) roda em background.

```
Usuario escreve → Dexie (_synced=0) → UI atualiza instantaneamente
                        ↓ (quando online)
                  Supabase upsert → marca _synced=1
```

---

## Tabelas Dexie

Schema version 2 em `src/lib/db.js`:

| Store Dexie | Tabela Supabase | Indices |
|---|---|---|
| `ldb.transactions` | `transactions` | `id, user_id, date, _synced, _deleted, _updated_at, registered_by` |
| `ldb.products` | `products` | `id, user_id, category, _synced, _deleted, _updated_at, registered_by` |
| `ldb.losses` | `losses` | `id, user_id, date, _synced, _deleted, _updated_at, registered_by` |
| `ldb.profiles` | `company_profiles` | `user_id, _synced, _updated_at` |
| `ldb.meta` | — | `key` (storage generico: last_sync, role, etc.) |

---

## Ciclo de Sync

### Gatilhos (`src/hooks/useSyncLoop.js`)

| Gatilho | Frequencia |
|---|---|
| Interval | 120000ms (2 min) |
| `visibilitychange` | Ao voltar para a aba |
| `online` event | Ao reconectar |
| Realtime change | Debounce 800ms → `runSync()` |
| Login inicial | Imediato via `syncAll()` em `loadData` |

### `syncAll(uid)` — `src/lib/db.js:146`

Orquestra 4 syncs em paralelo com timeout de 15s:

```
syncAll(uid)
  ├─ syncTable(uid, 'transactions', ldb.transactions, mapFn)
  ├─ syncTable(uid, 'products', ldb.products, mapFn)
  ├─ syncTable(uid, 'losses', ldb.losses, mapFn)
  └─ syncProfiles(uid)
  → setLastSync(ts, uid)
```

### `syncTable(uid, table, ldbTable, mapLocal)` — generico

**FASE 1 — PUSH (local → remoto):**
1. Busca linhas com `_synced === 0`
2. Se `_deleted`: DELETE remoto + bulkDelete local
3. Senao: upsert remoto (pick de campos via FIELD_MAP)
4. Marca `_synced = 1` nas linhas que subiram

**FASE 2 — PULL (remoto → local):**
1. `select('*').eq('user_id', uid).gte('updated_at', lastSync).limit(500)`
2. Para cada row remota: so sobrescreve local se:
   - Nao existe local (`!ex`), OU
   - Local sincronizado E remoto mais recente (`ex._synced === 1 && row.updated_at >= ex._updated_at`)
3. Se local tem `_synced === 0` (sujo), remoto é ignorado — local vence

**FASE 3 — ORPHAN CLEANUP:**
1. Pagina TODOS os IDs remotos (paginas de 1000)
2. Deleta do Dexie qualquer `_synced === 1` que nao existe mais no remoto

### `syncProfiles(uid)` — dedicado para company_profiles

Mais simples que syncTable (1 registro por user):

1. **Push**: itera `_synced === 0`, upsert com `PROFILE_WRITE_FIELDS`
2. **Pull**: `select('*').maybeSingle()` — so sobrescreve se local `_synced !== 0`

---

## Resolucao de Conflitos

**Regra: last-write-wins com vies local.**

- Se local esta sujo (`_synced === 0`), o remoto NUNCA sobrescreve
- Se local esta limpo (`_synced === 1`), o remoto so vence se for mais recente
- Nao ha timestamp guard real entre devices — dois devices offline fazendo mudancas resultam em perda do mais antigo

---

## PROFILE_WRITE_FIELDS

`src/lib/db.js:123`:

```js
const PROFILE_WRITE_FIELDS = [
  'user_id','name','logo','color','color_secondary','color_accent',
  'theme','logo_url','white_label','phone','niche',
  'custom_palette','visual_version'
];
```

Controla **apenas** quais campos sao enviados ao Supabase no push do syncProfiles.

---

## Crud Individual (`src/lib/crud.js`)

Alem do sync batch, operacoes individuais fazem push imediato se online:

| Funcao | Quando | Como |
|---|---|---|
| `syncUpsert` | addTx, addProduct, addLoss | Dexie put (_synced=0) + upsert remoto imediato |
| `syncUpdate` | editTx, editProduct, editLoss | Dexie update (_synced=0) + update remoto |
| `syncDelete` | deleteTx, deleteProduct, deleteLoss | Dexie update (_deleted=1, _synced=0) + delete remoto |

Se offline, a operacao fica pendente no Dexie ate o proximo sync.

---

## Storage Map

| Dado | Onde | Limpavel |
|---|---|---|
| `nancia_gh_token` | localStorage | Nao (persiste entre sessoes) |
| `is_admin` | sessionStorage | Sim (fecha browser) |
| `financia_theme` | localStorage | Nao |
| `financia_onboarded_<uid>` | localStorage | Nao |
| `role_<uid>` | Dexie `ldb.meta` | Sync |
| `last_sync_<uid>` | Dexie `ldb.meta` | Sync |
| `_imp` | localStorage | TTL 60s |
| `_imp_uid` | sessionStorage | Sim |
| `_imp_restore` | localStorage | Consumido por storage event |

---

## Fluxo de Carga (`loadData`)

`src/hooks/useSession.js:65`:

```
1) loadFromLocal(uid)     ← Dexie (instantaneo)
   → setBrand, setPlanInfo, setTx, setProducts, setLosses
2) setDataLoading(false)  ← UI renderiza
3) syncAll(uid)           ← Push + Pull remoto
4) fetchRole(uid)         ← Busca role no Supabase
5) loadFromLocal(uid)     ← Re-le Dexie com dados sincronizados
```

Safety timer de 25s no `dataLoading` para mitigar travamento de spinner.
