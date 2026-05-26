
-- 1. Fix functions missing SET search_path
CREATE OR REPLACE FUNCTION public.atualizar_avaliacao_fornecedor()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.fornecedores SET
    avaliacao_qualidade = (SELECT AVG(qualidade_produtos) FROM public.avaliacoes_fornecedores WHERE fornecedor_id = NEW.fornecedor_id),
    avaliacao_prazo = (SELECT AVG(cumprimento_prazo) FROM public.avaliacoes_fornecedores WHERE fornecedor_id = NEW.fornecedor_id),
    avaliacao_preco = (SELECT AVG(preco_competitivo) FROM public.avaliacoes_fornecedores WHERE fornecedor_id = NEW.fornecedor_id),
    avaliacao_atendimento = (SELECT AVG(atendimento) FROM public.avaliacoes_fornecedores WHERE fornecedor_id = NEW.fornecedor_id)
  WHERE id = NEW.fornecedor_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.atualizar_conversa_mensagem()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE conversas SET
    total_mensagens = total_mensagens + 1,
    ultima_mensagem_em = NEW.created_at,
    ultima_mensagem_de = NEW.tipo_remetente,
    primeira_resposta_em = CASE 
      WHEN primeira_resposta_em IS NULL AND NEW.tipo_remetente = 'atendente'
      THEN NEW.created_at
      ELSE primeira_resposta_em
    END,
    tempo_primeira_resposta_segundos = CASE
      WHEN primeira_resposta_em IS NULL AND NEW.tipo_remetente = 'atendente'
      THEN EXTRACT(EPOCH FROM (NEW.created_at - created_at))::INTEGER
      ELSE tempo_primeira_resposta_segundos
    END
  WHERE id = NEW.conversa_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.atualizar_stats_afiliado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.afiliados SET
    total_vendas = total_vendas + 1,
    total_comissoes = total_comissoes + NEW.comissao_valor,
    comissoes_pendentes = comissoes_pendentes + NEW.comissao_valor
  WHERE id = NEW.afiliado_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notificar_nova_mensagem()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM pg_notify(
    'nova_mensagem',
    json_build_object(
      'conversa_id', NEW.conversa_id,
      'tipo_remetente', NEW.tipo_remetente,
      'conteudo', NEW.conteudo
    )::text
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_clientes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_fornecedores_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_pedidos_compra_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.buscar_produtos_catalogo(termos text[])
RETURNS SETOF produtos_catalogo
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
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
  LIMIT 2000;
$function$;

CREATE OR REPLACE FUNCTION public.ecommerce_categorias()
RETURNS TABLE(categoria text)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT DISTINCT p.categoria
  FROM produtos_catalogo p
  WHERE p.categoria IS NOT NULL AND p.categoria <> ''
  ORDER BY p.categoria;
$function$;

CREATE OR REPLACE FUNCTION public.ecommerce_fornecedores()
RETURNS TABLE(fornecedor text)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT DISTINCT p.fornecedor
  FROM produtos_catalogo p
  WHERE p.fornecedor IS NOT NULL AND p.fornecedor <> ''
  ORDER BY p.fornecedor;
$function$;

CREATE OR REPLACE FUNCTION public.ecommerce_produtos_paginados(p_busca text DEFAULT ''::text, p_categoria text DEFAULT ''::text, p_fornecedor text DEFAULT ''::text, p_com_estoque boolean DEFAULT false, p_pagina integer DEFAULT 0, p_por_pagina integer DEFAULT 20, p_ordenacao text DEFAULT 'relevantes'::text)
RETURNS TABLE(id uuid, nome text, codigo_fornecedor text, imagem_url text, aplicacoes text, estoque_quantidade numeric, precos_venda jsonb, preco_custo numeric, fornecedor text, categoria text, total_count bigint)
LANGUAGE plpgsql
STABLE
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
$function$;

-- 2. Fix Security Definer View - recreate as Security Invoker
DROP VIEW IF EXISTS public.produtos_catalogo_vitrine;
CREATE VIEW public.produtos_catalogo_vitrine
WITH (security_invoker=on) AS
SELECT id, codigo_cpl, nome, marca, categoria, imagem_url, aplicacoes,
  importado_em, atualizado_em, preco_custo, despesas_acessorias, outras_despesas,
  custo_final, precos_venda, estoque_quantidade, estoque_minimo, localizacao,
  ncm, cest, ean, descricao, peso, unidade, fornecedor, observacoes, cor, codigo_fornecedor,
  CASE
    WHEN imagem_url IS NOT NULL AND imagem_url <> '' AND precos_venda IS NOT NULL AND jsonb_array_length(precos_venda) > 0 THEN 0
    WHEN imagem_url IS NOT NULL AND imagem_url <> '' THEN 1
    WHEN precos_venda IS NOT NULL AND jsonb_array_length(precos_venda) > 0 THEN 2
    ELSE 3
  END AS vitrine_prioridade
FROM produtos_catalogo;
