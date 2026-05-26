
-- Step 1: Expand the status check constraint
ALTER TABLE marketplace_pedidos DROP CONSTRAINT marketplace_pedidos_status_check;
ALTER TABLE marketplace_pedidos ADD CONSTRAINT marketplace_pedidos_status_check 
  CHECK (status = ANY (ARRAY[
    'aguardando_confirmacao','confirmado','em_preparacao',
    'enviado','entregue','cancelado','devolvido',
    'para_emitir','para_enviar','para_imprimir',
    'nao_pago','pendente','pago','para_reservar'
  ]));
