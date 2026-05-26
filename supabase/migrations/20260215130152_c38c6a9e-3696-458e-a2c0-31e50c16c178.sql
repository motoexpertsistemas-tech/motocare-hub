
-- Tabela de produtos importados do catálogo CPL
CREATE TABLE public.produtos_catalogo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_cpl TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  marca TEXT,
  categoria TEXT,
  imagem_url TEXT,
  aplicacoes TEXT[], -- Array com as aplicações (ex: "TITAN125 1995 A 1999")
  importado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.produtos_catalogo ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem ler os produtos
CREATE POLICY "Authenticated users can view products"
ON public.produtos_catalogo
FOR SELECT
USING (true);

-- Apenas usuários autenticados podem inserir/atualizar (importação)
CREATE POLICY "Authenticated users can insert products"
ON public.produtos_catalogo
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
ON public.produtos_catalogo
FOR UPDATE
USING (true);

-- Índices para busca rápida
CREATE INDEX idx_produtos_catalogo_categoria ON public.produtos_catalogo(categoria);
CREATE INDEX idx_produtos_catalogo_nome ON public.produtos_catalogo USING gin(to_tsvector('portuguese', nome));
CREATE INDEX idx_produtos_catalogo_aplicacoes ON public.produtos_catalogo USING gin(aplicacoes);

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_produtos_catalogo_updated_at
BEFORE UPDATE ON public.produtos_catalogo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
