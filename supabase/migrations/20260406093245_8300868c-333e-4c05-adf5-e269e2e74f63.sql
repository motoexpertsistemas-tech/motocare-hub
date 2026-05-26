-- Parte 1: Revogar SELECT na coluna senha_hash
REVOKE SELECT (senha_hash) ON public.ecommerce_clientes FROM anon, authenticated;

-- Parte 2: Remover policy permissiva de INSERT em empresas
DROP POLICY IF EXISTS "Tenant insert empresas" ON public.empresas;
