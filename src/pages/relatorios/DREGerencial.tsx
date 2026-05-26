import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, DollarSign, TrendingDown, TrendingUp, Plus, Trash2, Settings, ChevronDown, ChevronRight, Search, X, Calendar, Printer, FileText, FileSpreadsheet, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { dreCategorias as dreCategoriasIniciais, type DRECategoria } from "./dreData";
import ConfigurarDREDialog from "@/components/ConfigurarDREDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Distribuicao = { nome: string; percentual: number; valor: number };

const distribuicaoInicial: Distribuicao[] = [
  { nome: "Reserva de Investimento", percentual: 10, valor: 0 },
  { nome: "Depreciação de Equipamentos", percentual: 15, valor: 0 },
  { nome: "Capital de Giro", percentual: 20, valor: 0 },
  { nome: "Retirada do Sócio", percentual: 50, valor: 0 },
  { nome: "Participação nos Lucros", percentual: 5, valor: 0 },
];

const fmt = (v: number) => v === 0 ? "0,00" : v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const mesesNomes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const mesesAbrev = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];

function gerarMesesPeriodo(mesIni: string, anoIni: string, mesFim: string, anoFim: string): { label: string; year: number; month: number }[] {
  const mi = mesesNomes.indexOf(mesIni);
  const mf = mesesNomes.indexOf(mesFim);
  const yi = parseInt(anoIni);
  const yf = parseInt(anoFim);
  if (mi < 0 || mf < 0 || isNaN(yi) || isNaN(yf)) return [];
  
  const result: { label: string; year: number; month: number }[] = [];
  let y = yi, m = mi;
  while (y < yf || (y === yf && m <= mf)) {
    result.push({ label: `${mesesAbrev[m]}/${String(y).slice(2)}`, year: y, month: m + 1 });
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return result;
}

function getDateRange(mesIni: string, anoIni: string, mesFim: string, anoFim: string, diaIni?: string, diaFim?: string) {
  const mi = mesesNomes.indexOf(mesIni);
  const mf = mesesNomes.indexOf(mesFim);
  const yi = parseInt(anoIni);
  const yf = parseInt(anoFim);
  
  const startDay = diaIni && parseInt(diaIni) > 0 ? parseInt(diaIni) : 1;
  const endMonth = mf + 1;
  const lastDay = new Date(yf, endMonth, 0).getDate();
  const endDay = diaFim && parseInt(diaFim) > 0 ? Math.min(parseInt(diaFim), lastDay) : lastDay;
  
  const start = `${yi}-${String(mi + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`;
  const end = `${yf}-${String(endMonth).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  return { start, end };
}

// Map which classificacao IDs correspond to which totalizador
const totalizadorMap: Record<string, { children: string[]; operation: "sum" | "diff" }> = {
  "1T": { children: ["1"], operation: "sum" },
  "CMVT": { children: ["1T", "CMV"], operation: "diff" },
  "3T": { children: ["CMVT", "2", "3"], operation: "sum" },
  "4T": { children: ["3T", "4"], operation: "diff" },
  "5T": { children: ["4T", "5"], operation: "diff" },
  "7T": { children: ["5T", "6", "7"], operation: "diff" },
};

export default function DREGerencial() {
  const [viewMode, setViewMode] = useState<"sintetico" | "analitico">("sintetico");
  const [distribuicao, setDistribuicao] = useState<Distribuicao[]>(distribuicaoInicial);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [categorias, setCategorias] = useState<DRECategoria[]>(dreCategoriasIniciais);
  const [configOpen, setConfigOpen] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [buscarPor, setBuscarPor] = useState("data_movimentacao");
  const [periodoInicialDia, setPeriodoInicialDia] = useState("");
  const now = new Date();
  const [periodoInicialMes, setPeriodoInicialMes] = useState(mesesNomes[now.getMonth()]);
  const [periodoInicialAno, setPeriodoInicialAno] = useState(String(now.getFullYear()));
  const [periodoFinalDia, setPeriodoFinalDia] = useState("");
  const [periodoFinalMes, setPeriodoFinalMes] = useState(mesesNomes[now.getMonth()]);
  const [periodoFinalAno, setPeriodoFinalAno] = useState(String(now.getFullYear()));
  const [centroCusto, setCentroCusto] = useState("todos");
  const [mesSelecionado, setMesSelecionado] = useState("todos");

  // Generate months for the selected period
  const mesesPeriodo = useMemo(() => 
    gerarMesesPeriodo(periodoInicialMes, periodoInicialAno, periodoFinalMes, periodoFinalAno),
    [periodoInicialMes, periodoInicialAno, periodoFinalMes, periodoFinalAno]
  );

  const mesesLabels = useMemo(() => mesesPeriodo.map(m => m.label), [mesesPeriodo]);

  // Filtered months based on dropdown selection
  const mesesVisiveis = useMemo(() => {
    if (mesSelecionado === "todos") return mesesLabels;
    return mesesLabels.filter(m => m === mesSelecionado);
  }, [mesSelecionado, mesesLabels]);

  // Date range for DB query
  const dateRange = useMemo(() => 
    getDateRange(periodoInicialMes, periodoInicialAno, periodoFinalMes, periodoFinalAno, periodoInicialDia, periodoFinalDia),
    [periodoInicialMes, periodoInicialAno, periodoFinalMes, periodoFinalAno, periodoInicialDia, periodoFinalDia]
  );

  // Fetch plano_contas ativos
  const { data: planoContasAtivos } = useQuery({
    queryKey: ["plano_contas_ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plano_contas")
        .select("id, classificacao")
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch movimentacoes_financeiras for the period
  const { data: movimentacoes, isLoading: loadingMov } = useQuery({
    queryKey: ["dre_movimentacoes", dateRange.start, dateRange.end, buscarPor, centroCusto],
    queryFn: async () => {
      let query = supabase
        .from("movimentacoes_financeiras" as any)
        .select("plano_conta_id, valor, data_movimentacao, data_vencimento, data_competencia")
        .gte(buscarPor, dateRange.start)
        .lte(buscarPor, dateRange.end);
      
      if (centroCusto !== "todos") {
        query = query.eq("centro_custo", centroCusto);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  // Build a map: classificacao -> month_index -> sum of values
  const valoresPorConta = useMemo(() => {
    const map: Record<string, number[]> = {};
    if (!movimentacoes || !planoContasAtivos) return map;

    // Map plano_conta_id -> classificacao
    const idToClassificacao: Record<string, string> = {};
    for (const pc of planoContasAtivos) {
      idToClassificacao[pc.id] = pc.classificacao;
    }

    for (const mov of movimentacoes) {
      const classificacao = idToClassificacao[mov.plano_conta_id];
      if (!classificacao) continue;

      // Determine which month this belongs to
      const dateField = buscarPor === "data_vencimento" ? mov.data_vencimento 
        : buscarPor === "data_competencia" ? mov.data_competencia 
        : mov.data_movimentacao;
      if (!dateField) continue;

      const d = new Date(dateField);
      const monthIdx = mesesPeriodo.findIndex(m => m.year === d.getFullYear() && m.month === (d.getMonth() + 1));
      if (monthIdx < 0) continue;

      if (!map[classificacao]) map[classificacao] = new Array(mesesPeriodo.length).fill(0);
      map[classificacao][monthIdx] += Number(mov.valor) || 0;
    }

    return map;
  }, [movimentacoes, planoContasAtivos, mesesPeriodo, buscarPor]);

  // Build categorias with real values
  const categoriasComDados = useMemo(() => {
    const numMeses = mesesPeriodo.length;
    const result = categorias.map(cat => ({
      ...cat,
      valores: valoresPorConta[cat.id] || new Array(numMeses).fill(0),
    }));

    // Calculate group totals (nivel 1 and 2): sum of their children
    for (const cat of result) {
      if (cat.nivel === 1 || cat.nivel === 2) {
        const childValues = new Array(numMeses).fill(0);
        for (const child of result) {
          if (child.id !== cat.id && child.id.startsWith(cat.id + ".") && (child.nivel === cat.nivel + 1 || child.nivel === cat.nivel + 2)) {
            for (let i = 0; i < numMeses; i++) {
              childValues[i] += child.valores[i];
            }
          }
        }
        // If the group has actual movimentacoes, use that; otherwise use children sum
        const hasOwnData = valoresPorConta[cat.id];
        if (!hasOwnData) {
          cat.valores = childValues;
        }
      }
    }

    // Calculate totalizadores (nivel 0)
    const catMap: Record<string, number[]> = {};
    for (const cat of result) {
      catMap[cat.id] = cat.valores;
    }

    // Recalculate totalizadores
    for (const cat of result) {
      if (cat.nivel === 0 && totalizadorMap[cat.id]) {
        const config = totalizadorMap[cat.id];
        const vals = new Array(numMeses).fill(0);
        
        if (cat.id === "1T") {
          // Sum of group 1
          const g1 = catMap["1"] || new Array(numMeses).fill(0);
          for (let i = 0; i < numMeses; i++) vals[i] = g1[i];
        } else if (cat.id === "CMVT") {
          // Receita bruta - CMV
          const g1t = catMap["1T"] || new Array(numMeses).fill(0);
          const cmv = catMap["CMV"] || new Array(numMeses).fill(0);
          for (let i = 0; i < numMeses; i++) vals[i] = g1t[i] - cmv[i];
        } else if (cat.id === "3T") {
          // Receita líquida + serviços + outras receitas
          const cmvt = catMap["CMVT"] || new Array(numMeses).fill(0);
          const g2 = catMap["2"] || new Array(numMeses).fill(0);
          const g3 = catMap["3"] || new Array(numMeses).fill(0);
          for (let i = 0; i < numMeses; i++) vals[i] = cmvt[i] + g2[i] + g3[i];
        } else if (cat.id === "4T") {
          // Lucro bruto - custos variáveis
          const g3t = catMap["3T"] || new Array(numMeses).fill(0);
          const g4 = catMap["4"] || new Array(numMeses).fill(0);
          for (let i = 0; i < numMeses; i++) vals[i] = g3t[i] - g4[i];
        } else if (cat.id === "5T") {
          // Margem contribuição - despesas fixas
          const g4t = catMap["4T"] || new Array(numMeses).fill(0);
          const g5 = catMap["5"] || new Array(numMeses).fill(0);
          for (let i = 0; i < numMeses; i++) vals[i] = g4t[i] - g5[i];
        } else if (cat.id === "7T") {
          // Resultado operacional + receitas não operacionais - despesas não operacionais
          const g5t = catMap["5T"] || new Array(numMeses).fill(0);
          const g6 = catMap["6"] || new Array(numMeses).fill(0);
          const g7 = catMap["7"] || new Array(numMeses).fill(0);
          for (let i = 0; i < numMeses; i++) vals[i] = g5t[i] + g6[i] - g7[i];
        }

        cat.valores = vals;
        catMap[cat.id] = vals;
      }
    }

    return result;
  }, [categorias, valoresPorConta, mesesPeriodo]);

  // Filter categorias by active plano_contas
  const categoriasAtivas = useMemo(() => {
    if (!planoContasAtivos) return categoriasComDados;
    const activeSet = new Set(planoContasAtivos.map(p => p.classificacao));
    return categoriasComDados.filter((cat) => {
      if (cat.nivel === 0) return true;
      return activeSet.has(cat.id);
    });
  }, [categoriasComDados, planoContasAtivos]);

  // Get filtered valores for display based on month dropdown selection
  const getFilteredValores = useCallback((cat: DRECategoria) => {
    if (mesSelecionado === "todos") return cat.valores;
    const idx = mesesLabels.indexOf(mesSelecionado);
    return idx >= 0 ? [cat.valores[idx]] : cat.valores;
  }, [mesSelecionado, mesesLabels]);

  // Summary calculations
  const summaryTotals = useMemo(() => {
    const receita = categoriasComDados.find(c => c.id === "1T");
    const resultado = categoriasComDados.find(c => c.id === "7T");
    
    const receitaTotal = receita ? receita.valores.reduce((s, v) => s + v, 0) : 0;
    const resultadoTotal = resultado ? resultado.valores.reduce((s, v) => s + v, 0) : 0;
    
    // Custos + Despesas = Receita - Resultado
    const custosTotal = receitaTotal - resultadoTotal;
    
    return { receitaTotal, custosTotal, resultadoTotal };
  }, [categoriasComDados]);

  // Print DRE function
  const printDRE = useCallback((mode: "sintetico" | "analitico") => {
    const catsToShow = mode === "sintetico"
      ? categoriasAtivas.filter(cat => cat.nivel <= 1)
      : categoriasAtivas;
    const cols = mesesVisiveis;
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Popup bloqueado."); return; }
    const rows = catsToShow.map(cat => {
      const vals = getFilteredValores(cat);
      const total = vals.reduce((s, v) => s + v, 0);
      const isBold = cat.negrito;
      const indent = cat.nivel === 2 ? "padding-left:24px" : cat.nivel === 3 ? "padding-left:48px" : cat.nivel === 1 ? "padding-left:12px" : "";
      const bg = cat.nivel === 0 ? "background:#eef" : "";
      return `<tr style="${bg}"><td style="${indent};${isBold?"font-weight:bold":""}">${cat.id.match(/^\d/) ? cat.id+" " : ""}${cat.label}</td>${vals.map(v=>`<td style="text-align:right;${isBold?"font-weight:bold":""}">${fmt(v)}</td>`).join("")}<td style="text-align:right;font-weight:bold">${fmt(total)}</td></tr>`;
    }).join("");
    printWindow.document.write(`<html><head><title>DRE ${mode==="sintetico"?"Sintético":"Analítico"}</title><style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:4px 8px}th{background:#c00;color:#fff;text-align:right}th:first-child{text-align:left}h2{margin-bottom:4px}p{color:#666;margin-top:0}@media print{body{margin:0}}</style></head><body><h2>DRE Gerencial - ${mode==="sintetico"?"Sintético":"Analítico"}</h2><p>Período: ${cols[0]} – ${cols[cols.length-1]}</p><table><thead><tr><th style="text-align:left">CATEGORIAS</th>${cols.map(m=>`<th>${m}</th>`).join("")}<th>TOTAL</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.print();
  }, [categoriasAtivas, mesesVisiveis, getFilteredValores]);

  const exportExcel = useCallback(() => {
    const cols = mesesVisiveis;
    const header = ["CATEGORIAS", ...cols, "TOTAL"].join(";");
    const rows = categoriasAtivas.map(cat => {
      const vals = getFilteredValores(cat);
      const total = vals.reduce((s, v) => s + v, 0);
      return [`"${cat.id} ${cat.label}"`, ...vals.map(v => String(v)), String(total)].join(";");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dre_gerencial.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo exportado!");
  }, [categoriasAtivas, mesesVisiveis, getFilteredValores]);

  const printResumo = useCallback(() => {
    const catsToShow = categoriasAtivas.filter(cat => cat.nivel <= 1);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = catsToShow.map(cat => {
      const total = getFilteredValores(cat).reduce((s, v) => s + v, 0);
      return `<tr><td style="${cat.negrito?"font-weight:bold":""}">${cat.label}</td><td style="text-align:right;font-weight:bold">${fmt(total)}</td></tr>`;
    }).join("");
    printWindow.document.write(`<html><head><title>DRE Resumo</title><style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px 10px}th{background:#c00;color:#fff}h2{margin-bottom:4px}</style></head><body><h2>DRE - Resumo (Colaboradores)</h2><table><thead><tr><th style="text-align:left">CATEGORIAS</th><th style="text-align:right">TOTAL</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.print();
  }, [categoriasAtivas, getFilteredValores]);

  // Distribuição based on real resultado
  const resultadoLiquido = summaryTotals.resultadoTotal;
  const distribuicaoComValores = distribuicao.map(d => ({
    ...d,
    valor: (d.percentual / 100) * resultadoLiquido,
  }));
  const totalDistribuicao = distribuicao.reduce((s, d) => s + d.percentual, 0);

  const addDistribuicao = () => {
    setDistribuicao([...distribuicao, { nome: "", percentual: 0, valor: 0 }]);
  };

  const removeDistribuicao = (idx: number) => {
    setDistribuicao(distribuicao.filter((_, i) => i !== idx));
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleCategorias = categoriasAtivas.filter(cat => {
    if (viewMode === "sintetico") {
      return cat.nivel <= 1;
    }
    if (cat.nivel <= 1) return true;
    if (cat.nivel === 2) {
      const dotIdx = cat.id.indexOf(".");
      const parentId = dotIdx !== -1 ? cat.id.substring(0, dotIdx) : cat.id;
      return expandedGroups.has(parentId);
    }
    if (cat.nivel === 3) {
      const lastDot = cat.id.lastIndexOf(".");
      if (lastDot === -1) return false;
      const parentId = cat.id.substring(0, lastDot);
      if (expandedGroups.has(parentId)) return true;
      const parentCat = categoriasAtivas.find(c => c.id === parentId);
      if (parentCat && parentCat.nivel === 1) return expandedGroups.has(parentId);
      const grandDot = parentId.indexOf(".");
      if (grandDot !== -1) {
        const grandparentId = parentId.substring(0, grandDot);
        return expandedGroups.has(grandparentId) && expandedGroups.has(parentId);
      }
      return false;
    }
    return true;
  });

  const getPadding = (nivel: number) => {
    switch (nivel) {
      case 0: return "";
      case 1: return "pl-4";
      case 2: return "pl-8";
      case 3: return "pl-12";
      default: return "";
    }
  };

  const handleClear = () => {
    setPeriodoInicialDia("");
    setPeriodoFinalDia("");
    setPeriodoInicialMes(mesesNomes[now.getMonth()]);
    setPeriodoFinalMes(mesesNomes[now.getMonth()]);
    setPeriodoInicialAno(String(now.getFullYear()));
    setPeriodoFinalAno(String(now.getFullYear()));
    setCentroCusto("todos");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">DRE Gerencial</h1>
          </div>
          <p className="text-sm text-muted-foreground">Demonstrativo de Resultado do Exercício</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
            <Settings className="h-4 w-4 mr-1" /> Configurar DRE
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Ações <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-bold text-xs">Imprimir</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => printDRE("sintetico")}>
                <Printer className="h-4 w-4 mr-2" /> DRE Sintético
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => printDRE("analitico")}>
                <Printer className="h-4 w-4 mr-2" /> DRE Analítico
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-bold text-xs">Exportar PDF</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => printDRE("sintetico")}>
                <FileText className="h-4 w-4 mr-2" /> PDF Sintético
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => printDRE("analitico")}>
                <FileText className="h-4 w-4 mr-2" /> PDF Analítico
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-bold text-xs">Exportar Excel</DropdownMenuLabel>
              <DropdownMenuItem onClick={exportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-bold text-xs">Versão Simplificada</DropdownMenuLabel>
              <DropdownMenuItem onClick={printResumo}>
                <ClipboardList className="h-4 w-4 mr-2" /> Resumo (Colaboradores)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { toast.info("Ficha de Preenchimento em breve!"); }}>
                <ClipboardList className="h-4 w-4 mr-2" /> Ficha de Preenchimento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1" /> {mesSelecionado === "todos" ? "Todos os meses" : mesSelecionado} <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMesSelecionado("todos")} className={mesSelecionado === "todos" ? "bg-accent" : ""}>
                Todos os meses
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {mesesLabels.map(m => (
                <DropdownMenuItem key={m} onClick={() => setMesSelecionado(m)} className={mesSelecionado === m ? "bg-accent" : ""}>
                  {m}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant={showAdvancedSearch ? "default" : "destructive"}
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          >
            <Search className="h-4 w-4 mr-1" /> Busca avançada
          </Button>
        </div>
      </div>

      {/* Advanced Search Panel */}
      {showAdvancedSearch && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Buscar por</label>
                <Select value={buscarPor} onValueChange={setBuscarPor}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data_movimentacao">Data de movimentação</SelectItem>
                    <SelectItem value="data_vencimento">Data de vencimento</SelectItem>
                    <SelectItem value="data_competencia">Data de competência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Período inicial</label>
                <div className="flex gap-1">
                  <Input className="h-9 text-xs w-14" placeholder="Dia" value={periodoInicialDia} onChange={e => setPeriodoInicialDia(e.target.value)} />
                  <Select value={periodoInicialMes} onValueChange={setPeriodoInicialMes}>
                    <SelectTrigger className="h-9 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mesesNomes.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={periodoInicialAno} onValueChange={setPeriodoInicialAno}>
                    <SelectTrigger className="h-9 text-xs w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Período final</label>
                <div className="flex gap-1">
                  <Input className="h-9 text-xs w-14" placeholder="Dia" value={periodoFinalDia} onChange={e => setPeriodoFinalDia(e.target.value)} />
                  <Select value={periodoFinalMes} onValueChange={setPeriodoFinalMes}>
                    <SelectTrigger className="h-9 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mesesNomes.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={periodoFinalAno} onValueChange={setPeriodoFinalAno}>
                    <SelectTrigger className="h-9 text-xs w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Centro de custo</label>
                <Select value={centroCusto} onValueChange={setCentroCusto}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Search className="h-4 w-4 mr-1" /> Buscar
              </Button>
              <Button size="sm" variant="outline" onClick={handleClear}>
                <X className="h-4 w-4 mr-1" /> Limpar
              </Button>
            </div>

            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 inline-block">
              Regime de Competência - Exibe todas as movimentações do período
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Receita Bruta</p>
                <p className="text-2xl font-bold">R$ {fmt(summaryTotals.receitaTotal)}</p>
                <p className="text-[10px] text-muted-foreground">Total de vendas no período</p>
              </div>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Custos + Despesas</p>
                <p className="text-2xl font-bold">R$ {fmt(Math.abs(summaryTotals.custosTotal))}</p>
                <p className="text-[10px] text-muted-foreground">Total de gastos no período</p>
              </div>
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Resultado Líquido</p>
                <p className={cn("text-2xl font-bold", summaryTotals.resultadoTotal < 0 ? "text-destructive" : "text-green-600")}>
                  R$ {fmt(summaryTotals.resultadoTotal)}
                </p>
                <p className="text-[10px] text-muted-foreground">Resultado do período</p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DRE Table */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Demonstrativo de Resultado do Exercício
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Período: {mesesVisiveis[0]} – {mesesVisiveis[mesesVisiveis.length - 1]}
            </p>
          </div>
          <div className="flex gap-1 border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("sintetico")}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                viewMode === "sintetico" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Sintético
            </button>
            <button
              onClick={() => setViewMode("analitico")}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                viewMode === "analitico" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Analítico
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingMov ? (
            <div className="p-8 text-center text-muted-foreground">Carregando dados...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-red-600 text-white">
                    <th className="text-left px-3 py-2 font-semibold min-w-[350px]">CATEGORIAS</th>
                    {mesesVisiveis.map((m) => (
                      <th key={m} className="text-right px-2 py-2 font-semibold min-w-[90px]">{m}</th>
                    ))}
                    <th className="text-right px-3 py-2 font-semibold min-w-[100px]">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCategorias.map((cat) => {
                    const filteredVals = getFilteredValores(cat);
                    const total = filteredVals.reduce((s, v) => s + v, 0);
                    const isGroup = viewMode === "analitico" && (cat.nivel === 1 || cat.nivel === 2);
                    const hasChildren = isGroup && categoriasAtivas.some(c => {
                      if (cat.nivel === 2) return c.nivel === 3 && c.id.startsWith(cat.id + ".");
                      return (c.nivel === 2 || c.nivel === 3) && c.id.startsWith(cat.id + ".") && c.id !== cat.id;
                    });
                    const isExpanded = expandedGroups.has(cat.id);

                    return (
                      <tr
                        key={cat.id}
                        className={cn(
                          "border-b border-border/30",
                          cat.cor,
                          isGroup && hasChildren && "cursor-pointer hover:bg-muted/30"
                        )}
                        onClick={hasChildren ? () => toggleGroup(cat.id) : undefined}
                      >
                        <td className={cn("px-3 py-2", cat.negrito ? "font-bold" : "", getPadding(cat.nivel))}>
                          <span className="flex items-center gap-1">
                            {hasChildren && (
                              isExpanded
                                ? <ChevronDown className="h-3 w-3 shrink-0" />
                                : <ChevronRight className="h-3 w-3 shrink-0" />
                            )}
                            {cat.id.match(/^\d/) && <span className="text-muted-foreground mr-1">{cat.id}</span>}
                            {cat.label}
                          </span>
                        </td>
                        {filteredVals.map((v, i) => (
                          <td key={i} className={cn(
                            "text-right px-2 py-2 font-mono",
                            cat.negrito && "font-bold",
                            v < 0 && "text-destructive"
                          )}>
                            {fmt(v)}
                          </td>
                        ))}
                        <td className={cn(
                          "text-right px-3 py-2 font-mono font-bold",
                          total > 0 ? "text-green-700" : total < 0 ? "text-destructive" : ""
                        )}>
                          {fmt(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribuição do Resultado Líquido */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            DISTRIBUIÇÃO DO RESULTADO LÍQUIDO
          </CardTitle>
          <Button variant="outline" size="sm" onClick={addDistribuicao}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">Resultado Líquido Base:</span>
            <span className={cn("text-lg font-bold", resultadoLiquido >= 0 ? "text-primary" : "text-destructive")}>
              R$ {fmt(resultadoLiquido)}
            </span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">Nome</th>
                <th className="text-right py-2 font-medium text-muted-foreground w-[100px]">%</th>
                <th className="text-right py-2 font-medium text-muted-foreground w-[140px]">Valor</th>
                <th className="w-[40px]" />
              </tr>
            </thead>
            <tbody>
              {distribuicaoComValores.map((d, idx) => (
                <tr key={idx} className="border-b border-border/30">
                  <td className="py-2">{d.nome || <span className="text-muted-foreground italic">Sem nome</span>}</td>
                  <td className="text-right py-2 font-mono">{d.percentual.toFixed(2)}%</td>
                  <td className="text-right py-2 font-mono font-semibold">R$ {fmt(d.valor)}</td>
                  <td className="text-right py-2">
                    <button onClick={() => removeDistribuicao(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-3">TOTAL</td>
                <td className={cn("text-right py-3 font-mono", totalDistribuicao === 100 ? "text-green-600" : "text-destructive")}>
                  {totalDistribuicao.toFixed(2)}% {totalDistribuicao === 100 ? "✓" : ""}
                </td>
                <td className="text-right py-3 font-mono text-primary">
                  R$ {fmt(distribuicaoComValores.reduce((s, d) => s + d.valor, 0))}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <ConfigurarDREDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        categorias={categorias}
        onAddConta={(conta) => {
          const groupPrefix = conta.id.substring(0, conta.id.lastIndexOf("."));
          let idx = -1;
          for (let i = categorias.length - 1; i >= 0; i--) {
            if (categorias[i].id.startsWith(groupPrefix + ".")) { idx = i; break; }
          }
          if (idx !== -1) {
            const next = [...categorias];
            next.splice(idx + 1, 0, conta);
            setCategorias(next);
          } else {
            setCategorias([...categorias, conta]);
          }
        }}
        onRemoveConta={(id) => {
          setCategorias(categorias.filter(c => c.id !== id));
        }}
        onEditConta={(id, newLabel) => {
          setCategorias(categorias.map(c => c.id === id ? { ...c, label: newLabel } : c));
        }}
      />
    </div>
  );
}
