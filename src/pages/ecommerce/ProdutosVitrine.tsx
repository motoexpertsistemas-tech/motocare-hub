import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Package, Flame, Zap, Eye, EyeOff, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const ECOMMERCE_TABLE_NAME = "E-commerce";
const PAGE_SIZE = 80;

function matchesEcommerce(p: any): boolean {
  const label = (p.nome || p.tipo || "").toString().toUpperCase();
  return label === "E-COMMERCE";
}

function getEcommercePrice(precosVenda: any, precoCusto?: number | null): number | null {
  if (precosVenda && Array.isArray(precosVenda)) {
    const ecom = precosVenda.find(matchesEcommerce);
    if (ecom) {
      const val = Number(ecom.valor || ecom.valor_venda_utilizado || 0);
      if (val > 0) return val;
    }
  }
  return null;
}

function getAnyPrice(precosVenda: any, precoCusto?: number | null): number | null {
  if (precosVenda && Array.isArray(precosVenda) && precosVenda.length > 0) {
    const first = precosVenda.find((p: any) => (Number(p.valor) > 0) || (Number(p.valor_venda_utilizado) > 0));
    if (first) return Number(first.valor || first.valor_venda_utilizado);
  }
  if (precoCusto && precoCusto > 0) return Math.round(precoCusto * 1.8 * 100) / 100;
  return null;
}

export default function ProdutosVitrine() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("todos");
  const [page, setPage] = useState(0);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch ALL products in batches of 1000 to bypass Supabase limit
  const { data: allProdutos = [], isLoading } = useQuery({
    queryKey: ["produtos_catalogo_vitrine"],
    queryFn: async () => {
      const selectCols = "id, nome, codigo_cpl, marca, imagem_url, preco_custo, precos_venda, destaques, estoque_quantidade, ativo_vitrine";
      const batchSize = 1000;
      let allData: any[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("produtos_catalogo")
          .select(selectCols)
          .order("nome", { ascending: true })
          .range(offset, offset + batchSize - 1);
        if (error) throw error;
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      return allData;
    },
  });

  const produtos = allProdutos;
  const fmt = (v: number) => v.toFixed(2).replace(".", ",");

  const toggleDestaque = async (prodId: string, tag: string) => {
    const prod = produtos.find((p: any) => p.id === prodId);
    if (!prod) {
      toast.error("Produto não encontrado");
      return;
    }
    const current: string[] = (prod as any).destaques || [];
    const has = current.includes(tag);
    const newDestaques = has ? current.filter((d: string) => d !== tag) : [...current, tag];

    // Optimistic update
    queryClient.setQueryData(["produtos_catalogo_vitrine"], (old: any[]) =>
      old?.map((p: any) => p.id === prodId ? { ...p, destaques: newDestaques } : p)
    );

    try {
      const { error } = await supabase.from("produtos_catalogo").update({ destaques: newDestaques } as any).eq("id", prodId);
      if (error) {
        toast.error("Erro ao atualizar destaque: " + error.message);
        queryClient.invalidateQueries({ queryKey: ["produtos_catalogo_vitrine"] });
        return;
      }
      const labels: Record<string, string> = { oferta_dia: "Ofertas do Dia", promo_relampago: "Promoção Relâmpago" };
      toast.success(has ? `Removido de ${labels[tag]}` : `Adicionado à ${labels[tag]}!`);
      queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
    } catch (err: any) {
      toast.error("Erro inesperado: " + (err?.message || "Tente novamente"));
      queryClient.invalidateQueries({ queryKey: ["produtos_catalogo_vitrine"] });
    }
  };

  const toggleVitrine = async (prodId: string) => {
    const prod = produtos.find((p: any) => p.id === prodId);
    if (!prod) return;
    const current = (prod as any).ativo_vitrine !== false;
    const newValue = !current;

    // Optimistic update
    queryClient.setQueryData(["produtos_catalogo_vitrine"], (old: any[]) =>
      old?.map((p: any) => p.id === prodId ? { ...p, ativo_vitrine: newValue } : p)
    );

    try {
      const { error } = await supabase.from("produtos_catalogo").update({ ativo_vitrine: newValue } as any).eq("id", prodId);
      if (error) {
        toast.error("Erro: " + error.message);
        queryClient.invalidateQueries({ queryKey: ["produtos_catalogo_vitrine"] });
        return;
      }
      toast.success(current ? "Produto oculto da vitrine" : "Produto visível na vitrine!");
      queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
    } catch (err: any) {
      toast.error("Erro inesperado: " + (err?.message || "Tente novamente"));
      queryClient.invalidateQueries({ queryKey: ["produtos_catalogo_vitrine"] });
    }
  };

  const openPriceEdit = (prod: any) => {
    const ecomPrice = getEcommercePrice(prod.precos_venda, prod.preco_custo);
    setEditProduct(prod);
    setEditPrice(ecomPrice ? ecomPrice.toString() : "");
  };

  const handleSavePrice = async () => {
    if (!editProduct) return;
    const newVal = parseFloat(editPrice.replace(",", "."));
    if (isNaN(newVal) || newVal < 0) {
      toast.error("Informe um valor válido");
      return;
    }
    setSaving(true);

    let precosArr: any[] = Array.isArray(editProduct.precos_venda) ? [...editProduct.precos_venda] : [];
    const idx = precosArr.findIndex(matchesEcommerce);

    if (newVal === 0) {
      if (idx >= 0) precosArr.splice(idx, 1);
    } else {
      const entry = { nome: ECOMMERCE_TABLE_NAME, valor: newVal };
      if (idx >= 0) precosArr[idx] = { ...precosArr[idx], ...entry };
      else precosArr.push(entry);
    }

    const { error } = await supabase
      .from("produtos_catalogo")
      .update({ precos_venda: precosArr } as any)
      .eq("id", editProduct.id);

    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Preço E-commerce atualizado!");
      queryClient.invalidateQueries({ queryKey: ["produtos_catalogo_vitrine"] });
      queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
    }
    setSaving(false);
    setEditProduct(null);
  };

  const filtered = produtos.filter((p: any) => {
    const searchTerms = search.trim().toLowerCase().split(/\s+/).filter(t => t.length >= 1);
    const searchable = `${p.nome || ""} ${p.codigo_cpl || ""} ${p.marca || ""}`.toLowerCase();
    const matchSearch = searchTerms.length === 0 || searchTerms.every(term => searchable.includes(term));
    if (tab === "oferta_dia") return matchSearch && ((p as any).destaques || []).includes("oferta_dia");
    if (tab === "promo_relampago") return matchSearch && ((p as any).destaques || []).includes("promo_relampago");
    if (tab === "vitrine") return matchSearch && (p as any).ativo_vitrine !== false;
    if (tab === "ocultos") return matchSearch && (p as any).ativo_vitrine === false;
    return matchSearch;
  });

  // Client-side pagination
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const paginatedItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const countOferta = produtos.filter((p: any) => ((p as any).destaques || []).includes("oferta_dia")).length;
  const countPromo = produtos.filter((p: any) => ((p as any).destaques || []).includes("promo_relampago")).length;
  const countVitrine = produtos.filter((p: any) => (p as any).ativo_vitrine !== false).length;
  const countOcultos = produtos.filter((p: any) => (p as any).ativo_vitrine === false).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">🛍️ Produtos Vitrine</h1>
        <p className="text-sm text-muted-foreground">Gerencie quais produtos aparecem na vitrine, destaques e preços E-commerce</p>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setTab("vitrine")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Eye className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{countVitrine}</p><p className="text-xs text-muted-foreground">Na Vitrine</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setTab("ocultos")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted"><EyeOff className="h-5 w-5 text-muted-foreground" /></div>
            <div><p className="text-2xl font-bold text-foreground">{countOcultos}</p><p className="text-xs text-muted-foreground">Ocultos</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-destructive/30 transition-colors" onClick={() => setTab("oferta_dia")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><Flame className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-2xl font-bold text-foreground">{countOferta}</p><p className="text-xs text-muted-foreground">Ofertas do Dia</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-accent-foreground/30 transition-colors" onClick={() => setTab("promo_relampago")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent"><Zap className="h-5 w-5 text-accent-foreground" /></div>
            <div><p className="text-2xl font-bold text-foreground">{countPromo}</p><p className="text-xs text-muted-foreground">Promoção Relâmpago</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou código..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(0); }} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-5 w-full sm:w-auto">
            <TabsTrigger value="todos" className="text-xs">Todos</TabsTrigger>
            <TabsTrigger value="vitrine" className="text-xs">Vitrine</TabsTrigger>
            <TabsTrigger value="ocultos" className="text-xs">Ocultos</TabsTrigger>
            <TabsTrigger value="oferta_dia" className="text-xs">🔥 Ofertas</TabsTrigger>
            <TabsTrigger value="promo_relampago" className="text-xs">⚡ Flash</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Foto</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="w-24 text-center">Vitrine</TableHead>
                  <TableHead className="w-24 text-center">🔥 Oferta</TableHead>
                  <TableHead className="w-24 text-center">⚡ Flash</TableHead>
                  <TableHead className="w-32 text-right">Preço E-commerce</TableHead>
                  <TableHead className="w-16 text-center">Editar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</TableCell></TableRow>
                ) : paginatedItems.map((p: any) => {
                  const destaques: string[] = p.destaques || [];
                  const isVitrine = p.ativo_vitrine !== false;
                  const ecomPrice = getEcommercePrice(p.precos_venda, p.preco_custo);
                  const fallbackPrice = getAnyPrice(p.precos_venda, p.preco_custo);
                  return (
                    <TableRow key={p.id} className={!isVitrine ? "opacity-50" : ""}>
                      <TableCell>
                        {p.imagem_url ? (
                          <img src={p.imagem_url} alt={p.nome} className="h-10 w-10 rounded object-cover border border-border" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm text-foreground line-clamp-1">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">{p.codigo_cpl}{p.marca ? ` • ${p.marca}` : ""}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={isVitrine} onCheckedChange={() => toggleVitrine(p.id)} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={destaques.includes("oferta_dia")} onCheckedChange={() => toggleDestaque(p.id, "oferta_dia")} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={destaques.includes("promo_relampago")} onCheckedChange={() => toggleDestaque(p.id, "promo_relampago")} />
                      </TableCell>
                      <TableCell className="text-right">
                        {ecomPrice ? (
                          <span className="text-sm font-bold text-primary">R$ {fmt(ecomPrice)}</span>
                        ) : fallbackPrice ? (
                          <span className="text-xs text-muted-foreground italic" title="Preço herdado (sem E-commerce definido)">R$ {fmt(fallbackPrice)}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openPriceEdit(p)} title="Editar preço E-commerce">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Página {page + 1} de {totalPages} • {totalCount} produtos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="h-8"
                >
                  Próxima <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal editar preço E-commerce */}
      <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Preço E-commerce</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                {editProduct.imagem_url ? (
                  <img src={editProduct.imagem_url} alt="" className="h-12 w-12 rounded object-cover border border-border" />
                ) : (
                  <div className="h-12 w-12 rounded bg-muted flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
                )}
                <div>
                  <p className="font-medium text-sm text-foreground line-clamp-2">{editProduct.nome}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {editProduct.codigo_cpl && <span>Código: {editProduct.codigo_cpl}</span>}
                    {editProduct.marca && <span>• Marca: {editProduct.marca}</span>}
                  </div>
                </div>
              </div>

              {editProduct.preco_custo > 0 && (
                <p className="text-xs text-muted-foreground">Custo: R$ {fmt(editProduct.preco_custo)}</p>
              )}

              {/* Tabelas de preço existentes */}
              {Array.isArray(editProduct.precos_venda) && editProduct.precos_venda.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">📊 Tabelas de Preço</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {editProduct.precos_venda.map((pv: any, i: number) => {
                      const val = Number(pv.valor || pv.valor_venda_utilizado || 0);
                      const isEcom = matchesEcommerce(pv);
                      const displayName = pv.nome || pv.tipo || "—";
                      return val > 0 ? (
                        <div key={i} className={`text-xs px-2 py-1 rounded ${isEcom ? "bg-primary/10 text-primary font-semibold border border-primary/30" : "bg-muted text-muted-foreground"}`}>
                          {displayName}: R$ {fmt(val)}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Preço E-commerce (R$)</Label>
                <Input
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="0,00"
                  type="number"
                  step="0.01"
                  min="0"
                  className="bg-secondary/50"
                />
                <p className="text-[10px] text-muted-foreground">Deixe 0 ou vazio para usar o preço padrão (Varejo/fallback).</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)} className="text-foreground border-border">Cancelar</Button>
            <Button onClick={handleSavePrice} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}