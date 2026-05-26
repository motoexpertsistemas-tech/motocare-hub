
-- Tabela de movimentações financeiras vinculadas ao plano de contas
CREATE TABLE public.movimentacoes_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plano_conta_id UUID NOT NULL REFERENCES public.plano_contas(id) ON DELETE CASCADE,
  descricao TEXT,
  valor NUMERIC NOT NULL DEFAULT 0,
  tipo TEXT NOT NULL DEFAULT 'pagamento', -- 'pagamento' ou 'recebimento'
  data_movimentacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE,
  data_competencia DATE,
  centro_custo TEXT,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.movimentacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all select on movimentacoes_financeiras"
  ON public.movimentacoes_financeiras FOR SELECT USING (true);

CREATE POLICY "Allow all insert on movimentacoes_financeiras"
  ON public.movimentacoes_financeiras FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update on movimentacoes_financeiras"
  ON public.movimentacoes_financeiras FOR UPDATE USING (true);

CREATE POLICY "Allow all delete on movimentacoes_financeiras"
  ON public.movimentacoes_financeiras FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_movimentacoes_financeiras_updated_at
  BEFORE UPDATE ON public.movimentacoes_financeiras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for date queries
CREATE INDEX idx_movimentacoes_data ON public.movimentacoes_financeiras(data_movimentacao);
CREATE INDEX idx_movimentacoes_plano_conta ON public.movimentacoes_financeiras(plano_conta_id);
CREATE INDEX idx_movimentacoes_competencia ON public.movimentacoes_financeiras(data_competencia);
