
CREATE OR REPLACE FUNCTION public.criar_cliente_ecommerce(p_loja_id uuid, p_nome text, p_email text, p_telefone text DEFAULT NULL, p_cpf text DEFAULT NULL, p_senha text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.ecommerce_clientes (loja_id, nome, email, telefone, cpf, senha_hash)
  VALUES (p_loja_id, p_nome, p_email, p_telefone, p_cpf, extensions.crypt(p_senha, extensions.gen_salt('bf')))
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.verificar_senha_ecommerce(p_email text, p_senha text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.ecommerce_clientes
    WHERE email = p_email
      AND ativo = true
      AND senha_hash = extensions.crypt(p_senha, senha_hash)
  );
END;
$$;
