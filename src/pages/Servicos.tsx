import { useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Wrench, Plus, Search, Edit2, Trash2, DollarSign, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const ImportServicosDialog = lazy(() => import("@/components/ImportServicosDialog"));

interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  valor_custo: number;
  valor_venda: number;
  comissao: number;
  codigo_interno: string;
  tempo_estimado_min: number | null;
  ativo: boolean;
  created_at: string;
  custo_homem_hora_id: string | null;
  custo_homem_hora_nome?: string;
}

export default function Servicos() {
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const qc = useQueryClient();

  const { data: servicos = [], isLoading } = useQuery({
    queryKey: ["servicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos" as any)
        .select("*")
        .order("nome");
      if (error) throw error;
      const items = (data || []) as any[];
      // Fetch custo_homem_hora names
      const hhIds = [...new Set(items.filter(i => i.custo_homem_hora_id).map(i => i.custo_homem_hora_id))];
      let hhMap: Record<string, string> = {};
      if (hhIds.length > 0) {
        const { data: hhs } = await supabase.from("custo_homem_hora" as any).select("id, nome").in("id", hhIds);
        if (hhs) hhs.forEach((h: any) => { hhMap[h.id] = h.nome; });
      }
      return items.map(i => ({ ...i, custo_homem_hora_nome: hhMap[i.custo_homem_hora_id] || null })) as Servico[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("servicos" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
      toast.success("Serviço removido!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = servicos.filter((s) => {
    const q = search.toLowerCase();
    return s.nome.toLowerCase().includes(q) || (s.descricao || "").toLowerCase().includes(q) || s.codigo_interno.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Wrench className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Serviços / Mão de Obra</h1>
          </div>
          <p className="text-sm text-muted-foreground">Cadastre e gerencie serviços e mão de obra para ordens de serviço e vendas</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 whitespace-nowrap"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Importar Excel
          </Button>
          <Button size="sm" asChild className="whitespace-nowrap">
            <Link to="/servicos/novo" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Novo Serviço
            </Link>
          </Button>
        </div>
      </div>

      <Card className="glass-panel">
        <CardContent className="p-4">
          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar serviço..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Mão de Obra</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Custo (R$)</TableHead>
                  <TableHead className="text-right">Venda (R$)</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead className="w-24 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum serviço encontrado</TableCell></TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.nome}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{s.codigo_interno || "—"}</TableCell>
                      <TableCell>
                        {s.custo_homem_hora_nome ? (
                          <Badge variant="outline" className="text-xs">{s.custo_homem_hora_nome}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[180px] truncate">{s.descricao || "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{Number(s.valor_custo).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-mono">
                          <DollarSign className="h-3 w-3 mr-0.5" />
                          {Number(s.valor_venda).toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{Number(s.comissao).toFixed(1)}%</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link to={`/servicos/editar/${s.id}`}><Edit2 className="h-3.5 w-3.5" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(s.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Suspense fallback={null}>
        <ImportServicosDialog open={importOpen} onOpenChange={setImportOpen} />
      </Suspense>
    </div>
  );
}
