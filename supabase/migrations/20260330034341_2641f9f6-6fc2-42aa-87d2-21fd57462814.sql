-- Insert test data for multi-tenant isolation testing

-- Test Companies
INSERT INTO empresas (id, nome, slug, plano_ativo) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Moto Expert', 'moto-expert', 'platina'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Speed Parts', 'speed-parts', 'platina')
ON CONFLICT (id) DO NOTHING;

-- Test Clients for Moto Expert (Empresa A)
INSERT INTO clientes (id, empresa_id, nome_completo, telefone, tipo_pessoa, email) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'João Silva (Moto Expert)', '11999990001', 'fisica', 'joao@motoexpert.com'),
  ('a2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Maria Santos (Moto Expert)', '11999990002', 'fisica', 'maria@motoexpert.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pedro Lima (Moto Expert)', '11999990003', 'fisica', 'pedro@motoexpert.com')
ON CONFLICT (id) DO NOTHING;

-- Test Clients for Speed Parts (Empresa B)
INSERT INTO clientes (id, empresa_id, nome_completo, telefone, tipo_pessoa, email) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Carlos Oliveira (Speed Parts)', '21999990001', 'fisica', 'carlos@speedparts.com'),
  ('b2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Ana Costa (Speed Parts)', '21999990002', 'fisica', 'ana@speedparts.com'),
  ('b3333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Roberto Souza (Speed Parts)', '21999990003', 'fisica', 'roberto@speedparts.com')
ON CONFLICT (id) DO NOTHING;

-- Test Products for Moto Expert (Empresa A)
INSERT INTO produtos_catalogo (id, empresa_id, nome, codigo_cpl, categoria, preco_custo, estoque_quantidade) VALUES
  ('a4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pneu Pirelli 110/80 ME', 'ME-PN-001', 'PNEU', 185.00, 25),
  ('a5555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kit Relação CG 160 ME', 'ME-KR-002', 'TRANSMISSÃO', 92.50, 40),
  ('a6666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Amortecedor Traseiro Pro ME', 'ME-AM-003', 'SUSPENSÃO', 320.00, 10)
ON CONFLICT (id) DO NOTHING;

-- Test Products for Speed Parts (Empresa B)
INSERT INTO produtos_catalogo (id, empresa_id, nome, codigo_cpl, categoria, preco_custo, estoque_quantidade) VALUES
  ('b4444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Pastilha Freio SP Racing', 'SP-PF-001', 'FREIO', 45.00, 100),
  ('b5555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Corrente DID 520 SP', 'SP-CR-002', 'TRANSMISSÃO', 210.00, 30),
  ('b6666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Guidão Oxxy SP Edition', 'SP-GD-003', 'CHASSI', 175.00, 15)
ON CONFLICT (id) DO NOTHING;

-- Test Orders for Moto Expert (Empresa A)
INSERT INTO ordem_servico (id, empresa_id, numero_os, cliente_nome, cliente_telefone, status, defeito_relatado) VALUES
  ('a7777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ME-OS-0001', 'João Silva', '11999990001', 'aberta', 'Troca de pneu dianteiro - Moto Expert'),
  ('a8888888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ME-OS-0002', 'Maria Santos', '11999990002', 'em_andamento', 'Revisão completa - Moto Expert')
ON CONFLICT (id) DO NOTHING;

-- Test Orders for Speed Parts (Empresa B)
INSERT INTO ordem_servico (id, empresa_id, numero_os, cliente_nome, cliente_telefone, status, defeito_relatado) VALUES
  ('b7777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'SP-OS-0001', 'Carlos Oliveira', '21999990001', 'aberta', 'Troca pastilha de freio - Speed Parts'),
  ('b8888888-8888-8888-8888-888888888888', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'SP-OS-0002', 'Ana Costa', '21999990002', 'em_andamento', 'Instalação kit relação - Speed Parts')
ON CONFLICT (id) DO NOTHING;