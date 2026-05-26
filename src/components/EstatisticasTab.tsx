import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import {
  Calendar, Download, Eraser, TrendingUp, DollarSign, Target,
  Percent, Wrench, BarChart3, ChevronDown, ChevronRight,
} from "lucide-react";

const tooltipStyle = {
  backgroundColor: "hsl(225, 22%, 11%)",
  border: "1px solid hsl(225, 18%, 18%)",
  borderRadius: "8px",
  color: "hsl(220, 15%, 92%)",
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number) => `${v.toFixed(2).replace(".", ",")}%`;

// Mock monthly data
const dadosMensais: { mes: string; label: string; receita: number; ticketMedioOS: number; custoFornecedor: number; custoOperacional: number; despesaTotal: number; resultado: number; qtdOS: number }[] = [];

export default function EstatisticasTab() {
  const now = new Date();
  const [mesInicial, setMesInicial] = useState(`${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`);
  const [mesFinal, setMesFinal] = useState(`${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`);
  const [tabelaAberta, setTabelaAberta] = useState(true);

  // filtered data
  const dados = dadosMensais;
  const totalMeses = dados.length;

  const totais = useMemo(() => {
    const r = dados.reduce(
      (acc, d) => ({
        receita: acc.receita + d.receita,
        custoFornecedor: acc.custoFornecedor + d.custoFornecedor,
        custoOperacional: acc.custoOperacional + d.custoOperacional,
        despesaTotal: acc.despesaTotal + d.despesaTotal,
        resultado: acc.resultado + d.resultado,
        qtdOS: acc.qtdOS + d.qtdOS,
      }),
      { receita: 0, custoFornecedor: 0, custoOperacional: 0, despesaTotal: 0, resultado: 0, qtdOS: 0 }
    );
    return r;
  }, [dados]);

  const margemContribuicaoValor = totais.receita - totais.custoFornecedor;
  const margemContribuicaoPct = totais.receita > 0 ? (margemContribuicaoValor / totais.receita) * 100 : 0;
  const mediaMargemMensal = totalMeses > 0 ? margemContribuicaoValor / totalMeses : 0;

  const metaEquipe = 0; // configurable
  const valorMetaEquipe = 0;

  const pontoEquilibrio = totais.custoOperacional > 0 && margemContribuicaoPct > 0
    ? totais.custoOperacional / (margemContribuicaoPct / 100)
    : 0;
  const mediaPE = totalMeses > 0 ? pontoEquilibrio / totalMeses : 0;

  const mediaCustoFornecedor = totalMeses > 0 ? totais.custoFornecedor / totalMeses : 0;
  const pctCustoFornecedor = totais.receita > 0 ? (totais.custoFornecedor / totais.receita) * 100 : 0;
  const mediaCustoOperacional = totalMeses > 0 ? totais.custoOperacional / totalMeses : 0;
  const pctCustoOperacional = totais.receita > 0 ? (totais.custoOperacional / totais.receita) * 100 : 0;
  const mediaResultado = totalMeses > 0 ? totais.resultado / totalMeses : 0;
  const pctResultado = totais.receita > 0 ? (totais.resultado / totais.receita) * 100 : 0;

  const mediaResultadoGeral = totalMeses > 0 ? totais.resultado / totalMeses : 0;

  // Chart data for "Média dos resultados"
  const chartResultados = dados.map((d) => ({
    label: d.label,
    resultado: d.resultado,
    media: mediaResultadoGeral,
  }));

  // Chart data for "Ponto de equilíbrio"
  const chartPE = dados.map((d) => {
    const mc = d.receita - d.custoFornecedor;
    const mcPct = d.receita > 0 ? mc / d.receita : 0;
    const pe = mcPct > 0 ? d.custoOperacional / mcPct : 0;
    return {
      label: d.label,
      receita: d.receita,
      despesaTotal: d.despesaTotal,
      custoFornecedor: d.custoFornecedor,
      custoOperacional: d.custoOperacional,
      pontoEquilibrio: pe,
    };
  });

  const kpiCards = [
    {
      title: "Período padrão de apuração",
      value: `${totalMeses} meses`,
      subtitle: `desde ${dados[0]?.mes || "—"}`,
      icon: Calendar,
      color: "hsl(150, 60%, 45%)",
      bgColor: "hsl(150, 60%, 45%)",
    },
    {
      title: "Meta da equipe configurada",
      value: fmtPct(metaEquipe),
      icon: Target,
      color: "hsl(3, 62%, 46%)",
      bgColor: "hsl(3, 62%, 46%)",
    },
    {
      title: "Valor de Meta da equipe",
      value: `R$ ${fmt(valorMetaEquipe)}`,
      icon: DollarSign,
      color: "hsl(45, 90%, 55%)",
      bgColor: "hsl(45, 90%, 55%)",
    },
  ];

  const kpiCards2 = [
    {
      title: "Margem Contribuição",
      lines: [
        `Valor médio mensal R$ ${fmt(mediaMargemMensal)}`,
        `Soma no período R$ ${fmt(margemContribuicaoValor)}`,
      ],
      icon: DollarSign,
      color: "hsl(150, 60%, 45%)",
    },
    {
      title: "Margem Contribuição",
      lines: [
        `Índice médio mensal ${fmtPct(margemContribuicaoPct)}`,
        `Índice no período ${fmtPct(margemContribuicaoPct)}`,
      ],
      icon: Percent,
      color: "hsl(3, 62%, 46%)",
    },
    {
      title: "Ponto Equilíbrio",
      lines: [
        `Valor médio mensal R$ ${fmt(mediaPE)}`,
        `Soma no período R$ ${fmt(pontoEquilibrio)}`,
      ],
      icon: Target,
      color: "hsl(45, 90%, 55%)",
    },
  ];

  const kpiCards3 = [
    {
      title: "Custo Fornecedor/Comissão",
      value: `Média: R$ ${fmt(mediaCustoFornecedor)} (${fmtPct(pctCustoFornecedor)})`,
      icon: Wrench,
      color: "hsl(150, 60%, 45%)",
    },
    {
      title: "Custo operacional",
      value: `Média: R$ ${fmt(mediaCustoOperacional)} (${fmtPct(pctCustoOperacional)})`,
      icon: BarChart3,
      color: "hsl(3, 62%, 46%)",
    },
    {
      title: "Resultado",
      value: `Média: R$ ${fmt(mediaResultado)} (${fmtPct(pctResultado)})`,
      icon: TrendingUp,
      color: "hsl(45, 90%, 55%)",
    },
  ];

  const getResultadoCor = (resultado: number) => {
    if (resultado <= 0) return "bg-destructive/20 text-destructive"; // Prejuízo
    if (resultado >= mediaResultadoGeral) return "bg-green-500/20 text-green-700"; // Acima da média
    return "bg-blue-500/20 text-blue-700"; // Abaixo da média
  };

  return (
    <div className="space-y-6">
      {/* Descrição */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-5 pb-4">
          <p className="text-sm text-muted-foreground">
            Este relatório calcula o indicador econômico, <strong>mês a mês desde o início da oficina</strong>. Ideal para mostrar a{" "}
            <strong>evolução de todos os resultados</strong> com o passar do tempo.
          </p>
        </CardContent>
      </Card>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="border-l-4" style={{ borderLeftColor: kpi.color }}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.bgColor}20` }}>
                  <kpi.icon className="h-5 w-5" style={{ color: kpi.color }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{kpi.title}</p>
                  <p className="text-lg font-bold">{kpi.value}</p>
                  {kpi.subtitle && <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiCards2.map((kpi, i) => (
          <Card key={i} className="border-l-4" style={{ borderLeftColor: kpi.color }}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}20` }}>
                  <kpi.icon className="h-5 w-5" style={{ color: kpi.color }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{kpi.title}</p>
                  {kpi.lines.map((line, j) => (
                    <p key={j} className="text-sm">
                      <span className="text-muted-foreground">{line.split("R$")[0]}</span>
                      {line.includes("R$") && <strong>R${line.split("R$")[1]}</strong>}
                      {!line.includes("R$") && line.includes("%") && (
                        <>
                          <span className="text-muted-foreground">{line.split(/\d/)[0]}</span>
                          <strong>{line.match(/[\d,]+%/)?.[0]}</strong>
                        </>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPI Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiCards3.map((kpi, i) => (
          <Card key={i} className="border-l-4" style={{ borderLeftColor: kpi.color }}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}20` }}>
                  <kpi.icon className="h-5 w-5" style={{ color: kpi.color }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{kpi.title}</p>
                  <p className="text-sm font-semibold">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Período de visualização */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-sm font-semibold mb-3">Período de visualização</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Inicial</span>
              <Input
                value={mesInicial}
                onChange={(e) => setMesInicial(e.target.value)}
                className="w-32 h-9 text-sm"
                placeholder="MM/AAAA"
              />
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Final</span>
              <Input
                value={mesFinal}
                onChange={(e) => setMesFinal(e.target.value)}
                className="w-32 h-9 text-sm"
                placeholder="MM/AAAA"
              />
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Eraser className="h-4 w-4" /> Limpar
            </Button>
            <div className="ml-auto">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" /> Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Média dos resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartResultados}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 90%)" />
                  <XAxis dataKey="label" stroke="hsl(220, 10%, 55%)" fontSize={11} angle={-45} textAnchor="end" height={50} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${fmt(v)}`, ""]} />
                  <Legend />
                  <Line type="monotone" dataKey="resultado" stroke="hsl(3, 62%, 46%)" strokeWidth={2} dot={{ r: 4 }} name="Resultado do mês" />
                  <Line type="monotone" dataKey="media" stroke="hsl(220, 10%, 55%)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Média do resultado no período" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ponto de equilíbrio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartPE}>
                  <defs>
                    <linearGradient id="colorReceitaPE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 90%)" />
                  <XAxis dataKey="label" stroke="hsl(220, 10%, 55%)" fontSize={11} angle={-45} textAnchor="end" height={50} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${fmt(v)}`, ""]} />
                  <Legend />
                  <Area type="monotone" dataKey="receita" stroke="hsl(150, 60%, 45%)" fill="url(#colorReceitaPE)" strokeWidth={2} name="Receita" />
                  <Line type="monotone" dataKey="despesaTotal" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={false} name="Despesa total" />
                  <Line type="monotone" dataKey="custoFornecedor" stroke="hsl(220, 10%, 55%)" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Custo Fornecedor + Comissão" />
                  <Line type="monotone" dataKey="custoOperacional" stroke="hsl(220, 10%, 55%)" strokeWidth={1} strokeDasharray="6 3" dot={false} name="Custo Operacional" />
                  <Line type="monotone" dataKey="pontoEquilibrio" stroke="hsl(200, 70%, 50%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Ponto de equilíbrio" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de resultados mensais */}
      <Card>
        <CardHeader className="pb-2">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setTabelaAberta(!tabelaAberta)}
          >
            {tabelaAberta ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <CardTitle className="text-base">Resultados Mensais</CardTitle>
          </div>
        </CardHeader>
        {tabelaAberta && (
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Mês</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Receita Total</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Ticket Médio OS</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Custo Fornecedor e Comissão</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Custo Operacional</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Despesa Total</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Resultado</th>
                    <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.map((d) => {
                    const cfPct = d.receita > 0 ? (d.custoFornecedor / d.receita) * 100 : 0;
                    const coPct = d.receita > 0 ? (d.custoOperacional / d.receita) * 100 : 0;
                    const dtPct = d.receita > 0 ? (d.despesaTotal / d.receita) * 100 : 0;
                    const resPct = d.receita > 0 ? (d.resultado / d.receita) * 100 : 0;
                    return (
                      <tr key={d.mes} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-primary font-medium">⊙</span>
                            <div>
                              <span className="font-medium">{d.mes}</span>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-2.5 px-3">R$ {fmt(d.receita)}</td>
                        <td className="text-right py-2.5 px-3">R$ {fmt(d.ticketMedioOS)}</td>
                        <td className="text-right py-2.5 px-3">
                          R$ {fmt(d.custoFornecedor)}{" "}
                          <span className="text-muted-foreground text-xs">({fmtPct(cfPct)})</span>
                        </td>
                        <td className="text-right py-2.5 px-3">
                          R$ {fmt(d.custoOperacional)}{" "}
                          <span className="text-muted-foreground text-xs">({fmtPct(coPct)})</span>
                        </td>
                        <td className="text-right py-2.5 px-3">
                          R$ {fmt(d.despesaTotal)}{" "}
                          <span className="text-muted-foreground text-xs">({fmtPct(dtPct)})</span>
                        </td>
                        <td className="text-right py-2.5 px-3 font-bold">R$ {fmt(d.resultado)}</td>
                        <td className="text-center py-2.5 px-3">
                          <Badge variant="outline" className={getResultadoCor(d.resultado)}>
                            ({fmtPct(resPct)})
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legenda */}
            <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground justify-end">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500" /> Lucro positivo acima da média
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" /> Lucro positivo abaixo da média
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-destructive" /> Prejuízo
              </span>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
