
-- Tabela de Ordens de Serviço
CREATE TABLE public.ordem_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_os TEXT NOT NULL,
  cliente_nome TEXT,
  cliente_telefone TEXT,
  placa TEXT,
  veiculo_marca TEXT,
  veiculo_modelo TEXT,
  veiculo_ano TEXT,
  veiculo_cor TEXT,
  veiculo_chassi TEXT,
  km_entrada INTEGER DEFAULT 0,
  nivel_combustivel TEXT DEFAULT '1/2',
  defeito_relatado TEXT,
  solucao TEXT,
  condicoes TEXT,
  acessorios TEXT,
  status TEXT NOT NULL DEFAULT 'atendimento',
  prioridade TEXT NOT NULL DEFAULT 'normal',
  data_entrada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_prevista_conclusao TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  valor_total_pecas NUMERIC(12,2) DEFAULT 0,
  valor_total_servicos NUMERIC(12,2) DEFAULT 0,
  valor_desconto NUMERIC(12,2) DEFAULT 0,
  valor_frete NUMERIC(12,2) DEFAULT 0,
  valor_outros NUMERIC(12,2) DEFAULT 0,
  valor_total NUMERIC(12,2) DEFAULT 0,
  observacoes TEXT,
  observacoes_internas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ordem_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to ordem_servico" ON public.ordem_servico FOR ALL USING (true) WITH CHECK (true);

-- Tabela de Itens da OS (peças e serviços)
CREATE TABLE public.os_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_id UUID NOT NULL REFERENCES public.ordem_servico(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'peca',
  descricao TEXT NOT NULL,
  detalhes TEXT,
  quantidade NUMERIC(10,2) NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(12,2) DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.os_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to os_itens" ON public.os_itens FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_ordem_servico_updated_at
BEFORE UPDATE ON public.ordem_servico
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
