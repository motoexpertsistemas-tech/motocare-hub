-- Add test marketplace integrations for active tenant companies
INSERT INTO public.marketplace_integracoes (id, marketplace, empresa_id, ativo)
VALUES
  ('31111111-1111-1111-1111-111111111101', 'mercado_livre', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('31111111-1111-1111-1111-111111111102', 'shopee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('32222222-2222-2222-2222-222222222201', 'mercado_livre', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true),
  ('32222222-2222-2222-2222-222222222202', 'amazon', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true),
  ('33333333-3333-3333-3333-333333333301', 'mercado_livre', 'aaaa0000-0000-0000-0000-aaaaaaaaa001', true),
  ('34444444-4444-4444-4444-444444444401', 'shopee', 'bbbb0000-0000-0000-0000-bbbbbbbbb002', true)
ON CONFLICT (id) DO NOTHING;

-- Add test orders in multiple tenant companies so they appear in the Orders tab
INSERT INTO public.marketplace_pedidos (
  id, integracao_id, pedido_externo_id, numero_pedido, marketplace,
  cliente_nome, cliente_telefone, cliente_email,
  cep, logradouro, numero, bairro, cidade, estado,
  valor_produtos, valor_frete, valor_total,
  status, sub_status, codigo_rastreio, transportadora,
  data_pedido, itens, empresa_id
)
VALUES
  ('41111111-0000-0000-0000-000000000001','31111111-1111-1111-1111-111111111101','ML-A-001','ML-A-20260001','mercado_livre','Cliente Teste A1','(11)99999-1111','a1@teste.com','01310-100','Av Paulista','1000','Bela Vista','São Paulo','SP',199.90,19.90,219.80,'para_imprimir','gerando_etiqueta','BRAA001','Correios','2026-03-30T11:00:00Z','[{"nome":"Pneu Teste","quantidade":1,"valor_unitario":199.90}]','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('41111111-0000-0000-0000-000000000002','31111111-1111-1111-1111-111111111102','SH-A-002','SH-A-20260002','shopee','Cliente Teste A2','(11)99999-2222','a2@teste.com','01310-100','Av Paulista','1001','Bela Vista','São Paulo','SP',149.90,15.00,164.90,'para_imprimir','impresso','BRAA002','Jadlog','2026-03-30T12:00:00Z','[{"nome":"Filtro Teste","quantidade":2,"valor_unitario":74.95}]','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('41111111-0000-0000-0000-000000000003','31111111-1111-1111-1111-111111111101','ML-A-003','ML-A-20260003','mercado_livre','Cliente Teste A3','(11)99999-3333','a3@teste.com','01310-100','Av Paulista','1002','Bela Vista','São Paulo','SP',299.90,29.90,329.80,'para_imprimir','erro_impressao',NULL,NULL,'2026-03-30T13:00:00Z','[{"nome":"Kit Teste","quantidade":1,"valor_unitario":299.90}]','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

  ('42222222-0000-0000-0000-000000000001','32222222-2222-2222-2222-222222222201','ML-B-001','ML-B-20260001','mercado_livre','Cliente Teste B1','(21)98888-1111','b1@teste.com','20040-020','Rua da Assembleia','50','Centro','Rio de Janeiro','RJ',129.90,12.00,141.90,'pendente','aguardando',NULL,NULL,'2026-03-30T10:00:00Z','[{"nome":"Produto B1","quantidade":1,"valor_unitario":129.90}]','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('42222222-0000-0000-0000-000000000002','32222222-2222-2222-2222-222222222202','AZ-B-002','AZ-B-20260002','amazon','Cliente Teste B2','(21)98888-2222','b2@teste.com','20040-020','Rua da Assembleia','51','Centro','Rio de Janeiro','RJ',220.00,20.00,240.00,'para_enviar','para_programar',NULL,NULL,'2026-03-30T09:00:00Z','[{"nome":"Produto B2","quantidade":2,"valor_unitario":110.00}]','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

  ('43333333-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333301','ML-C-001','ML-C-20260001','mercado_livre','Cliente Teste C1','(31)97777-1111','c1@teste.com','30130-000','Rua dos Caetes','200','Centro','Belo Horizonte','MG',89.90,9.90,99.80,'nao_pago','aguardando',NULL,NULL,'2026-03-30T08:00:00Z','[{"nome":"Produto C1","quantidade":1,"valor_unitario":89.90}]','aaaa0000-0000-0000-0000-aaaaaaaaa001'),

  ('44444444-0000-0000-0000-000000000001','34444444-4444-4444-4444-444444444401','SH-D-001','SH-D-20260001','shopee','Cliente Teste D1','(41)96666-1111','d1@teste.com','80010-000','Rua XV de Novembro','300','Centro','Curitiba','PR',175.00,17.00,192.00,'para_emitir','aguardando',NULL,NULL,'2026-03-30T07:00:00Z','[{"nome":"Produto D1","quantidade":1,"valor_unitario":175.00}]','bbbb0000-0000-0000-0000-bbbbbbbbb002')
ON CONFLICT (id) DO NOTHING;