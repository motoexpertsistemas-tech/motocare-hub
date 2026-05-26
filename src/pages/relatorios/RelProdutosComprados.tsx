import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Check, X, ArrowLeft, ChevronsUpDown, Loader2 } from "lucide-react";
import { fetchAllRows } from "@/lib/supabaseFetchAll";
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

export default function RelProdutosComprados() {
  const navigate = useNavigate();
  const [loja, setLoja] = useState("todas");
  const [dataInicio, setDataInicio] = useState("2026-02-01");
  const [dataFim, setDataFim] = useState("2026-02-28");
  const [fornecedor, setFornecedor] = useState("");
  const [grupo, setGrupo] = useState("todos");
  const [produto, setProduto] = useState("");
  const [situacao, setSituacao] = useState("todos");
  const [centroCusto, setCentroCusto] = useState("todos");

  const [openGrupo, setOpenGrupo] = useState(false);
  const [openFornecedor, setOpenFornecedor] = useState(false);
  const [openProduto, setOpenProduto] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch grupos (categorias) from produtos_catalogo
  const { data: grupos = [] } = useQuery({
    queryKey: ["grupos_produtos_relatorio"],
    queryFn: async () => {
      const rows = await fetchAllRows("produtos_catalogo", "categoria", {
        order: { column: "categoria", ascending: true },
      });
      const unique = [...new Set(rows.map((d: any) => d.categoria).filter(Boolean))].sort();
      return unique as string[];
    },
  });

  // Fetch fornecedores
  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores_relatorio_compras"],
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

  // Fetch produtos
  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos_relatorio_compras"],
    queryFn: async () => {
      const rows = await fetchAllRows("produtos_catalogo", "id, nome, codigo_fornecedor", {
        order: { column: "nome", ascending: true },
      });
      return rows;
    },
  });

  const SITUACOES = [
    { value: "todos", label: "Todos" },
    { value: "pendente", label: "Pendente" },
    { value: "aprovado", label: "Aprovado" },
    { value: "enviado", label: "Enviado" },
    { value: "entregue", label: "Entregue" },
    { value: "cancelado", label: "Cancelado" },
  ];

  const limpar = () => {
    setLoja("todas");
    setDataInicio("2026-02-01");
    setDataFim("2026-02-28");
    setFornecedor("");
    setGrupo("todos");
    setProduto("");
    setSituacao("todos");
    setCentroCusto("todos");
  };

  const gerar = async () => {
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Permita pop-ups para abrir o relatório.");
      return;
    }
    w.document.write("<html><body><p style='font-family:Arial;padding:20px;'>Carregando relatório...</p></body></html>");

    setLoading(true);
    try {
      // Build query for pedidos_compra with items
      const PAGE_SIZE = 1000;
      const allPedidos: any[] = [];
      let from = 0;

      while (true) {
        let query: any = supabase
          .from("pedidos_compra")
          .select("id, numero_pedido, fornecedor_id, data_pedido, status, valor_total, forma_pagamento, fornecedores(nome_completo, nome_fantasia), pedidos_compra_itens(id, produto_id, quantidade_pedida, quantidade_recebida, valor_unitario, valor_total, codigo_fornecedor)")
          .gte("data_pedido", `${dataInicio}T00:00:00`)
          .lte("data_pedido", `${dataFim}T23:59:59`)
          .order("data_pedido", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (situacao !== "todos") query = query.eq("status", situacao);

        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) break;
        allPedidos.push(...data);
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      // Filter by fornecedor name
      let filtered = allPedidos;
      if (fornecedor) {
        filtered = filtered.filter((p: any) => {
          const fn = p.fornecedores?.nome_completo || p.fornecedores?.nome_fantasia || "";
          return fn.toLowerCase().includes(fornecedor.toLowerCase());
        });
      }

      // Flatten items and filter by grupo/produto
      const rows: any[] = [];
      for (const pedido of filtered) {
        const items = pedido.pedidos_compra_itens || [];
        for (const item of items) {
          rows.push({
            data: pedido.data_pedido,
            numero_pedido: pedido.numero_pedido,
            fornecedor_nome: pedido.fornecedores?.nome_completo || pedido.fornecedores?.nome_fantasia || "-",
            status: pedido.status,
            produto_id: item.produto_id,
            codigo_fornecedor: item.codigo_fornecedor,
            quantidade: item.quantidade_pedida,
            valor_unitario: item.valor_unitario,
            valor_total: item.valor_total,
          });
        }
      }

      // Filter by produto name if set
      let finalRows = rows;
      if (produto) {
        const produtoObj = produtos.find((p: any) => p.nome === produto);
        if (produtoObj) {
          finalRows = finalRows.filter((r: any) => r.produto_id === produtoObj.id);
        }
      }

      // Filter by grupo (categoria)
      if (grupo !== "todos") {
        const produtosDoGrupo = await supabase
          .from("produtos_catalogo")
          .select("id")
          .eq("categoria", grupo);
        const idsGrupo = new Set((produtosDoGrupo.data || []).map((p: any) => p.id));
        finalRows = finalRows.filter((r: any) => idsGrupo.has(r.produto_id));
      }

      // Get product names for display
      const produtoIds = [...new Set(finalRows.map((r: any) => r.produto_id).filter(Boolean))];
      let produtosMap: Record<string, string> = {};
      if (produtoIds.length > 0) {
        const batches = [];
        for (let i = 0; i < produtoIds.length; i += 50) {
          batches.push(produtoIds.slice(i, i + 50));
        }
        for (const batch of batches) {
          const { data } = await supabase
            .from("produtos_catalogo")
            .select("id, nome")
            .in("id", batch);
          (data || []).forEach((p: any) => { produtosMap[p.id] = p.nome; });
        }
      }

      if (finalRows.length === 0) {
        w.close();
        toast.info("Nenhum produto comprado encontrado com os filtros selecionados.");
        return;
      }

      const geradoEm = new Date().toLocaleString("pt-BR");
      const totalGeral = finalRows.reduce((s: number, r: any) => s + (r.valor_total || 0), 0);
      const totalQtd = finalRows.reduce((s: number, r: any) => s + (r.quantidade || 0), 0);

      const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório de Produtos Comprados</title>
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
<div class="header"><div><h1>Relatório de Produtos Comprados</h1><div class="date">Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} a ${new Date(dataFim).toLocaleDateString("pt-BR")} | Gerado em: ${geradoEm}</div></div></div>
<div class="toolbar">
<button class="btn-excel" onclick="exportExcel()">📊 Exportar Excel</button>
<button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
</div>
<div class="filters">
  ${fornecedor ? `<span><b>Fornecedor:</b> ${fornecedor}</span>` : ""}
  ${grupo !== "todos" ? `<span><b>Grupo:</b> ${grupo}</span>` : ""}
  ${produto ? `<span><b>Produto:</b> ${produto}</span>` : ""}
  ${situacao !== "todos" ? `<span><b>Situação:</b> ${situacao}</span>` : ""}
</div>
<table id="tabela">
<thead><tr>
  <th>Data</th><th>Pedido</th><th>Fornecedor</th><th>Produto</th><th>Cód. Fornecedor</th><th>Qtd</th><th>Vlr Unit.</th><th>Vlr Total</th><th>Situação</th>
</tr></thead>
<tbody>
${finalRows.map((r: any) => `<tr>
  <td>${r.data ? new Date(r.data).toLocaleDateString("pt-BR") : "-"}</td>
  <td>${r.numero_pedido || "-"}</td>
  <td>${r.fornecedor_nome}</td>
  <td>${produtosMap[r.produto_id] || "-"}</td>
  <td>${r.codigo_fornecedor || "-"}</td>
  <td style="text-align:right">${(r.quantidade || 0).toLocaleString("pt-BR")}</td>
  <td style="text-align:right">R$ ${(r.valor_unitario || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
  <td style="text-align:right">R$ ${(r.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
  <td>${r.status || "-"}</td>
</tr>`).join("")}
<tr class="total-row">
  <td colspan="5">TOTAL (${finalRows.length} itens)</td>
  <td style="text-align:right">${totalQtd.toLocaleString("pt-BR")}</td>
  <td></td>
  <td style="text-align:right">R$ ${totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
  <td></td>
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
  const bom = "\\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "produtos_comprados.csv";
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
        <Package className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Relatório de produtos comprados</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Relatórios de estoque &gt; Produtos comprados</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Loja */}
            <div className="space-y-1.5">
              <Label>Loja</Label>
              <Select value={loja} onValueChange={setLoja}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">DKA GERENCIAL</SelectItem>
                  <SelectItem value="matriz">Matriz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data da compra */}
            <div className="space-y-1.5">
              <Label>Data da compra</Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                <span className="text-xs text-muted-foreground">a</span>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
            </div>

            {/* Fornecedor - Combobox */}
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
                              {f.nome_fantasia && f.nome_completo && <span className="ml-2 text-xs text-muted-foreground">({f.nome_fantasia})</span>}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Grupo - Combobox */}
            <div className="space-y-1.5">
              <Label>Grupo</Label>
              <Popover open={openGrupo} onOpenChange={setOpenGrupo}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openGrupo} className="w-full justify-between font-normal h-10">
                    <span className="truncate">{grupo === "todos" ? "Todos" : grupo}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar grupo..." />
                    <CommandList>
                      <CommandEmpty>Nenhum grupo encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { setGrupo("todos"); setOpenGrupo(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", grupo === "todos" ? "opacity-100" : "opacity-0")} />
                          Todos
                        </CommandItem>
                        {grupos.map((g) => (
                          <CommandItem key={g} value={g} onSelect={() => { setGrupo(g); setOpenGrupo(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", grupo === g ? "opacity-100" : "opacity-0")} />
                            {g}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Produto - Combobox */}
            <div className="space-y-1.5">
              <Label>Produto</Label>
              <Popover open={openProduto} onOpenChange={setOpenProduto}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openProduto} className="w-full justify-between font-normal h-10">
                    <span className="truncate">{produto || "Digite para buscar"}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar produto..." />
                    <CommandList>
                      <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { setProduto(""); setOpenProduto(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", !produto ? "opacity-100" : "opacity-0")} />
                          Todos
                        </CommandItem>
                        {produtos.map((p) => (
                          <CommandItem key={p.id} value={`${p.nome} ${p.codigo_fornecedor || ""}`} onSelect={() => { setProduto(p.nome); setOpenProduto(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", produto === p.nome ? "opacity-100" : "opacity-0")} />
                            <span className="truncate">{p.nome}</span>
                            {p.codigo_fornecedor && <span className="ml-2 text-xs text-muted-foreground">({p.codigo_fornecedor})</span>}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Situação */}
            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select value={situacao} onValueChange={setSituacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SITUACOES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Centro de custo */}
            <div className="space-y-1.5">
              <Label>Centro de custo</Label>
              <Select value={centroCusto} onValueChange={setCentroCusto}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={gerar} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              {loading ? "Gerando..." : "Gerar"}
            </Button>
            <Button variant="destructive" onClick={limpar}>
              <X className="h-4 w-4 mr-1" />Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
