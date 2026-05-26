
-- Add pricing, stock, fiscal and other columns to produtos_catalogo
ALTER TABLE public.produtos_catalogo
  ADD COLUMN IF NOT EXISTS preco_custo numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS despesas_acessorias numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outras_despesas numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custo_final numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precos_venda jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS estoque_quantidade integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estoque_minimo integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS localizacao text,
  ADD COLUMN IF NOT EXISTS ncm text,
  ADD COLUMN IF NOT EXISTS cest text,
  ADD COLUMN IF NOT EXISTS ean text,
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS peso numeric(8,3),
  ADD COLUMN IF NOT EXISTS unidade text DEFAULT 'UN',
  ADD COLUMN IF NOT EXISTS fornecedor text,
  ADD COLUMN IF NOT EXISTS observacoes text;
