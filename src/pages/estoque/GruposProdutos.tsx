import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Layers, Pencil, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/supabaseFetchAll";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface GrupoInfo {
  categoria: string;
  total: number;
}

export default function GruposProdutos() {
  const queryClient = useQueryClient();
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: grupos = [], isLoading } = useQuery({
    queryKey: ["grupos_produtos"],
    queryFn: async () => {
      const allRows = await fetchAllRows("produtos_catalogo", "categoria");

      const counts: Record<string, number> = {};
      allRows.forEach((p: any) => {
        const cat = p.categoria || "SEM CATEGORIA";
        counts[cat] = (counts[cat] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([categoria, total]) => ({ categoria, total }))
        .sort((a, b) => a.categoria.localeCompare(b.categoria)) as GrupoInfo[];
    },
  });

  const startEdit = (cat: string) => {
    setEditingCat(cat);
    setNewName(cat);
  };

  const cancelEdit = () => {
    setEditingCat(null);
    setNewName("");
  };

  const handleRename = async () => {
    if (!editingCat || !newName.trim()) return;
    const trimmed = newName.trim().toUpperCase();
    if (trimmed === editingCat) {
      cancelEdit();
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("produtos_catalogo")
      .update({ categoria: trimmed, atualizado_em: new Date().toISOString() })
      .eq("categoria", editingCat);

    setSaving(false);
    if (error) {
      toast.error("Erro ao renomear: " + error.message);
    } else {
      toast.success(`Categoria "${editingCat}" renomeada para "${trimmed}"`);
      queryClient.invalidateQueries({ queryKey: ["grupos_produtos"] });
      queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
      cancelEdit();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Grupos de Produtos</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as categorias dos seus produtos — clique no lápis para renomear
        </p>
      </div>

      <Card className="glass-panel">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : grupos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm">Nenhuma categoria encontrada.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {grupos.map((g) => (
                <div
                  key={g.categoria}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
                >
                  <Layers className="h-4 w-4 text-muted-foreground shrink-0" />

                  {editingCat === g.categoria ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="bg-secondary/50 h-8 text-sm flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename();
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-500 hover:text-green-400"
                        onClick={handleRename}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive/80"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-foreground font-medium flex-1">
                        {g.categoria}
                      </span>
                      <Badge variant="secondary" className="text-xs tabular-nums">
                        {g.total} {g.total === 1 ? "produto" : "produtos"}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => startEdit(g.categoria)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
