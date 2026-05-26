
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_pessoa TEXT NOT NULL DEFAULT 'fisica' CHECK (tipo_pessoa IN ('fisica', 'juridica')),
  
  -- PESSOA FÍSICA
  nome_completo TEXT,
  cpf TEXT,
  rg TEXT,
  data_nascimento DATE,
  genero TEXT CHECK (genero IN ('masculino', 'feminino', 'outro', 'nao_informar')),
  
  -- PESSOA JURÍDICA
  razao_social TEXT,
  nome_fantasia TEXT,
  cnpj TEXT,
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  
  -- CONTATO
  email TEXT,
  telefone TEXT NOT NULL,
  whatsapp TEXT,
  telefone_secundario TEXT,
  
  -- ENDEREÇO
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  pais TEXT DEFAULT 'Brasil',
  
  -- PREFERÊNCIAS
  forma_pagamento_preferida TEXT,
  dia_vencimento_preferido INTEGER,
  limite_credito DECIMAL(10,2) DEFAULT 0,
  
  -- FIDELIDADE
  nivel_fidelidade TEXT DEFAULT 'bronze' CHECK (nivel_fidelidade IN ('bronze', 'prata', 'ouro', 'platina')),
  pontos_acumulados INTEGER DEFAULT 0,
  
  -- LGPD
  consentimento_email BOOLEAN DEFAULT false,
  consentimento_whatsapp BOOLEAN DEFAULT false,
  consentimento_sms BOOLEAN DEFAULT false,
  data_consentimento TIMESTAMP,
  origem_cadastro TEXT,
  
  -- CLASSIFICAÇÃO
  categoria_cliente TEXT,
  desconto_padrao DECIMAL(5,2) DEFAULT 0,
  
  -- OBSERVAÇÕES
  observacoes TEXT,
  tags TEXT[],
  
  -- ESTATÍSTICAS
  total_gasto DECIMAL(10,2) DEFAULT 0,
  total_os INTEGER DEFAULT 0,
  total_compras INTEGER DEFAULT 0,
  ticket_medio DECIMAL(10,2) DEFAULT 0,
  ultima_compra TIMESTAMP,
  primeira_compra TIMESTAMP,
  
  -- SCORE
  score_pagamento INTEGER DEFAULT 100,
  dias_medio_atraso DECIMAL(5,2) DEFAULT 0,
  
  -- REDES SOCIAIS
  instagram TEXT,
  facebook TEXT,
  
  -- CONTROLE
  ativo BOOLEAN DEFAULT true,
  bloqueado BOOLEAN DEFAULT false,
  motivo_bloqueio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on clientes" ON public.clientes FOR SELECT USING (true);
CREATE POLICY "Allow all insert on clientes" ON public.clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on clientes" ON public.clientes FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on clientes" ON public.clientes FOR DELETE USING (true);

-- INDEXES
CREATE INDEX idx_clientes_cpf ON public.clientes(cpf);
CREATE INDEX idx_clientes_cnpj ON public.clientes(cnpj);
CREATE INDEX idx_clientes_telefone ON public.clientes(telefone);
CREATE INDEX idx_clientes_email ON public.clientes(email);
CREATE INDEX idx_clientes_nivel ON public.clientes(nivel_fidelidade);

-- TRIGGER updated_at
CREATE OR REPLACE FUNCTION public.update_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.update_clientes_updated_at();
