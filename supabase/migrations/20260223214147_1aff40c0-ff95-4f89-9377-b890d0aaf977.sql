
CREATE TABLE public.agente_treinamento (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pergunta text NOT NULL,
  resposta text NOT NULL,
  categoria text NOT NULL DEFAULT 'consulta_produto',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.agente_treinamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on agente_treinamento" ON public.agente_treinamento
  FOR ALL USING (true) WITH CHECK (true);

-- Seed initial examples
INSERT INTO public.agente_treinamento (pergunta, resposta, categoria) VALUES
  ('Tem filtro de óleo para CG 160?', '[Buscar no banco] Sim! Filtro de Óleo Honda Original - R$ 28,90 - 15 em estoque', 'consulta_produto'),
  ('Minha moto tá falhando', '[Fazer perguntas diagnóstico] Qual o modelo? Falha constante ou intermitente?', 'diagnostico');
