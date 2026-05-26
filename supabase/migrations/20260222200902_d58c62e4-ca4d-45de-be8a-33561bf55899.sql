
-- Create storage bucket for fiscal certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('certificados-fiscais', 'certificados-fiscais', false);

-- Only allow insert/select/delete for all users (no auth in this project)
CREATE POLICY "Allow all select on certificados-fiscais"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificados-fiscais');

CREATE POLICY "Allow all insert on certificados-fiscais"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificados-fiscais');

CREATE POLICY "Allow all delete on certificados-fiscais"
ON storage.objects FOR DELETE
USING (bucket_id = 'certificados-fiscais');
