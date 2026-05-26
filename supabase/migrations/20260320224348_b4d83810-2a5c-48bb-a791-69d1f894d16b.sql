
-- Create orcamentos table
CREATE TABLE public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero SERIAL,
  cliente_id UUID REFERENCES public.clientes(id),
  cliente_nome TEXT,
  data_orcamento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validade DATE,
  situacao TEXT NOT NULL DEFAULT 'em_aberto',
  valor_total NUMERIC NOT NULL DEFAULT 0,
  desconto NUMERIC DEFAULT 0,
  observacoes TEXT,
  vendedor_nome TEXT,
  vendedor_id UUID REFERENCES public.funcionarios(id),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to orcamentos" ON public.orcamentos FOR ALL USING (true) WITH CHECK (true);

-- Create orcamentos_itens table
CREATE TABLE public.orcamentos_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos_catalogo(id),
  produto_nome TEXT NOT NULL,
  quantidade NUMERIC NOT NULL DEFAULT 1,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  desconto NUMERIC DEFAULT 0,
  observacoes TEXT
);

ALTER TABLE public.orcamentos_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to orcamentos_itens" ON public.orcamentos_itens FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
