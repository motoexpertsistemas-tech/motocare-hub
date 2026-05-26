ALTER TABLE public.produtos_catalogo
ADD COLUMN IF NOT EXISTS imagens_adicionais text[] DEFAULT '{}';

COMMENT ON COLUMN public.produtos_catalogo.imagens_adicionais IS 'URLs de imagens adicionais do produto para marketplaces';