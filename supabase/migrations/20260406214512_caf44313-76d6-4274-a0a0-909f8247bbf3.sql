
-- Create catalogo_master table
CREATE TABLE public.catalogo_master (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE,
  marca TEXT,
  categoria TEXT,
  preco_custo NUMERIC(12,2) DEFAULT 0,
  unidade TEXT DEFAULT 'UN',
  descricao TEXT,
  imagem_url TEXT,
  codigo_barras TEXT,
  fornecedor TEXT,
  aplicacoes TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalogo_master_marca ON public.catalogo_master (marca);
CREATE INDEX idx_catalogo_master_categoria ON public.catalogo_master (categoria);
CREATE INDEX idx_catalogo_master_fornecedor ON public.catalogo_master (fornecedor);

ALTER TABLE public.catalogo_master ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Authenticated users can read catalogo_master"
  ON public.catalogo_master FOR SELECT
  TO authenticated
  USING (true);

-- Service role (edge functions) can insert/update/delete
CREATE POLICY "Service role full access catalogo_master"
  ON public.catalogo_master FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RPC to import from catalogo_master into user's produtos_catalogo
CREATE OR REPLACE FUNCTION public.importar_catalogo_master(
  p_empresa_id UUID,
  p_branch_id UUID DEFAULT NULL,
  p_marca TEXT DEFAULT NULL,
  p_categoria TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_imported INTEGER := 0;
  v_skipped INTEGER := 0;
  v_total INTEGER := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT * FROM public.catalogo_master cm
    WHERE (p_marca IS NULL OR cm.marca = p_marca)
      AND (p_categoria IS NULL OR cm.categoria = p_categoria)
  LOOP
    v_total := v_total + 1;
    
    -- Skip if product with same codigo already exists for this empresa
    IF rec.codigo IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.produtos_catalogo pc
      WHERE pc.empresa_id = p_empresa_id
        AND pc.codigo_cpl = rec.codigo
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    INSERT INTO public.produtos_catalogo (
      empresa_id, branch_id, nome, codigo_cpl, marca, categoria,
      preco_custo, unidade, descricao, imagem_url, codigo_barras,
      fornecedor, aplicacoes
    ) VALUES (
      p_empresa_id, p_branch_id, rec.nome, rec.codigo, rec.marca, rec.categoria,
      rec.preco_custo, rec.unidade, rec.descricao, rec.imagem_url, rec.codigo_barras,
      rec.fornecedor, rec.aplicacoes
    );
    
    v_imported := v_imported + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'imported', v_imported,
    'skipped', v_skipped,
    'total', v_total
  );
END;
$$;
