
-- Cotações table
CREATE TABLE public.cotacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  fornecedor TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_envio TIMESTAMP WITH TIME ZONE,
  data_resposta TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on cotacoes" ON public.cotacoes FOR SELECT USING (true);
CREATE POLICY "Allow all insert on cotacoes" ON public.cotacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on cotacoes" ON public.cotacoes FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on cotacoes" ON public.cotacoes FOR DELETE USING (true);

-- Cotações items
CREATE TABLE public.cotacoes_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cotacao_id UUID NOT NULL REFERENCES public.cotacoes(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos_catalogo(id),
  produto_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  unidade TEXT DEFAULT 'UN',
  preco_unitario NUMERIC DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cotacoes_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on cotacoes_itens" ON public.cotacoes_itens FOR SELECT USING (true);
CREATE POLICY "Allow all insert on cotacoes_itens" ON public.cotacoes_itens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on cotacoes_itens" ON public.cotacoes_itens FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on cotacoes_itens" ON public.cotacoes_itens FOR DELETE USING (true);

CREATE TRIGGER update_cotacoes_updated_at
  BEFORE UPDATE ON public.cotacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
