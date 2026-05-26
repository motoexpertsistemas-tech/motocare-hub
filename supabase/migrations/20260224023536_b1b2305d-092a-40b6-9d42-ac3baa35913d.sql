
-- ============================================
-- TABELA DE ASSINATURAS
-- ============================================
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  plano TEXT NOT NULL DEFAULT 'starter',
  periodicidade TEXT NOT NULL DEFAULT 'mensal',
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'trial',
  trial_inicio DATE,
  trial_fim DATE,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_cancelamento DATE,
  proxima_cobranca DATE,
  asaas_subscription_id TEXT UNIQUE,
  asaas_customer_id TEXT,
  cupom_codigo TEXT,
  cupom_desconto DECIMAL(5,2),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id)
);

ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on assinaturas" ON assinaturas FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);
CREATE INDEX IF NOT EXISTS idx_assinaturas_proxima_cobranca ON assinaturas(proxima_cobranca);

-- ============================================
-- TABELA DE FATURAS
-- ============================================
CREATE TABLE IF NOT EXISTS faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id UUID NOT NULL REFERENCES assinaturas(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero_fatura TEXT NOT NULL UNIQUE,
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  valor_final DECIMAL(10,2) NOT NULL DEFAULT 0,
  referencia_mes INTEGER NOT NULL,
  referencia_ano INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL DEFAULT CURRENT_DATE,
  data_pagamento DATE,
  asaas_payment_id TEXT,
  asaas_invoice_url TEXT,
  asaas_boleto_url TEXT,
  asaas_pix_qrcode TEXT,
  forma_pagamento TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE faturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on faturas" ON faturas FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_faturas_status ON faturas(status);
CREATE INDEX IF NOT EXISTS idx_faturas_empresa ON faturas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_faturas_vencimento ON faturas(data_vencimento);

-- ============================================
-- TABELA DE EVENTOS DO SISTEMA
-- ============================================
CREATE TABLE IF NOT EXISTS eventos_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id),
  evento TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'sistema',
  dados JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE eventos_sistema ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on eventos_sistema" ON eventos_sistema FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_eventos_empresa ON eventos_sistema(empresa_id);
CREATE INDEX IF NOT EXISTS idx_eventos_categoria ON eventos_sistema(categoria);
CREATE INDEX IF NOT EXISTS idx_eventos_created ON eventos_sistema(created_at DESC);

-- ============================================
-- TABELA DE CUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS cupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT,
  tipo_desconto TEXT NOT NULL DEFAULT 'percentual',
  valor_desconto DECIMAL(10,2) NOT NULL DEFAULT 0,
  aplica_em TEXT[] DEFAULT ARRAY['starter', 'professional', 'enterprise'],
  primeiro_mes_apenas BOOLEAN DEFAULT false,
  max_usos INTEGER,
  usos_realizados INTEGER DEFAULT 0,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_expiracao DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on cupons" ON cupons FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON cupons(codigo);
CREATE INDEX IF NOT EXISTS idx_cupons_ativo ON cupons(ativo);

-- ============================================
-- TABELA DE MÉTRICAS MENSAIS
-- ============================================
CREATE TABLE IF NOT EXISTS metricas_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  mrr DECIMAL(10,2) NOT NULL DEFAULT 0,
  arr DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_clientes INTEGER NOT NULL DEFAULT 0,
  novos_clientes INTEGER NOT NULL DEFAULT 0,
  clientes_cancelados INTEGER NOT NULL DEFAULT 0,
  churn_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  arpu DECIMAL(10,2) NOT NULL DEFAULT 0,
  ltv DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mes, ano)
);

ALTER TABLE metricas_mensais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on metricas_mensais" ON metricas_mensais FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- FUNÇÃO: Calcular MRR
-- ============================================
CREATE OR REPLACE FUNCTION calcular_mrr()
RETURNS DECIMAL
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  total_mrr DECIMAL(10,2);
BEGIN
  SELECT SUM(
    CASE 
      WHEN periodicidade = 'mensal' THEN valor
      WHEN periodicidade = 'anual' THEN valor / 12
      ELSE 0
    END
  ) INTO total_mrr
  FROM assinaturas
  WHERE status = 'active';
  
  RETURN COALESCE(total_mrr, 0);
END;
$$;

-- ============================================
-- FUNÇÃO: Calcular Churn Rate
-- ============================================
CREATE OR REPLACE FUNCTION calcular_churn_rate(mes_ref INTEGER, ano_ref INTEGER)
RETURNS DECIMAL
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  clientes_inicio INTEGER;
  clientes_cancelados_count INTEGER;
  churn DECIMAL(5,2);
BEGIN
  SELECT COUNT(*) INTO clientes_inicio
  FROM assinaturas
  WHERE status = 'active'
  AND data_inicio < DATE_TRUNC('month', MAKE_DATE(ano_ref, mes_ref, 1));
  
  SELECT COUNT(*) INTO clientes_cancelados_count
  FROM assinaturas
  WHERE status = 'canceled'
  AND EXTRACT(MONTH FROM data_cancelamento) = mes_ref
  AND EXTRACT(YEAR FROM data_cancelamento) = ano_ref;
  
  IF clientes_inicio > 0 THEN
    churn := (clientes_cancelados_count::DECIMAL / clientes_inicio) * 100;
  ELSE
    churn := 0;
  END IF;
  
  RETURN churn;
END;
$$;
