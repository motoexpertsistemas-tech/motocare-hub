
-- Configuração Fiscal da Empresa
CREATE TABLE public.configuracao_fiscal (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Dados da Empresa
  enviar_email_destinatario boolean DEFAULT false,
  discrimina_impostos boolean DEFAULT false,
  nome text,
  nome_fantasia text,
  email text,
  cnpj text,
  cpf_responsavel text,
  telefone text,
  regime_tributario text DEFAULT 'Simples Nacional',
  -- Endereço
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  municipio text,
  uf text,
  -- NFe
  nfe_habilitada boolean DEFAULT false,
  nfe_inscricao_estadual text,
  nfe_serie text,
  nfe_proximo_numero integer DEFAULT 1,
  -- NFSe
  nfse_habilitada boolean DEFAULT false,
  nfse_nacional_habilitada boolean DEFAULT false,
  nfse_inscricao_municipal text,
  nfse_serie text,
  nfse_proximo_numero integer DEFAULT 1,
  nfse_login text,
  nfse_senha text,
  -- Certificado
  certificado_nome text,
  certificado_validade timestamp with time zone,
  certificado_url text,
  -- Timestamps
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracao_fiscal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on configuracao_fiscal" ON public.configuracao_fiscal FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_configuracao_fiscal_updated_at
  BEFORE UPDATE ON public.configuracao_fiscal
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de emissões fiscais
CREATE TABLE public.emissoes_fiscais (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero text NOT NULL,
  tipo text NOT NULL, -- 'nfe', 'nfe_devolucao', 'nfse', 'nfce'
  status text NOT NULL DEFAULT 'processando', -- 'autorizada', 'cancelada', 'erro', 'processando'
  destinatario text,
  valor numeric DEFAULT 0,
  data_emissao timestamp with time zone NOT NULL DEFAULT now(),
  chave_acesso text,
  xml_url text,
  pdf_url text,
  motivo_cancelamento text,
  erro_mensagem text,
  observacoes text,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.emissoes_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on emissoes_fiscais" ON public.emissoes_fiscais FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_emissoes_fiscais_updated_at
  BEFORE UPDATE ON public.emissoes_fiscais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
