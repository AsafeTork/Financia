-- Fix storage.objects RLS policies: wrap auth.uid() in (SELECT auth.uid()) for initPlan optimization
-- Without initPlan: auth.uid() called per-row (Volatile) -> 19x slower (PlanetScale 2026 benchmark)
-- With initPlan: (SELECT auth.uid()) evaluated once per query -> 102ms vs 1.96s
-- Ref: SECURITY_AUDIT_REPORT.md section 8.1, Banco/ESPECIALISTA_BANCO.md section A4

-- Drop existing policies (may have bare auth.uid())
DROP POLICY IF EXISTS "logos_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "logos_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "logos_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "logos_authenticated_delete" ON storage.objects;

-- Recreate with initPlan wrapping
CREATE POLICY "logos_authenticated_select" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'logos'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin')
  )
);

CREATE POLICY "logos_authenticated_insert" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin')
  )
);

CREATE POLICY "logos_authenticated_update" ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin')
  )
)
WITH CHECK (
  bucket_id = 'logos'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin')
  )
);

CREATE POLICY "logos_authenticated_delete" ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin')
  )
);