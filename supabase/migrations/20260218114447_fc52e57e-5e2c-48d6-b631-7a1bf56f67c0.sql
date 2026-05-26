
-- Dropar contato_nome e contato_cargo que ficaram redundantes
ALTER TABLE public.fornecedores DROP COLUMN IF EXISTS contato_cargo;

-- ============================================
-- PEDIDOS DE COMPRA
-- ============================================
CREATE TABLE public.pedidos_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido TEXT NOT NULL,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_frete DECIMAL(10,2) DEFAULT 0,
  valor_desconto DECIMAL(10,2) DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT NOT NULL DEFAULT 'boleto',
  condicao_pagamento TEXT,
  data_pedido TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_prevista_entrega DATE,
  data_entrega_real DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
    'pendente', 'aprovado', 'enviado', 'recebido_parcial', 'recebido_total', 'cancelado'
  )),
  codigo_rastreio TEXT,
  transportadora TEXT,
  observacoes TEXT,
  observacoes_recebimento TEXT,
  data_recebimento TIMESTAMP WITH TIME ZONE,
  nfe_fornecedor_chave TEXT,
  nfe_fornecedor_numero TEXT,
  nfe_fornecedor_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select on pedidos_compra" ON public.pedidos_compra FOR SELECT USING (true);
CREATE POLICY "Allow all insert on pedidos_compra" ON public.pedidos_compra FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on pedidos_compra" ON public.pedidos_compra FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on pedidos_compra" ON public.pedidos_compra FOR DELETE USING (true);
CREATE INDEX idx_pedidos_compra_fornecedor ON public.pedidos_compra(fornecedor_id);
CREATE INDEX idx_pedidos_compra_status ON public.pedidos_compra(status);

-- ITENS DO PEDIDO
CREATE TABLE public.pedidos_compra_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_compra_id UUID NOT NULL REFERENCES public.pedidos_compra(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos_catalogo(id),
  quantidade_pedida DECIMAL(10,3) NOT NULL DEFAULT 1,
  quantidade_recebida DECIMAL(10,3) DEFAULT 0,
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(10,2) DEFAULT 0,
  codigo_fornecedor TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido_parcial', 'recebido_total')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pedidos_compra_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select on pedidos_compra_itens" ON public.pedidos_compra_itens FOR SELECT USING (true);
CREATE POLICY "Allow all insert on pedidos_compra_itens" ON public.pedidos_compra_itens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on pedidos_compra_itens" ON public.pedidos_compra_itens FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on pedidos_compra_itens" ON public.pedidos_compra_itens FOR DELETE USING (true);
CREATE INDEX idx_pedidos_compra_itens_pedido ON public.pedidos_compra_itens(pedido_compra_id);
CREATE INDEX idx_pedidos_compra_itens_produto ON public.pedidos_compra_itens(produto_id);

-- AVALIAÇÕES DE FORNECEDORES
CREATE TABLE public.avaliacoes_fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id),
  pedido_compra_id UUID REFERENCES public.pedidos_compra(id),
  qualidade_produtos INTEGER CHECK (qualidade_produtos BETWEEN 1 AND 5),
  cumprimento_prazo INTEGER CHECK (cumprimento_prazo BETWEEN 1 AND 5),
  preco_competitivo INTEGER CHECK (preco_competitivo BETWEEN 1 AND 5),
  atendimento INTEGER CHECK (atendimento BETWEEN 1 AND 5),
  comentario TEXT,
  data_avaliacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.avaliacoes_fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select on avaliacoes_fornecedores" ON public.avaliacoes_fornecedores FOR SELECT USING (true);
CREATE POLICY "Allow all insert on avaliacoes_fornecedores" ON public.avaliacoes_fornecedores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on avaliacoes_fornecedores" ON public.avaliacoes_fornecedores FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on avaliacoes_fornecedores" ON public.avaliacoes_fornecedores FOR DELETE USING (true);
CREATE INDEX idx_avaliacoes_fornecedor ON public.avaliacoes_fornecedores(fornecedor_id);

-- Trigger para atualizar médias
CREATE OR REPLACE FUNCTION public.atualizar_avaliacao_fornecedor()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.fornecedores SET
    avaliacao_qualidade = (SELECT AVG(qualidade_produtos) FROM public.avaliacoes_fornecedores WHERE fornecedor_id = NEW.fornecedor_id),
    avaliacao_prazo = (SELECT AVG(cumprimento_prazo) FROM public.avaliacoes_fornecedores WHERE fornecedor_id = NEW.fornecedor_id),
    avaliacao_preco = (SELECT AVG(preco_competitivo) FROM public.avaliacoes_fornecedores WHERE fornecedor_id = NEW.fornecedor_id),
    avaliacao_atendimento = (SELECT AVG(atendimento) FROM public.avaliacoes_fornecedores WHERE fornecedor_id = NEW.fornecedor_id)
  WHERE id = NEW.fornecedor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_avaliacao
AFTER INSERT ON public.avaliacoes_fornecedores
FOR EACH ROW EXECUTE FUNCTION public.atualizar_avaliacao_fornecedor();

-- COTAÇÕES RESPOSTAS
CREATE TABLE public.cotacoes_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id UUID NOT NULL REFERENCES public.cotacoes(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id),
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  prazo_entrega_dias INTEGER NOT NULL DEFAULT 7,
  validade_proposta_dias INTEGER DEFAULT 7,
  forma_pagamento TEXT,
  observacoes TEXT,
  aceita BOOLEAN DEFAULT false,
  data_resposta TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cotacao_id, fornecedor_id)
);

ALTER TABLE public.cotacoes_respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select on cotacoes_respostas" ON public.cotacoes_respostas FOR SELECT USING (true);
CREATE POLICY "Allow all insert on cotacoes_respostas" ON public.cotacoes_respostas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on cotacoes_respostas" ON public.cotacoes_respostas FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on cotacoes_respostas" ON public.cotacoes_respostas FOR DELETE USING (true);
CREATE INDEX idx_cotacoes_respostas_cotacao ON public.cotacoes_respostas(cotacao_id);
CREATE INDEX idx_cotacoes_respostas_fornecedor ON public.cotacoes_respostas(fornecedor_id);

-- Trigger updated_at pedidos_compra
CREATE OR REPLACE FUNCTION public.update_pedidos_compra_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pedidos_compra_updated_at
BEFORE UPDATE ON public.pedidos_compra
FOR EACH ROW EXECUTE FUNCTION public.update_pedidos_compra_updated_at();
