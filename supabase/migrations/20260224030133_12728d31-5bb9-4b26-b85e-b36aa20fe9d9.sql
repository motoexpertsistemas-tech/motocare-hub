
-- ============================================
-- TABELA DE AFILIADOS
-- ============================================
CREATE TABLE public.afiliados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cpf_cnpj TEXT NOT NULL UNIQUE,
  telefone TEXT,
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  tipo_conta TEXT,
  pix_chave TEXT,
  pix_tipo TEXT,
  codigo_afiliado TEXT NOT NULL UNIQUE,
  link_afiliado TEXT NOT NULL UNIQUE,
  comissao_percentual NUMERIC(5,2) DEFAULT 20.00,
  comissao_tipo TEXT DEFAULT 'recorrente',
  comissao_recorrente_meses INTEGER,
  nivel INTEGER DEFAULT 1,
  afiliado_pai_id UUID REFERENCES public.afiliados(id),
  total_vendas INTEGER DEFAULT 0,
  total_comissoes NUMERIC(10,2) DEFAULT 0,
  comissoes_pendentes NUMERIC(10,2) DEFAULT 0,
  comissoes_pagas NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'ativo',
  aprovado_em TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_afiliados_codigo ON public.afiliados(codigo_afiliado);
CREATE INDEX idx_afiliados_status ON public.afiliados(status);
CREATE INDEX idx_afiliados_pai ON public.afiliados(afiliado_pai_id);

ALTER TABLE public.afiliados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on afiliados" ON public.afiliados FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA DE VENDAS DE AFILIADOS
-- ============================================
CREATE TABLE public.afiliados_vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  afiliado_id UUID NOT NULL REFERENCES public.afiliados(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  assinatura_id UUID NOT NULL REFERENCES public.assinaturas(id) ON DELETE CASCADE,
  plano TEXT NOT NULL,
  valor_plano NUMERIC(10,2) NOT NULL,
  periodicidade TEXT NOT NULL,
  comissao_percentual NUMERIC(5,2) NOT NULL,
  comissao_valor NUMERIC(10,2) NOT NULL,
  comissao_status TEXT DEFAULT 'pendente',
  data_venda TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_vendas_afiliado ON public.afiliados_vendas(afiliado_id);
CREATE INDEX idx_vendas_empresa ON public.afiliados_vendas(empresa_id);
CREATE INDEX idx_vendas_status ON public.afiliados_vendas(comissao_status);

ALTER TABLE public.afiliados_vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on afiliados_vendas" ON public.afiliados_vendas FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA DE COMISSÕES RECORRENTES
-- ============================================
CREATE TABLE public.afiliados_comissoes_recorrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  afiliado_id UUID NOT NULL REFERENCES public.afiliados(id) ON DELETE CASCADE,
  venda_original_id UUID NOT NULL REFERENCES public.afiliados_vendas(id) ON DELETE CASCADE,
  fatura_id UUID NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  valor_fatura NUMERIC(10,2) NOT NULL,
  comissao_percentual NUMERIC(5,2) NOT NULL,
  comissao_valor NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente',
  mes_referencia INTEGER NOT NULL,
  ano_referencia INTEGER NOT NULL,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(fatura_id, afiliado_id)
);

CREATE INDEX idx_comissoes_rec_afiliado ON public.afiliados_comissoes_recorrentes(afiliado_id);
CREATE INDEX idx_comissoes_rec_status ON public.afiliados_comissoes_recorrentes(status);

ALTER TABLE public.afiliados_comissoes_recorrentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on afiliados_comissoes_recorrentes" ON public.afiliados_comissoes_recorrentes FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA DE PAGAMENTOS A AFILIADOS
-- ============================================
CREATE TABLE public.afiliados_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  afiliado_id UUID NOT NULL REFERENCES public.afiliados(id) ON DELETE CASCADE,
  valor_bruto NUMERIC(10,2) NOT NULL,
  valor_impostos NUMERIC(10,2) DEFAULT 0,
  valor_liquido NUMERIC(10,2) NOT NULL,
  metodo_pagamento TEXT NOT NULL,
  dados_bancarios JSONB,
  comprovante_url TEXT,
  status TEXT DEFAULT 'processando',
  mes_referencia INTEGER NOT NULL,
  ano_referencia INTEGER NOT NULL,
  processado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_pagamentos_afiliado ON public.afiliados_pagamentos(afiliado_id);
CREATE INDEX idx_pagamentos_status ON public.afiliados_pagamentos(status);

ALTER TABLE public.afiliados_pagamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on afiliados_pagamentos" ON public.afiliados_pagamentos FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA DE ANALYTICS
-- ============================================
CREATE TABLE public.afiliados_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  afiliado_id UUID NOT NULL REFERENCES public.afiliados(id) ON DELETE CASCADE,
  evento TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  pais TEXT,
  estado TEXT,
  cidade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_analytics_afiliado ON public.afiliados_analytics(afiliado_id);
CREATE INDEX idx_analytics_evento ON public.afiliados_analytics(evento);
CREATE INDEX idx_analytics_created ON public.afiliados_analytics(created_at DESC);

ALTER TABLE public.afiliados_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on afiliados_analytics" ON public.afiliados_analytics FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGER: Atualizar Estatísticas do Afiliado
-- ============================================
CREATE OR REPLACE FUNCTION public.atualizar_stats_afiliado()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.afiliados SET
    total_vendas = total_vendas + 1,
    total_comissoes = total_comissoes + NEW.comissao_valor,
    comissoes_pendentes = comissoes_pendentes + NEW.comissao_valor
  WHERE id = NEW.afiliado_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_stats_afiliado
AFTER INSERT ON public.afiliados_vendas
FOR EACH ROW EXECUTE FUNCTION public.atualizar_stats_afiliado();

-- ============================================
-- FUNÇÃO: Atualizar Comissões do Afiliado
-- ============================================
CREATE OR REPLACE FUNCTION public.atualizar_comissoes_afiliado(
  p_afiliado_id UUID,
  p_valor NUMERIC
)
RETURNS void AS $$
BEGIN
  UPDATE public.afiliados SET
    comissoes_pendentes = comissoes_pendentes - p_valor,
    comissoes_pagas = comissoes_pagas + p_valor,
    atualizado_em = NOW()
  WHERE id = p_afiliado_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;
