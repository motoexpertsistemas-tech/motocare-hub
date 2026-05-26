
CREATE TABLE public.etiquetas_modelos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tamanho_pagina TEXT NOT NULL DEFAULT 'A4 – 21,0 X 29,7 cm',
  largura_mm NUMERIC DEFAULT 0,
  altura_mm NUMERIC DEFAULT 0,
  colunas INTEGER DEFAULT 1,
  linhas INTEGER DEFAULT 1,
  margem_superior_mm NUMERIC DEFAULT 0,
  margem_esquerda_mm NUMERIC DEFAULT 0,
  espaco_horizontal_mm NUMERIC DEFAULT 0,
  espaco_vertical_mm NUMERIC DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.etiquetas_modelos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to etiquetas_modelos" ON public.etiquetas_modelos FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_etiquetas_modelos_updated_at
BEFORE UPDATE ON public.etiquetas_modelos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
