import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { OnboardingModal } from "@/components/OnboardingModal";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { dreCategorias, meses as dreMeses } from "@/pages/relatorios/dreData";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDashboardKPIs,
  useBalancoFinanceiro,
  useOperacionalData,
  useTopProdutos,
  useTopServicos,
  useRecentOS,
  useLowStock,
} from "@/hooks/useDashboardData";
import {
  DollarSign,
  Wrench,
  Package,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Users,
  Target,
  PieChart as PieIcon,
  Activity,
  Zap,
  Eye,
  Store,
  MessageSquare,
  Filter,
  CreditCard,
  Repeat,
  Clock,
  Globe,
  Truck,
  Sparkles,
  Settings2,
  Receipt,
  Banknote,
  ShoppingBag,
  ArrowDownLeft,
  Trophy,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EstatisticasTab from "@/components/EstatisticasTab";
import { AssistenteIAPanel } from "@/components/AssistenteIAPanel";
import { EditMetaDialog, type MetaData } from "@/components/EditMetaDialog";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Legend,
} from "recharts";

// ── Tooltip style ──
const tooltipStyle = {
  backgroundColor: "hsl(225, 22%, 11%)",
  border: "1px solid hsl(225, 18%, 18%)",
  borderRadius: "8px",
  color: "hsl(220, 15%, 92%)",
};

// ── Hardcoded data removed — now loaded from Supabase hooks ──

// ── Detalhamento Operacional tabs config ──
type OperacionalTab = "compras" | "vendas" | "recebimentos" | "pagamentos";
const operacionalTabs: { key: OperacionalTab; label: string; icon: typeof ShoppingBag; color: string }[] = [
  { key: "compras", label: "Compras", icon: ShoppingBag, color: "hsl(340, 60%, 40%)" },
  { key: "vendas", label: "Vendas", icon: Store, color: "hsl(210, 70%, 50%)" },
  { key: "recebimentos", label: "Recebimentos", icon: ArrowDownLeft, color: "hsl(150, 60%, 45%)" },
  { key: "pagamentos", label: "Pagamentos", icon: Banknote, color: "hsl(15, 80%, 55%)" },
];

// ── Resumo por canal de venda (vinculado ao DRE) ──
function getCanaisVendaDRE() {
  let mesIdx = dreMeses.length - 1;
  for (let i = dreMeses.length - 1; i >= 0; i--) {
    const rec = dreCategorias.find(c => c.id === "1T");
    if (rec && rec.valores[i] !== 0) { mesIdx = i; break; }
  }
  const canaisDRE = [
    { id: "1.1", canal: "Venda Balcão", color: "hsl(210, 70%, 50%)" },
    { id: "1.2", canal: "Venda Ordem de Serviço", color: "hsl(3, 62%, 46%)" },
    { id: "1.3", canal: "Venda Atacado", color: "hsl(150, 60%, 45%)" },
    { id: "1.4", canal: "Venda E-Commerce", color: "hsl(280, 60%, 55%)" },
    { id: "1.5", canal: "Venda Marketplaces", color: "hsl(340, 70%, 50%)" },
  ];
  const totalRec = dreCategorias.find(c => c.id === "1T")?.valores[mesIdx] || 0;
  return canaisDRE.map(ch => {
    const cat = dreCategorias.find(c => c.id === ch.id);
    const valor = cat?.valores[mesIdx] || 0;
    const pct = totalRec > 0 ? Math.round((valor / totalRec) * 100) : 0;
    return { ...ch, valor, pct };
  });
}
const canaisVenda = getCanaisVendaDRE();

// ── Analytics data ──
const vendasMensais: { mes: string; balcao: number; os: number; atacado: number; ecommerce: number; marketplaces: number; total: number }[] = [];

const canalVendas: { name: string; value: number; color: string }[] = [];

const rfmSegmentos = [
  { segmento: "Campeões", clientes: 0, receita: "R$ 0", cor: "hsl(3, 62%, 46%)", pct: 0 },
  { segmento: "Leais", clientes: 0, receita: "R$ 0", cor: "hsl(45, 90%, 55%)", pct: 0 },
  { segmento: "Potenciais", clientes: 0, receita: "R$ 0", cor: "hsl(200, 70%, 50%)", pct: 0 },
  { segmento: "Em Risco", clientes: 0, receita: "R$ 0", cor: "hsl(0, 72%, 51%)", pct: 0 },
  { segmento: "Hibernando", clientes: 0, receita: "R$ 0", cor: "hsl(220, 10%, 55%)", pct: 0 },
  { segmento: "Novos", clientes: 0, receita: "R$ 0", cor: "hsl(150, 60%, 45%)", pct: 0 },
];

const clvData = [
  { segmento: "Platina", clv: 0, clientes: 0 },
  { segmento: "Ouro", clv: 0, clientes: 0 },
  { segmento: "Prata", clv: 0, clientes: 0 },
  { segmento: "Bronze", clv: 0, clientes: 0 },
];

const abcProdutos: { nome: string; vendas: number; classe: string; pctAcum: number; pct: number; qtd: number; unitario: number; acumulado: number }[] = [];

const cohortData: { cohort: string; mes1: number; mes2: number | null; mes3: number | null; mes4: number | null; mes5: number | null; mes6: number | null }[] = [];

const anomalias: { tipo: string; severidade: string; titulo: string; desc: string; acoes: string[]; timestamp: string }[] = [];

type CanalKey = "todos" | "balcao" | "os" | "atacado" | "ecommerce" | "marketplaces";

const canaisInfo: Record<CanalKey, { label: string; icon: typeof ShoppingCart; color: string }> = {
  todos: { label: "Todos os Canais", icon: BarChart3, color: "hsl(3, 62%, 46%)" },
  balcao: { label: "Balcão", icon: ShoppingCart, color: "hsl(3, 62%, 46%)" },
  os: { label: "Ordem de Serviço", icon: Wrench, color: "hsl(200, 70%, 50%)" },
  atacado: { label: "Atacado", icon: Truck, color: "hsl(45, 90%, 55%)" },
  ecommerce: { label: "E-commerce", icon: Store, color: "hsl(150, 60%, 45%)" },
  marketplaces: { label: "Marketplaces", icon: Globe, color: "hsl(280, 60%, 55%)" },
};

const canalInsights: Record<Exclude<CanalKey, "todos">, { receita: string; ticketMedio: string; transacoes: number; crescimento: string; up: boolean; topProdutos: string[]; formaPagamento: { forma: string; pct: number }[]; taxaRetorno: string; tempoMedio: string }> = {
  balcao: { receita: "R$ 0", ticketMedio: "R$ 0", transacoes: 0, crescimento: "0%", up: false, topProdutos: [], formaPagamento: [], taxaRetorno: "0%", tempoMedio: "—" },
  os: { receita: "R$ 0", ticketMedio: "R$ 0", transacoes: 0, crescimento: "0%", up: false, topProdutos: [], formaPagamento: [], taxaRetorno: "0%", tempoMedio: "—" },
  atacado: { receita: "R$ 0", ticketMedio: "R$ 0", transacoes: 0, crescimento: "0%", up: false, topProdutos: [], formaPagamento: [], taxaRetorno: "0%", tempoMedio: "—" },
  ecommerce: { receita: "R$ 0", ticketMedio: "R$ 0", transacoes: 0, crescimento: "0%", up: false, topProdutos: [], formaPagamento: [], taxaRetorno: "0%", tempoMedio: "—" },
  marketplaces: { receita: "R$ 0", ticketMedio: "R$ 0", transacoes: 0, crescimento: "0%", up: false, topProdutos: [], formaPagamento: [], taxaRetorno: "0%", tempoMedio: "—" },
};

const classeColors: Record<string, string> = { A: "text-primary bg-primary/15", B: "text-warning bg-warning/15", C: "text-muted-foreground bg-secondary" };
const severidadeStyles: Record<string, { bg: string; text: string; label: string }> = {
  alta: { bg: "bg-destructive/15", text: "text-destructive", label: "Alta" },
  media: { bg: "bg-warning/15", text: "text-warning", label: "Média" },
  baixa: { bg: "bg-info/15", text: "text-info", label: "Baixa" },
};

// ── Components ──
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Em Execução": "bg-primary/15 text-primary",
    "Aguardando Peças": "bg-warning/15 text-warning",
    "Pronta": "bg-success/15 text-success",
    "Entregue": "bg-muted text-muted-foreground",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}>{status}</span>;
}

function useEstoqueCount() {
  return useQuery({
    queryKey: ["dashboard_estoque_count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("produtos_catalogo").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function useFormasPagamentoDashboard() {
  return useQuery({
    queryKey: ["dashboard_formas_pagamento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formas_pagamento")
        .select("id, nome, modalidade, disponivel_recebimentos")
        .eq("ativo", true)
        .eq("disponivel_recebimentos", true)
        .order("nome");
      if (error) throw error;

      const iconMap: Record<string, string> = {
        dinheiro: "💵",
        pix: "📱",
        credito: "💳",
        debito: "💳",
        boleto: "📄",
      };

      return (data || []).map((fp) => {
        const modalLower = (fp.modalidade || fp.nome || "").toLowerCase();
        const icon = Object.entries(iconMap).find(([k]) => modalLower.includes(k))?.[1] || "💰";
        return {
          forma: fp.nome,
          transacoes: 0,
          valor: 0,
          variacao: 0,
          icon,
        };
      });
    },
  });
}

const TIPOS_PEDIDO = [
  { value: "todos", label: "Todos os pedidos" },
  { value: "balcao", label: "Balcão" },
  { value: "os", label: "Ordens de Serviço" },
  { value: "atacado", label: "Atacado" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "marketplace", label: "Marketplaces" },
];

const MESES_OPTIONS = () => {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = format(d, "yyyy-MM");
    const label = format(d, "MMMM 'de' yyyy", { locale: ptBR });
    options.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
};

export default function Dashboard() {
  const [tab, setTab] = useState("resumo");
  const [canalFiltro, setCanalFiltro] = useState<CanalKey>("todos");
  const [opTab, setOpTab] = useState<OperacionalTab>("compras");
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);
  const [metaData, setMetaData] = useState<MetaData & { faturado: number; diasRestantes: number }>({
    nome: "META DO MÊS",
    valor: 150000,
    dataInicio: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
    dataFim: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd"),
    situacao: "ativa" as const,
    observacao: "",
    faturado: 0,
    diasRestantes: 0,
  });
  const [tipoPedido, setTipoPedido] = useState("todos");
  const [mesSelecionado, setMesSelecionado] = useState(format(new Date(), "yyyy-MM"));
  const [tipoPedidoOpen, setTipoPedidoOpen] = useState(false);
  const [mesOpen, setMesOpen] = useState(false);
  const [periodoBalanco, setPeriodoBalanco] = useState("12meses");
  const [periodoBalancoOpen, setPeriodoBalancoOpen] = useState(false);

  // Ranking vendedores
  const [rankingVendedores, setRankingVendedores] = useState<{ vendedor: string; canal: string; total: number; qtd: number }[]>([]);
  // Ranking mecânicos
  const [rankingMecanicos, setRankingMecanicos] = useState<{ mecanico: string; canal: string; total: number; qtd: number }[]>([]);

  useEffect(() => {
    async function carregarRanking() {
      // Calculate month range from mesSelecionado (format: "yyyy-MM")
      const [ano, mes] = mesSelecionado.split("-").map(Number);
      const inicioMes = new Date(ano, mes - 1, 1).toISOString();
      const fimMes = new Date(ano, mes, 1).toISOString();

      const { data } = await supabase
        .from("ordem_servico")
        .select("vendedor, canal_venda, valor_total, tecnico_responsavel")
        .gt("valor_total", 0)
        .gte("created_at", inicioMes)
        .lt("created_at", fimMes);

      const mapVend = new Map<string, { vendedor: string; canal: string; total: number; qtd: number }>();
      const mapMec = new Map<string, { mecanico: string; canal: string; total: number; qtd: number }>();

      const normCanal = (c: string | null) => {
        const raw = (c || "balcao").toLowerCase().trim();
        if (raw === "presencial" || raw === "balcão") return "balcao";
        if (raw === "ordem de serviço" || raw === "ordem_servico") return "os";
        return raw;
      };

      for (const row of (data || [])) {
        const canal = normCanal(row.canal_venda);
        const v = (row.vendedor || "").trim();
        if (v) {
          const key = `${v}||${canal}`;
          const entry = mapVend.get(key) || { vendedor: v, canal, total: 0, qtd: 0 };
          entry.total += row.valor_total || 0;
          entry.qtd += 1;
          mapVend.set(key, entry);
        }
        const m = (row.tecnico_responsavel || "").trim();
        if (m) {
          const keyM = `${m}||${canal}`;
          const entry = mapMec.get(keyM) || { mecanico: m, canal, total: 0, qtd: 0 };
          entry.total += row.valor_total || 0;
          entry.qtd += 1;
          mapMec.set(keyM, entry);
        }
      }
      setRankingVendedores(Array.from(mapVend.values()).sort((a, b) => b.total - a.total));
      setRankingMecanicos(Array.from(mapMec.values()).sort((a, b) => b.total - a.total));
    }
    carregarRanking();
  }, [mesSelecionado]);
  const PERIODOS_BALANCO = [
    { value: "mes_passado", label: "Mês passado", meses: 1 },
    { value: "este_mes", label: "Este mês", meses: 1 },
    { value: "6meses", label: "Últimos 6 meses", meses: 6 },
    { value: "12meses", label: "Últimos 12 meses", meses: 12 },
  ];

  // Real data hooks
  const { data: kpisData, isLoading: kpisLoading } = useDashboardKPIs(mesSelecionado);
  const { data: balancoData = [], isLoading: balancoLoading } = useBalancoFinanceiro();
  const { data: opData, isLoading: opLoading } = useOperacionalData();
  const { data: topProdutosData = [], isLoading: topProdLoading } = useTopProdutos(mesSelecionado);
  const { data: topServicosData = [], isLoading: topServLoading } = useTopServicos(mesSelecionado);
  const { data: recentOSData = [] } = useRecentOS();
  const { data: lowStockData = [] } = useLowStock();

  // Update meta faturado when KPIs load
  useEffect(() => {
    if (kpisData) {
      const now = new Date();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const diasRestantes = lastDay - now.getDate();
      setMetaData(prev => ({ ...prev, faturado: kpisData.faturamento, diasRestantes }));
    }
  }, [kpisData]);

  const balancoFiltrado = (() => {
    if (periodoBalanco === "mes_passado") return balancoData.slice(-2, -1);
    if (periodoBalanco === "este_mes") return balancoData.slice(-1);
    if (periodoBalanco === "6meses") return balancoData.slice(-6);
    return balancoData;
  })();
  const { data: estoqueCount } = useEstoqueCount();
  const { data: formasPagamento = [] } = useFormasPagamentoDashboard();

  const { empresaId } = useEmpresa();

  const { data: empresaNome } = useQuery({
    queryKey: ["empresa-nome", empresaId],
    queryFn: async () => {
      if (!empresaId) return null;
      const { data } = await supabase
        .from("empresas")
        .select("nome_fantasia, nome")
        .eq("id", empresaId)
        .maybeSingle();
      return data?.nome_fantasia || data?.nome || "Minha Empresa";
    },
    enabled: !!empresaId,
  });

  const saudacao = useMemo(() => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return "Bom dia";
    if (hora >= 12 && hora < 18) return "Boa tarde";
    return "Boa noite";
  }, []);


  const mesesOptions = useMemo(() => MESES_OPTIONS(), []);

  const pctMeta = Math.min((metaData.faturado / metaData.valor) * 100, 100);
  const faltam = metaData.valor - metaData.faturado;

  return (
    <div className="space-y-6">
      <OnboardingModal />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{saudacao}, {empresaNome || "..."}</h1>
        </div>
        <div className="flex gap-2">
          <Popover open={tipoPedidoOpen} onOpenChange={setTipoPedidoOpen}>
            <PopoverTrigger asChild>
              <Button variant="default" size="sm" className="min-w-[160px] justify-between">
                {TIPOS_PEDIDO.find((t) => t.value === tipoPedido)?.label} <span className="ml-1">▾</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-1" align="end">
              {TIPOS_PEDIDO.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setTipoPedido(t.value); setTipoPedidoOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${tipoPedido === t.value ? "bg-primary/10 font-semibold text-primary" : ""}`}
                >
                  {t.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <Popover open={mesOpen} onOpenChange={setMesOpen}>
            <PopoverTrigger asChild>
              <Button variant="default" size="sm" className="min-w-[180px] justify-between">
                {mesesOptions.find((m) => m.value === mesSelecionado)?.label} <span className="ml-1">▾</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1 max-h-[300px] overflow-y-auto" align="end">
              {mesesOptions.map((m) => (
                <button
                  key={m.value}
                  onClick={() => { setMesSelecionado(m.value); setMesOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${mesSelecionado === m.value ? "bg-primary/10 font-semibold text-primary" : ""}`}
                >
                  {m.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpisLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (() => {
          const kpiItems = [
            { title: "Pedidos", value: String(kpisData?.pedidos || 0), change: `${(kpisData?.varPedidos || 0) >= 0 ? "+" : ""}${kpisData?.varPedidos || 0}%`, up: (kpisData?.varPedidos || 0) >= 0, icon: ShoppingBag, color: "hsl(210, 70%, 45%)" },
            { title: "Faturamento", value: `R$ ${(kpisData?.faturamento || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, change: `${(kpisData?.varFaturamento || 0) >= 0 ? "+" : ""}${kpisData?.varFaturamento || 0}%`, up: (kpisData?.varFaturamento || 0) >= 0, icon: Receipt, color: "hsl(150, 60%, 45%)" },
            { title: "Itens vendidos", value: String(kpisData?.itensVendidos || 0), change: `${(kpisData?.varItens || 0) >= 0 ? "+" : ""}${kpisData?.varItens || 0}%`, up: (kpisData?.varItens || 0) >= 0, icon: Package, color: "hsl(3, 62%, 46%)" },
            { title: "Ticket médio", value: `R$ ${(kpisData?.ticketMedio || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, change: `${(kpisData?.varTicket || 0) >= 0 ? "+" : ""}${kpisData?.varTicket || 0}%`, up: (kpisData?.varTicket || 0) >= 0, icon: TrendingUp, color: "hsl(280, 60%, 55%)" },
          ];
          return kpiItems.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                    <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                </div>
                <p className={`mt-2 text-xs ${stat.up ? "text-green-600" : "text-red-500"}`}>
                  {stat.change} em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
          ));
        })()}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="anomalias">Anomalias</TabsTrigger>
          <TabsTrigger value="assistente" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Assistente IA</TabsTrigger>
          <TabsTrigger value="canais">Canais de Venda</TabsTrigger>
          <TabsTrigger value="cohort">Cohort</TabsTrigger>
          <TabsTrigger value="abc">Curva ABC</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          <TabsTrigger value="rfm">RFM & CLV</TabsTrigger>
        </TabsList>

        {/* ── Resumo ── */}
        <TabsContent value="resumo" className="space-y-6">
          {/* Desempenho da Meta + Balanço Financeiro */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Meta */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-muted-foreground" /> Desempenho da meta
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMetaDialogOpen(true)}>
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center space-y-2 pt-2">
                <p className="text-sm font-bold text-primary uppercase">{metaData.nome}</p>
                {/* Gauge visual */}
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--primary))" strokeWidth="10"
                      strokeDasharray={`${pctMeta * 3.14} ${314 - pctMeta * 3.14}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{pctMeta.toFixed(2)}%</span>
                  </div>
                </div>
                <div className="text-left text-xs space-y-0.5 bg-secondary/50 rounded-lg p-2.5 w-full">
                  <p>Meta: <span className="font-semibold">R$ {metaData.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></p>
                  <p className="text-success">● Faturado: <span className="font-semibold">R$ {metaData.faturado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></p>
                  <p className="text-destructive">Faltam: <span className="font-semibold">R$ {faltam.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></p>
                </div>
                <p className="text-lg font-bold">R$ {metaData.faturado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">Faltam {metaData.diasRestantes} dias</p>
              </CardContent>
            </Card>

            <EditMetaDialog
              open={metaDialogOpen}
              onOpenChange={setMetaDialogOpen}
              meta={metaData}
              onSave={(updated) => setMetaData({ ...metaData, ...updated })}
            />

            {/* Balanço Financeiro */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" /> Balanço financeiro
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Recebimentos vs Pagamentos</p>
                  </div>
                  <Popover open={periodoBalancoOpen} onOpenChange={setPeriodoBalancoOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="min-w-[180px] justify-between">
                        {PERIODOS_BALANCO.find((p) => p.value === periodoBalanco)?.label} <span className="ml-1">▾</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52 p-1" align="end">
                      {PERIODOS_BALANCO.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => { setPeriodoBalanco(p.value); setPeriodoBalancoOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${periodoBalanco === p.value ? "bg-primary/10 font-semibold text-primary" : ""}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={balancoFiltrado}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 90%)" />
                      <XAxis dataKey="mes" stroke="hsl(220, 10%, 55%)" fontSize={10} angle={-30} textAnchor="end" height={50} />
                      <YAxis stroke="hsl(220, 10%, 55%)" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 10%, 85%)", borderRadius: "8px", color: "hsl(220, 10%, 20%)" }}
                        formatter={(v: number, name: string) => [`R$ ${v.toLocaleString("pt-BR")}`, name === "recebimentos" ? "Recebimentos" : "Pagamentos"]} />
                      <Legend formatter={(v) => v === "recebimentos" ? "● Recebimentos" : "○ Pagamentos"} />
                      <Bar dataKey="recebimentos" fill="hsl(150, 55%, 45%)" radius={[4, 4, 0, 0]} barSize={28} name="recebimentos" />
                      <Line type="monotone" dataKey="pagamentos" stroke="hsl(3, 55%, 52%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(3, 55%, 52%)", stroke: "#fff", strokeWidth: 2 }} name="pagamentos" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhamento Operacional */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" /> Detalhamento operacional
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Resumo financeiro anual</p>
                </div>
                <div className="flex gap-2">
                  {operacionalTabs.map((t) => {
                    const Icon = t.icon;
                    const active = opTab === t.key;
                    return (
                      <button key={t.key} onClick={() => setOpTab(t.key)}
                        className={`flex flex-col items-center gap-1 rounded-lg border px-4 py-2 text-xs font-medium transition-all ${active ? "border-primary bg-primary/5 text-primary" : "border-border bg-background text-muted-foreground hover:bg-secondary/50"}`}>
                        <Icon className="h-5 w-5" style={{ color: active ? t.color : undefined }} />
                        <span style={{ color: active ? t.color : undefined }}>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const currentOp = opData?.[opTab] || { data: [], qtd: 0, frete: 0, total: 0 };
                const tabInfo = operacionalTabs.find((t) => t.key === opTab)!;
                if (opLoading) return <Skeleton className="h-[300px] w-full" />;
                if (currentOp.data.length === 0) return <p className="text-center text-sm text-muted-foreground py-12">Sem dados para o período.</p>;
                return (
                  <>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={currentOp.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 90%)" />
                          <XAxis dataKey="mes" stroke="hsl(220, 10%, 55%)" fontSize={10} angle={-30} textAnchor="end" height={50} />
                          <YAxis stroke="hsl(220, 10%, 55%)" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 10%, 85%)", borderRadius: "8px", color: "hsl(220, 10%, 20%)" }}
                            formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, tabInfo.label]} />
                          <Bar dataKey="valor" fill={tabInfo.color} radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
                      <span>📦 Quantidade <strong className="text-foreground">{currentOp.qtd.toLocaleString("pt-BR")}</strong></span>
                      {currentOp.frete > 0 && <span>🚚 Frete <strong className="text-foreground">{currentOp.frete.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></span>}
                      <span>💰 Valor Total <strong className="text-foreground">{currentOp.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></span>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Formas de pagamento + Resumo por canal */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" /> Formas de pagamento
                </CardTitle>
                <p className="text-xs text-muted-foreground">Formas de pagamento mais utilizadas</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-[11px] font-medium text-muted-foreground border-b border-border pb-2 mb-2">
                    <span>Forma de pagamento</span>
                    <span className="text-right">Valor</span>
                    <span className="text-right">Variação</span>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto pr-1">
                    {formasPagamento.map((fp) => (
                      <div key={fp.forma} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center py-2.5 border-b border-border/30 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{fp.icon} {fp.forma}</p>
                          <p className="text-xs text-muted-foreground">{fp.transacoes} transações</p>
                        </div>
                        <span className="text-sm font-semibold font-mono text-right">R$ {fp.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        <span className={`text-sm text-right ${fp.variacao >= 0 ? "text-success" : "text-destructive"}`}>{fp.variacao}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" /> Resumo por canal de venda (DRE)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-2">
                  {canaisVenda.map((c) => (
                    <div key={c.canal} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">{c.canal}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground font-mono">
                            R$ {c.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="font-semibold text-sm w-10 text-right">{c.pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-5 bg-secondary/50 rounded overflow-hidden">
                        <div className="h-full rounded transition-all" style={{ width: `${Math.max(c.pct, 1)}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total Receita Bruta</span>
                  <span className="font-bold font-mono">
                    R$ {canaisVenda.reduce((s, c) => s + c.valor, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Produtos mais vendidos + Serviços mais vendidos */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Produtos mais vendidos */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" /> Produtos mais vendidos
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">Top 10</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{topProdutosData.length} produtos vendidos</p>
              </CardHeader>
              <CardContent className="p-0">
                {topProdLoading ? <Skeleton className="h-40 m-4" /> : topProdutosData.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Sem dados para o período.</p>
                ) : (
                <div className="divide-y divide-border">
                  {topProdutosData.map((p) => (
                    <div key={p.nome} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.nome}</p>
                        <p className="text-[10px] text-muted-foreground">{p.codigo}</p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{p.qtd}</span>
                        <span className="text-sm font-mono font-medium w-20 text-right">R$ {p.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>

            {/* Serviços mais vendidos */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" /> Serviços mais vendidos
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">Top 10</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{topServicosData.length} serviços vendidos</p>
              </CardHeader>
              <CardContent className="p-0">
                {topServLoading ? <Skeleton className="h-40 m-4" /> : topServicosData.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Sem dados para o período.</p>
                ) : (
                <div className="divide-y divide-border">
                  {topServicosData.map((s) => (
                    <div key={s.nome} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.nome}</p>
                        <p className="text-[10px] text-muted-foreground">{s.codigo}</p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{s.qtd}</span>
                        <span className="text-sm font-mono font-medium w-20 text-right">R$ {s.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comparativo Mensal (DRE) */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  📊 Comparativo Mensal
                </CardTitle>
                <a href="/relatorios/dre" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Ver DRE <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const receitaBruta = dreCategorias.find(c => c.id === "1T");
                const lucroBruto = dreCategorias.find(c => c.id === "3T");
                const resultLiquido = dreCategorias.find(c => c.id === "7T");

                const linhas = [
                  { label: "Receita Bruta", cor: "text-success", dados: receitaBruta?.valores || [] },
                  { label: "Lucro Bruto", cor: "text-blue-500", dados: lucroBruto?.valores || [] },
                  { label: "Result. Líquido", cor: "text-amber-500", dados: resultLiquido?.valores || [] },
                ];

                // Compute margem líquida
                const rb = receitaBruta?.valores || [];
                const rl = resultLiquido?.valores || [];
                const margemLiquida = rb.map((r, i) => r !== 0 ? Math.round((rl[i] / r) * 100) : 0);

                const fmtVal = (v: number) => {
                  const neg = v < 0;
                  const abs = Math.abs(v);
                  const formatted = abs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  return `${neg ? "-" : ""}R$ ${formatted}`;
                };

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted-foreground">
                          <th className="text-left py-2 pr-4 font-medium">Conta</th>
                          {dreMeses.map(m => (
                            <th key={m} className="text-right py-2 px-2 font-medium lowercase">{m.toLowerCase().replace("/", "/")}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {linhas.map(l => (
                          <tr key={l.label} className="border-b border-border/30">
                            <td className="py-3 pr-4 font-medium flex items-center gap-2">
                              <span className={`inline-block h-2 w-2 rounded-full ${l.cor === "text-success" ? "bg-success" : l.cor === "text-blue-500" ? "bg-blue-500" : "bg-amber-500"}`} />
                              {l.label}
                            </td>
                            {l.dados.map((v, i) => (
                              <td key={i} className={`text-right py-3 px-2 font-mono text-xs ${v < 0 ? "text-destructive" : l.cor}`}>
                                {fmtVal(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr>
                          <td className="py-3 pr-4 font-medium flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-purple-500" />
                            Margem Líquida
                          </td>
                          {margemLiquida.map((v, i) => (
                            <td key={i} className={`text-right py-3 px-2 font-mono text-xs ${v < 0 ? "text-destructive" : "text-purple-500"}`}>
                              {v}%
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Canais de Venda (Analytics Visão Geral) ── */}
        <TabsContent value="canais" className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mr-1">Filtrar por canal:</span>
            {(Object.keys(canaisInfo) as CanalKey[]).map((key) => {
              const info = canaisInfo[key];
              const Icon = info.icon;
              return (
                <Button key={key} size="sm" variant={canalFiltro === key ? "default" : "outline"} className={`text-xs gap-1.5 ${canalFiltro === key ? "" : "border-border/50"}`} onClick={() => setCanalFiltro(key)}>
                  <Icon className="h-3.5 w-3.5" /> {info.label}
                </Button>
              );
            })}
          </div>

          {canalFiltro !== "todos" && (() => {
            const insight = canalInsights[canalFiltro];
            const info = canaisInfo[canalFiltro];
            const Icon = info.icon;
            return (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: `Receita ${info.label}`, value: insight.receita, icon: Icon, change: insight.crescimento, up: insight.up },
                  { title: "Ticket Médio", value: insight.ticketMedio, icon: CreditCard, change: insight.crescimento, up: insight.up },
                  { title: "Transações", value: insight.transacoes.toString(), icon: Package, change: insight.crescimento, up: insight.up },
                  { title: "Taxa de Retorno", value: insight.taxaRetorno, icon: Repeat, change: "clientes recorrentes", up: true },
                ].map((s) => (
                  <Card key={s.title} className="glass-panel" style={{ borderColor: `${info.color}30` }}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">{s.title}</p>
                          <p className="text-2xl font-bold">{s.value}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${info.color}15` }}>
                          <s.icon className="h-5 w-5" style={{ color: info.color }} />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs">
                        {s.up ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
                        <span className={s.up ? "text-success" : "text-destructive"}>{s.change}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="glass-panel lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  {canalFiltro === "todos" ? "Vendas por Canal" : `Vendas — ${canaisInfo[canalFiltro].label}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {canalFiltro === "todos" ? (
                      <AreaChart data={vendasMensais}>
                        <defs>
                          <linearGradient id="colorBalcao" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(3, 62%, 46%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(3, 62%, 46%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorOS" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(200, 70%, 50%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(200, 70%, 50%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorEcom" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 90%)" />
                        <XAxis dataKey="mes" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                        <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                        <Tooltip contentStyle={{ ...tooltipStyle, backgroundColor: "hsl(0, 0%, 100%)", color: "hsl(220, 10%, 20%)", border: "1px solid hsl(220, 10%, 85%)" }} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]} />
                        <Area type="monotone" dataKey="balcao" stroke="hsl(3, 62%, 46%)" fill="url(#colorBalcao)" strokeWidth={2} name="Balcão" />
                        <Area type="monotone" dataKey="os" stroke="hsl(200, 70%, 50%)" fill="url(#colorOS)" strokeWidth={2} name="Ordem de Serviço" />
                        <Area type="monotone" dataKey="atacado" stroke="hsl(45, 90%, 55%)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" name="Atacado" />
                        <Area type="monotone" dataKey="ecommerce" stroke="hsl(150, 60%, 45%)" fill="url(#colorEcom)" strokeWidth={2} name="E-commerce" />
                        <Area type="monotone" dataKey="marketplaces" stroke="hsl(280, 60%, 55%)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" name="Marketplaces" />
                      </AreaChart>
                    ) : (
                      <BarChart data={vendasMensais}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 90%)" />
                        <XAxis dataKey="mes" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                        <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                        <Tooltip contentStyle={{ ...tooltipStyle, backgroundColor: "hsl(0, 0%, 100%)", color: "hsl(220, 10%, 20%)", border: "1px solid hsl(220, 10%, 85%)" }} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]} />
                        <Bar dataKey={canalFiltro} fill={canaisInfo[canalFiltro].color} radius={[4, 4, 0, 0]} barSize={32} name={canaisInfo[canalFiltro].label} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {canalFiltro === "todos" ? (
              <Card className="glass-panel">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieIcon className="h-4 w-4 text-primary" /> Distribuição por Canal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={canalVendas} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                          {canalVendas.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {canalVendas.length === 0 ? (
                    <p className="mt-4 text-center text-xs text-muted-foreground">Nenhuma venda registrada</p>
                  ) : (
                    <div className="mt-2 space-y-1.5">
                      {canalVendas.map((c) => (
                        <div key={c.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                            <span className="text-muted-foreground">{c.name}</span>
                          </div>
                          <span className="font-medium">{c.value}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (() => {
              const insight = canalInsights[canalFiltro];
              const info = canaisInfo[canalFiltro];
              return (
                <Card className="glass-panel" style={{ borderColor: `${info.color}30` }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" style={{ color: info.color }} /> Insights — {info.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><CreditCard className="h-3 w-3" /> Formas de Pagamento</p>
                      <div className="space-y-2">
                        {insight.formaPagamento.map((f) => (
                          <div key={f.forma}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{f.forma}</span>
                              <span className="font-medium">{f.pct}%</span>
                            </div>
                            <Progress value={f.pct} className="h-1.5" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Package className="h-3 w-3" /> Top Produtos</p>
                      <div className="space-y-1.5">
                        {insight.topProdutos.map((p, i) => (
                          <div key={p} className="flex items-center gap-2 text-xs">
                            <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold bg-primary/15 text-primary">{i + 1}</span>
                            <span className="text-muted-foreground">{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Tempo médio de venda</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: info.color }}>{insight.tempoMedio}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          {/* Rankings */}
          <div className="grid gap-4 lg:grid-cols-2">
          {/* Ranking de Vendedores */}
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" /> Ranking de Vendedores
                <Badge variant="outline" className="ml-auto text-[10px]">Top vendas por canal</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const canalMap: Record<string, string> = { balcao: "balcao", atacado: "atacado", ecommerce: "ecommerce", os: "os", marketplaces: "marketplaces" };
                const canalLabel: Record<string, string> = { balcao: "Balcão", atacado: "Atacado", ecommerce: "E-commerce", os: "Ordem de Serviço" };
                let rows: { vendedor: string; canal: string; total: number; qtd: number }[];
                if (canalFiltro === "todos") {
                  const agg = new Map<string, { vendedor: string; canal: string; total: number; qtd: number }>();
                  for (const r of rankingVendedores) {
                    const entry = agg.get(r.vendedor) || { vendedor: r.vendedor, canal: "todos", total: 0, qtd: 0 };
                    entry.total += r.total;
                    entry.qtd += r.qtd;
                    agg.set(r.vendedor, entry);
                  }
                  rows = Array.from(agg.values()).sort((a, b) => b.total - a.total);
                } else {
                  rows = rankingVendedores.filter(r => r.canal === canalMap[canalFiltro]);
                }
                if (rows.length === 0) return <p className="text-center text-sm text-muted-foreground py-6">Nenhuma venda registrada.</p>;
                return (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10 text-center">#</TableHead>
                          <TableHead>Vendedor</TableHead>
                          {canalFiltro !== "todos" && <TableHead>Canal</TableHead>}
                          <TableHead className="text-center">Vendas</TableHead>
                          <TableHead className="text-right">Total (R$)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.slice(0, 15).map((r, i) => (
                          <TableRow key={`${r.vendedor}-${r.canal}-${i}`}>
                            <TableCell className="text-center font-bold">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</TableCell>
                            <TableCell className="font-semibold">{r.vendedor}</TableCell>
                            {canalFiltro !== "todos" && <TableCell><Badge variant="outline" className="text-[10px]">{canalLabel[r.canal] || r.canal}</Badge></TableCell>}
                            <TableCell className="text-center">{r.qtd}</TableCell>
                            <TableCell className="text-right font-bold text-emerald-600">R$ {r.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
          {/* Ranking de Mecânicos */}
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4 text-blue-500" /> Ranking de Mecânicos
                <Badge variant="outline" className="ml-auto text-[10px]">Top por OS</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const canalMap: Record<string, string> = { balcao: "balcao", atacado: "atacado", ecommerce: "ecommerce", os: "os", marketplaces: "marketplaces" };
                let rows: { mecanico: string; canal: string; total: number; qtd: number }[];
                if (canalFiltro === "todos") {
                  const agg = new Map<string, { mecanico: string; canal: string; total: number; qtd: number }>();
                  for (const r of rankingMecanicos) {
                    const entry = agg.get(r.mecanico) || { mecanico: r.mecanico, canal: "todos", total: 0, qtd: 0 };
                    entry.total += r.total;
                    entry.qtd += r.qtd;
                    agg.set(r.mecanico, entry);
                  }
                  rows = Array.from(agg.values()).sort((a, b) => b.total - a.total);
                } else {
                  rows = rankingMecanicos.filter(r => r.canal === canalMap[canalFiltro]);
                }
                if (rows.length === 0) return <p className="text-center text-sm text-muted-foreground py-6">Nenhum mecânico registrado.</p>;
                return (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10 text-center">#</TableHead>
                          <TableHead>Mecânico</TableHead>
                          <TableHead className="text-center">OS</TableHead>
                          <TableHead className="text-right">Total (R$)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.slice(0, 15).map((r, i) => (
                          <TableRow key={`${r.mecanico}-${i}`}>
                            <TableCell className="text-center font-bold">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</TableCell>
                            <TableCell className="font-semibold">{r.mecanico}</TableCell>
                            <TableCell className="text-center">{r.qtd}</TableCell>
                            <TableCell className="text-right font-bold text-emerald-600">R$ {r.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* ── RFM & CLV ── */}
        <TabsContent value="rfm" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Segmentação RFM</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rfmSegmentos.map((s) => (
                    <div key={s.segmento} className="rounded-lg border border-border/50 bg-secondary/30 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.cor }} />
                          <span className="font-semibold text-sm">{s.segmento}</span>
                        </div>
                        <span className="text-sm font-mono font-semibold">{s.receita}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={s.pct} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">{s.clientes} clientes ({s.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Customer Lifetime Value (CLV)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clvData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 18%)" />
                      <XAxis dataKey="segmento" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                      <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "CLV médio"]} />
                      <Bar dataKey="clv" fill="hsl(3, 62%, 46%)" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {clvData.map((d) => (
                    <div key={d.segmento} className="text-center">
                      <p className="text-xs text-muted-foreground">{d.segmento}</p>
                      <p className="text-sm font-bold">{d.clientes}</p>
                      <p className="text-[10px] text-muted-foreground">clientes</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Curva ABC ── */}
        <TabsContent value="abc" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Curva ABC de Produtos (Pareto 80/20)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subtotais */}
              <div className="text-right text-sm font-semibold text-foreground">SUBTOTAIS:</div>
              <div className="border rounded text-sm">
                <div className="flex justify-between px-4 py-1 border-b bg-muted/30"><span>Quantidade:</span><span>{abcProdutos.reduce((s, p) => s + (p.qtd || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 3 })}</span></div>
                <div className="flex justify-between px-4 py-1 border-b bg-muted/30"><span>Valor unitário:</span><span>{abcProdutos.reduce((s, p) => s + (p.unitario || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between px-4 py-1 bg-muted/30"><span>Valor total:</span><span>{abcProdutos.reduce((s, p) => s + p.vendas, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
              </div>

              {/* Totais por Curva */}
              <div className="text-center text-sm font-semibold pt-2">TOTAIS:</div>
              <div className="grid grid-cols-4 text-sm text-center border rounded overflow-hidden">
                {(() => {
                  const curvaA = abcProdutos.filter(p => p.classe === "A");
                  const curvaB = abcProdutos.filter(p => p.classe === "B");
                  const curvaC = abcProdutos.filter(p => p.classe === "C");
                  const totalVendas = abcProdutos.reduce((s, p) => s + p.vendas, 0);
                  const totalQtd = abcProdutos.reduce((s, p) => s + (p.qtd || 0), 0);
                  const sumA = curvaA.reduce((s, p) => s + p.vendas, 0);
                  const sumB = curvaB.reduce((s, p) => s + p.vendas, 0);
                  const sumC = curvaC.reduce((s, p) => s + p.vendas, 0);
                  const qtdA = curvaA.reduce((s, p) => s + (p.qtd || 0), 0);
                  const qtdB = curvaB.reduce((s, p) => s + (p.qtd || 0), 0);
                  const qtdC = curvaC.reduce((s, p) => s + (p.qtd || 0), 0);
                  return (
                    <>
                      <div className="bg-cyan-100 dark:bg-cyan-900/40 p-2 border-r text-foreground">
                        <div className="font-bold">Curva A</div>
                        <div>R$ {sumA.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({totalVendas ? ((sumA / totalVendas) * 100).toFixed(2) : 0}%)</div>
                        <div>{qtdA.toLocaleString("pt-BR", { minimumFractionDigits: 3 })}</div>
                      </div>
                      <div className="bg-yellow-100 dark:bg-yellow-900/40 p-2 border-r text-foreground">
                        <div className="font-bold">Curva B</div>
                        <div>R$ {sumB.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({totalVendas ? ((sumB / totalVendas) * 100).toFixed(2) : 0}%)</div>
                        <div>{qtdB.toLocaleString("pt-BR", { minimumFractionDigits: 3 })}</div>
                      </div>
                      <div className="bg-red-100 dark:bg-red-900/40 p-2 border-r text-foreground">
                        <div className="font-bold">Curva C</div>
                        <div>R$ {sumC.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({totalVendas ? ((sumC / totalVendas) * 100).toFixed(2) : 0}%)</div>
                        <div>{qtdC.toLocaleString("pt-BR", { minimumFractionDigits: 3 })}</div>
                      </div>
                      <div className="bg-green-100 dark:bg-green-900/40 p-2 text-foreground">
                        <div className="font-bold">Total</div>
                        <div>R$ {totalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (100,00%)</div>
                        <div>{totalQtd.toLocaleString("pt-BR", { minimumFractionDigits: 3 })}</div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Gráfico */}
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={abcProdutos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 18%)" />
                    <XAxis dataKey="nome" stroke="hsl(220, 10%, 55%)" fontSize={10} angle={-20} textAnchor="end" height={60} />
                    <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Vendas"]} />
                    <Bar dataKey="vendas" radius={[4, 4, 0, 0]} barSize={30}>
                      {abcProdutos.map((entry, i) => (
                        <Cell key={i} fill={entry.classe === "A" ? "hsl(3, 62%, 46%)" : entry.classe === "B" ? "hsl(45, 90%, 55%)" : "hsl(220, 10%, 40%)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabela detalhada */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">Produto</th>
                      <th className="text-right p-2">Quantidade</th>
                      <th className="text-right p-2">Valor unitário</th>
                      <th className="text-right p-2">Valor total</th>
                      <th className="text-right p-2">Valor acumulado</th>
                      <th className="text-right p-2">(%) Porcentagem</th>
                      <th className="text-right p-2">(%) Porcentagem acumulada</th>
                      <th className="text-center p-2">Classe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abcProdutos.map((p, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        <td className="p-2">{p.nome}</td>
                        <td className="text-right p-2">{p.qtd.toLocaleString("pt-BR", { minimumFractionDigits: 3 })}</td>
                        <td className="text-right p-2">{p.unitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="text-right p-2">{p.vendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="text-right p-2">{p.acumulado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="text-right p-2">{p.pct.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="text-right p-2">{p.pctAcum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="text-center p-2">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${classeColors[p.classe]}`}>{p.classe}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Cohort ── */}
        <TabsContent value="cohort" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Análise de Cohort — Retenção de Clientes (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground">Cohort</th>
                      {["Mês 1", "Mês 2", "Mês 3", "Mês 4", "Mês 5", "Mês 6"].map((m) => (
                        <th key={m} className="py-2 px-3 text-center text-xs font-medium text-muted-foreground">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.map((row) => (
                      <tr key={row.cohort} className="border-b border-border/30">
                        <td className="py-2 px-3 font-medium text-sm">{row.cohort}</td>
                        {[row.mes1, row.mes2, row.mes3, row.mes4, row.mes5, row.mes6].map((val, i) => {
                          if (val === null) return <td key={i} className="py-2 px-3 text-center text-muted-foreground/30">—</td>;
                          const intensity = val / 100;
                          return (
                            <td key={i} className="py-2 px-3 text-center">
                              <span className="inline-flex h-8 w-14 items-center justify-center rounded font-mono text-xs font-semibold" style={{ backgroundColor: `hsla(24, 100%, 50%, ${intensity * 0.4})`, color: intensity > 0.5 ? "hsl(3, 62%, 46%)" : "hsl(220, 10%, 55%)" }}>
                                {val}%
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Anomalias ── */}
        <TabsContent value="anomalias" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Detecção de Anomalias com IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anomalias.map((a) => {
                  const sev = severidadeStyles[a.severidade];
                  return (
                    <div key={a.tipo} className={`rounded-lg border p-4 ${a.severidade === "alta" ? "border-destructive/30" : "border-border/50"}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`h-4 w-4 ${sev.text}`} />
                          <h3 className="font-semibold">{a.titulo}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sev.bg} ${sev.text}`}>{sev.label}</span>
                          <span className="text-xs text-muted-foreground">{a.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{a.desc}</p>
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground">Ações sugeridas:</p>
                        {a.acoes.map((acao) => (
                          <div key={acao} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3 text-primary" /> {acao}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Estatísticas ── */}
        <TabsContent value="estatisticas">
          <EstatisticasTab />
        </TabsContent>

        {/* ── Assistente IA ── */}
        <TabsContent value="assistente">
          <Card className="glass-panel">
            <AssistenteIAPanel />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
