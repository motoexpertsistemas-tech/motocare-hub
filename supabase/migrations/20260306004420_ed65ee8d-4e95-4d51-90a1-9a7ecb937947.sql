
CREATE TABLE public.marketplace_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES public.produtos_catalogo(id) ON DELETE CASCADE,
  canal text NOT NULL,
  preco numeric NOT NULL DEFAULT 0,
  margem numeric NOT NULL DEFAULT 30,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(produto_id, canal)
);

ALTER TABLE public.marketplace_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on marketplace_produtos" ON public.marketplace_produtos
  FOR ALL USING (true) WITH CHECK (true);
