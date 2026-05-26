INSERT INTO formas_pagamento (nome, conta_bancaria, disponivel_pagamentos, disponivel_recebimentos) VALUES
('CARTAO SHOPEE', 'BANCO BRASIL', true, true),
('CASHBACK', 'CAIXA', true, true),
('CHEQUE', 'BANCO BRASIL', true, true),
('CORTESIA', 'CAIXA', true, true),
('CREDIARIO', 'CAIXA', true, true),
('CREDITO SHOPEE', 'BANCO BRASIL', true, true),
('DEPOSITO BANCARIO', 'BANCO BRASIL', true, true),
('DEVOLUCAO', 'BANCO BRASIL', true, true),
('GARANTIA', 'CAIXA', true, true),
('LINK PAGAMENTO', 'BANCO BRASIL', true, true),
('PIX SHOPEE', 'BANCO BRASIL', true, true);

NOTIFY pgrst, 'reload schema';