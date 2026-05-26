ALTER TABLE public.ordem_servico 
  ADD COLUMN IF NOT EXISTS checklist_revisao jsonb,
  ADD COLUMN IF NOT EXISTS observacoes_checkin text;