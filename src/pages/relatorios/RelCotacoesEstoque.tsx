import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Check, X, ArrowLeft, Loader2, ChevronsUpDown } from "lucide-react";
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

export default function RelCotacoesEstoque() {
  const navigate = useNavigate();
  const [loja, setLoja] = useState("todas");
  const [fornecedor, setFornecedor] = useState("");
  const [funcionario, setFuncionario] = useState("todos");
  const [periodoInicio, setPeriodoInicio] = useState("2026-02-01");
  const [periodoFim, setPeriodoFim] = useState("2026-02-28");
  const [respondido, setRespondido] = useState("todos");
  const [loading, setLoading] = useState(false);
  const [openFornecedor, setOpenFornecedor] = useState(false);

  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores_relatorio_cotacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("id, nome_completo, nome_fantasia")
        .eq("ativo", true)
        .order("nome_completo");
      if (error) throw error;
      return data || [];
    },
  });

  const limpar = () => {
    setLoja("todas"); setFornecedor(""); setFuncionario("todos");
    setPeriodoInicio("2026-02-01"); setPeriodoFim("2026-02-28"); setRespondido("todos");
  };

  const gerar = async () => {
    const w = window.open("", "_blank");
    if (!w) { toast.error("Permita pop-ups para abrir o relatório."); return; }
    w.document.write("<html><body><p style='font-family:Arial;padding:20px;'>Carregando relatório...</p></body></html>");

    setLoading(true);
    try {
      const PAGE_SIZE = 1000;
      const allCotacoes: any[] = [];
      let from = 0;

      while (true) {
        let query = supabase
          .from("cotacoes")
          .select("id, titulo, fornecedor, status, criado_em, data_envio, data_resposta, observacoes, cotacoes_itens(id, produto_nome, quantidade, preco_unitario, unidade)")
          .gte("criado_em", `${periodoInicio}T00:00:00`)
          .lte("criado_em", `${periodoFim}T23:59:59`)
          .order("criado_em", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) break;
        allCotacoes.push(...data);
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      let filtered = allCotacoes;

      if (fornecedor) {
        filtered = filtered.filter((c: any) =>
          (c.fornecedor || "").toLowerCase().includes(fornecedor.toLowerCase())
        );
      }

      if (respondido === "sim") {
        filtered = filtered.filter((c: any) => c.data_resposta);
      } else if (respondido === "nao") {
        filtered = filtered.filter((c: any) => !c.data_resposta);
      }

      if (filtered.length === 0) {
        w.close();
        toast.info("Nenhuma cotação encontrada com os filtros selecionados.");
        return;
      }

      const geradoEm = new Date().toLocaleString("pt-BR");

      // Flatten to items level
      const rows: any[] = [];
      for (const cot of filtered) {
        const items = cot.cotacoes_itens || [];
        if (items.length === 0) {
          rows.push({
            data: cot.criado_em,
            titulo: cot.titulo,
            fornecedor_nome: cot.fornecedor || "-",
            status: cot.status,
            data_resposta: cot.data_resposta,
            produto: "-",
            quantidade: 0,
            preco_unitario: 0,
            unidade: "-",
          });
        } else {
          for (const item of items) {
            rows.push({
              data: cot.criado_em,
              titulo: cot.titulo,
              fornecedor_nome: cot.fornecedor || "-",
              status: cot.status,
              data_resposta: cot.data_resposta,
              produto: item.produto_nome || "-",
              quantidade: item.quantidade || 0,
              preco_unitario: item.preco_unitario || 0,
              unidade: item.unidade || "UN",
            });
          }
        }
      }

      const totalGeral = rows.reduce((s, r) => s + (r.preco_unitario * r.quantidade), 0);

      const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório de Cotações</title>
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
<div class="header"><div><h1>Relatório de Cotações</h1><div class="date">Período: ${new Date(periodoInicio).toLocaleDateString("pt-BR")} a ${new Date(periodoFim).toLocaleDateString("pt-BR")} | Gerado em: ${geradoEm}</div></div></div>
<div class="toolbar">
<button class="btn-excel" onclick="exportExcel()">📊 Exportar Excel</button>
<button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
</div>
<div class="filters">
  ${fornecedor ? `<span><b>Fornecedor:</b> ${fornecedor}</span>` : ""}
  ${respondido !== "todos" ? `<span><b>Respondido:</b> ${respondido === "sim" ? "Sim" : "Não"}</span>` : ""}
</div>
<table id="tabela">
<thead><tr>
  <th>Data</th><th>Título</th><th>Fornecedor</th><th>Produto</th><th>Unid.</th><th>Qtd</th><th>Vlr Unit.</th><th>Vlr Total</th><th>Status</th><th>Respondido</th>
</tr></thead>
<tbody>
${rows.map((r: any) => `<tr>
  <td>${r.data ? new Date(r.data).toLocaleDateString("pt-BR") : "-"}</td>
  <td>${r.titulo || "-"}</td>
  <td>${r.fornecedor_nome}</td>
  <td>${r.produto}</td>
  <td>${r.unidade}</td>
  <td style="text-align:right">${(r.quantidade || 0).toLocaleString("pt-BR")}</td>
  <td style="text-align:right">R$ ${(r.preco_unitario || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
  <td style="text-align:right">R$ ${((r.preco_unitario || 0) * (r.quantidade || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
  <td>${r.status || "-"}</td>
  <td>${r.data_resposta ? "Sim" : "Não"}</td>
</tr>`).join("")}
<tr class="total-row">
  <td colspan="7">TOTAL (${rows.length} itens)</td>
  <td style="text-align:right">R$ ${totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
  <td colspan="2"></td>
</tr>
</tbody></table>
<script>
function exportExcel() {
  const table = document.getElementById("tabela");
  let csv = "";
  for (const row of table.rows) {
    const cols = [];
    for (const cell of row.cells) cols.push('"' + cell.innerText.replace(/"/g, '""') + '"');
    csv += cols.join(";") + "\\n";
  }
  const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "relatorio_cotacoes.csv";
  a.click();
}
</script></body></html>`;

      w.document.open();
      w.document.write(htmlContent);
      w.document.close();
    } catch (err: any) {
      w.close();
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
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Relatório de cotações</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Relatórios de estoque &gt; Cotações</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Loja</Label>
              <Select value={loja} onValueChange={setLoja}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todas">DKA GERENCIAL</SelectItem><SelectItem value="matriz">Matriz</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fornecedor</Label>
              <Popover open={openFornecedor} onOpenChange={setOpenFornecedor}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openFornecedor} className="w-full justify-between font-normal h-10">
                    <span className="truncate">{fornecedor || "Digite para buscar"}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar fornecedor..." />
                    <CommandList>
                      <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { setFornecedor(""); setOpenFornecedor(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", !fornecedor ? "opacity-100" : "opacity-0")} />
                          Todos
                        </CommandItem>
                        {fornecedores.map((f) => {
                          const nome = f.nome_completo || f.nome_fantasia || "";
                          return (
                            <CommandItem key={f.id} value={nome} onSelect={() => { setFornecedor(nome); setOpenFornecedor(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", fornecedor === nome ? "opacity-100" : "opacity-0")} />
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
              <Label>Funcionário</Label>
              <Select value={funcionario} onValueChange={setFuncionario}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5 lg:col-span-2">
              <Label>Período</Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
                <span className="text-xs text-muted-foreground">a</span>
                <Input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Respondido</Label>
              <Select value={respondido} onValueChange={setRespondido}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent>
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
    </div>
  );
}
