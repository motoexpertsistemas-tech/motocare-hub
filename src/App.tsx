import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import TermosDeUso from "./pages/TermosDeUso";
import Dashboard from "./pages/Dashboard";
import OrdensServico from "./pages/OrdensServico";
import VendasBalcao from "./pages/VendasBalcao";
import VendaAtacado from "./pages/VendaAtacado";
import PDV from "./pages/PDV";
import PDVAtacado from "./pages/PDVAtacado";
import PesquisaPrecos from "./pages/PesquisaPrecos";
import Estoque from "./pages/Estoque";
import ProdutosDashboard from "./pages/ProdutosDashboard";
import EstoqueDashboard from "./pages/EstoqueDashboard";
import EditarProduto from "./pages/EditarProduto";
import ValoresVenda from "./pages/estoque/ValoresVenda";
import AjustarValoresMassa from "./pages/estoque/AjustarValoresMassa";
import Etiquetas from "./pages/estoque/Etiquetas";
import GruposProdutos from "./pages/estoque/GruposProdutos";
import CategoriasClientes from "./pages/cadastros/CategoriasClientes";
import UnidadesProdutos from "./pages/estoque/UnidadesProdutos";
import GradesVariacoes from "./pages/estoque/GradesVariacoes";
import CamposExtras from "./pages/estoque/CamposExtras";
import Movimentacoes from "./pages/estoque/Movimentacoes";
import Ajustes from "./pages/estoque/Ajustes";
import Transferencias from "./pages/estoque/Transferencias";
import Cotacoes from "./pages/estoque/Cotacoes";
import AdicionarCotacao from "./pages/estoque/AdicionarCotacao";
import Compras from "./pages/estoque/Compras";
import TrocasDevolucoes from "./pages/estoque/TrocasDevolucoes";
import SituacoesCompras from "./pages/estoque/SituacoesCompras";
import ModeloEmail from "./pages/estoque/ModeloEmail";
import ConfiguracoesEstoque from "./pages/estoque/ConfiguracoesEstoque";
import ImportarProdutos from "./pages/estoque/ImportarProdutos";
import ImportarXML from "./pages/estoque/ImportarXML";
import ConfiguracaoFiscal from "./pages/fiscal/ConfiguracaoFiscal";
import EmissoesFiscais from "./pages/fiscal/EmissoesFiscais";
import NFeDevolucao from "./pages/fiscal/NFeDevolucao";
import NFeAjuste from "./pages/fiscal/NFeAjuste";
import CalculadorasImpostos from "./pages/fiscal/CalculadorasImpostos";
import Financeiro from "./pages/Financeiro";
import ContasPagar from "./pages/financeiro/ContasPagar";
import ContasReceber from "./pages/financeiro/ContasReceber";
import BoletosBancarios from "./pages/financeiro/BoletosBancarios";
import Caixas from "./pages/financeiro/Caixas";
import ContasBancarias from "./pages/financeiro/ContasBancarias";
import FormasPagamento from "./pages/financeiro/FormasPagamento";
import SituacoesFinanceiro from "./pages/financeiro/SituacoesFinanceiro";
import ConciliacaoBancaria from "./pages/financeiro/ConciliacaoBancaria";
import TransferenciasFinanceiro from "./pages/financeiro/TransferenciasFinanceiro";
import CamposExtrasFinanceiro from "./pages/financeiro/CamposExtrasFinanceiro";
import Comissoes from "./pages/financeiro/Comissoes";
import PlanoContas from "./pages/financeiro/PlanoContas";
import FluxoCaixa from "./pages/financeiro/FluxoCaixa";
import OrcamentosProdutos from "./pages/orcamentos/OrcamentosProdutos";
import AdicionarOrcamento from "./pages/orcamentos/AdicionarOrcamento";

import Ecommerce from "./pages/Ecommerce";
import ConfigEcommerce from "./pages/ConfigEcommerce";
import ProdutosVitrine from "./pages/ecommerce/ProdutosVitrine";
import EcommerceLogin from "./pages/ecommerce/EcommerceLogin";
import MinhaConta from "./pages/ecommerce/MinhaConta";
import { EcommerceAuthProvider } from "./contexts/EcommerceAuthContext";
import Configuracoes from "./pages/Configuracoes";
import AuditLog from "./pages/AuditLog";
import Fidelidade from "./pages/Fidelidade";
// Analytics merged into Dashboard
import LGPD from "./pages/LGPD";
import Sustentabilidade from "./pages/Sustentabilidade";
import Quiosque from "./pages/Quiosque";
import SituacoesOS from "./pages/os/SituacoesOS";
import RevisoesAgendadas from "./pages/os/RevisoesAgendadas";
import AtendimentoExpress from "./pages/AtendimentoExpress";
import AgendarPublico from "./pages/AgendarPublico";
import Clientes from "./pages/Clientes";
import NovoCliente from "./pages/clientes/NovoCliente";
import ImportarClientes from "./pages/clientes/ImportarClientes";
import Fornecedores from "./pages/Fornecedores";
import Marketplaces from "./pages/Marketplaces";
import CanaisVenda from "./pages/marketplaces/CanaisVenda";
import MarketplaceDetalhe from "./pages/marketplaces/MarketplaceDetalhe";
import CalculadoraLucro from "./pages/marketplaces/CalculadoraLucro";
import MeusProdutosMarketplace from "./pages/marketplaces/MeusProdutosMarketplace";
import PedidosMarketplace from "./pages/marketplaces/PedidosMarketplace";
import RelatorioERP from "./pages/marketplaces/RelatorioERP";
import TransportadorasMarketplace from "./pages/marketplaces/TransportadorasMarketplace";
import NovaOrdemServico from "./pages/NovaOrdemServico";
import DetalhesOrdemServico from "./pages/DetalhesOrdemServico";
import Servicos from "./pages/Servicos";
import AdicionarServico from "./pages/servicos/AdicionarServico";
import CustoHomemHora from "./pages/servicos/CustoHomemHora";
import TabelaPrecos from "./pages/servicos/TabelaPrecos";
import AgendaOS from "./pages/AgendaOS";
import Funcionarios from "./pages/cadastros/Funcionarios";
import Transportadoras from "./pages/cadastros/Transportadoras";
import GestaoOperacional from "./pages/gestao-operacional/GestaoOperacional";
import SetorDetalhe from "./pages/gestao-operacional/SetorDetalhe";
import RelatorioTarefas from "./pages/gestao-operacional/RelatorioTarefas";
import DREGerencial from "./pages/relatorios/DREGerencial";
import RelatoriosVendas from "./pages/relatorios/RelatoriosVendas";
import RelOrcamentos from "./pages/relatorios/RelOrcamentos";
import RelVendas from "./pages/relatorios/RelVendas";
import RelProdutosVendidos from "./pages/relatorios/RelProdutosVendidos";
import RelDevolucoes from "./pages/relatorios/RelDevolucoes";
import RelProdutosDevolvidos from "./pages/relatorios/RelProdutosDevolvidos";
import RelServicosPrestados from "./pages/relatorios/RelServicosPrestados";
import RelClientesMaisCompram from "./pages/relatorios/RelClientesMaisCompram";
import RelComissaoVenda from "./pages/relatorios/RelComissaoVenda";
import RelComissaoProduto from "./pages/relatorios/RelComissaoProduto";
import RelComissaoServico from "./pages/relatorios/RelComissaoServico";
import RelCurvaABC from "./pages/relatorios/RelCurvaABC";
import RelatoriosEstoque from "./pages/relatorios/RelatoriosEstoque";
import RelCotacoesEstoque from "./pages/relatorios/RelCotacoesEstoque";
import RelInventarioEstoque from "./pages/relatorios/RelInventarioEstoque";
import RelEstoqueProdutos from "./pages/relatorios/RelEstoqueProdutos";
import RelProdutosComprados from "./pages/relatorios/RelProdutosComprados";
import RelServicosContratados from "./pages/relatorios/RelServicosContratados";
import RelatoriosFinanceiros from "./pages/relatorios/RelatoriosFinanceiros";
import RelExtrato from "./pages/relatorios/RelExtrato";
import RelContasPagar from "./pages/relatorios/RelContasPagar";
import RelContasReceber from "./pages/relatorios/RelContasReceber";
import RelComissaoVendedores from "./pages/relatorios/RelComissaoVendedores";
import RelPlanoContas from "./pages/relatorios/RelPlanoContas";
import RelContasBancarias from "./pages/relatorios/RelContasBancarias";
import RelatoriosOS from "./pages/relatorios/RelatoriosOS";
import RelOrdensServico from "./pages/relatorios/RelOrdensServico";
import RelEquipamentos from "./pages/relatorios/RelEquipamentos";
import RelSituacaoTempo from "./pages/relatorios/RelSituacaoTempo";
import RelComissaoVendedoresOS from "./pages/relatorios/RelComissaoVendedoresOS";
import RelComissaoTecnicos from "./pages/relatorios/RelComissaoTecnicos";
import RelatoriosCadastros from "./pages/relatorios/RelatoriosCadastros";
import RelClientesCadastro from "./pages/relatorios/RelClientesCadastro";
import RelAniversariantes from "./pages/relatorios/RelAniversariantes";
import RelFuncionariosCadastro from "./pages/relatorios/RelFuncionariosCadastro";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEmpresas from "./pages/admin/AdminEmpresas";
import AdminEmpresaDetalhes from "./pages/admin/AdminEmpresaDetalhes";
import AdminAssinaturas from "./pages/admin/AdminAssinaturas";
import AdminFaturas from "./pages/admin/AdminFaturas";
import AdminCupons from "./pages/admin/AdminCupons";
import AdminAfiliados from "./pages/admin/AdminAfiliados";
import AdminAfiliadoDetalhes from "./pages/admin/AdminAfiliadoDetalhes";
import AdminAfiliadosPagamentos from "./pages/admin/AdminAfiliadosPagamentos";
import EmpresaPublica from "./pages/EmpresaPublica";
import MeuPlano from "./pages/MeuPlano";
import Filiais from "./pages/filiais/Filiais";
import EstoqueFilial from "./pages/filiais/EstoqueFilial";
import EstoqueConsolidado from "./pages/filiais/EstoqueConsolidado";
import CentralAjuda from "./pages/CentralAjuda";
import NotFound from "./pages/NotFound";
import { EmpresaProvider } from "./contexts/EmpresaContext";
import { BranchProvider } from "./contexts/BranchContext";
import { AdminGuard } from "./components/AdminGuard";
import { AuthGuard } from "./components/AuthGuard";
import { SubdomainRouter } from "./components/SubdomainRouter";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.documentElement.style.colorScheme = "light";

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <EmpresaProvider>
    <BranchProvider>
    <EcommerceAuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SubdomainRouter>
        <Routes>
          {/* Public pages - no sidebar */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/termos-de-uso" element={<TermosDeUso />} />
          <Route path="/quiosque" element={<Quiosque />} />
          <Route path="/app/:slug" element={<EmpresaPublica />} />
          <Route path="/agendar/:slug" element={<AgendarPublico />} />
          
          {/* Main app with sidebar - protected by AuthGuard */}
          <Route path="*" element={
            <AuthGuard>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/os" element={<OrdensServico />} />
                <Route path="/os/agenda" element={<AgendaOS />} />
                <Route path="/os/revisoes-agendadas" element={<RevisoesAgendadas />} />
                <Route path="/os/situacoes" element={<SituacoesOS />} />
                <Route path="/os/nova" element={<NovaOrdemServico />} />
                <Route path="/os/:id" element={<DetalhesOrdemServico />} />
                <Route path="/servicos" element={<Servicos />} />
                <Route path="/servicos/novo" element={<AdicionarServico />} />
                <Route path="/servicos/editar/:id" element={<AdicionarServico />} />
                <Route path="/servicos/custo-homem-hora" element={<CustoHomemHora />} />
                <Route path="/servicos/tabela-precos" element={<TabelaPrecos />} />
                <Route path="/pdv" element={<PDV />} />
                <Route path="/vendas-balcao" element={<VendasBalcao />} />
                <Route path="/vendas-balcao/vender" element={<PDV />} />
                <Route path="/venda-atacado" element={<VendaAtacado />} />
                <Route path="/venda-atacado/vender" element={<PDVAtacado />} />
                <Route path="/pdv/precos" element={<PesquisaPrecos />} />
                <Route path="/atendimento-express" element={<AtendimentoExpress />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/clientes/novo" element={<NovoCliente />} />
                <Route path="/clientes/importar" element={<ImportarClientes />} />
                <Route path="/fornecedores" element={<Fornecedores />} />
                <Route path="/cadastros/funcionarios" element={<Funcionarios />} />
                <Route path="/cadastros/transportadoras" element={<Transportadoras />} />
                <Route path="/produtos" element={<ProdutosDashboard />} />
                <Route path="/estoque-hub" element={<EstoqueDashboard />} />
                <Route path="/estoque" element={<Estoque />} />
                <Route path="/estoque/novo" element={<EditarProduto />} />
                <Route path="/estoque/editar/:id" element={<EditarProduto />} />
                <Route path="/estoque/valores-venda" element={<ValoresVenda />} />
                <Route path="/estoque/ajustar-massa" element={<AjustarValoresMassa />} />
                <Route path="/estoque/etiquetas" element={<Etiquetas />} />
                <Route path="/estoque/grupos" element={<GruposProdutos />} />
                <Route path="/cadastros/categorias" element={<CategoriasClientes />} />
                <Route path="/estoque/unidades" element={<UnidadesProdutos />} />
                <Route path="/estoque/grades" element={<GradesVariacoes />} />
                <Route path="/estoque/campos-extras" element={<CamposExtras />} />
                <Route path="/estoque/movimentacoes" element={<Movimentacoes />} />
                <Route path="/estoque/ajustes" element={<Ajustes />} />
                <Route path="/estoque/transferencias" element={<Transferencias />} />
                <Route path="/estoque/cotacoes" element={<Cotacoes />} />
                <Route path="/estoque/cotacoes/adicionar" element={<AdicionarCotacao />} />
                <Route path="/estoque/compras" element={<Compras />} />
                <Route path="/estoque/trocas" element={<TrocasDevolucoes />} />
                <Route path="/estoque/situacoes-compras" element={<SituacoesCompras />} />
                <Route path="/estoque/importar-produtos" element={<ImportarProdutos />} />
                <Route path="/estoque/importar-xml" element={<ImportarXML />} />
                <Route path="/estoque/modelo-email" element={<ModeloEmail />} />
                <Route path="/estoque/configuracoes" element={<ConfiguracoesEstoque />} />
                <Route path="/orcamentos/produtos" element={<OrcamentosProdutos />} />
                <Route path="/orcamentos/produtos/" element={<OrcamentosProdutos />} />
                <Route path="/orcamentos/produtos/adicionar" element={<AdicionarOrcamento />} />
                <Route path="/orcamentos/produtos/editar/:id" element={<AdicionarOrcamento />} />
                <Route path="/fiscal/configuracao" element={<ConfiguracaoFiscal />} />
                <Route path="/fiscal/emissoes" element={<EmissoesFiscais />} />
                <Route path="/fiscal/nfe-devolucao" element={<NFeDevolucao />} />
                <Route path="/fiscal/nfe-ajuste" element={<NFeAjuste />} />
                <Route path="/fiscal/calculadoras" element={<CalculadorasImpostos />} />
                <Route path="/fiscal/calculadoras/" element={<CalculadorasImpostos />} />
                <Route path="/fiscal/calculadoras/*" element={<CalculadorasImpostos />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/financeiro/contas-pagar" element={<ContasPagar />} />
                <Route path="/financeiro/contas-receber" element={<ContasReceber />} />
                <Route path="/financeiro/boletos" element={<BoletosBancarios />} />
                <Route path="/financeiro/caixas" element={<Caixas />} />
                <Route path="/financeiro/contas-bancarias" element={<ContasBancarias />} />
                <Route path="/financeiro/formas-pagamento" element={<FormasPagamento />} />
                <Route path="/financeiro/situacoes" element={<SituacoesFinanceiro />} />
                <Route path="/financeiro/conciliacao" element={<ConciliacaoBancaria />} />
                <Route path="/financeiro/transferencias" element={<TransferenciasFinanceiro />} />
                <Route path="/financeiro/campos-extras" element={<CamposExtrasFinanceiro />} />
                <Route path="/financeiro/comissoes" element={<Comissoes />} />
                <Route path="/financeiro/plano-contas" element={<PlanoContas />} />
                <Route path="/financeiro/fluxo-caixa" element={<FluxoCaixa />} />
                
                <Route path="/ecommerce" element={<Ecommerce />} />
                <Route path="/ecommerce/produtos-vitrine" element={<ProdutosVitrine />} />
                <Route path="/ecommerce/config" element={<ConfigEcommerce />} />
                <Route path="/ecommerce/login" element={<EcommerceLogin />} />
                <Route path="/ecommerce/minha-conta" element={<MinhaConta />} />
                <Route path="/marketplaces" element={<Marketplaces />} />
                <Route path="/marketplaces/canais-venda" element={<CanaisVenda />} />
                <Route path="/marketplaces/calculadora" element={<CalculadoraLucro />} />
                <Route path="/marketplaces/meus-produtos" element={<MeusProdutosMarketplace />} />
                <Route path="/marketplaces/pedidos" element={<PedidosMarketplace />} />
                <Route path="/marketplaces/relatorio-erp" element={<RelatorioERP />} />
                <Route path="/marketplaces/transportadoras" element={<TransportadorasMarketplace />} />
                <Route path="/marketplaces/:slug" element={<MarketplaceDetalhe />} />
                <Route path="/config" element={<Configuracoes />} />
                <Route path="/meu-plano" element={<MeuPlano />} />
                <Route path="/filiais" element={<Filiais />} />
                <Route path="/filiais/estoque" element={<EstoqueFilial />} />
                <Route path="/filiais/estoque/consolidado" element={<EstoqueConsolidado />} />
                <Route path="/auditoria" element={<AuditLog />} />
                <Route path="/fidelidade" element={<Fidelidade />} />
                <Route path="/analytics" element={<Dashboard />} />
                <Route path="/lgpd" element={<LGPD />} />
                <Route path="/relatorios/dre" element={<DREGerencial />} />
                <Route path="/relatorios/vendas" element={<RelatoriosVendas />} />
                <Route path="/relatorios/vendas/orcamentos" element={<RelOrcamentos />} />
                <Route path="/relatorios/vendas/vendas" element={<RelVendas />} />
                <Route path="/relatorios/vendas/produtos-vendidos" element={<RelProdutosVendidos />} />
                <Route path="/relatorios/vendas/devolucoes" element={<RelDevolucoes />} />
                <Route path="/relatorios/vendas/produtos-devolvidos" element={<RelProdutosDevolvidos />} />
                <Route path="/relatorios/vendas/servicos-prestados" element={<RelServicosPrestados />} />
                <Route path="/relatorios/vendas/clientes-mais-compram" element={<RelClientesMaisCompram />} />
                <Route path="/relatorios/vendas/comissao-venda" element={<RelComissaoVenda />} />
                <Route path="/relatorios/vendas/comissao-produto" element={<RelComissaoProduto />} />
                <Route path="/relatorios/vendas/comissao-servico" element={<RelComissaoServico />} />
                <Route path="/relatorios/vendas/curva-abc" element={<RelCurvaABC />} />
                <Route path="/relatorios/estoque" element={<RelatoriosEstoque />} />
                <Route path="/relatorios/estoque/cotacoes" element={<RelCotacoesEstoque />} />
                <Route path="/relatorios/estoque/inventario" element={<RelInventarioEstoque />} />
                <Route path="/relatorios/estoque/estoque" element={<RelEstoqueProdutos />} />
                <Route path="/relatorios/estoque/produtos" element={<RelEstoqueProdutos />} />
                <Route path="/relatorios/estoque/produtos-comprados" element={<RelProdutosComprados />} />
                <Route path="/relatorios/estoque/servicos-contratados" element={<RelServicosContratados />} />
                <Route path="/relatorios/estoque/compras" element={<RelProdutosComprados />} />
                <Route path="/relatorios/financeiro" element={<RelatoriosFinanceiros />} />
                <Route path="/relatorios/financeiro/extrato" element={<RelExtrato />} />
                <Route path="/relatorios/financeiro/contas-pagar" element={<RelContasPagar />} />
                <Route path="/relatorios/financeiro/contas-receber" element={<RelContasReceber />} />
                <Route path="/relatorios/financeiro/comissao-vendedores" element={<RelComissaoVendedores />} />
                <Route path="/relatorios/comissoes" element={<RelComissaoVendedores />} />
                <Route path="/relatorios/financeiro/plano-contas" element={<RelPlanoContas />} />
                <Route path="/relatorios/financeiro/contas-bancarias" element={<RelContasBancarias />} />
                <Route path="/relatorios/clientes" element={<RelatoriosCadastros />} />
                <Route path="/relatorios/clientes/clientes" element={<RelClientesCadastro />} />
                <Route path="/relatorios/clientes/aniversariantes" element={<RelAniversariantes />} />
                <Route path="/relatorios/clientes/funcionarios" element={<RelFuncionariosCadastro />} />
                <Route path="/relatorios/os" element={<RelatoriosOS />} />
                <Route path="/relatorios/os/ordens" element={<RelOrdensServico />} />
                <Route path="/relatorios/os/equipamentos" element={<RelEquipamentos />} />
                <Route path="/relatorios/os/situacao-tempo" element={<RelSituacaoTempo />} />
                <Route path="/relatorios/os/comissao-vendedores" element={<RelComissaoVendedoresOS />} />
                <Route path="/relatorios/os/comissao-tecnicos" element={<RelComissaoTecnicos />} />
                <Route path="/inovacao" element={<Sustentabilidade />} />
                <Route path="/gestao-operacional" element={<GestaoOperacional />} />
                <Route path="/gestao-operacional/relatorio" element={<RelatorioTarefas />} />
                <Route path="/gestao-operacional/:setorId" element={<SetorDetalhe />} />
                <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
                <Route path="/admin/empresas" element={<AdminGuard><AdminEmpresas /></AdminGuard>} />
                <Route path="/admin/empresas/:id" element={<AdminGuard><AdminEmpresaDetalhes /></AdminGuard>} />
                <Route path="/admin/assinaturas" element={<AdminGuard><AdminAssinaturas /></AdminGuard>} />
                <Route path="/admin/faturas" element={<AdminGuard><AdminFaturas /></AdminGuard>} />
                <Route path="/admin/cupons" element={<AdminGuard><AdminCupons /></AdminGuard>} />
                <Route path="/admin/afiliados" element={<AdminGuard><AdminAfiliados /></AdminGuard>} />
                <Route path="/admin/afiliados/pagamentos" element={<AdminGuard><AdminAfiliadosPagamentos /></AdminGuard>} />
                <Route path="/admin/afiliados/:id" element={<AdminGuard><AdminAfiliadoDetalhes /></AdminGuard>} />
                <Route path="/central-ajuda" element={<CentralAjuda />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
            </AuthGuard>
          } />
        </Routes>
        </SubdomainRouter>
      </BrowserRouter>
    </TooltipProvider>
    </EcommerceAuthProvider>
    </BranchProvider>
    </EmpresaProvider>
   </QueryClientProvider>
  );
};

export default App;
