import { useState, useRef } from "react";
import { Printer, Search, Plus, Minus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EtiquetaModelo {
  id: string;
  nome: string;
  tamanho_pagina: string;
  padrao_etiqueta: string;
  margem_superior_cm: number;
  margem_lateral_cm: number;
  densidade_vertical_cm: number;
  densidade_horizontal_cm: number;
  altura_etiqueta_cm: number;
  largura_etiqueta_cm: number;
  fonte_etiqueta: string;
  tamanho_fonte: string;
  limite_caracteres: number;
  colunas: number;
  linhas: number;
  descricao_topo: string;
  exibir_codigo_interno: string;
  exibir_codigo_barras: string;
  exibir_numero_codigo_barras: string;
  exibir_valor_produto: string;
  tamanho_fonte_valor: string;
  posicao_codigo_barras: string;
}

interface Produto {
  id: string;
  nome: string;
  codigo_cpl: string | null;
  preco_custo: number | null;
  precos_venda: any;
  codigo_barras?: string | null;
}

interface ProdutoSelecionado extends Produto {
  quantidade: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelos: EtiquetaModelo[];
}

export default function GerarEtiquetasDialog({ open, onOpenChange, modelos }: Props) {
  const [modeloId, setModeloId] = useState("");
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [resultados, setResultados] = useState<Produto[]>([]);
  const [selecionados, setSelecionados] = useState<ProdutoSelecionado[]>([]);
  const [etiquetaInicial, setEtiquetaInicial] = useState("1");
  const [printStatus, setPrintStatus] = useState<"idle" | "generating" | "ready" | "failed">("idle");
  const printRef = useRef<HTMLDivElement>(null);

  const modelo = modelos.find((m) => m.id === modeloId);

  const buscarProdutos = async () => {
    if (!search.trim()) return;
    setSearching(true);
    const { data, error } = await supabase
      .from("produtos_catalogo" as any)
      .select("id, nome, codigo_cpl, preco_custo, precos_venda, codigo_barras")
      .or(`nome.ilike.%${search.trim()}%,codigo_cpl.ilike.%${search.trim()}%`)
      .order("nome")
      .limit(20);
    if (error) toast.error("Erro ao buscar produtos");
    else setResultados((data as unknown as Produto[]) || []);
    setSearching(false);
  };

  const adicionarProduto = (p: Produto) => {
    setSelecionados((prev) => {
      const exists = prev.find((s) => s.id === p.id);
      if (exists) return prev.map((s) => s.id === p.id ? { ...s, quantidade: s.quantidade + 1 } : s);
      return [...prev, { ...p, quantidade: 1 }];
    });
  };

  const alterarQtd = (id: string, delta: number) => {
    setSelecionados((prev) =>
      prev.map((s) => s.id === id ? { ...s, quantidade: Math.max(1, s.quantidade + delta) } : s)
    );
  };

  const removerProduto = (id: string) => {
    setSelecionados((prev) => prev.filter((s) => s.id !== id));
  };

  const getPrecoVenda = (p: Produto): number => {
    if (!p.precos_venda) return 0;
    const arr = Array.isArray(p.precos_venda) ? p.precos_venda : [];
    const primeiro = arr[0];
    return primeiro?.valor || primeiro?.preco || 0;
  };

  const gerarImpressao = () => {
    if (!modelo) {
      toast.error("Selecione um modelo de etiqueta");
      return;
    }
    if (selecionados.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    setPrintStatus("generating");

    try {
      const etiquetas: ProdutoSelecionado[] = [];
      selecionados.forEach((p) => {
        for (let i = 0; i < p.quantidade; i++) etiquetas.push(p);
      });

      const skip = Math.max(0, parseInt(etiquetaInicial) - 1);
      const cols = modelo.colunas || 2;
      const rows = modelo.linhas || 7;
      const perPage = cols * rows;

      const pageW = modelo.tamanho_pagina?.includes("Carta") ? 21.6 : 21.0;
      const pageH = modelo.tamanho_pagina?.includes("Carta") ? 27.9 : 29.7;
      const mTop = modelo.margem_superior_cm || 0;
      const mLeft = modelo.margem_lateral_cm || 0;
      const labelW = modelo.largura_etiqueta_cm || ((pageW - mLeft * 2) / cols);
      const labelH = modelo.altura_etiqueta_cm || ((pageH - mTop * 2) / rows);
      const gapV = modelo.densidade_vertical_cm || 0;
      const gapH = modelo.densidade_horizontal_cm || 0;
      const fontFamily = modelo.fonte_etiqueta || "Arial";
      const fontSize = modelo.tamanho_fonte || "10pt";
      const maxChars = modelo.limite_caracteres || 0;
      const showInterno = modelo.exibir_codigo_interno !== "Não";
      const showBarras = modelo.exibir_codigo_barras !== "Não";
      const showNumBarras = modelo.exibir_numero_codigo_barras === "Sim";
      const showValor = modelo.exibir_valor_produto !== "Não";
      const descTopo = modelo.descricao_topo || "";

      const fontSizeValor = modelo.tamanho_fonte_valor === "Grande" ? "14pt"
        : modelo.tamanho_fonte_valor === "Pequeno" ? "8pt" : fontSize;

      const allSlots: (ProdutoSelecionado | null)[] = [];
      for (let i = 0; i < skip; i++) allSlots.push(null);
      etiquetas.forEach((e) => allSlots.push(e));

      const pages: (ProdutoSelecionado | null)[][] = [];
      for (let i = 0; i < allSlots.length; i += perPage) {
        pages.push(allSlots.slice(i, i + perPage));
      }

      let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Etiquetas</title><style>
        @page { size: ${pageW}cm ${pageH}cm; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: '${fontFamily}', sans-serif; font-size: ${fontSize}; }
        .page { width: ${pageW}cm; height: ${pageH}cm; padding-top: ${mTop}cm; padding-left: ${mLeft}cm; page-break-after: always; display: flex; flex-wrap: wrap; align-content: flex-start; }
        .label { width: ${labelW}cm; height: ${labelH}cm; margin-right: ${gapH}cm; margin-bottom: ${gapV}cm; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2px; border: 0.5px dashed #ccc; }
        .label-empty { border: none; }
        .desc-topo { font-size: 7pt; color: #666; margin-bottom: 1px; }
        .nome { font-weight: 600; line-height: 1.2; margin-bottom: 1px; word-break: break-word; }
        .codigo { font-size: 8pt; color: #444; }
        .barcode { font-family: 'Libre Barcode 39', 'Free 3 of 9', monospace; font-size: 28px; letter-spacing: 2px; line-height: 1; }
        .barcode-num { font-size: 7pt; color: #333; }
        .valor { font-weight: 700; font-size: ${fontSizeValor}; margin-top: 1px; }
      </style>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
      </head><body>`;

      pages.forEach((page) => {
        html += `<div class="page">`;
        for (let i = 0; i < perPage; i++) {
          const item = page[i] || null;
          if (!item) {
            html += `<div class="label label-empty"></div>`;
            continue;
          }
          let nome = item.nome || "";
          if (maxChars > 0 && nome.length > maxChars) nome = nome.substring(0, maxChars) + "…";
          const codBarras = (item as any).codigo_barras || item.codigo_cpl || "";
          const preco = getPrecoVenda(item);

          html += `<div class="label">`;
          if (descTopo) html += `<div class="desc-topo">${descTopo}</div>`;

          if (showBarras && modelo.posicao_codigo_barras === "Superior" && codBarras) {
            html += `<div class="barcode">*${codBarras}*</div>`;
            if (showNumBarras) html += `<div class="barcode-num">${codBarras}</div>`;
          }

          html += `<div class="nome">${nome}</div>`;
          if (showInterno && item.codigo_cpl) html += `<div class="codigo">Cód: ${item.codigo_cpl}</div>`;

          if (showBarras && modelo.posicao_codigo_barras !== "Superior" && codBarras) {
            html += `<div class="barcode">*${codBarras}*</div>`;
            if (showNumBarras) html += `<div class="barcode-num">${codBarras}</div>`;
          }

          if (showValor && preco > 0) html += `<div class="valor">R$ ${preco.toFixed(2).replace(".", ",")}</div>`;
          html += `</div>`;
        }
        html += `</div>`;
      });

      html += `</body></html>`;

      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        setPrintStatus("ready");
        setTimeout(() => win.print(), 600);
      } else {
        throw new Error("Não foi possível abrir a janela de impressão");
      }
    } catch (err: any) {
      setPrintStatus("failed");
      toast.error(err?.message || "Erro ao gerar etiqueta");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" /> Gerar Etiquetas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Modelo + Etiqueta inicial */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Modelo de etiqueta *</Label>
              <Select value={modeloId} onValueChange={setModeloId}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {modelos.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Iniciar na etiqueta nº</Label>
              <Input type="number" min="1" value={etiquetaInicial} onChange={(e) => setEtiquetaInicial(e.target.value)} className="bg-secondary/50" />
            </div>
          </div>

          {modelo && (
            <div className="text-xs text-muted-foreground rounded-lg border border-accent/30 bg-accent/5 p-2">
              {modelo.colunas} colunas × {modelo.linhas} linhas = {modelo.colunas * modelo.linhas} etiquetas/página · {modelo.tamanho_pagina}
            </div>
          )}

          {/* Busca de produtos */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Buscar produtos</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Nome ou código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscarProdutos()}
                  className="pl-9 bg-secondary/50"
                />
              </div>
              <Button onClick={buscarProdutos} disabled={searching} variant="outline" className="border-border text-foreground">
                {searching ? "..." : "Buscar"}
              </Button>
            </div>
          </div>

          {/* Resultados */}
          {resultados.length > 0 && (
            <div className="rounded-lg border border-border max-h-40 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Produto</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Código</th>
                    <th className="px-3 py-2 text-center text-muted-foreground font-medium w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="px-3 py-1.5 text-foreground">{p.nome}</td>
                      <td className="px-3 py-1.5 text-foreground">{p.codigo_cpl}</td>
                      <td className="px-3 py-1.5 text-center">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-primary" onClick={() => adicionarProduto(p)}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Selecionados */}
          {selecionados.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Produtos selecionados ({selecionados.reduce((a, s) => a + s.quantidade, 0)} etiquetas)</Label>
              <div className="rounded-lg border border-border max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">Produto</th>
                      <th className="px-3 py-2 text-center text-muted-foreground font-medium w-32">Qtd. Etiquetas</th>
                      <th className="px-3 py-2 text-center text-muted-foreground font-medium w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selecionados.map((s) => (
                      <tr key={s.id} className="border-b border-border/50">
                        <td className="px-3 py-1.5 text-foreground">{s.nome}</td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => alterarQtd(s.id, -1)}><Minus className="h-3 w-3" /></Button>
                            <span className="w-8 text-center text-foreground font-medium">{s.quantidade}</span>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => alterarQtd(s.id, 1)}><Plus className="h-3 w-3" /></Button>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removerProduto(s.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Status da etiqueta */}
          {printStatus !== "idle" && (
            <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
              printStatus === "generating" ? "border-primary/30 bg-primary/5 text-primary" :
              printStatus === "ready" ? "border-green-500/30 bg-green-500/5 text-green-600" :
              "border-destructive/30 bg-destructive/5 text-destructive"
            }`}>
              {printStatus === "generating" && <>Gerando etiqueta</>}
              {printStatus === "ready" && <>Etiqueta para Impressão</>}
              {printStatus === "failed" && <>Etiqueta Falhada</>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); setPrintStatus("idle"); }} className="text-foreground border-border">Cancelar</Button>
          <Button onClick={gerarImpressao} disabled={printStatus === "generating"} className="gap-1.5">
            {printStatus === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            {printStatus === "generating" ? "Gerando..." : "Imprimir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
