-- Adicionar coluna de placas de veículos ao cadastro de clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS placas text[] DEFAULT '{}';

-- Criar índice GIN para buscas rápidas por placa
CREATE INDEX IF NOT EXISTS idx_clientes_placas ON public.clientes USING GIN(placas);
