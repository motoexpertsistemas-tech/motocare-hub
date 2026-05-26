import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign,
  Users,
  TrendingDown,
  Clock,
  CreditCard,
  AlertCircle,
  Eye,
  Building2,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<any>(null);
  const [ultimasEmpresas, setUltimasEmpresas] = useState<any[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // MRR
      const { data: mrr } = await supabase.rpc("calcular_mrr");

      // Empresas
      const { data: empresas } = await supabase
        .from("empresas")
        .select("id, nome, cnpj, status, plano_ativo, criado_em");

      const totalEmpresas = empresas?.length || 0;
      const empresasAtivas = empresas?.filter((e) => e.status === "ativo").length || 0;
      const empresasTrial = empresas?.filter((e) => e.plano_ativo === "trial").length || 0;

      // Faturas pendentes
      const { data: faturasPendentes } = await supabase
        .from("faturas")
        .select("valor_final")
        .eq("status", "pending");
      const totalPendente = faturasPendentes?.reduce((s, f) => s + Number(f.valor_final), 0) || 0;

      // Faturas vencidas
      const { data: faturasVencidas } = await supabase
        .from("faturas")
        .select("id")
        .eq("status", "overdue");

      // Distribuição por plano
      const receitaPorPlano: Record<string, number> = {};
      empresas?.forEach((e) => {
        receitaPorPlano[e.plano_ativo] = (receitaPorPlano[e.plano_ativo] || 0) + 1;
      });

      // Novas últimos 30 dias
      const d30 = new Date();
      d30.setDate(d30.getDate() - 30);
      const novasEmpresas = empresas?.filter(
        (e) => new Date(e.criado_em) >= d30
      ).length || 0;

      // Evolução MRR
      const { data: evolucaoMRR } = await supabase
        .from("metricas_mensais")
        .select("*")
        .order("ano", { ascending: true })
        .order("mes", { ascending: true })
        .limit(12);

      // Últimas empresas
      const sorted = [...(empresas || [])].sort(
        (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      );
      setUltimasEmpresas(sorted.slice(0, 5));

      setMetricas({
        mrr: mrr || 0,
        totalEmpresas,
        empresasAtivas,
        empresasTrial,
        totalPendente,
        faturasVencidas: faturasVencidas?.length || 0,
        receitaPorPlano,
        novasEmpresas,
        evolucaoMRR: evolucaoMRR || [],
        churnRate: 0,
      });
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const CORES: Record<string, string> = {
    trial: "#EAB308",
    bronze: "#CD7F32",
    prata: "#94A3B8",
    ouro: "#F59E0B",
    platina: "#8B5CF6",
    starter: "#3B82F6",
    professional: "#FF6B00",
    enterprise: "#8B5CF6",
  };

  const planoData = Object.entries(metricas.receitaPorPlano || {}).map(([plano, count]) => ({
    name: plano.charAt(0).toUpperCase() + plano.slice(1),
    value: count as number,
    fill: CORES[plano] || "#888",
  }));

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel Admin SaaS</h1>
          <p className="text-muted-foreground">Visão geral do Otto Tech Sistemas</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/admin/empresas")}>
            <Users size={18} className="mr-2" /> Empresas
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/assinaturas")}>
            <CreditCard size={18} className="mr-2" /> Assinaturas
          </Button>
        </div>
      </div>

      {/* ALERTA FATURAS VENCIDAS */}
      {metricas.faturasVencidas > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-destructive" size={24} />
              <div className="flex-1">
                <p className="font-semibold text-destructive">
                  {metricas.faturasVencidas} fatura(s) vencida(s)
                </p>
                <p className="text-sm text-destructive/80">Revise e tome ação</p>
              </div>
              <Button
                variant="destructive"
                onClick={() => navigate("/admin/faturas")}
              >
                Ver Faturas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">MRR</p>
            <p className="text-3xl font-bold">
              R$ {Number(metricas.mrr).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              ARR: R$ {(Number(metricas.mrr) * 12).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
              <Badge variant="secondary">{metricas.novasEmpresas} novos</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Empresas</p>
            <p className="text-3xl font-bold">{metricas.totalEmpresas}</p>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-green-600">{metricas.empresasAtivas} ativas</span>
              <span className="text-yellow-600">{metricas.empresasTrial} trial</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <TrendingDown className="text-red-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Churn Rate</p>
            <p className="text-3xl font-bold">{metricas.churnRate}%</p>
            <p className="text-xs text-muted-foreground mt-2">Meta: {"<"} 5%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <Badge variant="outline">Pendente</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">A Receber</p>
            <p className="text-3xl font-bold">
              R$ {metricas.totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução MRR</CardTitle>
          </CardHeader>
          <CardContent>
            {metricas.evolucaoMRR.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricas.evolucaoMRR}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tickFormatter={(v) => `${v}`} />
                  <YAxis />
                  <Tooltip formatter={(v: any) => `R$ ${Number(v).toLocaleString("pt-BR")}`} />
                  <Line type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">Sem dados de métricas ainda</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empresas por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            {planoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={planoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(e) => `${e.name}: ${e.value}`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {planoData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ÚLTIMAS EMPRESAS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Últimas Empresas Cadastradas</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/empresas")}>
              Ver Todas <Eye size={16} className="ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ultimasEmpresas.map((empresa) => (
              <div
                key={empresa.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Building2 className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">{empresa.nome}</p>
                    <p className="text-sm text-muted-foreground">{empresa.cnpj || "Sem CNPJ"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge
                      variant={empresa.status === "ativo" ? "default" : "secondary"}
                    >
                      {empresa.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{empresa.plano_ativo}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/admin/empresas/${empresa.id}`)}
                  >
                    Detalhes
                  </Button>
                </div>
              </div>
            ))}
            {ultimasEmpresas.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhuma empresa cadastrada</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
