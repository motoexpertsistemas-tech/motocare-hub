
-- Tabela de configuração da loja e-commerce por empresa
CREATE TABLE public.ecommerce_lojas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome_loja text NOT NULL DEFAULT '',
  slug text UNIQUE,
  exibir_precos_sem_login boolean NOT NULL DEFAULT false,
  exigir_login_compra boolean NOT NULL DEFAULT true,
  desconto_pix numeric NOT NULL DEFAULT 3.0,
  max_parcelas integer NOT NULL DEFAULT 10,
  whatsapp text,
  instagram text,
  facebook text,
  cor_primaria text DEFAULT '#FF6600',
  cor_secundaria text DEFAULT '#1a1a2e',
  logo_url text,
  ativa boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(empresa_id)
);

ALTER TABLE public.ecommerce_lojas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on ecommerce_lojas" ON public.ecommerce_lojas
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Tabela de clientes do e-commerce (contas de acesso)
CREATE TABLE public.ecommerce_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.ecommerce_lojas(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  cpf text,
  senha_hash text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  ultimo_login timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(loja_id, email)
);

ALTER TABLE public.ecommerce_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on ecommerce_clientes" ON public.ecommerce_clientes
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Tabela de endereços do cliente
CREATE TABLE public.ecommerce_enderecos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.ecommerce_clientes(id) ON DELETE CASCADE,
  apelido text DEFAULT 'Casa',
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  principal boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ecommerce_enderecos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on ecommerce_enderecos" ON public.ecommerce_enderecos
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Tabela de pedidos do e-commerce
CREATE TABLE public.ecommerce_pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.ecommerce_lojas(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.ecommerce_clientes(id) ON DELETE CASCADE,
  numero_pedido serial,
  status text NOT NULL DEFAULT 'pendente',
  subtotal numeric NOT NULL DEFAULT 0,
  desconto numeric NOT NULL DEFAULT 0,
  frete numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  forma_pagamento text,
  parcelas integer DEFAULT 1,
  observacoes text,
  endereco_entrega jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ecommerce_pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on ecommerce_pedidos" ON public.ecommerce_pedidos
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Itens do pedido
CREATE TABLE public.ecommerce_pedidos_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.ecommerce_pedidos(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES public.produtos_catalogo(id) ON DELETE SET NULL,
  nome_produto text NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  preco_unitario numeric NOT NULL DEFAULT 0,
  preco_total numeric NOT NULL DEFAULT 0,
  imagem_url text
);

ALTER TABLE public.ecommerce_pedidos_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on ecommerce_pedidos_itens" ON public.ecommerce_pedidos_itens
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Extensão para hash de senha
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função para vincular cliente automaticamente por CPF/telefone
CREATE OR REPLACE FUNCTION public.vincular_cliente_ecommerce()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.cliente_id IS NULL THEN
    SELECT id INTO NEW.cliente_id
    FROM public.clientes
    WHERE (NEW.cpf IS NOT NULL AND cpf = NEW.cpf)
       OR (NEW.telefone IS NOT NULL AND telefone = NEW.telefone)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vincular_cliente_ecommerce
  BEFORE INSERT ON public.ecommerce_clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.vincular_cliente_ecommerce();
