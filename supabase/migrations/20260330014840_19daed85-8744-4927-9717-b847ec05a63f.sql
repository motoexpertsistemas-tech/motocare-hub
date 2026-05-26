
-- 1. Create a secure login RPC that returns client data without exposing senha_hash
CREATE OR REPLACE FUNCTION public.login_ecommerce(p_email text, p_senha text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cliente_record RECORD;
BEGIN
  SELECT id, nome, email, telefone, cpf, loja_id, cliente_id
  INTO cliente_record
  FROM public.ecommerce_clientes
  WHERE email = lower(trim(p_email))
    AND ativo = true
    AND senha_hash = extensions.crypt(p_senha, senha_hash);

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Update ultimo_login
  UPDATE public.ecommerce_clientes
  SET ultimo_login = now()
  WHERE id = cliente_record.id;

  RETURN jsonb_build_object(
    'id', cliente_record.id,
    'nome', cliente_record.nome,
    'email', cliente_record.email,
    'telefone', cliente_record.telefone,
    'cpf', cliente_record.cpf,
    'loja_id', cliente_record.loja_id,
    'cliente_id', cliente_record.cliente_id
  );
END;
$$;

-- 2. Fix clientes table: restrict to authenticated users only
DROP POLICY IF EXISTS "Allow all select on clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow all insert on clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow all update on clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow all delete on clientes" ON public.clientes;

CREATE POLICY "Authenticated select on clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert on clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update on clientes" ON public.clientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete on clientes" ON public.clientes FOR DELETE TO authenticated USING (true);

-- 3. Fix ecommerce_clientes table: deny public access (RPCs with SECURITY DEFINER still work)
DROP POLICY IF EXISTS "Allow all on ecommerce_clientes" ON public.ecommerce_clientes;

CREATE POLICY "Authenticated select on ecommerce_clientes" ON public.ecommerce_clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert on ecommerce_clientes" ON public.ecommerce_clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update on ecommerce_clientes" ON public.ecommerce_clientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete on ecommerce_clientes" ON public.ecommerce_clientes FOR DELETE TO authenticated USING (true);

-- 4. Fix afiliados_comissoes_recorrentes: restrict to authenticated
DROP POLICY IF EXISTS "Allow all on afiliados_comissoes_recorrentes" ON public.afiliados_comissoes_recorrentes;

CREATE POLICY "Authenticated access on afiliados_comissoes_recorrentes" ON public.afiliados_comissoes_recorrentes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Fix metricas_mensais: restrict to authenticated
DROP POLICY IF EXISTS "Allow all on metricas_mensais" ON public.metricas_mensais;

CREATE POLICY "Authenticated access on metricas_mensais" ON public.metricas_mensais FOR ALL TO authenticated USING (true) WITH CHECK (true);
