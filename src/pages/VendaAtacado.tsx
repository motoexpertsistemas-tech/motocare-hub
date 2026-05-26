import { useState, useEffect } from "react";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Settings, RotateCcw, Download, Layers, Eye, Edit, Trash2, ArrowRightLeft, Link2, Printer, Share2, FileText, RefreshCw, DollarSign, Gift, Mail, MessageCircle, PenTool, CreditCard, Banknote, QrCode, Receipt, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { printCupom, printA4, printCupomPresente } from "@/lib/printVenda";
import { useQuery } from "@tanstack/react-query";

type Venda = {
  id: string;
  numero: number;
  cliente: string;
  data: string;
  situacao: string;
  valor: number;
  vendedor: string;
  historico: { data: string; observacao: string; situacao: string; funcionario: string }[];
};

const situacaoColors: Record<string, string> = {
  "Em andamento": "bg-amber-500 text-white",
  "Aguardando": "bg-blue-500 text-white",
  "Concretizada": "bg-green-600 text-white",
  "Cancelada": "bg-destructive text-destructive-foreground",
};

const STORAGE_KEY = "vendas_atacado";

function loadVendasFromStorage(): Venda[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return stored.map((v: any) => ({
      id: v.id,
      numero: v.numero,
      cliente: v.cliente,
      data: v.data,
      situacao: v.situacao,
      valor: v.valor,
      vendedor: v.vendedor,
      historico: v.historico || [],
    }));
  } catch { return []; }
}

export default function VendaAtacado() {
  const navigate = useNavigate();
  const role = useRole();
  const podeConcretizar = role === "ADMIN" || role === "GERENTE";
  const [vendas, setVendas] = useState<Venda[]>(loadVendasFromStorage);
  const [searchTerm, setSearchTerm] = useState("");
  const [situacaoDialog, setSituacaoDialog] = useState<Venda | null>(null);
  const [novaSituacao, setNovaSituacao] = useState("Em andamento");
  const [observacaoSituacao, setObservacaoSituacao] = useState("");

  const [pagamentoStep, setPagamentoStep] = useState<"buttons" | "pix" | "cartao" | "outras" | null>(null);
  const [contaSelecionada, setContaSelecionada] = useState("");
  const [maquinaSelecionada, setMaquinaSelecionada] = useState("");
  const [parcelas, setParcelas] = useState("1");
  const [outraFormaSelecionada, setOutraFormaSelecionada] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vendas));
  }, [vendas]);

  const { data: contasBancarias = [] } = useQuery({
    queryKey: ["contas_bancarias_ativas_atacado"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contas_bancarias").select("*").eq("ativo", true).order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: formasPagamento = [] } = useQuery({
    queryKey: ["formas_pagamento_ativas_atacado"],
    queryFn: async () => {
      const { data, error } = await supabase.from("formas_pagamento").select("*").eq("ativo", true).order("nome");
      if (error) throw error;
      return data;
    },
  });

  const filtered = vendas.filter(
    (v) =>
      v.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(v.numero).includes(searchTerm)
  );

  const toVendaData = (v: Venda) => ({
    numero: v.numero,
    data: v.data,
    hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    cliente: v.cliente,
    itens: [{ codigo: "---", nome: "Produto da venda", quantidade: 1, valor_unitario: v.valor, desconto: 0, subtotal: v.valor }],
    total: v.valor,
    forma_pagamento: "A definir",
    vendedor: v.vendedor,
  });

  useEffect(() => {
    if (novaSituacao === "Concretizada") {
      setPagamentoStep("buttons");
    } else {
      setPagamentoStep(null);
    }
  }, [novaSituacao]);

  const resetPagamentoState = () => {
    setPagamentoStep(null);
    setContaSelecionada("");
    setMaquinaSelecionada("");
    setParcelas("1");
    setOutraFormaSelecionada("");
  };

  const finalizarVenda = async (formaPagamento: string, detalhes: string) => {
    if (!situacaoDialog) return;
    setSaving(true);

    const { data: caixaAberto } = await supabase
      .from("caixas")
      .select("*")
      .eq("status", "aberto")
      .limit(1)
      .maybeSingle();

    if (!caixaAberto) {
      toast.error("Nenhum caixa aberto! Abra um caixa antes de concretizar a venda.");
      setSaving(false);
      return;
    }

    const novoSaldo = caixaAberto.saldo + situacaoDialog.valor;
    await supabase.from("caixas").update({ saldo: novoSaldo }).eq("id", caixaAberto.id);

    await supabase.from("caixa_movimentacoes").insert({
      caixa_id: caixaAberto.id,
      tipo: "venda_atacado",
      valor: situacaoDialog.valor,
      observacoes: `Venda Atacado #${situacaoDialog.numero} - ${formaPagamento}${detalhes ? ` (${detalhes})` : ""}`,
    });

    setVendas((prev) =>
      prev.map((v) =>
        v.id === situacaoDialog.id
          ? {
              ...v,
              situacao: "Concretizada",
              historico: [
                { data: new Date().toLocaleString("pt-BR"), observacao: `${formaPagamento}${detalhes ? ` - ${detalhes}` : ""}`, situacao: "Concretizada", funcionario: "Vendedor Padrão" },
                ...v.historico,
              ],
            }
          : v
      )
    );

    toast.success(`Venda atacado concretizada via ${formaPagamento}! R$ ${situacaoDialog.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} adicionado ao caixa.`);
    setSaving(false);
    setSituacaoDialog(null);
    setObservacaoSituacao("");
    resetPagamentoState();
  };

  const handleAlterarSituacao = async () => {
    if (!situacaoDialog) return;

    if (novaSituacao === "Concretizada") return;

    setVendas((prev) =>
      prev.map((v) =>
        v.id === situacaoDialog.id
          ? {
              ...v,
              situacao: novaSituacao,
              historico: [
                { data: new Date().toLocaleString("pt-BR"), observacao: observacaoSituacao || "Alteração de situação", situacao: novaSituacao, funcionario: "Vendedor Padrão" },
                ...v.historico,
              ],
            }
          : v
      )
    );
    toast.success("Situação alterada com sucesso.");
    setSituacaoDialog(null);
    setObservacaoSituacao("");
    resetPagamentoState();
  };

  const handleExcluir = (id: string) => {
    setVendas((prev) => prev.filter((v) => v.id !== id));
    toast.success("Venda excluída.");
  };

  const outrasFormas = formasPagamento.filter((f) => {
    const nome = f.nome.toUpperCase();
    return !nome.includes("PIX") && !nome.includes("CARTAO") && !nome.includes("CARTÃO") && !nome.includes("DINHEIRO") && !nome.includes("BOLETO");
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Venda Atacado</h1>
          <p className="text-sm text-muted-foreground">Vendas para clientes parceiros cadastrados (B2B)</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => navigate("/venda-atacado/vender")}>
            <Plus className="h-4 w-4 mr-1" /> Nova Venda Atacado
          </Button>
          <Button variant="outline" onClick={() => navigate("/pdv/precos")} className="gap-1.5">
            <Search className="h-4 w-4" /> Pesquisa de Preços
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="gap-1.5">
                <Settings className="h-4 w-4" /> Mais ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => navigate("/financeiro/caixas")}>
                <DollarSign className="h-4 w-4 mr-2" /> Caixas
              </DropdownMenuItem>
              <DropdownMenuItem><RotateCcw className="h-4 w-4 mr-2" /> Devoluções</DropdownMenuItem>
              <DropdownMenuItem><Download className="h-4 w-4 mr-2" /> Exportar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por cliente ou nº..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-[200px] h-9" />
          </div>
        </div>
      </div>

      <Card className="glass-panel">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Nº</TableHead>
                <TableHead>Cliente Parceiro</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma venda atacado encontrada</TableCell>
                </TableRow>
              )}
              {filtered.map((venda) => (
                <TableRow key={venda.id}>
                  <TableCell className="font-mono text-sm">{venda.numero}</TableCell>
                  <TableCell className="font-medium">{venda.cliente}</TableCell>
                  <TableCell>{venda.data}</TableCell>
                  <TableCell>
                    <Badge className={`cursor-pointer ${situacaoColors[venda.situacao] || "bg-muted text-muted-foreground"}`} onClick={() => { setSituacaoDialog(venda); setNovaSituacao(venda.situacao); }}>
                      {venda.situacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{venda.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-500/10" title="Verificar nota"><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:bg-amber-500/10" title="Editar venda"><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="Excluir venda" onClick={() => handleExcluir(venda.id)}><Trash2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600 hover:bg-orange-500/10" title="Alterar situação" onClick={() => { setSituacaoDialog(venda); setNovaSituacao(venda.situacao); }}><ArrowRightLeft className="h-4 w-4" /></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-500/10"><Plus className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem><Link2 className="h-4 w-4 mr-2" /> Link de cobrança</DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger><Printer className="h-4 w-4 mr-2" /> Imprimir</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => printA4(toVendaData(venda))}>Formato A4</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => printCupom(toVendaData(venda))}>Cupom</DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuItem onClick={() => { setSituacaoDialog(venda); setNovaSituacao(venda.situacao); }}><ArrowRightLeft className="h-4 w-4 mr-2" /> Alterar situação</DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger><Share2 className="h-4 w-4 mr-2" /> Compartilhar</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem><Mail className="h-4 w-4 mr-2" /> Via E-mail</DropdownMenuItem>
                                <DropdownMenuItem><MessageCircle className="h-4 w-4 mr-2" /> Via WhatsApp</DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger><FileText className="h-4 w-4 mr-2" /> Emitir</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem>NF-e</DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuItem onClick={() => navigate("/financeiro")}><DollarSign className="h-4 w-4 mr-2" /> Ver no financeiro</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-2 text-xs text-muted-foreground border-t">Mostrando {filtered.length} registro(s)</div>
        </CardContent>
      </Card>

      {/* Alterar situação Dialog - same as VendasBalcao */}
      <Dialog open={!!situacaoDialog} onOpenChange={(open) => { if (!open) { setSituacaoDialog(null); resetPagamentoState(); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Alterar situação</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Situação*</label>
              <Select value={novaSituacao} onValueChange={(val) => {
                if (val === "Concretizada" && !podeConcretizar) {
                  toast.error("Somente Admin/Gerente pode concretizar vendas.");
                  return;
                }
                setNovaSituacao(val);
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Aguardando">Aguardando</SelectItem>
                  {podeConcretizar && <SelectItem value="Concretizada">Concretizada</SelectItem>}
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Observação</label>
              <Input value={observacaoSituacao} onChange={(e) => setObservacaoSituacao(e.target.value)} />
            </div>
          </div>

          {novaSituacao === "Concretizada" && pagamentoStep === "buttons" && (
            <div className="space-y-3 pt-2">
              <Separator />
              <div>
                <Label className="text-sm font-semibold">Forma de pagamento</Label>
                {situacaoDialog && (
                  <p className="text-xs text-muted-foreground">Valor: <span className="font-mono font-bold text-foreground">R$ {situacaoDialog.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-14 flex flex-col gap-1 hover:border-primary/40" onClick={() => setPagamentoStep("pix")}>
                  <QrCode className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">Pix</span>
                </Button>
                <Button variant="outline" className="h-14 flex flex-col gap-1 hover:border-primary/40" onClick={() => setPagamentoStep("cartao")}>
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">Cartão</span>
                </Button>
                <Button variant="outline" className="h-14 flex flex-col gap-1 hover:border-primary/40" onClick={() => finalizarVenda("DINHEIRO", "")}>
                  <Banknote className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">Dinheiro</span>
                </Button>
                <Button variant="outline" className="h-14 flex flex-col gap-1 hover:border-primary/40" onClick={() => finalizarVenda("BOLETO", "")}>
                  <Receipt className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">Boleto</span>
                </Button>
              </div>
              {outrasFormas.length > 0 && (
                <Button variant="outline" className="w-full h-10 gap-2 hover:border-primary/40" onClick={() => setPagamentoStep("outras")}>
                  <MoreHorizontal className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Outras formas</span>
                </Button>
              )}
            </div>
          )}

          {novaSituacao === "Concretizada" && pagamentoStep === "pix" && (
            <div className="space-y-3 pt-2">
              <Separator />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setPagamentoStep("buttons")}>← Voltar</Button>
                <Label className="text-sm font-semibold">PIX - Selecione a conta</Label>
              </div>
              <Select value={contaSelecionada} onValueChange={setContaSelecionada}>
                <SelectTrigger><SelectValue placeholder="Selecione a conta..." /></SelectTrigger>
                <SelectContent>
                  {contasBancarias.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}{c.banco ? ` - ${c.banco}` : ""}</SelectItem>
                  ))}
                  {formasPagamento.filter(f => f.nome.toUpperCase().includes("PIX")).map((f) => (
                    <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!contaSelecionada || saving} onClick={() => finalizarVenda("PIX", contaSelecionada)}>
                {saving ? "Finalizando..." : "Finalizar Venda"}
              </Button>
            </div>
          )}

          {novaSituacao === "Concretizada" && pagamentoStep === "cartao" && (
            <div className="space-y-3 pt-2">
              <Separator />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setPagamentoStep("buttons")}>← Voltar</Button>
                <Label className="text-sm font-semibold">Cartão - Forma de Pagamento</Label>
              </div>
              <Select value={maquinaSelecionada} onValueChange={setMaquinaSelecionada}>
                <SelectTrigger className="border-2"><SelectValue placeholder="Selecione a máquina / banco..." /></SelectTrigger>
                <SelectContent>
                  {formasPagamento.filter(f => {
                    const n = f.nome.toUpperCase();
                    return n.includes("CARTAO") || n.includes("CARTÃO") || n.includes("CREDITO") || n.includes("CRÉDITO") || n.includes("DEBITO") || n.includes("DÉBITO");
                  }).map((f) => (
                    <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                  ))}
                  {contasBancarias.map((c) => (
                    <SelectItem key={`cb-${c.id}`} value={c.nome}>{c.nome}{c.banco ? ` - ${c.banco}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => (
                  <Button
                    key={n}
                    size="sm"
                    variant={parcelas === String(n) ? "default" : "outline"}
                    className={`min-w-[48px] font-bold ${parcelas === String(n) ? "bg-primary text-primary-foreground" : "hover:border-primary"}`}
                    onClick={() => setParcelas(String(n))}
                  >
                    {n}x
                  </Button>
                ))}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">TOTAL A PAGAR</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 border rounded-md px-3 py-2 text-sm text-muted-foreground bg-secondary/30">
                    {Number(parcelas) > 1 && situacaoDialog
                      ? `${parcelas}x de R$ ${(situacaoDialog.valor / Number(parcelas)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : "à vista"
                    }
                  </div>
                  <span className="font-mono font-bold text-lg">
                    {situacaoDialog ? situacaoDialog.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}
                  </span>
                  <Button className="bg-primary text-primary-foreground font-bold" disabled={!maquinaSelecionada || saving} onClick={() => finalizarVenda("CARTÃO", `${maquinaSelecionada} - ${parcelas}x`)}>
                    {saving ? "..." : "» CONFIRMAR"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {novaSituacao === "Concretizada" && pagamentoStep === "outras" && (
            <div className="space-y-3 pt-2">
              <Separator />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setPagamentoStep("buttons")}>← Voltar</Button>
                <Label className="text-sm font-semibold">Outras formas de pagamento</Label>
              </div>
              <Select value={outraFormaSelecionada} onValueChange={setOutraFormaSelecionada}>
                <SelectTrigger><SelectValue placeholder="Selecione a forma..." /></SelectTrigger>
                <SelectContent>
                  {outrasFormas.map((f) => (
                    <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!outraFormaSelecionada || saving} onClick={() => finalizarVenda(outraFormaSelecionada, "")}>
                {saving ? "Finalizando..." : "Finalizar Venda"}
              </Button>
            </div>
          )}

          {novaSituacao !== "Concretizada" && (
            <DialogFooter className="justify-start gap-2">
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAlterarSituacao}>✔ Alterar</Button>
              <Button variant="destructive" onClick={() => { setSituacaoDialog(null); resetPagamentoState(); }}>✖ Cancelar</Button>
            </DialogFooter>
          )}

          {novaSituacao === "Concretizada" && pagamentoStep === "buttons" && (
            <DialogFooter className="justify-start">
              <Button variant="destructive" onClick={() => { setSituacaoDialog(null); resetPagamentoState(); }}>✖ Cancelar</Button>
            </DialogFooter>
          )}

          {situacaoDialog && situacaoDialog.historico.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Histórico de situações</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead>Funcionário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {situacaoDialog.historico.map((h, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{h.data}</TableCell>
                        <TableCell className="text-xs">{h.observacao}</TableCell>
                        <TableCell><Badge className={situacaoColors[h.situacao] || "bg-muted"}>{h.situacao}</Badge></TableCell>
                        <TableCell className="text-xs">{h.funcionario}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
