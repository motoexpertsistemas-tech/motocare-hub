
CREATE TABLE public.valores_venda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  media_lucro NUMERIC(8,2) NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.valores_venda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view valores_venda"
ON public.valores_venda FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert valores_venda"
ON public.valores_venda FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update valores_venda"
ON public.valores_venda FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete valores_venda"
ON public.valores_venda FOR DELETE USING (true);

CREATE TRIGGER update_valores_venda_updated_at
BEFORE UPDATE ON public.valores_venda
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default values
INSERT INTO public.valores_venda (nome, media_lucro) VALUES
  ('varejo', 80.00),
  ('atacado', 40.00),
  ('SHOPPE', 20.00);
