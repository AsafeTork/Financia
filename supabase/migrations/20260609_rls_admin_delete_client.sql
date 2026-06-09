-- Migration: policies RLS que permitem admin deletar dados de qualquer cliente
-- Contexto: deleteClient no AdminPanel precisa remover registros de outros usuarios.
-- A chave anonima + RLS bloqueava silenciosamente (sem erro, sem efeito).
-- Aplicar via Supabase Studio > SQL Editor.

-- company_profiles
DROP POLICY IF EXISTS "admin_delete_profiles" ON company_profiles;
CREATE POLICY "admin_delete_profiles"
ON company_profiles FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- transactions
DROP POLICY IF EXISTS "admin_delete_transactions" ON transactions;
CREATE POLICY "admin_delete_transactions"
ON transactions FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- products
DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products"
ON products FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- losses
DROP POLICY IF EXISTS "admin_delete_losses" ON losses;
CREATE POLICY "admin_delete_losses"
ON losses FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- user_roles
DROP POLICY IF EXISTS "admin_delete_user_roles" ON user_roles;
CREATE POLICY "admin_delete_user_roles"
ON user_roles FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);
