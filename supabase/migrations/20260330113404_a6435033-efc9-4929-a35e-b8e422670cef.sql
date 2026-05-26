-- Drop old signatures and recreate with correct types
DROP FUNCTION IF EXISTS public.ecommerce_produtos_paginados(uuid,text,text,text,boolean,integer,integer,text);
DROP FUNCTION IF EXISTS public.ecommerce_produtos_paginados(text,text,text,boolean,integer,integer,text);

CREATE FUNCTION public.ecommerce_produtos_paginados(
  p_empresa_id uuid DEFAULT NULL,
  p_busca text DEFAULT ''::text,
  p_categoria text DEFAULT ''::text,
  p_fornecedor text DEFAULT ''::text,
  p_com_estoque boolean DEFAULT false,
  p_pagina integer DEFAULT 0,
  p_por_pagina integer DEFAULT 20,
  p_ordenacao text DEFAULT 'relevantes'::text
)
RETURNS TABLE(
  id uuid, nome text, codigo_fornecedor text, imagem_url text,
  aplicacoes text, estoque_quantidade integer, precos_venda jsonb,
  preco_custo numeric, fornecedor text, categoria text, total_count bigint
)
LANGUAGE plpgsql STABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT 
      p.id, p.nome, p.codigo_fornecedor, p.imagem_url,
      p.aplicacoes::text, p.estoque_quantidade,
      p.precos_venda::jsonb, p.preco_custo, p.fornecedor, p.categoria,
      CASE
        WHEN (p.imagem_url IS NOT NULL AND p.imagem_url <> '') AND (p.preco_custo > 0 OR jsonb_array_length(COALESCE(p.precos_venda::jsonb, '[]'::jsonb)) > 0) THEN 1
        WHEN (p.imagem_url IS NULL OR p.imagem_url = '') AND (p.preco_custo > 0 OR jsonb_array_length(COALESCE(p.precos_venda::jsonb, '[]'::jsonb)) > 0) THEN 2
        WHEN (p.imagem_url IS NOT NULL AND p.imagem_url <> '') THEN 3
        ELSE 4
      END AS tier
    FROM produtos_catalogo p
    WHERE
      (p_empresa_id IS NULL OR p.empresa_id = p_empresa_id)
      AND (p_busca = '' OR p.nome ILIKE '%' || p_busca || '%' OR COALESCE(p.fornecedor,'') ILIKE '%' || p_busca || '%' OR COALESCE(p.categoria,'') ILIKE '%' || p_busca || '%')
      AND (p_categoria = '' OR p_categoria = 'todas' OR p.categoria = p_categoria)
      AND (p_fornecedor = '' OR p_fornecedor = 'todos' OR p.fornecedor = p_fornecedor)
      AND (NOT p_com_estoque OR p.estoque_quantidade > 0)
  ),
  counted AS (
    SELECT count(*) AS cnt FROM filtered
  )
  SELECT 
    f.id, f.nome, f.codigo_fornecedor, f.imagem_url,
    f.aplicacoes, f.estoque_quantidade,
    f.precos_venda, f.preco_custo, f.fornecedor, f.categoria,
    c.cnt AS total_count
  FROM filtered f, counted c
  ORDER BY
    CASE WHEN p_ordenacao = 'relevantes' THEN f.tier END ASC,
    CASE WHEN p_ordenacao = 'relevantes' THEN f.nome END ASC,
    CASE WHEN p_ordenacao = 'nome_az' THEN f.nome END ASC,
    CASE WHEN p_ordenacao = 'nome_za' THEN f.nome END DESC
  LIMIT p_por_pagina
  OFFSET p_pagina * p_por_pagina;
END;
$function$;