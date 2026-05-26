
ALTER TABLE public.ordem_servico 
  ADD COLUMN IF NOT EXISTS canal_venda text DEFAULT 'Presencial',
  ADD COLUMN IF NOT EXISTS centro_custo text,
  ADD COLUMN IF NOT EXISTS vendedor text,
  ADD COLUMN IF NOT EXISTS tecnico_responsavel text;

NOTIFY pgrst, 'reload schema';
