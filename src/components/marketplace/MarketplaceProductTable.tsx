import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package, Search, RefreshCw, CheckCircle,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProdutoCatalogo {
  id: string;
  nome: string;
  codigo_cpl: string;
  codigo_fornecedor: string | null;
  imagem_url: string | null;
  estoque_quantidade: number;
  preco_custo: number;
  status: "novo" | "usado" | "vinculado";
  marketplace_id?: string;
}

interface MarketplaceProductTableProps {
  slug: string;
  marketplaceNome: string;
  onMigracaoClick: () => void;
}

const PAGE_SIZE = 50;

export default function MarketplaceProductTable({
  slug,
  marketplaceNome,
  onMigracaoClick,
}: MarketplaceProductTableProps) {
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroBusca, setFiltroBusca] = useState("nome");
  const [tab, setTab] = useState("todos");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [pagina, setPagina] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const canalKey = (slug || "").replace("-", "_");

  const carregarProdutos = useCallback(async () => {
    setLoading(true);

    // 1. Fetch marketplace_produtos for this channel
    const { data: mkProds } = await supabase
      .from("marketplace_produtos" as any)
      .select("id, produto_id, canal, preco, margem, ativo")
      .eq("canal", canalKey);

    const mkList = (mkProds as any[]) || [];

    if (mkList.length === 0) {
      setProdutos([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const mkMap = new Map(mkList.map((mp) => [mp.produto_id, mp]));
    const prodIds = [...mkMap.keys()];

    // 2. Fetch only the catalog products that are linked to this channel
    let filteredIds = prodIds;

    // Apply search filter on product IDs (we'll filter after fetching)
    const { data: prods } = await supabase
      .from("produtos_catalogo")
      .select("id, nome, codigo_cpl, codigo_fornecedor, imagem_url, estoque_quantidade, preco_custo")
      .in("id", prodIds)
      .order("nome");

    let allMerged: ProdutoCatalogo[] = (prods || []).map((p) => {
      const mk = mkMap.get(p.id);
      return {
        id: p.id,
        nome: p.nome || "Sem nome",
        codigo_cpl: p.codigo_cpl || "",
        codigo_fornecedor: p.codigo_fornecedor || null,
        imagem_url: p.imagem_url || null,
        estoque_quantidade: p.estoque_quantidade || 0,
        preco_custo: p.preco_custo || 0,
        status: "vinculado" as const,
        marketplace_id: mk?.id,
      };
    });

    // Apply search filter client-side
    if (busca) {
      const term = busca.toLowerCase();
      allMerged = allMerged.filter((p) =>
        filtroBusca === "nome"
          ? p.nome.toLowerCase().includes(term)
          : p.codigo_cpl.toLowerCase().includes(term)
      );
    }

    setTotalCount(allMerged.length);

    // Paginate client-side
    const from = pagina * PAGE_SIZE;
    const paginated = allMerged.slice(from, from + PAGE_SIZE);

    setProdutos(paginated);
    setLoading(false);
  }, [slug, canalKey, pagina, busca, filtroBusca]);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  const vincularSelecionados = async () => {
    // No longer needed - products are linked from "Meus Produtos" page
  };

  const toggleSelect = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selecionados.size === produtos.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(produtos.map((p) => p.id)));
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Tutorial bar */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-2.5">
        <span className="font-medium text-foreground">Tutorial de Migração de Anúncios:</span>
        <span className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px] h-5">1</Badge> Sincronizar Anúncios
        </span>
        <span className="text-muted-foreground">&gt;</span>
        <span className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px] h-5">2</Badge> Copiar Anúncios para Lojas
        </span>
        <span className="text-muted-foreground">&gt;</span>
        <span className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px] h-5">3</Badge> Editar e Publicar em Rascunhos
        </span>
      </div>

      {/* Filters row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="h-9 w-36 text-sm">
              <SelectValue placeholder="Estado de todo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Estado de todo...</SelectItem>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="rascunhos">Rascunhos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroBusca} onValueChange={setFiltroBusca}>
            <SelectTrigger className="h-9 w-36 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nome">Nome do...</SelectItem>
              <SelectItem value="codigo">Código SKU</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(0); }}
              className="pl-8 h-9 w-48 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={carregarProdutos}>
            <RefreshCw className="h-3.5 w-3.5" /> Sincronizar
          </Button>
          <Button size="sm" className="gap-1.5" onClick={onMigracaoClick}>
            Migração de Loja
          </Button>
        </div>
      </div>

      {/* Tabs - only vinculados */}
      <div className="flex items-center gap-4 border-b border-border pb-2">
        <span className="text-sm font-medium pb-1 border-b-2 border-primary text-primary">
          Vinculados <Badge variant="secondary" className="ml-1 text-[10px] h-5">{totalCount}</Badge>
        </span>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Selecionado {selecionados.size}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Total {totalCount}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={pagina === 0}
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{pagina + 1}/{Math.max(1, totalPages)}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={pagina >= totalPages - 1}
              onClick={() => setPagina((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Select defaultValue="50">
            <SelectTrigger className="h-7 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50/pági...</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : produtos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum produto encontrado</p>
          <p className="text-xs mt-1">Cadastre produtos no estoque para vinculá-los ao {marketplaceNome}</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[32px_48px_1fr_140px_100px_90px_100px_80px] gap-2 px-3 py-2 bg-muted/50 text-[10px] text-muted-foreground uppercase font-bold border-b border-border">
            <span>
              <input
                type="checkbox"
                checked={selecionados.size === produtos.length && produtos.length > 0}
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5"
              />
            </span>
            <span />
            <span>Nome do Anúncio</span>
            <span>SKU Principal/ID d...</span>
            <span className="text-right">Preço</span>
            <span className="text-right">Quantidade</span>
            <span>Atualizado</span>
            <span>Ações</span>
          </div>

          {/* Rows */}
          {produtos.map((p) => (
            <div
              key={p.id}
              className={`grid grid-cols-[32px_48px_1fr_140px_100px_90px_100px_80px] gap-2 px-3 py-2.5 items-center text-sm border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors ${
                selecionados.has(p.id) ? "bg-primary/5" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={selecionados.has(p.id)}
                onChange={() => toggleSelect(p.id)}
                className="h-3.5 w-3.5"
              />
              <div className="h-10 w-10 rounded bg-muted overflow-hidden">
                {p.imagem_url ? (
                  <img src={p.imagem_url} alt={p.nome} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.nome}</p>
                <p className="text-[10px] text-muted-foreground">{marketplaceNome.toUpperCase()}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs truncate">{p.codigo_cpl}</p>
                {p.codigo_fornecedor && (
                  <p className="text-[10px] text-primary truncate">{p.codigo_fornecedor}</p>
                )}
              </div>
              <span className="text-right text-sm">R$ {p.preco_custo.toFixed(2)}</span>
              <span className="text-right text-sm">{p.estoque_quantidade}</span>
              <span className="text-[10px] text-muted-foreground">—</span>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-[9px] border-green-500 text-green-600 h-5">
                  <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Vinculado
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
