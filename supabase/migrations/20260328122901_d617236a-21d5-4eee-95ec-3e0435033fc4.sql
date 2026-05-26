
-- Add sub_status and erro_detalhe columns to marketplace_pedidos
ALTER TABLE public.marketplace_pedidos 
  ADD COLUMN IF NOT EXISTS sub_status text DEFAULT 'aguardando',
  ADD COLUMN IF NOT EXISTS erro_detalhe text;
