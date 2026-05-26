import { useState } from "react";
import { toBRL } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { DollarSign, Plus, Search, Eye, Pencil, Trash2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ValorVenda {
  id: string;
  nome: string;
  media_lucro: number;
  criado_em: string;
  atualizado_em: string;
}

export default function ValoresVenda() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ValorVenda | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ValorVenda | null>(null);
  const [nome, setNome] = useState("");
  const [mediaLucro, setMediaLucro] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: valores = [], isLoading } = useQuery({
    queryKey: ["valores_venda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("valores_venda" as any)
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as unknown as ValorVenda[];
    },
  });

  const getEmpresaId = async (): Promise<string | null> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;
    const { data } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();
    return (data as any)?.empresa_id ?? null;
  };

  const filtered = valores.filter((v) =>
    !search || v.nome.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setNome("");
    setMediaLucro("");
    setDialogOpen(true);
  };

  const openEdit = (v: ValorVenda) => {
    setEditing(v);
    setNome(v.nome);
    setMediaLucro(v.media_lucro.toString());
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from("valores_venda" as any)
        .update({ nome: nome.trim(), media_lucro: parseFloat(mediaLucro) || 0 } as any)
        .eq("id", editing.id);
      if (error) toast.error("Erro: " + error.message);
      else toast.success("Valor atualizado!");
    } else {
      const empresa_id = await getEmpresaId();
      if (!empresa_id) {
        toast.error("Empresa não encontrada para o usuário");
        setSaving(false);
        return;
      }
      const { error } = await supabase
        .from("valores_venda" as any)
        .insert({ nome: nome.trim(), media_lucro: parseFloat(mediaLucro) || 0, empresa_id } as any);
      if (error) toast.error("Erro: " + error.message);
      else toast.success("Valor adicionado!");
    }
    setSaving(false);
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["valores_venda"] });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("valores_venda" as any)
      .delete()
      .eq("id", deleteTarget.id);
    if (error) toast.error("Erro: " + error.message);
    else toast.success("Valor excluído!");
    setDeleteTarget(null);
    queryClient.invalidateQueries({ queryKey: ["valores_venda"] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" /> Valores de Venda
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie os tipos de valores de venda e margens de lucro</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button onClick={openAdd} className="gap-1.5">
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
          <Button variant="outline" onClick={() => navigate("/estoque/ajustar-massa")} className="gap-1.5 text-foreground border-border hover:bg-secondary/60">
            <Users className="h-4 w-4" /> Ajustar valores em massa
          </Button>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs text-muted-foreground leading-relaxed">
        Um mesmo produto pode ter vários valores de venda, de acordo com a <strong className="text-foreground">Tabela de Valores de Venda</strong>, que por sua vez, possui vários <strong className="text-foreground">Tipos de Valores de Venda</strong>. Por exemplo, um produto pode ter o valor de atacado e varejo. Durante o cadastramento dos produtos é possível gerar sugestões de Valores de Venda com base na Média de Lucro.
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Média de lucro (%)</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Nenhum valor de venda encontrado.</td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{v.nome}</td>
                  <td className="px-4 py-3 text-foreground font-mono">{toBRL(v.media_lucro)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-info/40 bg-info/10 hover:bg-info/20 text-info"
                        title="Visualizar"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-warning/40 bg-warning/10 hover:bg-warning/20 text-warning"
                        onClick={() => openEdit(v)}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-destructive/40 bg-destructive/10 hover:bg-destructive/20 text-destructive"
                        onClick={() => setDeleteTarget(v)}
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-4 py-2 text-xs text-muted-foreground bg-secondary/20">
            Mostrando 1 a {filtered.length} de um total de {filtered.length}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? "Editar Valor de Venda" : "Adicionar Valor de Venda"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: varejo, atacado" className="bg-secondary/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Média de lucro (%)</Label>
              <Input value={mediaLucro} onChange={(e) => setMediaLucro(e.target.value)} type="number" step="0.01" placeholder="0,00" className="bg-secondary/50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-foreground border-border">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir valor de venda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>"{deleteTarget?.nome}"</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
