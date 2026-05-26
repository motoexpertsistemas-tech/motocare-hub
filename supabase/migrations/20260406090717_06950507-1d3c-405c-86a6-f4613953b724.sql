
CREATE OR REPLACE FUNCTION public.criar_empresa_cadastro(
  p_nome TEXT,
  p_slug TEXT,
  p_documento TEXT DEFAULT NULL,
  p_telefone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_plano TEXT DEFAULT 'professional',
  p_auth_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id UUID;
  v_usuario_id UUID;
  v_trial_inicio TIMESTAMPTZ;
  v_trial_fim TIMESTAMPTZ;
  v_doc_digits TEXT;
BEGIN
  -- Validate plan
  IF p_plano NOT IN ('starter', 'professional', 'enterprise') THEN
    RAISE EXCEPTION 'Plano inválido: %', p_plano;
  END IF;

  -- Validate slug uniqueness
  IF EXISTS (SELECT 1 FROM public.empresas WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Slug já está em uso: %', p_slug;
  END IF;

  -- Clean documento
  v_doc_digits := regexp_replace(COALESCE(p_documento, ''), '\D', '', 'g');

  -- Generate IDs
  v_empresa_id := gen_random_uuid();
  v_usuario_id := gen_random_uuid();
  v_trial_inicio := now();
  v_trial_fim := now() + interval '10 days';

  -- Create empresa
  INSERT INTO public.empresas (
    id, nome, slug, cnpj, telefone, email,
    plano_ativo, status, trial_expira_em
  ) VALUES (
    v_empresa_id, p_nome, p_slug,
    CASE WHEN length(v_doc_digits) > 11 THEN p_documento ELSE NULL END,
    p_telefone, p_email,
    p_plano, 'trial', v_trial_fim
  );

  -- Create assinatura trial 10 dias
  INSERT INTO public.assinaturas (
    empresa_id, plano, periodicidade, valor, status,
    data_inicio, trial_inicio, trial_fim, proxima_cobranca
  ) VALUES (
    v_empresa_id, p_plano, 'mensal', 0, 'trial',
    v_trial_inicio, v_trial_inicio, v_trial_fim, v_trial_fim
  );

  -- Create usuario
  INSERT INTO public.usuarios (
    id, auth_user_id, empresa_id, nome_completo, email
  ) VALUES (
    v_usuario_id, p_auth_user_id, v_empresa_id, p_nome, p_email
  );

  -- Assign admin role (user_id references usuarios.id)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_usuario_id, 'admin');

  -- Create configuracoes_loja
  INSERT INTO public.configuracoes_loja (
    empresa_id, razao_social, nome_fantasia, cnpj, telefone
  ) VALUES (
    v_empresa_id, p_nome, p_nome,
    COALESCE(p_documento, ''), COALESCE(p_telefone, '')
  );

  RETURN v_empresa_id;
END;
$$;
