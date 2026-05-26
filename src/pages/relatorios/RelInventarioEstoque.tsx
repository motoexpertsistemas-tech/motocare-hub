import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Check, X, ArrowLeft, Loader2, ChevronsUpDown, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fetchAllRows } from "@/lib/supabaseFetchAll";
import { cn } from "@/lib/utils";

export default function RelInventarioEstoque() {
  const navigate = useNavigate();
  const [loja, setLoja] = useState("todas");
  const [periodoInicio, setPeriodoInicio] = useState("2026-02-01");
  const [periodoFim, setPeriodoFim] = useState("2026-02-28");
  const [nomeProduto, setNomeProduto] = useState("");
  const [codigo, setCodigo] = useState("");
  const [situacao, setSituacao] = useState("independe");
  const [grupo, setGrupo] = useState("todos");
  const [fornecedor, setFornecedor] = useState("");
  const [marca, setMarca] = useState("");
  const [loading, setLoading] = useState(false);
  const [semResultados, setSemResultados] = useState(false);

  const [openGrupo, setOpenGrupo] = useState(false);
  const [openFornecedor, setOpenFornecedor] = useState(false);
  const [openMarca, setOpenMarca] = useState(false);

  const { data: grupos = [] } = useQuery({
    queryKey: ["categorias_inventario"],
    queryFn: async () => {
      const all = await fetchAllRows("produtos_catalogo", "categoria", { order: { column: "categoria", ascending: true } });
      const unique = [...new Set((all as any[]).map(p => p.categoria).filter(Boolean))];
      return unique.sort();
    },
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores_inventario"],
    queryFn: async () => {
      const all = await fetchAllRows("produtos_catalogo", "fornecedor", { order: { column: "fornecedor", ascending: true } });
      const unique = [...new Set((all as any[]).map(p => p.fornecedor).filter(Boolean))];
      return unique.sort();
    },
  });

  const { data: marcas = [] } = useQuery({
    queryKey: ["marcas_inventario"],
    queryFn: async () => {
      const all = await fetchAllRows("produtos_catalogo", "marca", { order: { column: "marca", ascending: true } });
      const unique = [...new Set((all as any[]).map(p => p.marca).filter(Boolean))];
      return unique.sort();
    },
  });

  const limpar = () => {
    setLoja("todas"); setPeriodoInicio("2026-02-01"); setPeriodoFim("2026-02-28");
    setNomeProduto(""); setCodigo(""); setSituacao("independe"); setGrupo("todos"); setFornecedor(""); setMarca("");
    setSemResultados(false);
  };

  const gerar = async () => {
    setLoading(true);
    setSemResultados(false);
    try {
      const allProducts = await fetchAllRows("produtos_catalogo", "id, nome, codigo_cpl, codigo_fornecedor, categoria, marca, cor, ean, unidade, estoque_quantidade, estoque_minimo, preco_custo, fornecedor", {
        order: { column: "nome", ascending: true },
      });

      let filtered = allProducts as any[];

      if (nomeProduto) {
        const q = nomeProduto.toLowerCase();
        filtered = filtered.filter((p: any) => (p.nome || "").toLowerCase().includes(q));
      }
      if (codigo) {
        const q = codigo.toLowerCase();
        filtered = filtered.filter((p: any) =>
          (p.codigo_cpl || "").toLowerCase().includes(q) ||
          (p.codigo_fornecedor || "").toLowerCase().includes(q) ||
          (p.ean || "").toLowerCase().includes(q)
        );
      }
      if (grupo !== "todos") {
        filtered = filtered.filter((p: any) => p.categoria === grupo);
      }
      if (fornecedor) {
        const q = fornecedor.toLowerCase();
        filtered = filtered.filter((p: any) => (p.fornecedor || "").toLowerCase().includes(q));
      }
      if (marca) {
        filtered = filtered.filter((p: any) => p.marca === marca);
      }
      if (situacao === "positivo") {
        filtered = filtered.filter((p: any) => (p.estoque_quantidade || 0) > 0);
      } else if (situacao === "zerado") {
        filtered = filtered.filter((p: any) => (p.estoque_quantidade || 0) === 0);
      } else if (situacao === "negativo") {
        filtered = filtered.filter((p: any) => (p.estoque_quantidade || 0) < 0);
      }

      if (filtered.length === 0) {
        setSemResultados(true);
        return;
      }

      const geradoEm = new Date().toLocaleString("pt-BR");
      const totalQtd = filtered.reduce((s: number, p: any) => s + (p.estoque_quantidade || 0), 0);
      const totalCusto = filtered.reduce((s: number, p: any) => s + ((p.preco_custo || 0) * (p.estoque_quantidade || 0)), 0);

      const payload = JSON.stringify({
        filtered,
        periodoInicio,
        periodoFim,
        geradoEm,
        totalQtd,
        totalCusto,
        nomeProduto,
        codigo,
        grupo,
        fornecedor,
        marca,
        situacao,
      });

      const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Inventário de Estoque</title>
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
<div class="toolbar">
<button class="btn-excel" onclick="exportExcel()">📊 Exportar Excel</button>
<button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
</div>
<div id="content"></div>
<script>
var DATA = ${payload};
document.addEventListener("DOMContentLoaded", function() {
  var d = DATA;
  var fmt = function(v) { return (v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 }); };
  var fmtDate = function(s) { var p = s.split("-"); return p[2]+"/"+p[1]+"/"+p[0]; };
  var html = '<div class="header"><h1>Inventário de Estoque</h1>';
  html += '<p>Período: ' + fmtDate(d.periodoInicio) + ' a ' + fmtDate(d.periodoFim) + ' | Gerado em: ' + d.geradoEm + '</p></div>';
  html += '<div class="filters">';
  if (d.nomeProduto) html += '<span><b>Produto:</b> ' + d.nomeProduto + '</span>';
  if (d.codigo) html += '<span><b>Código:</b> ' + d.codigo + '</span>';
  if (d.grupo !== "todos") html += '<span><b>Grupo:</b> ' + d.grupo + '</span>';
  if (d.fornecedor) html += '<span><b>Fornecedor:</b> ' + d.fornecedor + '</span>';
  if (d.marca) html += '<span><b>Marca:</b> ' + d.marca + '</span>';
  if (d.situacao !== "independe") html += '<span><b>Situação:</b> ' + d.situacao + '</span>';
  html += '</div>';
  html += '<table id="tabela"><thead><tr><th>Código</th><th>Nome</th><th>Categoria</th><th>Marca</th><th>Cód. Barras</th><th>Unid.</th><th>Estoque</th><th>Est. Mín.</th><th>Custo Unit.</th><th>Custo Total</th><th>Fornecedor</th></tr></thead><tbody>';
  d.filtered.forEach(function(p) {
    html += '<tr>';
    html += '<td>' + (p.codigo_cpl || p.codigo_fornecedor || "-") + '</td>';
    html += '<td>' + (p.nome || "-") + '</td>';
    html += '<td>' + (p.categoria || "-") + '</td>';
    html += '<td>' + (p.marca || "-") + '</td>';
    html += '<td>' + (p.ean || "-") + '</td>';
    html += '<td>' + (p.unidade || "UN") + '</td>';
    html += '<td style="text-align:right">' + fmt(p.estoque_quantidade) + '</td>';
    html += '<td style="text-align:right">' + fmt(p.estoque_minimo) + '</td>';
    html += '<td style="text-align:right">R$ ' + fmt(p.preco_custo) + '</td>';
    html += '<td style="text-align:right">R$ ' + fmt((p.preco_custo || 0) * (p.estoque_quantidade || 0)) + '</td>';
    html += '<td>' + (p.fornecedor || "-") + '</td>';
    html += '</tr>';
  });
  html += '<tr class="total-row"><td colspan="6">TOTAL (' + d.filtered.length + ' produtos)</td>';
  html += '<td style="text-align:right">' + fmt(d.totalQtd) + '</td><td></td><td></td>';
  html += '<td style="text-align:right">R$ ' + fmt(d.totalCusto) + '</td><td></td></tr>';
  html += '</tbody></table>';
  document.getElementById("content").innerHTML = html;
});
function exportExcel() {
  var table = document.getElementById("tabela");
  var csv = "";
  for (var i = 0; i < table.rows.length; i++) {
    var cols = [];
    for (var j = 0; j < table.rows[i].cells.length; j++) {
      cols.push('"' + table.rows[i].cells[j].innerText.replace(/"/g, '""') + '"');
    }
    csv += cols.join(";") + "\\n";
  }
  var blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "inventario_estoque.csv";
  a.click();
}
</script></body></html>`;

      const w = window.open("", "_blank");
      if (!w) { toast.error("Permita pop-ups para abrir o relatório."); return; }
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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios/estoque")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <ArrowLeftRight className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Relatório de inventário de estoque</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Relatórios de estoque &gt; Inventário de estoque</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Loja</Label>
              <Select value={loja} onValueChange={setLoja}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todas">DKA GERENCIAL</SelectItem><SelectItem value="matriz">Matriz</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Período</Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
                <span className="text-xs text-muted-foreground">a</span>
                <Input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Nome do produto</Label>
              <Input value={nomeProduto} onChange={(e) => setNomeProduto(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Código</Label>
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Situação em estoque</Label>
              <Select value={situacao} onValueChange={setSituacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="independe">Independe</SelectItem>
                  <SelectItem value="positivo">Positivo</SelectItem>
                  <SelectItem value="zerado">Zerado</SelectItem>
                  <SelectItem value="negativo">Negativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Grupo</Label>
              <Popover open={openGrupo} onOpenChange={setOpenGrupo}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span className="truncate">{grupo === "todos" ? "Todos" : grupo}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar grupo..." />
                    <CommandList>
                      <CommandEmpty>Nenhum grupo encontrado</CommandEmpty>
                      <CommandItem onSelect={() => { setGrupo("todos"); setOpenGrupo(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", grupo === "todos" ? "opacity-100" : "opacity-0")} />
                        Todos
                      </CommandItem>
                      {grupos.map((g) => (
                        <CommandItem key={g} onSelect={() => { setGrupo(g as string); setOpenGrupo(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", grupo === g ? "opacity-100" : "opacity-0")} />
                          {g as string}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Fornecedor</Label>
              <Popover open={openFornecedor} onOpenChange={setOpenFornecedor}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span className="truncate">{fornecedor || "Todos"}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar fornecedor..." />
                    <CommandList>
                      <CommandEmpty>Nenhum fornecedor encontrado</CommandEmpty>
                      <CommandItem onSelect={() => { setFornecedor(""); setOpenFornecedor(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", !fornecedor ? "opacity-100" : "opacity-0")} />
                        Todos
                      </CommandItem>
                      {fornecedores.map((f) => (
                        <CommandItem key={f} onSelect={() => { setFornecedor(f as string); setOpenFornecedor(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", fornecedor === f ? "opacity-100" : "opacity-0")} />
                          {f as string}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Popover open={openMarca} onOpenChange={setOpenMarca}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span className="truncate">{marca || "Todas"}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar marca..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma marca encontrada</CommandEmpty>
                      <CommandItem onSelect={() => { setMarca(""); setOpenMarca(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", !marca ? "opacity-100" : "opacity-0")} />
                        Todas
                      </CommandItem>
                      {marcas.map((m) => (
                        <CommandItem key={m} onSelect={() => { setMarca(m as string); setOpenMarca(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", marca === m ? "opacity-100" : "opacity-0")} />
                          {m as string}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou o período selecionado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
