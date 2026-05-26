
-- Drop the existing trigger
DROP TRIGGER IF EXISTS update_servicos_updated_at ON public.servicos;

-- Create a specific function for servicos
CREATE OR REPLACE FUNCTION public.update_servicos_updated_at_fn()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recreate trigger with the correct function
CREATE TRIGGER update_servicos_updated_at
BEFORE UPDATE ON public.servicos
FOR EACH ROW
EXECUTE FUNCTION public.update_servicos_updated_at_fn();
