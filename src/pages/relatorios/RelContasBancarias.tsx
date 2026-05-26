import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, Check, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const CORES = [
  "hsl(217, 91%, 60%)",   // blue
  "hsl(142, 71%, 45%)",   // green
  "hsl(0, 84%, 60%)",     // red
  "hsl(45, 93%, 47%)",    // amber
  "hsl(262, 83%, 58%)",   // purple
  "hsl(199, 89%, 48%)",   // cyan
  "hsl(25, 95%, 53%)",    // orange
  "hsl(330, 81%, 60%)",   // pink
];

export default function RelContasBancarias() {
  const navigate = useNavigate();
  const [loja, setLoja] = useState("todas");
  const [contaBancaria, setContaBancaria] = useState("todos");
  const [dataAte, setDataAte] = useState(new Date().toISOString().split("T")[0]);
  const [gerado, setGerado] = useState(false);

  const { data: contas = [] } = useQuery({
    queryKey: ["contas_bancarias_ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_bancarias")
        .select("id, nome, saldo_inicial")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const contasFiltradas = contaBancaria === "todos"
    ? contas
    : contas.filter((c) => c.id === contaBancaria);

  const chartData = contasFiltradas.map((c) => ({
    nome: c.nome,
    saldo: Number(c.saldo_inicial) || 0,
  }));

  const limpar = () => {
    setLoja("todas");
    setContaBancaria("todos");
    setDataAte(new Date().toISOString().split("T")[0]);
    setGerado(false);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios/financeiro")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Landmark className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Relatório de contas bancárias</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Relatórios financeiros &gt; Contas Bancárias</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Loja</Label>
              <Select value={loja} onValueChange={setLoja}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todas">DKA GERENCIAL</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conta bancária</Label>
              <Select value={contaBancaria} onValueChange={setContaBancaria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {contas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Até o dia</Label>
              <Input type="date" value={dataAte} onChange={(e) => setDataAte(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setGerado(true)}>
              <Check className="h-4 w-4 mr-1" />Gerar
            </Button>
            <Button variant="destructive" onClick={limpar}>
              <X className="h-4 w-4 mr-1" />Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {gerado && chartData.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => {
                    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
                    return v.toString();
                  }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `R$ ${formatCurrency(value)}`,
                    "Saldo",
                  ]}
                />
                <Legend
                  formatter={(_value, entry: any) => {
                    const idx = chartData.findIndex((d) => d.nome === entry.payload?.nome);
                    const item = chartData[idx];
                    if (item) return `${item.nome} (${formatCurrency(item.saldo)})`;
                    return _value;
                  }}
                />
                <Bar dataKey="saldo" name="Saldo">
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {gerado && chartData.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma conta bancária encontrada.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
