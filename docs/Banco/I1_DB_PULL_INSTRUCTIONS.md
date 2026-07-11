# I1: 35 Migrations não rastreadas localmente

**Problema**: 57 migrations no banco vs 22 arquivos locais (35 gap)

**Ação necessária** (requer CLI com credenciais):
```bash
# 1. Login
supabase login

# 2. Link ao projeto Financia
supabase link --project-ref kxeqhorxhlgwcgywovqr

# 3. Pull das migrations
supabase db pull --schema public,private,storage
```

**Resultado esperado**: 35 arquivos `.sql` em `supabase/migrations/` com timestamp ordenado.

**Risco**: Sem isso, banco irrecuperável (disaster recovery).