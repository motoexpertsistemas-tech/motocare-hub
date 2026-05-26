
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_pessoa TEXT NOT NULL DEFAULT 'juridica' CHECK (tipo_pessoa IN ('fisica', 'juridica')),
  
  -- PESSOA FÍSICA
  nome_completo TEXT,
  cpf TEXT,
  
  -- PESSOA JURÍDICA
  razao_social TEXT,
  nome_fantasia TEXT,
  cnpj TEXT,
  inscricao_estadual TEXT,
  
  -- CONTATO
  email TEXT,
  telefone TEXT NOT NULL,
  whatsapp TEXT,
  telefone_secundario TEXT,
  contato_nome TEXT,
  contato_cargo TEXT,
  
  -- ENDEREÇO
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  pais TEXT DEFAULT 'Brasil',
  
  -- COMERCIAL
  categoria TEXT,
  prazo_entrega_dias INTEGER,
  condicao_pagamento TEXT,
  forma_pagamento TEXT,
  desconto_padrao DECIMAL(5,2) DEFAULT 0,
  frete_tipo TEXT,
  pedido_minimo DECIMAL(10,2) DEFAULT 0,
  
  -- BANCÁRIO
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  pix TEXT,
  
  -- AVALIAÇÃO
  nota_avaliacao DECIMAL(3,1) DEFAULT 0,
  total_cotacoes INTEGER DEFAULT 0,
  total_compras INTEGER DEFAULT 0,
  total_gasto DECIMAL(12,2) DEFAULT 0,
  ultima_compra TIMESTAMP,
  
  -- SITE / CATÁLOGO
  website TEXT,
  catalogo_url TEXT,
  
  observacoes TEXT,
  tags TEXT[],
  
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on fornecedores" ON public.fornecedores FOR SELECT USING (true);
CREATE POLICY "Allow all insert on fornecedores" ON public.fornecedores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on fornecedores" ON public.fornecedores FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on fornecedores" ON public.fornecedores FOR DELETE USING (true);

CREATE INDEX idx_fornecedores_cnpj ON public.fornecedores(cnpj);
CREATE INDEX idx_fornecedores_telefone ON public.fornecedores(telefone);
CREATE INDEX idx_fornecedores_categoria ON public.fornecedores(categoria);

CREATE OR REPLACE FUNCTION public.update_fornecedores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fornecedores_updated_at
BEFORE UPDATE ON public.fornecedores
FOR EACH ROW EXECUTE FUNCTION public.update_fornecedores_updated_at();
