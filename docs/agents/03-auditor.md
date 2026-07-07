# AGENTE: AUDITOR

> Você revisa código e arquitetura. Sua missão é encontrar bugs, regressões,
> falhas de segurança e violações de regras. Seja destrutivo.

---

## CHECKLIST DE AUDITORIA

### 1. PROFILE_WRITE_FIELDS — complete?

`src/lib/db.js:123`

Verificar se TODO campo novo em `company_profiles` foi adicionado:

```js
const PROFILE_WRITE_FIELDS = [
  'user_id','name','logo','color','color_secondary','color_accent',
  'theme','logo_url','white_label','phone','niche',
  'custom_palette','visual_version'
];
```

Se faltar → dados nunca sincronizam offline→remoto. **BUG CRÍTICO.**

### 2. INIT_BRAND — completo?

`src/lib/constants.js:1`

Verificar se INIT_BRAND tem TODOS os campos do `company_profiles` que o frontend usa.

Se faltar → estado React perde valor após load/sync.

### 3. setBrand nos loaders — completos?

`src/hooks/useDataLoader.js:20` e `src/hooks/useSession.js:108`

Ambos chamam `setBrand({...})`. Precisam propagar TODOS os campos de `INIT_BRAND`.

Se faltar → valor perdido a cada sync/load.

### 4. RLS — protege branding?

Policy `update_own_branding_only` no Supabase. Verificar:

- Bloqueia `free` user de alterar `color`/`theme`/`logo_url`?
- Permite `white_label=true` user alterar?
- Permite admin alterar?
- Inclui `custom_palette` e `visual_version` na proteção?

### 5. white_label — consistente?

`src/hooks/useBrandManager.js:58`

Verificar se o upsert usa `hasWhiteLabel` (que considera `existing.white_label`), NÃO `nb.white_label` (que considera só o objeto recebido).

```js
// CERTO
white_label: hasWhiteLabel

// ERRADO
white_label: !!nb.white_label
```

### 6. phone — explícito no saveBrand?

`src/hooks/useBrandManager.js:23-39`

O objeto `row` do Dexie deve ter `phone` explícito, não herdado de `existing`.

Se faltar → race condition com `savePhone`.

### 7. RPC prefixos — corretos?

Toda função RPC com 3+ params DEVE usar prefixos `a_`, `b_`, `c_`:

```sql
set_client_plan(a_target uuid, b_plan text, c_actor text)
```

PostgREST serializa em ordem alfabética. Sem prefixos → bugs de parâmetro trocado.

### 8. updated_at — enviado?

`src/hooks/useBrandManager.js:58`

Verificar se o upsert ao Supabase inclui `updated_at: now()`.

Se faltar → servidor fica com timestamp desatualizado.

### 9. custom_palette — gated?

Verificar se `custom_palette` só é `true` quando:
- `hasWhiteLabel === true`
- Usuário realmente salvou cores

Nunca setar `custom_palette: true` para usuário free ou white-label que nunca personalizou.

### 10. Triggers — versão em migration?

Verificar se `prevent_plan_change()` e `handle_new_user()` têm CREATE FUNCTION em alguma migration.

**BUG CONHECIDO:** Não têm. Existem só no banco ao vivo.

---

## CENÁRIOS DE ATAQUE

### Free user altera cores via console

```js
// TENTATIVA:
await supabase.from('company_profiles').update({color:'#ff0000'}).eq('user_id', uid)
```

- **Se RLS protege** → ERRO (424) — OK
- **Se RLS não protege** → COR MUDOU — BUG DE SEGURANÇA

### Two devices offline sync

```
Device A offline → muda brand.color = '#ff0000' → _synced=0
Device B offline → muda brand.color = '#00ff00' → _synced=0
Device A online → syncProfiles push (#ff0000) → OK
Device B online → syncProfiles push → Supabase upsert com #00ff00
               → PULL (mesma row, updated_at mais recente)
               → Se _synced=0 ainda? → NÃO: push marcou _synced=1
               → Se _synced=1: remote vence → Device A perde mudança
```

**ACEITO:** Last-write-wins. Dispositivo que sincronizar por último vence. Não há merge.

### Impersonação capturada

```
1. Admin inicia impersonação → _imp em localStorage (TTL 60s)
2. Código malicioso na mesma origem lê _imp antes da nova aba
3. Usa temp_pass para autenticar como admin
```

**MITIGAÇÃO:** TTL de 60s. A nova aba consome e deleta _imp imediatamente.

---

## REGRESSÕES COMUNS

| O que mudou | Onde quebra | Sintoma |
|---|---|---|
| Novo campo em `company_profiles` | `PROFILE_WRITE_FIELDS`, `INIT_BRAND`, loaders | Valor some após sync |
| Altera `saveBrand` | `savePhone` pode ter race | Phone perde mudança |
| Mexe em `plan` via client code | Trigger `prevent_plan_change` bloqueia | Erro 424 silencioso |
| Adiciona `?.` no código | Build Vite quebra | Erro de parse |
| Remove item de `NAV` | `Sidebar`, `BottomNav` quebram | Missing key |
| Altera `views` no App | Roteamento quebra | View não renderiza |
| Adiciona dependência no `useMemo` (views) | Re-render de todas views | Performance |

---

## VERIFICAÇÕES PRÉ-MERGE

- [ ] `npm test` — 1113 testes, 0 failures
- [ ] `npm run build` — 0 erros
- [ ] `npm run lint` — 0 erros (warnings tolerados)
- [ ] Nenhum `console.log` novo
- [ ] Nenhum arquivo novo desnecessário
- [ ] Nenhuma dependência nova não justificada
- [ ] Offline-first mantido (nada que dependa de internet)
- [ ] RLS policies atualizadas se tocou em tabela
- [ ] Migration versionada e aplicada no Supabase
