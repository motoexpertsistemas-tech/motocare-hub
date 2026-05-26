
-- Tabela de conversas WhatsApp
CREATE TABLE public.conversas_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  nome TEXT,
  historico JSONB DEFAULT '[]'::jsonb,
  ultima_mensagem TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(numero)
);

ALTER TABLE public.conversas_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on conversas_whatsapp" ON public.conversas_whatsapp
  FOR ALL USING (true) WITH CHECK (true);

-- Tabela de analytics
CREATE TABLE public.analytics_conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canal TEXT NOT NULL,
  numero TEXT,
  mensagem_usuario TEXT NOT NULL,
  resposta_bot TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tempo_resposta_ms INTEGER,
  satisfacao INTEGER,
  resolvido BOOLEAN DEFAULT false
);

ALTER TABLE public.analytics_conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on analytics_conversas" ON public.analytics_conversas
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_analytics_canal ON public.analytics_conversas(canal);
CREATE INDEX idx_analytics_timestamp ON public.analytics_conversas(timestamp DESC);
