-- Fix storage bucket policies: restrict sensitive buckets to authenticated users

-- certificados-fiscais: drop public, add authenticated
DROP POLICY IF EXISTS "Allow all delete on certificados-fiscais" ON storage.objects;
DROP POLICY IF EXISTS "Allow all insert on certificados-fiscais" ON storage.objects;
DROP POLICY IF EXISTS "Allow all select on certificados-fiscais" ON storage.objects;
CREATE POLICY "Auth select certificados" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'certificados-fiscais');
CREATE POLICY "Auth insert certificados" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'certificados-fiscais');
CREATE POLICY "Auth delete certificados" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'certificados-fiscais');

-- clientes-arquivos: drop public, add authenticated
DROP POLICY IF EXISTS "Allow all deletes on clientes-arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads on clientes-arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Allow all uploads on clientes-arquivos" ON storage.objects;
CREATE POLICY "Auth select clientes-arquivos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'clientes-arquivos');
CREATE POLICY "Auth insert clientes-arquivos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'clientes-arquivos');
CREATE POLICY "Auth delete clientes-arquivos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'clientes-arquivos');

-- financeiro-anexos: drop public, add authenticated
DROP POLICY IF EXISTS "Allow delete financeiro anexos" ON storage.objects;
DROP POLICY IF EXISTS "Allow read financeiro anexos" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload financeiro anexos" ON storage.objects;
CREATE POLICY "Auth select financeiro-anexos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'financeiro-anexos');
CREATE POLICY "Auth insert financeiro-anexos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'financeiro-anexos');
CREATE POLICY "Auth delete financeiro-anexos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'financeiro-anexos');

-- product-images: restrict write ops to authenticated (keep public read for e-commerce)
DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
CREATE POLICY "Auth upload product-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Auth update product-images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Auth delete product-images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- produtos: restrict write to authenticated (keep public read)
DROP POLICY IF EXISTS "Anyone can upload to produtos bucket" ON storage.objects;
CREATE POLICY "Auth upload produtos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'produtos');