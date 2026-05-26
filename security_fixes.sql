-- ============================================================
-- SECURITY FIXES — execute no SQL Editor do Supabase
-- Restringe acesso a credenciais e remove enumeração de roles
-- ============================================================

-- 1) user_roles: remover SELECT global (qualquer autenticado lia tudo)
DROP POLICY IF EXISTS "Authenticated can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Read own roles" ON public.user_roles;
CREATE POLICY "Read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id IN (SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid())
  );

-- 2) ecommerce_clientes: bloquear coluna senha_hash para clientes do PostgREST
REVOKE SELECT (senha_hash) ON public.ecommerce_clientes FROM anon, authenticated;

-- 3) spedy_config: SELECT só admin do tenant (api_key sensível)
DROP POLICY IF EXISTS "Tenant select spedy_config" ON public.spedy_config;
CREATE POLICY "Admin select spedy_config" ON public.spedy_config
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id() AND public.has_role(auth.uid(), 'admin'));

-- 4) marketplace_integracoes: SELECT só admin do tenant (credenciais JSONB)
DROP POLICY IF EXISTS "Tenant select" ON public.marketplace_integracoes;
CREATE POLICY "Admin select marketplace_integracoes" ON public.marketplace_integracoes
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id() AND public.has_role(auth.uid(), 'admin'));

-- 5) webhooks_config: SELECT só admin do tenant (campo secret)
DROP POLICY IF EXISTS "Tenant select" ON public.webhooks_config;
CREATE POLICY "Admin select webhooks_config" ON public.webhooks_config
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id() AND public.has_role(auth.uid(), 'admin'));

-- 6) configuracao_fiscal: SELECT só admin (token, certificado, senha NFSe)
DROP POLICY IF EXISTS "Tenant select" ON public.configuracao_fiscal;
CREATE POLICY "Admin select configuracao_fiscal" ON public.configuracao_fiscal
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id() AND public.has_role(auth.uid(), 'admin'));
