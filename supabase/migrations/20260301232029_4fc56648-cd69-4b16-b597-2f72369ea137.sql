-- Add foto_url and anexos columns to clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS anexos jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for client files
INSERT INTO storage.buckets (id, name, public)
VALUES ('clientes-arquivos', 'clientes-arquivos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the bucket
CREATE POLICY "Allow all uploads on clientes-arquivos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clientes-arquivos');

CREATE POLICY "Allow all reads on clientes-arquivos"
ON storage.objects FOR SELECT
USING (bucket_id = 'clientes-arquivos');

CREATE POLICY "Allow all deletes on clientes-arquivos"
ON storage.objects FOR DELETE
USING (bucket_id = 'clientes-arquivos');