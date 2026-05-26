
ALTER TABLE public.ajustes_estoque
  ADD COLUMN valor_frete numeric DEFAULT 0,
  ADD COLUMN valor_total numeric DEFAULT 0,
  ADD COLUMN observacoes text;

CREATE TABLE public.ajustes_estoque_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ajuste_id uuid NOT NULL REFERENCES public.ajustes_estoque(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produtos_catalogo(id) ON DELETE CASCADE,
  quantidade integer NOT NULL DEFAULT 0,
  unidade text DEFAULT 'UN',
  valor_custo numeric DEFAULT 0,
  valor_total numeric DEFAULT 0
);

ALTER TABLE public.ajustes_estoque_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on ajustes_estoque_itens" ON public.ajustes_estoque_itens FOR SELECT USING (true);
CREATE POLICY "Allow all insert on ajustes_estoque_itens" ON public.ajustes_estoque_itens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete on ajustes_estoque_itens" ON public.ajustes_estoque_itens FOR DELETE USING (true);

-- Remove old columns that are now in itens table
ALTER TABLE public.ajustes_estoque DROP COLUMN IF EXISTS quantidade;
ALTER TABLE public.ajustes_estoque DROP COLUMN IF EXISTS produto_id;
