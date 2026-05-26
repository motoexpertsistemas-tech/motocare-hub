
-- FIX: produtos_catalogo public read leak
-- Problem: "Public read produtos" policy uses USING(true) for the "public" role,
-- which includes authenticated users. This means authenticated users from Empresa A
-- can see ALL products (including Empresa B's) due to permissive OR logic.
-- Fix: Change the public read policy to target only "anon" role (storefront visitors).

DROP POLICY IF EXISTS "Public read produtos" ON public.produtos_catalogo;

-- Storefront: only anon (unauthenticated) users get public read access
-- They see only basic product info via the view, not the base table
CREATE POLICY "Anon read produtos"
ON public.produtos_catalogo
FOR SELECT
TO anon
USING (true);

-- The existing "Tenant select" policy already handles authenticated users correctly:
-- empresa_id = get_user_empresa_id()
