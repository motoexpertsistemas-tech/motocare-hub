import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Pencil, Trash2, Building2, CheckCircle2, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ContaBancaria {
  id: string;
  nome: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  tipo: string | null;
  saldo_inicial: number | null;
  ativo: boolean | null;
}

const initialForm = { nome: "", banco: "", agencia: "", conta: "", tipo: "corrente", saldo_inicial: 0, ativo: true };

export default function ContasBancarias() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContaBancaria | null>(null);
  const [form, setForm] = useState(initialForm);

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ["contas_bancarias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contas_bancarias").select("*").order("nome");
      if (error) throw error;
      return data as ContaBancaria[];
    },
  });

  const { data: formasPgto = [] } = useQuery({
    queryKey: ["formas_pagamento_vinculo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("formas_pagamento").select("id, nome, conta_bancaria").eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { nome: form.nome, banco: form.banco || null, agencia: form.agencia || null, conta: form.conta || null, tipo: form.tipo, saldo_inicial: form.saldo_inicial, ativo: form.ativo };
      if (editing) {
        const { error } = await supabase.from("contas_bancarias").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contas_bancarias").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contas_bancarias"] });
      toast.success(editing ? "Conta atualizada!" : "Conta cadastrada!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar conta"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contas_bancarias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contas_bancarias"] });
      toast.success("Conta removida!");
    },
  });

  const openEdit = (c: ContaBancaria) => {
    setEditing(c);
    setForm({ nome: c.nome, banco: c.banco || "", agencia: c.agencia || "", conta: c.conta || "", tipo: c.tipo || "corrente", saldo_inicial: c.saldo_inicial || 0, ativo: c.ativo ?? true });
    setOpen(true);
  };

  const closeDialog = () => { setOpen(false); setEditing(null); setForm(initialForm); };

  const formasVinculadas = (contaNome: string) =>
    formasPgto.filter((f) => f.conta_bancaria === contaNome).map((f) => f.nome);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contas Bancárias</h1>
          <p className="text-sm text-muted-foreground">Cadastre e gerencie suas contas bancárias</p>
        </div>
        <Button className="gradient-primary text-primary-foreground" onClick={() => { setForm(initialForm); setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nova Conta
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Carregando...</p>
      ) : contas.length === 0 ? (
        <Card className="glass-panel">
          <CardContent className="p-6 text-center text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma conta bancária cadastrada</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-panel">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Agência</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Saldo Inicial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Formas de Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.map((c) => {
                  const vinculadas = formasVinculadas(c.nome);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" /> {c.nome}
                      </TableCell>
                      <TableCell>{c.banco || "—"}</TableCell>
                      <TableCell>{c.agencia || "—"}</TableCell>
                      <TableCell>{c.conta || "—"}</TableCell>
                      <TableCell className="capitalize">{c.tipo || "corrente"}</TableCell>
                      <TableCell>R$ {(c.saldo_inicial || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {c.ativo ? (
                          <Badge variant="default" className="bg-green-600/20 text-green-400 border-green-600/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Ativa
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" /> Inativa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {vinculadas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {vinculadas.map((n) => (
                              <Badge key={n} variant="outline" className="text-[10px]">{n}</Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Nenhuma</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Conta" : "Nova Conta Bancária"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Conta Inter PJ" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Banco</Label>
                <Input value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })} placeholder="Ex: Inter" />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                    <SelectItem value="pagamento">Pagamento</SelectItem>
                    <SelectItem value="caixa">Caixa Interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Agência</Label>
                <Input value={form.agencia} onChange={(e) => setForm({ ...form, agencia: e.target.value })} placeholder="0001" />
              </div>
              <div className="space-y-1">
                <Label>Conta</Label>
                <Input value={form.conta} onChange={(e) => setForm({ ...form, conta: e.target.value })} placeholder="12345-6" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Saldo Inicial (R$)</Label>
              <Input type="number" step="0.01" value={form.saldo_inicial} onChange={(e) => setForm({ ...form, saldo_inicial: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
              <Label>Conta ativa</Label>
            </div>
            <Button className="w-full gradient-primary text-primary-foreground" disabled={!form.nome || save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? "Salvando..." : editing ? "Salvar Alterações" : "Cadastrar Conta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
