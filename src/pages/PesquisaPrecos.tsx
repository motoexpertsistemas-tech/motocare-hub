import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft, Package, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEmpresa } from "@/contexts/EmpresaContext";

function getPrecosTabelas(produto: any): { nome: string; preco: number }[] {
  if (produto.precos_venda && Array.isArray(produto.precos_venda) && produto.precos_venda.length > 0) {
    const validos = produto.precos_venda
      .filter((pv: any) => {
        const nome = pv?.nome || pv?.tipo;
        const preco = Number(pv?.preco ?? pv?.valor_venda_utilizado);
        return nome && preco > 0;
      })
      .map((pv: any) => ({
        nome: String(pv.nome || pv.tipo),
        preco: Number(pv.preco ?? pv.valor_venda_utilizado),
      }));
    if (validos.length > 0) return validos;
  }
  return [{ nome: "Preço", preco: Number(produto.preco_custo) || 0 }];
}

export default function PesquisaPrecos() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [zoomImg, setZoomImg] = useState<{ url: string; nome: string } | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["pesquisa-precos", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return [];
      let query = supabase
        .from("produtos_catalogo")
        .select("id, nome, codigo_cpl, preco_custo, precos_venda, categoria, estoque_quantidade, localizacao, aplicacoes, marca, imagem_url");

      const words = debouncedSearch.trim().split(/\s+/).filter(Boolean);
      for (const word of words) {
        const term = `%${word}%`;
        query = query.or(`nome.ilike.${term},codigo_cpl.ilike.${term},marca.ilike.${term},aplicacoes.cs.{"${word}"}`);
      }

      const { data } = await query.order("nome").limit(100);
      return data || [];
    },
    enabled: debouncedSearch.trim().length >= 2,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/pdv")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Pesquisa de Preços
          </h1>
          <p className="text-sm text-muted-foreground">Consulte preços sem adicionar ao carrinho</p>
        </div>
      </div>

      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Buscar por nome, código, marca ou aplicação..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary/50 text-base h-12"
        />
      </div>

      {!debouncedSearch.trim() && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <p>Digite o nome ou código do produto para consultar o preço</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <p>Buscando...</p>
        </div>
      )}

      {debouncedSearch.trim() && !isLoading && produtos.length === 0 && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <p>Nenhum produto encontrado</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {produtos.map((p: any) => {
          const tabelas = getPrecosTabelas(p);
          const estoque = Number(p.estoque_quantidade) || 0;
          return (
            <Card key={p.id} className="glass-panel">
              <CardContent className="p-4 text-center space-y-1.5">
                <div
                  className={`w-14 h-14 mx-auto rounded-md overflow-hidden bg-secondary/40 flex items-center justify-center ${p.imagem_url ? "cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all" : ""}`}
                  onClick={() => p.imagem_url && setZoomImg({ url: p.imagem_url, nome: p.nome })}
                >
                  {p.imagem_url ? (
                    <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-contain" />
                  ) : (
                    <Package className="h-7 w-7 text-muted-foreground/60" />
                  )}
                </div>
                <p className="text-sm font-medium leading-tight">{p.nome}</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">{p.codigo_cpl}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold px-1.5 py-0.5 ${estoque > 0 ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-red-500/15 text-red-500 border-red-500/30"}`}
                  >
                    Est: {estoque}
                  </Badge>
                </div>
                {p.localizacao && (
                  <p className="text-[10px] text-emerald-600 font-mono font-semibold">📍 {p.localizacao}</p>
                )}
                {p.marca && (
                  <p className="text-[10px] text-muted-foreground">🏭 {p.marca}</p>
                )}
                {p.aplicacoes && p.aplicacoes.length > 0 && (
                  <p className="text-[10px] text-muted-foreground truncate" title={p.aplicacoes.join(", ")}>
                    🏍️ {p.aplicacoes.slice(0, 2).join(", ")}{p.aplicacoes.length > 2 ? "…" : ""}
                  </p>
                )}
                <div className="border-t border-border pt-1.5 space-y-0.5">
                  {tabelas.map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase truncate">{t.nome}</span>
                      <span className="font-bold text-primary font-mono">
                        R$ {t.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Zoom dialog */}
      <Dialog open={!!zoomImg} onOpenChange={(o) => !o && setZoomImg(null)}>
        <DialogContent className="sm:max-w-md p-2 bg-background">
          {zoomImg && (
            <div className="flex flex-col items-center gap-2">
              <img
                src={zoomImg.url}
                alt={zoomImg.nome}
                className="w-full max-h-[70vh] object-contain rounded-md"
              />
              <p className="text-sm font-medium text-center text-foreground">{zoomImg.nome}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
