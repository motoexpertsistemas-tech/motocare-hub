import { useState } from "react";
import { DollarSign, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TabelaPreco {
  id: string;
  nome: string;
  descricao: string | null;
  percentual_acrescimo: number;
  ativo: boolean;
}

export default function TabelaPrecos() {
  const [nome, setNome] = useState("");
  const [percentual, setPercentual] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: tabelas = [], isLoading } = useQuery({
    queryKey: ["tabela-precos-servicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tabela_precos_servicos" as any)
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data || []) as unknown as TabelaPreco[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Informe o nome da tabela");
      const payload = { nome: nome.toUpperCase(), percentual_acrescimo: parseFloat(percentual || "0"), descricao: descricao || null };
      if (editId) {
        const { error } = await supabase.from("tabela_precos_servicos" as any).update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tabela_precos_servicos" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tabela-precos-servicos"] });
      toast.success(editId ? "Tabela atualizada!" : "Tabela adicionada!");
      setNome(""); setPercentual(""); setDescricao(""); setEditId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tabela_precos_servicos" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tabela-precos-servicos"] });
      toast.success("Tabela removida!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const editar = (t: TabelaPreco) => {
    setNome(t.nome); setPercentual(String(t.percentual_acrescimo)); setDescricao(t.descricao || ""); setEditId(t.id);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tabela de Preços de Serviços</h1>
          <p className="text-sm text-muted-foreground">Gerencie tabelas de preços diferenciadas para serviços</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editId ? "Editar tabela" : "Nova tabela"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1.5">
              <Label>Nome da Tabela</Label>
              <Input placeholder="Ex: Tabela Premium" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="w-44 space-y-1.5">
              <Label>Acréscimo (%)</Label>
              <Input type="number" step="0.1" placeholder="0,0" value={percentual} onChange={(e) => setPercentual(e.target.value)} />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Descrição</Label>
              <Input placeholder="Opcional" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-1">
              <Plus className="h-4 w-4" />
              {editId ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Acréscimo (%)</TableHead>
                <TableHead className="text-right w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tabelas.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma tabela cadastrada</TableCell></TableRow>
              ) : tabelas.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nome}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{t.descricao || "—"}</TableCell>
                  <TableCell className="text-right font-mono">{Number(t.percentual_acrescimo).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editar(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
