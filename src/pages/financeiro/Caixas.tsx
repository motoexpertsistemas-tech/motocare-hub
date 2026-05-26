import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRLInput } from "@/components/BRLInput";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Monitor, Plus, Search, Printer, Power, Eye, ChevronDown, ArrowDownCircle, ArrowUpCircle, DollarSign, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { printCaixa } from "@/lib/printCaixa";

interface Caixa {
  id: string;
  funcionario: string;
  aberto_em: string;
  fechado_em: string | null;
  saldo_abertura: number;
  saldo_fechamento: number | null;
  saldo: number;
  loja: string;
  status: string;
  observacoes: string | null;
}

interface Movimentacao {
  id: string;
  caixa_id: string;
  tipo: string;
  valor: number;
  observacoes: string | null;
  criado_em: string;
}

export default function Caixas() {
  const qc = useQueryClient();
  const [abrirOpen, setAbrirOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [movOpen, setMovOpen] = useState<{ caixaId: string; tipo: "sangria" | "reforco" } | null>(null);
  const [caixaSelecionado, setCaixaSelecionado] = useState<Caixa | null>(null);
  const [saving, setSaving] = useState(false);

  // Form abrir caixa
  const [funcionario, setFuncionario] = useState("GERENCIAL");
  const [saldoAbertura, setSaldoAbertura] = useState(0);
  const [loja, setLoja] = useState("LOJA PRINCIPAL");

  // Form movimentação
  const [movValor, setMovValor] = useState(0);
  const [movObs, setMovObs] = useState("");

  const { data: caixas = [], isLoading } = useQuery({
    queryKey: ["caixas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("caixas").select("*").order("aberto_em", { ascending: false });
      if (error) throw error;
      return data as Caixa[];
    },
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ["caixa_movimentacoes", caixaSelecionado?.id],
    enabled: !!caixaSelecionado,
    queryFn: async () => {
      const { data, error } = await supabase.from("caixa_movimentacoes").select("*").eq("caixa_id", caixaSelecionado!.id).order("criado_em", { ascending: false });
      if (error) throw error;
      return data as Movimentacao[];
    },
  });

  const handleAbrir = async () => {
    if (!funcionario.trim()) { toast.error("Informe o funcionário"); return; }
    setSaving(true);
    const { error } = await supabase.from("caixas").insert({
      funcionario: funcionario.trim().toUpperCase(),
      saldo_abertura: saldoAbertura,
      saldo: saldoAbertura,
      loja: loja.trim().toUpperCase(),
      status: "aberto",
    });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Caixa aberto!");
    qc.invalidateQueries({ queryKey: ["caixas"] });
    setAbrirOpen(false);
    setFuncionario("GERENCIAL");
    setSaldoAbertura(0);
  };

  const handleFechar = async (caixa: Caixa) => {
    const { error } = await supabase.from("caixas").update({
      status: "fechado",
      fechado_em: new Date().toISOString(),
      saldo_fechamento: caixa.saldo,
    }).eq("id", caixa.id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Caixa fechado!");
    qc.invalidateQueries({ queryKey: ["caixas"] });
  };

  const handleMovimentacao = async () => {
    if (!movOpen || movValor <= 0) { toast.error("Valor inválido"); return; }
    setSaving(true);
    const { error: movErr } = await supabase.from("caixa_movimentacoes").insert({
      caixa_id: movOpen.caixaId,
      tipo: movOpen.tipo,
      valor: movValor,
      observacoes: movObs || null,
    });
    if (movErr) { toast.error("Erro: " + movErr.message); setSaving(false); return; }

    const caixa = caixas.find((c) => c.id === movOpen.caixaId);
    if (caixa) {
      const novoSaldo = movOpen.tipo === "sangria" ? caixa.saldo - movValor : caixa.saldo + movValor;
      await supabase.from("caixas").update({ saldo: novoSaldo }).eq("id", movOpen.caixaId);
    }

    setSaving(false);
    toast.success(movOpen.tipo === "sangria" ? "Sangria realizada!" : "Reforço realizado!");
    qc.invalidateQueries({ queryKey: ["caixas"] });
    qc.invalidateQueries({ queryKey: ["caixa_movimentacoes"] });
    setMovOpen(null);
    setMovValor(0);
    setMovObs("");
  };

  const openDetalhes = (caixa: Caixa) => {
    setCaixaSelecionado(caixa);
    setDetalhesOpen(true);
  };

  const fmt = (d: string) => {
    try { return format(new Date(d), "dd/MM/yyyy HH:mm:ss"); } catch { return d; }
  };

  const fmtMoney = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Monitor className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Caixas</h1>
            <p className="text-sm text-muted-foreground">Gerencie abertura, fechamento e movimentações de caixa</p>
          </div>
        </div>
        <Button onClick={() => setAbrirOpen(true)} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
          <Plus className="h-4 w-4" /> Abrir caixa
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : caixas.length === 0 ? (
        <Card className="glass-panel">
          <CardContent className="p-6 text-center text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum caixa registrado</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-panel">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Aberto em</TableHead>
                  <TableHead>Fechado em</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {caixas.map((c) => (
                  <TableRow key={c.id} className={c.status === "aberto" ? "bg-green-500/5" : ""}>
                    <TableCell className="font-medium">{c.funcionario}</TableCell>
                    <TableCell>{fmt(c.aberto_em)}</TableCell>
                    <TableCell>{c.fechado_em ? fmt(c.fechado_em) : <span className="text-muted-foreground">------</span>}</TableCell>
                    <TableCell className="text-right font-mono">{fmtMoney(c.saldo)}</TableCell>
                    <TableCell>{c.loja}</TableCell>
                    <TableCell>
                      {c.status === "aberto" ? (
                        <Badge className="bg-green-600/20 text-green-500 border-green-600/30">Aberto</Badge>
                      ) : (
                        <Badge variant="secondary">Fechado</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:bg-blue-500/10" title="Detalhes" onClick={() => openDetalhes(c)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-500/10" title="Imprimir" onClick={async () => {
                          const { data: movs } = await supabase.from("caixa_movimentacoes").select("*").eq("caixa_id", c.id).order("criado_em", { ascending: false });
                          await printCaixa(c, movs || []);
                        }}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        {c.status === "aberto" && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-500/10" title="Fechar caixa" onClick={() => handleFechar(c)}>
                            <Power className="h-4 w-4" />
                          </Button>
                        )}
                        {c.status === "aberto" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" title="Mais ações">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border z-50">
                              <DropdownMenuItem onClick={() => handleFechar(c)}>
                                <Power className="h-4 w-4 mr-2" /> Fechar o caixa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setMovOpen({ caixaId: c.id, tipo: "sangria" }); setMovValor(0); setMovObs(""); }}>
                                <ArrowDownCircle className="h-4 w-4 mr-2" /> Realizar sangria
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setMovOpen({ caixaId: c.id, tipo: "reforco" }); setMovValor(0); setMovObs(""); }}>
                                <ArrowUpCircle className="h-4 w-4 mr-2" /> Realizar reforço
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDetalhes(c)}>
                                <DollarSign className="h-4 w-4 mr-2" /> Ver no financeiro
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog Abrir Caixa */}
      <Dialog open={abrirOpen} onOpenChange={setAbrirOpen}>
        <DialogContent className="sm:max-w-md bg-popover border-border">
          <DialogHeader>
            <DialogTitle>Abrir Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Funcionário *</Label>
              <Input value={funcionario} onChange={(e) => setFuncionario(e.target.value)} placeholder="GERENCIAL" className="bg-secondary/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Loja</Label>
              <Input value={loja} onChange={(e) => setLoja(e.target.value)} placeholder="LOJA PRINCIPAL" className="bg-secondary/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Saldo de abertura (R$)</Label>
              <Input type="number" step="0.01" min={0} value={saldoAbertura} onChange={(e) => setSaldoAbertura(parseFloat(e.target.value) || 0)} className="bg-secondary/50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbrirOpen(false)}>Cancelar</Button>
            <Button onClick={handleAbrir} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
              {saving ? "Abrindo..." : "Abrir Caixa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Sangria / Reforço */}
      <Dialog open={!!movOpen} onOpenChange={(o) => !o && setMovOpen(null)}>
        <DialogContent className="sm:max-w-sm bg-popover border-border">
          <DialogHeader>
            <DialogTitle>{movOpen?.tipo === "sangria" ? "Realizar Sangria" : "Realizar Reforço"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Valor (R$) *</Label>
              <BRLInput value={movValor} onChange={(v) => setMovValor(parseFloat(v) || 0)} prefix="R$" className="bg-secondary/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <Input value={movObs} onChange={(e) => setMovObs(e.target.value)} placeholder="Motivo..." className="bg-secondary/50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovOpen(null)}>Cancelar</Button>
            <Button onClick={handleMovimentacao} disabled={saving}>
              {saving ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes / Relatório do Caixa */}
      <Dialog open={detalhesOpen} onOpenChange={(o) => { if (!o) { setDetalhesOpen(false); setCaixaSelecionado(null); } }}>
        <DialogContent className="sm:max-w-lg bg-popover border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Relatório do Caixa</DialogTitle>
          </DialogHeader>
          {caixaSelecionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Funcionário</span>
                  <p className="font-medium">{caixaSelecionado.funcionario}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Status</span>
                  <p>{caixaSelecionado.status === "aberto" ? <Badge className="bg-green-600/20 text-green-500 border-green-600/30">Aberto</Badge> : <Badge variant="secondary">Fechado</Badge>}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Aberto em</span>
                  <p className="font-medium">{fmt(caixaSelecionado.aberto_em)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Fechado em</span>
                  <p className="font-medium">{caixaSelecionado.fechado_em ? fmt(caixaSelecionado.fechado_em) : "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Saldo abertura</span>
                  <p className="font-medium font-mono">R$ {fmtMoney(caixaSelecionado.saldo_abertura)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Saldo atual</span>
                  <p className="font-bold text-primary font-mono text-lg">R$ {fmtMoney(caixaSelecionado.saldo)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">Loja</span>
                  <p className="font-medium">{caixaSelecionado.loja}</p>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <h4 className="text-sm font-semibold mb-2">Movimentações</h4>
                {movimentacoes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3">Nenhuma movimentação</p>
                ) : (
                  <div className="space-y-2">
                    {movimentacoes.map((m) => (
                      <div key={m.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
                        <div className="flex items-center gap-2">
                          {m.tipo === "sangria" ? (
                            <ArrowDownCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <ArrowUpCircle className="h-4 w-4 text-green-500" />
                          )}
                          <div>
                            <span className="font-medium capitalize">{m.tipo === "reforco" ? "Reforço" : "Sangria"}</span>
                            {m.observacoes && <p className="text-xs text-muted-foreground">{m.observacoes}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-medium ${m.tipo === "sangria" ? "text-red-500" : "text-green-500"}`}>
                            {m.tipo === "sangria" ? "-" : "+"}R$ {fmtMoney(m.valor)}
                          </span>
                          <p className="text-[10px] text-muted-foreground">{fmt(m.criado_em)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
