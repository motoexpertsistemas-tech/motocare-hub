-- Create storage bucket for product images/shares
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access on produtos bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'produtos');

-- Allow authenticated and anon insert
CREATE POLICY "Anyone can upload to produtos bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'produtos');
