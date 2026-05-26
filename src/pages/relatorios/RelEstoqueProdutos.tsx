import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ArrowLeftRight, Check, X, ArrowLeft, Loader2, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ProdutoRow = {
  codigo_cpl: string;
  nome: string;
  cor: string | null;
  ean: string | null;
  unidade: string | null;
  estoque_quantidade: number | null;
  estoque_minimo: number | null;
  preco_custo: number | null;
  precos_venda: any;
  fornecedor: string | null;
  ativo_vitrine: boolean;
};

const fmt = (v: number | null) =>
  (v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getPrecoTabela(precos_venda: any, tabelaNome: string): number {
  if (!Array.isArray(precos_venda)) return 0;
  const entry = precos_venda.find((pv: any) => {
    const nome = (pv?.nome || pv?.tipo || "").toUpperCase();
    return nome === tabelaNome.toUpperCase();
  });
  if (!entry) return 0;
  return Number(entry?.valor ?? entry?.preco ?? entry?.valor_venda_utilizado) || 0;
}

function escreverRelatorioNaAba(w: Window, resultados: ProdutoRow[], canais: string[], geradoEm: string, logoUrl: string, mostrarTotais: boolean, exibirCusto: boolean) {
  // Serialize payload and escape for safe embedding in <script>
  const payload = { resultados, canais, geradoEm, logoUrl, mostrarTotais, exibirCusto };
  const payloadJson = JSON.stringify(payload)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório de Estoque</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #333; padding: 15px; }
  .header { display: flex; align-items: center; gap: 15px; margin-bottom: 5px; }
  .header img { height: 45px; }
  .header h1 { font-size: 18px; font-weight: bold; }
  .header .date { font-size: 10px; color: #888; }
  .toolbar { display: flex; gap: 10px; margin: 10px 0 15px; }
  .toolbar button {
    padding: 8px 18px; border: 1px solid #ccc; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px;
  }
  .btn-print { background: #2563eb; color: #fff; border-color: #2563eb; }
  .btn-excel { background: #16a34a; color: #fff; border-color: #16a34a; }
  .loading { padding: 10px 0; color: #666; }
  .error-msg { padding: 20px; color: #dc2626; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-top: 5px; }
  th { background: #3b3b3b; color: #fff; padding: 5px 6px; font-size: 10px; text-align: left; white-space: nowrap; }
  td { padding: 4px 6px; border-bottom: 1px solid #ddd; font-size: 10px; white-space: nowrap; }
  td.num { text-align: right; font-family: 'Courier New', monospace; }
  tr.row-alt { background: #f8f8f8; }
  .total { margin-top: 8px; font-size: 11px; color: #666; }
  @media print {
    .toolbar { display: none !important; }
    body { padding: 0; }
  }
</style>
</head>
<body>
  <div class="header">
    <img id="logo" alt="Logo" style="display:none" />
    <div>
      <h1>Relatório de estoque</h1>
      <div id="generated-at" class="date"></div>
    </div>
  </div>

  <div class="toolbar">
    <button class="btn-excel" onclick="exportExcel()">📊 Exportar Excel</button>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
  </div>

  <p id="loading" class="loading">Renderizando relatório...</p>
  <table>
    <thead><tr id="report-head"></tr></thead>
    <tbody id="report-body"></tbody>
    <tfoot id="report-foot" style="display:none"></tfoot>
  </table>
  <p id="total" class="total"></p>

  <script>
    var nf = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    var reportState = { resultados: [], canais: [], mostrarTotais: false, exibirCusto: false };

    function fmt(v) {
      return nf.format(Number(v == null ? 0 : v));
    }

    function getPrecoTabela(precosVenda, tabelaNome) {
      if (!Array.isArray(precosVenda)) return 0;
      var target = String(tabelaNome || "").toUpperCase();
      for (var i = 0; i < precosVenda.length; i++) {
        var pv = precosVenda[i];
        var nome = String((pv && (pv.nome || pv.tipo)) || "").toUpperCase();
        if (nome === target) {
          return Number((pv && (pv.valor ?? pv.preco ?? pv.valor_venda_utilizado)) || 0) || 0;
        }
      }
      return 0;
    }

    function esc(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\\"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function csvSafe(value) {
      return '"' + String(value == null ? "" : value).replace(/\\"/g, '""') + '"';
    }

    function buildCols() {
      var cols = [
        "Cód. interno", "Nome", "Variação", "Cód. barra", "Unidade",
        "Estoque", "Estoque min.", "Estoque max."
      ];
      if (reportState.exibirCusto) {
        cols.push("Custo unit.", "Custo total");
      }
      for (var i = 0; i < reportState.canais.length; i++) {
        cols.push("Vr. " + reportState.canais[i]);
      }
      return cols;
    }

    function renderHeader() {
      var cols = buildCols();
      var headHtml = "";
      for (var i = 0; i < cols.length; i++) {
        headHtml += "<th>" + esc(cols[i]) + "</th>";
      }
      document.getElementById("report-head").innerHTML = headHtml;
    }

    function renderRowsChunked() {
      var tbody = document.getElementById("report-body");
      var loadingEl = document.getElementById("loading");
      var rows = reportState.resultados;
      var chunkSize = 250;
      var i = 0;

      tbody.innerHTML = "";

      function appendChunk() {
        var end = Math.min(i + chunkSize, rows.length);
        var htmlRows = "";

        for (; i < end; i++) {
          var p = rows[i] || {};
          var custoTotal = (Number(p.preco_custo) || 0) * (Number(p.estoque_quantidade) || 0);
          var priceCols = "";

          for (var c = 0; c < reportState.canais.length; c++) {
            priceCols += "<td class=\\"num\\">" + fmt(getPrecoTabela(p.precos_venda, reportState.canais[c])) + "</td>";
          }

          var custoCols = "";
          if (reportState.exibirCusto) {
            custoCols = "<td class=\\"num\\">" + fmt(p.preco_custo) + "</td>" +
              "<td class=\\"num\\">" + fmt(custoTotal) + "</td>";
          }

          htmlRows += "<tr class=\\"" + (i % 2 === 0 ? "" : "row-alt") + "\\">" +
            "<td style=\\"text-align:center\\">" + esc(p.codigo_cpl || "") + "</td>" +
            "<td>" + esc(p.nome || "") + "</td>" +
            "<td style=\\"text-align:center\\">" + esc(p.cor || "-----") + "</td>" +
            "<td>" + esc(p.ean || "-----") + "</td>" +
            "<td style=\\"text-align:center\\">" + esc(p.unidade || "UN") + "</td>" +
            "<td class=\\"num\\">" + fmt(p.estoque_quantidade) + "</td>" +
            "<td class=\\"num\\">" + fmt(p.estoque_minimo) + "</td>" +
            "<td class=\\"num\\">0,000</td>" +
            custoCols +
            priceCols +
          "</tr>";
        }

        tbody.insertAdjacentHTML("beforeend", htmlRows);

        if (i < rows.length) {
          requestAnimationFrame(appendChunk);
        } else {
          loadingEl.style.display = "none";
        }
      }

      appendChunk();
    }

    function exportExcel() {
      var cols = buildCols();
      var lines = [cols.join(";")];

      for (var i = 0; i < reportState.resultados.length; i++) {
        var p = reportState.resultados[i] || {};
        var custoTotal = (Number(p.preco_custo) || 0) * (Number(p.estoque_quantidade) || 0);
        var vals = [
          csvSafe(p.codigo_cpl || ""),
          csvSafe(p.nome || ""),
          csvSafe(p.cor || ""),
          csvSafe(p.ean || ""),
          csvSafe(p.unidade || "UN"),
          csvSafe(fmt(p.estoque_quantidade)),
          csvSafe(fmt(p.estoque_minimo)),
          csvSafe("0,000")
        ];
        if (reportState.exibirCusto) {
          vals.push(csvSafe(fmt(p.preco_custo)));
          vals.push(csvSafe(fmt(custoTotal)));
        }

        for (var c = 0; c < reportState.canais.length; c++) {
          vals.push(csvSafe(fmt(getPrecoTabela(p.precos_venda, reportState.canais[c]))));
        }

        lines.push(vals.join(";"));
      }

      // Add totals row if enabled
      if (reportState.mostrarTotais && reportState.resultados.length > 0) {
        var totalQtd = 0, totalCusto = 0;
        var totCanais = {};
        for (var ti = 0; ti < reportState.canais.length; ti++) { totCanais[reportState.canais[ti]] = 0; }
        for (var tj = 0; tj < reportState.resultados.length; tj++) {
          var tp = reportState.resultados[tj] || {};
          var tq = Number(tp.estoque_quantidade) || 0;
          var tc = Number(tp.preco_custo) || 0;
          totalQtd += tq;
          totalCusto += tc * tq;
          for (var tk = 0; tk < reportState.canais.length; tk++) {
            totCanais[reportState.canais[tk]] += getPrecoTabela(tp.precos_venda, reportState.canais[tk]) * tq;
          }
        }
        var totVals = [csvSafe("TOTAIS"), csvSafe(""), csvSafe(""), csvSafe(""), csvSafe(""),
          csvSafe(fmt(totalQtd)), csvSafe(""), csvSafe("")];
        if (reportState.exibirCusto) {
          totVals.push(csvSafe(""));
          totVals.push(csvSafe(fmt(totalCusto)));
        }
        for (var tl = 0; tl < reportState.canais.length; tl++) {
          totVals.push(csvSafe(fmt(totCanais[reportState.canais[tl]])));
        }
        lines.push(totVals.join(";"));
      }

      var csvContent = "\\uFEFF" + lines.join("\\n");
      var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "relatorio_estoque_" + new Date().toISOString().slice(0, 10) + ".csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    }

    window.exportExcel = exportExcel;

    // Self-initializing: payload is embedded directly in the page
    (function() {
      try {
        var payload = ${payloadJson};
        reportState.resultados = Array.isArray(payload.resultados) ? payload.resultados : [];
        reportState.canais = Array.isArray(payload.canais) ? payload.canais : [];

        // Sort channels by average price (lowest to highest)
        if (reportState.canais.length > 1 && reportState.resultados.length > 0) {
          var channelAvgs = reportState.canais.map(function(canal) {
            var sum = 0;
            var count = 0;
            reportState.resultados.forEach(function(r) {
              var v = getPrecoTabela(r.precos_venda, canal);
              if (v > 0) { sum += v; count++; }
            });
            return { canal: canal, avg: count > 0 ? sum / count : 0 };
          });
          channelAvgs.sort(function(a, b) { return a.avg - b.avg; });
          reportState.canais = channelAvgs.map(function(x) { return x.canal; });
        }

        var dateEl = document.getElementById("generated-at");
        dateEl.textContent = "Gerado em " + (payload.geradoEm || "");

        var logoEl = document.getElementById("logo");
        if (payload.logoUrl) {
          logoEl.src = payload.logoUrl;
          logoEl.style.display = "block";
        }

        reportState.mostrarTotais = !!payload.mostrarTotais;
        reportState.exibirCusto = !!payload.exibirCusto;

        renderHeader();
        renderRowsChunked();
        document.getElementById("total").textContent = reportState.resultados.length + " produto(s) encontrado(s)";

        // Render totals footer
        if (reportState.mostrarTotais && reportState.resultados.length > 0) {
          var totalQtd = 0, totalCusto = 0;
          var totaisCanais = {};
          for (var tc = 0; tc < reportState.canais.length; tc++) { totaisCanais[reportState.canais[tc]] = 0; }
          for (var ti = 0; ti < reportState.resultados.length; ti++) {
            var tp = reportState.resultados[ti] || {};
            var tqtd = Number(tp.estoque_quantidade) || 0;
            var tcusto = Number(tp.preco_custo) || 0;
            totalQtd += tqtd;
            totalCusto += tcusto * tqtd;
            for (var tci = 0; tci < reportState.canais.length; tci++) {
              var cn = reportState.canais[tci];
              totaisCanais[cn] += getPrecoTabela(tp.precos_venda, cn) * tqtd;
            }
          }
          var footHtml = '<tr style="background:#2d2d2d;color:#fff;font-weight:bold;font-size:11px;">' +
            '<td colspan="5" style="padding:6px;border-top:2px solid #000;">TOTAIS</td>' +
            '<td class="num" style="padding:6px;border-top:2px solid #000;">' + fmt(totalQtd) + '</td>' +
            '<td style="padding:6px;border-top:2px solid #000;"></td>' +
            '<td style="padding:6px;border-top:2px solid #000;"></td>';
          if (reportState.exibirCusto) {
            footHtml += '<td style="padding:6px;border-top:2px solid #000;"></td>' +
              '<td class="num" style="padding:6px;border-top:2px solid #000;">' + fmt(totalCusto) + '</td>';
          }
          for (var tfi = 0; tfi < reportState.canais.length; tfi++) {
            footHtml += '<td class="num" style="padding:6px;border-top:2px solid #000;">' + fmt(totaisCanais[reportState.canais[tfi]]) + '</td>';
          }
          footHtml += '</tr>';
          var tfoot = document.getElementById("report-foot");
          tfoot.innerHTML = footHtml;
          tfoot.style.display = "";
        }
      } catch(e) {
        var loadingEl = document.getElementById("loading");
        loadingEl.className = "error-msg";
        loadingEl.textContent = "Erro ao carregar dados do relatório. Tente gerar novamente.";
      }
    })();
  <\/script>
</body>
</html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
}

export default function RelEstoqueProdutos() {
  const navigate = useNavigate();
  const [loja, setLoja] = useState("todas");
  const [ativo, setAtivo] = useState("independe");
  const [nomeProduto, setNomeProduto] = useState("");
  const [codigo, setCodigo] = useState("");
  const [situacao, setSituacao] = useState("independe");
  const [gruposSelecionados, setGruposSelecionados] = useState<string[]>([]);
  const [fornecedor, setFornecedor] = useState("");
  const [canaisSelecionados, setCanaisSelecionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarTotais, setMostrarTotais] = useState(true);
  const [exibirCusto, setExibirCusto] = useState(false);
  const [filterMarca, setFilterMarca] = useState("Todas");
  const [filterCor, setFilterCor] = useState("Todas");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterModelo, setFilterModelo] = useState("Todas");

  const { data: gruposProdutos = [] } = useQuery({
    queryKey: ["grupos_produtos_rel"],
    queryFn: async () => {
      const PAGE = 1000;
      const all: string[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("produtos_catalogo")
          .select("categoria")
          .not("categoria", "is", null)
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        data.forEach((d: any) => { if (d.categoria) all.push(d.categoria); });
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return [...new Set(all)].sort();
    },
  });

  const { data: filterOptions } = useQuery({
    queryKey: ["rel_estoque_filter_options"],
    queryFn: async () => {
      const PAGE = 1000;
      const marcas = new Set<string>();
      const cores = new Set<string>();
      const anos = new Set<string>();
      const modelos = new Set<string>();
      const modeloKeywords = ["ESD", "KS", "KSE", "ES", "MIX", "FLEX", "FAN", "TITAN", "CG", "BIZ", "NXR", "XRE", "CB", "CBR", "POP", "BROS", "TORNADO", "FALCON", "XR", "XL", "YBR", "FACTOR", "FAZER", "LANDER", "CROSSER", "YES", "INTRUDER", "GSR"];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("produtos_catalogo")
          .select("marca, cor, nome, aplicacoes")
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        data.forEach((p: any) => {
          if (p.marca) marcas.add(p.marca);
          if (p.cor) cores.add(p.cor);
          const allText = [p.nome, ...(Array.isArray(p.aplicacoes) ? p.aplicacoes : [])].join(" ");
          const yearMatches = allText.match(/\b(19\d{2}|20\d{2})\b/g);
          if (yearMatches) yearMatches.forEach((y: string) => anos.add(y));
          const upperText = allText.toUpperCase();
          modeloKeywords.forEach(v => { if (upperText.includes(v)) modelos.add(v); });
        });
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return {
        marcas: Array.from(marcas).sort(),
        cores: Array.from(cores).sort(),
        anos: Array.from(anos).sort((a, b) => b.localeCompare(a)),
        modelos: Array.from(modelos).sort(),
      };
    },
  });

  const { data: valoresVenda = [] } = useQuery({
    queryKey: ["valores_venda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("valores_venda" as any)
        .select("id, nome")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as unknown as { id: string; nome: string }[];
    },
  });

  const { data: lojaConfig } = useQuery({
    queryKey: ["configuracoes_loja_rel"],
    queryFn: async () => {
      const { data } = await supabase.from("configuracoes_loja").select("*").limit(1).single();
      return data;
    },
  });

  const todosCanais = valoresVenda.map((v) => v.nome);
  const selecionados = canaisSelecionados.length > 0 ? canaisSelecionados : todosCanais;

  const toggleCanal = (nome: string) => {
    const current = selecionados;
    if (current.includes(nome)) {
      setCanaisSelecionados(current.filter((c) => c !== nome));
    } else {
      setCanaisSelecionados([...current, nome]);
    }
  };

  const limpar = () => {
    setLoja("todas"); setAtivo("independe"); setNomeProduto(""); setCodigo("");
    setSituacao("independe"); setGruposSelecionados([]); setFornecedor("");
    setCanaisSelecionados([]);
    setFilterMarca("Todas"); setFilterCor("Todas"); setFilterAno("Todos"); setFilterModelo("Todas");
  };

  const gerar = async () => {
    // Open window BEFORE async work to avoid pop-up blocker
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Permita pop-ups para abrir o relatório.");
      return;
    }
    w.document.write("<html><body><p style='font-family:Arial;padding:20px;'>Carregando relatório...</p></body></html>");

    setLoading(true);
    try {
      const PAGE_SIZE = 1000;
      const allRows: any[] = [];
      let from = 0;

      while (true) {
        let query: any = supabase
          .from("produtos_catalogo")
          .select("codigo_cpl, nome, cor, ean, unidade, estoque_quantidade, estoque_minimo, preco_custo, precos_venda, fornecedor, ativo_vitrine, categoria, marca, aplicacoes")
          .order("nome", { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (ativo === "sim") query = query.eq("ativo_vitrine", true);
        if (ativo === "nao") query = query.eq("ativo_vitrine", false);
        if (nomeProduto.trim()) query = query.ilike("nome", `%${nomeProduto.trim()}%`);
        if (codigo.trim()) query = query.ilike("codigo_cpl", `%${codigo.trim()}%`);
        if (fornecedor.trim()) query = query.ilike("fornecedor", `%${fornecedor.trim()}%`);
        if (gruposSelecionados.length > 0) query = query.in("categoria", gruposSelecionados);
        if (filterMarca !== "Todas") query = query.eq("marca", filterMarca.trim());
        if (filterCor !== "Todas") query = query.eq("cor", filterCor.trim());

        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) break;
        allRows.push(...data);
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      let filtered = allRows as any[];
      if (situacao === "positivo") filtered = filtered.filter(p => (p.estoque_quantidade ?? 0) > 0);
      if (situacao === "zerado") filtered = filtered.filter(p => (p.estoque_quantidade ?? 0) === 0);
      if (situacao === "negativo") filtered = filtered.filter(p => (p.estoque_quantidade ?? 0) < 0);
      if (filterAno !== "Todos") {
        filtered = filtered.filter(p => {
          const allText = [p.nome, ...(Array.isArray(p.aplicacoes) ? p.aplicacoes : [])].join(" ");
          return allText.includes(filterAno);
        });
      }
      if (filterModelo !== "Todas") {
        filtered = filtered.filter(p => {
          const allText = [p.nome, ...(Array.isArray(p.aplicacoes) ? p.aplicacoes : [])].join(" ").toUpperCase();
          return allText.includes(filterModelo);
        });
      }

      if (filtered.length === 0) {
        w.close();
        toast.info("Nenhum produto encontrado com os filtros selecionados.");
        return;
      }

      const geradoEm = new Date().toLocaleString("pt-BR");
      const logoUrl = "";
      escreverRelatorioNaAba(w, filtered, selecionados, geradoEm, logoUrl, mostrarTotais, exibirCusto);
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
        <ArrowLeftRight className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Relatório de estoque</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Relatórios de estoque &gt; Estoque de produtos</p>
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
              <Label>Ativo</Label>
              <Select value={ativo} onValueChange={setAtivo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="independe">Independe</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal h-10">
                    <span className="truncate">
                      {gruposSelecionados.length === 0
                        ? "Todos"
                        : gruposSelecionados.length === 1
                          ? gruposSelecionados[0]
                          : `${gruposSelecionados.length} grupos selecionados`}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar grupo..." />
                    <CommandList>
                      <CommandEmpty>Nenhum grupo encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => setGruposSelecionados([])}>
                          <Check className={cn("mr-2 h-4 w-4", gruposSelecionados.length === 0 ? "opacity-100" : "opacity-0")} />
                          Todos (limpar seleção)
                        </CommandItem>
                        {gruposProdutos.map((g) => (
                          <CommandItem
                            key={g}
                            value={g}
                            onSelect={() => {
                              setGruposSelecionados((prev) =>
                                prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
                              );
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", gruposSelecionados.includes(g) ? "opacity-100" : "opacity-0")} />
                            {g}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Fornecedor</Label>
              <Input placeholder="Digite para buscar" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal h-10">
                    <span className="truncate">{filterMarca}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar marca..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma marca encontrada.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => setFilterMarca("Todas")}>
                          <Check className={cn("mr-2 h-4 w-4", filterMarca === "Todas" ? "opacity-100" : "opacity-0")} />
                          Todas
                        </CommandItem>
                        {(filterOptions?.marcas || []).map((m) => (
                          <CommandItem key={m} value={m} onSelect={() => setFilterMarca(m)}>
                            <Check className={cn("mr-2 h-4 w-4", filterMarca === m ? "opacity-100" : "opacity-0")} />
                            {m}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Cor</Label>
              <Select value={filterCor} onValueChange={setFilterCor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  {(filterOptions?.cores || []).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ano</Label>
              <Select value={filterAno} onValueChange={setFilterAno}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {(filterOptions?.anos || []).map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Select value={filterModelo} onValueChange={setFilterModelo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  {(filterOptions?.modelos || []).map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={mostrarTotais}
                onCheckedChange={(v) => setMostrarTotais(!!v)}
              />
              Exibir totais no rodapé (Qtd. total, Custo total e Total por canal)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={exibirCusto}
                onCheckedChange={(v) => setExibirCusto(!!v)}
              />
              Exibir valores de custo
            </label>
          </div>

          {valoresVenda.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Selecione valor(es) de venda para exibir no relatório:</p>
              <div className="flex flex-wrap gap-6">
                {valoresVenda.map((v) => (
                  <label key={v.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selecionados.includes(v.nome)}
                      onCheckedChange={() => toggleCanal(v.nome)}
                    />
                    Vr. {v.nome}
                  </label>
                ))}
              </div>
            </div>
          )}

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
