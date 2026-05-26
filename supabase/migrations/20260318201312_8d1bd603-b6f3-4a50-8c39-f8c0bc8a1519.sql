
-- Pipelines de vendas
CREATE TABLE public.pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  ativa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Etapas de pipeline (até 25 por pipeline)
CREATE TABLE public.pipeline_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cor text DEFAULT '#3b82f6',
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  telefone text,
  whatsapp text,
  empresa text,
  cargo text,
  origem text DEFAULT 'manual',
  tags text[] DEFAULT '{}',
  observacoes text,
  score integer DEFAULT 0,
  status text DEFAULT 'novo',
  responsavel text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Negócios (deals)
CREATE TABLE public.negocios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  valor numeric DEFAULT 0,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  pipeline_id uuid NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  etapa_id uuid NOT NULL REFERENCES public.pipeline_etapas(id) ON DELETE CASCADE,
  probabilidade integer DEFAULT 50,
  data_previsao_fechamento date,
  responsavel text,
  notas text,
  status text DEFAULT 'aberto',
  motivo_perda text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Membros da equipe
CREATE TABLE public.membros_equipe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  cargo text,
  avatar_url text,
  ativo boolean DEFAULT true,
  permissoes text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Webhooks configurados
CREATE TABLE public.webhooks_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  url text NOT NULL,
  eventos text[] DEFAULT '{}',
  ativo boolean DEFAULT true,
  secret text,
  headers jsonb DEFAULT '{}',
  ultimo_disparo timestamptz,
  total_disparos integer DEFAULT 0,
  ultimo_status integer,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membros_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on pipelines" ON public.pipelines FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pipeline_etapas" ON public.pipeline_etapas FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on leads" ON public.leads FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on negocios" ON public.negocios FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on membros_equipe" ON public.membros_equipe FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on webhooks_config" ON public.webhooks_config FOR ALL TO public USING (true) WITH CHECK (true);

-- Inserir pipeline padrão
INSERT INTO public.pipelines (nome, descricao) VALUES ('Pipeline Principal', 'Pipeline padrão de vendas');

-- Inserir etapas padrão
INSERT INTO public.pipeline_etapas (pipeline_id, nome, cor, ordem)
SELECT p.id, e.nome, e.cor, e.ordem
FROM public.pipelines p,
(VALUES 
  ('Novo Lead', '#6366f1', 0),
  ('Qualificação', '#3b82f6', 1),
  ('Proposta', '#f59e0b', 2),
  ('Negociação', '#f97316', 3),
  ('Fechamento', '#22c55e', 4),
  ('Perdido', '#ef4444', 5)
) AS e(nome, cor, ordem)
WHERE p.nome = 'Pipeline Principal';
