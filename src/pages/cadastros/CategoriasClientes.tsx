import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface CategoriaInfo {
  nome: string;
  media_lucro: number;
  total_clientes: number;
}

export default function CategoriasClientes() {
  const navigate = useNavigate();

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ["categorias_clientes_valores"],
    queryFn: async () => {
      // Fetch valores_venda
      const { data: valores, error: vErr } = await supabase
        .from("valores_venda" as any)
        .select("nome, media_lucro")
        .order("nome", { ascending: true });
      if (vErr) throw vErr;

      // Fetch client category counts
      const { data: clientes, error: cErr } = await supabase
        .from("clientes")
        .select("categoria_cliente");
      if (cErr) throw cErr;

      const counts: Record<string, number> = {};
      (clientes || []).forEach((c: any) => {
        const cat = c.categoria_cliente;
        if (cat) {
          const normalized = cat.toLowerCase().replace(/\s+/g, "_");
          counts[normalized] = (counts[normalized] || 0) + 1;
        }
      });

      return ((valores as any[]) || []).map((v: any) => {
        const key = v.nome.toLowerCase().replace(/\s+/g, "_");
        return {
          nome: v.nome,
          media_lucro: v.media_lucro || 0,
          total_clientes: counts[key] || 0,
        } as CategoriaInfo;
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorias de Clientes</h1>
          <p className="text-sm text-muted-foreground">
            As categorias são baseadas nos <strong>Valores de Venda</strong> cadastrados
          </p>
        </div>
        <Button onClick={() => navigate("/estoque/valores-venda")} className="gap-1.5">
          Gerenciar Valores de Venda
        </Button>
      </div>

      <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs text-muted-foreground leading-relaxed">
        As categorias de clientes são vinculadas à tabela de <strong className="text-foreground">Valores de Venda</strong>. Para adicionar ou editar categorias, acesse a página de Valores de Venda. Cada cliente vinculado a uma categoria terá acesso à tabela de preços correspondente.
      </div>

      <Card className="glass-panel">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : categorias.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm">Nenhum valor de venda cadastrado.</p>
              <Button variant="link" onClick={() => navigate("/estoque/valores-venda")} className="mt-2">
                Cadastrar valores de venda
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {categorias.map((g) => (
                <div
                  key={g.nome}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
                >
                  <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground font-medium flex-1">
                    {g.nome}
                  </span>
                  <Badge variant="outline" className="text-xs tabular-nums">
                    {g.media_lucro}% lucro
                  </Badge>
                  <Badge variant="secondary" className="text-xs tabular-nums">
                    {g.total_clientes} {g.total_clientes === 1 ? "cliente" : "clientes"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
