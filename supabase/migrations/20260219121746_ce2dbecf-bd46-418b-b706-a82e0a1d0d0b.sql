
-- ============================================
-- CANAIS DE COMUNICAÇÃO
-- ============================================
CREATE TABLE canais_comunicacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'whatsapp','instagram','telegram','facebook','site',
    'mercado_livre','shopee','magalu','b2w','email'
  )),
  nome_exibicao TEXT NOT NULL,
  configuracao JSONB NOT NULL DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  conectado BOOLEAN DEFAULT false,
  ultimo_heartbeat TIMESTAMP,
  erro_conexao TEXT,
  auto_resposta_ativa BOOLEAN DEFAULT false,
  mensagem_boas_vindas TEXT,
  mensagem_horario_comercial TEXT,
  mensagem_fora_horario TEXT,
  horario_inicio TIME DEFAULT '08:00',
  horario_fim TIME DEFAULT '18:00',
  dias_funcionamento TEXT[] DEFAULT ARRAY['seg','ter','qua','qui','sex'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE canais_comunicacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on canais_comunicacao" ON canais_comunicacao FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_canais_tipo ON canais_comunicacao(tipo);

-- ============================================
-- CONVERSAS (THREADS)
-- ============================================
CREATE TABLE conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canal_id UUID NOT NULL REFERENCES canais_comunicacao(id),
  canal_tipo TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  contato_externo_id TEXT NOT NULL,
  contato_nome TEXT,
  contato_avatar_url TEXT,
  atendente_nome TEXT,
  status TEXT NOT NULL DEFAULT 'aguardando' CHECK (status IN (
    'aguardando','em_atendimento','resolvido','abandonado','transferido','bot'
  )),
  tipo_solicitacao TEXT,
  prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta','urgente')),
  tags TEXT[],
  primeira_resposta_em TIMESTAMP WITH TIME ZONE,
  tempo_primeira_resposta_segundos INTEGER,
  resolvido_em TIMESTAMP WITH TIME ZONE,
  tempo_total_atendimento_segundos INTEGER,
  total_mensagens INTEGER DEFAULT 0,
  etapa_funil TEXT,
  valor_estimado DECIMAL(10,2),
  probabilidade_venda INTEGER,
  avaliacao_cliente INTEGER,
  feedback_cliente TEXT,
  ultima_mensagem_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultima_mensagem_de TEXT,
  arquivada BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on conversas" ON conversas FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_conversas_canal ON conversas(canal_id);
CREATE INDEX idx_conversas_cliente ON conversas(cliente_id);
CREATE INDEX idx_conversas_status ON conversas(status);
CREATE INDEX idx_conversas_ultima_msg ON conversas(ultima_mensagem_em DESC);

-- ============================================
-- MENSAGENS
-- ============================================
CREATE TABLE mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
  tipo_remetente TEXT NOT NULL CHECK (tipo_remetente IN ('cliente','atendente','bot','sistema')),
  usuario_nome TEXT,
  tipo_mensagem TEXT NOT NULL CHECK (tipo_mensagem IN (
    'texto','imagem','video','audio','documento','localizacao','contato','produto','botao','template'
  )),
  conteudo TEXT,
  midia_url TEXT,
  midia_tipo TEXT,
  midia_tamanho_bytes BIGINT,
  metadata JSONB,
  status_envio TEXT DEFAULT 'enviado' CHECK (status_envio IN (
    'enviando','enviado','entregue','lido','erro'
  )),
  erro_envio TEXT,
  mensagem_resposta_id UUID REFERENCES mensagens(id),
  id_externo TEXT,
  intencao_detectada TEXT,
  sentimento TEXT,
  confianca_ia DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on mensagens" ON mensagens FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_mensagens_conversa ON mensagens(conversa_id);
CREATE INDEX idx_mensagens_created ON mensagens(created_at DESC);
CREATE INDEX idx_mensagens_externo ON mensagens(id_externo);

-- ============================================
-- RESPOSTAS RÁPIDAS
-- ============================================
CREATE TABLE respostas_rapidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atalho TEXT NOT NULL,
  titulo TEXT NOT NULL,
  categoria TEXT,
  mensagem TEXT NOT NULL,
  midia_url TEXT,
  usa_variaveis BOOLEAN DEFAULT false,
  canais_permitidos TEXT[],
  total_usos INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE respostas_rapidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on respostas_rapidas" ON respostas_rapidas FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- CHATBOT FLUXOS
-- ============================================
CREATE TABLE chatbot_fluxos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  trigger_tipo TEXT NOT NULL CHECK (trigger_tipo IN (
    'palavra_chave','fora_horario','primeira_mensagem','tempo_espera','intencao_ia'
  )),
  trigger_config JSONB,
  canais_ativos TEXT[],
  passos JSONB NOT NULL DEFAULT '[]',
  ativo BOOLEAN DEFAULT true,
  prioridade INTEGER DEFAULT 1,
  total_execucoes INTEGER DEFAULT 0,
  taxa_conclusao DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chatbot_fluxos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on chatbot_fluxos" ON chatbot_fluxos FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- INTEGRAÇÕES MARKETPLACE
-- ============================================
CREATE TABLE marketplace_integracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace TEXT NOT NULL CHECK (marketplace IN (
    'mercado_livre','shopee','magalu','b2w','amazon','olist'
  )),
  credenciais JSONB NOT NULL DEFAULT '{}',
  sincronizar_estoque BOOLEAN DEFAULT true,
  sincronizar_precos BOOLEAN DEFAULT true,
  sincronizar_pedidos BOOLEAN DEFAULT true,
  markup_marketplace DECIMAL(5,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
  erro_sincronizacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE marketplace_integracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on marketplace_integracoes" ON marketplace_integracoes FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- PEDIDOS MARKETPLACE
-- ============================================
CREATE TABLE marketplace_pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integracao_id UUID NOT NULL REFERENCES marketplace_integracoes(id),
  pedido_externo_id TEXT NOT NULL,
  numero_pedido TEXT NOT NULL,
  marketplace TEXT NOT NULL,
  cliente_nome TEXT NOT NULL,
  cliente_cpf_cnpj TEXT,
  cliente_telefone TEXT,
  cliente_email TEXT,
  cep TEXT NOT NULL,
  logradouro TEXT NOT NULL,
  numero TEXT NOT NULL,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  valor_produtos DECIMAL(10,2) NOT NULL,
  valor_frete DECIMAL(10,2) DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL,
  taxa_marketplace DECIMAL(10,2),
  percentual_comissao DECIMAL(5,2),
  status TEXT NOT NULL CHECK (status IN (
    'aguardando_confirmacao','confirmado','em_preparacao','enviado','entregue','cancelado','devolvido'
  )),
  codigo_rastreio TEXT,
  transportadora TEXT,
  data_envio TIMESTAMP WITH TIME ZONE,
  data_entrega TIMESTAMP WITH TIME ZONE,
  itens JSONB NOT NULL DEFAULT '[]',
  nfe_chave TEXT,
  nfe_url TEXT,
  sincronizado_estoque BOOLEAN DEFAULT false,
  sincronizado_financeiro BOOLEAN DEFAULT false,
  data_pedido TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(integracao_id, pedido_externo_id)
);

ALTER TABLE marketplace_pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on marketplace_pedidos" ON marketplace_pedidos FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_marketplace_pedidos_status ON marketplace_pedidos(status);
CREATE INDEX idx_marketplace_pedidos_data ON marketplace_pedidos(data_pedido DESC);

-- ============================================
-- AUTOMAÇÕES
-- ============================================
CREATE TABLE automacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  trigger_evento TEXT NOT NULL CHECK (trigger_evento IN (
    'nova_conversa','mensagem_recebida','conversa_inativa','palavra_chave',
    'horario_especifico','cliente_retornou','pedido_criado','pedido_pago',
    'os_concluida','aniversario_cliente'
  )),
  trigger_config JSONB,
  condicoes JSONB,
  acoes JSONB NOT NULL DEFAULT '[]',
  ativo BOOLEAN DEFAULT true,
  prioridade INTEGER DEFAULT 1,
  total_execucoes INTEGER DEFAULT 0,
  ultima_execucao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE automacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on automacoes" ON automacoes FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION atualizar_conversa_mensagem()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversas SET
    total_mensagens = total_mensagens + 1,
    ultima_mensagem_em = NEW.created_at,
    ultima_mensagem_de = NEW.tipo_remetente,
    primeira_resposta_em = CASE 
      WHEN primeira_resposta_em IS NULL AND NEW.tipo_remetente = 'atendente'
      THEN NEW.created_at
      ELSE primeira_resposta_em
    END,
    tempo_primeira_resposta_segundos = CASE
      WHEN primeira_resposta_em IS NULL AND NEW.tipo_remetente = 'atendente'
      THEN EXTRACT(EPOCH FROM (NEW.created_at - created_at))::INTEGER
      ELSE tempo_primeira_resposta_segundos
    END
  WHERE id = NEW.conversa_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_conversa
AFTER INSERT ON mensagens
FOR EACH ROW EXECUTE FUNCTION atualizar_conversa_mensagem();

CREATE OR REPLACE FUNCTION notificar_nova_mensagem()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'nova_mensagem',
    json_build_object(
      'conversa_id', NEW.conversa_id,
      'tipo_remetente', NEW.tipo_remetente,
      'conteudo', NEW.conteudo
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_mensagem
AFTER INSERT ON mensagens
FOR EACH ROW EXECUTE FUNCTION notificar_nova_mensagem();
