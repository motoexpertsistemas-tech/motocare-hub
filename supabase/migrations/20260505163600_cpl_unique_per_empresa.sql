ALTER TABLE public.produtos_catalogo DROP CONSTRAINT IF EXISTS produtos_catalogo_codigo_cpl_key;
DROP INDEX IF EXISTS public.produtos_catalogo_codigo_cpl_key;

ALTER TABLE public.produtos_catalogo
  ADD CONSTRAINT produtos_catalogo_empresa_codigo_cpl_key
  UNIQUE (empresa_id, codigo_cpl);
