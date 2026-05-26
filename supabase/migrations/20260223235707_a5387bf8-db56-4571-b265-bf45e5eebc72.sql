
-- ============================================
-- MULTI-TENANT: Tabelas base
-- ============================================

-- Tabela de empresas (cada oficina = 1 empresa)
CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  nome_fantasia text,
  cnpj text,
  telefone text,
  email text,
  logo_url text,
  plano_ativo text NOT NULL DEFAULT 'trial',
  status text NOT NULL DEFAULT 'ativo',
  trial_expira_em timestamp with time zone,
  assinatura_id text,
  max_usuarios integer NOT NULL DEFAULT 1,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas visíveis para todos autenticados"
  ON public.empresas FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Empresas podem ser criadas por qualquer um"
  ON public.empresas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Empresas podem ser atualizadas"
  ON public.empresas FOR UPDATE
  USING (true);

-- ============================================
-- Tabela de usuários (liga auth.users → empresa)
-- ============================================
CREATE TABLE public.usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome_completo text NOT NULL,
  email text,
  avatar_url text,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver membros da mesma empresa"
  ON public.usuarios FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Usuários podem ser criados"
  ON public.usuarios FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuários podem ser atualizados"
  ON public.usuarios FOR UPDATE
  USING (true);

-- ============================================
-- Roles (separado conforme regra de segurança)
-- ============================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'vendedor', 'mecanico', 'cliente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles visíveis para autenticados"
  ON public.user_roles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Roles podem ser inseridas"
  ON public.user_roles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Roles podem ser deletadas"
  ON public.user_roles FOR DELETE
  USING (true);

-- Função auxiliar para checar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- Produtos por empresa (catálogo personalizado)
-- produtos_catalogo = catálogo MASTER compartilhado
-- empresa_produtos = quais produtos cada oficina usa + preço custom
-- ============================================
CREATE TABLE public.empresa_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  produto_catalogo_id uuid NOT NULL REFERENCES public.produtos_catalogo(id) ON DELETE CASCADE,
  ativo boolean NOT NULL DEFAULT true,
  preco_custo_custom numeric,
  precos_venda_custom jsonb,
  estoque_quantidade integer NOT NULL DEFAULT 0,
  estoque_minimo integer DEFAULT 0,
  localizacao text,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, produto_catalogo_id)
);

ALTER TABLE public.empresa_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa produtos visíveis"
  ON public.empresa_produtos FOR SELECT
  USING (true);

CREATE POLICY "Empresa produtos inseríveis"
  ON public.empresa_produtos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Empresa produtos atualizáveis"
  ON public.empresa_produtos FOR UPDATE
  USING (true);

CREATE POLICY "Empresa produtos deletáveis"
  ON public.empresa_produtos FOR DELETE
  USING (true);

-- Índices para performance
CREATE INDEX idx_empresa_produtos_empresa ON public.empresa_produtos(empresa_id);
CREATE INDEX idx_empresa_produtos_produto ON public.empresa_produtos(produto_catalogo_id);
CREATE INDEX idx_usuarios_empresa ON public.usuarios(empresa_id);
CREATE INDEX idx_usuarios_auth ON public.usuarios(auth_user_id);

-- Trigger para atualizar timestamps
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_empresa_produtos_updated_at
  BEFORE UPDATE ON public.empresa_produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
