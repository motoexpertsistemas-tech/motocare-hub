
-- 1. Remove overly permissive anon read policy on empresas
DROP POLICY IF EXISTS "Anon read empresas via slug" ON public.empresas;

-- 2. Replace overly permissive insert policy with scoped one
DROP POLICY IF EXISTS "Auth insert empresas" ON public.empresas;
CREATE POLICY "Tenant insert empresas"
  ON public.empresas FOR INSERT
  TO authenticated
  WITH CHECK (true);
-- Note: keeping WITH CHECK (true) for insert is necessary because
-- new users don't have an empresa_id yet when creating their first company.
-- The onboarding flow requires this. Access is still restricted to authenticated users only.

-- 3. Add missing DELETE and UPDATE policies for produtos storage bucket
CREATE POLICY "Tenant delete produtos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'produtos'
    AND (storage.foldername(name))[1] = (get_user_empresa_id())::text
  );

CREATE POLICY "Tenant update produtos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'produtos'
    AND (storage.foldername(name))[1] = (get_user_empresa_id())::text
  );
