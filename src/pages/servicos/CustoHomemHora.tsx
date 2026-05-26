import { useState } from "react";
import { Clock, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CustoHH {
  id: string;
  nome: string;
  valor_hora: number;
  descricao: string | null;
}

export default function CustoHomemHora() {
  const [nome, setNome] = useState("");
  const [valorHora, setValorHora] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: custos = [], isLoading } = useQuery({
    queryKey: ["custo-homem-hora"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custo_homem_hora" as any)
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data || []) as unknown as CustoHH[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Informe o nome");
      if (!valorHora) throw new Error("Informe o valor/hora");
      const payload = { nome: nome.toUpperCase(), valor_hora: parseFloat(valorHora), descricao: descricao || null };
      if (editId) {
        const { error } = await supabase.from("custo_homem_hora" as any).update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("custo_homem_hora" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custo-homem-hora"] });
      toast.success(editId ? "Custo atualizado!" : "Custo adicionado!");
      setNome(""); setValorHora(""); setDescricao(""); setEditId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custo_homem_hora" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custo-homem-hora"] });
      toast.success("Custo removido!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const editar = (c: CustoHH) => {
    setNome(c.nome); setValorHora(String(c.valor_hora)); setDescricao(c.descricao || ""); setEditId(c.id);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Custo de Homem/Hora</h1>
          <p className="text-sm text-muted-foreground">Gerencie os custos de mão de obra por hora</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editId ? "Editar custo" : "Novo custo"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1.5">
              <Label>Nome</Label>
              <Input placeholder="Ex: Mecânico Sênior" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="w-40 space-y-1.5">
              <Label>Valor/Hora (R$)</Label>
              <Input type="number" step="0.01" placeholder="0,00" value={valorHora} onChange={(e) => setValorHora(e.target.value)} />
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
                <TableHead className="text-right">Valor/Hora (R$)</TableHead>
                <TableHead className="text-right w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {custos.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum custo cadastrado</TableCell></TableRow>
              ) : custos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.descricao || "—"}</TableCell>
                  <TableCell className="text-right font-mono">R$ {Number(c.valor_hora).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editar(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
