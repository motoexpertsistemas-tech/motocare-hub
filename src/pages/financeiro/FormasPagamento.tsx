import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, CreditCard, Search, Pencil, Trash2, Loader2, Landmark, ChevronsUpDown, Check, CalendarDays, Info, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface FormaPagamento {
  id: string;
  nome: string;
  conta_bancaria: string | null;
  disponivel_pagamentos: boolean;
  disponivel_recebimentos: boolean;
  disponivel_pdv: boolean | null;
  confirmacao_automatica: string | null;
  max_parcelas: number | null;
  intervalo_parcelas_dias: number | null;
  primeira_parcela_dias: number | null;
  taxa_banco: number | null;
  taxa_operadora: number | null;
  juros_multa: number | null;
  juros_mora: number | null;
  ativo: boolean;
}

export default function FormasPagamento() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FormaPagamento | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormaPagamento | null>(null);
  const [saving, setSaving] = useState(false);
  const [contaPopoverOpen, setContaPopoverOpen] = useState(false);

  // Form state
  const [nome, setNome] = useState("");
  const [contaBancaria, setContaBancaria] = useState("");
  const [dispPagamentos, setDispPagamentos] = useState(true);
  const [dispRecebimentos, setDispRecebimentos] = useState(true);
  const [dispPdv, setDispPdv] = useState(true);
  const [confirmacaoAuto, setConfirmacaoAuto] = useState("nunca");
  const [maxParcelas, setMaxParcelas] = useState(1);
  const [intervaloParcelas, setIntervaloParcelas] = useState(30);
  const [primeiraParcela, setPrimeiraParcela] = useState(0);
  const [taxaBanco, setTaxaBanco] = useState(0);
  const [taxaOperadora, setTaxaOperadora] = useState(0);
  const [jurosMulta, setJurosMulta] = useState(0);
  const [jurosMora, setJurosMora] = useState(0);
  const [disponibilidade, setDisponibilidade] = useState("ambos");

  const { data: formas = [], isLoading } = useQuery({
    queryKey: ["formas_pagamento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formas_pagamento")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as FormaPagamento[];
    },
  });


  const { data: contasBancarias = [] } = useQuery({
    queryKey: ["contas_bancarias_lista"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contas_bancarias").select("id, nome").eq("ativo", true).order("nome");
      if (error) throw error;
      return data as { id: string; nome: string }[];
    },
  });

  const filtered = formas.filter((f) =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    (f.conta_bancaria || "").toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setNome(""); setContaBancaria(""); setDispPagamentos(true); setDispRecebimentos(true);
    setDispPdv(true); setConfirmacaoAuto("nunca"); setMaxParcelas(1); setIntervaloParcelas(30);
    setPrimeiraParcela(0); setTaxaBanco(0); setTaxaOperadora(0); setJurosMulta(0); setJurosMora(0);
    setDisponibilidade("ambos");
  };

  const openNew = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (f: FormaPagamento) => {
    setEditing(f);
    setNome(f.nome);
    setContaBancaria(f.conta_bancaria || "");
    setDispPagamentos(f.disponivel_pagamentos);
    setDispRecebimentos(f.disponivel_recebimentos);
    setDispPdv(f.disponivel_pdv ?? true);
    setConfirmacaoAuto(f.confirmacao_automatica || "nunca");
    setMaxParcelas(f.max_parcelas || 1);
    setIntervaloParcelas(f.intervalo_parcelas_dias || 30);
    setPrimeiraParcela(f.primeira_parcela_dias || 0);
    setTaxaBanco(f.taxa_banco || 0);
    setTaxaOperadora(f.taxa_operadora || 0);
    setJurosMulta(f.juros_multa || 0);
    setJurosMora(f.juros_mora || 0);
    const disp = f.disponivel_pagamentos && f.disponivel_recebimentos ? "ambos" : f.disponivel_pagamentos ? "pagamentos" : f.disponivel_recebimentos ? "recebimentos" : "ambos";
    setDisponibilidade(disp);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    const contaBancariaValue = contaBancaria.trim().toUpperCase() || null;

    if (contaBancariaValue) {
      const exists = contasBancarias.some((c) => c.nome.toUpperCase() === contaBancariaValue);
      if (!exists) {
        const { error: bankError } = await supabase.from("contas_bancarias").insert({ nome: contaBancariaValue, tipo: "corrente", ativo: true });
        if (!bankError) {
          queryClient.invalidateQueries({ queryKey: ["contas_bancarias_lista"] });
          queryClient.invalidateQueries({ queryKey: ["contas_bancarias"] });
        }
      }
    }

    const dpag = disponibilidade === "ambos" || disponibilidade === "pagamentos";
    const drec = disponibilidade === "ambos" || disponibilidade === "recebimentos";

    const payload = {
      nome: nome.trim().toUpperCase(),
      conta_bancaria: contaBancariaValue,
      disponivel_pagamentos: dpag,
      disponivel_recebimentos: drec,
      disponivel_pdv: dispPdv,
      confirmacao_automatica: confirmacaoAuto,
      max_parcelas: maxParcelas,
      intervalo_parcelas_dias: intervaloParcelas,
      primeira_parcela_dias: primeiraParcela,
      taxa_banco: taxaBanco,
      taxa_operadora: taxaOperadora,
      juros_multa: jurosMulta,
      juros_mora: jurosMora,
      atualizado_em: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase
        .from("formas_pagamento")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error("Erro: " + error.message);
      } else {
        toast.success("Forma de pagamento atualizada!");
      }
    } else {
      const { error } = await supabase
        .from("formas_pagamento")
        .insert(payload);
      if (error) {
        toast.error("Erro: " + error.message);
      } else {
        toast.success("Forma de pagamento criada!");
      }
    }
    setSaving(false);
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["formas_pagamento"] });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("formas_pagamento")
      .update({ ativo: false, atualizado_em: new Date().toISOString() })
      .eq("id", deleteTarget.id);
    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success("Forma de pagamento removida!");
      queryClient.invalidateQueries({ queryKey: ["formas_pagamento"] });
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Formas de Pagamento</h1>
          <p className="text-sm text-muted-foreground">Configure as formas de pagamento aceitas</p>
        </div>
        <Button onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary/50"
        />
      </div>

      <Card className="glass-panel">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma forma de pagamento encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Forma de pagamento</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Conta bancária</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Disponível em</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => (
                    <tr key={f.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{f.nome}</td>
                      <td className="px-4 py-3">
                        {f.conta_bancaria ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Landmark className="h-4 w-4 text-green-600" />
                            {f.conta_bancaria}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {f.disponivel_pagamentos && (
                            <Badge className="bg-orange-500/15 text-orange-600 border-orange-500/30 text-[11px]">
                              Pagamentos
                            </Badge>
                          )}
                          {f.disponivel_recebimentos && (
                            <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-[11px]">
                              Recebimentos
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(f)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => setDeleteTarget(f)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-popover border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editing ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}
            </DialogTitle>
          </DialogHeader>

          {/* Informações básicas */}
          <div className="border border-border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Informações básicas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs flex items-center gap-1">Nome *
                  <Tooltip><TooltipTrigger asChild><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent>Nome da forma de pagamento</TooltipContent></Tooltip>
                </Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: PIX - INTER" className="bg-secondary/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs flex items-center gap-1">Conta bancária
                  <Tooltip><TooltipTrigger asChild><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent>Conta de destino dos valores</TooltipContent></Tooltip>
                </Label>
                <Popover open={contaPopoverOpen} onOpenChange={setContaPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between bg-secondary/50 font-normal">
                      {contaBancaria || "Selecione ou digite..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 z-[60]" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar ou criar conta..." onValueChange={(v) => setContaBancaria(v)} />
                      <CommandList>
                        <CommandEmpty>
                          <button className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded cursor-pointer" onClick={() => { setContaBancaria(contaBancaria.toUpperCase()); setContaPopoverOpen(false); }}>
                            + Criar "{contaBancaria.toUpperCase()}"
                          </button>
                        </CommandEmpty>
                        <CommandGroup heading="Contas cadastradas">
                          {contasBancarias.map((c) => (
                            <CommandItem key={c.id} value={c.nome} onSelect={(v) => { setContaBancaria(v.toUpperCase()); setContaPopoverOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", contaBancaria === c.nome ? "opacity-100" : "opacity-0")} />
                              {c.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs flex items-center gap-1">Disponível em *
                  <Tooltip><TooltipTrigger asChild><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent>Onde esta forma será usada</TooltipContent></Tooltip>
                </Label>
                <Select value={disponibilidade} onValueChange={setDisponibilidade}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambos">Contas a pagar e receber</SelectItem>
                    <SelectItem value="pagamentos">Somente pagamentos</SelectItem>
                    <SelectItem value="recebimentos">Somente recebimentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs flex items-center gap-1">Confirmação automática *
                  <Tooltip><TooltipTrigger asChild><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent>Quando confirmar o lançamento automaticamente</TooltipContent></Tooltip>
                </Label>
                <Select value={confirmacaoAuto} onValueChange={setConfirmacaoAuto}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nunca">Nunca confirmar automático</SelectItem>
                    <SelectItem value="sempre">Sempre confirmar</SelectItem>
                    <SelectItem value="vencimento">No vencimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Label className="text-muted-foreground text-xs">Disponível no PDV</Label>
              <Switch checked={dispPdv} onCheckedChange={setDispPdv} />
            </div>
          </div>

          {/* Parcelamento */}
          <div className="border border-border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> Parcelamento</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs flex items-center gap-1">Nº máximo de parcelas *
                  <Tooltip><TooltipTrigger asChild><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent>Quantidade máxima de parcelas</TooltipContent></Tooltip>
                </Label>
                <Input type="number" min={1} value={maxParcelas} onChange={(e) => setMaxParcelas(Number(e.target.value) || 1)} className="bg-secondary/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs flex items-center gap-1">Intervalo parcelas <span className="text-[10px]">(dias)</span>
                  <Tooltip><TooltipTrigger asChild><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent>Dias entre cada parcela</TooltipContent></Tooltip>
                </Label>
                <Input type="number" min={0} value={intervaloParcelas} onChange={(e) => setIntervaloParcelas(Number(e.target.value) || 0)} className="bg-secondary/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs flex items-center gap-1">1ª parcela <span className="text-[10px]">(dias)</span>
                  <Tooltip><TooltipTrigger asChild><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent>Dias para a 1ª parcela</TooltipContent></Tooltip>
                </Label>
                <Input type="number" min={0} value={primeiraParcela} onChange={(e) => setPrimeiraParcela(Number(e.target.value) || 0)} className="bg-secondary/50" />
              </div>
            </div>
          </div>

          {/* Taxas e Juros */}
          <div className="border border-border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Taxas e Juros</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Taxa banco (%)</Label>
                <Input type="number" step="0.01" min={0} value={taxaBanco} onChange={(e) => setTaxaBanco(Number(e.target.value) || 0)} className="bg-secondary/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Taxa operadora (%)</Label>
                <Input type="number" step="0.01" min={0} value={taxaOperadora} onChange={(e) => setTaxaOperadora(Number(e.target.value) || 0)} className="bg-secondary/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Juros multa (%)</Label>
                <Input type="number" step="0.01" min={0} value={jurosMulta} onChange={(e) => setJurosMulta(Number(e.target.value) || 0)} className="bg-secondary/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Juros mora (%)</Label>
                <Input type="number" step="0.01" min={0} value={jurosMora} onChange={(e) => setJurosMora(Number(e.target.value) || 0)} className="bg-secondary/50" />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir forma de pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover "{deleteTarget?.nome}"? Esta ação pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
