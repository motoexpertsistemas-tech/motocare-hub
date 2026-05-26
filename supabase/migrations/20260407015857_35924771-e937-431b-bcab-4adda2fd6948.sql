ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS integration_id TEXT,
  ADD COLUMN IF NOT EXISTS processing_detail JSONB;