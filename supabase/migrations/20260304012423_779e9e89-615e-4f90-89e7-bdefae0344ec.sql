
-- Create situacoes_os table
CREATE TABLE public.situacoes_os (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#3b82f6',
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.situacoes_os ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on situacoes_os" ON public.situacoes_os FOR ALL USING (true) WITH CHECK (true);

-- Insert default situations
INSERT INTO public.situacoes_os (nome, cor, ordem) VALUES
  ('Agendada', '#3b82f6', 1),
  ('Atendimento', '#f97316', 2),
  ('Em Execução', '#ef4444', 3),
  ('Aguardando Peças', '#eab308', 4),
  ('Pronta', '#22c55e', 5),
  ('Entregue', '#10b981', 6);
