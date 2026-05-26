
-- 1. Create template table for default plano_contas entries
CREATE TABLE public.plano_contas_template (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classificacao text NOT NULL,
  nome text NOT NULL,
  tipo_movimentacao text NOT NULL DEFAULT 'Pagamentos',
  nivel integer NOT NULL DEFAULT 1,
  grupo_dre text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plano_contas_template ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on plano_contas_template" ON public.plano_contas_template FOR ALL USING (true) WITH CHECK (true);

-- 2. Copy current plano_contas entries into template
INSERT INTO public.plano_contas_template (classificacao, nome, tipo_movimentacao, nivel, grupo_dre)
SELECT classificacao, nome, tipo_movimentacao, nivel, grupo_dre
FROM public.plano_contas
WHERE ativo = true;

-- 3. Add empresa_id column to plano_contas
ALTER TABLE public.plano_contas ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;

-- 4. Create function to copy template plano_contas for new empresa
CREATE OR REPLACE FUNCTION public.copiar_plano_contas_para_empresa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.plano_contas (classificacao, nome, tipo_movimentacao, nivel, grupo_dre, empresa_id)
  SELECT classificacao, nome, tipo_movimentacao, nivel, grupo_dre, NEW.id
  FROM public.plano_contas_template;
  RETURN NEW;
END;
$$;

-- 5. Create trigger on empresas table
CREATE TRIGGER trigger_copiar_plano_contas
AFTER INSERT ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.copiar_plano_contas_para_empresa();

-- 6. Add brinde entry for plano de contas
INSERT INTO public.produtos_brindes (nome, tipo_brinde, descricao, quantidade, planos_aplicaveis, ativo)
VALUES ('Plano de Contas Completo', 'plano_contas', 'Plano de contas pré-configurado com classificações DRE para gestão financeira', 1, ARRAY['bronze', 'prata', 'ouro', 'platina'], true);
