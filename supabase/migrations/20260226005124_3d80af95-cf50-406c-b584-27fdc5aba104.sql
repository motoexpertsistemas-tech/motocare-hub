CREATE OR REPLACE VIEW public.produtos_catalogo_vitrine AS
SELECT *,
  CASE
    WHEN imagem_url IS NOT NULL AND imagem_url != '' 
         AND precos_venda IS NOT NULL AND jsonb_array_length(precos_venda) > 0 
    THEN 0
    WHEN imagem_url IS NOT NULL AND imagem_url != '' 
    THEN 1
    WHEN precos_venda IS NOT NULL AND jsonb_array_length(precos_venda) > 0 
    THEN 2
    ELSE 3
  END AS vitrine_prioridade
FROM public.produtos_catalogo;