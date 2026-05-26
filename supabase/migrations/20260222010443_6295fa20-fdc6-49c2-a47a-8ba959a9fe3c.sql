
-- Create caixas table for cash register management
CREATE TABLE public.caixas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario TEXT NOT NULL DEFAULT 'GERENCIAL',
  aberto_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fechado_em TIMESTAMP WITH TIME ZONE,
  saldo_abertura NUMERIC NOT NULL DEFAULT 0,
  saldo_fechamento NUMERIC,
  saldo NUMERIC NOT NULL DEFAULT 0,
  loja TEXT NOT NULL DEFAULT 'LOJA PRINCIPAL',
  status TEXT NOT NULL DEFAULT 'aberto',
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.caixas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to caixas"
  ON public.caixas FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create caixa_movimentacoes table for sangria/reforço
CREATE TABLE public.caixa_movimentacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caixa_id UUID NOT NULL REFERENCES public.caixas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'sangria', 'reforco'
  valor NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caixa_movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to caixa_movimentacoes"
  ON public.caixa_movimentacoes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_caixas_updated_at
  BEFORE UPDATE ON public.caixas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
