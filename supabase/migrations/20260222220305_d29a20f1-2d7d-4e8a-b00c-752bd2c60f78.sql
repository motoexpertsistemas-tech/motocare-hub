
-- Tabela para o Plano de Contas
CREATE TABLE public.plano_contas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classificacao TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  movimentacao TEXT NOT NULL DEFAULT 'Pagamentos',
  grupo_dre TEXT NOT NULL DEFAULT '------',
  is_pai BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on plano_contas" ON public.plano_contas FOR ALL USING (true) WITH CHECK (true);

-- Trigger para atualizar timestamp
CREATE TRIGGER update_plano_contas_updated_at
BEFORE UPDATE ON public.plano_contas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados do plano de contas
INSERT INTO public.plano_contas (classificacao, nome, movimentacao, grupo_dre, is_pai) VALUES
-- PAGAMENTOS
('1.1', 'Despesas administrativas e comerciais', 'Pagamentos', '------', true),
('1.1.1', 'Aluguel', 'Pagamentos', '5.6 - Despesas administrativas', false),
('1.1.2', 'Assessorias e associações', 'Pagamentos', '5.2.19 - Sindicatos e associações', false),
('1.1.3', 'Cartório', 'Pagamentos', '5.6 - Despesas administrativas', false),
('1.1.4', 'Combustivel da loja OFICINA', 'Pagamentos', '4.3.2 - Combustíveis veículos', false),
('1.1.5', 'Confraternizações', 'Pagamentos', '5.2.20 - Assistência social/confraternizações', false),
('1.1.6', 'Contabilidade', 'Pagamentos', '5.4.1 - Contabilidade', false),
('1.1.7', 'Correios', 'Pagamentos', '4.3.1 - Fretes e carretos', false),
('1.1.8', 'Cursos e treinamentos', 'Pagamentos', '5.2.22 - Cursos/treinamentos/congressos', false),
('1.1.9', 'Remuneração dos sócios', 'Pagamentos', '5.1 - Pró-labore sócios', false),
('1.1.10', 'Empréstimos', 'Pagamentos', '7.1 - Bancos (empréstimos)', false),
('1.1.11', 'Encargos funcionários - 13o salário', 'Pagamentos', '5.2.5 - 13º salário', false),
('1.1.12', 'Encargos funcionários - alimentação', 'Pagamentos', '5.2.9 - Almoço/lanche/mercado', false),
('1.1.13', 'Encargos funcionários - assist. médica e odontol.', 'Pagamentos', '5.2.18 - Assistência médica', false),
('1.1.14', 'Encargos funcionários - exames pré e demissionais', 'Pagamentos', '5.2.18 - Assistência médica', false),
('1.1.15', 'Encargos funcionários - FGTS', 'Pagamentos', '5.2.11 - FGTS', false),
('1.1.16', 'Encargos funcionarios - horas extras', 'Pagamentos', '5.2.1 - Salários operacional', false),
('1.1.17', 'Encargos funcionários - INSS', 'Pagamentos', '5.2.10 - INSS', false),
('1.1.18', 'Encargos funcionários - vale transporte', 'Pagamentos', '5.2.8 - Vale transporte', false),
('1.1.19', 'Encargos - rescisões trabalhistas', 'Pagamentos', '5.2.7 - Rescisões', false),
('1.1.20', 'Energia elétrica + água', 'Pagamentos', '5.3.3 - Energia elétrica', false),
('1.1.21', 'Impostos - alvará', 'Pagamentos', '5.6.3 - Taxas patronais/TFF', false),
('1.1.22', 'Impostos - coleta de lixo', 'Pagamentos', '5.6.3 - Taxas patronais/TFF', false),
('1.1.23', 'Impostos - IPTU', 'Pagamentos', '5.3.5 - IPTU', false),
('1.1.24', 'Impostos - PIS', 'Pagamentos', '4.1.3 - PIS s/ vendas', false),
('1.1.25', 'Licença ou aluguel de softwares', 'Pagamentos', '5.4.4 - Sistema', false),
('1.1.26', 'Limpeza', 'Pagamentos', '5.5.1 - Materiais de limpeza', false),
('1.1.27', 'Manutenção equipamentos', 'Pagamentos', '5.5.4 - Manutenção equipamentos', false),
('1.1.28', 'Marketing e publicidade', 'Pagamentos', '4.5.6 - Publicidade e propaganda', false),
('1.1.29', 'Material de escritório', 'Pagamentos', '5.6.6 - Material escritório', false),
('1.1.30', 'Material reforma', 'Pagamentos', '5.5.3 - Manutenção predial', false),
('1.1.31', 'Remuneração funcionários', 'Pagamentos', '5.2.1 - Salários operacional', false),
('1.1.32', 'Segurança', 'Pagamentos', '5.6 - Despesas administrativas', false),
('1.1.33', 'Supermercado', 'Pagamentos', '5.2.9 - Almoço/lanche/mercado', false),
('1.1.34', 'Telefonia e internet', 'Pagamentos', '5.3.1 - Telefone e internet', false),
('1.1.35', 'Transportadora', 'Pagamentos', '4.3.1 - Fretes e carretos', false),
('1.1.36', 'Viagens', 'Pagamentos', '5.2.21 - Ajuda de custo', false),
('1.1.37', 'DARF', 'Pagamentos', '4.1.7 - IRPJ', false),
('1.1.38', 'Devolução de vendas', 'Pagamentos', 'Não mostrar no DRE', false),
('1.1.39', 'LAVA JATO', 'Pagamentos', '4.6 - Custos direto operacional', false),
('1.1.40', 'Distribuição de lucros', 'Pagamentos', '7.4 - Despesas sócio', false),

('1.2', 'Despesas de produtos vendidos', 'Pagamentos', '------', true),
('1.2.1', 'Comissão de vendedores', 'Pagamentos', '4.5.1 - Comissão sobre a venda', false),
('1.2.2', 'Compras', 'Pagamentos', 'CMV.1 - Custo mercadoria', false),
('1.2.3', 'Impostos - COFINS', 'Pagamentos', '4.1.4 - COFINS s/ vendas', false),
('1.2.4', 'Impostos - CSSL', 'Pagamentos', '4.1.7 - IRPJ', false),
('1.2.5', 'Impostos - ICMS', 'Pagamentos', '4.1.1 - ICMS s/ vendas', false),
('1.2.6', 'Impostos - importação IPI', 'Pagamentos', '4.1.2 - IPI s/ vendas', false),
('1.2.7', 'Impostos - IRPJ', 'Pagamentos', '4.1.7 - IRPJ', false),
('1.2.8', 'Impostos - ISS', 'Pagamentos', '4.1 - Impostos', false),
('1.2.9', 'Terceirização', 'Pagamentos', '4.6.4 - Terceirização de balança', false),
('1.2.10', 'Insumos', 'Pagamentos', '4.6.3 - Produtos químicos', false),
('1.2.11', 'DAS Simples', 'Pagamentos', '4.1 - Impostos', false),
('1.2.12', 'Embalagens', 'Pagamentos', '4.6.2 - Embalagens', false),
('1.2.13', 'Combustivel Para MOTOCICLETA', 'Pagamentos', '4.3.2 - Combustíveis veículos', false),

('1.3', 'Despesas financeiras', 'Pagamentos', '------', true),
('1.3.1', 'Despesas bancárias', 'Pagamentos', '5.6.1 - Tarifas bancárias (BB)', false),

('1.4', 'Investimentos', 'Pagamentos', '------', true),
('1.4.1', 'Aquisição de equipamentos', 'Pagamentos', '7.3.1 - Móveis e equipamentos', false),

('1.5', 'Outras despesas', 'Pagamentos', '------', true),
('1.5.1', 'Adiantamento - funcionários', 'Pagamentos', '5.2.17 - Gratificações diversas', false),
('1.5.2', 'Ajuste de caixa', 'Pagamentos', '5.6 - Despesas administrativas', false),
('1.5.3', 'Despesas pessoais', 'Pagamentos', '7.4.2 - Despesas pessoal', false),

-- RECEBIMENTOS
('2.1', 'Receitas de vendas', 'Recebimentos', '------', true),
('2.1.1', 'Vendas de produtos', 'Recebimentos', '1 - Receita bruta de venda', false),
('2.1.2', 'Vendas no balcão', 'Recebimentos', '1.1 - Venda balcão', false),
('2.1.3', 'Prestações de serviços', 'Recebimentos', '2.1 - Serviços terceirizados', false),
('2.1.4', 'Contratos de serviços', 'Recebimentos', '2.1 - Serviços terceirizados', false),
('2.1.5', 'Locação de equipamentos', 'Recebimentos', '3.01 - Outras receitas', false),

('2.2', 'Receitas financeiras', 'Recebimentos', '------', true),
('2.2.1', 'Aplicações financeiras', 'Recebimentos', '6.1 - Empréstimos e aportes', false),

('2.3', 'Outras receitas', 'Recebimentos', '------', true),
('2.3.1', 'Ajuste de caixa', 'Recebimentos', '3.01 - Outras receitas', false),
('2.3.2', 'Devolução de adiantamento', 'Recebimentos', '3.01 - Outras receitas', false);
