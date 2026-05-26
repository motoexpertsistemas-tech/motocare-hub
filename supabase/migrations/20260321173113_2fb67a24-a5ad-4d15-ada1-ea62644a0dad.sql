
ALTER TABLE public.servicos ADD COLUMN custo_homem_hora_id uuid REFERENCES public.custo_homem_hora(id) ON DELETE SET NULL;
