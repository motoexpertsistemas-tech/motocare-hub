import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

export default function EstoqueFilial() {
  const { empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const [branchId, setBranchId] = useState<string>("");
  const [movDialog, setMovDialog] = useState<{ open: boolean; productId: string; productName: string }>({ open: false, productId: "", productName: "" });
  const [movForm, setMovForm] = useState({ tipo: "entrada", quantidade: "", motivo: "" });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches", empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase.from("branches").select("id, nome, tipo").eq("empresa_id", empresaId).eq("ativo", true).order("created_at");
      if (error) throw error;
      if (data?.length && !branchId) setBranchId(data[0].id);
      return data || [];
    },
    enabled: !!empresaId,
  });

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["branch_inventory", branchId],
    queryFn: async () => {
      if (!branchId) return [];
      const { data, error } = await supabase
        .from("branch_inventory")
        .select("id, quantidade, estoque_minimo, product_id, produtos_catalogo(nome, codigo_fornecedor)")
        .eq("branch_id", branchId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!branchId,
  });

  const movMutation = useMutation({
    mutationFn: async () => {
      if (!empresaId || !branchId) throw new Error("Dados incompletos");
      const qty = parseInt(movForm.quantidade);
      if (isNaN(qty) || qty <= 0) throw new Error("Quantidade inválida");

      const { error: movError } = await supabase.from("stock_movements").insert({
        branch_id: branchId,
        product_id: movDialog.productId,
        empresa_id: empresaId,
        tipo: movForm.tipo,
        quantidade: qty,
        motivo: movForm.motivo || null,
      } as any);
      if (movError) throw movError;

      const item = inventory.find((i: any) => i.product_id === movDialog.productId);
      const currentQty = item?.quantidade || 0;
      let newQty = currentQty;
      if (movForm.tipo === "entrada") newQty = currentQty + qty;
      else if (movForm.tipo === "saida") newQty = Math.max(0, currentQty - qty);
      else newQty = qty;

      const { error: updError } = await supabase
        .from("branch_inventory")
        .update({ quantidade: newQty } as any)
        .eq("branch_id", branchId)
        .eq("product_id", movDialog.productId);
      if (updError) throw updError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch_inventory", branchId] });
      setMovDialog({ open: false, productId: "", productName: "" });
      setMovForm({ tipo: "entrada", quantidade: "", motivo: "" });
      toast.success("Movimentação registrada!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getStatus = (qty: number, min: number) => {
    if (qty === 0) return <Badge variant="destructive">Zerado</Badge>;
    if (qty <= min) return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Baixo</Badge>;
    return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">OK</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Estoque por Filial</h1>
        <Select value={branchId} onValueChange={setBranchId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Selecione a filial" /></SelectTrigger>
          <SelectContent>
            {branches.map((b: any) => (
              <SelectItem key={b.id} value={b.id}>{b.nome} ({b.tipo})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <p className="text-muted-foreground">Carregando...</p> : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead className="text-center">Est. Mínimo</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum produto encontrado</TableCell></TableRow>
              ) : inventory.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{(item.produtos_catalogo as any)?.nome || "—"}</TableCell>
                  <TableCell>{(item.produtos_catalogo as any)?.codigo_fornecedor || "—"}</TableCell>
                  <TableCell className="text-center">{item.quantidade}</TableCell>
                  <TableCell className="text-center">{item.estoque_minimo}</TableCell>
                  <TableCell className="text-center">{getStatus(item.quantidade, item.estoque_minimo)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => {
                      setMovDialog({ open: true, productId: item.product_id, productName: (item.produtos_catalogo as any)?.nome || "" });
                      setMovForm({ tipo: "entrada", quantidade: "", motivo: "" });
                    }}>
                      <ArrowLeftRight className="w-4 h-4 mr-1" /> Movimentar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={movDialog.open} onOpenChange={o => setMovDialog(d => ({ ...d, open: o }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Movimentar: {movDialog.productName}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={movForm.tipo} onValueChange={v => setMovForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste (definir quantidade)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Quantidade</Label><Input type="number" min="0" value={movForm.quantidade} onChange={e => setMovForm(f => ({ ...f, quantidade: e.target.value }))} /></div>
            <div><Label>Motivo</Label><Input value={movForm.motivo} onChange={e => setMovForm(f => ({ ...f, motivo: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovDialog(d => ({ ...d, open: false }))}>Cancelar</Button>
            <Button onClick={() => movMutation.mutate()} disabled={!movForm.quantidade || movMutation.isPending}>
              {movMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
