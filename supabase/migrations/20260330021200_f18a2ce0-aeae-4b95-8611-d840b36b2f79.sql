-- =============================================
-- PHASE 1 + 2: Multi-Tenant Security Lockdown
-- =============================================

-- 1. Create helper function for tenant isolation (using auth_user_id)
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT empresa_id FROM public.usuarios
  WHERE auth_user_id = auth.uid()
  LIMIT 1
$$;

-- 2. Add empresa_id to ALL tenant-specific tables
ALTER TABLE public.agente_treinamento ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.ajustes_estoque ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.ajustes_estoque_itens ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.analytics_conversas ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.automacoes ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.avaliacoes_fornecedores ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.caixa_movimentacoes ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.caixas ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.canais_comunicacao ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.chatbot_fluxos ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.clientes ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.configuracao_fiscal ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.configuracoes_loja ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.contas_bancarias ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.conversas ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.conversas_whatsapp ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.cotacoes ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.cotacoes_itens ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.cotacoes_respostas ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.custo_homem_hora ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.ecommerce_clientes ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.ecommerce_enderecos ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.ecommerce_pedidos ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.ecommerce_pedidos_itens ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.emissoes_fiscais ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.etiquetas_modelos ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.formas_pagamento ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.fornecedores ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.funcionarios ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.import_queue ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.leads ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.log_auditoria ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.marketplace_integracoes ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.marketplace_pedidos ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.marketplace_produtos ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.membros_equipe ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.mensagens ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.movimentacoes_financeiras ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.negocios ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.orcamentos ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.orcamentos_itens ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.orcamentos_servicos ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.ordem_servico ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.os_itens ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.pedidos_compra ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.pedidos_compra_itens ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.pipeline_etapas ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.pipelines ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.produto_composicao ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.produtos_catalogo ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.respostas_rapidas ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.servicos ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.situacoes_financeiro ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.situacoes_os ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.tabela_precos_servicos ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.valores_venda ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.webhooks_config ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;

-- 3. DROP ALL existing permissive policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 4. Create proper tenant-isolated RLS policies
DO $$
DECLARE
  tenant_tables text[] := ARRAY[
    'agente_treinamento', 'ajustes_estoque', 'ajustes_estoque_itens',
    'analytics_conversas', 'automacoes', 'avaliacoes_fornecedores',
    'caixa_movimentacoes', 'caixas', 'canais_comunicacao', 'chatbot_fluxos',
    'clientes', 'configuracao_fiscal', 'configuracoes_loja', 'contas_bancarias',
    'conversas', 'conversas_whatsapp', 'cotacoes', 'cotacoes_itens', 'cotacoes_respostas',
    'custo_homem_hora', 'ecommerce_clientes', 'ecommerce_enderecos',
    'ecommerce_pedidos', 'ecommerce_pedidos_itens', 'emissoes_fiscais',
    'etiquetas_modelos', 'formas_pagamento', 'fornecedores', 'funcionarios',
    'import_queue', 'leads', 'log_auditoria', 'marketplace_integracoes',
    'marketplace_pedidos', 'marketplace_produtos', 'membros_equipe', 'mensagens',
    'movimentacoes_financeiras', 'negocios', 'orcamentos', 'orcamentos_itens',
    'orcamentos_servicos', 'ordem_servico', 'os_itens', 'pedidos_compra',
    'pedidos_compra_itens', 'pipeline_etapas', 'pipelines', 'produto_composicao',
    'produtos_catalogo', 'respostas_rapidas', 'servicos', 'situacoes_financeiro',
    'situacoes_os', 'tabela_precos_servicos', 'valores_venda', 'webhooks_config',
    'assinaturas', 'faturas', 'ecommerce_lojas', 'empresa_produtos',
    'empresas_brindes', 'eventos_sistema', 'plano_contas'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('CREATE POLICY "Tenant select" ON public.%I FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id())', t);
    EXECUTE format('CREATE POLICY "Tenant insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_empresa_id())', t);
    EXECUTE format('CREATE POLICY "Tenant update" ON public.%I FOR UPDATE TO authenticated USING (empresa_id = public.get_user_empresa_id()) WITH CHECK (empresa_id = public.get_user_empresa_id())', t);
    EXECUTE format('CREATE POLICY "Tenant delete" ON public.%I FOR DELETE TO authenticated USING (empresa_id = public.get_user_empresa_id())', t);
  END LOOP;
END $$;

-- Special: empresas - public read, owner modify
CREATE POLICY "Public read empresas" ON public.empresas FOR SELECT TO public USING (true);
CREATE POLICY "Auth insert empresas" ON public.empresas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owner update empresas" ON public.empresas FOR UPDATE TO authenticated USING (id = public.get_user_empresa_id());
CREATE POLICY "Owner delete empresas" ON public.empresas FOR DELETE TO authenticated USING (id = public.get_user_empresa_id());

-- Special: usuarios - own record only
CREATE POLICY "User select own" ON public.usuarios FOR SELECT TO authenticated USING (auth_user_id = auth.uid());
CREATE POLICY "User insert own" ON public.usuarios FOR INSERT TO authenticated WITH CHECK (auth_user_id = auth.uid());
CREATE POLICY "User update own" ON public.usuarios FOR UPDATE TO authenticated USING (auth_user_id = auth.uid());

-- Special: user_roles - read own + admin manage
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SaaS admin tables: admin-only
DO $$
DECLARE
  admin_tables text[] := ARRAY[
    'afiliados', 'afiliados_analytics', 'afiliados_comissoes_recorrentes',
    'afiliados_pagamentos', 'afiliados_vendas', 'cupons', 'metricas_mensais',
    'produtos_brindes', 'plano_contas_template'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY admin_tables LOOP
    EXECUTE format('CREATE POLICY "Admin only" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin''))', t);
  END LOOP;
END $$;

-- Shared lookup: veiculos_cache
CREATE POLICY "Auth read veiculos" ON public.veiculos_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert veiculos" ON public.veiculos_cache FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update veiculos" ON public.veiculos_cache FOR UPDATE TO authenticated USING (true);

-- Public read for e-commerce vitrine
CREATE POLICY "Public read produtos" ON public.produtos_catalogo FOR SELECT TO public USING (true);

-- 5. Indexes for performance
DO $$
DECLARE
  tenant_tables text[] := ARRAY[
    'agente_treinamento', 'ajustes_estoque', 'ajustes_estoque_itens',
    'analytics_conversas', 'automacoes', 'avaliacoes_fornecedores',
    'caixa_movimentacoes', 'caixas', 'canais_comunicacao', 'chatbot_fluxos',
    'clientes', 'configuracao_fiscal', 'configuracoes_loja', 'contas_bancarias',
    'conversas', 'conversas_whatsapp', 'cotacoes', 'cotacoes_itens', 'cotacoes_respostas',
    'custo_homem_hora', 'ecommerce_clientes', 'ecommerce_enderecos',
    'ecommerce_pedidos', 'ecommerce_pedidos_itens', 'emissoes_fiscais',
    'etiquetas_modelos', 'formas_pagamento', 'fornecedores', 'funcionarios',
    'import_queue', 'leads', 'log_auditoria', 'marketplace_integracoes',
    'marketplace_pedidos', 'marketplace_produtos', 'membros_equipe', 'mensagens',
    'movimentacoes_financeiras', 'negocios', 'orcamentos', 'orcamentos_itens',
    'orcamentos_servicos', 'ordem_servico', 'os_itens', 'pedidos_compra',
    'pedidos_compra_itens', 'pipeline_etapas', 'pipelines', 'produto_composicao',
    'produtos_catalogo', 'respostas_rapidas', 'servicos', 'situacoes_financeiro',
    'situacoes_os', 'tabela_precos_servicos', 'valores_venda', 'webhooks_config'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_empresa_id ON public.%I(empresa_id)', t, t);
  END LOOP;
END $$;