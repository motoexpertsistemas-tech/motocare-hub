CREATE OR REPLACE FUNCTION public.buscar_produtos_catalogo(termos text[])
RETURNS SETOF produtos_catalogo
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT p.*
  FROM produtos_catalogo p
  WHERE (
    SELECT bool_or(
      p.nome ILIKE '%' || t || '%'
      OR p.categoria ILIKE '%' || t || '%'
      OR p.fornecedor ILIKE '%' || t || '%'
      OR p.aplicacoes::text ILIKE '%' || t || '%'
    )
    FROM unnest(termos) AS t
  )
  LIMIT 25;
$$;