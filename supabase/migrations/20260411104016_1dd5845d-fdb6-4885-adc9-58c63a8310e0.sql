CREATE OR REPLACE FUNCTION public.get_empresa_by_slug(p_slug text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id FROM public.empresas e WHERE e.slug = p_slug LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_empresa_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_empresa_by_slug(text) TO authenticated;