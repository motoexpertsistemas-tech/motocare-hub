
CREATE TABLE public.ajustes_estoque (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id uuid NOT NULL REFERENCES public.produtos_catalogo(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade integer NOT NULL,
  motivo text,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ajustes_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on ajustes_estoque" ON public.ajustes_estoque FOR SELECT USING (true);
CREATE POLICY "Allow all insert on ajustes_estoque" ON public.ajustes_estoque FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete on ajustes_estoque" ON public.ajustes_estoque FOR DELETE USING (true);
