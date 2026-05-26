ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS cadastrado_por text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cadastrado_em timestamp with time zone DEFAULT now();