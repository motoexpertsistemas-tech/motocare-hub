
ALTER TABLE public.ordem_servico
ADD COLUMN IF NOT EXISTS km_ultima_revisao integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS oleo_recomendado text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ultima_troca_oleo date DEFAULT NULL;
