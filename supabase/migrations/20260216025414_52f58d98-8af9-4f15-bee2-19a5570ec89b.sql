
-- Import queue table to track batch jobs
CREATE TABLE public.import_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  total_produtos integer NOT NULL DEFAULT 0,
  produtos_inseridos integer NOT NULL DEFAULT 0,
  produtos_duplicados integer NOT NULL DEFAULT 0,
  erro text,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  finalizado_em timestamp with time zone
);

ALTER TABLE public.import_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on import_queue" ON public.import_queue FOR SELECT USING (true);
CREATE POLICY "Allow all insert on import_queue" ON public.import_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on import_queue" ON public.import_queue FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on import_queue" ON public.import_queue FOR DELETE USING (true);
