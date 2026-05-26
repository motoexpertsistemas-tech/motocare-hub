
-- Function to get paginated ranked products for ecommerce (server-side tier ranking)
CREATE OR REPLACE FUNCTION public.ecommerce_produtos_paginados(
  p_busca text DEFAULT '',
  p_categoria text DEFAULT '',
  p_fornecedor text DEFAULT '',
  p_com_estoque boolean DEFAULT false,
  p_pagina integer DEFAULT 0,
  p_por_pagina integer DEFAULT 20,
  p_ordenacao text DEFAULT 'relevantes'
)
RETURNS TABLE(
  id uuid,
  nome text,
  codigo_fornecedor text,
  imagem_url text,
  aplicacoes text,
  estoque_quantidade numeric,
  precos_venda jsonb,
  preco_custo numeric,
  fornecedor text,
  categoria text,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT 
      p.id, p.nome, p.codigo_fornecedor, p.imagem_url,
      p.aplicacoes::text, p.estoque_quantidade,
      p.precos_venda::jsonb, p.preco_custo, p.fornecedor, p.categoria,
      -- Tier ranking: 1=foto+preco, 2=preco sem foto, 3=foto sem preco, 4=nada
      CASE
        WHEN (p.imagem_url IS NOT NULL AND p.imagem_url <> '') AND (p.preco_custo > 0 OR jsonb_array_length(COALESCE(p.precos_venda::jsonb, '[]'::jsonb)) > 0) THEN 1
        WHEN (p.imagem_url IS NULL OR p.imagem_url = '') AND (p.preco_custo > 0 OR jsonb_array_length(COALESCE(p.precos_venda::jsonb, '[]'::jsonb)) > 0) THEN 2
        WHEN (p.imagem_url IS NOT NULL AND p.imagem_url <> '') THEN 3
        ELSE 4
      END AS tier
    FROM produtos_catalogo p
    WHERE
      (p_busca = '' OR p.nome ILIKE '%' || p_busca || '%' OR COALESCE(p.fornecedor,'') ILIKE '%' || p_busca || '%' OR COALESCE(p.categoria,'') ILIKE '%' || p_busca || '%')
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
$$;

-- Function to get distinct categories efficiently
CREATE OR REPLACE FUNCTION public.ecommerce_categorias()
RETURNS TABLE(categoria text)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT p.categoria
  FROM produtos_catalogo p
  WHERE p.categoria IS NOT NULL AND p.categoria <> ''
  ORDER BY p.categoria;
$$;

-- Function to get distinct brands efficiently
CREATE OR REPLACE FUNCTION public.ecommerce_fornecedores()
RETURNS TABLE(fornecedor text)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT p.fornecedor
  FROM produtos_catalogo p
  WHERE p.fornecedor IS NOT NULL AND p.fornecedor <> ''
  ORDER BY p.fornecedor;
$$;
