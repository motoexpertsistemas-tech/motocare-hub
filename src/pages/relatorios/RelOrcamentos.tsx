import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Check, X, ArrowLeft, Loader2, ChevronsUpDown, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function RelOrcamentos() {
  const navigate = useNavigate();
  const [loja, setLoja] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [periodoInicio, setPeriodoInicio] = useState("2026-02-01");
  const [periodoFim, setPeriodoFim] = useState("2026-02-28");
  const [cliente, setCliente] = useState("");
  const [vendedor, setVendedor] = useState("todos");
  const [centroCusto, setCentroCusto] = useState("todos");
  const [situacao, setSituacao] = useState("todos");
  const [loading, setLoading] = useState(false);
  const [openCliente, setOpenCliente] = useState(false);
  const [semResultados, setSemResultados] = useState(false);

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes_relatorio_orcamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome_completo, nome_fantasia, telefone")
        .eq("ativo", true)
        .order("nome_completo");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios_relatorio_orcamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const limpar = () => {
    setLoja("todas"); setTipo("todos"); setPeriodoInicio("2026-02-01"); setPeriodoFim("2026-02-28");
    setCliente(""); setVendedor("todos"); setCentroCusto("todos"); setSituacao("todos");
    setSemResultados(false);
  };

  const gerar = async () => {
    setLoading(true);
    setSemResultados(false);
    try {
      let query = supabase
        .from("ordem_servico")
        .select("id, numero, cliente_nome, data_abertura, data_fechamento, status, valor_total, descricao, tecnico_nome")
        .gte("data_abertura", `${periodoInicio}T00:00:00`)
        .lte("data_abertura", `${periodoFim}T23:59:59`)
        .order("data_abertura", { ascending: false });

      if (situacao === "aberto") query = query.eq("status", "Aberta");
      else if (situacao === "andamento") query = query.eq("status", "Em andamento");
      else if (situacao === "concretizado") query = query.eq("status", "Concluída");
      else if (situacao === "cancelado") query = query.eq("status", "Cancelada");

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];

      if (cliente) {
        filtered = filtered.filter((r: any) =>
          (r.cliente_nome || "").toLowerCase().includes(cliente.toLowerCase())
        );
      }

      if (vendedor !== "todos") {
        filtered = filtered.filter((r: any) =>
          (r.tecnico_nome || "").toLowerCase().includes(vendedor.toLowerCase())
        );
      }

      if (filtered.length === 0) {
        setSemResultados(true);
        return;
      }

      const totalGeral = filtered.reduce((s: number, r: any) => s + (r.valor_total || 0), 0);
      const geradoEm = new Date().toLocaleString("pt-BR");

      const payload = JSON.stringify({
        rows: filtered.map((r: any) => ({
          numero: r.numero || (r.id?.substring(0, 8) ?? ""),
          data: r.data_abertura ? new Date(r.data_abertura).toLocaleDateString("pt-BR") : "-",
          cliente: r.cliente_nome || "-",
          descricao: (r.descricao || "-").substring(0, 60),
          tecnico: r.tecnico_nome || "-",
          status: r.status || "-",
          valor: (r.valor_total || 0),
        })),
        totalGeral,
        totalRegistros: filtered.length,
        periodoInicio: new Date(periodoInicio).toLocaleDateString("pt-BR"),
        periodoFim: new Date(periodoFim).toLocaleDateString("pt-BR"),
        geradoEm,
        filtroCliente: cliente || "",
        filtroVendedor: vendedor !== "todos" ? vendedor : "",
        filtroSituacao: situacao !== "todos" ? situacao : "",
      });

      const w = window.open("", "_blank");
      if (!w) { toast.error("Permita pop-ups para abrir o relatório."); return; }

      const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório de Orçamentos</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#333;padding:15px}
.header{display:flex;align-items:center;gap:15px;margin-bottom:5px}.header h1{font-size:18px;font-weight:bold}.header .date{font-size:10px;color:#888}
.toolbar{display:flex;gap:10px;margin:10px 0 15px}.toolbar button{padding:8px 18px;border:1px solid #ccc;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600}
.btn-print{background:#2563eb;color:#fff;border-color:#2563eb}.btn-excel{background:#16a34a;color:#fff;border-color:#16a34a}
.filters{font-size:11px;color:#666;margin-bottom:10px;display:flex;gap:20px;flex-wrap:wrap}
table{width:100%;border-collapse:collapse;margin-top:5px}th{background:#3b3b3b;color:#fff;padding:5px 6px;font-size:10px;text-align:left;white-space:nowrap}
td{padding:4px 6px;border-bottom:1px solid #ddd;font-size:10px;white-space:nowrap}tr:nth-child(even){background:#f8f8f8}
.total-row{font-weight:bold;background:#edf2f7!important;border-top:2px solid #3b3b3b}
.total-count{margin-top:8px;font-size:11px;color:#666}
@media print{.toolbar{display:none!important}body{padding:0}}
</style></head><body>
<div class="header"><div><h1>Relatório de Orçamentos</h1><div class="date" id="subtitulo"></div></div></div>
<div class="toolbar">
<button class="btn-excel" onclick="exportExcel()">📊 Exportar Excel</button>
<button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
</div>
<div class="filters" id="filtros"></div>
<table id="tabela">
<thead><tr>
  <th>Nº</th><th>Data</th><th>Cliente</th><th>Descrição</th><th>Técnico/Vendedor</th><th>Status</th><th>Valor Total</th>
</tr></thead>
<tbody id="corpo"></tbody>
</table>
<script>
var DATA = ${payload};
document.addEventListener("DOMContentLoaded", function(){
  document.getElementById("subtitulo").textContent = "Período: " + DATA.periodoInicio + " a " + DATA.periodoFim + " | Gerado em: " + DATA.geradoEm;
  var f = document.getElementById("filtros");
  if(DATA.filtroCliente) f.innerHTML += "<span><b>Cliente:</b> "+DATA.filtroCliente+"</span>";
  if(DATA.filtroVendedor) f.innerHTML += "<span><b>Vendedor:</b> "+DATA.filtroVendedor+"</span>";
  if(DATA.filtroSituacao) f.innerHTML += "<span><b>Situação:</b> "+DATA.filtroSituacao+"</span>";
  var corpo = document.getElementById("corpo");
  var fmt = function(v){return "R$ "+v.toLocaleString("pt-BR",{minimumFractionDigits:2})};
  DATA.rows.forEach(function(r){
    corpo.innerHTML += "<tr><td>"+r.numero+"</td><td>"+r.data+"</td><td>"+r.cliente+"</td><td>"+r.descricao+"</td><td>"+r.tecnico+"</td><td>"+r.status+"</td><td style='text-align:right'>"+fmt(r.valor)+"</td></tr>";
  });
  corpo.innerHTML += '<tr class="total-row"><td colspan="6">TOTAL ('+DATA.totalRegistros+' registros)</td><td style="text-align:right">'+fmt(DATA.totalGeral)+'</td></tr>';
});
function exportExcel(){
  var t=document.getElementById("tabela");var csv="";
  for(var i=0;i<t.rows.length;i++){var cols=[];for(var j=0;j<t.rows[i].cells.length;j++) cols.push('"'+t.rows[i].cells[j].innerText.replace(/"/g,'""')+'"');csv+=cols.join(";")+\"\\n\";}
  var b=new Blob(["\\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="relatorio_orcamentos.csv";a.click();
}
</script></body></html>`;

      w.document.open();
      w.document.write(htmlContent);
      w.document.close();
    } catch (err: any) {
      toast.error("Erro ao gerar relatório: " + (err?.message || "erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios/vendas")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Relatório de orçamentos</h1>
            <p className="text-xs text-muted-foreground">Início &gt; Relatórios de vendas &gt; Orçamentos</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Loja</Label>
              <Select value={loja} onValueChange={setLoja}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="matriz">Matriz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <Label>Período</Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
                <span className="text-sm text-muted-foreground">a</span>
                <Input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Popover open={openCliente} onOpenChange={setOpenCliente}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openCliente} className="w-full justify-between font-normal h-10">
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
                          <Check className={cn("mr-2 h-4 w-4", !cliente ? "opacity-100" : "opacity-0")} />
                          Todos
                        </CommandItem>
                        {clientes.map((c) => {
                          const nome = c.nome_completo || c.nome_fantasia || c.telefone || "";
                          return (
                            <CommandItem key={c.id} value={nome} onSelect={() => { setCliente(nome); setOpenCliente(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", cliente === nome ? "opacity-100" : "opacity-0")} />
                              {nome}
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
              <Label>Vendedor</Label>
              <Select value={vendedor} onValueChange={setVendedor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Centro de custo</Label>
              <Select value={centroCusto} onValueChange={setCentroCusto}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select value={situacao} onValueChange={setSituacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aberto">Em aberto</SelectItem>
                  <SelectItem value="andamento">Em andamento</SelectItem>
                  <SelectItem value="concretizado">Concretizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={gerar} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              Gerar
            </Button>
            <Button variant="destructive" onClick={limpar}><X className="h-4 w-4 mr-1" />Limpar</Button>
          </div>
        </CardContent>
      </Card>

      {semResultados && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Nenhum orçamento encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou o período selecionado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
