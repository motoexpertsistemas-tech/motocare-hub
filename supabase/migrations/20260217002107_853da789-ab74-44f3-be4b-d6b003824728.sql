
CREATE TABLE public.log_auditoria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id TEXT,
  detalhes JSONB,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.log_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on log_auditoria" ON public.log_auditoria FOR SELECT USING (true);
CREATE POLICY "Allow all insert on log_auditoria" ON public.log_auditoria FOR INSERT WITH CHECK (true);
