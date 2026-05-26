
-- =============================================
-- BRANCHES (filiais)
-- =============================================
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cnpj text,
  endereco text,
  telefone text,
  tipo text NOT NULL DEFAULT 'filial' CHECK (tipo IN ('matriz', 'filial')),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, cnpj)
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for branches"
  ON public.branches FOR ALL
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id())
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- =============================================
-- BRANCH_USERS (vínculo usuario-filial)
-- =============================================
CREATE TABLE public.branch_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(branch_id, user_id)
);

ALTER TABLE public.branch_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for branch_users"
  ON public.branch_users FOR ALL
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id())
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- =============================================
-- BRANCH_INVENTORY (estoque por filial)
-- =============================================
CREATE TABLE public.branch_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.produtos_catalogo(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  quantidade integer NOT NULL DEFAULT 0,
  estoque_minimo integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(branch_id, product_id)
);

ALTER TABLE public.branch_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for branch_inventory"
  ON public.branch_inventory FOR ALL
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id())
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- =============================================
-- STOCK_MOVEMENTS (movimentações)
-- =============================================
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.produtos_catalogo(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade integer NOT NULL,
  motivo text,
  usuario_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for stock_movements"
  ON public.stock_movements FOR ALL
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id())
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_branches_empresa ON public.branches(empresa_id);
CREATE INDEX idx_branch_inventory_branch ON public.branch_inventory(branch_id);
CREATE INDEX idx_branch_inventory_product ON public.branch_inventory(product_id);
CREATE INDEX idx_stock_movements_branch ON public.stock_movements(branch_id);
CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);

-- =============================================
-- TRIGGER: updated_at on branches
-- =============================================
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branch_inventory_updated_at
  BEFORE UPDATE ON public.branch_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TRIGGER: auto-populate branch_inventory on new branch
-- =============================================
CREATE OR REPLACE FUNCTION public.populate_branch_inventory()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO public.branch_inventory (branch_id, product_id, empresa_id, quantidade, estoque_minimo)
  SELECT NEW.id, p.id, NEW.empresa_id, 0, 0
  FROM public.produtos_catalogo p
  WHERE p.empresa_id = NEW.empresa_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_branch_create
  AFTER INSERT ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_branch_inventory();

-- =============================================
-- HELPER: get branches user can access
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_branches(p_user_id uuid)
  RETURNS SETOF uuid
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
  v_is_admin boolean;
BEGIN
  SELECT empresa_id INTO v_empresa_id
  FROM public.usuarios WHERE auth_user_id = p_user_id LIMIT 1;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = 'admin'
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN QUERY SELECT id FROM public.branches WHERE empresa_id = v_empresa_id;
  ELSE
    RETURN QUERY SELECT branch_id FROM public.branch_users WHERE user_id = p_user_id AND empresa_id = v_empresa_id;
  END IF;
END;
$$;
