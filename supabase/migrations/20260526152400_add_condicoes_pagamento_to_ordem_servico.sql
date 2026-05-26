-- Migration: Add condicoes_pagamento to ordem_servico
ALTER TABLE public.ordem_servico ADD COLUMN IF NOT EXISTS condicoes_pagamento jsonb DEFAULT '[]'::jsonb;
