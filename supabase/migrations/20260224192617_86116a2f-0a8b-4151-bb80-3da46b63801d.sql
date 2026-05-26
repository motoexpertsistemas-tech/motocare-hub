
-- Cache de consultas de placa para reutilização em agendamentos futuros
CREATE TABLE public.veiculos_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placa TEXT NOT NULL UNIQUE,
  marca TEXT,
  modelo TEXT,
  ano TEXT,
  cor TEXT,
  chassi TEXT,
  combustivel TEXT,
  tipo_veiculo TEXT,
  municipio TEXT,
  uf TEXT,
  fonte TEXT,
  dados_completos JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.veiculos_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on veiculos_cache" ON public.veiculos_cache FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_veiculos_cache_placa ON public.veiculos_cache (placa);
