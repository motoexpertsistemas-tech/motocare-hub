
-- Adicionar coluna slug à tabela empresas
ALTER TABLE public.empresas ADD COLUMN slug TEXT UNIQUE;

-- Criar índice para busca rápida por slug
CREATE UNIQUE INDEX idx_empresas_slug ON public.empresas(slug);

-- Função para gerar slug a partir do nome
CREATE OR REPLACE FUNCTION public.gerar_slug_empresa()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Gerar slug do nome: lowercase, remover acentos, trocar espaços por hifens
    base_slug := lower(
      translate(
        NEW.nome,
        'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç ',
        'AAAAAaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc-'
      )
    );
    -- Remover caracteres especiais
    base_slug := regexp_replace(base_slug, '[^a-z0-9-]', '', 'g');
    -- Remover hifens duplos
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    -- Remover hifens no início e fim
    base_slug := trim(both '-' from base_slug);
    
    final_slug := base_slug;
    
    -- Verificar unicidade
    WHILE EXISTS (SELECT 1 FROM public.empresas WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para auto-gerar slug
CREATE TRIGGER trigger_gerar_slug_empresa
BEFORE INSERT OR UPDATE ON public.empresas
FOR EACH ROW EXECUTE FUNCTION public.gerar_slug_empresa();

-- Gerar slugs para empresas existentes
UPDATE public.empresas SET slug = NULL WHERE slug IS NULL;
