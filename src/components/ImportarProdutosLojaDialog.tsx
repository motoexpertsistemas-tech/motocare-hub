import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useBranch } from "@/contexts/BranchContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Package } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportarProdutosLojaDialog({ open, onOpenChange }: Props) {
  const { empresaId } = useEmpresa();
  const { activeBranch, branches } = useBranch();
  const queryClient = useQueryClient();
  const [originBranchId, setOriginBranchId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const otherBranches = branches.filter((b) => b.id !== activeBranch?.id);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["import-products", originBranchId],
    queryFn: async () => {
      if (!originBranchId || !empresaId) return [];
      const { data, error } = await supabase
        .from("produtos_catalogo")
        .select("id, nome, codigo_fornecedor, categoria, estoque_quantidade")
        .eq("empresa_id", empresaId)
        .eq("branch_id", originBranchId)
        .order("nome")
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!originBranchId && !!empresaId,
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!activeBranch || !empresaId || selectedIds.length === 0) throw new Error("Selecione produtos");

      const { data: sourceProducts, error: fetchErr } = await supabase
        .from("produtos_catalogo")
        .select("*")
        .in("id", selectedIds);

      if (fetchErr) throw fetchErr;
      if (!sourceProducts || sourceProducts.length === 0) throw new Error("Nenhum produto encontrado");

      const newProducts = sourceProducts.map((p: any) => {
        const { id, created_at, updated_at, ...rest } = p;
        return { ...rest, branch_id: activeBranch.id, empresa_id: empresaId };
      });

      const { error: insertErr } = await supabase.from("produtos_catalogo").insert(newProducts as any);
      if (insertErr) throw insertErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success(`${selectedIds.length} produto(s) importado(s) com sucesso!`);
      setSelectedIds([]);
      setOriginBranchId("");
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Importar Produtos de Outra Loja
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Loja de Origem</label>
            <Select value={originBranchId} onValueChange={(v) => { setOriginBranchId(v); setSelectedIds([]); }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a loja de origem" />
              </SelectTrigger>
              <SelectContent>
                {otherBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {originBranchId && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Carregando..." : `${products.length} produto(s) encontrado(s)`}
                </p>
                {products.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={toggleAll}>
                    {selectedIds.length === products.length ? "Desmarcar todos" : "Selecionar todos"}
                  </Button>
                )}
              </div>

              <ScrollArea className="h-64 border rounded-md">
                <div className="p-2 space-y-1">
                  {products.map((p) => (
                    <label key={p.id} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-secondary cursor-pointer">
                      <Checkbox
                        checked={selectedIds.includes(p.id)}
                        onCheckedChange={(checked) => {
                          setSelectedIds((prev) =>
                            checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                          );
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">{p.categoria || "Sem categoria"} • Estoque: {p.estoque_quantidade ?? 0}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={selectedIds.length === 0 || importMutation.isPending}
          >
            {importMutation.isPending ? "Importando..." : `Importar ${selectedIds.length} produto(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
