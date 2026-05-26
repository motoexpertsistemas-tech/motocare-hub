import { DollarSign, TrendingUp, TrendingDown, Receipt, ArrowUpRight, ArrowDownRight } from "lucide-react";
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

type DRESectionRow = { label: string; value: number };

function DRESection({
  title,
  header,
  rows,
  total,
  base,
  subtotals,
}: {
  title: string;
  header: [string, string, string];
  rows: DRESectionRow[];
  total: DRESectionRow;
  base: number;
  subtotals?: DRESectionRow[];
}) {
  const fmtPct = (v: number) => ((v / base) * 100).toFixed(2) + "%";
  const fmtVal = (v: number) => "R$ " + v.toLocaleString("pt-BR");

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <div className="bg-muted/60 px-4 py-2 border-b border-border/50">
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border/30">
        <span>{header[0]}</span>
        <span className="text-right w-28">{header[1]}</span>
        <span className="text-right w-20">{header[2]}</span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-1.5 text-sm border-b border-border/20">
          <span className="text-muted-foreground">{r.label}</span>
          <span className="font-mono text-right w-28 text-success">{fmtVal(r.value)}</span>
          <span className="font-mono text-right w-20 text-xs text-muted-foreground">{fmtPct(r.value)}</span>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 text-sm bg-destructive/5 border-b border-border/30">
        <span className="font-bold">{total.label}</span>
        <span className="font-mono font-bold text-right w-28 text-destructive">{fmtVal(total.value)}</span>
        <span className="font-mono font-bold text-right w-20 text-xs">{fmtPct(total.value)}</span>
      </div>
      {subtotals?.map((s) => (
        <div key={s.label} className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 text-sm bg-muted/40">
          <span className="font-bold">{s.label}</span>
          <span className="font-mono font-bold text-right w-28 text-destructive">{fmtVal(s.value)}</span>
          <span className="font-mono font-bold text-right w-20 text-xs">{fmtPct(s.value)}</span>
        </div>
      ))}
    </div>
  );
}

const dreData: { mes: string; receita: number; impostos: number; cmv: number; despesas: number; comissoes: number; lucro: number }[] = [];

const currentMonth = dreData.length > 0 ? dreData[dreData.length - 1] : { mes: "", receita: 0, impostos: 0, cmv: 0, despesas: 0, comissoes: 0, lucro: 0 };
const prevMonth = dreData.length > 1 ? dreData[dreData.length - 2] : { mes: "", receita: 0, impostos: 0, cmv: 0, despesas: 0, comissoes: 0, lucro: 0 };
const lucroChange = prevMonth.lucro !== 0 ? ((currentMonth.lucro - prevMonth.lucro) / prevMonth.lucro * 100).toFixed(1) : "0.0";

const topLucrativos: { nome: string; margem: string; lucro: string }[] = [];

export default function Financeiro() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">DRE automático e análise de rentabilidade</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita Total</p>
                <p className="text-xl font-bold">R$ {currentMonth.receita.toLocaleString("pt-BR")}</p>
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
                <p className="text-xs text-muted-foreground">Impostos</p>
                <p className="text-xl font-bold">R$ {currentMonth.impostos.toLocaleString("pt-BR")}</p>
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
                <p className="text-xs text-muted-foreground">CMV + Despesas</p>
                <p className="text-xl font-bold">
                  R$ {(currentMonth.cmv + currentMonth.despesas).toLocaleString("pt-BR")}
                </p>
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
                <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                <p className="text-xl font-bold text-primary">
                  R$ {currentMonth.lucro.toLocaleString("pt-BR")}
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
          <CardTitle className="text-base">DRE - Demonstrativo de Resultados (6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 18%)" />
                <XAxis dataKey="mes" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(225, 22%, 11%)",
                    border: "1px solid hsl(225, 18%, 18%)",
                    borderRadius: "8px",
                    color: "hsl(220, 15%, 92%)",
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="receita" name="Receita" fill="hsl(3, 62%, 46%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cmv" name="CMV" fill="hsl(220, 10%, 40%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="impostos" name="Impostos" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucro" name="Lucro" fill="hsl(150, 60%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* DRE Table + Top products */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">DRE Detalhado - Fevereiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Receita bruta */}
            <DRESection
              title="Receita bruta"
              header={["Faturado", "Valor", "Percentual"]}
              rows={[
                { label: "Serviços", value: currentMonth.comissoes },
                { label: "Vendas", value: currentMonth.receita - currentMonth.comissoes },
              ]}
              total={{ label: "Total receita bruta (RB)", value: currentMonth.receita }}
              base={currentMonth.receita}
            />

            {/* Custo com serviços, comissões e peças */}
            <DRESection
              title="Custo com serviços, comissões e peças"
              header={["Categoria", "Valor", "Percentual"]}
              rows={[
                { label: "Serviços e comissões", value: currentMonth.comissoes },
                { label: "Peças Aplicadas/Compradas", value: currentMonth.cmv },
              ]}
              total={{ label: "Custo em serviços e mercadorias (CS e MV)", value: currentMonth.cmv + currentMonth.comissoes }}
              base={currentMonth.receita}
              subtotals={[
                { label: "Lucro bruto - Margem de contribuição (MC)", value: currentMonth.receita - currentMonth.cmv - currentMonth.comissoes },
              ]}
            />

            {/* Despesas administrativas */}
            <DRESection
              title="Despesas administrativas"
              header={["Categoria", "Valor", "Percentual"]}
              rows={[
                { label: "Despesas operacionais", value: currentMonth.despesas },
              ]}
              total={{ label: "Total", value: currentMonth.despesas }}
              base={currentMonth.receita}
            />

            {/* Despesas financeiras */}
            <DRESection
              title="Despesas financeiras"
              header={["Categoria", "Valor", "Percentual"]}
              rows={[
                { label: "Impostos sobre vendas", value: currentMonth.impostos },
              ]}
              total={{ label: "Total", value: currentMonth.impostos }}
              base={currentMonth.receita}
            />

            {/* LUCRO TOTAL */}
            <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                <span className="font-bold text-sm">LUCRO TOTAL</span>
                <span className="font-mono font-bold text-sm text-primary text-right w-28">
                  R$ {currentMonth.lucro.toLocaleString("pt-BR")}
                </span>
                <span className="font-mono font-bold text-xs text-primary text-right w-16">
                  {currentMonth.receita > 0 ? ((currentMonth.lucro / currentMonth.receita) * 100).toFixed(2) : "0.00"}%
                </span>
              </div>
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
    </div>
  );
}
