-- Drop the old constraint that doesn't consider empresa_id
ALTER TABLE public.plano_contas DROP CONSTRAINT plano_contas_classificacao_key;

-- Create a new unique constraint scoped per empresa
ALTER TABLE public.plano_contas ADD CONSTRAINT plano_contas_classificacao_empresa_key UNIQUE (classificacao, empresa_id);