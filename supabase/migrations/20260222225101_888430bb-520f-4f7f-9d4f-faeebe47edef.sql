
-- Criar tabela plano_contas
CREATE TABLE public.plano_contas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classificacao TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo_movimentacao TEXT NOT NULL DEFAULT 'Pagamentos',
  grupo_dre TEXT DEFAULT '------',
  nivel INTEGER NOT NULL DEFAULT 3,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on plano_contas" ON public.plano_contas FOR ALL USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER update_plano_contas_updated_at
  BEFORE UPDATE ON public.plano_contas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados baseados no DRE
INSERT INTO public.plano_contas (classificacao, nome, tipo_movimentacao, grupo_dre, nivel) VALUES
-- 1 - RECEITA BRUTA DE VENDA
('1', 'RECEITA BRUTA DE VENDA', 'Recebimentos', '------', 1),
('1.1', 'VENDA BALCÃO', 'Recebimentos', 'Receita Bruta de Venda', 3),
('1.2', 'VENDA ORDEM DE SERVIÇO', 'Recebimentos', 'Receita Bruta de Venda', 3),
('1.3', 'VENDA ATACADO', 'Recebimentos', 'Receita Bruta de Venda', 3),
('1.4', 'VENDA E-COMMERCE', 'Recebimentos', 'Receita Bruta de Venda', 3),
('1.5', 'VENDA MARKETPLACES', 'Recebimentos', 'Receita Bruta de Venda', 3),

-- CMV
('CMV', 'CMV - CUSTO MERCADORIA VENDIDA', 'Pagamentos', '------', 1),
('CMV.1', 'CUSTO MERCADORIA', 'Pagamentos', 'CMV', 3),

-- 2 - RECEITA SERVIÇOS TERCEIRIZADOS
('2', 'RECEITA SERVIÇOS TERCEIRIZADOS', 'Recebimentos', '------', 1),
('2.1', 'SERVIÇOS TERCEIRIZADOS', 'Recebimentos', 'Receita Serviços Terceirizados', 3),

-- 3 - OUTRAS RECEITAS OPERACIONAIS
('3', 'OUTRAS RECEITAS OPERACIONAIS', 'Recebimentos', '------', 1),
('3.01', 'OUTRAS RECEITAS', 'Recebimentos', 'Outras Receitas Operacionais', 3),
('3.02', 'RECEITA DE SERVIÇO TERCEIRIZADOS', 'Recebimentos', 'Outras Receitas Operacionais', 3),
('3.03', 'ACRÉSCIMOS', 'Recebimentos', 'Outras Receitas Operacionais', 3),

-- 4 - CUSTOS VARIÁVEIS
('4', 'CUSTOS VARIÁVEIS', 'Pagamentos', '------', 1),

-- 4.1 Impostos
('4.1', 'IMPOSTOS', 'Pagamentos', '------', 2),
('4.1.1', 'ICMS S/ VENDAS', 'Pagamentos', 'Impostos', 3),
('4.1.2', 'IPI S/ VENDAS', 'Pagamentos', 'Impostos', 3),
('4.1.3', 'PIS S/ VENDAS', 'Pagamentos', 'Impostos', 3),
('4.1.4', 'COFINS S/ VENDAS', 'Pagamentos', 'Impostos', 3),
('4.1.5', 'TTP ANIMAL - ADAB', 'Pagamentos', 'Impostos', 3),
('4.1.6', 'ENCARGOS FOLHA - FGTS / RECEITA ARRECADAÇÃO', 'Pagamentos', 'Impostos', 3),
('4.1.7', 'IRPJ', 'Pagamentos', 'Impostos', 3),

-- 4.2 Custos Financeiros
('4.2', 'CUSTOS FINANCEIROS', 'Pagamentos', '------', 2),
('4.2.1', 'TAXA DE BOLETO', 'Pagamentos', 'Custos Financeiros', 3),
('4.2.2', 'TAXA CARTÃO', 'Pagamentos', 'Custos Financeiros', 3),

-- 4.3 Custo com Transporte
('4.3', 'CUSTO COM TRANSPORTE', 'Pagamentos', '------', 2),
('4.3.1', 'FRETES E CARRETOS OUTROS SERVIÇO', 'Pagamentos', 'Custo com Transporte', 3),
('4.3.2', 'DESPESA C/ COMBUSTÍVEIS VEÍCULOS', 'Pagamentos', 'Custo com Transporte', 3),
('4.3.3', 'DESPESA C/ COMBUSTÍVEIS GERADOR', 'Pagamentos', 'Custo com Transporte', 3),
('4.3.4', 'DESPESAS C/ LUBRIFICANTES', 'Pagamentos', 'Custo com Transporte', 3),
('4.3.5', 'DESPESA C/ SERVIÇOS DE MANUTENÇÃO E CONSERVAÇÃO DE VEÍCULOS', 'Pagamentos', 'Custo com Transporte', 3),
('4.3.6', 'DESPESA C/ PEÇAS DE MANUTENÇÃO E CONSERVAÇÃO DE VEÍCULOS', 'Pagamentos', 'Custo com Transporte', 3),
('4.3.7', 'MULTAS DE TRÂNSITO', 'Pagamentos', 'Custo com Transporte', 3),
('4.3.8', 'IPVA, DPVAT E LICENCIAMENTO', 'Pagamentos', 'Custo com Transporte', 3),
('4.3.9', 'PEDÁGIO', 'Pagamentos', 'Custo com Transporte', 3),
('4.3.10', 'ALIMENTAÇÃO TRANSPORTE (MOTORISTAS/CARREGADORES)', 'Pagamentos', 'Custo com Transporte', 3),
('4.3.12', 'FRETE - DIÁRIA DE VEÍCULOS', 'Pagamentos', 'Custo com Transporte', 3),
('4.3.13', 'SEGURO VEÍCULO', 'Pagamentos', 'Custo com Transporte', 3),

-- 4.5 Marketing e Comercial
('4.5', 'CUSTO COM MARKETING E COMERCIAL', 'Pagamentos', '------', 2),
('4.5.1', 'COMISSÃO SOBRE A VENDA', 'Pagamentos', 'Marketing e Comercial', 3),
('4.5.2', 'DESPESAS C/ BONIFICAÇÃO', 'Pagamentos', 'Marketing e Comercial', 3),
('4.5.3', 'EMPRESA DE MKT', 'Pagamentos', 'Marketing e Comercial', 3),
('4.5.4', 'SOCIAL MÍDIAS E DESIGNER', 'Pagamentos', 'Marketing e Comercial', 3),
('4.5.5', 'PANFLETAGEM', 'Pagamentos', 'Marketing e Comercial', 3),
('4.5.6', 'PUBLICIDADE E PROPAGANDA', 'Pagamentos', 'Marketing e Comercial', 3),
('4.5.7', 'MKT PATROCINADO (TRÁFEGO)', 'Pagamentos', 'Marketing e Comercial', 3),
('4.5.8', 'DESP. C/ TX MENSALIDADES/ANUIDADE', 'Pagamentos', 'Marketing e Comercial', 3),
('4.5.9', 'FEIRAS E EVENTOS - MKT', 'Pagamentos', 'Marketing e Comercial', 3),
('4.5.10', 'PAPELARIA (FOLDER, CARTÃO VISITAS, ETC.)', 'Pagamentos', 'Marketing e Comercial', 3),
('4.5.11', 'SITE / INTERNET', 'Pagamentos', 'Marketing e Comercial', 3),
('4.5.12', 'PRESTADORES DE SERVIÇOS DE MARKETING', 'Pagamentos', 'Marketing e Comercial', 3),
('4.5.13', 'OUTROS INVESTIMENTOS EM MARKETING', 'Pagamentos', 'Marketing e Comercial', 3),
('4.5.14', 'BRINDES E PATROCÍNIO', 'Pagamentos', 'Marketing e Comercial', 3),

-- 4.6 Custos Direto Operacional
('4.6', 'CUSTOS DIRETO OPERACIONAL', 'Pagamentos', '------', 2),
('4.6.1', 'ETIQUETAS E LACRE', 'Pagamentos', 'Custos Direto Operacional', 3),
('4.6.2', 'EMBALAGENS', 'Pagamentos', 'Custos Direto Operacional', 3),
('4.6.3', 'PRODUTOS QUÍMICOS', 'Pagamentos', 'Custos Direto Operacional', 3),
('4.6.4', 'TERCEIRIZAÇÃO DE BALANÇA', 'Pagamentos', 'Custos Direto Operacional', 3),
('4.6.5', 'VETERINÁRIO', 'Pagamentos', 'Custos Direto Operacional', 3),

-- 5 - DESPESAS FIXAS
('5', 'DESPESAS FIXAS', 'Pagamentos', '------', 1),

-- 5.1 Pró-labore
('5.1', 'PRÓ-LABORE SÓCIOS', 'Pagamentos', '------', 2),
('5.1.1', 'PRÓ-LABORE SÓCIO 1', 'Pagamentos', 'Pró-labore Sócios', 3),
('5.1.4', 'PRÓ-LABORE SÓCIOS 2', 'Pagamentos', 'Pró-labore Sócios', 3),
('5.1.5', 'INSS - PRÓ-LABORE', 'Pagamentos', 'Pró-labore Sócios', 3),

-- 5.2 Despesas com Pessoal
('5.2', 'DESPESAS COM PESSOAL', 'Pagamentos', '------', 2),
('5.2.1', 'SALÁRIOS OPERACIONAL', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.2', 'SALÁRIOS ADMINISTRATIVO', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.3', 'JOVEM APRENDIZ E ESTAGIÁRIOS', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.4', 'COMISSÕES S/ VENDAS', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.5', '13º SALÁRIO', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.6', 'FÉRIAS', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.7', 'RESCISÕES', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.8', 'VALE TRANSPORTE', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.9', 'ALMOÇO / LANCHE / MERCADO', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.10', 'INSS', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.11', 'FGTS', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.12', 'INSS S/ FÉRIAS', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.13', 'INSS S/ 13 SALÁRIO', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.14', 'FGTS S/ FÉRIAS', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.15', 'FGTS S/ 13 SALÁRIO', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.16', 'FGTS MULTA RESCISÓRIA', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.17', 'GRATIFICAÇÕES DIVERSAS', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.18', 'ASSISTÊNCIA MÉDICA E EXAME PERIÓDICO', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.19', 'SINDICATOS E ASSOCIAÇÕES DE CLASSE', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.20', 'ASSISTÊNCIA SOCIAL/CONFRATERNIZAÇÕES', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.21', 'AJUDA DE CUSTO', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.22', 'CURSOS/TREINAMENTOS/CONGRESSOS', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.23', 'SISTEMA DE PONTO ELETRÔNICO', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.24', 'ABONO PECUNIÁRIO', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.25', 'INCENTIVO A PRODUTIVIDADE (BÔNUS)', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.26', 'FARDAMENTOS', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.27', 'EPI - EQUIPAMENTO PROTEÇÃO INDIVIDUAL', 'Pagamentos', 'Despesas com Pessoal', 3),
('5.2.28', 'DIÁRIA DE PROFISSIONAL', 'Pagamentos', 'Despesas com Pessoal', 3),

-- 5.3 Contas de Consumo e Imóveis
('5.3', 'DESPESAS COM CONTAS DE CONSUMO E IMÓVEIS', 'Pagamentos', '------', 2),
('5.3.1', 'TELEFONE E INTERNET', 'Pagamentos', 'Contas de Consumo e Imóveis', 3),
('5.3.2', 'CELULAR', 'Pagamentos', 'Contas de Consumo e Imóveis', 3),
('5.3.3', 'ENERGIA ELÉTRICA', 'Pagamentos', 'Contas de Consumo e Imóveis', 3),
('5.3.4', 'EMBASA', 'Pagamentos', 'Contas de Consumo e Imóveis', 3),
('5.3.5', 'IPTU', 'Pagamentos', 'Contas de Consumo e Imóveis', 3),

-- 5.4 Terceirizados
('5.4', 'DESPESAS COM TERCEIRIZADOS', 'Pagamentos', '------', 2),
('5.4.1', 'CONTABILIDADE', 'Pagamentos', 'Despesas com Terceirizados', 3),
('5.4.2', 'ADVOGADO', 'Pagamentos', 'Despesas com Terceirizados', 3),
('5.4.3', 'CONSULTORIA', 'Pagamentos', 'Despesas com Terceirizados', 3),
('5.4.4', 'SISTEMA', 'Pagamentos', 'Despesas com Terceirizados', 3),
('5.4.5', 'SUPORTE T.I.', 'Pagamentos', 'Despesas com Terceirizados', 3),

-- 5.5 Manutenção
('5.5', 'DESPESAS COM MANUTENÇÃO', 'Pagamentos', '------', 2),
('5.5.1', 'MATERIAIS DE LIMPEZA', 'Pagamentos', 'Despesas com Manutenção', 3),
('5.5.2', 'DEDETIZAÇÃO', 'Pagamentos', 'Despesas com Manutenção', 3),
('5.5.3', 'MANUTENÇÃO PREDIAL', 'Pagamentos', 'Despesas com Manutenção', 3),
('5.5.4', 'MANUTENÇÃO EQUIPAMENTOS', 'Pagamentos', 'Despesas com Manutenção', 3),

-- 5.6 Administrativas
('5.6', 'DESPESAS ADMINISTRATIVAS', 'Pagamentos', '------', 2),
('5.6.1', 'TARIFAS BANCÁRIAS (BB)', 'Pagamentos', 'Despesas Administrativas', 3),
('5.6.2', 'TARIFAS BANCÁRIAS (CAIXA)', 'Pagamentos', 'Despesas Administrativas', 3),
('5.6.3', 'TAXAS PATRONAIS/TFF', 'Pagamentos', 'Despesas Administrativas', 3),
('5.6.4', 'DESPESAS VEÍCULO ADM', 'Pagamentos', 'Despesas Administrativas', 3),
('5.6.5', 'DESPESAS COMBUSTÍVEL ADM', 'Pagamentos', 'Despesas Administrativas', 3),
('5.6.6', 'MATERIAL ESCRITÓRIO E EXPEDIENTE', 'Pagamentos', 'Despesas Administrativas', 3),
('5.6.7', 'JUROS FORNECEDORES', 'Pagamentos', 'Despesas Administrativas', 3),

-- 6 - RECEITAS NÃO OPERACIONAIS
('6', 'RECEITAS NÃO OPERACIONAIS', 'Recebimentos', '------', 1),
('6.1', 'EMPRÉSTIMOS E APORTES', 'Recebimentos', '------', 2),
('6.1.1', 'EMPRÉSTIMOS BANCÁRIOS', 'Recebimentos', 'Empréstimos e Aportes', 3),
('6.1.2', 'APORTES SÓCIOS', 'Recebimentos', 'Empréstimos e Aportes', 3),
('6.1.3', 'CONSÓRCIOS', 'Recebimentos', 'Empréstimos e Aportes', 3),

-- 7 - DESPESAS NÃO OPERACIONAIS
('7', 'DESPESAS NÃO OPERACIONAIS', 'Pagamentos', '------', 1),

-- 7.1 Bancos (Empréstimos)
('7.1', 'BANCOS (EMPRÉSTIMOS)', 'Pagamentos', '------', 2),
('7.1.1', 'BANCOS BB (EMPRÉSTIMOS)', 'Pagamentos', 'Bancos (Empréstimos)', 3),
('7.1.2', 'BANCOS CAIXA (EMPRÉSTIMOS)', 'Pagamentos', 'Bancos (Empréstimos)', 3),

-- 7.2 Bancos (Consórcios)
('7.2', 'BANCOS (CONSÓRCIOS)', 'Pagamentos', '------', 2),
('7.2.1', 'CONSÓRCIO - VEÍCULO', 'Pagamentos', 'Bancos (Consórcios)', 3),
('7.2.2', 'CONSÓRCIO - IMÓVEL', 'Pagamentos', 'Bancos (Consórcios)', 3),
('7.2.3', 'CONSÓRCIO - ENERGIA SOLAR', 'Pagamentos', 'Bancos (Consórcios)', 3),
('7.2.4', 'FINANCIAMENTO - VEÍCULO', 'Pagamentos', 'Bancos (Consórcios)', 3),

-- 7.3 Investimentos
('7.3', 'INVESTIMENTOS', 'Pagamentos', '------', 2),
('7.3.1', 'MÓVEIS E EQUIPAMENTOS', 'Pagamentos', 'Investimentos', 3),
('7.3.2', 'VEÍCULO', 'Pagamentos', 'Investimentos', 3),

-- 7.4 Despesas Sócio
('7.4', 'DESPESAS SÓCIO (NENNA)', 'Pagamentos', '------', 2),
('7.4.1', 'DESPESAS FAZENDA', 'Pagamentos', 'Despesas Sócio (Nenna)', 3),
('7.4.2', 'DESPESAS PESSOAL', 'Pagamentos', 'Despesas Sócio (Nenna)', 3);
