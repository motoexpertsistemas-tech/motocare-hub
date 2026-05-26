import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, FileSpreadsheet, Printer, Users, BarChart3, Calendar,
  Building2, TrendingUp, Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSetoresEditaveis } from "@/hooks/useSetoresEditaveis";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface DailyLog {
  date: string;
  funcionarioId: string;
  funcionarioNome: string;
  setorId: string;
  setorNome: string;
  tarefasTotal: number;
  tarefasFeitas: number;
  percentual: number;
}

const MONTHLY_LOG_KEY = "gestao-operacional-monthly-log";

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function loadMonthlyLogs(): DailyLog[] {
  try {
    const saved = localStorage.getItem(MONTHLY_LOG_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveMonthlyLogs(logs: DailyLog[]) {
  localStorage.setItem(MONTHLY_LOG_KEY, JSON.stringify(logs));
}

export function salvarLogDiario(
  funcionarioId: string,
  funcionarioNome: string,
  setorId: string,
  setorNome: string,
  tarefasTotal: number,
  tarefasFeitas: number
) {
  const logs = loadMonthlyLogs();
  const today = new Date().toISOString().split("T")[0];
  const idx = logs.findIndex(
    (l) => l.date === today && l.funcionarioId === funcionarioId && l.setorId === setorId
  );
  const entry: DailyLog = {
    date: today,
    funcionarioId,
    funcionarioNome,
    setorId,
    setorNome,
    tarefasTotal,
    tarefasFeitas,
    percentual: tarefasTotal > 0 ? Math.round((tarefasFeitas / tarefasTotal) * 100) : 0,
  };
  if (idx >= 0) logs[idx] = entry;
  else logs.push(entry);
  saveMonthlyLogs(logs);
}

export default function RelatorioTarefas() {
  const navigate = useNavigate();
  const { setores } = useSetoresEditaveis();
  const [mesSelecionado, setMesSelecionado] = useState(getMonthKey(new Date()));
  const [logs, setLogs] = useState<DailyLog[]>([]);

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios-relatorio"],
    queryFn: async () => {
      const { data } = await supabase
        .from("funcionarios")
        .select("id, nome, cargo, ativo")
        .eq("ativo", true)
        .order("nome");
      return data || [];
    },
  });

  useEffect(() => {
    setLogs(loadMonthlyLogs());
  }, []);

  const meses = useMemo(() => {
    const result: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = getMonthKey(d);
      const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      result.push({ value: key, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return result;
  }, []);

  // Aggregate data per funcionário for selected month
  const dadosMes = useMemo(() => {
    const filtered = logs.filter((l) => l.date.startsWith(mesSelecionado));

    const grouped: Record<string, {
      funcionarioId: string;
      funcionarioNome: string;
      setorNome: string;
      diasTrabalhados: number;
      totalTarefas: number;
      totalFeitas: number;
      percentualMedio: number;
    }> = {};

    filtered.forEach((log) => {
      const key = `${log.funcionarioId}-${log.setorId}`;
      if (!grouped[key]) {
        grouped[key] = {
          funcionarioId: log.funcionarioId,
          funcionarioNome: log.funcionarioNome,
          setorNome: log.setorNome,
          diasTrabalhados: 0,
          totalTarefas: 0,
          totalFeitas: 0,
          percentualMedio: 0,
        };
      }
      grouped[key].diasTrabalhados += 1;
      grouped[key].totalTarefas += log.tarefasTotal;
      grouped[key].totalFeitas += log.tarefasFeitas;
    });

    return Object.values(grouped).map((g) => ({
      ...g,
      percentualMedio: g.totalTarefas > 0 ? Math.round((g.totalFeitas / g.totalTarefas) * 100) : 0,
    })).sort((a, b) => b.percentualMedio - a.percentualMedio);
  }, [logs, mesSelecionado]);

  // Stats
  const mediaGeral = dadosMes.length > 0
    ? Math.round(dadosMes.reduce((s, d) => s + d.percentualMedio, 0) / dadosMes.length)
    : 0;
  const melhor = dadosMes.length > 0 ? dadosMes[0] : null;
  const totalFuncionarios = dadosMes.length;

  const getStatusBadge = (pct: number) => {
    if (pct >= 90) return <Badge className="bg-green-500 text-white">Excelente</Badge>;
    if (pct >= 70) return <Badge className="bg-blue-500 text-white">Bom</Badge>;
    if (pct >= 50) return <Badge className="bg-yellow-500 text-white">Regular</Badge>;
    return <Badge variant="destructive">Atenção</Badge>;
  };

  // Export Excel (CSV)
  const exportarExcel = () => {
    if (dadosMes.length === 0) {
      toast.error("Sem dados para exportar");
      return;
    }
    const header = "Funcionário,Setor,Dias Trabalhados,Tarefas Total,Tarefas Feitas,% Conclusão\n";
    const rows = dadosMes.map((d) =>
      `"${d.funcionarioNome}","${d.setorNome}",${d.diasTrabalhados},${d.totalTarefas},${d.totalFeitas},${d.percentualMedio}%`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-tarefas-${mesSelecionado}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  // Print
  const imprimir = () => {
    const mesLabel = meses.find((m) => m.value === mesSelecionado)?.label || mesSelecionado;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = dadosMes.map((d, i) => `
      <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'}">
        <td style="padding:6px 10px;border:1px solid #ddd">${i + 1}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;font-weight:500">${d.funcionarioNome}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${d.setorNome}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${d.diasTrabalhados}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${d.totalFeitas}/${d.totalTarefas}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;color:${d.percentualMedio >= 70 ? '#16a34a' : d.percentualMedio >= 50 ? '#ca8a04' : '#dc2626'}">${d.percentualMedio}%</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html><head><title>Relatório de Tarefas - ${mesLabel}</title>
      <style>body{font-family:Arial,sans-serif;padding:30px}table{width:100%;border-collapse:collapse;margin-top:20px}
      th{background:#333;color:#fff;padding:8px 10px;border:1px solid #ddd;text-align:left}
      @media print{body{padding:10px}}</style></head>
      <body>
        <h2 style="margin:0">📋 Relatório de Tarefas Diárias</h2>
        <p style="color:#666;margin-top:4px">Período: ${mesLabel} | Funcionários: ${totalFuncionarios} | Média Geral: ${mediaGeral}%</p>
        <table>
          <thead><tr>
            <th>#</th><th>Funcionário</th><th>Setor</th><th>Dias</th><th>Tarefas</th><th>% Conclusão</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:20px;color:#999;font-size:12px">Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-zinc-900 text-white p-6 md:p-8 rounded-b-2xl mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-white mb-3 -ml-2"
          onClick={() => navigate("/gestao-operacional")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Relatório de Tarefas</h1>
            <p className="text-zinc-400 text-sm">Acompanhe o progresso mensal dos funcionários</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8">
        {/* Filters and actions */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meses.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="text-green-700 border-green-300" onClick={exportarExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Exportar Excel
          </Button>
          <Button variant="outline" size="sm" className="text-blue-700 border-blue-300" onClick={imprimir}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Funcionários</p>
                <p className="text-xl font-bold">{totalFuncionarios}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Média Geral</p>
                <p className="text-xl font-bold">{mediaGeral}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Melhor Performance</p>
                <p className="text-sm font-bold truncate">{melhor?.funcionarioNome || "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Setores Ativos</p>
                <p className="text-xl font-bold">{new Set(dadosMes.map(d => d.setorNome)).size}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        {dadosMes.length > 0 ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Desempenho por Funcionário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-800">
                      <TableHead className="text-white font-semibold">#</TableHead>
                      <TableHead className="text-white font-semibold">Funcionário</TableHead>
                      <TableHead className="text-white font-semibold">Setor</TableHead>
                      <TableHead className="text-white font-semibold text-center">Dias</TableHead>
                      <TableHead className="text-white font-semibold text-center">Tarefas</TableHead>
                      <TableHead className="text-white font-semibold text-center">% Conclusão</TableHead>
                      <TableHead className="text-white font-semibold text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dadosMes.map((d, i) => (
                      <TableRow key={`${d.funcionarioId}-${d.setorNome}`} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                        <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                        <TableCell className="font-medium">{d.funcionarioNome}</TableCell>
                        <TableCell className="text-muted-foreground">{d.setorNome}</TableCell>
                        <TableCell className="text-center">{d.diasTrabalhados}</TableCell>
                        <TableCell className="text-center">{d.totalFeitas}/{d.totalTarefas}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <Progress value={d.percentualMedio} className="h-2 w-16" />
                            <span className="font-bold text-sm">{d.percentualMedio}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(d.percentualMedio)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum dado encontrado</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Os dados aparecem conforme os funcionários completam tarefas nos setores.
                <br />Vincule funcionários aos setores e marque tarefas como feitas.
              </p>
              <Button variant="outline" onClick={() => navigate("/gestao-operacional")}>
                Ir para Gestão Operacional
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
