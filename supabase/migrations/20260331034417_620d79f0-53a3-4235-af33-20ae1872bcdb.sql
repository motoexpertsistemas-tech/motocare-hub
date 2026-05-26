
CREATE TABLE IF NOT EXISTS public.transportadoras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  inscricao_estadual TEXT,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  contato_nome TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  tipo_frete TEXT,
  valor_frete_padrao NUMERIC DEFAULT 0,
  prazo_entrega_dias INTEGER,
  website TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  empresa_id UUID REFERENCES public.empresas(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transportadoras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation select" ON public.transportadoras
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Tenant isolation insert" ON public.transportadoras
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Tenant isolation update" ON public.transportadoras
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id())
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Tenant isolation delete" ON public.transportadoras
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());
