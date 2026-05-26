import { useState, useEffect, useCallback } from "react";
import NovaIntegracaoDialog from "@/components/marketplace/NovaIntegracaoDialog";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePlano } from "@/contexts/PlanoContext";
import {
  ShoppingCart,
  TrendingUp,
  Package,
  DollarSign,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  Plus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { useRole } from "@/contexts/RoleContext";
import { Navigate } from "react-router-dom";

interface Estatisticas {
  totalPedidos: number;
  totalVendas: number;
  totalComissoes: number;
  lucroLiquido: number;
  ticketMedio: number;
  porMarketplace: { nome: string; valor: number }[];
  vendasDiarias: { data: string; valor: number }[];
}

const CORES_MARKETPLACES: Record<string, string> = {
  mercado_livre: "hsl(52, 100%, 50%)",
  shopee: "hsl(11, 85%, 55%)",
  magalu: "hsl(213, 100%, 50%)",
  amazon: "hsl(33, 100%, 50%)",
  b2w: "hsl(153, 100%, 33%)",
};

const MARKETPLACE_ICONS: Record<string, string> = {
  mercado_livre: "🛒",
  shopee: "🛍️",
  magalu: "🏪",
  amazon: "📦",
};

export default function Marketplaces() {
  const role = useRole();
  const [integracoes, setIntegracoes] = useState<any[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [sincronizando, setSincronizando] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [novaIntegracaoOpen, setNovaIntegracaoOpen] = useState(false);
  const navigate = useNavigate();

  const carregarDados = useCallback(async () => {
    setLoading(true);

    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 30);

    const [integRes, pedidosRes] = await Promise.all([
      supabase.from("marketplace_integracoes").select("*").order("marketplace"),
      supabase
        .from("marketplace_pedidos")
        .select("*")
        .gte("data_pedido", dataInicio.toISOString()),
    ]);

    setIntegracoes(integRes.data || []);

    const pedidos = pedidosRes.data || [];
    if (pedidos.length > 0) {
      const totalVendas = pedidos.reduce((s, p) => s + (p.valor_total || 0), 0);
      const totalComissoes = pedidos.reduce((s, p) => s + (p.taxa_marketplace || 0), 0);

      const porMarketplace = pedidos.reduce((acc: Record<string, number>, p) => {
        acc[p.marketplace] = (acc[p.marketplace] || 0) + (p.valor_total || 0);
        return acc;
      }, {});

      const vendasDiariasMap = pedidos.reduce((acc: Record<string, number>, p) => {
        const d = new Date(p.data_pedido).toISOString().split("T")[0];
        acc[d] = (acc[d] || 0) + (p.valor_total || 0);
        return acc;
      }, {});

      setEstatisticas({
        totalPedidos: pedidos.length,
        totalVendas,
        totalComissoes,
        lucroLiquido: totalVendas - totalComissoes,
        ticketMedio: totalVendas / pedidos.length,
        porMarketplace: Object.entries(porMarketplace).map(([nome, valor]) => ({
          nome,
          valor,
        })),
        vendasDiarias: Object.entries(vendasDiariasMap)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-15)
          .map(([data, valor]) => ({
            data: new Date(data).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            }),
            valor,
          })),
      });
    } else {
      setEstatisticas({
        totalPedidos: 0,
        totalVendas: 0,
        totalComissoes: 0,
        lucroLiquido: 0,
        ticketMedio: 0,
        porMarketplace: [],
        vendasDiarias: [],
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (role === "ADMIN" || role === "GERENTE") carregarDados();
  }, [carregarDados, role]);

  const plano = usePlano();

  if (role !== "ADMIN" && role !== "GERENTE") {
    return <Navigate to="/" replace />;
  }

  if (plano !== "platina") {
    return <Navigate to="/" replace />;
  }

  const sincronizar = async (integracaoId: string) => {
    setSincronizando(integracaoId);
    try {
      const { data, error } = await supabase.functions.invoke("sync-mercado-livre", {
        body: { action: "sincronizar", integracao_id: integracaoId },
      });

      if (error) throw error;

      toast.success(
        `Sincronização concluída! ${data?.results?.pedidos || 0} pedidos novos.`
      );
      carregarDados();
    } catch (error) {
      toast.error("Erro ao sincronizar: " + String(error));
    } finally {
      setSincronizando(null);
    }
  };

  const formatBRL = (v: number) =>
    `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketplaces</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas vendas em múltiplos canais
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => navigate("/marketplaces/pedidos")}>
            <ShoppingCart className="h-4 w-4" />
            Pedidos
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setNovaIntegracaoOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Integração
          </Button>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          className="cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 group"
          onClick={() => navigate("/marketplaces/calculadora")}
        >
          <CardContent className="p-5 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20 transition-colors">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-amber-600 transition-colors">Comparador de Preços</p>
              <p className="text-xs text-muted-foreground mt-0.5">Calcule preço ideal, margem e lucro por marketplace</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 group"
          onClick={() => navigate("/marketplaces/relatorio-erp")}
        >
          <CardContent className="p-5 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 transition-colors">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-emerald-600 transition-colors">Relatório ERP</p>
              <p className="text-xs text-muted-foreground mt-0.5">DRE consolidado, margem por canal e top produtos</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 group"
          onClick={() => navigate("/marketplaces/pedidos")}
        >
          <CardContent className="p-5 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Gestão de Pedidos</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pipeline completo: emissão, envio, rastreio e entrega</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 group"
          onClick={() => navigate("/marketplaces/transportadoras")}
        >
          <CardContent className="p-5 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 group-hover:bg-violet-500/20 transition-colors">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-violet-600 transition-colors">Transportadoras & Devoluções</p>
              <p className="text-xs text-muted-foreground mt-0.5">Rastreie envios Correios e gerencie devoluções</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.totalPedidos ?? 0}</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatBRL(estatisticas?.totalVendas ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatBRL(estatisticas?.totalComissoes ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Taxas dos marketplaces</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatBRL(estatisticas?.lucroLiquido ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ticket médio: {formatBRL(estatisticas?.ticketMedio ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Vendas Diárias (Últimos 15 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={estatisticas?.vendasDiarias || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="data" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => formatBRL(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Vendas por Marketplace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estatisticas?.porMarketplace || []}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) =>
                      `${entry.nome.replace("_", " ")}: ${formatBRL(entry.valor)}`
                    }
                  >
                    {(estatisticas?.porMarketplace || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          CORES_MARKETPLACES[entry.nome] ||
                          `hsl(${index * 72}, 60%, 50%)`
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatBRL(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Integrações Ativas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {integracoes.map((integracao) => (
            <div
              key={integracao.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">
                  {MARKETPLACE_ICONS[integracao.marketplace] || "🏬"}
                </span>
                <div>
                  <p className="font-semibold capitalize">
                    {integracao.marketplace.replace("_", " ")}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {integracao.ativo ? (
                      <span className="flex items-center gap-1 text-success">
                        <CheckCircle className="h-3 w-3" /> Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-destructive">
                        <AlertCircle className="h-3 w-3" /> Inativo
                      </span>
                    )}
                    <span>
                      Última sinc:{" "}
                      {integracao.ultima_sincronizacao
                        ? new Date(integracao.ultima_sincronizacao).toLocaleString("pt-BR")
                        : "Nunca"}
                    </span>
                  </div>
                  {integracao.erro_sincronizacao && (
                    <p className="mt-1 text-xs text-destructive">
                      Erro: {integracao.erro_sincronizacao}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sincronizar(integracao.id)}
                  disabled={sincronizando === integracao.id}
                  className="gap-1.5"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      sincronizando === integracao.id ? "animate-spin" : ""
                    }`}
                  />
                  Sincronizar
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {integracoes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-3 opacity-40" />
              <p className="font-medium">Nenhuma integração configurada</p>
              <Button className="mt-4 gap-2" size="sm" onClick={() => setNovaIntegracaoOpen(true)}>
                <Plus className="h-4 w-4" />
                Adicionar Marketplace
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <NovaIntegracaoDialog
        open={novaIntegracaoOpen}
        onOpenChange={setNovaIntegracaoOpen}
        onSuccess={carregarDados}
      />
    </div>
  );
}
