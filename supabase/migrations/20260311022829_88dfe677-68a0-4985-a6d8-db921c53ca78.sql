CREATE OR REPLACE FUNCTION public.buscar_produtos_catalogo(termos text[])
RETURNS SETOF produtos_catalogo
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT p.*
  FROM produtos_catalogo p
  WHERE (
    SELECT bool_and(
      p.nome ILIKE '%' || t || '%'
      OR COALESCE(p.categoria, '') ILIKE '%' || t || '%'
      OR COALESCE(p.fornecedor, '') ILIKE '%' || t || '%'
      OR COALESCE(p.aplicacoes::text, '') ILIKE '%' || t || '%'
    )
    FROM unnest(termos) AS t
  )
  LIMIT 500;
$$;