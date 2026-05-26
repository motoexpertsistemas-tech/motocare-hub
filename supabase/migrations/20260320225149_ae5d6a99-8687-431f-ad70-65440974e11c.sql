
-- Add extra columns to orcamentos for the full form
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS prazo_entrega DATE,
  ADD COLUMN IF NOT EXISTS nro_pedido_cli TEXT,
  ADD COLUMN IF NOT EXISTS canal_venda TEXT,
  ADD COLUMN IF NOT EXISTS comissao NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parceiro TEXT,
  ADD COLUMN IF NOT EXISTS comissao_parceiro NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS introducao TEXT,
  ADD COLUMN IF NOT EXISTS valor_frete NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transportadora TEXT,
  ADD COLUMN IF NOT EXISTS endereco_entrega TEXT,
  ADD COLUMN IF NOT EXISTS usar_endereco_entrega BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS valor_produtos NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_servicos NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto_percentual NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto_valor NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observacoes_padrao TEXT,
  ADD COLUMN IF NOT EXISTS observacoes_internas TEXT,
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS parcelas INTEGER DEFAULT 1;

-- Add orcamentos_servicos table
CREATE TABLE IF NOT EXISTS public.orcamentos_servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  servico_nome TEXT NOT NULL,
  detalhes TEXT,
  quantidade NUMERIC NOT NULL DEFAULT 1,
  valor NUMERIC NOT NULL DEFAULT 0,
  desconto NUMERIC DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.orcamentos_servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to orcamentos_servicos" ON public.orcamentos_servicos FOR ALL USING (true) WITH CHECK (true);
