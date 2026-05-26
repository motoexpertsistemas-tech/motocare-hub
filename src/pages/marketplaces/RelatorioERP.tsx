import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { usePlano } from "@/contexts/PlanoContext";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft, Download, RefreshCw, TrendingUp, TrendingDown,
  DollarSign, Package, ShoppingCart, BarChart3, FileText,
  Calendar, Percent, AlertTriangle, CheckCircle2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { MARKETPLACE_FEES } from "@/lib/marketplaceFees";

const CORES = ["hsl(var(--primary))", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#EC4899"];

const MARKETPLACE_LABELS: Record<string, string> = {
  mercado_livre: "Mercado Livre",
  shopee: "Shopee",
  amazon: "Amazon",
  magalu: "Magalu",
  shein: "Shein",
  tiktok_shop: "TikTok Shop",
};

export default function RelatorioERP() {
  const role = useRole();
  const plano = usePlano();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("30");
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().slice(0, 10));
  const [dados, setDados] = useState<any>(null);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const { data: pedidos, error } = await supabase
        .from("marketplace_pedidos")
        .select("*")
        .gte("data_pedido", dataInicio)
        .lte("data_pedido", dataFim + "T23:59:59")
        .neq("status", "cancelado");

      if (error) throw error;

      const all = pedidos || [];
      const totalBruto = all.reduce((s, p) => s + (p.valor_total || 0), 0);
      const totalComissoes = all.reduce((s, p) => s + (p.taxa_marketplace || 0), 0);
      const totalFrete = all.reduce((s, p) => s + (p.valor_frete || 0), 0);
      const totalLiquido = totalBruto - totalComissoes;

      // Per marketplace
      const porMkp: Record<string, { bruto: number; comissao: number; frete: number; qtd: number }> = {};
      all.forEach((p) => {
        const mk = p.marketplace || "outros";
        if (!porMkp[mk]) porMkp[mk] = { bruto: 0, comissao: 0, frete: 0, qtd: 0 };
        porMkp[mk].bruto += p.valor_total || 0;
        porMkp[mk].comissao += p.taxa_marketplace || 0;
        porMkp[mk].frete += p.valor_frete || 0;
        porMkp[mk].qtd += 1;
      });

      // Daily evolution
      const porDia: Record<string, { bruto: number; liquido: number }> = {};
      all.forEach((p) => {
        const d = new Date(p.data_pedido).toISOString().slice(0, 10);
        if (!porDia[d]) porDia[d] = { bruto: 0, liquido: 0 };
        porDia[d].bruto += p.valor_total || 0;
        porDia[d].liquido += (p.valor_total || 0) - (p.taxa_marketplace || 0);
      });

      // Status breakdown
      const porStatus: Record<string, number> = {};
      all.forEach((p) => {
        porStatus[p.status] = (porStatus[p.status] || 0) + 1;
      });

      // Top products
      const porProduto: Record<string, { nome: string; qtd: number; valor: number }> = {};
      all.forEach((p) => {
        const itens = p.itens as any[] || [];
        itens.forEach((item: any) => {
          const key = item.nome || item.titulo || "Produto";
          if (!porProduto[key]) porProduto[key] = { nome: key, qtd: 0, valor: 0 };
          porProduto[key].qtd += item.quantidade || 1;
          porProduto[key].valor += (item.preco_unitario || 0) * (item.quantidade || 1);
        });
      });

      setDados({
        totalPedidos: all.length,
        totalBruto,
        totalComissoes,
        totalFrete,
        totalLiquido,
        ticketMedio: all.length > 0 ? totalBruto / all.length : 0,
        margemMedia: totalBruto > 0 ? ((totalLiquido / totalBruto) * 100) : 0,
        porMarketplace: Object.entries(porMkp).map(([mk, v]) => ({
          marketplace: MARKETPLACE_LABELS[mk] || mk,
          key: mk,
          ...v,
          liquido: v.bruto - v.comissao,
          ticketMedio: v.qtd > 0 ? v.bruto / v.qtd : 0,
          margemPct: v.bruto > 0 ? (((v.bruto - v.comissao) / v.bruto) * 100) : 0,
        })),
        evolucaoDiaria: Object.entries(porDia)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([data, v]) => ({
            data: new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            bruto: v.bruto,
            liquido: v.liquido,
          })),
        porStatus: Object.entries(porStatus).map(([s, v]) => ({ status: s, qtd: v })),
        topProdutos: Object.values(porProduto)
          .sort((a, b) => b.valor - a.valor)
          .slice(0, 10),
      });
    } catch (err) {
      toast.error("Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]);

  useEffect(() => {
    if (role === "ADMIN" || role === "GERENTE") carregarDados();
  }, [carregarDados, role]);

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() - Number(periodo));
    setDataInicio(d.toISOString().slice(0, 10));
    setDataFim(new Date().toISOString().slice(0, 10));
  }, [periodo]);

  if (role !== "ADMIN" && role !== "GERENTE") return <Navigate to="/" replace />;
  if (plano !== "platina") return <Navigate to="/" replace />;

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/marketplaces")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Relatório ERP — Marketplaces
            </h1>
            <p className="text-sm text-muted-foreground">
              Análise financeira consolidada de todos os canais
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="15">15 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={carregarDados}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : dados ? (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Pedidos</span>
                </div>
                <p className="text-2xl font-bold">{dados.totalPedidos}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Faturamento Bruto</span>
                </div>
                <p className="text-2xl font-bold text-primary">{fmt(dados.totalBruto)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Comissões</span>
                </div>
                <p className="text-2xl font-bold text-destructive">{fmt(dados.totalComissoes)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Frete Total</span>
                </div>
                <p className="text-2xl font-bold">{fmt(dados.totalFrete)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-muted-foreground">Receita Líquida</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{fmt(dados.totalLiquido)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Margem Média</span>
                </div>
                <p className="text-2xl font-bold">{dados.margemMedia.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Daily evolution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Evolução Diária (Bruto vs Líquido)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dados.evolucaoDiaria}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="data" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Line type="monotone" dataKey="bruto" name="Bruto" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="liquido" name="Líquido" stroke="#10B981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue per marketplace */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Receita por Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dados.porMarketplace}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="marketplace" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="bruto" name="Bruto" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="comissao" name="Comissão" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="liquido" name="Líquido" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed table per marketplace */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                DRE por Canal de Venda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal</TableHead>
                      <TableHead className="text-right">Pedidos</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                      <TableHead className="text-right">Comissões</TableHead>
                      <TableHead className="text-right">Frete</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead className="text-right">Ticket Médio</TableHead>
                      <TableHead className="text-right">Margem %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.porMarketplace.map((mk: any, i: number) => (
                      <TableRow key={mk.key}>
                        <TableCell className="font-medium">{mk.marketplace}</TableCell>
                        <TableCell className="text-right">{mk.qtd}</TableCell>
                        <TableCell className="text-right">{fmt(mk.bruto)}</TableCell>
                        <TableCell className="text-right text-destructive">{fmt(mk.comissao)}</TableCell>
                        <TableCell className="text-right">{fmt(mk.frete)}</TableCell>
                        <TableCell className="text-right text-emerald-600 font-semibold">{fmt(mk.liquido)}</TableCell>
                        <TableCell className="text-right">{fmt(mk.ticketMedio)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={mk.margemPct >= 50 ? "default" : mk.margemPct >= 30 ? "secondary" : "destructive"}>
                            {mk.margemPct.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Total row */}
                    <TableRow className="font-bold border-t-2">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{dados.totalPedidos}</TableCell>
                      <TableCell className="text-right">{fmt(dados.totalBruto)}</TableCell>
                      <TableCell className="text-right text-destructive">{fmt(dados.totalComissoes)}</TableCell>
                      <TableCell className="text-right">{fmt(dados.totalFrete)}</TableCell>
                      <TableCell className="text-right text-emerald-600">{fmt(dados.totalLiquido)}</TableCell>
                      <TableCell className="text-right">{fmt(dados.ticketMedio)}</TableCell>
                      <TableCell className="text-right">
                        <Badge>{dados.margemMedia.toFixed(1)}%</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Top products */}
          {dados.topProdutos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Top 10 Produtos Mais Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd Vendida</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.topProdutos.map((p: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>{p.nome}</TableCell>
                        <TableCell className="text-right">{p.qtd}</TableCell>
                        <TableCell className="text-right">{fmt(p.valor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
