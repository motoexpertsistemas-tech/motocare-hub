-- ============================================================
-- SalesOS modules: Cadencias, Objecoes, Metas, BANT, Brain, Booking
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ---------- CADENCIAS ----------
CREATE TABLE IF NOT EXISTS public.cadencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL DEFAULT public.get_user_empresa_id(),
  nome text NOT NULL,
  descricao text,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cadencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cadencias_tenant ON public.cadencias;
CREATE POLICY cadencias_tenant ON public.cadencias FOR ALL
  USING (empresa_id = public.get_user_empresa_id())
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE TABLE IF NOT EXISTS public.cadencia_passos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadencia_id uuid NOT NULL REFERENCES public.cadencias(id) ON DELETE CASCADE,
  ordem int NOT NULL,
  delay_horas int NOT NULL DEFAULT 24,
  canal text NOT NULL DEFAULT 'whatsapp',
  mensagem text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cadencia_passos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cadencia_passos_tenant ON public.cadencia_passos;
CREATE POLICY cadencia_passos_tenant ON public.cadencia_passos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.cadencias c WHERE c.id = cadencia_id AND c.empresa_id = public.get_user_empresa_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cadencias c WHERE c.id = cadencia_id AND c.empresa_id = public.get_user_empresa_id()));

CREATE TABLE IF NOT EXISTS public.cadencia_execucoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL DEFAULT public.get_user_empresa_id(),
  cadencia_id uuid NOT NULL REFERENCES public.cadencias(id) ON DELETE CASCADE,
  negocio_id uuid,
  contato_telefone text,
  passo_atual int NOT NULL DEFAULT 0,
  proximo_envio timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'ativa',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cadencia_execucoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cadencia_exec_tenant ON public.cadencia_execucoes;
CREATE POLICY cadencia_exec_tenant ON public.cadencia_execucoes FOR ALL
  USING (empresa_id = public.get_user_empresa_id())
  WITH CHECK (empresa_id = public.get_user_empresa_id());
CREATE INDEX IF NOT EXISTS idx_cadencia_exec_envio ON public.cadencia_execucoes(proximo_envio) WHERE status = 'ativa';

-- ---------- OBJECOES ----------
CREATE TABLE IF NOT EXISTS public.objecoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL DEFAULT public.get_user_empresa_id(),
  categoria text,
  objecao text NOT NULL,
  resposta text NOT NULL,
  tags text[] DEFAULT '{}',
  vezes_usada int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.objecoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS objecoes_tenant ON public.objecoes;
CREATE POLICY objecoes_tenant ON public.objecoes FOR ALL
  USING (empresa_id = public.get_user_empresa_id())
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- ---------- METAS ----------
CREATE TABLE IF NOT EXISTS public.metas_vendedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL DEFAULT public.get_user_empresa_id(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  mes int NOT NULL,
  ano int NOT NULL,
  meta_valor numeric(12,2) NOT NULL DEFAULT 0,
  meta_os int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, mes, ano)
);
ALTER TABLE public.metas_vendedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS metas_tenant ON public.metas_vendedores;
CREATE POLICY metas_tenant ON public.metas_vendedores FOR ALL
  USING (empresa_id = public.get_user_empresa_id())
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- ---------- BANT ----------
CREATE TABLE IF NOT EXISTS public.lead_bant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL DEFAULT public.get_user_empresa_id(),
  negocio_id uuid NOT NULL UNIQUE,
  budget text,
  authority text,
  need text,
  timeline text,
  score int DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_bant ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lead_bant_tenant ON public.lead_bant;
CREATE POLICY lead_bant_tenant ON public.lead_bant FOR ALL
  USING (empresa_id = public.get_user_empresa_id())
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- ---------- BRAIN ----------
CREATE TABLE IF NOT EXISTS public.brain_fontes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL DEFAULT public.get_user_empresa_id(),
  tipo text NOT NULL DEFAULT 'faq',
  titulo text NOT NULL,
  conteudo text NOT NULL,
  url text,
  status text NOT NULL DEFAULT 'pendente',
  total_chunks int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brain_fontes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS brain_fontes_tenant ON public.brain_fontes;
CREATE POLICY brain_fontes_tenant ON public.brain_fontes FOR ALL
  USING (empresa_id = public.get_user_empresa_id())
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE TABLE IF NOT EXISTS public.brain_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  fonte_id uuid NOT NULL REFERENCES public.brain_fontes(id) ON DELETE CASCADE,
  conteudo text NOT NULL,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brain_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS brain_chunks_tenant ON public.brain_chunks;
CREATE POLICY brain_chunks_tenant ON public.brain_chunks FOR ALL
  USING (empresa_id = public.get_user_empresa_id())
  WITH CHECK (empresa_id = public.get_user_empresa_id());
CREATE INDEX IF NOT EXISTS brain_chunks_embedding_idx
  ON public.brain_chunks USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION public.match_brain(
  p_empresa_id uuid, query_embedding vector(1536), match_count int DEFAULT 5
) RETURNS TABLE (id uuid, conteudo text, similarity float)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.conteudo, 1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.brain_chunks c
  WHERE c.empresa_id = p_empresa_id AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ---------- BOOKING PUBLICO ----------
CREATE TABLE IF NOT EXISTS public.agendamentos_publicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  nome_cliente text NOT NULL,
  telefone text NOT NULL,
  veiculo text,
  servico text,
  data_agendada timestamptz NOT NULL,
  observacoes text,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agendamentos_publicos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agpub_tenant_select ON public.agendamentos_publicos;
CREATE POLICY agpub_tenant_select ON public.agendamentos_publicos FOR SELECT
  USING (empresa_id = public.get_user_empresa_id());
DROP POLICY IF EXISTS agpub_tenant_update ON public.agendamentos_publicos;
CREATE POLICY agpub_tenant_update ON public.agendamentos_publicos FOR UPDATE
  USING (empresa_id = public.get_user_empresa_id());

-- Inserts publicos vao via edge function com service role.

-- ---------- CRON: executar cadências a cada 15 min ----------
SELECT cron.schedule(
  'executar-cadencias-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url:='https://qrwminvkdcjaqpiptxlr.supabase.co/functions/v1/executar-cadencias',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyd21pbnZrZGNqYXFwaXB0eGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMjM1MzEsImV4cCI6MjA4NjU5OTUzMX0.dsB0Y-dYeZvMw3g7pj2kuLe6BHlgyTx54Ib-zRsASlE"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
