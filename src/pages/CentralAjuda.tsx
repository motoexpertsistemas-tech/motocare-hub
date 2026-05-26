import { useState } from "react";
import { Search, HelpCircle, ExternalLink, ChevronRight, BookOpen, FileText, ShoppingCart, Wrench, Package, Users, DollarSign, BarChart3, Settings, Download, FileCheck, Headphones, Monitor, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const tutoriais = [
  { label: "Aplicativos", icon: Package },
  { label: "Cadastros", icon: Users },
  { label: "Produtos", icon: Package },
  { label: "Serviços", icon: Wrench },
  { label: "Orçamentos", icon: FileText },
  { label: "Ordens de Serviço", icon: Wrench },
  { label: "Vendas", icon: ShoppingCart },
  { label: "Estoque", icon: Package },
  { label: "Financeiro", icon: DollarSign },
  { label: "Notas Fiscais", icon: FileCheck },
  { label: "Importar Dados", icon: Download },
  { label: "Contratos", icon: FileText },
  { label: "Atendimentos", icon: Headphones },
  { label: "Agenda", icon: Calendar },
  { label: "Relatórios", icon: BarChart3 },
  { label: "Configurações", icon: Settings },
  { label: "Integrações e Aplicativos", icon: Package },
  { label: "Área de Contabilidade", icon: FileText },
  { label: "Loja Virtual", icon: ShoppingCart },
];

const faqCategories = [
  "Planilhas",
  "Dúvidas sobre Notas Fiscais",
  "Certificado Digital",
  "Dúvidas",
  "Dúvidas sobre Vendas",
  "Impressoras",
];

const guiasRapidos = [
  "Como emitir boleto bancário?",
  "Como emitir nota fiscal eletrônica?",
  "Como gerenciar vendas no sistema?",
  "Como gerar ordens de serviço?",
  "Como cadastrar clientes?",
  "Como cadastrar produtos?",
  "Como cadastrar serviços?",
  "Como vincular o certificado digital?",
];

const tutoriaisConteudo: Record<string, { pergunta: string; resposta: string }[]> = {
  "Aplicativos": [
    { pergunta: "Como instalar o Otto Tech Sistemas no celular?", resposta: "O Otto Tech Sistemas é um PWA (Progressive Web App). No navegador do celular, acesse o sistema e toque em 'Adicionar à tela inicial'. O app ficará disponível como um aplicativo nativo no seu dispositivo." },
    { pergunta: "O Otto Tech Sistemas funciona offline?", resposta: "O sistema requer conexão com a internet para funcionar. Porém, como PWA, algumas telas podem carregar do cache local enquanto a conexão é restabelecida." },
    { pergunta: "Quais navegadores são compatíveis?", resposta: "O Otto Tech Sistemas funciona em todos os navegadores modernos: Google Chrome (recomendado), Firefox, Safari e Microsoft Edge. Recomendamos manter o navegador sempre atualizado." },
    { pergunta: "Como acessar o modo Quiosque?", resposta: "O modo Quiosque permite que seus clientes consultem produtos e preços diretamente num tablet ou computador. Acesse pelo menu lateral ou diretamente pela rota /quiosque." },
  ],
  "Cadastros": [
    { pergunta: "Como cadastrar um novo cliente?", resposta: "Acesse Clientes > Novo Cliente. Preencha os dados obrigatórios (nome, telefone, tipo de pessoa). Você pode cadastrar pessoa física (CPF) ou jurídica (CNPJ), adicionar endereço, e-mail, placas de veículos e observações." },
    { pergunta: "Como cadastrar funcionários?", resposta: "Acesse Cadastros > Funcionários. Clique em 'Adicionar Funcionário' e preencha nome, cargo, telefone, e-mail e comissão. Funcionários podem ser vinculados a vendas e ordens de serviço para cálculo automático de comissões." },
    { pergunta: "Como cadastrar fornecedores?", resposta: "Acesse o menu Fornecedores. Clique em 'Novo Fornecedor' e preencha razão social, CNPJ, contato, endereço e condições de pagamento. Fornecedores são utilizados em cotações e pedidos de compra." },
    { pergunta: "Como cadastrar transportadoras?", resposta: "Acesse Cadastros > Transportadoras. Cadastre nome, CNPJ, contato e valores de frete. As transportadoras ficam disponíveis para seleção em vendas e ordens de serviço." },
    { pergunta: "Como importar clientes em massa?", resposta: "Acesse Clientes > Importar Clientes. Faça o upload de uma planilha Excel (.xlsx) com os dados dos clientes. O sistema mapeará automaticamente as colunas para os campos correspondentes." },
    { pergunta: "Como criar categorias de clientes?", resposta: "Acesse Cadastros > Categorias de Clientes. Crie categorias como 'VIP', 'Atacado', 'Varejo' etc. Depois, ao cadastrar ou editar um cliente, vincule-o à categoria desejada." },
  ],
  "Produtos": [
    { pergunta: "Como cadastrar um novo produto?", resposta: "Acesse Estoque > Novo Produto. Preencha nome, código de barras, grupo, unidade, preço de custo e preço de venda. Você pode adicionar imagens, descrição detalhada e definir estoque mínimo." },
    { pergunta: "Como editar um produto existente?", resposta: "Na listagem de Estoque, localize o produto e clique no ícone de edição (lápis). Você também pode clicar no nome do produto para abrir o painel de detalhes e editar diretamente." },
    { pergunta: "Como organizar produtos em grupos?", resposta: "Acesse Estoque > Grupos de Produtos. Crie grupos como 'Pneus', 'Óleos', 'Peças de Motor', etc. Ao cadastrar um produto, selecione o grupo correspondente." },
    { pergunta: "Como definir unidades de medida?", resposta: "Acesse Estoque > Unidades de Produtos. Cadastre unidades como UN (unidade), CX (caixa), LT (litro), KG (quilograma), etc." },
    { pergunta: "Como configurar grades e variações?", resposta: "Acesse Estoque > Grades e Variações. Configure variações como tamanho, cor ou modelo. Ao vincular uma grade a um produto, o sistema criará automaticamente as combinações de SKU." },
    { pergunta: "Como ajustar preços em massa?", resposta: "Acesse Estoque > Ajustar Valores em Massa. Selecione os produtos desejados, defina o percentual de reajuste (aumento ou redução) e aplique. O sistema atualizará todos os preços selecionados." },
    { pergunta: "Como gerar e imprimir etiquetas?", resposta: "Acesse Estoque > Etiquetas. Selecione os produtos, escolha o modelo de etiqueta (com código de barras, preço, etc.) e clique em 'Gerar Etiquetas' para imprimir." },
    { pergunta: "Como clonar um produto?", resposta: "Na listagem de Estoque, clique no menu de ações do produto e selecione 'Clonar'. O sistema criará uma cópia do produto com todos os dados, permitindo que você altere apenas o necessário." },
  ],
  "Serviços": [
    { pergunta: "Como cadastrar um novo serviço?", resposta: "Acesse Serviços > Adicionar Serviço. Preencha nome, descrição, valor, tempo estimado de execução e categoria. Os serviços ficam disponíveis para seleção em ordens de serviço." },
    { pergunta: "Como configurar o custo homem/hora?", resposta: "Acesse Serviços > Custo Homem/Hora. Cadastre diferentes categorias de mão de obra com seus respectivos valores por hora. Isso permite calcular automaticamente o custo de serviços com base no tempo." },
    { pergunta: "Como criar tabelas de preços para serviços?", resposta: "Acesse Serviços > Tabela de Preços. Crie tabelas diferenciadas (varejo, atacado, convênio) com preços específicos para cada serviço." },
    { pergunta: "Como editar um serviço existente?", resposta: "Na listagem de Serviços, localize o serviço desejado e clique no ícone de edição. Altere os campos necessários e salve." },
  ],
  "Orçamentos": [
    { pergunta: "Como criar um orçamento?", resposta: "Acesse Vendas Balcão e crie uma venda com status 'Orçamento'. Adicione os produtos e serviços, defina o cliente e as condições. O orçamento pode ser convertido em venda posteriormente." },
    { pergunta: "Como converter um orçamento em venda?", resposta: "Na listagem de Vendas Balcão, localize o orçamento e clique em 'Converter em Venda'. O sistema transferirá todos os itens e condições para uma nova venda." },
    { pergunta: "Como enviar orçamento por WhatsApp?", resposta: "Ao visualizar um orçamento, clique no botão de compartilhamento WhatsApp. O sistema gerará automaticamente um texto formatado com os itens e valores para envio." },
    { pergunta: "Como imprimir um orçamento?", resposta: "Ao visualizar o orçamento, clique no botão 'Imprimir'. O sistema gerará um PDF formatado com dados da empresa, cliente, itens e valores para impressão." },
  ],
  "Ordens de Serviço": [
    { pergunta: "Como abrir uma nova ordem de serviço?", resposta: "Acesse OS > Nova OS. Selecione o cliente, informe o veículo (placa, modelo, km), descreva o defeito relatado, adicione serviços e peças necessárias. Defina o técnico responsável e salve." },
    { pergunta: "Como consultar veículo pela placa?", resposta: "Na tela de Nova OS, digite a placa do veículo no campo específico. O sistema consultará automaticamente os dados do veículo (marca, modelo, ano, cor) e preencherá os campos." },
    { pergunta: "Como gerenciar situações de OS?", resposta: "Acesse OS > Situações. Crie e personalize os status da OS como 'Aguardando peças', 'Em execução', 'Pronta para entrega', etc. Defina cores para facilitar a identificação visual." },
    { pergunta: "Como visualizar a agenda de OS?", resposta: "Acesse OS > Agenda. Visualize todas as ordens de serviço em formato de calendário, organizadas por data de entrega prevista. Clique em uma OS para ver os detalhes." },
    { pergunta: "Como imprimir uma ordem de serviço?", resposta: "Ao visualizar os detalhes da OS, clique em 'Imprimir OS'. O sistema gerará um documento formatado com todos os dados: cliente, veículo, serviços, peças e valores." },
    { pergunta: "Como imprimir o checklist da OS?", resposta: "Na tela de detalhes da OS, clique em 'Imprimir Checklist'. O checklist inclui itens de verificação visual do veículo que devem ser preenchidos na entrada e saída." },
    { pergunta: "Como adicionar fotos e anexos à OS?", resposta: "Na tela de detalhes da OS, utilize a seção de anexos para fazer upload de fotos do veículo, notas fiscais de peças ou qualquer outro documento relevante." },
  ],
  "Vendas": [
    { pergunta: "Como realizar uma venda no PDV?", resposta: "Acesse o PDV (Ponto de Venda). Adicione produtos pelo código de barras, busca por nome ou código. Selecione o cliente (opcional), escolha a forma de pagamento e finalize a venda." },
    { pergunta: "Qual a diferença entre Venda Balcão e PDV?", resposta: "O PDV é otimizado para vendas rápidas com interface simplificada. A Venda Balcão oferece mais opções como orçamentos, descontos detalhados, parcelamento e observações." },
    { pergunta: "Como fazer uma venda no atacado?", resposta: "Acesse Venda Atacado > Vender. O PDV Atacado permite vendas com quantidades maiores, preços diferenciados e condições especiais para revendedores." },
    { pergunta: "Como aplicar desconto em uma venda?", resposta: "No PDV ou Venda Balcão, clique no campo de desconto do item ou no desconto geral. Insira o valor fixo (R$) ou percentual (%) desejado. O sistema recalculará o total automaticamente." },
    { pergunta: "Como consultar preços rapidamente?", resposta: "Acesse PDV > Pesquisa de Preços. Busque o produto por nome, código ou código de barras para consultar preço de venda, estoque disponível e demais informações." },
    { pergunta: "Como enviar comprovante de venda por WhatsApp?", resposta: "Após finalizar a venda, clique no botão WhatsApp disponível no comprovante. O sistema gerará automaticamente uma mensagem formatada com os detalhes da venda." },
    { pergunta: "Como gerenciar trocas e devoluções?", resposta: "Acesse Estoque > Trocas e Devoluções. Registre a devolução informando a venda original, o motivo e os produtos devolvidos. O estoque será atualizado automaticamente." },
  ],
  "Estoque": [
    { pergunta: "Como controlar o estoque de produtos?", resposta: "O dashboard de Estoque (Estoque Hub) mostra uma visão geral com produtos em baixa, movimentações recentes e alertas de estoque mínimo. Acesse Estoque para a listagem completa com filtros." },
    { pergunta: "Como fazer ajustes de estoque?", resposta: "Acesse Estoque > Ajustes. Crie um novo ajuste selecionando o tipo (entrada ou saída), adicione os produtos com as quantidades e informe o motivo do ajuste." },
    { pergunta: "Como registrar movimentações de estoque?", resposta: "As movimentações são registradas automaticamente em vendas, OS e ajustes. Acesse Estoque > Movimentações para visualizar o histórico completo de entradas e saídas de cada produto." },
    { pergunta: "Como fazer transferências entre estoques?", resposta: "Acesse Estoque > Transferências. Selecione a origem, o destino, os produtos e as quantidades. As transferências atualizam automaticamente o saldo de ambos os estoques." },
    { pergunta: "Como criar cotações de compra?", resposta: "Acesse Estoque > Cotações > Adicionar Cotação. Selecione os produtos desejados, informe os fornecedores e envie a cotação. Ao receber respostas, compare preços e prazos para escolher a melhor oferta." },
    { pergunta: "Como registrar compras de fornecedores?", resposta: "Acesse Estoque > Compras. Registre o pedido de compra com fornecedor, produtos, quantidades e valores. Ao receber a mercadoria, confirme a entrada para atualizar o estoque automaticamente." },
    { pergunta: "Como configurar estoque mínimo?", resposta: "Ao editar um produto, defina o campo 'Estoque Mínimo'. O sistema alertará automaticamente quando o saldo ficar abaixo desse valor no dashboard e nas notificações." },
    { pergunta: "Como importar catálogos de fornecedores?", resposta: "O Otto Tech Sistemas permite importar catálogos de fornecedores parceiros (Sportive, Protork, Vipal, CPL, Perere) automaticamente. Acesse o importador pelo menu de Estoque e selecione o fornecedor." },
  ],
  "Financeiro": [
    { pergunta: "Como cadastrar contas a pagar?", resposta: "Acesse Financeiro > Contas a Pagar. Clique em 'Nova Conta', informe descrição, fornecedor, valor, data de vencimento, forma de pagamento e plano de contas. A conta aparecerá nas notificações quando próxima do vencimento." },
    { pergunta: "Como cadastrar contas a receber?", resposta: "Acesse Financeiro > Contas a Receber. Registre recebimentos pendentes vinculados a vendas, serviços ou outras fontes de receita. Defina cliente, valor, vencimento e forma de pagamento." },
    { pergunta: "Como gerenciar o fluxo de caixa?", resposta: "Acesse Financeiro > Fluxo de Caixa. Visualize entradas e saídas por período com gráficos de evolução. O sistema considera contas a pagar e receber para projeção do saldo futuro." },
    { pergunta: "Como abrir e fechar caixa?", resposta: "Acesse Financeiro > Caixas. Clique em 'Abrir Caixa', informe o saldo de abertura e o operador. Ao final do expediente, clique em 'Fechar Caixa' para registrar o saldo de fechamento e conferir a movimentação." },
    { pergunta: "Como gerenciar contas bancárias?", resposta: "Acesse Financeiro > Contas Bancárias. Cadastre suas contas com banco, agência, número e saldo inicial. As contas ficam disponíveis para vinculação em pagamentos e recebimentos." },
    { pergunta: "Como fazer conciliação bancária?", resposta: "Acesse Financeiro > Conciliação Bancária. Compare o extrato do banco com as movimentações registradas no sistema e concilie os lançamentos correspondentes." },
    { pergunta: "Como configurar formas de pagamento?", resposta: "Acesse Financeiro > Formas de Pagamento. Cadastre formas como Dinheiro, PIX, Cartão de Crédito/Débito, Boleto, etc. Defina taxas, prazos de recebimento e contas bancárias vinculadas." },
    { pergunta: "Como emitir boletos bancários?", resposta: "Acesse Financeiro > Boletos Bancários. Configure a integração com seu banco, gere boletos para contas a receber e acompanhe o status de pagamento (pago, vencido, cancelado)." },
    { pergunta: "Como configurar o Plano de Contas?", resposta: "Acesse Financeiro > Plano de Contas. O sistema já vem com um plano completo pré-cadastrado (despesas administrativas, despesas de produtos vendidos, receitas de vendas, etc.). Você pode adicionar, editar ou excluir contas conforme necessário." },
    { pergunta: "Como calcular comissões de vendedores?", resposta: "Acesse Financeiro > Comissões. O sistema calcula automaticamente as comissões com base nas vendas e OS realizadas por cada vendedor/técnico, conforme os percentuais configurados no cadastro do funcionário." },
    { pergunta: "Como fazer transferências entre contas?", resposta: "Acesse Financeiro > Transferências. Selecione a conta de origem, a conta de destino e o valor. A transferência atualizará automaticamente o saldo de ambas as contas." },
    { pergunta: "Como enviar comprovante por WhatsApp?", resposta: "Tanto em Contas a Pagar quanto em Contas a Receber, clique no menu de ações (⋮) da conta e selecione 'Enviar via WhatsApp'. O sistema gerará um comprovante formatado para envio." },
  ],
  "Notas Fiscais": [
    { pergunta: "Como configurar a emissão de NF-e?", resposta: "Acesse Fiscal > Configuração Fiscal. Preencha os dados da empresa (CNPJ, Inscrição Estadual, endereço), selecione o regime tributário, vincule o certificado digital A1 e configure a série e numeração." },
    { pergunta: "Como emitir uma nota fiscal?", resposta: "Acesse Fiscal > Emissões Fiscais. Clique em 'Nova NF-e', selecione o cliente, adicione os produtos com CFOP e impostos. Revise os dados e clique em 'Emitir' para transmitir à SEFAZ." },
    { pergunta: "Como emitir NF-e de devolução?", resposta: "Acesse Fiscal > NF-e Devolução. Informe a nota de origem, selecione os itens devolvidos e gere a nota de devolução referenciando a NF-e original." },
    { pergunta: "Como emitir NF-e de ajuste?", resposta: "Acesse Fiscal > NF-e Ajuste. Crie notas de ajuste para correção de valores, complemento de ICMS ou outras situações fiscais que exijam documento complementar." },
    { pergunta: "Como vincular o certificado digital?", resposta: "Acesse Fiscal > Configuração Fiscal > Certificado Digital. Faça o upload do arquivo .pfx (certificado A1), insira a senha e confirme. O sistema validará a validade do certificado automaticamente." },
  ],
  "Importar Dados": [
    { pergunta: "Como importar clientes de uma planilha?", resposta: "Acesse Clientes > Importar Clientes. Faça upload de uma planilha Excel (.xlsx) com os dados. O sistema mapeará as colunas automaticamente. Revise o mapeamento e confirme a importação." },
    { pergunta: "Como importar produtos de uma planilha?", resposta: "No Estoque, use a opção 'Importar Excel'. Faça upload da planilha com nome, código, preço de custo, preço de venda, estoque e demais campos. O sistema criará os produtos automaticamente." },
    { pergunta: "Como importar catálogos de fornecedores?", resposta: "O Otto Tech Sistemas possui importadores automáticos para os principais fornecedores de peças de moto: Sportive, Protork, Vipal, CPL e Perere. Acesse o importador específico pelo menu de Estoque." },
    { pergunta: "Como importar serviços?", resposta: "Use o importador de serviços disponível no menu Serviços. Faça upload de uma planilha com nome, descrição e valor dos serviços para cadastro em massa." },
  ],
  "Contratos": [
    { pergunta: "O que são contratos no Otto Tech Sistemas?", resposta: "Contratos permitem gerenciar acordos de manutenção recorrente com clientes. Defina os serviços inclusos, periodicidade, valor mensal e vigência." },
    { pergunta: "Como criar um contrato de manutenção?", resposta: "Acesse a área de Contratos, clique em 'Novo Contrato'. Selecione o cliente, defina os serviços inclusos, frequência de manutenção, valor e período de vigência." },
  ],
  "Atendimentos": [
    { pergunta: "Como funciona o Atendimento Express?", resposta: "O Atendimento Express é uma tela otimizada para atendimentos rápidos. Acesse pelo menu principal, busque ou cadastre o cliente, e registre o serviço realizado de forma simplificada." },
    { pergunta: "Como configurar canais de atendimento?", resposta: "O Otto Tech Sistemas permite integrar canais de comunicação como WhatsApp para receber e responder mensagens diretamente do sistema. Configure os canais na área de Atendimento." },
    { pergunta: "Como usar o agente de IA no atendimento?", resposta: "O Agente de IA pode ser configurado para responder automaticamente às mensagens dos clientes. Treine-o com perguntas e respostas frequentes da sua oficina para oferecer suporte 24/7." },
    { pergunta: "Como visualizar o histórico de atendimentos?", resposta: "No cadastro de cada cliente, acesse a aba de histórico para ver todas as interações, OS, vendas e atendimentos realizados." },
  ],
  "Agenda": [
    { pergunta: "Como visualizar a agenda de OS?", resposta: "Acesse OS > Agenda para visualizar todas as ordens de serviço organizadas em formato de calendário. A agenda mostra a data de entrega prevista e o status de cada OS." },
    { pergunta: "Como agendar uma ordem de serviço?", resposta: "Ao criar ou editar uma OS, defina a 'Data de Entrega Prevista'. A OS aparecerá automaticamente na agenda na data correspondente." },
  ],
  "Relatórios": [
    { pergunta: "Quais relatórios estão disponíveis?", resposta: "O Otto Tech Sistemas oferece relatórios completos organizados em 4 categorias: Vendas (orçamentos, vendas, produtos vendidos, comissões, curva ABC), Estoque (inventário, cotações, compras), Financeiro (extrato, contas a pagar/receber, plano de contas) e OS (ordens de serviço, equipamentos, comissão de técnicos)." },
    { pergunta: "Como acessar o DRE Gerencial?", resposta: "Acesse Relatórios > DRE Gerencial. O Demonstrativo de Resultado do Exercício mostra receitas, custos e despesas organizados por categoria, permitindo visualizar o lucro da empresa por período." },
    { pergunta: "Como ver relatório de vendas?", resposta: "Acesse Relatórios > Vendas. Filtre por período, vendedor, cliente ou forma de pagamento. O relatório mostra volume de vendas, ticket médio, produtos mais vendidos e faturamento total." },
    { pergunta: "Como ver relatório de estoque?", resposta: "Acesse Relatórios > Estoque. Visualize inventário completo, produtos comprados, cotações e serviços contratados com filtros por período e categoria." },
    { pergunta: "Como ver relatório financeiro?", resposta: "Acesse Relatórios > Financeiro. Consulte extrato de movimentações, contas a pagar/receber, comissões de vendedores e relatório por plano de contas." },
    { pergunta: "Como ver relatório de OS?", resposta: "Acesse Relatórios > OS. Visualize todas as ordens de serviço por período, equipamentos atendidos, tempo por situação e comissões de técnicos." },
    { pergunta: "Como exportar relatórios?", resposta: "Em qualquer tela de relatórios, clique no botão 'Exportar' disponível no canto superior. Escolha o formato desejado (Excel ou PDF) para download." },
    { pergunta: "Como ver a Curva ABC de produtos?", resposta: "Acesse Relatórios > Vendas > Curva ABC. O relatório classifica seus produtos em A (20% dos itens que geram 80% do faturamento), B e C, ajudando a identificar os produtos mais importantes." },
  ],
  "Configurações": [
    { pergunta: "Como configurar os dados da empresa?", resposta: "Acesse Configurações. Preencha razão social, nome fantasia, CNPJ, inscrição estadual, endereço, telefone, e-mail e logo da empresa. Esses dados aparecem em documentos impressos." },
    { pergunta: "Como gerenciar permissões de acesso?", resposta: "Acesse Configurações > Permissões e Acessos. Defina quais módulos e funcionalidades cada usuário ou perfil de acesso pode visualizar e utilizar." },
    { pergunta: "Como configurar o programa de fidelidade?", resposta: "Acesse o menu Fidelidade. Configure as regras de pontuação (pontos por valor gasto), os prêmios disponíveis e os níveis de fidelidade (Bronze, Prata, Ouro)." },
    { pergunta: "Como configurar a LGPD?", resposta: "Acesse o menu LGPD. Configure os termos de consentimento para coleta de dados dos clientes, defina políticas de retenção e gerencie solicitações de exclusão de dados." },
    { pergunta: "Como visualizar o log de auditoria?", resposta: "Acesse o menu Auditoria. O log registra todas as ações realizadas no sistema (criação, edição, exclusão) com data, hora, usuário e detalhes da alteração." },
    { pergunta: "Como gerenciar meu plano e assinatura?", resposta: "Acesse Meu Plano. Visualize seu plano atual, data de renovação, faturas e opções de upgrade. Gerencie sua assinatura e métodos de pagamento." },
  ],
  "Integrações e Aplicativos": [
    { pergunta: "Como integrar com marketplaces?", resposta: "Acesse Marketplaces > Canais de Venda. O Otto Tech Sistemas permite integração com Mercado Livre, Shopee, Amazon, Magazine Luiza, Shein e TikTok Shop. Configure as credenciais de cada marketplace para sincronizar produtos e pedidos." },
    { pergunta: "Como usar a calculadora de lucro de marketplaces?", resposta: "Acesse Marketplaces > Calculadora de Lucro. Informe o preço de venda, o marketplace, taxas e frete para calcular automaticamente o lucro líquido por produto em cada plataforma." },
    { pergunta: "Como integrar com WhatsApp?", resposta: "O Otto Tech Sistemas possui integração nativa com WhatsApp para envio de comprovantes, orçamentos e comunicação com clientes. Configure o webhook do WhatsApp na área de Atendimento." },
    { pergunta: "Como integrar com gateway de pagamento?", resposta: "O sistema suporta integração com Asaas para processamento de boletos e cobranças recorrentes. Configure as credenciais na área de Configurações > Integrações." },
  ],
  "Área de Contabilidade": [
    { pergunta: "Como gerar o DRE para contabilidade?", resposta: "Acesse Relatórios > DRE Gerencial. O sistema gera automaticamente o demonstrativo com base nas movimentações financeiras, organizadas por plano de contas. Exporte em Excel para enviar ao contador." },
    { pergunta: "Como exportar dados fiscais?", resposta: "Acesse Fiscal > Emissões Fiscais. Exporte os XMLs das notas fiscais emitidas por período para envio ao escritório de contabilidade." },
    { pergunta: "Como gerar relatório de plano de contas?", resposta: "Acesse Relatórios > Financeiro > Plano de Contas. O relatório mostra todas as movimentações organizadas por classificação contábil, facilitando a integração com o sistema do contador." },
  ],
  "Loja Virtual": [
    { pergunta: "Como configurar minha loja virtual?", resposta: "Acesse E-commerce > Configurações. Defina o nome da loja, logo, banner, cores, informações de contato e políticas de frete e pagamento. A loja ficará acessível por um link personalizado." },
    { pergunta: "Como adicionar produtos à vitrine?", resposta: "Acesse E-commerce > Produtos Vitrine. Selecione quais produtos do seu estoque devem ser exibidos na loja virtual, defina preços de vitrine e adicione fotos e descrições atrativas." },
    { pergunta: "Como gerenciar clientes da loja virtual?", resposta: "Clientes que se cadastram na loja virtual são automaticamente sincronizados com o cadastro de clientes do sistema. Acesse E-commerce > Minha Conta para gerenciar." },
    { pergunta: "Como compartilhar o link da loja?", resposta: "Sua loja virtual fica acessível pelo link /app/seu-slug. Compartilhe esse link por WhatsApp, redes sociais ou imprima em materiais de divulgação." },
    { pergunta: "Como funciona o Quiosque?", resposta: "O Quiosque é uma versão da loja virtual otimizada para exibição em tablets ou computadores dentro da oficina. Os clientes podem navegar pelos produtos, ver preços e detalhes enquanto aguardam o serviço." },
  ],
};

const faqItems: Record<string, { pergunta: string; resposta: string }[]> = {
  "Planilhas": [
    { pergunta: "Como importar dados de uma planilha?", resposta: "Acesse o menu Importar Dados, selecione o tipo de dado (clientes, produtos, etc.) e faça o upload da planilha no formato .xlsx ou .csv. O sistema irá mapear automaticamente as colunas." },
    { pergunta: "Como exportar relatórios em planilha?", resposta: "Em qualquer tela de relatórios, clique no botão 'Exportar' no canto superior direito e selecione o formato desejado (Excel ou CSV)." },
    { pergunta: "Qual o formato de planilha aceito?", resposta: "O sistema aceita planilhas nos formatos .xlsx (Excel) e .csv (valores separados por vírgula). Recomendamos usar .xlsx para evitar problemas de codificação de caracteres." },
  ],
  "Dúvidas sobre Notas Fiscais": [
    { pergunta: "Como configurar a emissão de NF-e?", resposta: "Acesse Fiscal > Configuração Fiscal, preencha os dados da empresa, vincule seu certificado digital A1 e configure a série e numeração da NF-e." },
    { pergunta: "Como cancelar uma nota fiscal?", resposta: "Na tela de Emissões Fiscais, localize a nota, clique no menu de ações e selecione 'Cancelar'. O cancelamento deve ser feito em até 24 horas após a emissão." },
    { pergunta: "Como emitir uma NF-e de devolução?", resposta: "Acesse Fiscal > NF-e Devolução. Informe o número da nota original, selecione os itens devolvidos e gere a nota de devolução referenciando a NF-e de origem." },
    { pergunta: "Como consultar notas emitidas?", resposta: "Acesse Fiscal > Emissões Fiscais. Use os filtros por período, status ou cliente para localizar notas. Clique na nota para ver detalhes, baixar XML ou DANFE." },
  ],
  "Certificado Digital": [
    { pergunta: "Qual tipo de certificado é aceito?", resposta: "O sistema aceita certificados digitais do tipo A1 (arquivo .pfx). Certificados A3 (token/cartão) não são suportados na versão atual." },
    { pergunta: "Como vincular meu certificado?", resposta: "Acesse Fiscal > Configuração Fiscal > Certificado Digital. Faça o upload do arquivo .pfx e insira a senha do certificado. O sistema validará automaticamente a validade." },
    { pergunta: "Como saber se meu certificado está vencido?", resposta: "Na Configuração Fiscal, o sistema exibe a data de validade do certificado vinculado. Você receberá alertas quando o certificado estiver próximo do vencimento." },
  ],
  "Dúvidas": [
    { pergunta: "Como alterar minha senha?", resposta: "Acesse Configurações > Minha Conta e clique em 'Alterar Senha'. Insira a senha atual e a nova senha desejada." },
    { pergunta: "Como adicionar um novo usuário?", resposta: "Acesse Configurações > Usuários e clique em 'Adicionar Usuário'. Preencha os dados e defina as permissões de acesso." },
    { pergunta: "Como personalizar as notificações?", resposta: "As notificações do sistema incluem alertas de contas a pagar vencidas e pendentes, estoque baixo e OS próximas do prazo. Clique no sino no topo da tela para visualizá-las." },
    { pergunta: "O sistema funciona em tablet e celular?", resposta: "Sim! O Otto Tech Sistemas é responsivo e funciona em tablets, celulares e computadores. Você pode acessar de qualquer dispositivo com navegador atualizado." },
  ],
  "Dúvidas sobre Vendas": [
    { pergunta: "Como registrar uma venda no PDV?", resposta: "Acesse o PDV, adicione os produtos pelo código de barras ou busca, selecione o cliente (opcional), escolha a forma de pagamento e finalize a venda." },
    { pergunta: "Como aplicar desconto em uma venda?", resposta: "No PDV, após adicionar os produtos, clique no campo de desconto e insira o valor ou percentual desejado antes de finalizar a venda." },
    { pergunta: "Como fazer venda parcelada?", resposta: "No PDV ou Venda Balcão, selecione a forma de pagamento que permite parcelamento (ex: Cartão de Crédito). Defina o número de parcelas e o sistema calculará o valor de cada parcela." },
    { pergunta: "Como imprimir cupom de venda?", resposta: "Após finalizar a venda, o sistema oferece a opção de imprimir o cupom. Configure sua impressora térmica como padrão para impressão automática." },
  ],
  "Impressoras": [
    { pergunta: "Quais impressoras são compatíveis?", resposta: "O sistema é compatível com impressoras térmicas de 58mm e 80mm via navegador (impressão direta pelo browser). Impressoras laser e jato de tinta também funcionam para relatórios e documentos A4." },
    { pergunta: "Como configurar a impressora térmica?", resposta: "Conecte a impressora via USB, instale o driver do fabricante e configure-a como impressora padrão no sistema operacional. O sistema usará a impressora padrão para impressões de recibos e cupons." },
    { pergunta: "A impressão não está funcionando, o que fazer?", resposta: "Verifique se a impressora está conectada e configurada como padrão. Teste uma impressão de teste pelo próprio sistema operacional. Se usar Chrome, verifique se o popup de impressão não está sendo bloqueado." },
  ],
};

// Merge tutoriais content into faqItems for unified display
const allContent = { ...faqItems, ...tutoriaisConteudo };

const CentralAjuda = () => {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);

  const guiasFiltrados = busca
    ? guiasRapidos.filter((g) => g.toLowerCase().includes(busca.toLowerCase()))
    : guiasRapidos;

  // Search across all content when typing
  const resultadosBusca = busca.length >= 3
    ? Object.entries(allContent).flatMap(([cat, items]) =>
        items
          .filter(i => i.pergunta.toLowerCase().includes(busca.toLowerCase()) || i.resposta.toLowerCase().includes(busca.toLowerCase()))
          .map(i => ({ ...i, categoria: cat }))
      )
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary border-b border-primary/20 px-6 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-white" />
          <span className="font-semibold text-white">Central de ajuda</span>
        </div>
        <div className="text-xs text-white/80 flex items-center gap-1">
          <span>Início</span> <ChevronRight className="h-3 w-3 text-white/60" /> <span>Central de ajuda</span> <ChevronRight className="h-3 w-3 text-white/60" /> <span>Listar</span>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-primary text-primary-foreground px-6 py-5">
        <h1 className="text-xl font-bold">Como podemos te ajudar?</h1>
        <p className="text-sm opacity-90 mt-1">Encontre aqui soluções e respostas rápidas para as perguntas mais frequentes dentro de cada categoria.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0 space-y-6">
          <div>
            <h3 className="font-bold text-sm text-foreground mb-2">Tutoriais</h3>
            <ul className="space-y-1">
              {tutoriais.map((t) => (
                <li key={t.label}>
                  <button
                    onClick={() => { setCategoriaAtiva(t.label); setBusca(""); }}
                    className={`flex items-center gap-2 text-xs transition-colors w-full text-left py-1 ${categoriaAtiva === t.label ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"}`}
                  >
                    <ChevronRight className="h-3 w-3" />
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm text-foreground mb-2">Perguntas Frequentes</h3>
            <ul className="space-y-1">
              {faqCategories.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => { setCategoriaAtiva(cat); setBusca(""); }}
                    className={`flex items-center gap-2 text-xs transition-colors w-full text-left py-1 ${categoriaAtiva === cat ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"}`}
                  >
                    <ChevronRight className="h-3 w-3" />
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm text-foreground mb-2">Acesso Remoto</h3>
            <ul>
              <li>
                <a href="https://www.teamviewer.com/pt-br/download/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors py-1">
                  <ChevronRight className="h-3 w-3" />
                  TeamViewer
                </a>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Pesquise a sua dúvida"
              value={busca}
              onChange={(e) => { setBusca(e.target.value); if (e.target.value.length >= 3) setCategoriaAtiva(null); }}
              className="flex-1"
            />
            <Button size="icon" variant="default">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Search results */}
          {busca.length >= 3 && !categoriaAtiva && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Resultados para "{busca}" ({resultadosBusca.length})</h2>
              {resultadosBusca.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {resultadosBusca.map((item, i) => (
                    <AccordionItem key={i} value={`search-${i}`}>
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center gap-2">
                          {item.pergunta}
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary text-white shrink-0">{item.categoria}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{item.resposta}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum resultado encontrado. Tente palavras-chave diferentes.</p>
              )}
            </div>
          )}

          {/* Category content */}
          {categoriaAtiva && allContent[categoriaAtiva] ? (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">{categoriaAtiva}</h2>
              <Accordion type="single" collapsible className="w-full">
                {allContent[categoriaAtiva].map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-sm">{item.pergunta}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{item.resposta}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setCategoriaAtiva(null)}>
                ← Voltar
              </Button>
            </div>
          ) : !busca && (
            <>
              {/* Guias rápidos */}
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <HelpCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground mb-2">Guias rápidos mais pesquisados:</h2>
                  <ul className="space-y-1">
                    {guiasFiltrados.map((g) => (
                      <li key={g} className="flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer">
                        <ChevronRight className="h-3 w-3 text-primary" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Suporte Remoto */}
              <div className="border-t border-border pt-6">
                <h2 className="text-lg font-bold text-foreground mb-2">Suporte Remoto</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Precisa de ajuda com suporte remoto? Baixe o TeamViewer para que possamos auxiliá-lo de forma rápida e eficiente.
                </p>
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => window.open("https://www.teamviewer.com/pt-br/download/", "_blank")}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Baixar TeamViewer
                </Button>
              </div>

              {/* Contato */}
              <div className="border-t border-border pt-6">
                <h2 className="text-lg font-bold text-foreground mb-3">Ainda precisa de ajuda?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-lg p-4 text-center space-y-2">
                    <Headphones className="h-8 w-8 text-primary mx-auto" />
                    <h3 className="font-semibold text-sm">Suporte por Chat</h3>
                    <p className="text-xs text-muted-foreground">Fale com nosso time pelo chat integrado do sistema.</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4 text-center space-y-2">
                    <ExternalLink className="h-8 w-8 text-primary mx-auto" />
                    <h3 className="font-semibold text-sm">WhatsApp</h3>
                    <p className="text-xs text-muted-foreground">Envie uma mensagem pelo WhatsApp para suporte rápido.</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4 text-center space-y-2">
                    <BookOpen className="h-8 w-8 text-primary mx-auto" />
                    <h3 className="font-semibold text-sm">Base de Conhecimento</h3>
                    <p className="text-xs text-muted-foreground">Acesse nossa documentação completa e tutoriais em vídeo.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CentralAjuda;
