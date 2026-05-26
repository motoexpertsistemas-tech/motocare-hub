
-- Create storage bucket for financial attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('financeiro-anexos', 'financeiro-anexos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload files to the bucket
CREATE POLICY "Allow upload financeiro anexos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'financeiro-anexos');

-- Allow anyone to read files from the bucket
CREATE POLICY "Allow read financeiro anexos"
ON storage.objects FOR SELECT
USING (bucket_id = 'financeiro-anexos');

-- Allow anyone to delete files from the bucket
CREATE POLICY "Allow delete financeiro anexos"
ON storage.objects FOR DELETE
USING (bucket_id = 'financeiro-anexos');
