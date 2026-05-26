
-- MULTI-TENANT ISOLATION TEST DATA (complete)

-- 1. Companies
INSERT INTO empresas (id, nome, nome_fantasia, cnpj, telefone, email, plano_ativo, status)
VALUES 
  ('aaaa0000-0000-0000-0000-aaaaaaaaa001', 'Moto Expert LTDA', 'Moto Expert', '11.111.111/0001-11', '(11) 91111-1111', 'contato@motoexpert.com', 'ouro', 'active'),
  ('bbbb0000-0000-0000-0000-bbbbbbbbb002', 'Speed Parts Comércio', 'Speed Parts', '22.222.222/0001-22', '(21) 92222-2222', 'contato@speedparts.com', 'prata', 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. Users
INSERT INTO usuarios (auth_user_id, empresa_id, nome_completo, email)
VALUES
  ('b5c5cd20-de54-4658-8529-84e0d63c60e1', 'aaaa0000-0000-0000-0000-aaaaaaaaa001', 'Admin Moto Expert', 'motoexpertsistemas@gmail.com'),
  ('6d71c996-81ea-4cd0-844f-078971bfb7b9', 'bbbb0000-0000-0000-0000-bbbbbbbbb002', 'Admin Speed Parts', 'wesdrasantos@hotmail.com')
ON CONFLICT (auth_user_id) DO UPDATE SET empresa_id = EXCLUDED.empresa_id, nome_completo = EXCLUDED.nome_completo;

-- 3. Clients A
INSERT INTO clientes (id, empresa_id, nome_completo, telefone, tipo_pessoa, cpf, email)
VALUES
  ('ca000000-0000-0000-0000-cccccccc0001', 'aaaa0000-0000-0000-0000-aaaaaaaaa001', 'João Silva - MOTO_EXPERT', '(11) 99001-0001', 'fisica', '111.111.111-01', 'joao.me@test.com'),
  ('ca000000-0000-0000-0000-cccccccc0002', 'aaaa0000-0000-0000-0000-aaaaaaaaa001', 'Maria Santos - MOTO_EXPERT', '(11) 99001-0002', 'fisica', '111.111.111-02', 'maria.me@test.com'),
  ('ca000000-0000-0000-0000-cccccccc0003', 'aaaa0000-0000-0000-0000-aaaaaaaaa001', 'Pedro Oliveira - MOTO_EXPERT', '(11) 99001-0003', 'fisica', '111.111.111-03', 'pedro.me@test.com')
ON CONFLICT (id) DO NOTHING;

-- 4. Clients B
INSERT INTO clientes (id, empresa_id, nome_completo, telefone, tipo_pessoa, cpf, email)
VALUES
  ('cb000000-0000-0000-0000-dddddddd0001', 'bbbb0000-0000-0000-0000-bbbbbbbbb002', 'Ana Costa - SPEED_PARTS', '(21) 99002-0001', 'fisica', '222.222.222-01', 'ana.sp@test.com'),
  ('cb000000-0000-0000-0000-dddddddd0002', 'bbbb0000-0000-0000-0000-bbbbbbbbb002', 'Carlos Lima - SPEED_PARTS', '(21) 99002-0002', 'fisica', '222.222.222-02', 'carlos.sp@test.com'),
  ('cb000000-0000-0000-0000-dddddddd0003', 'bbbb0000-0000-0000-0000-bbbbbbbbb002', 'Lucia Ferreira - SPEED_PARTS', '(21) 99002-0003', 'fisica', '222.222.222-03', 'lucia.sp@test.com')
ON CONFLICT (id) DO NOTHING;

-- 5. Products A (with codigo_cpl)
INSERT INTO produtos_catalogo (id, empresa_id, nome, codigo_cpl, codigo_fornecedor, preco_custo, estoque_quantidade, categoria, fornecedor)
VALUES
  ('aa000000-0000-0000-0000-eeeeeeee0001', 'aaaa0000-0000-0000-0000-aaaaaaaaa001', 'Pastilha de Freio MOTO_EXPERT', 'ME-001', 'ME-001', 45.00, 100, 'Freios', 'Fornecedor A'),
  ('aa000000-0000-0000-0000-eeeeeeee0002', 'aaaa0000-0000-0000-0000-aaaaaaaaa001', 'Óleo 10W40 MOTO_EXPERT', 'ME-002', 'ME-002', 32.00, 200, 'Lubrificantes', 'Fornecedor B'),
  ('aa000000-0000-0000-0000-eeeeeeee0003', 'aaaa0000-0000-0000-0000-aaaaaaaaa001', 'Pneu 110/80 MOTO_EXPERT', 'ME-003', 'ME-003', 180.00, 50, 'Pneus', 'Fornecedor C')
ON CONFLICT (id) DO NOTHING;

-- 6. Products B
INSERT INTO produtos_catalogo (id, empresa_id, nome, codigo_cpl, codigo_fornecedor, preco_custo, estoque_quantidade, categoria, fornecedor)
VALUES
  ('bb000000-0000-0000-0000-ffffffffff01', 'bbbb0000-0000-0000-0000-bbbbbbbbb002', 'Kit Relação SPEED_PARTS', 'SP-001', 'SP-001', 120.00, 75, 'Transmissão', 'Fornecedor X'),
  ('bb000000-0000-0000-0000-ffffffffff02', 'bbbb0000-0000-0000-0000-bbbbbbbbb002', 'Bateria 12V SPEED_PARTS', 'SP-002', 'SP-002', 95.00, 40, 'Elétrica', 'Fornecedor Y'),
  ('bb000000-0000-0000-0000-ffffffffff03', 'bbbb0000-0000-0000-0000-bbbbbbbbb002', 'Retrovisor SPEED_PARTS', 'SP-003', 'SP-003', 25.00, 150, 'Acessórios', 'Fornecedor Z')
ON CONFLICT (id) DO NOTHING;

-- 7. Orders A (with numero_os)
INSERT INTO ordem_servico (id, empresa_id, numero_os, cliente_nome, cliente_telefone, placa, veiculo_marca, veiculo_modelo, defeito_relatado, status)
VALUES
  ('aa000000-1111-0000-0000-aaaaaaaaa001', 'aaaa0000-0000-0000-0000-aaaaaaaaa001', 'OS-ME-001', 'João Silva', '(11) 99001-0001', 'ABC-1A11', 'Honda', 'CG 160 Fan', 'Freio traseiro com ruído - MOTO_EXPERT', 'em_andamento'),
  ('aa000000-1111-0000-0000-aaaaaaaaa002', 'aaaa0000-0000-0000-0000-aaaaaaaaa001', 'OS-ME-002', 'Maria Santos', '(11) 99001-0002', 'DEF-2B22', 'Yamaha', 'Factor 150', 'Troca de óleo e filtro - MOTO_EXPERT', 'aguardando')
ON CONFLICT (id) DO NOTHING;

-- 8. Orders B
INSERT INTO ordem_servico (id, empresa_id, numero_os, cliente_nome, cliente_telefone, placa, veiculo_marca, veiculo_modelo, defeito_relatado, status)
VALUES
  ('bb000000-1111-0000-0000-bbbbbbbbb001', 'bbbb0000-0000-0000-0000-bbbbbbbbb002', 'OS-SP-001', 'Ana Costa', '(21) 99002-0001', 'GHI-3C33', 'Suzuki', 'Intruder 125', 'Troca de kit relação - SPEED_PARTS', 'em_andamento'),
  ('bb000000-1111-0000-0000-bbbbbbbbb002', 'bbbb0000-0000-0000-0000-bbbbbbbbb002', 'OS-SP-002', 'Carlos Lima', '(21) 99002-0002', 'JKL-4D44', 'Honda', 'Biz 125', 'Bateria descarregando - SPEED_PARTS', 'finalizada')
ON CONFLICT (id) DO NOTHING;
