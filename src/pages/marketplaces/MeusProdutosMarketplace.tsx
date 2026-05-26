// Meus Produtos Marketplace
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Search, Package, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calcularPrecoVenda } from "@/lib/marketplaceFees";
import MarketplaceCalculatorDialog from "@/components/marketplace/MarketplaceCalculatorDialog";
import EditarProdutoMarketplaceDialog from "@/components/marketplace/EditarProdutoMarketplaceDialog";

import logoMercadoLivre from "@/assets/logo-mercadolivre.png";
import logoAmazon from "@/assets/logo-amazon.png";
import logoShopee from "@/assets/logo-shopee.png";
import logoTikTok from "@/assets/logo-tiktok.png";
import logoShein from "@/assets/logo-shein.png";
import logoMagalu from "@/assets/logo-magalu.png";

const CANAIS = [
  { key: "shein", nome: "Shein", logo: logoShein, cor: "#000" },
  { key: "amazon", nome: "Amazon", logo: logoAmazon, cor: "#FF9900" },
  { key: "shopee", nome: "Shopee", logo: logoShopee, cor: "#EE4D2D" },
  { key: "mercado_livre", nome: "Mercado Livre", logo: logoMercadoLivre, cor: "#FFE600" },
  { key: "magalu", nome: "Magalu", logo: logoMagalu, cor: "#0086ff" },
  { key: "tiktok_shop", nome: "TikTok Shop", logo: logoTikTok, cor: "#000" },
];

interface CanalVinculado {
  id: string;
  canal: string;
  preco: number;
  margem: number;
}

interface ProdutoComCanais {
  id: string;
  nome: string;
  codigo_cpl: string;
  preco_custo: number;
  imagem_url: string | null;
  estoque_quantidade: number;
  canais: CanalVinculado[];
}

export default function MeusProdutosMarketplace() {
  const [produtos, setProdutos] = useState<ProdutoComCanais[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [buscaSku, setBuscaSku] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("todos");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<{ mkId: string; canal: string; preco: number; margem: number } | null>(null);
  const [editPreco, setEditPreco] = useState("");
  const [editMargem, setEditMargem] = useState("");

  // Add canal dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addProdutoId, setAddProdutoId] = useState<string | null>(null);
  const [addCanal, setAddCanal] = useState("");
  const [addMargem, setAddMargem] = useState("30");

  // Vincular produto dialog
  const [vincularOpen, setVincularOpen] = useState(false);
  const [vincularBusca, setVincularBusca] = useState("");
  const [vincularResultados, setVincularResultados] = useState<any[]>([]);
  const [vincularLoading, setVincularLoading] = useState(false);
  const [vincularSelecionado, setVincularSelecionado] = useState<any | null>(null);
  const [vincularCanais, setVincularCanais] = useState<string[]>([]);
  const [vincularMargem, setVincularMargem] = useState("30");

  // Detail calculator dialog
  const [detalheOpen, setDetalheOpen] = useState(false);

  // Edit product dialog
  const [editProdutoOpen, setEditProdutoOpen] = useState(false);
  const [editProdutoId, setEditProdutoId] = useState<string | null>(null);
  const [detalheData, setDetalheData] = useState<{ canal: string; preco: number; margem: number; precoCusto: number; nomeProduto: string; codigoSku: string; imagemUrl: string | null; mkId: string } | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);

    // 1. Fetch all marketplace_produtos
    const { data: mkProds } = await supabase
      .from("marketplace_produtos" as any)
      .select("id, produto_id, canal, preco, margem, ativo");

    if (!mkProds || (mkProds as any[]).length === 0) {
      setProdutos([]);
      setLoading(false);
      return;
    }

    const mkList = mkProds as any[];
    const prodIds = [...new Set(mkList.map((m) => m.produto_id))];

    // 2. Fetch catalog products
    const { data: prods } = await supabase
      .from("produtos_catalogo")
      .select("id, nome, codigo_cpl, preco_custo, imagem_url, estoque_quantidade")
      .in("id", prodIds);

    const prodMap = new Map((prods || []).map((p) => [p.id, p]));

    // 3. Group by product
    const grouped = new Map<string, ProdutoComCanais>();
    for (const mk of mkList) {
      const prod = prodMap.get(mk.produto_id);
      if (!prod) continue;

      if (!grouped.has(prod.id)) {
        grouped.set(prod.id, {
          id: prod.id,
          nome: prod.nome || "Sem nome",
          codigo_cpl: prod.codigo_cpl || "",
          preco_custo: prod.preco_custo || 0,
          imagem_url: prod.imagem_url || null,
          estoque_quantidade: prod.estoque_quantidade || 0,
          canais: [],
        });
      }
      grouped.get(prod.id)!.canais.push({
        id: mk.id,
        canal: mk.canal,
        preco: mk.preco || 0,
        margem: mk.margem || 0,
      });
    }

    setProdutos(Array.from(grouped.values()));
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const produtosFiltrados = produtos.filter((p) => {
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    if (buscaSku && !p.codigo_cpl.toLowerCase().includes(buscaSku.toLowerCase())) return false;
    if (filtroCanal !== "todos" && !p.canais.some((c) => c.canal === filtroCanal)) return false;
    return true;
  });

  const getCanalInfo = (key: string) => CANAIS.find((c) => c.key === key);

  const handleDelete = async (mkId: string) => {
    const { error } = await supabase
      .from("marketplace_produtos" as any)
      .delete()
      .eq("id", mkId);
    if (error) { toast.error("Erro ao remover canal"); return; }
    toast.success("Canal removido");
    carregar();
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    const { error } = await supabase
      .from("marketplace_produtos" as any)
      .update({ preco: parseFloat(editPreco) || 0, margem: parseFloat(editMargem) || 0 })
      .eq("id", editItem.mkId);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Atualizado!");
    setEditOpen(false);
    carregar();
  };

  const buscarProdutosCatalogo = async (termo: string) => {
    if (termo.length < 2) { setVincularResultados([]); return; }
    setVincularLoading(true);
    const { data } = await supabase
      .from("produtos_catalogo")
      .select("id, nome, codigo_cpl, preco_custo, imagem_url, estoque_quantidade")
      .or(`nome.ilike.%${termo}%,codigo_cpl.ilike.%${termo}%`)
      .order("nome")
      .limit(20);
    setVincularResultados(data || []);
    setVincularLoading(false);
  };

  const handleVincularProduto = async () => {
    if (!vincularSelecionado || vincularCanais.length === 0) return;
    const margem = parseFloat(vincularMargem) || 30;
    const custoBase = vincularSelecionado.preco_custo || 0;

    for (const canal of vincularCanais) {
      const preco = calcularPrecoVenda(custoBase, margem, canal);
      await supabase
        .from("marketplace_produtos" as any)
        .insert({ produto_id: vincularSelecionado.id, canal, preco: Math.round(preco * 100) / 100, margem, ativo: false });
    }
    toast.success(`Produto vinculado a ${vincularCanais.length} canal(is)!`);
    setVincularOpen(false);
    setVincularSelecionado(null);
    setVincularCanais([]);
    setVincularBusca("");
    setVincularResultados([]);
    carregar();
  };

  const handleAddCanal = async () => {
    if (!addProdutoId || !addCanal) return;
    const prod = produtos.find((p) => p.id === addProdutoId);
    if (!prod) return;
    const margem = parseFloat(addMargem) || 30;
    const preco = calcularPrecoVenda(prod.preco_custo, margem, addCanal);

    const { error } = await supabase
      .from("marketplace_produtos" as any)
      .insert({ produto_id: addProdutoId, canal: addCanal, preco, margem, ativo: false });
    if (error) { toast.error("Erro ao adicionar canal"); return; }
    toast.success("Canal adicionado!");
    setAddOpen(false);
    setAddCanal("");
    carregar();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-foreground"><h1 className="text-lg font-bold text-foreground">Meus Produtos do Armazém — Marketplaces</h1></h1>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          placeholder="SKU..."
          value={buscaSku}
          onChange={(e) => setBuscaSku(e.target.value)}
          className="w-32"
        />
        <Select value={filtroCanal} onValueChange={setFiltroCanal}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {CANAIS.map((c) => (
              <SelectItem key={c.key} value={c.key}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={carregar}>
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </Button>
        <Button size="sm" className="gap-1.5" onClick={() => setVincularOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Vincular Produto
        </Button>
      </div>

      {/* Product cards grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum produto vinculado a marketplaces</p>
          <p className="text-xs mt-1">Vá à página de cada marketplace para vincular produtos do estoque</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {produtosFiltrados.map((p) => (
            <div key={p.id} className="border border-border rounded-xl p-4 bg-card space-y-3 shadow-sm hover:shadow-md transition-shadow">
              {/* Product header with image */}
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                  {p.imagem_url ? (
                    <img src={p.imagem_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{p.nome}</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">SKU: {p.codigo_cpl}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>Custo: <span className="font-semibold text-foreground">R$ {p.preco_custo.toFixed(2)}</span></span>
                    <span>Estoque: <span className={`font-semibold ${p.estoque_quantidade > 0 ? "text-green-600" : "text-destructive"}`}>{p.estoque_quantidade}</span></span>
                  </div>
                </div>
                <button
                  className="p-1.5 rounded-full hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary shrink-0"
                  title="Editar produto"
                  onClick={() => {
                    setEditProdutoId(p.id);
                    setEditProdutoOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              {/* Canal badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                {p.canais.map((c) => {
                  const info = getCanalInfo(c.canal);
                  return (
                    <Badge
                      key={c.id}
                      className="text-[10px] h-5 text-white font-bold"
                      style={{ backgroundColor: info?.cor || "#666" }}
                    >
                      {info?.nome || c.canal}
                    </Badge>
                  );
                })}
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-1">
                  🔗 {p.canais.length} {p.canais.length === 1 ? "canal" : "canais"}
                </span>
              </div>

              {/* Channel rows */}
              <div className="space-y-1.5">
                {p.canais.map((c) => {
                  const info = getCanalInfo(c.canal);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 bg-muted/40 rounded px-2.5 py-1.5 cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => {
                        setDetalheData({ canal: c.canal, preco: c.preco, margem: c.margem, precoCusto: p.preco_custo, nomeProduto: p.nome, codigoSku: p.codigo_cpl, imagemUrl: p.imagem_url, mkId: c.id });
                        setDetalheOpen(true);
                      }}
                    >
                      <Badge
                        className="text-[9px] h-5 px-2 text-white font-bold shrink-0"
                        style={{ backgroundColor: info?.cor || "#666" }}
                      >
                        {info?.nome || c.canal}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">
                        R$ {c.preco.toFixed(2)}
                      </span>
                      <span className="text-xs text-green-600 font-medium">{c.margem}%</span>
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditItem({ mkId: c.id, canal: c.canal, preco: c.preco, margem: c.margem });
                            setEditPreco(String(c.preco));
                            setEditMargem(String(c.margem));
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Preço / Margem</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Preço (R$)</label>
              <Input value={editPreco} onChange={(e) => setEditPreco(e.target.value)} type="number" step="0.01" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Margem (%)</label>
              <Input value={editMargem} onChange={(e) => setEditMargem(e.target.value)} type="number" step="1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add canal dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Canal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Canal</label>
              <Select value={addCanal} onValueChange={setAddCanal}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CANAIS.filter((c) => {
                    const prod = produtos.find((p) => p.id === addProdutoId);
                    return prod && !prod.canais.some((pc) => pc.canal === c.key);
                  }).map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Margem (%)</label>
              <Input value={addMargem} onChange={(e) => setAddMargem(e.target.value)} type="number" step="1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddCanal} disabled={!addCanal}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vincular produto dialog */}
      <Dialog open={vincularOpen} onOpenChange={(open) => {
        setVincularOpen(open);
        if (!open) { setVincularSelecionado(null); setVincularCanais([]); setVincularBusca(""); setVincularResultados([]); }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vincular Produto do Catálogo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!vincularSelecionado ? (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou código..."
                    value={vincularBusca}
                    onChange={(e) => {
                      setVincularBusca(e.target.value);
                      buscarProdutosCatalogo(e.target.value);
                    }}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                  {vincularLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : vincularResultados.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      {vincularBusca.length >= 2 ? "Nenhum produto encontrado" : "Digite pelo menos 2 caracteres para buscar"}
                    </div>
                  ) : (
                    vincularResultados.map((p) => (
                      <button
                        key={p.id}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                        onClick={() => setVincularSelecionado(p)}
                      >
                        <div className="h-9 w-9 rounded bg-muted overflow-hidden shrink-0">
                          {p.imagem_url ? (
                            <img src={p.imagem_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{p.nome}</p>
                          <p className="text-[10px] text-muted-foreground">SKU: {p.codigo_cpl} • Estoque: {p.estoque_quantidade || 0}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          R$ {(p.preco_custo || 0).toFixed(2)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0">
                    {vincularSelecionado.imagem_url ? (
                      <img src={vincularSelecionado.imagem_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{vincularSelecionado.nome}</p>
                    <p className="text-[10px] text-muted-foreground">SKU: {vincularSelecionado.codigo_cpl} • Custo: R$ {(vincularSelecionado.preco_custo || 0).toFixed(2)}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setVincularSelecionado(null)}>Trocar</Button>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Selecione os canais</label>
                  <div className="flex flex-wrap gap-2">
                    {CANAIS.map((c) => {
                      const jaVinculado = produtos.find((p) => p.id === vincularSelecionado.id)?.canais.some((pc) => pc.canal === c.key);
                      const selecionado = vincularCanais.includes(c.key);
                      return (
                        <button
                          key={c.key}
                          disabled={!!jaVinculado}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                            jaVinculado
                              ? "opacity-40 cursor-not-allowed border-border text-muted-foreground"
                              : selecionado
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50 text-foreground"
                          }`}
                          onClick={() => {
                            setVincularCanais((prev) =>
                              prev.includes(c.key)
                                ? prev.filter((k) => k !== c.key)
                                : [...prev, c.key]
                            );
                          }}
                        >
                          <img src={c.logo} alt="" className="h-4 w-4 object-contain" />
                          {c.nome}
                          {jaVinculado && <span className="text-[9px]">(já vinculado)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Margem (%)</label>
                  <Input value={vincularMargem} onChange={(e) => setVincularMargem(e.target.value)} type="number" step="1" className="mt-1" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVincularOpen(false)}>Cancelar</Button>
            {vincularSelecionado && (
              <Button onClick={handleVincularProduto} disabled={vincularCanais.length === 0}>
                Vincular a {vincularCanais.length} canal(is)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calculator dialog */}
      <MarketplaceCalculatorDialog
        open={detalheOpen}
        onOpenChange={setDetalheOpen}
        data={detalheData}
        getCanalInfo={getCanalInfo}
        mkId={detalheData?.mkId}
        onSave={async (id, preco, margem) => {
          const { error } = await supabase
            .from("marketplace_produtos" as any)
            .update({ preco, margem })
            .eq("id", id);
          if (error) { toast.error("Erro ao atualizar"); return; }
          toast.success("Preço atualizado!");
          carregar();
        }}
      />

      {/* Edit product dialog */}
      {editProdutoId && (
        <EditarProdutoMarketplaceDialog
          produtoId={editProdutoId}
          open={editProdutoOpen}
          onOpenChange={setEditProdutoOpen}
          onSaved={carregar}
        />
      )}
    </div>
  );
}
