-- A4: Envolver auth.uid() em (SELECT auth.uid()) nas 4 policies storage.objects (initPlan)
-- Otimização de performance: evita chamada de auth.uid() por linha (por-row evaluation)
-- Ref: Supabase RLS Performance - https://supabase.com/docs/guides/database/postgres/row-level-security

-- 1) logos_authenticated_select
drop policy if exists logos_authenticated_select on storage.objects;
create policy logos_authenticated_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'logos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'admin')
    )
  );

-- 2) logos_authenticated_write
drop policy if exists logos_authenticated_write on storage.objects;
create policy logos_authenticated_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'admin')
    )
  );

-- 3) logos_authenticated_update
drop policy if exists logos_authenticated_update on storage.objects;
create policy logos_authenticated_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'logos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'admin')
    )
  )
  with check (
    bucket_id = 'logos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'admin')
    )
  );

-- 4) logos_authenticated_delete
drop policy if exists logos_authenticated_delete on storage.objects;
create policy logos_authenticated_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'logos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'admin')
    )
  );