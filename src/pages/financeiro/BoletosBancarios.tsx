import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PlanoContasCombobox } from "@/components/PlanoContasCombobox";
import { FormaPagamentoCombobox } from "@/components/FormaPagamentoCombobox";
import { ContaBancariaCombobox } from "@/components/ContaBancariaCombobox";
import { ClienteCombobox } from "@/components/ClienteCombobox";
import { BRLInput } from "@/components/BRLInput";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Search, FileText, Upload, Download, Settings, Eye, Edit, Trash2,
  ChevronDown, Check, X, ArrowLeft, MoreVertical, Printer, FileDown, FileUp,
  CheckCircle, XCircle, Grid3X3, Mail, MessageCircle, Copy, Receipt
} from "lucide-react";
import { toast } from "sonner";
import { printBoleto } from "@/lib/printBoleto";
import { printRecibo } from "@/lib/printRecibo";

type ViewMode = "list" | "adicionar" | "exportar-remessa" | "importar-retorno" | "visualizar" | "editar";

interface Boleto {
  id: string;
  numero: string;
  descricao: string;
  entidade: string;
  pagamento: string;
  contaBancaria: string;
  data: string;
  dataCompetencia: string;
  dataConfirmacao: string;
  confirmadoPor: string;
  cadastradoPor: string;
  cadastradoEm: string;
  modificadoEm: string;
  situacao: "Em aberto" | "Pago" | "Cancelado" | "Atrasado";
  valor: number;
  valorBruto: number;
  desconto: number;
  juros: number;
  planoContas: string;
  loja: string;
}

const mockBoletos: Boleto[] = [];

const situacaoColor = (s: string) => {
  if (s === "Em aberto") return "bg-yellow-500 text-white";
  if (s === "Pago") return "bg-green-600 text-white";
  if (s === "Cancelado") return "bg-red-500 text-white";
  if (s === "Atrasado") return "bg-orange-500 text-white";
  return "bg-muted text-muted-foreground";
};

export default function BoletosBancarios() {
  const [view, setView] = useState<ViewMode>("list");
  const [selectedBoleto, setSelectedBoleto] = useState<Boleto | null>(null);
  const [selectedBoletos, setSelectedBoletos] = useState<string[]>([]);
  const [showBuscaAvancada, setShowBuscaAvancada] = useState(false);
  const [boletosList] = useState<Boleto[]>(mockBoletos);

  // Add form state
  const [addTab, setAddTab] = useState("financeiro");
  const [descricao, setDescricao] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [planoContas, setPlanoContas] = useState("");
  const [centroCusto, setCentroCusto] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [contaBancaria, setContaBancaria] = useState("");
  const [pagamentoQuitado, setPagamentoQuitado] = useState("nao");
  const [dataCompensacao, setDataCompensacao] = useState("");
  const [valorBruto, setValorBruto] = useState("");
  const [juros, setJuros] = useState("");
  const [desconto, setDesconto] = useState("");
  const [ativarParcelamento, setAtivarParcelamento] = useState(false);
  const [cliente, setCliente] = useState("");
  const [infoComplementares, setInfoComplementares] = useState("");

  // Export remessa state
  const [remessaLoja, setRemessaLoja] = useState("DKA GERENCIAL");
  const [remessaSituacao, setRemessaSituacao] = useState("nao_enviado");
  const [remessaFormaPagamento, setRemessaFormaPagamento] = useState("");
  const [remessaDataVencInicio, setRemessaDataVencInicio] = useState("2026-03-01");
  const [remessaDataVencFim, setRemessaDataVencFim] = useState("2026-03-31");
  const [remessaDataCompInicio, setRemessaDataCompInicio] = useState("");
  const [remessaDataCompFim, setRemessaDataCompFim] = useState("");
  const [remessaPlanoContas, setRemessaPlanoContas] = useState("todos");
  const [remessaValorInicio, setRemessaValorInicio] = useState("");
  const [remessaValorFim, setRemessaValorFim] = useState("");
  const [remessaCliente, setRemessaCliente] = useState("");

  // Import retorno state
  const [retornoFormaPagamento, setRetornoFormaPagamento] = useState("");
  const [retornoArquivo, setRetornoArquivo] = useState<File | null>(null);
  const retornoFileRef = useRef<HTMLInputElement>(null);

  // Advanced search state
  const [buscaLoja, setBuscaLoja] = useState("DKA GERENCIAL");
  const [buscaCodigo, setBuscaCodigo] = useState("");
  const [buscaNBoleto, setBuscaNBoleto] = useState("");
  const [buscaPlanoContas, setBuscaPlanoContas] = useState("todos");
  const [buscaDescricao, setBuscaDescricao] = useState("");
  const [buscaEntidade, setBuscaEntidade] = useState("cliente");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [buscaDataInicio, setBuscaDataInicio] = useState("2026-03-01");
  const [buscaDataFim, setBuscaDataFim] = useState("2026-03-31");
  const [buscaValorInicio, setBuscaValorInicio] = useState("");
  const [buscaValorFim, setBuscaValorFim] = useState("");
  const [buscaSituacao, setBuscaSituacao] = useState("todas");
  const [buscaContaBancaria, setBuscaContaBancaria] = useState("todos");
  const [buscaCentroCusto, setBuscaCentroCusto] = useState("todos");
  const [buscaFormaPagamento, setBuscaFormaPagamento] = useState("todos");
  const [buscaNfe, setBuscaNfe] = useState("");
  const [buscaNfse, setBuscaNfse] = useState("");

  const total = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const toggleBoleto = (id: string) => {
    setSelectedBoletos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const totalCalculado = () => {
    const bruto = parseFloat(valorBruto) || 0;
    const j = parseFloat(juros) || 0;
    const d = parseFloat(desconto) || 0;
    return bruto + j - d;
  };

  // ===== ADICIONAR RECEBIMENTO =====
  if (view === "adicionar") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Adicionar recebimento</h1>
            <p className="text-xs text-muted-foreground">Início &gt; Contas a receber &gt; Adicionar</p>
          </div>
        </div>

        <Tabs value={addTab} onValueChange={setAddTab}>
          <TabsList>
            <TabsTrigger value="financeiro">Lançamento financeiro</TabsTrigger>
            <TabsTrigger value="outras">Outras informações</TabsTrigger>
            <TabsTrigger value="anexos">Anexos</TabsTrigger>
          </TabsList>

          <TabsContent value="financeiro" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="pt-5 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Edit className="h-4 w-4" /> Dados gerais
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Descrição do recebimento* <span className="text-muted-foreground text-xs">ⓘ</span></Label>
                        <Input value={descricao} onChange={e => setDescricao(e.target.value)} />
                      </div>
                      <div>
                        <Label>Vencimento*</Label>
                        <Input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Plano de contas*</Label>
                        <PlanoContasCombobox value={planoContas} onChange={setPlanoContas} tipoMovimentacao="Recebimentos" />
                      </div>
                      <div>
                        <Label>Centro de custo</Label>
                        <Input placeholder="Digite para buscar" value={centroCusto} onChange={e => setCentroCusto(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Forma de pagamento*</Label>
                        <FormaPagamentoCombobox value={formaPagamento} onChange={(v, cb) => { setFormaPagamento(v); if (cb) setContaBancaria(cb); }} />
                      </div>
                      <div>
                        <Label>Conta bancária*</Label>
                        <ContaBancariaCombobox value={contaBancaria} onChange={setContaBancaria} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Recebimento quitado*</Label>
                        <Select value={pagamentoQuitado} onValueChange={setPagamentoQuitado}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nao">Não</SelectItem>
                            <SelectItem value="sim">Sim</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Data de compensação</Label>
                        <Input type="date" value={dataCompensacao} onChange={e => setDataCompensacao(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 pt-2">
                      <Button variant="outline" onClick={() => setView("list")}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                      </Button>
                      <Button variant="outline">
                        Continuar →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardContent className="pt-5 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Valores
                    </h3>
                    <div>
                      <Label>Valor bruto*</Label>
                      <BRLInput value={valorBruto} onChange={setValorBruto} />
                    </div>
                    <div>
                      <Label>Juros</Label>
                      <div className="flex gap-2">
                        <BRLInput value={juros} onChange={setJuros} />
                        <Button variant="outline" size="icon" className="shrink-0">⟳</Button>
                      </div>
                    </div>
                    <div>
                      <Label>Desconto</Label>
                      <BRLInput value={desconto} onChange={setDesconto} />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Switch checked={ativarParcelamento} onCheckedChange={setAtivarParcelamento} />
                      <Label>Ativar parcelamento/recorrência</Label>
                    </div>
                    <div className="text-right font-bold text-lg pt-2 border-t">
                      Total: {total(totalCalculado())}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="outras" className="mt-4">
            <Card>
              <CardContent className="pt-5 space-y-4">
                <h3 className="font-semibold">Outras informações</h3>
                <div>
                  <Label>Cliente</Label>
                  <ClienteCombobox value={cliente} onChange={setCliente} />
                </div>
                <div>
                  <Label>Informações complementares</Label>
                  <Textarea value={infoComplementares} onChange={e => setInfoComplementares(e.target.value)} rows={4} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anexos" className="mt-4">
            <Card>
              <CardContent className="pt-5 text-center text-muted-foreground">
                <p>Arraste ou selecione arquivos para anexar (PDF, JPG, PNG - máx 5MB)</p>
                <Button variant="outline" className="mt-3">Selecionar arquivo</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { toast.success("Recebimento cadastrado!"); setView("list"); }}>
            <Check className="h-4 w-4 mr-1" /> Cadastrar
          </Button>
          <Button variant="destructive" onClick={() => setView("list")}>
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // ===== EXPORTAR REMESSA =====
  if (view === "exportar-remessa") {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Exportar remessa</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Boletos bancários &gt; Exportar remessa</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Lojas</Label>
                    <Select value={remessaLoja} onValueChange={setRemessaLoja}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DKA GERENCIAL">DKA GERENCIAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Situação do boleto*</Label>
                    <Select value={remessaSituacao} onValueChange={setRemessaSituacao}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao_enviado">Não enviado</SelectItem>
                        <SelectItem value="enviado">Enviado</SelectItem>
                        <SelectItem value="todos">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Forma de pagamento*</Label>
                    <FormaPagamentoCombobox value={remessaFormaPagamento} onChange={setRemessaFormaPagamento} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Data de vencimento*</Label>
                    <div className="flex items-center gap-2">
                      <Input type="date" value={remessaDataVencInicio} onChange={e => setRemessaDataVencInicio(e.target.value)} />
                      <span className="text-muted-foreground">a</span>
                      <Input type="date" value={remessaDataVencFim} onChange={e => setRemessaDataVencFim(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Data de competência</Label>
                    <div className="flex items-center gap-2">
                      <Input type="date" value={remessaDataCompInicio} onChange={e => setRemessaDataCompInicio(e.target.value)} />
                      <span className="text-muted-foreground">a</span>
                      <Input type="date" value={remessaDataCompFim} onChange={e => setRemessaDataCompFim(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Plano de contas</Label>
                    <Select value={remessaPlanoContas} onValueChange={setRemessaPlanoContas}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor</Label>
                    <div className="flex items-center gap-2">
                      <Input value={remessaValorInicio} onChange={e => setRemessaValorInicio(e.target.value)} placeholder="" />
                      <span className="text-muted-foreground">a</span>
                      <Input value={remessaValorFim} onChange={e => setRemessaValorFim(e.target.value)} placeholder="" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Cliente</Label>
                  <ClienteCombobox value={remessaCliente} onChange={setRemessaCliente} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-5 space-y-3">
              <h3 className="font-semibold">Exportar arquivo de remessa</h3>
              <p className="text-sm text-muted-foreground">
                Remessa é um arquivo enviado pelo cliente para o banco contendo informações que são
                interpretadas pelo sistema do banco.
              </p>
              <p className="text-sm text-muted-foreground">
                Vale lembrar que este processo para boleto registrado, está disponível para os bancos
                Santander, Bradesco, Itaú, Banco do Brasil, Caixa Econômica, Sicoob, Banrisul, Sicredi,
                Banco do Nordeste e HSBC, e foi formulado com base nos arquivos de remessa do tipo
                CNAB240 e CNAB400.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => toast.success("Remessa gerada!")}>
            <Check className="h-4 w-4 mr-1" /> Gerar
          </Button>
          <Button variant="destructive" onClick={() => setView("list")}>
            <X className="h-4 w-4 mr-1" /> Limpar
          </Button>
        </div>
      </div>
    );
  }

  // ===== IMPORTAR RETORNO =====
  if (view === "importar-retorno") {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Importar retorno</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Contas a receber &gt; Importar retorno</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="bg-yellow-100 text-yellow-800 rounded p-3 text-sm">
                Insira um arquivo de retorno no botão abaixo.
              </div>

              <div>
                <Label>Forma de pagamento*</Label>
                <FormaPagamentoCombobox value={retornoFormaPagamento} onChange={setRetornoFormaPagamento} />
              </div>

              <input
                type="file"
                ref={retornoFileRef}
                className="hidden"
                accept=".ret,.txt,.rem"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setRetornoArquivo(f); toast.success(`Arquivo "${f.name}" selecionado`); }
                }}
              />

              <Button
                className="w-full bg-gray-700 hover:bg-gray-800 text-white"
                onClick={() => retornoFileRef.current?.click()}
              >
                📁 Selecionar arquivo
              </Button>

              {retornoArquivo && (
                <p className="text-sm text-muted-foreground">Arquivo: {retornoArquivo.name}</p>
              )}

              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => { toast.success("Retorno importado com sucesso!"); setView("list"); }}
              >
                <Check className="h-4 w-4 mr-1" /> Importar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 space-y-3">
              <h3 className="font-semibold">Importar arquivo de retorno</h3>
              <p className="text-sm text-muted-foreground">
                Acesse o seu internet banking, gere o arquivo de retorno .ret, importe e concilie suas vendas.
              </p>
              <p className="text-sm text-muted-foreground">
                Vale lembrar que este processo para boleto simples, está disponível para os bancos Santander, Bradesco, Itaú, Banco do Brasil, Caixa
                Econômica, Sicoob, Banrisul, Sicredi, Banco do Nordeste e HSBC, e foi formulado com base nos arquivos de retorno do tipo CNAB240 e
                CNAB400.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ===== VISUALIZAR =====
  if (view === "visualizar" && selectedBoleto) {
    const b = selectedBoleto;
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Visualizar boleto</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Boletos bancários &gt; Visualizar</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">Boleto #{b.numero}</span>
          <Badge className={situacaoColor(b.situacao)}>{b.situacao}</Badge>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-5 space-y-2 text-sm">
              <h3 className="font-semibold mb-3">Dados gerais</h3>
              <p><span className="text-muted-foreground">Nº Boleto:</span> {b.numero}</p>
              <p><span className="text-muted-foreground">Descrição:</span> {b.descricao}</p>
              <p><span className="text-muted-foreground">Entidade:</span> {b.entidade}</p>
              <p><span className="text-muted-foreground">Valor:</span> R$ {total(b.valor)}</p>
              <p><span className="text-muted-foreground">Vencimento:</span> {b.data}</p>
              <p><span className="text-muted-foreground">Forma de pagamento:</span> {b.pagamento}</p>
              <p><span className="text-muted-foreground">Conta bancária:</span> {b.contaBancaria}</p>
              <p><span className="text-muted-foreground">Situação:</span> {b.situacao}</p>
              <p><span className="text-muted-foreground">Cadastrado por:</span> {b.cadastradoPor}</p>
            </CardContent>
          </Card>
        </div>
        <Button variant="outline" onClick={() => setView("list")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Boletos bancários</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Boletos bancários &gt; Listar</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setView("adicionar")}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
          <Button className="bg-green-700 hover:bg-green-800 text-white" onClick={() => setView("exportar-remessa")}>
            <FileDown className="h-4 w-4 mr-1" /> Exportar remessa
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setView("importar-retorno")}>
            <FileUp className="h-4 w-4 mr-1" /> Importar retorno
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                <Settings className="h-4 w-4 mr-1" /> Mais ações <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => toast.info("Confirmar recebimentos selecionados")}>
                <CheckCircle className="h-4 w-4 mr-2" /> Confirmar recebimentos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Cancelar recebimentos selecionados")}>
                <XCircle className="h-4 w-4 mr-2" /> Cancelar recebimentos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Exportar recebimentos")}>
                <FileDown className="h-4 w-4 mr-2" /> Exportar recebimentos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Imprimir boletos")}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir boletos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Imprimir carnês")}>
                <FileText className="h-4 w-4 mr-2" /> Imprimir carnês
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Excluir recebimentos")}>
                <Trash2 className="h-4 w-4 mr-2" /> Excluir recebimentos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon">
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" className="bg-blue-700 text-white hover:bg-blue-800">
            Março de 2026 ▾
          </Button>
          <Button variant="outline" onClick={() => setShowBuscaAvancada(!showBuscaAvancada)}>
            <Search className="h-4 w-4 mr-1" /> Busca avançada
          </Button>
        </div>
      </div>

      {/* Advanced search panel */}
      {showBuscaAvancada && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Loja</Label>
                <Select value={buscaLoja} onValueChange={setBuscaLoja}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DKA GERENCIAL">DKA GERENCIAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cód. interno</Label>
                <Input value={buscaCodigo} onChange={e => setBuscaCodigo(e.target.value)} />
              </div>
              <div>
                <Label>Nº boleto</Label>
                <Input value={buscaNBoleto} onChange={e => setBuscaNBoleto(e.target.value)} />
              </div>
              <div>
                <Label>Plano de contas</Label>
                <Select value={buscaPlanoContas} onValueChange={setBuscaPlanoContas}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Descrição</Label>
                <Input value={buscaDescricao} onChange={e => setBuscaDescricao(e.target.value)} />
              </div>
              <div>
                <Label>Entidade</Label>
                <Select value={buscaEntidade} onValueChange={setBuscaEntidade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="fornecedor">Fornecedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cliente</Label>
                <ClienteCombobox value={buscaCliente} onChange={setBuscaCliente} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Período</Label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={buscaDataInicio} onChange={e => setBuscaDataInicio(e.target.value)} />
                  <span className="text-muted-foreground">a</span>
                  <Input type="date" value={buscaDataFim} onChange={e => setBuscaDataFim(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Valor</Label>
                <div className="flex items-center gap-2">
                  <Input value={buscaValorInicio} onChange={e => setBuscaValorInicio(e.target.value)} />
                  <span className="text-muted-foreground">a</span>
                  <Input value={buscaValorFim} onChange={e => setBuscaValorFim(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Situação</Label>
                <Select value={buscaSituacao} onValueChange={setBuscaSituacao}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="em_aberto">Em aberto</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Conta bancária</Label>
                <Select value={buscaContaBancaria} onValueChange={setBuscaContaBancaria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Centro de custo</Label>
                <Select value={buscaCentroCusto} onValueChange={setBuscaCentroCusto}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Forma de recebimento</Label>
                <Select value={buscaFormaPagamento} onValueChange={setBuscaFormaPagamento}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>NF-e</Label>
                <Input value={buscaNfe} onChange={e => setBuscaNfe(e.target.value)} />
              </div>
              <div>
                <Label>NFS-e</Label>
                <Input value={buscaNfse} onChange={e => setBuscaNfse(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Check className="h-4 w-4 mr-1" /> Buscar
              </Button>
              <Button variant="destructive">
                <X className="h-4 w-4 mr-1" /> Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedBoletos.length === boletosList.length && boletosList.length > 0}
                    onCheckedChange={(checked) => {
                      setSelectedBoletos(checked ? boletosList.map(b => b.id) : []);
                    }}
                  />
                </TableHead>
                <TableHead>Boleto</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boletosList.map(b => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedBoletos.includes(b.id)}
                      onCheckedChange={() => toggleBoleto(b.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{b.numero}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{b.descricao}</TableCell>
                  <TableCell className="text-primary underline cursor-pointer text-sm max-w-[200px] truncate">{b.entidade}</TableCell>
                  <TableCell className="text-sm">{b.pagamento}</TableCell>
                  <TableCell className="text-sm">{b.data}</TableCell>
                  <TableCell>
                    <Badge className={situacaoColor(b.situacao)}>{b.situacao}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{total(b.valor)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedBoleto(b); setView("visualizar"); }}>
                        <Eye className="h-3.5 w-3.5 text-blue-600" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-700 text-white">
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => printBoleto({
                            numeroBoleto: b.numero,
                            descricao: b.descricao,
                            valor: b.valor,
                            vencimento: b.data,
                            entidadeNome: b.entidade,
                            formaPagamento: b.pagamento,
                            contaBancaria: b.contaBancaria,
                          })}>
                            <Printer className="h-4 w-4 mr-2" /> Imprimir boleto
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Enviar boleto por e-mail")}>
                            <Mail className="h-4 w-4 mr-2" /> Enviar boleto por e-mail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Enviar boleto por WhatsApp")}>
                            <MessageCircle className="h-4 w-4 mr-2" /> Enviar boleto por WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Confirmar recebimento")}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Confirmar recebimento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => printRecibo({
                            tipo: "recebimento",
                            numero: parseInt(b.numero) || 0,
                            descricao: b.descricao,
                            entidade: b.entidade,
                            formaPagamento: b.pagamento,
                            contaBancaria: b.contaBancaria,
                            valor: b.valor,
                            valorBruto: b.valorBruto,
                            desconto: b.desconto,
                            juros: b.juros,
                            dataVencimento: b.data,
                            dataConfirmacao: b.dataConfirmacao || b.data,
                            confirmadoPor: b.confirmadoPor || "—",
                            cadastradoPor: b.cadastradoPor || "—",
                          })}>
                            <Receipt className="h-4 w-4 mr-2" /> Imprimir recibo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Emitir nota de serviço")}>
                            <FileText className="h-4 w-4 mr-2" /> Emitir nota de serviço
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Duplicar recebimento")}>
                            <Copy className="h-4 w-4 mr-2" /> Duplicar recebimento
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Cancelar boleto")}>
                        <XCircle className="h-3.5 w-3.5 text-orange-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Excluir boleto")}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {boletosList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum boleto cadastrado</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
