
-- Remove all previous test orders
DELETE FROM marketplace_pedidos WHERE id::text LIKE '22222222-%' OR id::text LIKE '41111111-%' OR id::text LIKE '42222222-%' OR id::text LIKE '43333333-%' OR id::text LIKE '44444444-%';

-- Remove excess integrations
DELETE FROM marketplace_integracoes WHERE id::text LIKE '11111111-%' OR id::text LIKE '31111111-%' OR id::text LIKE '32222222-%' OR id::text LIKE '33333333-%' OR id::text LIKE '34444444-%';

-- Add 2 integrations + 4 orders
INSERT INTO marketplace_integracoes (id, marketplace, empresa_id, ativo) VALUES
  ('55555555-1111-1111-1111-111111111101', 'mercado_livre', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('55555555-1111-1111-1111-111111111102', 'shopee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO marketplace_pedidos (
  id, integracao_id, pedido_externo_id, numero_pedido, marketplace,
  cliente_nome, cliente_telefone, cliente_email,
  cep, logradouro, numero, bairro, cidade, estado,
  valor_produtos, valor_frete, valor_total,
  status, sub_status, codigo_rastreio, transportadora,
  data_pedido, itens, empresa_id
) VALUES
  ('66666666-0000-0000-0000-000000000001','55555555-1111-1111-1111-111111111101','ML-001','ML-20260001','mercado_livre','Carlos Silva','(11)99999-1111','carlos@email.com','01310-100','Av Paulista','1000','Bela Vista','São Paulo','SP',259.90,19.90,279.80,'para_imprimir','gerando_etiqueta','BR7K9M2X4P','Correios','2026-03-30T10:00:00Z','[{"nome":"Pneu 175/70R13","quantidade":2,"valor_unitario":129.95}]','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('66666666-0000-0000-0000-000000000002','55555555-1111-1111-1111-111111111102','SH-002','SH-20260002','shopee','Maria Oliveira','(21)98888-2222','maria@email.com','20040-020','Rua da Assembleia','50','Centro','Rio de Janeiro','RJ',149.90,15.00,164.90,'para_imprimir','impresso','BR5T3N8R1Q','Jadlog','2026-03-30T11:00:00Z','[{"nome":"Filtro de Oleo","quantidade":2,"valor_unitario":74.95}]','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('66666666-0000-0000-0000-000000000003','55555555-1111-1111-1111-111111111101','ML-003','ML-20260003','mercado_livre','Joao Santos','(31)97777-3333','joao@email.com','30130-000','Rua dos Caetes','200','Centro','Belo Horizonte','MG',340.00,25.00,365.00,'para_imprimir','erro_impressao',NULL,NULL,'2026-03-30T12:00:00Z','[{"nome":"Kit Embreagem","quantidade":1,"valor_unitario":340.00}]','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('66666666-0000-0000-0000-000000000004','55555555-1111-1111-1111-111111111102','SH-004','SH-20260004','shopee','Ana Costa','(41)96666-4444','ana@email.com','80010-000','Rua XV de Novembro','300','Centro','Curitiba','PR',175.00,17.00,192.00,'enviado','em_transito','BR2W6J4K8M','Correios','2026-03-29T09:00:00Z','[{"nome":"Tensor Correia","quantidade":1,"valor_unitario":175.00}]','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO NOTHING;
