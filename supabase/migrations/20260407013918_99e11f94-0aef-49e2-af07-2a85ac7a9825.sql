
CREATE TABLE public.ecommerce_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id)
);

ALTER TABLE public.ecommerce_config ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own config
CREATE POLICY "Users can read own config"
  ON public.ecommerce_config FOR SELECT
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

-- Authenticated users can insert/update their own config
CREATE POLICY "Users can upsert own config"
  ON public.ecommerce_config FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Users can update own config"
  ON public.ecommerce_config FOR UPDATE
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

-- Public read for storefront visitors
CREATE POLICY "Public can read any config"
  ON public.ecommerce_config FOR SELECT
  TO anon
  USING (true);
