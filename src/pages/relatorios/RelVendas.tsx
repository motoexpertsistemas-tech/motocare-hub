import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Check, X, ArrowLeft, Loader2, SearchX,
  Search, Printer, FileSpreadsheet, Columns3, DollarSign, Pencil, ArrowUp, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

type RowOut = {
  loja: string;
  numero: string;
  cliente: string;
  data: string;
  horario: string;
  prazoEntrega: string;
  status: string;
  valorCusto: number;
  valor: number;
  canal: string;
};

type Resultado = {
  rows: RowOut[];
  formasPagamento: Record<string, number>;
  totalGeral: number;
  totalDesconto: number;
  totalFrete: number;
  totalCustos: number;
  lucro: number;
  margemLucro: string;
  ticketMedio: number;
  totalRegistros: number;
  periodoInicio: string;
  periodoFim: string;
  geradoEm: string;
};

const fmt = (v: number) => (v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ALL_COLS = [
  { key: "numero", label: "Nº" },
  { key: "cliente", label: "Cliente" },
  { key: "data", label: "Data" },
  { key: "horario", label: "Horário" },
  { key: "prazoEntrega", label: "Prazo de entrega" },
  { key: "status", label: "Situação" },
  { key: "valorCusto", label: "Valor custo" },
  { key: "valor", label: "Valor" },
  { key: "canal", label: "Canal" },
] as const;

export default function RelVendas() {
  const navigate = useNavigate();
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [loja, setLoja] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [dataVendaInicio, setDataVendaInicio] = useState(firstDay);
  const [dataVendaFim, setDataVendaFim] = useState(lastDay);
  const [dataEntregaInicio, setDataEntregaInicio] = useState("");
  const [dataEntregaFim, setDataEntregaFim] = useState("");
  const [canal, setCanal] = useState("todos");
  const [cliente, setCliente] = useState("");
  const [produto, setProduto] = useState("");
  const [servico, setServico] = useState("");
  const [vendedor, setVendedor] = useState("todos");
  const [situacao, setSituacao] = useState("todos");
  const [formaPagamento, setFormaPagamento] = useState("todos");
  const [transportadora, setTransportadora] = useState("");
  const [centroCusto, setCentroCusto] = useState("todos");
  const [considerarDevolucoes, setConsiderarDevolucoes] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [visibleCols, setVisibleCols] = useState<string[]>(
    ALL_COLS.filter((c) => !["horario", "prazoEntrega", "canal"].includes(c.key)).map((c) => c.key),
  );

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios_rel_vendas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("funcionarios").select("id, nome").eq("ativo", true).order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: formasPg = [] } = useQuery({
    queryKey: ["formas_pg_rel_vendas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("formas_pagamento").select("id, nome").eq("ativo", true).order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const statusOptions = [
    { value: "revisao", label: "Revisão" },
    { value: "atendimento", label: "Atendimento" },
    { value: "em_execucao", label: "Em Execução" },
    { value: "aguardando", label: "Aguardando Peças" },
    { value: "aguardando_pagamento", label: "Aguardando Pagamento" },
    { value: "concretizada", label: "Concretizada" },
    { value: "agendamento", label: "Agendamento" },
    { value: "agendada", label: "Agendada" },
    { value: "pronta", label: "Pronta" },
    { value: "entregue", label: "Entregue" },
    { value: "cancelada", label: "Cancelada" },
    { value: "expresso", label: "Expresso" },
  ];
  const statusLabelMap: Record<string, string> = {};
  statusOptions.forEach((s) => { statusLabelMap[s.value] = s.label; statusLabelMap[s.value.toUpperCase()] = s.label; });

  const periodoLabel = useMemo(() => {
    const d = new Date(dataVendaInicio + "T00:00:00");
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${meses[d.getMonth()]} de ${d.getFullYear()}`;
  }, [dataVendaInicio]);

  const limpar = () => {
    setLoja("todas"); setTipo("todos"); setDataVendaInicio(firstDay); setDataVendaFim(lastDay);
    setDataEntregaInicio(""); setDataEntregaFim(""); setCanal("todos"); setCliente(""); setProduto("");
    setServico(""); setVendedor("todos"); setSituacao("todos"); setFormaPagamento("todos");
    setTransportadora(""); setCentroCusto("todos"); setConsiderarDevolucoes(false);
    setResultado(null);
  };

  const gerar = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("ordem_servico")
        .select("id, numero_os, cliente_nome, data_entrada, data_conclusao, data_prevista_conclusao, status, valor_total, valor_desconto, valor_frete, valor_total_pecas, valor_total_servicos, canal_venda, vendedor, tecnico_responsavel, criado_por")
        .gte("data_entrada", `${dataVendaInicio}T00:00:00`)
        .lte("data_entrada", `${dataVendaFim}T23:59:59`)
        .order("data_entrada", { ascending: false });

      if (situacao !== "todos") query = query.ilike("status", situacao);
      if (canal !== "todos") {
        const canalMap: Record<string, string[]> = {
          balcao: ["balcao", "Balcão", "VENDA BALCÃO"],
          atacado: ["atacado", "Atacado", "VENDA ATACADO"],
          ecommerce: ["ecommerce", "E-commerce", "VENDA E-COMMERCE"],
          os: ["os", "Ordem de Serviço", "ordem_servico", "VENDA ORDEM DE SERVIÇO", "Presencial", "presencial"],
          marketplaces: ["marketplaces", "Marketplaces", "VENDA MARKETPLACES"],
        };
        if (canalMap[canal]) query = query.in("canal_venda", canalMap[canal]);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (cliente) filtered = filtered.filter((r: any) => (r.cliente_nome || "").toLowerCase().includes(cliente.toLowerCase()));
      if (vendedor !== "todos") {
        const vendNome = funcionarios.find((f) => f.id === vendedor)?.nome || vendedor;
        filtered = filtered.filter((r: any) =>
          (r.vendedor || "").toLowerCase().includes(vendNome.toLowerCase()) ||
          (r.tecnico_responsavel || "").toLowerCase().includes(vendNome.toLowerCase()),
        );
      }
      if (!considerarDevolucoes) filtered = filtered.filter((r: any) => r.status !== "Devolvida");

      const { data: movimentacoes } = await supabase
        .from("caixa_movimentacoes")
        .select("observacoes, valor")
        .gte("criado_em", `${dataVendaInicio}T00:00:00`)
        .lte("criado_em", `${dataVendaFim}T23:59:59`);

      const formasPagMap: Record<string, number> = {};
      (movimentacoes || []).forEach((m: any) => {
        const obs = m.observacoes || "";
        const match = obs.match(/- (.+?)(?:\s*\(|$)/);
        if (match) {
          const forma = match[1].trim().toUpperCase();
          formasPagMap[forma] = (formasPagMap[forma] || 0) + (m.valor || 0);
        } else if (m.valor > 0) {
          formasPagMap["OUTROS"] = (formasPagMap["OUTROS"] || 0) + (m.valor || 0);
        }
      });

      const totalGeral = filtered.reduce((s: number, r: any) => s + (r.valor_total || 0), 0);
      const totalDesconto = filtered.reduce((s: number, r: any) => s + (r.valor_desconto || 0), 0);
      const totalFrete = filtered.reduce((s: number, r: any) => s + (r.valor_frete || 0), 0);
      const totalCustos = filtered.reduce((s: number, r: any) => s + (r.valor_total_pecas || 0), 0);
      const lucro = totalGeral - totalCustos;
      const margemLucro = totalGeral > 0 ? ((lucro / totalGeral) * 100).toFixed(2) : "0.00";
      const ticketMedio = filtered.length > 0 ? totalGeral / filtered.length : 0;

      const rows: RowOut[] = filtered.map((r: any) => {
        const de = r.data_entrada ? new Date(r.data_entrada) : null;
        return {
          loja: r.criado_por || "—",
          numero: r.numero_os || (r.id?.substring(0, 8) ?? ""),
          cliente: r.cliente_nome || "Consumidor",
          data: de ? de.toLocaleDateString("pt-BR") : "-",
          horario: de ? de.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "-",
          prazoEntrega: r.data_prevista_conclusao
            ? new Date(r.data_prevista_conclusao).toLocaleDateString("pt-BR")
            : (r.data_conclusao ? new Date(r.data_conclusao).toLocaleDateString("pt-BR") : "-----"),
          status: statusLabelMap[r.status] || r.status || "-",
          valorCusto: r.valor_total_pecas || 0,
          valor: r.valor_total || 0,
          canal: r.canal_venda || "-",
        };
      });

      setResultado({
        rows,
        formasPagamento: formasPagMap,
        totalGeral, totalDesconto, totalFrete, totalCustos, lucro, margemLucro, ticketMedio,
        totalRegistros: rows.length,
        periodoInicio: new Date(dataVendaInicio).toLocaleDateString("pt-BR"),
        periodoFim: new Date(dataVendaFim).toLocaleDateString("pt-BR"),
        geradoEm: new Date().toLocaleString("pt-BR"),
      });
      setShowFilters(false);
      if (rows.length === 0) toast.info("Nenhuma venda encontrada no período.");
    } catch (err: any) {
      toast.error("Erro ao gerar relatório: " + (err?.message || "erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { gerar(); /* carga inicial */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportarCSV = () => {
    if (!resultado) return;
    const cols = ALL_COLS.filter((c) => visibleCols.includes(c.key));
    let csv = cols.map((c) => `"${c.label}"`).join(";") + "\n";
    resultado.rows.forEach((r) => {
      csv += cols.map((c) => {
        const v: any = (r as any)[c.key];
        return typeof v === "number" ? `"${fmt(v)}"` : `"${v ?? ""}"`;
      }).join(";") + "\n";
    });
    csv += "\nFORMAS DE PAGAMENTO\n";
    Object.entries(resultado.formasPagamento).forEach(([k, v]) => { csv += `"${k}";"R$ ${fmt(v)}"\n`; });
    csv += `\n"Valor total";"${fmt(resultado.totalGeral)}"\n"Custos";"${fmt(resultado.totalCustos)}"\n"Lucro";"${fmt(resultado.lucro)} (${resultado.margemLucro}%)"\n`;
    const b = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = "relatorio_vendas.csv"; a.click();
  };

  const imprimir = () => window.print();

  return (
    <div className="space-y-4 print:space-y-2">
      {/* Header */}
      <div className="flex items-center gap-3 print:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios/vendas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <ShoppingCart className="h-6 w-6 text-primary" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Relatório de vendas</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Relatórios de vendas &gt; Vendas</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Columns3 className="h-4 w-4 mr-1.5" />Gerenciar colunas</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-background z-50">
              <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_COLS.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={visibleCols.includes(c.key)}
                  onCheckedChange={(v) =>
                    setVisibleCols((prev) => (v ? [...prev, c.key] : prev.filter((k) => k !== c.key)))
                  }
                >{c.label}</DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={imprimir}>
            <Printer className="h-4 w-4 mr-1.5" />Imprimir
          </Button>
          <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" onClick={exportarCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />Exportar
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-sm font-medium">
            <Calendar className="h-4 w-4" />{periodoLabel}
          </div>
          <Button variant="default" size="sm" className="bg-foreground text-background hover:bg-foreground/90" onClick={() => setShowFilters((v) => !v)}>
            <Search className="h-4 w-4 mr-1.5" />Busca avançada
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="print:hidden">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>Loja</Label>
                <Select value={loja} onValueChange={setLoja}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="todas">Todas</SelectItem><SelectItem value="matriz">Matriz</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="todos">Todos</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data da venda</Label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={dataVendaInicio} onChange={(e) => setDataVendaInicio(e.target.value)} />
                  <span className="text-xs text-muted-foreground">a</span>
                  <Input type="date" value={dataVendaFim} onChange={(e) => setDataVendaFim(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Data de entrega</Label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={dataEntregaInicio} onChange={(e) => setDataEntregaInicio(e.target.value)} />
                  <span className="text-xs text-muted-foreground">a</span>
                  <Input type="date" value={dataEntregaFim} onChange={(e) => setDataEntregaFim(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>Canal</Label>
                <Select value={canal} onValueChange={setCanal}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="balcao">Balcão</SelectItem>
                    <SelectItem value="atacado">Atacado</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="os">Ordem de Serviço</SelectItem>
                    <SelectItem value="marketplaces">Marketplaces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <Input placeholder="Digite para buscar" value={cliente} onChange={(e) => setCliente(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Produto</Label>
                <Input value={produto} onChange={(e) => setProduto(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Serviço</Label>
                <Input value={servico} onChange={(e) => setServico(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>Vendedor</Label>
                <Select value={vendedor} onValueChange={setVendedor}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {funcionarios.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Situação</Label>
                <Select value={situacao} onValueChange={setSituacao}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Forma de pagamento</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {formasPg.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Transportadora</Label>
                <Input placeholder="Digite para buscar" value={transportadora} onChange={(e) => setTransportadora(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={considerarDevolucoes} onCheckedChange={(v) => setConsiderarDevolucoes(!!v)} />
                Considerar devoluções
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="bg-green-600 hover:bg-green-700" onClick={gerar} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                {loading ? "Gerando..." : "Gerar"}
              </Button>
              <Button variant="destructive" onClick={limpar}><X className="h-4 w-4 mr-1" />Limpar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !resultado && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {resultado && resultado.totalRegistros === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <SearchX className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Nenhuma venda encontrada</p>
            <p className="text-xs text-muted-foreground">Ajuste os filtros e tente novamente.</p>
          </CardContent>
        </Card>
      )}

      {resultado && resultado.totalRegistros > 0 && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Valor total */}
            <Card>
              <CardContent className="pt-6 pb-3 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-xs text-muted-foreground">Valor total</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{fmt(resultado.totalGeral)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Total vendido no período</p>
              </CardContent>
              <div className="border-t px-4 py-2 flex justify-between text-xs">
                <span className="text-muted-foreground">Qtd. vendas</span>
                <span className="font-semibold">{resultado.totalRegistros}</span>
              </div>
            </Card>

            {/* Custos */}
            <Card>
              <CardContent className="pt-6 pb-3 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <Pencil className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-xs text-muted-foreground">Custos</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{fmt(resultado.totalCustos)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{fmt(resultado.totalDesconto)} em descontos</p>
              </CardContent>
              <div className="border-t px-4 py-2 flex justify-between text-xs">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-semibold">{fmt(resultado.totalFrete)}</span>
              </div>
            </Card>

            {/* Lucro */}
            <Card>
              <CardContent className="pt-6 pb-3 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center mb-2">
                  <ArrowUp className="h-6 w-6 text-sky-600" />
                </div>
                <p className="text-xs text-muted-foreground">Lucro</p>
                <p className={`text-3xl font-bold mt-1 ${resultado.lucro >= 0 ? "text-sky-600" : "text-red-600"}`}>{fmt(resultado.lucro)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{resultado.margemLucro}% de margem</p>
              </CardContent>
              <div className="border-t px-4 py-2 flex justify-between text-xs">
                <span className="text-muted-foreground">Ticket médio</span>
                <span className="font-semibold">{fmt(resultado.ticketMedio)}</span>
              </div>
            </Card>
          </div>

          {/* Formas de pagamento */}
          <Card>
            <div className="px-4 py-2 border-b text-xs font-semibold uppercase text-muted-foreground tracking-wide">
              Formas de pagamento
            </div>
            <CardContent className="p-0">
              {Object.keys(resultado.formasPagamento).length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma forma de pagamento registrada no período</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                  {Object.entries(resultado.formasPagamento)
                    .sort(([, a], [, b]) => b - a)
                    .map(([k, v]) => (
                      <div key={k} className="border-r border-b last:border-r-0 p-3 text-center">
                        <p className="font-bold text-sm">{fmt(v)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase mt-0.5 truncate">{k}</p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detail table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {ALL_COLS.filter((c) => visibleCols.includes(c.key)).map((c) => (
                      <TableHead key={c.key} className={c.key === "valor" || c.key === "valorCusto" ? "text-right" : ""}>{c.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.rows.map((r, i) => (
                    <TableRow key={i}>
                      {ALL_COLS.filter((c) => visibleCols.includes(c.key)).map((c) => {
                        const v: any = (r as any)[c.key];
                        if (c.key === "valor") return <TableCell key={c.key} className="text-right text-emerald-600 font-medium">{fmt(v)}</TableCell>;
                        if (c.key === "valorCusto") return <TableCell key={c.key} className="text-right">{fmt(v)}</TableCell>;
                        return <TableCell key={c.key}>{v}</TableCell>;
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
