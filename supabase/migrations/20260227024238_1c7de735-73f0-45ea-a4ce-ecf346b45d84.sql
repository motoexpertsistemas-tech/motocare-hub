
-- 1. Add customization columns to empresas
ALTER TABLE public.empresas 
  ADD COLUMN IF NOT EXISTS cor_primaria text DEFAULT '#FF6600',
  ADD COLUMN IF NOT EXISTS cor_secundaria text DEFAULT '#1a1a2e';

-- 2. Create produtos_brindes table (master gift catalog)
CREATE TABLE public.produtos_brindes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  tipo_brinde text NOT NULL DEFAULT 'produto',
  quantidade integer NOT NULL DEFAULT 1,
  planos_aplicaveis text[] DEFAULT ARRAY['starter','professional','enterprise'],
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos_brindes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on produtos_brindes" ON public.produtos_brindes
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Create empresas_brindes table (gifts granted to each company)
CREATE TABLE public.empresas_brindes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  brinde_id uuid NOT NULL REFERENCES public.produtos_brindes(id) ON DELETE CASCADE,
  nome_brinde text NOT NULL,
  tipo_brinde text NOT NULL DEFAULT 'produto',
  quantidade_concedida integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'aplicado',
  aplicado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas_brindes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on empresas_brindes" ON public.empresas_brindes
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Create function to auto-apply brindes when empresa is created
CREATE OR REPLACE FUNCTION public.aplicar_brindes_empresa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.empresas_brindes (empresa_id, brinde_id, nome_brinde, tipo_brinde, quantidade_concedida)
  SELECT 
    NEW.id,
    pb.id,
    pb.nome,
    pb.tipo_brinde,
    pb.quantidade
  FROM public.produtos_brindes pb
  WHERE pb.ativo = true
  AND NEW.plano_ativo = ANY(pb.planos_aplicaveis);
  
  RETURN NEW;
END;
$$;

-- 5. Create trigger
CREATE TRIGGER trigger_aplicar_brindes
  AFTER INSERT ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.aplicar_brindes_empresa();

-- 6. Create function to generate unique subdomain
CREATE OR REPLACE FUNCTION public.gerar_subdominio_unico(nome_base text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  base_slug := lower(
    translate(
      nome_base,
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç ',
      'AAAAAaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc-'
    )
  );
  base_slug := regexp_replace(base_slug, '[^a-z0-9-]', '', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.empresas WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- 7. Insert default brindes
INSERT INTO public.produtos_brindes (nome, descricao, tipo_brinde, quantidade, planos_aplicaveis) VALUES
  ('Catálogo de Peças', 'Acesso ao catálogo com 28.000+ peças pré-cadastradas', 'catalogo', 1, ARRAY['starter','professional','enterprise']),
  ('Templates de OS', '5 modelos prontos de Ordem de Serviço', 'template', 5, ARRAY['starter','professional','enterprise']),
  ('Treinamento Online', 'Acesso a vídeos de treinamento do sistema', 'treinamento', 1, ARRAY['professional','enterprise']),
  ('Suporte Priority', '30 dias de suporte prioritário via WhatsApp', 'suporte', 30, ARRAY['professional','enterprise']),
  ('Consultoria Setup', '1 hora de consultoria para configuração inicial', 'consultoria', 1, ARRAY['enterprise']);
