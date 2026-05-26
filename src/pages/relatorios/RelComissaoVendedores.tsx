import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Percent, Check, X, ArrowLeft, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useFuncionariosOptions, SITUACOES_FINANCEIRO } from "@/hooks/useRelatorioFilters";
import { useCategoriasClienteRelatorio } from "@/hooks/useRelatorioVendasFilters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function RelComissaoVendedores() {
  const navigate = useNavigate();
  const now = new Date();
  const [loja, setLoja] = useState("todas");
  const [vendedor, setVendedor] = useState("todos");
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString().slice(0, 10);
  });
  const [dataFim, setDataFim] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return d.toISOString().slice(0, 10);
  });
  const [situacao, setSituacao] = useState("todas");
  const [categoria, setCategoria] = useState("todas");
  const [entidade, setEntidade] = useState("cliente");
  const [cliente, setCliente] = useState("");
  const [centroCusto, setCentroCusto] = useState("todos");
  const [considerarDevolucoes, setConsiderarDevolucoes] = useState(false);
  const [comissaoBruta, setComissaoBruta] = useState(false);
  const [openCliente, setOpenCliente] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [semResultados, setSemResultados] = useState(false);

  const { data: funcionarios = [] } = useFuncionariosOptions();
  const { data: categorias = [] } = useCategoriasClienteRelatorio();

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes_rel_comissao"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clientes")
        .select("id, nome_completo, nome_fantasia")
        .eq("ativo", true)
        .order("nome_completo");
      return data || [];
    },
  });

  const { data: centrosCusto = [] } = useQuery({
    queryKey: ["centros_custo_rel_comissao"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ordem_servico")
        .select("centro_custo")
        .not("centro_custo", "is", null)
        .neq("centro_custo", "");
      const unique = [...new Set((data || []).map((r: any) => r.centro_custo as string))].sort();
      return unique;
    },
  });

  const limpar = () => {
    setLoja("todas");
    setVendedor("todos");
    const d1 = new Date(now.getFullYear(), now.getMonth(), 1);
    const d2 = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDataInicio(d1.toISOString().slice(0, 10));
    setDataFim(d2.toISOString().slice(0, 10));
    setSituacao("todas");
    setCategoria("todas");
    setEntidade("cliente");
    setCliente("");
    setCentroCusto("todos");
    setConsiderarDevolucoes(false);
    setComissaoBruta(false);
  };

  const gerar = async () => {
    setGerando(true);
    try {
      // Fetch funcionarios with comissao percentage
      const { data: funcs } = await supabase
        .from("funcionarios")
        .select("id, nome, comissao")
        .eq("ativo", true);
      const funcMap: Record<string, { nome: string; comissao: number }> = {};
      (funcs || []).forEach((f: any) => {
        funcMap[f.nome] = { nome: f.nome, comissao: Number(f.comissao) || 1 };
      });

      // Fetch OS data
      let query = supabase
        .from("ordem_servico")
        .select("id, numero_os, cliente_nome, vendedor, tecnico_responsavel, status, valor_total, valor_total_pecas, valor_total_servicos, created_at, centro_custo")
        .gte("created_at", dataInicio + "T00:00:00")
        .lte("created_at", dataFim + "T23:59:59")
        .order("created_at", { ascending: true });

      if (vendedor !== "todos") {
        const vendedorNome = funcionarios.find((f) => f.id === vendedor)?.nome;
        if (vendedorNome) {
          query = query.or(`vendedor.eq.${vendedorNome},tecnico_responsavel.eq.${vendedorNome}`);
        }
      }

      const { data: ordens, error } = await query;
      if (error) throw error;

      let results = ordens || [];

      // Filter by situacao
      if (situacao !== "todas") {
        const statusMap: Record<string, string[]> = {
          pago: ["Concluída", "Concluida"],
          pendente: ["Aberta", "Em andamento"],
          atrasado: ["Atrasado"],
          cancelado: ["Cancelada"],
        };
        const allowed = statusMap[situacao] || [];
        if (allowed.length > 0) {
          results = results.filter((r: any) => allowed.some((s) => r.status?.toLowerCase() === s.toLowerCase()));
        }
      }

      // Filter by cliente
      if (cliente) {
        results = results.filter((r: any) => r.cliente_nome?.toLowerCase().includes(cliente.toLowerCase()));
      }

      // Filter by centro de custo
      if (centroCusto !== "todos") {
        results = results.filter((r: any) => r.centro_custo === centroCusto);
      }

      // Build report rows
      const rows: any[] = [];
      let codigoCounter = 150000;

      results.forEach((os: any) => {
        const vendedorNome = os.vendedor || os.tecnico_responsavel || "-----";
        const comissaoPerc = funcMap[vendedorNome]?.comissao || funcMap[os.tecnico_responsavel]?.comissao || 1;
        const valorBruto = Number(os.valor_total) || 0;
        const comissaoValor = valorBruto * (comissaoPerc / 100);
        const dateFmt = os.created_at ? new Date(os.created_at).toLocaleDateString("pt-BR") : "";

        const situacaoLabel = os.status === "Concluída" || os.status === "Concluida"
          ? "Confirmado"
          : os.status === "Aberta" || os.status === "Em andamento"
          ? "Em aberto"
          : os.status === "Cancelada"
          ? "Cancelado"
          : "Atrasado";

        const planoContas = (Number(os.valor_total_servicos) || 0) > 0
          ? "Prestações de serviços"
          : "Vendas de produtos";

        rows.push({
          codigo: codigoCounter++,
          destinado: os.cliente_nome || "-----",
          descricao: `Ordem de serviço de nº ${os.numero_os || os.id.slice(0, 8)}`,
          planoContas,
          data: dateFmt,
          situacao: situacaoLabel,
          loja: "DKA GERENCIAL",
          valorBruto,
          comissao: comissaoValor,
          vendedorNome,
        });
      });

      if (rows.length === 0) {
        setSemResultados(true);
        return;
      }
      setSemResultados(false);

      // Group by vendedor for subtotals
      const grouped: Record<string, any[]> = {};
      rows.forEach((r) => {
        const key = r.vendedorNome;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      });

      const formatBRL = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

      const rowsHTML = Object.entries(grouped).map(([vendedorName, vendedorRows]) => {
        const subtotalBruto = vendedorRows.reduce((s, r) => s + r.valorBruto, 0);
        const subtotalComissao = vendedorRows.reduce((s, r) => s + r.comissao, 0);

        const trRows = vendedorRows.map((r) => `
          <tr>
            <td>${r.codigo}</td>
            <td>${r.destinado}</td>
            <td>${r.descricao}</td>
            <td>${r.planoContas}</td>
            <td>${r.data}</td>
            <td>${r.situacao}</td>
            <td>${r.loja}</td>
            <td class="num">${formatBRL(r.valorBruto)}</td>
            <td class="num">${formatBRL(r.comissao)}</td>
          </tr>
        `).join("");

        return trRows + `
          <tr class="subtotal">
            <td colspan="7"><strong>${vendedorName}</strong></td>
            <td class="num"><strong>${formatBRL(subtotalBruto)}</strong></td>
            <td class="num"><strong>${formatBRL(subtotalComissao)}</strong></td>
          </tr>
        `;
      }).join("");

      const totalBruto = rows.reduce((s, r) => s + r.valorBruto, 0);
      const totalComissao = rows.reduce((s, r) => s + r.comissao, 0);

      const dataInicioFmt = new Date(dataInicio + "T12:00:00").toLocaleDateString("pt-BR");
      const dataFimFmt = new Date(dataFim + "T12:00:00").toLocaleDateString("pt-BR");
      const geradoEm = new Date().toLocaleString("pt-BR");

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório de Comissão de Vendedores</title>
      <style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#333;padding:15px}
.header{display:flex;align-items:center;gap:15px;margin-bottom:5px}.header h1{font-size:18px;font-weight:bold}.header .date{font-size:10px;color:#888}
.toolbar{display:flex;gap:10px;margin:10px 0 15px}.toolbar button{padding:8px 18px;border:1px solid #ccc;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600}
.btn-print{background:#2563eb;color:#fff;border-color:#2563eb}.btn-excel{background:#16a34a;color:#fff;border-color:#16a34a}
table{width:100%;border-collapse:collapse;margin-top:5px}th{background:#3b3b3b;color:#fff;padding:5px 6px;font-size:10px;text-align:left;white-space:nowrap}
td{padding:4px 6px;border-bottom:1px solid #ddd;font-size:10px;white-space:nowrap}tr.row-alt{background:#f8f8f8}
.num{text-align:right}.subtotal{background:#edf2f7;font-weight:bold}
.total{background:#3b3b3b;color:#fff;font-weight:bold}.total td{border:none;padding:8px 6px}
.total-count{margin-top:8px;font-size:11px;color:#666}
@media print{.toolbar{display:none!important}body{padding:0}}
      </style></head><body>
<div class="header"><div><h1>Relatório de Comissão de Vendedores</h1><div class="date">Período: ${dataInicioFmt} à ${dataFimFmt} | Gerado em: ${geradoEm}</div></div></div>
<div class="toolbar">
<button class="btn-excel" onclick="exportExcel()">📊 Exportar Excel</button>
<button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
</div>
        <table>
          <thead><tr>
            <th>Código</th><th>Destinado à</th><th>Descrição</th><th>Plano de contas</th>
            <th>Data</th><th>Situação</th><th>Loja</th><th class="num">Valor bruto</th><th class="num">Comissão bruta</th>
          </tr></thead>
          <tbody>
            ${rowsHTML}
            <tr class="total">
              <td colspan="7">TOTAL GERAL</td>
              <td class="num">${formatBRL(totalBruto)}</td>
              <td class="num">${formatBRL(totalComissao)}</td>
            </tr>
          </tbody>
        </table>
        <script>
          function exportExcel() {
            const table = document.querySelector('table');
            const rows = [];
            table.querySelectorAll('tr').forEach(tr => {
              const cells = [];
              tr.querySelectorAll('th, td').forEach(td => {
                cells.push('"' + (td.textContent || '').replace(/"/g, '""').trim() + '"');
              });
              if (cells.length > 0) rows.push(cells.join(';'));
            });
            const csv = '\\uFEFF' + rows.join('\\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'comissao_vendedores.csv';
            a.click();
          }
        </script>
      </body></html>`;

      const w = window.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    } catch (err: any) {
      toast.error("Erro ao gerar relatório: " + (err.message || err));
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios/financeiro")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Percent className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Relatório de comissão de vendedores</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Relatórios financeiros &gt; Comissão de vendedores</p>
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
              <Label>Vendedor</Label>
              <Select value={vendedor} onValueChange={setVendedor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Período</Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                <span className="text-xs text-muted-foreground">a</span>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select value={situacao} onValueChange={setSituacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SITUACOES_FINANCEIRO.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Entidade</Label>
              <Select value={entidade} onValueChange={setEntidade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="fornecedor">Fornecedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                          <Check className={cn("mr-2 h-4 w-4", !cliente ? "opacity-100" : "opacity-0")} />
                          Todos
                        </CommandItem>
                        {clientes.map((c) => (
                          <CommandItem key={c.id} value={`${c.nome_completo} ${c.nome_fantasia || ""}`} onSelect={() => { setCliente(c.nome_completo || ""); setOpenCliente(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", cliente === c.nome_completo ? "opacity-100" : "opacity-0")} />
                            {c.nome_completo}
                            {c.nome_fantasia && <span className="ml-2 text-xs text-muted-foreground">({c.nome_fantasia})</span>}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Centro de custo</Label>
              <Select value={centroCusto} onValueChange={setCentroCusto}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {centrosCusto.map((cc) => (
                    <SelectItem key={cc} value={cc}>{cc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={considerarDevolucoes} onCheckedChange={(v) => setConsiderarDevolucoes(!!v)} />
              Considerar devoluções
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={comissaoBruta} onCheckedChange={(v) => setComissaoBruta(!!v)} />
              Exibir comissão bruta
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={gerar} disabled={gerando}>
              <Check className="h-4 w-4 mr-1" />{gerando ? "Gerando..." : "Gerar"}
            </Button>
            <Button variant="destructive" onClick={limpar}><X className="h-4 w-4 mr-1" />Limpar</Button>
          </div>
        </CardContent>
      </Card>

      {semResultados && (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Percent className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">Nenhum registro de comissão encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou o período selecionado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
