import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ArrowLeftRight, Check, X, Eye, Pencil, ArrowLeft, Info } from "lucide-react";
import { ContaBancariaCombobox } from "@/components/ContaBancariaCombobox";
import { PlanoContasCombobox } from "@/components/PlanoContasCombobox";
import { FormaPagamentoCombobox } from "@/components/FormaPagamentoCombobox";
import { ClienteCombobox } from "@/components/ClienteCombobox";
import { BRLInput } from "@/components/BRLInput";
import { toast } from "sonner";
import { format } from "date-fns";

interface Transferencia {
  id: string;
  descricao: string;
  valor: string;
  data_vencimento: string;
  data_competencia: string;
  forma_pagamento: string;
  observacoes: string;
  conta_origem: string;
  tipo_entidade_origem: string;
  cliente_origem: string;
  plano_contas_origem: string;
  conta_destino: string;
  tipo_entidade_destino: string;
  cliente_destino: string;
  plano_contas_destino: string;
  criado_em: string;
}

type ViewMode = "list" | "add" | "view";

export default function TransferenciasFinanceiro() {
  const [view, setView] = useState<ViewMode>("list");
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [selected, setSelected] = useState<Transferencia | null>(null);

  // Form
  const [descricao, setDescricao] = useState("Transferência entre contas");
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [dataVencimento, setDataVencimento] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dataCompetencia, setDataCompetencia] = useState(format(new Date(), "yyyy-MM-dd"));
  const [observacoes, setObservacoes] = useState("");
  // Origem
  const [contaOrigem, setContaOrigem] = useState("");
  const [tipoEntidadeOrigem, setTipoEntidadeOrigem] = useState("");
  const [clienteOrigem, setClienteOrigem] = useState("");
  const [planoContasOrigem, setPlanoContasOrigem] = useState("");
  // Destino
  const [contaDestino, setContaDestino] = useState("");
  const [tipoEntidadeDestino, setTipoEntidadeDestino] = useState("");
  const [clienteDestino, setClienteDestino] = useState("");
  const [planoContasDestino, setPlanoContasDestino] = useState("");

  const resetForm = () => {
    setDescricao("Transferência entre contas"); setValor(""); setFormaPagamento("");
    setDataVencimento(format(new Date(), "yyyy-MM-dd")); setDataCompetencia(format(new Date(), "yyyy-MM-dd"));
    setObservacoes(""); setContaOrigem(""); setTipoEntidadeOrigem(""); setClienteOrigem("");
    setPlanoContasOrigem(""); setContaDestino(""); setTipoEntidadeDestino(""); setClienteDestino("");
    setPlanoContasDestino("");
  };

  const handleSalvar = () => {
    if (!descricao.trim()) { toast.error("Descrição é obrigatória"); return; }
    if (!valor || parseFloat(valor) <= 0) { toast.error("Valor é obrigatório"); return; }
    if (!contaOrigem) { toast.error("Conta de origem é obrigatória"); return; }
    if (!contaDestino) { toast.error("Conta de destino é obrigatória"); return; }
    if (contaOrigem === contaDestino) { toast.error("Conta de origem e destino não podem ser iguais"); return; }

    const nova: Transferencia = {
      id: crypto.randomUUID(), descricao, valor, data_vencimento: dataVencimento,
      data_competencia: dataCompetencia, forma_pagamento: formaPagamento, observacoes,
      conta_origem: contaOrigem, tipo_entidade_origem: tipoEntidadeOrigem,
      cliente_origem: clienteOrigem, plano_contas_origem: planoContasOrigem,
      conta_destino: contaDestino, tipo_entidade_destino: tipoEntidadeDestino,
      cliente_destino: clienteDestino, plano_contas_destino: planoContasDestino,
      criado_em: new Date().toISOString(),
    };
    setTransferencias(prev => [nova, ...prev]);
    toast.success("Transferência cadastrada com sucesso");
    setView("list"); resetForm();
  };

  if (view === "view" && selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Visualizar Transferência</h1>
          <Button variant="outline" onClick={() => setView("list")}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                <TableRow><TableCell className="font-medium w-48">Descrição</TableCell><TableCell>{selected.descricao}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Valor</TableCell><TableCell>R$ {parseFloat(selected.valor || "0").toFixed(2).replace(".", ",")}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Conta Origem</TableCell><TableCell>{selected.conta_origem}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Conta Destino</TableCell><TableCell>{selected.conta_destino}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Vencimento</TableCell><TableCell>{selected.data_vencimento}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Competência</TableCell><TableCell>{selected.data_competencia}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Observações</TableCell><TableCell>{selected.observacoes || "—"}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === "add") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6" /> Transferência entre contas
          </h1>
          <Button variant="outline" onClick={() => { setView("list"); resetForm(); }}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-4 py-2 text-sm">
          A transferência entre contas gera um débito na Conta Originária e um crédito na Conta de Destino, transferindo o valor indicado de uma conta à outra.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Origem & Destino */}
          <div className="space-y-6">
            {/* Origem */}
            <Card>
              <div className="bg-muted px-4 py-2 border-b font-semibold flex items-center gap-2">✦ Origem</div>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="flex items-center gap-1">Conta de origem * <Info className="h-3 w-3 text-muted-foreground" /></Label>
                  <ContaBancariaCombobox value={contaOrigem} onChange={setContaOrigem} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de entidade</Label>
                    <Select value={tipoEntidadeOrigem} onValueChange={setTipoEntidadeOrigem}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                        <SelectItem value="transportadora">Transportadora</SelectItem>
                        <SelectItem value="funcionario">Funcionário</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cliente</Label>
                    <ClienteCombobox value={clienteOrigem} onChange={setClienteOrigem} />
                  </div>
                </div>
                <div>
                  <Label>Plano de contas *</Label>
                  <PlanoContasCombobox value={planoContasOrigem} onChange={setPlanoContasOrigem} tipoMovimentacao="Pagamentos" />
                </div>
              </CardContent>
            </Card>

            {/* Destino */}
            <Card>
              <div className="bg-muted px-4 py-2 border-b font-semibold flex items-center gap-2">🎯 Destino</div>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="flex items-center gap-1">Conta de destino * <Info className="h-3 w-3 text-muted-foreground" /></Label>
                  <ContaBancariaCombobox value={contaDestino} onChange={setContaDestino} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de entidade</Label>
                    <Select value={tipoEntidadeDestino} onValueChange={setTipoEntidadeDestino}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                        <SelectItem value="transportadora">Transportadora</SelectItem>
                        <SelectItem value="funcionario">Funcionário</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cliente</Label>
                    <ClienteCombobox value={clienteDestino} onChange={setClienteDestino} />
                  </div>
                </div>
                <div>
                  <Label>Plano de contas *</Label>
                  <PlanoContasCombobox value={planoContasDestino} onChange={setPlanoContasDestino} tipoMovimentacao="Recebimentos" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Dados gerais */}
          <Card className="h-fit">
            <div className="bg-muted px-4 py-2 border-b font-semibold flex items-center gap-2">📋 Dados gerais</div>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="flex items-center gap-1">Descrição * <Info className="h-3 w-3 text-muted-foreground" /></Label>
                <Input value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">Valor * <Info className="h-3 w-3 text-muted-foreground" /></Label>
                  <BRLInput value={valor} onChange={setValor} />
                </div>
                <div>
                  <Label className="flex items-center gap-1">Forma de pagamento * <Info className="h-3 w-3 text-muted-foreground" /></Label>
                  <FormaPagamentoCombobox value={formaPagamento} onChange={(v) => setFormaPagamento(v)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">Vencimento * <Info className="h-3 w-3 text-muted-foreground" /></Label>
                  <Input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} />
                </div>
                <div>
                  <Label className="flex items-center gap-1">Data de competência * <Info className="h-3 w-3 text-muted-foreground" /></Label>
                  <Input type="date" value={dataCompetencia} onChange={e => setDataCompetencia(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={5} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSalvar}>
            <Check className="h-4 w-4 mr-1" /> Cadastrar
          </Button>
          <Button variant="destructive" onClick={() => { setView("list"); resetForm(); }}>
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6" /> Transferências entre contas
          </h1>
          <p className="text-sm text-muted-foreground">Transferências entre contas e caixas</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { resetForm(); setView("add"); }}>
          <Plus className="h-4 w-4 mr-1" /> Nova Transferência
        </Button>
      </div>

      <Card className="glass-panel">
        <CardContent className="p-0">
          {transferencias.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma transferência registrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transferencias.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.descricao}</TableCell>
                    <TableCell>{t.conta_origem}</TableCell>
                    <TableCell>{t.conta_destino}</TableCell>
                    <TableCell className="text-right">R$ {parseFloat(t.valor || "0").toFixed(2).replace(".", ",")}</TableCell>
                    <TableCell>{t.data_vencimento}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" className="h-8 w-8 rounded-full bg-teal-500 hover:bg-teal-600 text-white" onClick={() => { setSelected(t); setView("view"); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white" onClick={() => {
                          setTransferencias(prev => prev.filter(x => x.id !== t.id));
                          toast.success("Transferência removida");
                        }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
