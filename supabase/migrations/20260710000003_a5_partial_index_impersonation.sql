-- A5: Criar índice parcial idx_impersonation_sessions_expires WHERE old_hash = ''
-- Otimização para o sweeper (impersonation_sweep): filtra apenas sessões com old_hash vazio
-- Índice parcial menor e mais rápido para queries que filtram por expires_at + old_hash = ''

create index if not exists idx_impersonation_sessions_expires_old_hash_empty
  on public.impersonation_sessions (expires_at)
  where old_hash = '';