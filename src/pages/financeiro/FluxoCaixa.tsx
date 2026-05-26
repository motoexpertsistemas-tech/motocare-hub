import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, Search, FileSpreadsheet, ArrowLeft, CalendarDays, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  format, startOfMonth, endOfMonth, parseISO, startOfWeek, endOfWeek,
  subMonths, addMonths, startOfDay, endOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = [
  "hsl(150,60%,45%)", "hsl(210,60%,50%)", "hsl(3, 62%, 46%)",
  "hsl(45,100%,50%)", "hsl(280,60%,50%)", "hsl(0,72%,51%)",
];

const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

type PresetKey = "hoje" | "semana" | "mes_passado" | "este_mes" | "proximo_mes" | "todo" | "custom";

function getPresetRange(key: PresetKey): { inicio: string; fim: string } | null {
  const now = new Date();
  switch (key) {
    case "hoje": return { inicio: format(startOfDay(now), "yyyy-MM-dd"), fim: format(endOfDay(now), "yyyy-MM-dd") };
    case "semana": return { inicio: format(startOfWeek(now, { locale: ptBR }), "yyyy-MM-dd"), fim: format(endOfWeek(now, { locale: ptBR }), "yyyy-MM-dd") };
    case "mes_passado": { const d = subMonths(now, 1); return { inicio: format(startOfMonth(d), "yyyy-MM-dd"), fim: format(endOfMonth(d), "yyyy-MM-dd") }; }
    case "este_mes": return { inicio: format(startOfMonth(now), "yyyy-MM-dd"), fim: format(endOfMonth(now), "yyyy-MM-dd") };
    case "proximo_mes": { const d = addMonths(now, 1); return { inicio: format(startOfMonth(d), "yyyy-MM-dd"), fim: format(endOfMonth(d), "yyyy-MM-dd") }; }
    case "todo": return null;
    default: return null;
  }
}

const PRESET_LABELS: Record<PresetKey, string> = {
  hoje: "Hoje",
  semana: "Esta semana",
  mes_passado: "Mês passado",
  este_mes: "Este mês",
  proximo_mes: "Próximo mês",
  todo: "Todo o período",
  custom: "Período personalizado",
};

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FluxoCaixa() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("saldo");
  const [preset, setPreset] = useState<PresetKey>("este_mes");
  const [customAno, setCustomAno] = useState(() => new Date().getFullYear());
  const [customMes, setCustomMes] = useState<number | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [filtroPlanoContas, setFiltroPlanoContas] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const dateRange = useMemo(() => {
    if (preset === "custom" && customMes !== null) {
      const d = new Date(customAno, customMes, 1);
      return { inicio: format(startOfMonth(d), "yyyy-MM-dd"), fim: format(endOfMonth(d), "yyyy-MM-dd") };
    }
    return getPresetRange(preset);
  }, [preset, customAno, customMes]);

  const dateLabel = useMemo(() => {
    if (preset === "custom" && customMes !== null) {
      const d = new Date(customAno, customMes, 1);
      return format(d, "MMMM 'de' yyyy", { locale: ptBR });
    }
    if (preset === "todo") return "Todo o período";
    return PRESET_LABELS[preset];
  }, [preset, customAno, customMes]);

  const mesLabel = useMemo(() => {
    if (preset === "custom" && customMes !== null) {
      return format(new Date(customAno, customMes, 1), "MMMM 'de' yyyy", { locale: ptBR });
    }
    if (preset === "todo") return "Todo o período";
    const r = getPresetRange(preset);
    if (r) return format(parseISO(r.inicio), "MMMM 'de' yyyy", { locale: ptBR });
    return "";
  }, [preset, customAno, customMes]);

  // Fetch movimentacoes
  const { data: movimentacoes = [] } = useQuery({
    queryKey: ["fluxo_mov", dateRange],
    queryFn: async () => {
      let q = supabase
        .from("movimentacoes_financeiras")
        .select("*")
        .order("data_movimentacao");
      if (dateRange) {
        q = q.gte("data_movimentacao", dateRange.inicio).lte("data_movimentacao", dateRange.fim);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch plano de contas
  const { data: planoContas = [] } = useQuery({
    queryKey: ["plano_contas_fluxo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plano_contas")
        .select("id, classificacao, nome, nivel")
        .eq("ativo", true)
        .order("classificacao");
      if (error) throw error;
      return data || [];
    },
  });

  // Filtered
  const filtered = useMemo(() => {
    return movimentacoes.filter(m => {
      if (filtroTipo !== "todos" && m.tipo !== filtroTipo) return false;
      if (filtroPlanoContas !== "todos" && m.plano_conta_id !== filtroPlanoContas) return false;
      return true;
    });
  }, [movimentacoes, filtroTipo, filtroPlanoContas]);

  const recebimentos = useMemo(() => filtered.filter(m => m.tipo === "entrada"), [filtered]);
  const pagamentos = useMemo(() => filtered.filter(m => m.tipo === "saida"), [filtered]);
  const totalRec = useMemo(() => recebimentos.reduce((s, m) => s + Number(m.valor), 0), [recebimentos]);
  const totalPag = useMemo(() => pagamentos.reduce((s, m) => s + Number(m.valor), 0), [pagamentos]);
  const saldo = totalRec - totalPag;

  // Demonstrativo
  const demonstrativoData = useMemo(() => {
    const map: Record<string, { classificacao: string; nome: string; nivel: number; valor: number }> = {};
    movimentacoes.forEach(m => {
      const pc = planoContas.find(p => p.id === m.plano_conta_id);
      if (!pc) return;
      if (!map[pc.id]) map[pc.id] = { classificacao: pc.classificacao, nome: pc.nome, nivel: pc.nivel, valor: 0 };
      map[pc.id].valor += m.tipo === "entrada" ? Number(m.valor) : -Number(m.valor);
    });
    return Object.values(map).sort((a, b) => a.classificacao.localeCompare(b.classificacao));
  }, [movimentacoes, planoContas]);

  // Pie data
  const buildPie = (items: typeof movimentacoes) => {
    const map: Record<string, number> = {};
    items.forEach(m => {
      const pc = planoContas.find(p => p.id === m.plano_conta_id);
      const nome = pc?.nome || "Outros";
      map[nome] = (map[nome] || 0) + Number(m.valor);
    });
    return Object.entries(map).map(([name, value]) => ({ name: `${name} (R$ ${fmtBRL(value)})`, value }));
  };
  const piePag = useMemo(() => buildPie(pagamentos), [pagamentos, planoContas]);
  const pieRec = useMemo(() => buildPie(recebimentos), [recebimentos, planoContas]);

  const getPCName = (planoContaId: string) => planoContas.find(p => p.id === planoContaId)?.nome || "-";

  const renderTable = (items: typeof movimentacoes, label: string, colorClass: string) => (
    <Card>
      <CardContent className="pt-4">
        <h3 className="font-semibold mb-3">{label}</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Plano de contas</TableHead>
                <TableHead>Centro de custo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum registro no período</TableCell></TableRow>
              ) : items.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap">{format(parseISO(m.data_movimentacao), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{m.descricao || "-"}</TableCell>
                  <TableCell>{getPCName(m.plano_conta_id)}</TableCell>
                  <TableCell>{m.centro_custo || "-"}</TableCell>
                  <TableCell className={`text-right font-mono ${colorClass}`}>{fmtBRL(Number(m.valor))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/financeiro")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <BarChart3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Fluxo de caixa</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Financeiro &gt; Fluxo de caixa</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <TabsList>
              <TabsTrigger value="saldo">Saldo</TabsTrigger>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
              <TabsTrigger value="demonstrativo">Demonstrativo</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" className="gap-1">
              <FileSpreadsheet className="h-4 w-4" />Exportar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Popover open={datePickerOpen} onOpenChange={(open) => { setDatePickerOpen(open); if (!open) setShowMonthPicker(false); }}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 min-w-[220px] justify-between capitalize">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <span>{dateLabel}</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 pointer-events-auto" align="end">
                {!showMonthPicker ? (
                  <div className="flex flex-col">
                    {(["hoje", "semana", "mes_passado", "este_mes", "proximo_mes", "todo"] as PresetKey[]).map(k => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => { setPreset(k); setDatePickerOpen(false); }}
                        className={`px-4 py-2.5 text-left text-sm hover:bg-accent transition-colors ${preset === k && preset !== "custom" ? "bg-accent font-semibold text-primary" : ""}`}
                      >
                        {PRESET_LABELS[k]}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowMonthPicker(true); }}
                      className={`px-4 py-2.5 text-left text-sm hover:bg-accent transition-colors border-t ${preset === "custom" ? "bg-accent font-semibold text-primary" : ""}`}
                    >
                      Escolha o período
                    </button>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCustomAno(a => a - 1)}>
                        <ChevronDown className="h-4 w-4 rotate-90" />
                      </Button>
                      <span className="font-semibold text-sm">{customAno}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCustomAno(a => a + 1)}>
                        <ChevronDown className="h-4 w-4 -rotate-90" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {MESES_ABREV.map((m, i) => {
                        const isSelected = preset === "custom" && customMes === i;
                        const isCurrentMonth = i === new Date().getMonth() && customAno === new Date().getFullYear();
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => { setCustomMes(i); setPreset("custom"); setDatePickerOpen(false); }}
                            className={`rounded-md px-2 py-2 text-sm font-medium transition-colors
                              ${isSelected ? "bg-primary text-primary-foreground" : isCurrentMonth ? "border border-primary text-primary" : "hover:bg-accent"}`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t text-xs">
                      <button type="button" onClick={() => setShowMonthPicker(false)} className="text-muted-foreground hover:text-foreground">Voltar</button>
                      <button type="button" onClick={() => { setCustomMes(new Date().getMonth()); setCustomAno(new Date().getFullYear()); setPreset("custom"); setDatePickerOpen(false); }} className="text-primary font-medium hover:underline">Este mês</button>
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Sheet open={buscaAberta} onOpenChange={setBuscaAberta}>
              <SheetTrigger asChild>
                <Button size="sm" className="gap-1"><Search className="h-4 w-4" />Busca avançada</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>Busca avançada</SheetTitle></SheetHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-1.5">
                    <Label>Plano de contas</Label>
                    <Select value={filtroPlanoContas} onValueChange={setFiltroPlanoContas}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {planoContas.map(pc => (
                          <SelectItem key={pc.id} value={pc.id}>{pc.classificacao} - {pc.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Movimentação</Label>
                    <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas</SelectItem>
                        <SelectItem value="entrada">Entrada (Recebimentos)</SelectItem>
                        <SelectItem value="saida">Saída (Pagamentos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={() => setBuscaAberta(false)}>Aplicar</Button>
                    <Button variant="outline" onClick={() => { setFiltroPlanoContas("todos"); setFiltroTipo("todos"); }}>Limpar</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Pagamentos X Recebimentos */}
        <Card className="mt-4">
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2">Pagamentos X Recebimentos</h3>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Saldo:</TableCell>
                  <TableCell className={`text-right font-bold ${saldo >= 0 ? "text-green-600" : "text-destructive"}`}>{fmtBRL(saldo)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Total Recebimentos:</TableCell>
                  <TableCell className="text-right font-bold text-green-600">{fmtBRL(totalRec)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Total Pagamentos:</TableCell>
                  <TableCell className="text-right font-bold text-destructive">{fmtBRL(totalPag)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Saldo */}
        <TabsContent value="saldo" className="space-y-4">
          {renderTable(recebimentos, "Recebimentos", "text-green-600")}
          {renderTable(pagamentos, "Pagamentos", "text-destructive")}
        </TabsContent>

        {/* Resumo */}
        <TabsContent value="resumo" className="space-y-4">
          {renderTable(filtered, "Extrato", "")}
        </TabsContent>

        {/* Estatísticas */}
        <TabsContent value="estatisticas" className="space-y-6">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3">Fluxo de caixa mensal</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: mesLabel, pagamentos: totalPag, recebimentos: totalRec, saldo }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => `R$ ${fmtBRL(v)}`} />
                    <Legend />
                    <Bar dataKey="pagamentos" name="Pagamentos" fill="hsl(0,72%,51%)" radius={[4,4,0,0]} />
                    <Bar dataKey="recebimentos" name="Recebimentos" fill="hsl(150,60%,45%)" radius={[4,4,0,0]} />
                    <Bar dataKey="saldo" name="Saldo" fill="hsl(210,60%,50%)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3">Pagamentos X Recebimentos</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: `Pagamentos (R$ ${fmtBRL(totalPag)})`, value: totalPag || 1 },
                        { name: `Recebimentos (R$ ${fmtBRL(totalRec)})`, value: totalRec || 1 },
                      ]} cx="50%" cy="50%" outerRadius={100} dataKey="value">
                        <Cell fill="hsl(0,72%,51%)" />
                        <Cell fill="hsl(150,60%,45%)" />
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(v: number) => `R$ ${fmtBRL(v)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3">Pagamentos X Plano de contas</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={piePag.length ? piePag : [{ name: "Sem dados", value: 1 }]} cx="50%" cy="50%" outerRadius={100} dataKey="value">
                        {(piePag.length ? piePag : [{ name: "", value: 1 }]).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(v: number) => `R$ ${fmtBRL(v)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3">Recebimentos X Plano de contas</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieRec.length ? pieRec : [{ name: "Sem dados", value: 1 }]} cx="50%" cy="50%" outerRadius={100} dataKey="value">
                        {(pieRec.length ? pieRec : [{ name: "", value: 1 }]).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(v: number) => `R$ ${fmtBRL(v)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Demonstrativo */}
        <TabsContent value="demonstrativo" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3">Demonstrativo por Plano de Contas</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Classificação</TableHead>
                      <TableHead>Plano de contas</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demonstrativoData.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum dado no período</TableCell></TableRow>
                    ) : demonstrativoData.map((d, i) => {
                      const isGroup = d.nivel <= 2;
                      return (
                        <TableRow key={i} className={isGroup ? "bg-muted/50 font-semibold" : ""}>
                          <TableCell>{d.classificacao}</TableCell>
                          <TableCell className={!isGroup ? "pl-8" : ""}>{d.nome}</TableCell>
                          <TableCell className={`text-right font-mono ${d.valor >= 0 ? "text-green-600" : "text-destructive"}`}>
                            {d.valor >= 0 ? "+ " : "- "}{fmtBRL(Math.abs(d.valor))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell colSpan={2}>Resultado Líquido</TableCell>
                      <TableCell className={`text-right font-mono ${saldo >= 0 ? "text-green-600" : "text-destructive"}`}>
                        {saldo >= 0 ? "+ " : "- "}R$ {fmtBRL(Math.abs(saldo))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
