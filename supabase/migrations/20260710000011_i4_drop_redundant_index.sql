-- I4: Dropar idx_transactions_user_id redundante
-- idx_transactions_user_date(user_id, date DESC) cobre as queries do índice simples

drop index if exists public.idx_transactions_user_id;