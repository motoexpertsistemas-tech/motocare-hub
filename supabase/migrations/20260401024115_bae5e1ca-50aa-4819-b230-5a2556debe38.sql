-- Drop old function signatures (both overloads)
DROP FUNCTION IF EXISTS public.ecommerce_produtos_paginados(uuid, text, text, text, boolean, integer, integer, text);

-- Recreate without preco_custo
CREATE FUNCTION public.ecommerce_produtos_paginados(
  p_empresa_id uuid DEFAULT NULL,
  p_busca text DEFAULT '',
  p_categoria text DEFAULT '',
  p_fornecedor text DEFAULT '',
  p_com_estoque boolean DEFAULT false,
  p_pagina integer DEFAULT 0,
  p_por_pagina integer DEFAULT 20,
  p_ordenacao text DEFAULT 'relevantes'
)
RETURNS TABLE(
  id uuid, nome text, codigo_fornecedor text, imagem_url text,
  aplicacoes text, estoque_quantidade integer, precos_venda jsonb,
  fornecedor text, categoria text, total_count bigint
)
LANGUAGE plpgsql STABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT
      p.id, p.nome, p.codigo_fornecedor, p.imagem_url,
      p.aplicacoes::text, p.estoque_quantidade,
      p.precos_venda::jsonb, p.fornecedor, p.categoria,
      CASE
        WHEN (p.imagem_url IS NOT NULL AND p.imagem_url <> '') AND (jsonb_array_length(COALESCE(p.precos_venda::jsonb, '[]'::jsonb)) > 0) THEN 1
        WHEN (p.imagem_url IS NULL OR p.imagem_url = '') AND (jsonb_array_length(COALESCE(p.precos_venda::jsonb, '[]'::jsonb)) > 0) THEN 2
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
    f.precos_venda, f.fornecedor, f.categoria,
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

-- Storage tenant isolation
DROP POLICY IF EXISTS "Auth select certificados" ON storage.objects;
DROP POLICY IF EXISTS "Auth insert certificados" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete certificados" ON storage.objects;
DROP POLICY IF EXISTS "Auth select financeiro-anexos" ON storage.objects;
DROP POLICY IF EXISTS "Auth insert financeiro-anexos" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete financeiro-anexos" ON storage.objects;
DROP POLICY IF EXISTS "Auth select clientes-arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Auth insert clientes-arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete clientes-arquivos" ON storage.objects;

CREATE POLICY "Tenant select certificados" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'certificados-fiscais' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);
CREATE POLICY "Tenant insert certificados" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'certificados-fiscais' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);
CREATE POLICY "Tenant delete certificados" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'certificados-fiscais' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);

CREATE POLICY "Tenant select financeiro" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'financeiro-anexos' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);
CREATE POLICY "Tenant insert financeiro" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'financeiro-anexos' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);
CREATE POLICY "Tenant delete financeiro" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'financeiro-anexos' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);

CREATE POLICY "Tenant select clientes" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'clientes-arquivos' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);
CREATE POLICY "Tenant insert clientes" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'clientes-arquivos' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);
CREATE POLICY "Tenant delete clientes" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'clientes-arquivos' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);

-- Veiculos cache tenant isolation
ALTER TABLE public.veiculos_cache ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
DROP POLICY IF EXISTS "Auth insert veiculos" ON public.veiculos_cache;
DROP POLICY IF EXISTS "Auth read veiculos" ON public.veiculos_cache;
DROP POLICY IF EXISTS "Auth update veiculos" ON public.veiculos_cache;

CREATE POLICY "Tenant read veiculos" ON public.veiculos_cache FOR SELECT TO authenticated
USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant insert veiculos" ON public.veiculos_cache FOR INSERT TO authenticated
WITH CHECK (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant update veiculos" ON public.veiculos_cache FOR UPDATE TO authenticated
USING (empresa_id = public.get_user_empresa_id());

-- Focus NFe schema
ALTER TABLE public.configuracao_fiscal
  ADD COLUMN IF NOT EXISTS focusnfe_token text NULL,
  ADD COLUMN IF NOT EXISTS focusnfe_ambiente text NULL DEFAULT 'homologacao';

ALTER TABLE public.emissoes_fiscais
  ADD COLUMN IF NOT EXISTS focusnfe_ref text NULL,
  ADD COLUMN IF NOT EXISTS destinatario_cnpj text NULL,
  ADD COLUMN IF NOT EXISTS dados_nfe jsonb NULL,
  ADD COLUMN IF NOT EXISTS url_danfe text NULL,
  ADD COLUMN IF NOT EXISTS qrcode_url text NULL;