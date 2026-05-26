import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { FileText, ArrowDownLeft, ArrowUpRight, DollarSign, BarChart3, Landmark, Percent, ArrowRight, TrendingUp, TrendingDown, Receipt, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { dreCategorias, meses } from "./dreData";

const relatorios = [
  { titulo: "Extrato", descricao: "Relatório de extrato. Filtro por loja, descrição, movimentação, período, situação, conta bancária, valor e forma de pagamento.", cor: "from-blue-600 to-blue-700", icon: FileText, path: "/relatorios/financeiro/extrato" },
  { titulo: "Contas a pagar", descricao: "Relatório de contas a pagar. Filtro por loja, descrição, categoria, período, situação, conta bancária, valor e forma de pagamento.", cor: "from-green-600 to-green-700", icon: ArrowDownLeft, path: "/relatorios/financeiro/contas-pagar" },
  { titulo: "Contas a receber", descricao: "Relatório de contas a receber. Filtro por loja, descrição, categoria, período, situação, conta bancária, valor e forma de pagamento.", cor: "from-emerald-600 to-emerald-700", icon: ArrowUpRight, path: "/relatorios/financeiro/contas-receber" },
  { titulo: "Comissão de vendedores", descricao: "Relatório de comissão de vendedores. Filtro por loja, vendedor, período e situação.", cor: "from-green-700 to-green-800", icon: Percent, path: "/relatorios/financeiro/comissao-vendedores" },
  { titulo: "DRE", descricao: "Relatório DRE. Filtro por loja, tipo de data, período e situação.", cor: "from-purple-600 to-purple-700", icon: BarChart3, path: "/relatorios/dre" },
  { titulo: "Plano de contas", descricao: "Relatório plano de contas. Filtro por loja, descrição, movimentação, período, situação, conta bancária, valor e forma de pagamento.", cor: "from-red-600 to-red-700", icon: FileText, path: "/relatorios/financeiro/plano-contas" },
  { titulo: "Contas bancárias", descricao: "Relatório de contas bancárias. Filtro por loja, período, situação, conta bancária e forma de pagamento.", cor: "from-indigo-600 to-indigo-700", icon: Landmark, path: "/relatorios/financeiro/contas-bancarias" },
];

const DRE_GROUP_IDS = [
  { id: "1T", label: "Receita Bruta de Venda", bold: true },
  { id: "CMV", label: "(-) CMV - Custo Mercadoria Vendida" },
  { id: "4", label: "(-) Custos Variáveis" },
  { id: "5", label: "(-) Despesas Fixas" },
  { id: "7", label: "(-) Despesas Não Operacionais" },
  { id: "7T", label: "= Resultado Líquido", bold: true, highlight: true },
];

const topLucrativos: { nome: string; margem: string; lucro: string }[] = [];

function getValorByIdAndMonth(id: string, mesIndex: number): number {
  const cat = dreCategorias.find((c) => c.id === id);
  return cat ? cat.valores[mesIndex] || 0 : 0;
}

export default function RelatoriosFinanceiros() {
  const navigate = useNavigate();

  // Use the last month that has data (find rightmost month with non-zero values)
  const { mesIndex, mesLabel } = useMemo(() => {
    for (let i = meses.length - 1; i >= 0; i--) {
      const receita = getValorByIdAndMonth("1T", i);
      const custos = getValorByIdAndMonth("4", i);
      const despesas = getValorByIdAndMonth("5", i);
      if (receita !== 0 || custos !== 0 || despesas !== 0) {
        return { mesIndex: i, mesLabel: meses[i] };
      }
    }
    return { mesIndex: meses.length - 1, mesLabel: meses[meses.length - 1] };
  }, []);

  const dreRows = useMemo(() => {
    return DRE_GROUP_IDS.map((g) => {
      const valor = getValorByIdAndMonth(g.id, mesIndex);
      const isDeducao = g.label.startsWith("(-)");
      return {
        label: g.label,
        value: isDeducao ? -Math.abs(valor) : valor,
        bold: g.bold,
        highlight: g.highlight,
      };
    });
  }, [mesIndex]);

  const receita = getValorByIdAndMonth("1T", mesIndex);
  const custos = getValorByIdAndMonth("4", mesIndex);
  const despesas = getValorByIdAndMonth("5", mesIndex);
  const resultado = getValorByIdAndMonth("7T", mesIndex);

  // Build chart data from DRE for all months
  const chartData = useMemo(() => {
    return meses.map((mes, i) => ({
      mes: mes.split("/")[0],
      receita: getValorByIdAndMonth("1T", i),
      cmv: getValorByIdAndMonth("CMV", i),
      custos: getValorByIdAndMonth("4", i),
      despesas: getValorByIdAndMonth("5", i),
      resultado: getValorByIdAndMonth("7T", i),
    }));
  }, []);

  // Calculate change from previous month
  const prevResultado = mesIndex > 0 ? getValorByIdAndMonth("7T", mesIndex - 1) : 0;
  const lucroChange = prevResultado !== 0
    ? ((resultado - prevResultado) / Math.abs(prevResultado) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios financeiros</h1>
        <p className="text-sm text-muted-foreground">DRE automático, análise de rentabilidade e relatórios</p>
      </div>

      {/* DRE Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita Total</p>
                <p className="text-xl font-bold">R$ {receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <Receipt className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Custos Variáveis</p>
                <p className="text-xl font-bold">R$ {custos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <TrendingDown className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Despesas Fixas</p>
                <p className="text-xl font-bold">R$ {despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel glow-primary">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Resultado Líquido</p>
                <p className={`text-xl font-bold ${resultado >= 0 ? "text-success" : "text-destructive"}`}>
                  R$ {resultado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  {Number(lucroChange) >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-success" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-destructive" />
                  )}
                  <span className={Number(lucroChange) >= 0 ? "text-success" : "text-destructive"}>
                    {lucroChange}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DRE Chart */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">DRE - Demonstrativo de Resultados ({meses.length} meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 18%)" />
                <XAxis dataKey="mes" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(225, 22%, 11%)",
                    border: "1px solid hsl(225, 18%, 18%)",
                    borderRadius: "8px",
                    color: "hsl(220, 15%, 92%)",
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="receita" name="Receita" fill="hsl(3, 62%, 46%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="custos" name="Custos Variáveis" fill="hsl(220, 10%, 40%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas Fixas" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resultado" name="Resultado" fill="hsl(150, 60%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* DRE Table + Top products */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">DRE Detalhado - {mesLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dreRows.map((row) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between rounded px-3 py-2 text-sm ${
                    row.highlight ? "bg-primary/10 border border-primary/20" : ""
                  }`}
                >
                  <span className={row.bold ? "font-semibold" : "text-muted-foreground"}>{row.label}</span>
                  <span
                    className={`font-mono ${
                      row.highlight
                        ? `font-bold ${row.value >= 0 ? "text-success" : "text-destructive"}`
                        : row.value < 0
                        ? "text-destructive"
                        : "font-semibold"
                    }`}
                  >
                    {row.value < 0 ? "- " : ""}R$ {Math.abs(row.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 5 Produtos Mais Lucrativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topLucrativos.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">Nenhum dado disponível ainda</p>
              ) : (
                topLucrativos.map((p, i) => (
                  <div key={p.nome} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">Margem: {p.margem}</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-success">{p.lucro}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report cards */}
      <div>
        <h2 className="text-lg font-bold mb-3">Relatórios detalhados</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {relatorios.map((r) => (
            <button
              key={r.titulo}
              onClick={() => navigate(r.path)}
              className={`group relative flex flex-col justify-between rounded-xl bg-gradient-to-br ${r.cor} p-5 text-left text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg min-h-[140px]`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <r.icon className="h-5 w-5 opacity-80" />
                  <h3 className="text-base font-bold leading-tight">{r.titulo}</h3>
                </div>
                <p className="text-xs leading-relaxed opacity-80">{r.descricao}</p>
              </div>
              <div className="flex items-center gap-1 mt-3 text-xs font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                Clique aqui <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
