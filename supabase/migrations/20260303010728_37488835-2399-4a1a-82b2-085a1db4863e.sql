-- Drop the broken trigger that references non-existent column atualizado_em
DROP TRIGGER IF EXISTS update_ordem_servico_updated_at ON public.ordem_servico;

-- Create a correct trigger that uses the actual column name updated_at
CREATE OR REPLACE FUNCTION public.update_ordem_servico_updated_at_fn()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ordem_servico_updated_at
BEFORE UPDATE ON public.ordem_servico
FOR EACH ROW
EXECUTE FUNCTION public.update_ordem_servico_updated_at_fn();