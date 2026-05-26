-- 1. Fix vitrine view: make it inherit caller's RLS from produtos_catalogo
ALTER VIEW public.produtos_catalogo_vitrine SET (security_invoker = true);

-- 2. Revoke client-side access to fiscal API credentials
REVOKE SELECT (focusnfe_token, nfse_senha, nfse_login) ON public.configuracao_fiscal FROM authenticated;
REVOKE SELECT (focusnfe_token, nfse_senha, nfse_login) ON public.configuracao_fiscal FROM anon;