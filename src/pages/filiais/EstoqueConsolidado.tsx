import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";

export default function EstoqueConsolidado() {
  const { empresaId } = useEmpresa();
  const [busca, setBusca] = useState("");

  const { data: branches = [] } = useQuery({
    queryKey: ["branches", empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase.from("branches").select("id, nome").eq("empresa_id", empresaId).eq("ativo", true).order("created_at");
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["branch_inventory_all", empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from("branch_inventory")
        .select("branch_id, product_id, quantidade, estoque_minimo, produtos_catalogo(nome, codigo_fornecedor, categoria)")
        .eq("empresa_id", empresaId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });

  // Group by product
  const productMap = new Map<string, { nome: string; sku: string; categoria: string; minimo: number; byBranch: Record<string, number> }>();
  inventory.forEach((item: any) => {
    const p = item.produtos_catalogo as any;
    if (!p) return;
    const nome = p.nome || "";
    if (busca && !nome.toLowerCase().includes(busca.toLowerCase()) && !(p.codigo_fornecedor || "").toLowerCase().includes(busca.toLowerCase())) return;
    if (!productMap.has(item.product_id)) {
      productMap.set(item.product_id, { nome, sku: p.codigo_fornecedor || "", categoria: p.categoria || "", minimo: item.estoque_minimo, byBranch: {} });
    }
    const entry = productMap.get(item.product_id)!;
    entry.byBranch[item.branch_id] = item.quantidade;
  });

  const products = Array.from(productMap.entries()).sort((a, b) => a[1].nome.localeCompare(b[1].nome));

  const exportCSV = () => {
    const header = ["Produto", "SKU", ...branches.map((b: any) => b.nome), "Total"];
    const rows = products.map(([, p]) => {
      const cols = branches.map((b: any) => p.byBranch[b.id] || 0);
      const total = cols.reduce((a, b) => a + b, 0);
      return [p.nome, p.sku, ...cols, total];
    });
    const csv = [header, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "estoque_consolidado.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Visão Consolidada</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-64" placeholder="Buscar produto ou SKU..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Exportar CSV</Button>
        </div>
      </div>

      {isLoading ? <p className="text-muted-foreground">Carregando...</p> : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10">Produto</TableHead>
                <TableHead>SKU</TableHead>
                {branches.map((b: any) => <TableHead key={b.id} className="text-center">{b.nome}</TableHead>)}
                <TableHead className="text-center font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow><TableCell colSpan={branches.length + 3} className="text-center text-muted-foreground py-8">Nenhum dado encontrado</TableCell></TableRow>
              ) : products.map(([pid, p]) => {
                const total = branches.reduce((acc: number, b: any) => acc + (p.byBranch[b.id] || 0), 0);
                return (
                  <TableRow key={pid}>
                    <TableCell className="sticky left-0 bg-background font-medium">{p.nome}</TableCell>
                    <TableCell>{p.sku}</TableCell>
                    {branches.map((b: any) => {
                      const qty = p.byBranch[b.id] || 0;
                      const isLow = qty > 0 && qty <= p.minimo;
                      const isZero = qty === 0;
                      return (
                        <TableCell key={b.id} className={`text-center ${isZero ? "text-red-600 font-bold" : isLow ? "text-yellow-600 font-semibold" : ""}`}>
                          {qty}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-bold">{total}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
