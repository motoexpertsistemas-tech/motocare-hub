CREATE TABLE public.produto_composicao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_pai_id uuid NOT NULL REFERENCES public.produtos_catalogo(id) ON DELETE CASCADE,
  produto_item_id uuid NOT NULL REFERENCES public.produtos_catalogo(id) ON DELETE CASCADE,
  quantidade numeric NOT NULL DEFAULT 1,
  unidade text DEFAULT 'UN',
  custo numeric DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.produto_composicao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on produto_composicao" ON public.produto_composicao FOR ALL USING (true) WITH CHECK (true);