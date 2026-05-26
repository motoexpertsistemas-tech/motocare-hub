import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Search, Eye, Pencil, Trash2, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface PlanoContaRow {
  id: string;
  classificacao: string;
  nome: string;
  tipo_movimentacao: string;
  grupo_dre: string;
  nivel: number;
  ativo: boolean;
}

export default function PlanoContas() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlanoContaRow | null>(null);
  const [viewItem, setViewItem] = useState<PlanoContaRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<PlanoContaRow | null>(null);
  const [form, setForm] = useState({ classificacao: "", nome: "", tipo_movimentacao: "Pagamentos", grupo_dre: "------", nivel: 3 });
  const [customGrupoDre, setCustomGrupoDre] = useState(false);
  const [customGrupoDreValue, setCustomGrupoDreValue] = useState("");

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ["plano_contas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plano_contas")
        .select("*")
        .eq("ativo", true)
        .order("classificacao");
      if (error) throw error;
      return data as PlanoContaRow[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (item: typeof form) => {
      const { error } = await supabase.from("plano_contas").insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plano_contas"] });
      queryClient.invalidateQueries({ queryKey: ["plano_contas_ativos"] });
      toast.success("Conta adicionada com sucesso!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...item }: { id: string } & typeof form) => {
      const { error } = await supabase.from("plano_contas").update(item).eq("id", id);
      if (error) throw error;

      // Se editou nome de um grupo (nível <= 2), atualizar grupo_dre dos filhos pela classificação
      if (editingItem && editingItem.nivel <= 2 && editingItem.nome !== item.nome) {
        const prefix = editingItem.classificacao + ".";
        const { error: childError } = await supabase
          .from("plano_contas")
          .update({ grupo_dre: item.nome })
          .like("classificacao", `${prefix}%`);
        if (childError) throw childError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plano_contas"] });
      queryClient.invalidateQueries({ queryKey: ["plano_contas_ativos"] });
      toast.success("Conta atualizada!");
      setEditingItem(null);
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plano_contas").update({ ativo: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plano_contas"] });
      queryClient.invalidateQueries({ queryKey: ["plano_contas_ativos"] });
      toast.success("Conta removida!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => { setForm({ classificacao: "", nome: "", tipo_movimentacao: "Pagamentos", grupo_dre: "------", nivel: 3 }); setCustomGrupoDre(false); setCustomGrupoDreValue(""); };

  const dreCategories = ["------", "(+) RECEITA BRUTA DE VENDA", "(=) RECEITA BRUTA DE VENDA TOTAL", "(-) CMV - CUSTO MERCADORIA VENDIDA", "(=) RECEITA LÍQUIDA", "(+) RECEITA SERVIÇOS TERCEIRIZADOS", "(+) OUTRAS RECEITAS OPERACIONAIS", "(=) LUCRO BRUTO", "(-) CUSTOS VARIÁVEIS", "(=) MARGEM DE CONTRIBUIÇÃO", "(-) DESPESAS FIXAS", "(=) RESULTADO OPERACIONAL", "(+) RECEITAS NÃO OPERACIONAIS", "(-) DESPESAS NÃO OPERACIONAIS", "(=) RESULTADO LÍQUIDO"];

  const openEdit = (item: PlanoContaRow) => {
    setEditingItem(item);
    const grupoDre = item.grupo_dre || "";
    const isCustom = grupoDre !== "" && !dreCategories.includes(grupoDre);
    setCustomGrupoDre(isCustom);
    setCustomGrupoDreValue(isCustom ? grupoDre : "");
    setForm({ classificacao: item.classificacao, nome: item.nome, tipo_movimentacao: item.tipo_movimentacao, grupo_dre: grupoDre, nivel: item.nivel });
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingItem(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.classificacao || !form.nome) { toast.error("Preencha classificação e nome"); return; }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...form });
    } else {
      addMutation.mutate(form);
    }
  };

  const filtered = (() => {
    if (!search) return contas;
    const s = search.toLowerCase();
    // First pass: find directly matching items
    const directMatches = contas.filter((c) =>
      c.nome.toLowerCase().includes(s) ||
      c.classificacao.toLowerCase().includes(s) ||
      (c.grupo_dre && c.grupo_dre.toLowerCase().includes(s))
    );
    // Collect prefixes from matched groups (nivel <= 2) to include their children
    const groupPrefixes = directMatches
      .filter((c) => c.nivel <= 2)
      .map((c) => c.classificacao + ".");
    // Second pass: include children of matched groups
    if (groupPrefixes.length === 0) return directMatches;
    const allIds = new Set(directMatches.map((c) => c.id));
    const children = contas.filter((c) =>
      !allIds.has(c.id) && groupPrefixes.some((p) => c.classificacao.startsWith(p))
    );
    return [...directMatches, ...children].sort((a, b) => a.classificacao.localeCompare(b.classificacao));
  })();

  const isGroup = (c: PlanoContaRow) => c.nivel <= 2;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/financeiro" className="hover:text-foreground">Início</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Plano de contas</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Plano de contas</h1>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Classificação</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-[140px]">Movimentação</TableHead>
              <TableHead className="w-[200px]">Grupo do DRE</TableHead>
              <TableHead className="w-[130px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma conta encontrada</TableCell></TableRow>
            ) : (
              filtered.map((conta) => (
                <TableRow key={conta.id} className={isGroup(conta) ? "bg-muted/50 font-semibold" : ""}>
                  <TableCell className="font-mono text-sm">{conta.classificacao}</TableCell>
                  <TableCell>{conta.nome}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      conta.tipo_movimentacao === "Recebimentos" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {conta.tipo_movimentacao}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{conta.grupo_dre}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-blue-800" onClick={() => setViewItem(conta)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-600 hover:text-orange-800" onClick={() => openEdit(conta)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-800" onClick={() => setDeleteItem(conta)}>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar conta" : "Adicionar conta"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Classificação</Label>
              <Input value={form.classificacao} onChange={(e) => setForm({ ...form, classificacao: e.target.value })} placeholder="Ex: 5.2.29" disabled={!!editingItem} />
            </div>
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value.toUpperCase() })} placeholder="Nome da conta" />
            </div>
            <div className="grid gap-2">
              <Label>Movimentação</Label>
              <Select value={form.tipo_movimentacao} onValueChange={(v) => setForm({ ...form, tipo_movimentacao: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pagamentos">Pagamentos</SelectItem>
                  <SelectItem value="Recebimentos">Recebimentos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Grupo do DRE</Label>
              {customGrupoDre ? (
                <div className="flex gap-2">
                  <Input 
                    value={customGrupoDreValue} 
                    onChange={(e) => { setCustomGrupoDreValue(e.target.value.toUpperCase()); setForm({ ...form, grupo_dre: e.target.value.toUpperCase() }); }} 
                    placeholder="Digite a nova categoria" 
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => { setCustomGrupoDre(false); setForm({ ...form, grupo_dre: "------" }); setCustomGrupoDreValue(""); }}>
                    Voltar
                  </Button>
                </div>
              ) : (
                <Select value={form.grupo_dre} onValueChange={(v) => { if (v === "__nova__") { setCustomGrupoDre(true); setCustomGrupoDreValue(""); setForm({ ...form, grupo_dre: "" }); } else { setForm({ ...form, grupo_dre: v }); } }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="------">------</SelectItem>
                    <SelectItem value="(+) RECEITA BRUTA DE VENDA">(+) RECEITA BRUTA DE VENDA</SelectItem>
                    <SelectItem value="(=) RECEITA BRUTA DE VENDA TOTAL">(=) RECEITA BRUTA DE VENDA TOTAL</SelectItem>
                    <SelectItem value="(-) CMV - CUSTO MERCADORIA VENDIDA">(-) CMV - CUSTO MERCADORIA VENDIDA</SelectItem>
                    <SelectItem value="(=) RECEITA LÍQUIDA">(=) RECEITA LÍQUIDA</SelectItem>
                    <SelectItem value="(+) RECEITA SERVIÇOS TERCEIRIZADOS">(+) RECEITA SERVIÇOS TERCEIRIZADOS</SelectItem>
                    <SelectItem value="(+) OUTRAS RECEITAS OPERACIONAIS">(+) OUTRAS RECEITAS OPERACIONAIS</SelectItem>
                    <SelectItem value="(=) LUCRO BRUTO">(=) LUCRO BRUTO</SelectItem>
                    <SelectItem value="(-) CUSTOS VARIÁVEIS">(-) CUSTOS VARIÁVEIS</SelectItem>
                    <SelectItem value="(=) MARGEM DE CONTRIBUIÇÃO">(=) MARGEM DE CONTRIBUIÇÃO</SelectItem>
                    <SelectItem value="(-) DESPESAS FIXAS">(-) DESPESAS FIXAS</SelectItem>
                    <SelectItem value="(=) RESULTADO OPERACIONAL">(=) RESULTADO OPERACIONAL</SelectItem>
                    <SelectItem value="(+) RECEITAS NÃO OPERACIONAIS">(+) RECEITAS NÃO OPERACIONAIS</SelectItem>
                    <SelectItem value="(-) DESPESAS NÃO OPERACIONAIS">(-) DESPESAS NÃO OPERACIONAIS</SelectItem>
                    <SelectItem value="(=) RESULTADO LÍQUIDO">(=) RESULTADO LÍQUIDO</SelectItem>
                    <SelectItem value="__nova__" className="text-primary font-semibold">+ Nova categoria</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Nível</Label>
              <Select value={String(form.nivel)} onValueChange={(v) => setForm({ ...form, nivel: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Grupo principal</SelectItem>
                  <SelectItem value="2">2 - Subgrupo</SelectItem>
                  <SelectItem value="3">3 - Conta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da conta</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="grid gap-3 py-4">
              <div><span className="text-sm text-muted-foreground">Classificação:</span> <span className="font-mono font-semibold">{viewItem.classificacao}</span></div>
              <div><span className="text-sm text-muted-foreground">Nome:</span> <span className="font-semibold">{viewItem.nome}</span></div>
              <div><span className="text-sm text-muted-foreground">Movimentação:</span> {viewItem.tipo_movimentacao}</div>
              <div><span className="text-sm text-muted-foreground">Grupo do DRE:</span> {viewItem.grupo_dre}</div>
              <div><span className="text-sm text-muted-foreground">Nível:</span> {viewItem.nivel}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewItem(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta <strong>{deleteItem?.classificacao} - {deleteItem?.nome}</strong>? 
              Essa conta também será removida automaticamente do relatório DRE.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteItem) {
                  deleteMutation.mutate(deleteItem.id);
                  setDeleteItem(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
