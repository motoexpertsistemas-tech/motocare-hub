
-- Drop old check constraint and add updated one with new pipeline statuses
ALTER TABLE marketplace_pedidos DROP CONSTRAINT marketplace_pedidos_status_check;

ALTER TABLE marketplace_pedidos ADD CONSTRAINT marketplace_pedidos_status_check
  CHECK (status = ANY (ARRAY[
    'aguardando_confirmacao', 'confirmado', 'em_preparacao', 'enviado', 'entregue', 'cancelado', 'devolvido',
    'para_emitir', 'para_enviar', 'para_imprimir'
  ]));

-- Insert test integration
INSERT INTO marketplace_integracoes (id, marketplace, credenciais, ativo)
VALUES ('a0000000-0000-0000-0000-000000000001', 'shopee', '{"loja": "Loja Teste Shopee", "seller_id": "TESTE123"}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- Insert test orders in "para_emitir" stage
INSERT INTO marketplace_pedidos (integracao_id, pedido_externo_id, numero_pedido, marketplace, status, sub_status, cliente_nome, cliente_cpf_cnpj, cliente_telefone, cliente_email, cep, logradouro, numero, bairro, cidade, estado, valor_produtos, valor_frete, valor_total, taxa_marketplace, percentual_comissao, itens, data_pedido)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'EXT-001', 'PED-001', 'shopee', 'para_emitir', 'aguardando', 'João Silva', '123.456.789-00', '(11) 99999-0001', 'joao@teste.com', '01001-000', 'Rua Teste', '100', 'Centro', 'São Paulo', 'SP', 350.00, 25.00, 375.00, 15.00, 12.0, '[{"nome":"Pneu 175/70 R13","quantidade":2,"preco_unitario":175.00}]'::jsonb, now() - interval '2 hours'),
  ('a0000000-0000-0000-0000-000000000001', 'EXT-002', 'PED-002', 'shopee', 'para_emitir', 'validando_dados', 'Maria Santos', '987.654.321-00', '(11) 99999-0002', 'maria@teste.com', '02002-000', 'Av. Brasil', '200', 'Jardins', 'São Paulo', 'SP', 520.00, 30.00, 550.00, 22.00, 12.0, '[{"nome":"Bateria 60Ah","quantidade":1,"preco_unitario":520.00}]'::jsonb, now() - interval '1 hour'),
  ('a0000000-0000-0000-0000-000000000001', 'EXT-003', 'PED-003', 'shopee', 'para_emitir', 'erro_emissao', 'Carlos Oliveira', '111.222.333-44', '(11) 99999-0003', 'carlos@teste.com', '03003-000', 'Rua Augusta', '300', 'Consolação', 'São Paulo', 'SP', 890.00, 0.00, 890.00, 35.60, 12.0, '[{"nome":"Kit Embreagem","quantidade":1,"preco_unitario":890.00}]'::jsonb, now() - interval '3 hours');
