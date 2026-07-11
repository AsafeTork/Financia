-- M3: Dropar 4 RLS policies não utilizadas em ai_cache
-- Edge Functions usam getAdminClient() (service_role) -> bypassa RLS
-- Policies ai_cache_*_own são desnecessárias e adicionam overhead

drop policy if exists ai_cache_select_own on public.ai_cache;
drop policy if exists ai_cache_insert_own on public.ai_cache;
drop policy if exists ai_cache_update_own on public.ai_cache;
drop policy if exists ai_cache_delete_own on public.ai_cache;

-- RLS permanece habilitada (defesa em profundidade)
-- Apenas service_role consegue acessar (bypass RLS)