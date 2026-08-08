-- Revogar PUBLIC de trigger-only functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_plan_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_white_label() FROM PUBLIC;

-- Funcoes admin — apenas authenticated (gate interno de role)
REVOKE EXECUTE ON FUNCTION public.admin_clear_client_data(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_clear_client_data(uuid, text[]) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_client_usage() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_client_usage() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_db_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_db_stats() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_set_custom_price(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_custom_price(uuid, integer) TO authenticated;

-- Storage: bucket logos com restricao por pasta user_id
DROP POLICY IF EXISTS logos_authenticated_select ON storage.objects;
DROP POLICY IF EXISTS logos_authenticated_write ON storage.objects;
DROP POLICY IF EXISTS logos_authenticated_update ON storage.objects;
DROP POLICY IF EXISTS logos_authenticated_delete ON storage.objects;

CREATE POLICY logos_authenticated_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'logos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY logos_authenticated_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY logos_authenticated_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'logos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY logos_authenticated_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );
