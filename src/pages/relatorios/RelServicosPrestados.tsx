import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, Check, X, ArrowLeft, Loader2, SearchX, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CANAL_OPTIONS,
  useFuncionariosRelatorio, useClientesRelatorio, useServicosRelatorio, useSituacoesOSRelatorio, getDefaultDates,
} from "@/hooks/useRelatorioVendasFilters";

export default function RelServicosPrestados() {
  const navigate = useNavigate();
  const { firstDay, lastDay } = getDefaultDates();
  const [loja, setLoja] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [dataVendaInicio, setDataVendaInicio] = useState(firstDay);
  const [dataVendaFim, setDataVendaFim] = useState(lastDay);
  const [prazoEntregaInicio, setPrazoEntregaInicio] = useState("");
  const [prazoEntregaFim, setPrazoEntregaFim] = useState("");
  const [cliente, setCliente] = useState("");
  const [servico, setServico] = useState("todos");
  const [vendedor, setVendedor] = useState("todos");
  const [situacao, setSituacao] = useState("todos");
  const [centroCusto, setCentroCusto] = useState("todos");
  const [canal, setCanal] = useState("todos");
  const [loading, setLoading] = useState(false);
  const [semResultados, setSemResultados] = useState(false);
  const [openCliente, setOpenCliente] = useState(false);

  const { data: funcionarios = [] } = useFuncionariosRelatorio();
  const { data: clientes = [] } = useClientesRelatorio();
  const { data: servicos = [] } = useServicosRelatorio();
  const { data: situacoesOS = [] } = useSituacoesOSRelatorio();

  const limpar = () => {
    setLoja("todas"); setTipo("todos"); setDataVendaInicio(firstDay); setDataVendaFim(lastDay);
    setPrazoEntregaInicio(""); setPrazoEntregaFim(""); setCliente(""); setServico("todos");
    setVendedor("todos"); setSituacao("todos"); setCentroCusto("todos"); setCanal("todos");
    setSemResultados(false);
  };

  const gerar = async () => {
    setLoading(true);
    setSemResultados(false);
    const w = window.open("", "_blank");
    if (!w) { toast.error("Permita pop-ups para abrir o relatório."); setLoading(false); return; }
    w.document.write("<html><body><p style='font-family:Arial;padding:20px;'>Carregando relatório...</p></body></html>");
    try {
      let query = supabase
        .from("ordem_servico")
        .select("id, numero_os, cliente_nome, data_entrada, data_prevista_conclusao, data_conclusao, status, valor_total_servicos, canal_venda, vendedor, tecnico_responsavel, criado_por")
        .gte("data_entrada", `${dataVendaInicio}T00:00:00`)
        .lte("data_entrada", `${dataVendaFim}T23:59:59`);

      if (situacao !== "todos") query = query.ilike("status", `%${situacao}%`);
      if (prazoEntregaInicio) query = query.gte("data_prevista_conclusao", `${prazoEntregaInicio}T00:00:00`);
      if (prazoEntregaFim) query = query.lte("data_prevista_conclusao", `${prazoEntregaFim}T23:59:59`);
      if (canal !== "todos") {
        const canalMap: Record<string, string[]> = {
          balcao: ["balcao", "Balcão", "VENDA BALCÃO"],
          atacado: ["atacado", "Atacado", "VENDA ATACADO"],
          ecommerce: ["ecommerce", "E-commerce"],
          os: ["os", "Ordem de Serviço", "ordem_servico", "Presencial", "presencial"],
        };
        if (canalMap[canal]) query = query.in("canal_venda", canalMap[canal]);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (cliente) filtered = filtered.filter((r: any) => (r.cliente_nome || "").toLowerCase().includes(cliente.toLowerCase()));
      if (vendedor !== "todos") filtered = filtered.filter((r: any) => {
        const vendNome = funcionarios.find(f => f.id === vendedor)?.nome || vendedor;
        return (r.vendedor || "").toLowerCase().includes(vendNome.toLowerCase()) ||
               (r.tecnico_responsavel || "").toLowerCase().includes(vendNome.toLowerCase()) ||
               (r.criado_por || "").toLowerCase().includes(vendNome.toLowerCase());
      });

      if (filtered.length === 0) { setSemResultados(true); w.close(); return; }

      // Fetch OS service items (tipo = 'servico')
      const osIds = filtered.map((r: any) => r.id);
      const { data: osServicos } = await supabase
        .from("os_itens")
        .select("os_id, descricao, quantidade, valor_unitario, subtotal, desconto, tipo")
        .in("os_id", osIds)
        .eq("tipo", "servico");

      const allItems = osServicos || [];

      // If filtering by specific service
      if (servico !== "todos") {
        const matchingOsIds = new Set(allItems.filter((s: any) => (s.descricao || "").toLowerCase().includes(servico.toLowerCase())).map((s: any) => s.os_id));
        filtered = filtered.filter((r: any) => matchingOsIds.has(r.id));
        if (filtered.length === 0) { setSemResultados(true); w.close(); return; }
      }

      // Aggregate by service name
      const agg: Record<string, { qtd: number; custoTotal: number; descontoValor: number; valorTotal: number }> = {};
      const filteredIds = new Set(filtered.map((r: any) => r.id));
      allItems.forEach((s: any) => {
        if (!filteredIds.has(s.os_id)) return;
        const nome = (s.descricao || "SERVIÇO").toUpperCase();
        if (!agg[nome]) agg[nome] = { qtd: 0, custoTotal: 0, descontoValor: 0, valorTotal: 0 };
        const qty = s.quantidade || 1;
        agg[nome].qtd += qty;
        agg[nome].descontoValor += (s.desconto || 0);
        agg[nome].valorTotal += (s.subtotal || 0);
      });

      // Sort by quantity desc
      const rows = Object.entries(agg)
        .map(([nome, v]) => ({
          servico: nome,
          quantidade: v.qtd,
          custoMedio: 0,
          descontoValor: v.descontoValor,
          descontoPercentual: v.valorTotal > 0 ? ((v.descontoValor / (v.valorTotal + v.descontoValor)) * 100) : 0,
          custoTotal: v.custoTotal,
          valorMedio: v.qtd > 0 ? (v.valorTotal / v.qtd) : 0,
          valorTotal: v.valorTotal,
        }))
        .sort((a, b) => b.quantidade - a.quantidade);

      if (rows.length === 0) { setSemResultados(true); w.close(); return; }

      const geradoEm = new Date().toLocaleString("pt-BR");
      const periodoInicio = new Date(dataVendaInicio).toLocaleDateString("pt-BR");
      const periodoFim = new Date(dataVendaFim).toLocaleDateString("pt-BR");
      const totalQtd = rows.reduce((s, r) => s + r.quantidade, 0);
      const totalValor = rows.reduce((s, r) => s + r.valorTotal, 0);

      const payload = JSON.stringify({ rows, totalQtd, totalValor, periodoInicio, periodoFim, geradoEm });

      const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório de Serviços Prestados</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#333;padding:15px;background:#fff}
.header{margin-bottom:10px}.header h1{font-size:18px;font-weight:bold}.header .date{font-size:10px;color:#888;margin-top:2px}
.toolbar{display:flex;gap:10px;margin:10px 0 15px}.toolbar button{padding:8px 18px;border:1px solid #ccc;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600}
.btn-print{background:#2563eb;color:#fff;border-color:#2563eb}.btn-excel{background:#16a34a;color:#fff;border-color:#16a34a}
table{width:100%;border-collapse:collapse;font-size:10px}
th{background:#3b3b3b;color:white;padding:6px 8px;text-align:center;white-space:nowrap;font-size:10px}
td{padding:5px 8px;border-bottom:1px solid #ddd;font-size:10px;text-align:center}
tr:nth-child(even){background:#f8f8f8}
td.name{text-align:center;font-weight:500}
.totals-row td{background:#3b3b3b;color:white;font-weight:bold;font-size:11px}
@media print{.toolbar{display:none!important}body{padding:0}}
</style></head><body>
<div class="header"><h1>Relatório de serviços prestados</h1><div class="date">Período: <span id="per"></span><br/>Gerado em <span id="ger"></span></div></div>
<div class="toolbar">
<button class="btn-excel" onclick="exportCSV()">📊 Exportar Excel</button>
<button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
</div>
<div id="content"></div>
<script>
var D=${payload};
document.getElementById("per").textContent=D.periodoInicio+" à "+D.periodoFim;
document.getElementById("ger").textContent=D.geradoEm;
var fmt=function(v){return v.toLocaleString("pt-BR",{minimumFractionDigits:2})};
var c=document.getElementById("content");
var h='<table><thead><tr><th>Serviço</th><th>Quantidade</th><th>Custo médio</th><th>Desconto valor</th><th>Desconto percentual</th><th>Custo total</th><th>Valor médio</th><th>Valor total</th></tr></thead><tbody>';
D.rows.forEach(function(r){
  h+='<tr><td class="name">'+r.servico+'</td><td>'+fmt(r.quantidade)+'</td><td>'+fmt(r.custoMedio)+'</td><td>'+fmt(r.descontoValor)+'</td><td>'+fmt(r.descontoPercentual)+'%</td><td>'+fmt(r.custoTotal)+'</td><td>'+fmt(r.valorMedio)+'</td><td>'+fmt(r.valorTotal)+'</td></tr>';
});
h+='<tr class="totals-row"><td>TOTAL</td><td>'+fmt(D.totalQtd)+'</td><td></td><td></td><td></td><td></td><td></td><td>'+fmt(D.totalValor)+'</td></tr>';
h+='</tbody></table>';
c.innerHTML=h;
function exportCSV(){
  var csv="Serviço;Quantidade;Custo médio;Desconto valor;Desconto percentual;Custo total;Valor médio;Valor total\\n";
  D.rows.forEach(function(r){
    csv+=r.servico+";"+fmt(r.quantidade)+";"+fmt(r.custoMedio)+";"+fmt(r.descontoValor)+";"+fmt(r.descontoPercentual)+"%"+";"+fmt(r.custoTotal)+";"+fmt(r.valorMedio)+";"+fmt(r.valorTotal)+"\\n";
  });
  var bom="\\uFEFF";var blob=new Blob([bom+csv],{type:"text/csv;charset=utf-8;"});
  var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="servicos_prestados.csv";a.click();
}
</script></body></html>`;

      w.document.open();
      w.document.write(html);
      w.document.close();
      toast.success(`${rows.length} serviços encontrados!`);
    } catch (err: any) {
      toast.error("Erro: " + (err?.message || "desconhecido"));
      w.close();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios/vendas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Wrench className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Relatório de serviços prestados</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Relatórios de vendas &gt; Serviços prestados</p>
        </div>
      </div>

      <Card>
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
              <Label>Prazo de entrega</Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={prazoEntregaInicio} onChange={(e) => setPrazoEntregaInicio(e.target.value)} />
                <span className="text-xs text-muted-foreground">a</span>
                <Input type="date" value={prazoEntregaFim} onChange={(e) => setPrazoEntregaFim(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Popover open={openCliente} onOpenChange={setOpenCliente}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-10">
                    <span className="truncate">{cliente || "Digite para buscar"}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { setCliente(""); setOpenCliente(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", !cliente ? "opacity-100" : "opacity-0")} /> Todos
                        </CommandItem>
                        {clientes.map((c) => {
                          const nome = c.nome_completo || c.nome_fantasia || c.telefone || "";
                          return (
                            <CommandItem key={c.id} value={nome} onSelect={() => { setCliente(nome); setOpenCliente(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", cliente === nome ? "opacity-100" : "opacity-0")} /> {nome}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Serviço</Label>
              <Select value={servico} onValueChange={setServico}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {servicos.map(s => <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mecânico</Label>
              <Select value={vendedor} onValueChange={setVendedor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select value={situacao} onValueChange={setSituacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {situacoesOS.map(s => <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Centro de custo</Label>
              <Select value={centroCusto} onValueChange={setCentroCusto}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Canal</Label>
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {CANAL_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={gerar} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}Gerar
            </Button>
            <Button variant="destructive" onClick={limpar}><X className="h-4 w-4 mr-1" />Limpar</Button>
          </div>
        </CardContent>
      </Card>

      {semResultados && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Nenhum serviço encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou o período selecionado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
