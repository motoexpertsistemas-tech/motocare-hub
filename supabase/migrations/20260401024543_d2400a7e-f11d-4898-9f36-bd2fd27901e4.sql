-- Make sensitive buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('financeiro-anexos', 'clientes-arquivos');

-- Add missing UPDATE policies for storage
CREATE POLICY "Tenant update financeiro" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'financeiro-anexos' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);

CREATE POLICY "Tenant update clientes" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'clientes-arquivos' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);

CREATE POLICY "Tenant update certificados" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'certificados-fiscais' AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text);