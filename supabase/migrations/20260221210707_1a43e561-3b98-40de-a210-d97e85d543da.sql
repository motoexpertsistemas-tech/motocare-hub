
ALTER TABLE public.servicos
  ADD COLUMN codigo_interno TEXT NOT NULL DEFAULT '',
  ADD COLUMN valor_custo NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN valor_venda NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN comissao NUMERIC NOT NULL DEFAULT 0;

-- Drop the old generic 'valor' column since we now have valor_custo and valor_venda
ALTER TABLE public.servicos DROP COLUMN IF EXISTS valor;
