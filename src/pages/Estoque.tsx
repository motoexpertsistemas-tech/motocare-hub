import { useState, useRef, useEffect } from "react";
import { GripVertical } from "lucide-react";
import { generateProductShareImage } from "@/lib/shareProductImage";
import { useNavigate } from "react-router-dom";
import { Search, Upload, AlertTriangle, Package, TrendingUp, Download, Image as ImageIcon, MoreHorizontal, MapPin, ChevronLeft, ChevronRight, Palette, Loader2, FileText, Filter, X, Plus, Trash2, Settings, Tag } from "lucide-react";
import { ImageUploadButton } from "@/components/ImageUploadButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ImportCPLDialog } from "@/components/ImportCPLDialog";
import { ImportSportiveDialog } from "@/components/ImportSportiveDialog";
import { FetchSportiveImagesDialog } from "@/components/FetchSportiveImagesDialog";
import { ImportVipalDialog } from "@/components/ImportVipalDialog";
import { ImportPerereDialog } from "@/components/ImportPerereDialog";
import { ImportProtorkDialog } from "@/components/ImportProtorkDialog";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { ProductDetailPanel } from "@/components/ProductDetailPanel";
import { BatchFetchImagesDialog } from "@/components/BatchFetchImagesDialog";
import { SetLocationDialog } from "@/components/SetLocationDialog";
import { CloneProductDialog } from "@/components/CloneProductDialog";
import { ImportarCatalogoMasterDialog } from "@/components/ImportarCatalogoMasterDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/supabaseFetchAll";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const CATEGORIAS = [
  "TODAS",
  "SEM CATEGORIA",
  "ACESSÓRIOS", "CABOS", "CARB-INJEÇÃO", "CAREN-PLÁSTICO",
  "CHASSI", "ELÉTRICA", "FERRA - EQUIP", "FIXAÇÃO",
  "MOTOR", "PNEU", "RODA", "SUSPENSÃO", "TRANSMISSÃO",
];

export default function Estoque() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("TODAS");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advNome, setAdvNome] = useState("");
  const [advCodigo, setAdvCodigo] = useState("");
  const [advFornecedor, setAdvFornecedor] = useState("");
  const [advColuna, setAdvColuna] = useState("");
  const [advRua, setAdvRua] = useState("");
  const [advPrateleira, setAdvPrateleira] = useState("");
  const [advAtivo, setAdvAtivo] = useState("TODOS");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showImportCPL, setShowImportCPL] = useState(false);
  const [showImportSportive, setShowImportSportive] = useState(false);
  const [showImportVipal, setShowImportVipal] = useState(false);
  const [showImportPerere, setShowImportPerere] = useState(false);
  const [showImportProtork, setShowImportProtork] = useState(false);
  const [showImportExcel, setShowImportExcel] = useState(false);
  const [showFetchSportiveImages, setShowFetchSportiveImages] = useState(false);
  const [showBatchFetchImages, setShowBatchFetchImages] = useState(false);
  const [showCatalogoMaster, setShowCatalogoMaster] = useState(false);
  const [page, setPage] = useState(1);
  const detailRef = useRef<HTMLDivElement>(null);
  const [isFetchingColors, setIsFetchingColors] = useState(false);
  const [colorProgress, setColorProgress] = useState("");
  const [locationProduct, setLocationProduct] = useState<{ id: string; nome: string; localizacao: string | null } | null>(null);
  const [cloneProduct, setCloneProduct] = useState<any | null>(null);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [filterMarca, setFilterMarca] = useState<string>("TODAS");
  const [filterCor, setFilterCor] = useState<string>("TODAS");
  const [filterAno, setFilterAno] = useState<string>("TODOS");
  const [filterVariante, setFilterVariante] = useState<string>("TODAS");
  const [deleteProduct, setDeleteProduct] = useState<{ id: string; nome: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const PER_PAGE = 80;

  // Column drag-and-drop ordering
  const DEFAULT_COLUMN_ORDER = ["codigo", "foto", "produto", "cor", "estoque", "preco", "custo", "marca", "localizacao", "categoria", "acoes"];
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("estoque_column_order");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_COLUMN_ORDER.length) return parsed;
      }
    } catch {}
    return DEFAULT_COLUMN_ORDER;
  });
  useEffect(() => {
    localStorage.setItem("estoque_column_order", JSON.stringify(columnOrder));
  }, [columnOrder]);
  const [draggedCol, setDraggedCol] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const handleColDrop = (target: string) => {
    if (!draggedCol || draggedCol === target) {
      setDraggedCol(null);
      setDragOverCol(null);
      return;
    }
    setColumnOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(draggedCol);
      const to = next.indexOf(target);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, draggedCol);
      return next;
    });
    setDraggedCol(null);
    setDragOverCol(null);
  };

  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    const { error } = await supabase
      .from("produtos_catalogo")
      .delete()
      .eq("id", deleteProduct.id);
    setDeleting(false);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      toast.success("Produto excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
      if (selectedProduct === deleteProduct.id) setSelectedProduct(null);
    }
    setDeleteProduct(null);
  };

      

  const fetchColors = async () => {
    // Get visible products on current page that have no color
    const visibleProducts = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const withoutColor = visibleProducts.filter((p) => !p.cor && p.codigo_cpl);
    if (withoutColor.length === 0) {
      return;
    }
    setIsFetchingColors(true);
    let done = 0;
    for (const p of withoutColor) {
      try {
        await supabase.functions.invoke("fetch-product-color", {
          body: { codigo_cpl: p.codigo_cpl },
        });
      } catch (e) {
        console.error(`Error fetching color for ${p.codigo_cpl}:`, e);
      }
      done++;
      setColorProgress(`${done}/${withoutColor.length}`);
      // Refresh UI every 5 products
      if (done % 5 === 0) {
        queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
      }
    }
    setIsFetchingColors(false);
    setColorProgress("");
    queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
  };

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["produtos_catalogo"],
    queryFn: async () => {
      const allData = await fetchAllRows("produtos_catalogo", "*", {
        order: { column: "nome", ascending: true },
      });
      console.log(`[Estoque] Loaded ${allData.length} products total`);
      return allData;
    },
  });

  // Extract unique values for filters from loaded products
  const filterOptions = (() => {
    const marcas = new Set<string>();
    const cores = new Set<string>();
    const anos = new Set<string>();
    const variantes = new Set<string>();
    const varianteKeywords = ["ESD", "KS", "KSE", "ES", "MIX", "FLEX", "FAN", "TITAN", "CG", "BIZ", "NXR", "XRE", "CB", "CBR", "POP", "BROS", "TORNADO", "FALCON", "XR", "XL", "YBR", "FACTOR", "FAZER", "LANDER", "CROSSER", "YES", "INTRUDER", "GSR"];
    produtos.forEach(p => {
      if (p.marca) marcas.add(p.marca);
      if (p.cor) cores.add(p.cor);
      const allText = [p.nome, ...(p.aplicacoes || [])].join(" ");
      const yearMatches = allText.match(/\b(19\d{2}|20\d{2})\b/g);
      if (yearMatches) yearMatches.forEach((y: string) => anos.add(y));
      const upperText = allText.toUpperCase();
      varianteKeywords.forEach(v => { if (upperText.includes(v)) variantes.add(v); });
    });
    return {
      marcas: Array.from(marcas).sort(),
      cores: Array.from(cores).sort(),
      anos: Array.from(anos).sort((a, b) => b.localeCompare(a)),
      variantes: Array.from(variantes).sort(),
    };
  })();

  const hasAdvancedFilters = advNome || advCodigo || advFornecedor || advColuna || advRua || advPrateleira || advAtivo !== "TODOS";
  const clearAdvancedFilters = () => { setAdvNome(""); setAdvCodigo(""); setAdvFornecedor(""); setAdvColuna(""); setAdvRua(""); setAdvPrateleira(""); setAdvAtivo("TODOS"); };

  const hasActiveFilters = filterMarca !== "TODAS" || filterCor !== "TODAS" || filterAno !== "TODOS" || filterVariante !== "TODAS" || hasAdvancedFilters;
  const clearAllFilters = () => { setFilterMarca("TODAS"); setFilterCor("TODAS"); setFilterAno("TODOS"); setFilterVariante("TODAS"); clearAdvancedFilters(); };

  const normalize = (str: string) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Expand short year terms: "08" -> also try "2008", "98" -> "1998"
  const expandYear = (term: string): string[] => {
    if (/^\d{2}$/.test(term)) {
      const n = parseInt(term);
      const full = n >= 50 ? `19${term}` : `20${term}`;
      return [term, full];
    }
    return [term];
  };

  const filteredAndScored = (() => {
    const q = normalize(search.trim());
    const terms = q.split(/\s+/).filter(Boolean);

    // Sidebar filters check
    const matchesSidebarFilters = (p: any) => {
      if (filterMarca !== "TODAS" && p.marca !== filterMarca) return false;
      if (filterCor !== "TODAS" && p.cor !== filterCor) return false;
      if (filterAno !== "TODOS") {
        const allText = [p.nome, ...(p.aplicacoes || [])].join(" ");
        if (!allText.includes(filterAno)) return false;
      }
      if (filterVariante !== "TODAS") {
        const allText = [p.nome, ...(p.aplicacoes || [])].join(" ").toUpperCase();
        if (!allText.includes(filterVariante)) return false;
      }
      // Advanced filters
      if (advNome && !normalize(p.nome || "").includes(normalize(advNome))) return false;
      if (advCodigo && !normalize(p.codigo_cpl || "").includes(normalize(advCodigo))) return false;
      if (advFornecedor && !normalize(p.fornecedor || "").includes(normalize(advFornecedor))) return false;
      if (advColuna || advRua || advPrateleira) {
        const loc = normalize(p.localizacao || "");
        if (advColuna && !loc.includes(normalize(advColuna))) return false;
        if (advRua && !loc.includes(normalize(advRua))) return false;
        if (advPrateleira && !loc.includes(normalize(advPrateleira))) return false;
      }
      if (advAtivo === "SIM" && p.ativo === false) return false;
      if (advAtivo === "NAO" && p.ativo !== false) return false;
      return true;
    };

    if (terms.length === 0) {
      return produtos
        .filter((p) => (categoriaFilter === "TODAS" || p.categoria === categoriaFilter) && matchesSidebarFilters(p))
        .map((p) => ({ ...p, _score: 0 }));
    }

    // Expand each term with year variants
    const expandedTerms = terms.map(t => expandYear(t));

    return produtos
      .map((p) => {
        const rawText = normalize(
          [p.nome, p.codigo_cpl, p.codigo_fornecedor, p.marca, p.categoria, p.cor, ...(p.aplicacoes || [])]
            .filter(Boolean)
            .join(" ")
        );
        const words = rawText.split(/[\s/,.-]+/).filter(Boolean);

        let score = 0;
        let matchedTerms = 0;

        for (const variants of expandedTerms) {
          let bestMatch = 0;
          for (const variant of variants) {
            const prefixMatch = words.some(w => w.startsWith(variant));
            const substringMatch = rawText.includes(variant);

            if (prefixMatch) {
              const exactWord = words.some(w => w === variant);
              bestMatch = Math.max(bestMatch, exactWord ? 10 : 5);
            } else if (substringMatch) {
              bestMatch = Math.max(bestMatch, 2);
            }
          }
          if (bestMatch > 0) {
            matchedTerms++;
            score += bestMatch;
          }
        }

        if (matchedTerms === expandedTerms.length) {
          score += 20 + (matchedTerms * 3);
        }

        return { ...p, _score: score };
      })
      .filter((p) => {
        const matchesCategoria = categoriaFilter === "TODAS" || p.categoria === categoriaFilter;
        return p._score > 0 && matchesCategoria && matchesSidebarFilters(p);
      })
      .sort((a, b) => b._score - a._score);
  })();

  const filtered = filteredAndScored;

  const selected = produtos.find((p) => p.id === selectedProduct);

  const totalProdutos = categoriaFilter === "TODAS" ? produtos.length : filtered.length;
  const categoriaCount = new Set(produtos.map((p) => p.categoria).filter(Boolean)).size;
  const semPreco = (categoriaFilter === "TODAS" ? produtos : filtered).filter((p) => {
    const pv = p.precos_venda as any;
    const temPrecoVenda = pv && typeof pv === "object" && Object.values(pv).some((v: any) => v > 0);
    return !temPrecoVenda && (!p.preco_custo || p.preco_custo === 0);
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estoque Multi-Fornecedor</h1>
          <p className="text-sm text-muted-foreground">Catálogo de produtos importados CPL Motoparts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => navigate("/estoque/novo")}>
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 bg-amber-500 text-white hover:bg-amber-600 border-amber-500">
                <Settings className="h-4 w-4" />
                Mais ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setShowCatalogoMaster(true)}>
                <Package className="h-4 w-4 mr-2" /> Importar Catálogo Pré-Cadastrado
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/estoque/importar-produtos")}>
                <Upload className="h-4 w-4 mr-2" /> Importar de uma planilha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/estoque/importar-xml")}>
                <FileText className="h-4 w-4 mr-2" /> Importar XML (NF-e)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowImportCPL(true)}>
                <Download className="h-4 w-4 mr-2" /> Importar CPL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowImportSportive(true)}>
                <FileText className="h-4 w-4 mr-2" /> Importar Sportive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowImportVipal(true)}>
                <Download className="h-4 w-4 mr-2" /> Importar Vipal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowImportPerere(true)}>
                <Download className="h-4 w-4 mr-2" /> Importar Pererê
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowImportProtork(true)}>
                <Download className="h-4 w-4 mr-2" /> Importar Pro Tork
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/estoque/ajustar-valores-massa")}>
                <TrendingUp className="h-4 w-4 mr-2" /> Ajustar valores em massa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBatchFetchImages(true)}>
                <ImageIcon className="h-4 w-4 mr-2" /> Buscar fotos em lote
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowFetchSportiveImages(true)}>
                <ImageIcon className="h-4 w-4 mr-2" /> Buscar fotos Sportive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={fetchColors} disabled={isFetchingColors}>
                <Palette className="h-4 w-4 mr-2" /> {isFetchingColors ? `Buscando cores (${colorProgress})...` : "Buscar cores"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/estoque/etiquetas")}>
                <Tag className="h-4 w-4 mr-2" /> Gerar etiquetas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={hasActiveFilters ? "default" : "secondary"} size="sm" className="gap-1.5 border border-border text-foreground">
                <Filter className="h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{filtered.length}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4 space-y-3" align="end">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Filtros</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground" onClick={clearAllFilters}>
                    <X className="h-3 w-3 mr-1" /> Limpar
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Marca</label>
                  <Select value={filterMarca} onValueChange={(v) => { setFilterMarca(v); setPage(1); }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">Todas</SelectItem>
                      {filterOptions.marcas.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Cor</label>
                  <Select value={filterCor} onValueChange={(v) => { setFilterCor(v); setPage(1); }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">Todas</SelectItem>
                      {filterOptions.cores.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Ano</label>
                  <Select value={filterAno} onValueChange={(v) => { setFilterAno(v); setPage(1); }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      {filterOptions.anos.map(a => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Modelo</label>
                  <Select value={filterVariante} onValueChange={(v) => { setFilterVariante(v); setPage(1); }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">Todos</SelectItem>
                      {filterOptions.variantes.map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{filtered.length}</span> produtos filtrados
                  </p>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {showImportCPL && <ImportCPLDialog onClose={() => setShowImportCPL(false)} />}
      {showImportSportive && <ImportSportiveDialog onClose={() => { setShowImportSportive(false); queryClient.invalidateQueries({ queryKey: ["produtos"] }); }} />}
      {showImportVipal && <ImportVipalDialog onClose={() => { setShowImportVipal(false); queryClient.invalidateQueries({ queryKey: ["produtos"] }); }} />}
      {showFetchSportiveImages && <FetchSportiveImagesDialog onClose={() => { setShowFetchSportiveImages(false); queryClient.invalidateQueries({ queryKey: ["produtos"] }); }} />}
      {showImportPerere && <ImportPerereDialog onClose={() => { setShowImportPerere(false); queryClient.invalidateQueries({ queryKey: ["produtos"] }); }} />}
      {showImportProtork && <ImportProtorkDialog onClose={() => { setShowImportProtork(false); queryClient.invalidateQueries({ queryKey: ["produtos"] }); }} />}
      {showImportExcel && <ImportExcelDialog onClose={() => { setShowImportExcel(false); queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] }); }} />}
      {showBatchFetchImages && <BatchFetchImagesDialog onClose={() => { setShowBatchFetchImages(false); queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] }); }} />}
      <ImportarCatalogoMasterDialog open={showCatalogoMaster} onOpenChange={(v) => { setShowCatalogoMaster(v); if (!v) queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] }); }} />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-panel">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{categoriaFilter === "TODAS" ? "Total Produtos" : `Produtos em ${categoriaFilter}`}</p>
              <p className="text-xl font-bold text-foreground">{totalProdutos}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Categorias</p>
              <p className="text-xl font-bold text-foreground">{categoriaCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-warning/30">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sem Preço</p>
              <p className="text-xl font-bold text-warning">{semPreco}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={categoriaFilter === c ? "default" : "outline"}
            className={`text-xs h-7 px-3 rounded-full ${
              categoriaFilter !== c ? "text-foreground border-border/60 hover:bg-secondary/60" : ""
            }`}
            onClick={() => { setCategoriaFilter(c); setPage(1); }}
          >
            {c}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative z-10 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nome, código, marca, aplicação (ex: CG 150, TITAN, TRILHA)..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-secondary/50 relative z-10"
          />
        </div>
        <Button
          variant={showAdvanced || hasAdvancedFilters ? "default" : "outline"}
          size="sm"
          className="gap-1.5 whitespace-nowrap"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Search className="h-4 w-4" />
          Busca avançada
          {hasAdvancedFilters && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">!</Badge>
          )}
        </Button>
      </div>

      {showAdvanced && (
        <Card className="glass-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Busca Avançada</h3>
              {hasAdvancedFilters && (
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={clearAdvancedFilters}>
                  <X className="h-3 w-3 mr-1" /> Limpar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Nome</label>
                <Input placeholder="Filtrar por nome" value={advNome} onChange={(e) => { setAdvNome(e.target.value); setPage(1); }} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Código</label>
                <Input placeholder="Código CPL" value={advCodigo} onChange={(e) => { setAdvCodigo(e.target.value); setPage(1); }} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Fornecedor</label>
                <Input placeholder="Digite para buscar" value={advFornecedor} onChange={(e) => { setAdvFornecedor(e.target.value); setPage(1); }} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">COLUNA</label>
                <Input placeholder="Coluna" value={advColuna} onChange={(e) => { setAdvColuna(e.target.value); setPage(1); }} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">RUA</label>
                <Input placeholder="Rua" value={advRua} onChange={(e) => { setAdvRua(e.target.value); setPage(1); }} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">PRATELEIRA</label>
                <Input placeholder="Prateleira" value={advPrateleira} onChange={(e) => { setAdvPrateleira(e.target.value); setPage(1); }} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Ativo</label>
                <Select value={advAtivo} onValueChange={(v) => { setAdvAtivo(v); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="SIM">Sim</SelectItem>
                    <SelectItem value="NAO">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        {/* Product list */}
        <div>
          <div className="rounded-lg border border-border overflow-hidden">
           <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              {(() => {
                const COLUMN_DEFS: Record<string, { label: string; align: string }> = {
                  codigo: { label: "Código", align: "text-left" },
                  foto: { label: "Foto", align: "text-center" },
                  produto: { label: "Produto", align: "text-left" },
                  cor: { label: "Cor", align: "text-left" },
                  estoque: { label: "Estoque", align: "text-center" },
                  preco: { label: "Preço de Venda", align: "text-right" },
                  custo: { label: "Custo", align: "text-right" },
                  marca: { label: "Marca", align: "text-left" },
                  localizacao: { label: "Localização", align: "text-left" },
                  categoria: { label: "Categoria", align: "text-left" },
                  acoes: { label: "Ações", align: "text-center" },
                };
                return (
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      {columnOrder.map((colId) => {
                        const def = COLUMN_DEFS[colId];
                        if (!def) return null;
                        return (
                          <th
                            key={colId}
                            draggable
                            onDragStart={() => setDraggedCol(colId)}
                            onDragOver={(e) => { e.preventDefault(); setDragOverCol(colId); }}
                            onDragLeave={() => setDragOverCol((c) => (c === colId ? null : c))}
                            onDrop={(e) => { e.preventDefault(); handleColDrop(colId); }}
                            onDragEnd={() => { setDraggedCol(null); setDragOverCol(null); }}
                            className={`px-3 py-2.5 font-medium text-muted-foreground select-none cursor-move ${def.align} ${
                              dragOverCol === colId && draggedCol && draggedCol !== colId ? "bg-primary/10 ring-2 ring-primary/40" : ""
                            } ${draggedCol === colId ? "opacity-50" : ""}`}
                            title="Arraste para reordenar a coluna"
                          >
                            <span className="inline-flex items-center gap-1">
                              <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                              {def.label}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                );
              })()}
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-muted-foreground">
                      Carregando produtos...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-muted-foreground">
                      Nenhum produto encontrado. Importe o catálogo CPL primeiro.
                    </td>
                  </tr>
                ) : (
                  filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((p) => (
                    <tr
                      key={p.id}
                      className={`border-b border-border/50 transition-colors ${
                        selectedProduct === p.id ? "bg-primary/5" : "hover:bg-secondary/30"
                      }`}
                    >
                      {(() => {
                        const cells: Record<string, JSX.Element> = {
                          codigo: (
                            <td key="codigo" className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{p.codigo_cpl}</td>
                          ),
                          foto: (
                            <td key="foto" className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedProduct(p.id)}
                                className="mx-auto block rounded-lg transition-transform hover:scale-105 hover:ring-2 hover:ring-primary/40 cursor-pointer"
                                title="Ver detalhes do produto"
                              >
                                {p.imagem_url ? (
                                  <img
                                    src={p.imagem_url}
                                    alt={p.nome}
                                    className="h-12 w-12 rounded-lg object-cover border border-border bg-secondary/30 shadow-sm"
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-lg bg-secondary/50 flex items-center justify-center border border-border/50">
                                    <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                                  </div>
                                )}
                              </button>
                            </td>
                          ),
                          produto: (
                            <td key="produto" className="px-3 py-2.5">
                              <p className="font-medium text-foreground leading-tight text-sm">
                                <span
                                  className="hover:underline hover:text-primary cursor-pointer transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const firstWord = (p.nome || "").split(/\s+/)[0];
                                    if (firstWord) {
                                      setSearch(firstWord);
                                      setPage(1);
                                    }
                                  }}
                                >
                                  {p.nome}
                                </span>
                                {p.aplicacoes && p.aplicacoes.length > 0 ? ` ${p.aplicacoes[0]}` : ""}
                                {p.cor ? ` — ${p.cor}` : ""}
                              </p>
                            </td>
                          ),
                          cor: (
                            <td key="cor" className="px-3 py-2.5 text-sm text-foreground">{p.cor || "—"}</td>
                          ),
                          estoque: (
                            <td key="estoque" className="px-3 py-2.5 text-center font-mono text-foreground">{p.estoque_quantidade ?? 0}</td>
                          ),
                          preco: (
                            <td key="preco" className="px-3 py-2.5 text-right font-mono text-foreground">
                              {(() => {
                                const precos = p.precos_venda as any;
                                if (Array.isArray(precos) && precos.length > 0) {
                                  const primeiro = precos[0];
                                  const valor = primeiro?.valor_venda_utilizado ?? primeiro?.valor ?? null;
                                  if (valor != null && valor > 0) {
                                    return `R$ ${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                  }
                                }
                                if (p.custo_final != null && p.custo_final > 0) {
                                  return `R$ ${Number(p.custo_final).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                }
                                return "—";
                              })()}
                            </td>
                          ),
                          custo: (
                            <td key="custo" className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                              {p.preco_custo != null && p.preco_custo > 0
                                ? `R$ ${Number(p.preco_custo).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "—"}
                            </td>
                          ),
                          marca: (
                            <td key="marca" className="px-3 py-2.5 text-foreground text-sm">{p.marca || "—"}</td>
                          ),
                          localizacao: (
                            <td key="localizacao" className="px-3 py-2.5 text-muted-foreground text-xs">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {p.localizacao ? (() => {
                                  const pts = p.localizacao.split("-");
                                  return `R${pts[0] || ""} P${pts[1] || ""} C${pts[2] || ""} CX${pts[3] || ""}`;
                                })() : "—"}
                              </span>
                            </td>
                          ),
                          categoria: (
                            <td key="categoria" className="px-3 py-2.5 max-w-[90px]">
                              <Badge variant="outline" className="text-[10px] whitespace-normal leading-tight text-center">
                                {p.categoria || "—"}
                              </Badge>
                            </td>
                          ),
                          acoes: (
                            <td key="acoes" className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 px-3 text-xs border-primary/40 bg-primary/10 hover:bg-primary/20 text-foreground"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    Ações
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 z-50 bg-popover border border-border shadow-lg">
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/estoque/editar/${p.id}`)}>📝 Editar produto</DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/estoque/ajustes`)}>📦 Ajustar estoque</DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => setLocationProduct({ id: p.id, nome: p.nome, localizacao: p.localizacao })}>📍 Definir localização</DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/estoque/editar/${p.id}?tab=valores`)}>💰 Alterar preços</DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" asChild onSelect={(e) => e.preventDefault()}>
                                    <div className="w-full">
                                      <ImageUploadButton productId={p.id} variant="button" className="w-full justify-start border-0 shadow-none h-auto px-0 py-0 font-normal text-sm hover:bg-transparent" />
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={async () => {
                                    let imageLink = "";
                                    if (p.imagem_url) {
                                      toast.info("Gerando imagem com código...");
                                      const url = await generateProductShareImage(p.imagem_url, p.codigo_cpl);
                                      if (url) imageLink = `\n${url}`;
                                    }
                                    const text = `Confira este produto: *${p.nome}*${p.marca ? ` - ${p.marca}` : ''}${p.preco_custo ? ` | R$ ${Number(p.preco_custo).toFixed(2)}` : ''}${imageLink}`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                  }}>📱 Compartilhar WhatsApp</DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => setCloneProduct(p)}>📋 Clonar produto</DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={async () => {
                                    const current = (p as any).destaques || [];
                                    const has = current.includes("oferta_dia");
                                    const newDestaques = has ? current.filter((d: string) => d !== "oferta_dia") : [...current, "oferta_dia"];
                                    const { error } = await supabase.from("produtos_catalogo").update({ destaques: newDestaques } as any).eq("id", p.id);
                                    if (error) toast.error("Erro: " + error.message);
                                    else { toast.success(has ? "Removido de Ofertas do Dia" : "Adicionado às Ofertas do Dia!"); queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] }); }
                                  }}>🔥 {((p as any).destaques || []).includes("oferta_dia") ? "Remover de Ofertas do Dia" : "Ofertas do Dia"}</DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={async () => {
                                    const current = (p as any).destaques || [];
                                    const has = current.includes("promo_relampago");
                                    const newDestaques = has ? current.filter((d: string) => d !== "promo_relampago") : [...current, "promo_relampago"];
                                    const { error } = await supabase.from("produtos_catalogo").update({ destaques: newDestaques } as any).eq("id", p.id);
                                    if (error) toast.error("Erro: " + error.message);
                                    else { toast.success(has ? "Removido de Promoção Relâmpago" : "Adicionado à Promoção Relâmpago!"); queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] }); }
                                  }}>⚡ {((p as any).destaques || []).includes("promo_relampago") ? "Remover de Promoção Relâmpago" : "Promoção Relâmpago"}</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => setDeleteProduct({ id: p.id, nome: p.nome })}>🗑️ Excluir</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          ),
                        };
                        return columnOrder.map((id) => cells[id]).filter(Boolean);
                      })()}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
           </div>
            {filtered.length > PER_PAGE && (() => {
              const totalPages = Math.ceil(filtered.length / PER_PAGE);
              return (
                <div className="px-4 py-2.5 flex items-center justify-between bg-secondary/20 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-secondary border-border text-foreground disabled:opacity-30" disabled={page === 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let p: number;
                      if (totalPages <= 7) p = i + 1;
                      else if (page <= 4) p = i + 1;
                      else if (page >= totalPages - 3) p = totalPages - 6 + i;
                      else p = page - 3 + i;
                      return (
                        <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className={`h-7 w-7 p-0 text-xs ${p !== page ? "bg-secondary border-border text-foreground" : ""}`} onClick={() => setPage(p)}>
                          {p}
                        </Button>
                      );
                    })}
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-secondary border-border text-foreground disabled:opacity-30" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

      </div>

      <Sheet open={!!selectedProduct} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto p-4">
          <ProductDetailPanel product={selected || null} />
        </SheetContent>
      </Sheet>

      {locationProduct && (
        <SetLocationDialog
          open={!!locationProduct}
          onOpenChange={(open) => !open && setLocationProduct(null)}
          productId={locationProduct.id}
          productName={locationProduct.nome}
          currentLocation={locationProduct.localizacao}
        />
      )}

      {cloneProduct && (
        <CloneProductDialog
          open={!!cloneProduct}
          onOpenChange={(open) => !open && setCloneProduct(null)}
          product={cloneProduct}
        />
      )}

      {showNewProduct && (
        <CloneProductDialog
          open={showNewProduct}
          onOpenChange={(open) => setShowNewProduct(open)}
          product={{
            id: "",
            nome: "",
            codigo_cpl: "",
            marca: null,
            localizacao: null,
            preco_custo: null,
            custo_final: null,
            precos_venda: null,
            imagem_url: null,
            categoria: null,
            cor: null,
            aplicacoes: null,
            descricao: null,
            ncm: null,
            cest: null,
            ean: null,
            unidade: null,
            peso: null,
            fornecedor: null,
            estoque_minimo: null,
            estoque_quantidade: null,
            despesas_acessorias: null,
            outras_despesas: null,
            observacoes: null,
          }}
        />
      )}

      <AlertDialog open={!!deleteProduct} onOpenChange={(open) => !open && setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteProduct?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
