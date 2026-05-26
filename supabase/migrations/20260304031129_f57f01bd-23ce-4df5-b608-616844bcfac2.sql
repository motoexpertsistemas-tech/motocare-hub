
-- Tabela para Custo de Homem/Hora
CREATE TABLE public.custo_homem_hora (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  valor_hora NUMERIC NOT NULL DEFAULT 0,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custo_homem_hora ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON public.custo_homem_hora
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tabela para Tabela de Preços de Serviços
CREATE TABLE public.tabela_precos_servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  percentual_acrescimo NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tabela_precos_servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON public.tabela_precos_servicos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
