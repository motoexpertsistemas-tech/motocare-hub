
-- ============================================
-- TABELA: spedy_config
-- ============================================
CREATE TABLE public.spedy_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  ambiente TEXT NOT NULL DEFAULT 'sandbox' CHECK (ambiente IN ('sandbox', 'production')),
  emissor_id TEXT,
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  codigo_municipio TEXT,
  serie_nfe TEXT DEFAULT '1',
  serie_nfce TEXT DEFAULT '1',
  serie_nfse TEXT DEFAULT '1',
  regime_tributario TEXT DEFAULT 'simples_nacional' CHECK (regime_tributario IN ('simples_nacional', 'simples_nacional_excesso', 'regime_normal')),
  ativo BOOLEAN DEFAULT true,
  homologado BOOLEAN DEFAULT false,
  homologado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id)
);

ALTER TABLE public.spedy_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select spedy_config" ON public.spedy_config FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant insert spedy_config" ON public.spedy_config FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant update spedy_config" ON public.spedy_config FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant delete spedy_config" ON public.spedy_config FOR DELETE TO authenticated USING (empresa_id = public.get_user_empresa_id());

-- Revoke client-side SELECT on sensitive api_key column
REVOKE SELECT (api_key) ON public.spedy_config FROM authenticated;
REVOKE SELECT (api_key) ON public.spedy_config FROM anon;

-- Trigger updated_at
CREATE TRIGGER update_spedy_config_updated_at BEFORE UPDATE ON public.spedy_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABELA: notas_fiscais
-- ============================================
CREATE TABLE public.notas_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_nota TEXT NOT NULL CHECK (tipo_nota IN ('nfe', 'nfce', 'nfse')),
  numero_nota INTEGER NOT NULL,
  serie TEXT NOT NULL,
  chave_acesso TEXT UNIQUE,
  spedy_nota_id TEXT UNIQUE,
  spedy_status TEXT,
  destinatario_tipo TEXT CHECK (destinatario_tipo IN ('fisica', 'juridica')),
  destinatario_cpf_cnpj TEXT,
  destinatario_nome TEXT,
  destinatario_email TEXT,
  valor_produtos DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_servicos DECIMAL(10,2) DEFAULT 0,
  valor_desconto DECIMAL(10,2) DEFAULT 0,
  valor_frete DECIMAL(10,2) DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  base_calculo_icms DECIMAL(10,2) DEFAULT 0,
  valor_icms DECIMAL(10,2) DEFAULT 0,
  valor_pis DECIMAL(10,2) DEFAULT 0,
  valor_cofins DECIMAL(10,2) DEFAULT 0,
  valor_iss DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'autorizada', 'cancelada', 'denegada', 'rejeitada', 'erro')),
  protocolo_autorizacao TEXT,
  data_autorizacao TIMESTAMPTZ,
  xml_url TEXT,
  pdf_url TEXT,
  danfe_url TEXT,
  cancelada BOOLEAN DEFAULT false,
  cancelada_em TIMESTAMPTZ,
  motivo_cancelamento TEXT,
  protocolo_cancelamento TEXT,
  observacoes TEXT,
  informacoes_adicionais TEXT,
  venda_id UUID,
  ordem_servico_id UUID,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_nf_empresa ON public.notas_fiscais(empresa_id);
CREATE INDEX idx_nf_chave ON public.notas_fiscais(chave_acesso);
CREATE INDEX idx_nf_status ON public.notas_fiscais(status);
CREATE INDEX idx_nf_tipo ON public.notas_fiscais(tipo_nota);

ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select notas_fiscais" ON public.notas_fiscais FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant insert notas_fiscais" ON public.notas_fiscais FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant update notas_fiscais" ON public.notas_fiscais FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant delete notas_fiscais" ON public.notas_fiscais FOR DELETE TO authenticated USING (empresa_id = public.get_user_empresa_id());

CREATE TRIGGER update_notas_fiscais_updated_at BEFORE UPDATE ON public.notas_fiscais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABELA: notas_fiscais_itens
-- ============================================
CREATE TABLE public.notas_fiscais_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_fiscal_id UUID NOT NULL REFERENCES public.notas_fiscais(id) ON DELETE CASCADE,
  numero_item INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('produto', 'servico')),
  codigo TEXT,
  descricao TEXT NOT NULL,
  ncm TEXT,
  cfop TEXT NOT NULL,
  unidade TEXT DEFAULT 'UN',
  quantidade DECIMAL(10,3) NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  valor_desconto DECIMAL(10,2) DEFAULT 0,
  origem_mercadoria TEXT DEFAULT '0',
  cst_icms TEXT,
  aliquota_icms DECIMAL(5,2) DEFAULT 0,
  valor_icms DECIMAL(10,2) DEFAULT 0,
  cst_pis TEXT,
  aliquota_pis DECIMAL(5,2) DEFAULT 0,
  valor_pis DECIMAL(10,2) DEFAULT 0,
  cst_cofins TEXT,
  aliquota_cofins DECIMAL(5,2) DEFAULT 0,
  valor_cofins DECIMAL(10,2) DEFAULT 0,
  codigo_servico TEXT,
  aliquota_iss DECIMAL(5,2) DEFAULT 0,
  valor_iss DECIMAL(10,2) DEFAULT 0,
  produto_id UUID,
  servico_id UUID,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_nf_itens_nota ON public.notas_fiscais_itens(nota_fiscal_id);

ALTER TABLE public.notas_fiscais_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select notas_fiscais_itens" ON public.notas_fiscais_itens FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.notas_fiscais nf WHERE nf.id = nota_fiscal_id AND nf.empresa_id = public.get_user_empresa_id()));
CREATE POLICY "Tenant insert notas_fiscais_itens" ON public.notas_fiscais_itens FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.notas_fiscais nf WHERE nf.id = nota_fiscal_id AND nf.empresa_id = public.get_user_empresa_id()));
CREATE POLICY "Tenant update notas_fiscais_itens" ON public.notas_fiscais_itens FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.notas_fiscais nf WHERE nf.id = nota_fiscal_id AND nf.empresa_id = public.get_user_empresa_id()));
CREATE POLICY "Tenant delete notas_fiscais_itens" ON public.notas_fiscais_itens FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.notas_fiscais nf WHERE nf.id = nota_fiscal_id AND nf.empresa_id = public.get_user_empresa_id()));

-- ============================================
-- TABELA: spedy_logs
-- ============================================
CREATE TABLE public.spedy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  nota_fiscal_id UUID REFERENCES public.notas_fiscais(id),
  operacao TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  metodo TEXT NOT NULL,
  request_body JSONB,
  status_code INTEGER,
  response_body JSONB,
  sucesso BOOLEAN,
  erro_mensagem TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_spedy_logs_empresa ON public.spedy_logs(empresa_id);
CREATE INDEX idx_spedy_logs_nota ON public.spedy_logs(nota_fiscal_id);

ALTER TABLE public.spedy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select spedy_logs" ON public.spedy_logs FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant insert spedy_logs" ON public.spedy_logs FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id());
