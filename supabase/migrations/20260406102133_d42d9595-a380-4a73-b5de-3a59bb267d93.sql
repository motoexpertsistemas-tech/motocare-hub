
-- =============================================
-- Fix 1: Add tenant-scoped SELECT policy on usuarios
-- so company users can see each other's profiles
-- =============================================
-- Keep existing "User select own" policy as-is
-- Add tenant-scoped policy for multi-user companies
CREATE POLICY "Tenant select usuarios"
ON public.usuarios
FOR SELECT
TO authenticated
USING (empresa_id = get_user_empresa_id());

-- =============================================
-- Fix 2: Revoke SELECT on sensitive credential columns
-- so they are only accessible via service_role
-- =============================================

-- spedy_config: api_key
REVOKE SELECT (api_key) ON public.spedy_config FROM anon, authenticated;

-- configuracao_fiscal: nfse_senha, focusnfe_token
REVOKE SELECT (nfse_senha) ON public.configuracao_fiscal FROM anon, authenticated;
REVOKE SELECT (focusnfe_token) ON public.configuracao_fiscal FROM anon, authenticated;

-- marketplace_integracoes: credenciais
REVOKE SELECT (credenciais) ON public.marketplace_integracoes FROM anon, authenticated;
