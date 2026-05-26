-- Fix RLS policies to be PERMISSIVE instead of RESTRICTIVE
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.produtos_catalogo;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.produtos_catalogo;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.produtos_catalogo;

-- Recreate as permissive (default) policies allowing all access
CREATE POLICY "Allow all select on produtos_catalogo"
  ON public.produtos_catalogo FOR SELECT
  USING (true);

CREATE POLICY "Allow all insert on produtos_catalogo"
  ON public.produtos_catalogo FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all update on produtos_catalogo"
  ON public.produtos_catalogo FOR UPDATE
  USING (true);

CREATE POLICY "Allow all delete on produtos_catalogo"
  ON public.produtos_catalogo FOR DELETE
  USING (true);