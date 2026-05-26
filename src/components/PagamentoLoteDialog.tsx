import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormaPagamentoCombobox } from "@/components/FormaPagamentoCombobox";
import { ContaBancariaCombobox } from "@/components/ContaBancariaCombobox";
import { FornecedorCombobox } from "@/components/FornecedorCombobox";
import { Search, Users, User, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { printRecibo } from "@/lib/printRecibo";

interface ContaPagar {
  id: string;
  numero: number;
  descricao: string;
  entidade: string;
  pagamento: string;
  contaBancaria: string;
  data: string;
  situacao: string;
  valor: number;
}

interface FormaPgto {
  id: number;
  forma: string;
  conta: string;
  valor: string;
  parcelas: string;
}

interface PagamentoLoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contas: ContaPagar[];
  onConfirmar: (ids: string[], formaPagamento: string, contaBancaria: string, dataPagamento: string) => void;
}

let nextFormaId = 1;

export function PagamentoLoteDialog({ open, onOpenChange, contas, onConfirmar }: PagamentoLoteDialogProps) {
  const [tab, setTab] = useState("fornecedor");
  const [fornecedorBusca, setFornecedorBusca] = useState("");
  const [buscaTexto, setBuscaTexto] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 10));
  const [juros, setJuros] = useState("");
  const [desconto, setDesconto] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [formas, setFormas] = useState<FormaPgto[]>([
    { id: nextFormaId++, forma: "", conta: "", valor: "", parcelas: "1" }
  ]);

  const pendentes = contas.filter(c => c.situacao !== "Confirmado" && c.situacao !== "Pago");

  const filtradas = tab === "fornecedor"
    ? pendentes.filter(c => fornecedorBusca && c.entidade.toLowerCase().includes(fornecedorBusca.toLowerCase()))
    : pendentes.filter(c => {
        if (!buscaTexto) return true;
        const q = buscaTexto.toLowerCase();
        return c.numero.toString().includes(q) || c.descricao.toLowerCase().includes(q) || c.entidade.toLowerCase().includes(q);
      });

  const toggleId = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === filtradas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtradas.map(c => c.id));
    }
  };

  const totalSelecionado = filtradas.filter(c => selectedIds.includes(c.id)).reduce((s, c) => s + c.valor, 0);
  const jurosNum = parseFloat(juros) || 0;
  const descontoNum = parseFloat(desconto) || 0;
  const totalFinal = totalSelecionado + jurosNum - descontoNum;

  const totalFormas = formas.reduce((s, f) => s + (parseFloat(f.valor) || 0), 0);
  const restante = totalFinal - totalFormas;

  const addForma = () => {
    setFormas(prev => [...prev, { id: nextFormaId++, forma: "", conta: "", valor: restante > 0 ? restante.toFixed(2) : "", parcelas: "1" }]);
  };

  const removeForma = (id: number) => {
    if (formas.length <= 1) return;
    setFormas(prev => prev.filter(f => f.id !== id));
  };

  const updateForma = (id: number, field: keyof FormaPgto, value: string) => {
    setFormas(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleConfirmar = () => {
    if (selectedIds.length === 0) { toast.error("Selecione pelo menos um pagamento"); return; }
    const formasValidas = formas.filter(f => f.forma && f.conta && parseFloat(f.valor) > 0);
    if (formasValidas.length === 0) { toast.error("Adicione pelo menos uma forma de pagamento válida"); return; }
    
    const diff = Math.abs(totalFinal - totalFormas);
    if (diff > 0.01) { toast.error(`Os valores das formas de pagamento não batem com o total. Diferença: R$ ${fmt(diff)}`); return; }

    const selecionadas = filtradas.filter(c => selectedIds.includes(c.id));
    const formasResumo = formasValidas.map(f => `${f.forma} (${f.parcelas}x) R$ ${fmt(parseFloat(f.valor))}`).join(" + ");

    onConfirmar(selectedIds, formasValidas[0].forma, formasValidas[0].conta, dataPagamento);

    // Gerar comprovante automaticamente
    printRecibo({
      tipo: "pagamento",
      numero: selecionadas[0]?.numero || 0,
      descricao: selecionadas.length === 1 ? selecionadas[0].descricao : `Lote com ${selecionadas.length} pagamento(s)`,
      entidade: selecionadas.length === 1 ? selecionadas[0].entidade : [...new Set(selecionadas.map(c => c.entidade))].join(", "),
      formaPagamento: formasResumo,
      contaBancaria: formasValidas.map(f => f.conta).join(", "),
      valor: totalFinal,
      valorBruto: totalSelecionado,
      desconto: descontoNum,
      juros: jurosNum,
      dataVencimento: selecionadas[0]?.data || dataPagamento,
      dataConfirmacao: dataPagamento,
      confirmadoPor: "USUÁRIO ATUAL",
      cadastradoPor: "SISTEMA",
      parcelas: selecionadas.map(c => ({
        descricao: c.descricao,
        emissao: c.data,
        parcela: "1/1",
        valor: c.valor,
      })),
    });

    setSelectedIds([]);
    setFormas([{ id: nextFormaId++, forma: "", conta: "", valor: "", parcelas: "1" }]);
    setJuros("");
    setDesconto("");
    setObservacoes("");
    onOpenChange(false);
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  // Auto-fill first forma valor when total changes and only 1 forma with empty valor
  const autoFillFirst = () => {
    if (formas.length === 1 && !formas[0].valor && totalFinal > 0) {
      setFormas(prev => prev.map((f, i) => i === 0 ? { ...f, valor: totalFinal.toFixed(2) } : f));
    }
  };
  if (formas.length === 1 && !formas[0].valor && totalFinal > 0 && selectedIds.length > 0) {
    autoFillFirst();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pagamento em Lote</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fornecedor" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Seleção Fornecedor
            </TabsTrigger>
            <TabsTrigger value="multipla" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Seleção Múltipla
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fornecedor" className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Fornecedor</Label>
              <FornecedorCombobox value={fornecedorBusca} onChange={setFornecedorBusca} />
            </div>
          </TabsContent>

          <TabsContent value="multipla" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, descrição ou entidade..."
                value={buscaTexto}
                onChange={e => setBuscaTexto(e.target.value)}
                className="pl-9"
              />
            </div>
          </TabsContent>
        </Tabs>

        {filtradas.length > 0 && (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <Checkbox
                        checked={selectedIds.length === filtradas.length && filtradas.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Nº</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.map(c => (
                    <TableRow key={c.id} className={selectedIds.includes(c.id) ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox checked={selectedIds.includes(c.id)} onCheckedChange={() => toggleId(c.id)} />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{c.numero}</TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate">{c.descricao}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{c.entidade}</TableCell>
                      <TableCell className="text-sm">{c.data}</TableCell>
                      <TableCell>
                        <Badge variant={c.situacao === "Atrasado" ? "destructive" : "outline"} className="text-xs">
                          {c.situacao}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">R$ {fmt(c.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {selectedIds.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{selectedIds.length} pagamento(s) selecionado(s)</span>
                  <span className="text-lg font-bold text-primary">R$ {fmt(totalFinal)}</span>
                </div>

                {/* Multiple payment methods */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Formas de Pagamento</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addForma}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar forma
                    </Button>
                  </div>

                  {formas.map((f, idx) => (
                    <div key={f.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_100px_40px] gap-3 items-end border rounded-lg p-3 bg-background">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Forma de pagamento {idx + 1} *</Label>
                        <FormaPagamentoCombobox
                          value={f.forma}
                          onChange={(v, conta) => {
                            updateForma(f.id, "forma", v);
                            if (conta) updateForma(f.id, "conta", conta);
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Conta bancária *</Label>
                        <ContaBancariaCombobox value={f.conta} onChange={v => updateForma(f.id, "conta", v)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Valor (R$) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={f.valor}
                          onChange={e => updateForma(f.id, "valor", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Parcelas</Label>
                        <Select value={f.parcelas} onValueChange={v => updateForma(f.id, "parcelas", v)}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                              <SelectItem key={n} value={n.toString()}>
                                {n}x{n > 1 ? ` de R$ ${fmt((parseFloat(f.valor) || 0) / n)}` : " à vista"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        {formas.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-destructive hover:text-destructive"
                            onClick={() => removeForma(f.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between text-sm px-1">
                    <span className="text-muted-foreground">Total das formas: <strong className="text-foreground">R$ {fmt(totalFormas)}</strong></span>
                    {Math.abs(restante) > 0.01 && (
                      <span className="text-destructive font-medium animate-pulse">
                        {restante > 0 ? `⚠ Falta: R$ ${fmt(restante)}` : `⚠ Excesso: R$ ${fmt(Math.abs(restante))}`}
                      </span>
                    )}
                    {Math.abs(restante) <= 0.01 && totalFormas > 0 && (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Valores corretos
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Data do pagamento *</Label>
                    <Input type="date" value={dataPagamento} onChange={e => setDataPagamento(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Juros / Multa (R$)</Label>
                    <Input type="number" step="0.01" min="0" placeholder="0,00" value={juros} onChange={e => setJuros(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Desconto (R$)</Label>
                    <Input type="number" step="0.01" min="0" placeholder="0,00" value={desconto} onChange={e => setDesconto(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Observações</Label>
                  <Input placeholder="Observação do lote..." value={observacoes} onChange={e => setObservacoes(e.target.value)} />
                </div>

                {(jurosNum > 0 || descontoNum > 0) && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Subtotal: R$ {fmt(totalSelecionado)}</span>
                    {jurosNum > 0 && <span className="text-destructive">+ Juros: R$ {fmt(jurosNum)}</span>}
                    {descontoNum > 0 && <span className="text-green-600">- Desconto: R$ {fmt(descontoNum)}</span>}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {filtradas.length === 0 && (tab === "multipla" || fornecedorBusca) && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum pagamento pendente encontrado
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleConfirmar}
            disabled={selectedIds.length === 0 || (selectedIds.length > 0 && Math.abs(totalFinal - totalFormas) > 0.01)}
          >
            <Check className="h-4 w-4 mr-1" /> Confirmar Pagamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
