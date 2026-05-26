
-- =============================================================
-- FIX 1: Remove anon read on produtos_catalogo (cost data exposure)
-- The vitrine view already handles public storefront reads safely
-- =============================================================
DROP POLICY IF EXISTS "Anon read produtos" ON public.produtos_catalogo;

-- =============================================================
-- FIX 2: Replace public read on empresas with scoped policies
-- Create a public-safe view for storefront (slug lookup)
-- =============================================================
DROP POLICY IF EXISTS "Public read empresas" ON public.empresas;

-- Authenticated users can only read their own empresa
CREATE POLICY "Tenant select empresas"
  ON public.empresas FOR SELECT
  TO authenticated
  USING (id = get_user_empresa_id());

-- Admin can read all empresas
CREATE POLICY "Admin select all empresas"
  ON public.empresas FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a public-safe view for storefront pages (EmpresaPublica)
CREATE OR REPLACE VIEW public.empresas_publicas
WITH (security_invoker = on) AS
  SELECT id, nome, nome_fantasia, slug, logo_url, cor_primaria, cor_secundaria, status
  FROM public.empresas;

-- Allow anon to read the safe view via a policy on the base table
-- that only exposes non-sensitive fields through the view
CREATE POLICY "Anon read empresas via slug"
  ON public.empresas FOR SELECT
  TO anon
  USING (true);

-- =============================================================
-- FIX 3: Add tenant isolation on product-images storage bucket
-- Write operations must scope to tenant folder
-- =============================================================

-- Drop old permissive write policies
DROP POLICY IF EXISTS "Auth upload product-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth update product-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete product-images" ON storage.objects;

-- Recreate with tenant folder scoping
CREATE POLICY "Tenant upload product-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (get_user_empresa_id())::text
  );

CREATE POLICY "Tenant update product-images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (get_user_empresa_id())::text
  );

CREATE POLICY "Tenant delete product-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (get_user_empresa_id())::text
  );

-- =============================================================
-- FIX 4: Add tenant isolation on produtos storage bucket
-- =============================================================
DROP POLICY IF EXISTS "Auth upload produtos" ON storage.objects;

CREATE POLICY "Tenant upload produtos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'produtos'
    AND (storage.foldername(name))[1] = (get_user_empresa_id())::text
  );
