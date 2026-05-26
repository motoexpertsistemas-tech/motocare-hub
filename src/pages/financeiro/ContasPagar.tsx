import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { printRecibo } from "@/lib/printRecibo";
import { PlanoContasCombobox } from "@/components/PlanoContasCombobox";
import { FormaPagamentoCombobox } from "@/components/FormaPagamentoCombobox";
import { ContaBancariaCombobox } from "@/components/ContaBancariaCombobox";
import { FornecedorCombobox } from "@/components/FornecedorCombobox";
import { ClienteCombobox } from "@/components/ClienteCombobox";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Search, Filter, DollarSign, ExternalLink, Check, X, ChevronDown,
  Settings, Eye, Edit, Trash2, Minus, Upload, ArrowLeft, FileText,
  CheckCircle, XCircle, ArrowLeftRight, FileDown, FileUp, Group, Play,
  MoreVertical, Printer, Copy, MessageCircle, Clock, User
} from "lucide-react";
import { toast } from "sonner";
import { PagamentoLoteDialog } from "@/components/PagamentoLoteDialog";

type ViewMode = "list" | "fixas" | "visualizar" | "editar";

interface ContaPagar {
  id: string;
  numero: number;
  descricao: string;
  entidade: string;
  planoContas: string;
  pagamento: string;
  contaBancaria: string;
  data: string;
  dataCompetencia: string;
  dataConfirmacao: string;
  confirmadoPor: string;
  cadastradoPor: string;
  cadastradoEm: string;
  modificadoEm: string;
  nfe: string;
  situacao: "Confirmado" | "Atrasado" | "Pendente" | "Pago";
  valor: number;
  valorBruto: number;
  desconto: number;
  juros: number;
  nBoleto: string;
  loja: string;
  funcionarioNome: string;
}

const mockContas: ContaPagar[] = [];

interface ContaFixa {
  id: string;
  descricao: string;
  entidade: string;
  planoContas: string;
  pagamento: string;
  gerarPagamento: string;
  proximoVencimento: string;
  valor: number;
  situacao: string;
  loja: string;
}

const initialContasFixas: ContaFixa[] = [];

const situacaoColor = (s: string) => {
  if (s === "Confirmado") return "bg-green-600 text-white";
  if (s === "Atrasado") return "bg-orange-500 text-white";
  if (s === "Pendente") return "bg-yellow-500 text-white";
  if (s === "Pago") return "bg-blue-500 text-white";
  return "bg-muted text-muted-foreground";
};

export default function ContasPagar() {
  const [view, setView] = useState<ViewMode>("list");
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddFixaDialog, setShowAddFixaDialog] = useState(false);
  const [showBuscaAvancada, setShowBuscaAvancada] = useState(false);
  const [selectedContas, setSelectedContas] = useState<string[]>([]);
  const [showPagamentoLote, setShowPagamentoLote] = useState(false);
  const [contasList, setContasList] = useState<ContaPagar[]>(mockContas);
  const [addTab, setAddTab] = useState("financeiro");
  const [addFixaTab, setAddFixaTab] = useState("financeiro");
  const [editTab, setEditTab] = useState("financeiro");
  const [contasFixas, setContasFixas] = useState<ContaFixa[]>(initialContasFixas);
  const [editingFixaId, setEditingFixaId] = useState<string | null>(null);

  // Add payment form state
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
  const [entidade, setEntidade] = useState("fornecedor");
  const [fornecedor, setFornecedor] = useState("");
  const [dataCompetencia, setDataCompetencia] = useState("2026-02-27");
  const [infoComplementares, setInfoComplementares] = useState("");
  const [anexos, setAnexos] = useState<{name: string; url: string}[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Arquivo excede 5MB"); return; }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { toast.error("Formato não suportado. Use PDF, JPG ou PNG."); return; }
    setUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data: usuario } = await supabase.from("usuarios").select("empresa_id").eq("auth_user_id", session?.user?.id || "").maybeSingle();
    const tenantPrefix = usuario?.empresa_id || "default";
    const path = `${tenantPrefix}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("financeiro-anexos").upload(path, file);
    if (error) { toast.error("Erro no upload: " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("financeiro-anexos").getPublicUrl(path);
    setAnexos(prev => [...prev, { name: file.name, url: urlData.publicUrl }]);
    toast.success("Arquivo anexado!");
    setUploading(false);
  };

  // Conta fixa form state
  const [fixaDescricao, setFixaDescricao] = useState("");
  const [fixaPlanoContas, setFixaPlanoContas] = useState("");
  const [fixaCentroCusto, setFixaCentroCusto] = useState("");
  const [fixaOcorrencia, setFixaOcorrencia] = useState("mensal");
  const [fixaProximoVencimento, setFixaProximoVencimento] = useState("");
  const [fixaGerarPagamento, setFixaGerarPagamento] = useState("5_dias_antes");
  const [fixaQuantasVezes, setFixaQuantasVezes] = useState("para_sempre");
  const [fixaFormaPagamento, setFixaFormaPagamento] = useState("");
  const [fixaContaBancaria, setFixaContaBancaria] = useState("");
  const [fixaValorBruto, setFixaValorBruto] = useState("");
  const [fixaJuros, setFixaJuros] = useState("");
  const [fixaDesconto, setFixaDesconto] = useState("");
  const [fixaGerarProximaFatura, setFixaGerarProximaFatura] = useState(true);

  // Search state
  const [buscaLoja, setBuscaLoja] = useState("todas");
  const [buscaCodigo, setBuscaCodigo] = useState("");
  const [buscaPlanoContas, setBuscaPlanoContas] = useState("todos");
  const [buscaDescricao, setBuscaDescricao] = useState("");
  const [buscaEntidade, setBuscaEntidade] = useState("fornecedor");
  const [buscaFornecedor, setBuscaFornecedor] = useState("");
  const [buscaDataInicio, setBuscaDataInicio] = useState("2026-02-01");
  const [buscaDataFim, setBuscaDataFim] = useState("2026-02-28");
  const [buscaValorInicio, setBuscaValorInicio] = useState("");
  const [buscaValorFim, setBuscaValorFim] = useState("");
  const [buscaSituacao, setBuscaSituacao] = useState("todas");
  const [buscaContaBancaria, setBuscaContaBancaria] = useState("todos");
  const [buscaCentroCusto, setBuscaCentroCusto] = useState("todos");
  const [buscaFormaPagamento, setBuscaFormaPagamento] = useState("todos");
  const [buscaNfe, setBuscaNfe] = useState("");

  // Comment state
  const [comentario, setComentario] = useState("");

  const total = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const toggleConta = (id: string) => {
    setSelectedContas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openVisualizar = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setView("visualizar");
  };

  const openEditar = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setDescricao(conta.descricao);
    setVencimento(conta.data.split("/").reverse().join("-"));
    setPlanoContas(conta.planoContas);
    setFormaPagamento(conta.pagamento);
    setContaBancaria(conta.contaBancaria);
    setValorBruto(conta.valorBruto.toString());
    setJuros(conta.juros.toString());
    setDesconto(conta.desconto.toString());
    setPagamentoQuitado(conta.situacao === "Confirmado" ? "sim" : "nao");
    setEditTab("financeiro");
    setView("editar");
  };

  // ===== VISUALIZAR VIEW =====
  if (view === "visualizar" && selectedConta) {
    const c = selectedConta;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Visualizar pagamento</h1>
            <p className="text-xs text-muted-foreground">Início &gt; Contas a pagar &gt; Visualizar</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">✨ Pagamento #{c.numero}</span>
            <Badge className={situacaoColor(c.situacao)}>{c.situacao}</Badge>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => openEditar(c)}>
            <Edit className="h-4 w-4 mr-1" /> Editar pagamento
          </Button>
        </div>
        <p className="text-sm text-muted-foreground -mt-4">Criado em {c.cadastradoEm} por {c.cadastradoPor}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dados gerais */}
          <Card>
            <CardContent className="pt-5 space-y-2">
              <h3 className="font-semibold flex items-center gap-2 mb-3"><Edit className="h-4 w-4" /> Dados gerais</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Código:</span> {c.numero}</p>
                <p><span className="text-muted-foreground">Nº boleto:</span> {c.nBoleto}</p>
                <p><span className="text-muted-foreground">Descrição:</span> {c.descricao}</p>
                <p><span className="text-muted-foreground">Valor bruto:</span> {total(c.valorBruto)}</p>
                <p><span className="text-muted-foreground">Desconto:</span> {total(c.desconto)}</p>
                <p><span className="text-muted-foreground">Juros:</span> {total(c.juros)}</p>
                <p><span className="text-muted-foreground">Data do vencimento:</span> {c.data}</p>
                <p><span className="text-muted-foreground">Data de competência:</span> {c.dataCompetencia}</p>
                {c.dataConfirmacao && <p><span className="text-muted-foreground">Data de confirmação:</span> {c.dataConfirmacao}</p>}
                {c.confirmadoPor && <p><span className="text-muted-foreground">Confirmado por:</span> {c.confirmadoPor}</p>}
                <p><span className="text-muted-foreground">Loja:</span> {c.loja}</p>
                <p><span className="text-muted-foreground">Cadastrado por:</span> <span className="text-primary underline cursor-pointer">{c.cadastradoPor}</span></p>
                <p><span className="text-muted-foreground">Cadastrado em:</span> {c.cadastradoEm}</p>
                <p><span className="text-muted-foreground">Modificado em:</span> {c.modificadoEm}</p>
              </div>
              <Button variant="default" className="w-full mt-3" onClick={() => openEditar(c)}>Editar detalhes</Button>
            </CardContent>
          </Card>

          {/* Detalhes do pagamento + Histórico */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-5">
                <h3 className="font-semibold flex items-center gap-2 mb-3"><FileText className="h-4 w-4" /> Detalhes do pagamento</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Forma de pagamento:</span><p className="font-medium">{c.pagamento}</p></div>
                  <div><span className="text-muted-foreground">Plano de contas:</span><p className="font-medium text-primary underline cursor-pointer">{c.planoContas}</p></div>
                  <div><span className="text-muted-foreground">Conta bancária:</span><p className="font-medium">{c.contaBancaria}</p></div>
                  <div><span className="text-muted-foreground">Valor total:</span><p className="font-medium">{total(c.valor)}</p></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <h3 className="font-semibold flex items-center gap-2 mb-3"><Clock className="h-4 w-4" /> Histórico</h3>
                <div className="space-y-3">
                  {c.confirmadoPor && (
                    <div className="flex items-start gap-3 border rounded-lg p-3">
                      <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white"><Minus className="h-4 w-4" /></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{c.confirmadoPor}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{c.modificadoEm}</p>
                        <Badge className="bg-green-600 text-white text-xs mt-1">Confirmado</Badge>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 border rounded-lg p-3">
                    <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white"><Minus className="h-4 w-4" /></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{c.cadastradoPor}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{c.cadastradoEm}</p>
                      <Badge className="bg-red-500 text-white text-xs mt-1">Em aberto</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <h3 className="font-semibold flex items-center gap-2 mb-3"><MessageCircle className="h-4 w-4" /> Interações</h3>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><User className="h-4 w-4 text-muted-foreground" /></div>
                  <Input placeholder="Escreva um comentário..." value={comentario} onChange={e => setComentario(e.target.value)} className="flex-1" />
                  <Button size="sm" disabled={!comentario.trim()} onClick={() => { toast.success("Comentário adicionado"); setComentario(""); }}>Enviar</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Funcionário section */}
        {c.funcionarioNome && (
          <Card>
            <CardContent className="pt-5">
              <h3 className="font-semibold flex items-center gap-2 mb-2"><User className="h-4 w-4" /> Funcionário</h3>
              <p className="text-sm"><span className="text-muted-foreground">Nome:</span> <span className="text-primary underline cursor-pointer">{c.funcionarioNome}</span></p>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" onClick={() => { setView("list"); setSelectedConta(null); }}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para lista
        </Button>
      </div>
    );
  }

  // ===== EDITAR VIEW =====
  if (view === "editar" && selectedConta) {
    const c = selectedConta;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Editar pagamento</h1>
            <p className="text-xs text-muted-foreground">Início &gt; Contas a pagar &gt; Editar</p>
          </div>
        </div>

        <Tabs value={editTab} onValueChange={setEditTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="financeiro">Lançamento financeiro</TabsTrigger>
              <TabsTrigger value="outras">Outras informações</TabsTrigger>
              <TabsTrigger value="anexos">Anexos</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Adicionar com IA
            </Button>
          </div>

          <TabsContent value="financeiro" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4 border rounded-lg p-4">
                <h3 className="font-semibold flex items-center gap-2"><Edit className="h-4 w-4" /> Dados gerais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Descrição do pagamento * ℹ️</Label>
                    <Input value={descricao} onChange={e => setDescricao(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Vencimento *</Label>
                    <Input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Plano de contas *</Label>
                    <PlanoContasCombobox value={planoContas} onChange={setPlanoContas} tipoMovimentacao="Pagamentos" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Forma de pagamento *</Label>
                    <FormaPagamentoCombobox value={formaPagamento} onChange={(v, conta) => { setFormaPagamento(v); if (conta) setContaBancaria(conta); }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Conta bancária *</Label>
                    <ContaBancariaCombobox value={contaBancaria} onChange={setContaBancaria} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Pagamento quitado *</Label>
                    <Select value={pagamentoQuitado} onValueChange={setPagamentoQuitado}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao">Não</SelectItem>
                        <SelectItem value="sim">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data de compensação *</Label>
                    <Input type="date" value={dataCompensacao} onChange={e => setDataCompensacao(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" /> Valores</h3>
                <div className="space-y-1.5">
                  <Label>Valor bruto *</Label>
                  <Input value={valorBruto} onChange={e => setValorBruto(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Juros</Label>
                  <Input value={juros} onChange={e => setJuros(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Desconto</Label>
                  <Input value={desconto} onChange={e => setDesconto(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={ativarParcelamento} onCheckedChange={setAtivarParcelamento} />
                  <span className="text-sm">Ativar parcelamento/recorrência</span>
                </div>
                <p className="text-right font-bold text-lg">Total: {total(c.valor)}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => { setView("visualizar"); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <Button variant="outline">Continuar →</Button>
            </div>
          </TabsContent>

          <TabsContent value="outras" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Entidade</Label>
                <Select value={entidade} onValueChange={setEntidade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fornecedor">Fornecedor</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{entidade === "cliente" ? "Cliente" : "Fornecedor"}</Label>
                {entidade === "cliente" ? (
                  <ClienteCombobox value={fornecedor} onChange={setFornecedor} />
                ) : (
                  <FornecedorCombobox value={fornecedor} onChange={setFornecedor} />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Data de competência *</Label>
                <Input type="date" value={dataCompetencia} onChange={e => setDataCompetencia(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Informações complementares</Label>
              <Textarea rows={4} value={infoComplementares} onChange={e => setInfoComplementares(e.target.value)} />
            </div>
          </TabsContent>

          <TabsContent value="anexos" className="space-y-4 mt-4">
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
              Utilize este espaço para anexar comprovantes e documentos. Tamanho máximo 5Mb.
            </div>
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <p className="text-muted-foreground">Solte o arquivo aqui para fazer upload...</p>
              <p className="text-xs text-muted-foreground mt-1">ou</p>
              <Button variant="default" className="mt-3">
                <Upload className="h-4 w-4 mr-1" /> Selecionar arquivo
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { toast.success("Pagamento atualizado"); setView("list"); setSelectedConta(null); }}>
            <Check className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <Button variant="destructive" onClick={() => { setView("list"); setSelectedConta(null); }}>
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // ===== CONTAS FIXAS VIEW =====
  if (view === "fixas") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView("list")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <DollarSign className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Contas fixas</h1>
            <p className="text-xs text-muted-foreground">Início &gt; Contas a pagar &gt; Contas fixas &gt; Listar</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setEditingFixaId(null); setFixaDescricao(""); setFixaPlanoContas(""); setFixaCentroCusto(""); setFixaFormaPagamento(""); setFixaContaBancaria(""); setFixaValorBruto(""); setFixaJuros(""); setFixaDesconto(""); setShowAddFixaDialog(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
          <Button variant="outline" onClick={() => setShowBuscaAvancada(!showBuscaAvancada)}>
            <Search className="h-4 w-4 mr-1" /> Busca avançada
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
          As contas fixas são geradas automaticamente pelo sistema e passam a ser visualizadas no contas a pagar de acordo com a configuração feita pelo usuário.
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Plano de contas</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Gerar pagamento</TableHead>
                <TableHead>Próximo vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contasFixas.map(cf => (
                <TableRow key={cf.id}>
                  <TableCell className="font-medium">{cf.descricao}</TableCell>
                  <TableCell className="text-primary text-sm">{cf.entidade}</TableCell>
                  <TableCell>{cf.planoContas}</TableCell>
                  <TableCell>{cf.pagamento}</TableCell>
                  <TableCell>{cf.gerarPagamento}</TableCell>
                  <TableCell>{cf.proximoVencimento}</TableCell>
                  <TableCell>{total(cf.valor)}</TableCell>
                  <TableCell><Play className="h-4 w-4 text-muted-foreground" /></TableCell>
                  <TableCell>{cf.loja}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => {
                        setEditingFixaId(cf.id);
                        setFixaDescricao(cf.descricao);
                        setFixaPlanoContas(cf.planoContas);
                        setFixaCentroCusto("");
                        setFixaFormaPagamento(cf.pagamento);
                        setFixaContaBancaria("");
                        setFixaValorBruto(cf.valor.toString());
                        setFixaJuros("");
                        setFixaDesconto("");
                        setAddFixaTab("financeiro");
                        setShowAddFixaDialog(true);
                      }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => {
                        setContasFixas(prev => prev.filter(x => x.id !== cf.id));
                        toast.success("Conta fixa excluída");
                      }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-orange-500"><Minus className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Add Conta Fixa Dialog */}
        <Dialog open={showAddFixaDialog} onOpenChange={(open) => { setShowAddFixaDialog(open); if (!open) setEditingFixaId(null); }}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFixaId ? "Editar conta fixa" : "Adicionar conta fixa"}</DialogTitle>
              <p className="text-xs text-muted-foreground">Início &gt; Contas fixas &gt; {editingFixaId ? "Editar" : "Adicionar"}</p>
            </DialogHeader>

            <Tabs value={addFixaTab} onValueChange={setAddFixaTab}>
              <TabsList>
                <TabsTrigger value="financeiro">Lançamento financeiro</TabsTrigger>
                <TabsTrigger value="outras">Outras informações</TabsTrigger>
              </TabsList>

              <TabsContent value="financeiro" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4 border rounded-lg p-4">
                    <h3 className="font-semibold flex items-center gap-2"><Edit className="h-4 w-4" /> Dados gerais</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Descrição do pagamento *</Label>
                        <Input value={fixaDescricao} onChange={e => setFixaDescricao(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Plano de contas *</Label>
                        <PlanoContasCombobox value={fixaPlanoContas} onChange={setFixaPlanoContas} tipoMovimentacao="Pagamentos" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Ocorrência *</Label>
                        <Select value={fixaOcorrencia} onValueChange={setFixaOcorrencia}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mensal">A cada 1 mês</SelectItem>
                            <SelectItem value="bimestral">A cada 2 meses</SelectItem>
                            <SelectItem value="trimestral">A cada 3 meses</SelectItem>
                            <SelectItem value="semestral">A cada 6 meses</SelectItem>
                            <SelectItem value="anual">A cada 12 meses</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Próximo vencimento *</Label>
                        <Input type="date" value={fixaProximoVencimento} onChange={e => setFixaProximoVencimento(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Gerar pagamento *</Label>
                        <Select value={fixaGerarPagamento} onValueChange={setFixaGerarPagamento}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5_dias_antes">5 dias antes do vencimento</SelectItem>
                            <SelectItem value="no_dia">No dia do vencimento</SelectItem>
                            <SelectItem value="10_dias_antes">10 dias antes do vencimento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Quantas vezes *</Label>
                        <Select value={fixaQuantasVezes} onValueChange={setFixaQuantasVezes}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="para_sempre">Para sempre</SelectItem>
                            <SelectItem value="12">12 vezes</SelectItem>
                            <SelectItem value="24">24 vezes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Forma de pagamento *</Label>
                        <FormaPagamentoCombobox value={fixaFormaPagamento} onChange={(v, conta) => { setFixaFormaPagamento(v); if (conta) setFixaContaBancaria(conta); }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Conta bancária *</Label>
                      <ContaBancariaCombobox value={fixaContaBancaria} onChange={setFixaContaBancaria} />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" /> Valores</h3>
                    <div className="space-y-1.5">
                      <Label>Valor bruto *</Label>
                      <Input value={fixaValorBruto} onChange={e => setFixaValorBruto(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Juros</Label>
                      <Input value={fixaJuros} onChange={e => setFixaJuros(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Desconto</Label>
                      <Input value={fixaDesconto} onChange={e => setFixaDesconto(e.target.value)} />
                    </div>
                    <p className="text-right font-bold text-lg">Total: 0,00</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="outras" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Entidade</Label>
                    <Select value={entidade} onValueChange={setEntidade}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{entidade === "cliente" ? "Cliente" : "Fornecedor"}</Label>
                    {entidade === "cliente" ? (
                      <ClienteCombobox value={fornecedor} onChange={setFornecedor} />
                    ) : (
                      <FornecedorCombobox value={fornecedor} onChange={setFornecedor} />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data de competência *</Label>
                    <Input type="date" value={dataCompetencia} onChange={e => setDataCompetencia(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Informações complementares</Label>
                  <Textarea rows={4} value={infoComplementares} onChange={e => setInfoComplementares(e.target.value)} />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-2 mt-2">
              <Checkbox checked={fixaGerarProximaFatura} onCheckedChange={v => setFixaGerarProximaFatura(!!v)} />
              <span className="text-sm text-green-700 font-medium">Desejo gerar a próxima fatura agora mesmo!</span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                if (editingFixaId) {
                  setContasFixas(prev => prev.map(cf => cf.id === editingFixaId ? {
                    ...cf,
                    descricao: fixaDescricao,
                    planoContas: fixaPlanoContas,
                    pagamento: fixaFormaPagamento || cf.pagamento,
                    valor: Number(fixaValorBruto) || cf.valor,
                  } : cf));
                  toast.success("Conta fixa atualizada");
                } else {
                  setContasFixas(prev => [...prev, {
                    id: String(Date.now()),
                    descricao: fixaDescricao,
                    entidade: fornecedor,
                    planoContas: fixaPlanoContas,
                    pagamento: fixaFormaPagamento || "A COMBINAR",
                    gerarPagamento: fixaGerarPagamento === "no_dia" ? "No dia do vencimento" : "5 dias antes do vencimento",
                    proximoVencimento: fixaProximoVencimento ? new Date(fixaProximoVencimento).toLocaleDateString("pt-BR") : "------",
                    valor: Number(fixaValorBruto) || 0,
                    situacao: "▶",
                    loja: "DKA GERENCIAL",
                  }]);
                  toast.success("Conta fixa cadastrada");
                }
                setShowAddFixaDialog(false);
                setEditingFixaId(null);
              }}>
                <Check className="h-4 w-4 mr-1" /> {editingFixaId ? "Atualizar" : "Cadastrar"}
              </Button>
              <Button variant="destructive" onClick={() => { setShowAddFixaDialog(false); setEditingFixaId(null); }}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ===== LIST VIEW (default) =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Contas a pagar</h1>
            <p className="text-xs text-muted-foreground">Início &gt; Contas a pagar &gt; Listar</p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
          <Button variant="outline" className="border-orange-500 text-orange-600" onClick={() => setShowPagamentoLote(true)}>
            <DollarSign className="h-4 w-4 mr-1" /> Pagamento em Lote
          </Button>
          <Button variant="outline" className="border-primary text-primary" onClick={() => setView("fixas")}>
            <FileText className="h-4 w-4 mr-1" /> Contas fixas
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-1" /> Mais ações <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem><CheckCircle className="h-4 w-4 mr-2" /> Confirmar pagamentos</DropdownMenuItem>
              <DropdownMenuItem><XCircle className="h-4 w-4 mr-2" /> Cancelar pagamentos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView("fixas")}><FileText className="h-4 w-4 mr-2" /> Contas fixas</DropdownMenuItem>
              <DropdownMenuItem><ArrowLeftRight className="h-4 w-4 mr-2" /> Transferências entre contas</DropdownMenuItem>
              <DropdownMenuItem><FileDown className="h-4 w-4 mr-2" /> Importar extrato</DropdownMenuItem>
              <DropdownMenuItem><FileDown className="h-4 w-4 mr-2" /> Importar planilha</DropdownMenuItem>
              <DropdownMenuItem><FileUp className="h-4 w-4 mr-2" /> Exportar pagamentos</DropdownMenuItem>
              <DropdownMenuItem><Group className="h-4 w-4 mr-2" /> Agrupar</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Excluir pagamentos</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-amber-700 hover:bg-amber-800 text-white">
                Fevereiro de 2026 <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Hoje</DropdownMenuItem>
              <DropdownMenuItem>Esta semana</DropdownMenuItem>
              <DropdownMenuItem>Mês passado</DropdownMenuItem>
              <DropdownMenuItem>Este mês</DropdownMenuItem>
              <DropdownMenuItem>Próximo mês</DropdownMenuItem>
              <DropdownMenuItem>Todo o período</DropdownMenuItem>
              <DropdownMenuItem>Escolha o período</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="bg-foreground text-background hover:bg-foreground/90" onClick={() => setShowBuscaAvancada(!showBuscaAvancada)}>
            <Search className="h-4 w-4 mr-1" /> Busca avançada
          </Button>
        </div>
      </div>

      {/* Advanced Search */}
      {showBuscaAvancada && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>Loja</Label>
                <Select value={buscaLoja} onValueChange={setBuscaLoja}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="todas">DKA GERENCIAL</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Código</Label>
                <Input value={buscaCodigo} onChange={e => setBuscaCodigo(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Plano de contas</Label>
                <Select value={buscaPlanoContas} onValueChange={setBuscaPlanoContas}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="todos">Todos</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Input value={buscaDescricao} onChange={e => setBuscaDescricao(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Entidade</Label>
                <Select value={buscaEntidade} onValueChange={setBuscaEntidade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fornecedor">Fornecedor</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fornecedor</Label>
                <FornecedorCombobox value={buscaFornecedor} onChange={setBuscaFornecedor} placeholder="Todos" />
              </div>
              <div className="space-y-1.5">
                <Label>Período</Label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={buscaDataInicio} onChange={e => setBuscaDataInicio(e.target.value)} />
                  <span className="text-xs text-muted-foreground">a</span>
                  <Input type="date" value={buscaDataFim} onChange={e => setBuscaDataFim(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Valor</Label>
                <div className="flex items-center gap-2">
                  <Input value={buscaValorInicio} onChange={e => setBuscaValorInicio(e.target.value)} />
                  <span className="text-xs text-muted-foreground">a</span>
                  <Input value={buscaValorFim} onChange={e => setBuscaValorFim(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Situação</Label>
                <Select value={buscaSituacao} onValueChange={setBuscaSituacao}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="todas">Todas</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Conta bancária</Label>
                <ContaBancariaCombobox value={buscaContaBancaria === "todos" ? "" : buscaContaBancaria} onChange={(v) => setBuscaContaBancaria(v || "todos")} placeholder="Todos" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Forma de pagamento</Label>
                <FormaPagamentoCombobox value={buscaFormaPagamento === "todos" ? "" : buscaFormaPagamento} onChange={(v) => setBuscaFormaPagamento(v || "todos")} placeholder="Todos" />
              </div>
              <div className="space-y-1.5">
                <Label>NF-e</Label>
                <Input value={buscaNfe} onChange={e => setBuscaNfe(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="bg-green-600 hover:bg-green-700 text-white"><Check className="h-4 w-4 mr-1" /> Buscar</Button>
              <Button variant="destructive"><X className="h-4 w-4 mr-1" /> Limpar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <Card className="border-t-4 border-t-red-600">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-red-600">Vencidos</p>
              <ExternalLink className="h-3.5 w-3.5 text-red-600" />
            </div>
            <p className="text-xl font-bold text-red-600 mt-1">0,00</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-orange-500">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-orange-500">Vencem hoje</p>
              <ExternalLink className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <p className="text-xl font-bold text-orange-500 mt-1">0,00</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-blue-500">A vencer</p>
              <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <p className="text-xl font-bold text-blue-500 mt-1">0,00</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-green-600">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-green-600">Pagos</p>
              <ExternalLink className="h-3.5 w-3.5 text-green-600" />
            </div>
            <p className="text-xl font-bold text-green-600 mt-1">0,00</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-semibold">Total</p>
            <p className="text-xl font-bold mt-1">0,00</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"><Checkbox /></TableHead>
              <TableHead>Nº</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Plano de contas</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>NF-e</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contasList.map(c => (
              <TableRow key={c.id}>
                <TableCell><Checkbox checked={selectedContas.includes(c.id)} onCheckedChange={() => toggleConta(c.id)} /></TableCell>
                <TableCell>{c.numero}</TableCell>
                <TableCell className="font-medium">{c.descricao}</TableCell>
                <TableCell className="text-primary text-sm max-w-[200px]">{c.entidade}</TableCell>
                <TableCell>{c.planoContas}</TableCell>
                <TableCell>{c.pagamento}</TableCell>
                <TableCell>{c.data}</TableCell>
                <TableCell>{c.nfe}</TableCell>
                <TableCell>
                  <Badge className={situacaoColor(c.situacao)}>{c.situacao}</Badge>
                </TableCell>
                <TableCell className="font-medium">{total(c.valor)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" onClick={() => openVisualizar(c)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => openEditar(c)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => toast.success("Pagamento excluído")}><Trash2 className="h-3.5 w-3.5" /></Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-orange-500"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info("Confirmação cancelada")}>
                          <X className="h-4 w-4 mr-2" /> Cancelar confirmação
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => printRecibo({
                          tipo: "pagamento",
                          numero: c.numero,
                          descricao: c.descricao,
                          entidade: c.entidade,
                          formaPagamento: c.pagamento,
                          contaBancaria: c.contaBancaria,
                          valor: c.valor,
                          valorBruto: c.valorBruto,
                          desconto: c.desconto,
                          juros: c.juros,
                          dataVencimento: c.data,
                          dataConfirmacao: c.dataConfirmacao,
                          confirmadoPor: c.confirmadoPor,
                          cadastradoPor: c.cadastradoPor,
                        })}>
                          <Printer className="h-4 w-4 mr-2" /> Imprimir recibo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const texto = `📄 *COMPROVANTE DE PAGAMENTO*\n\n` +
                            `Nº ${String(c.numero).padStart(5, "0")}\n` +
                            `📋 *Descrição:* ${c.descricao}\n` +
                            `👤 *Entidade:* ${c.entidade}\n` +
                            `💰 *Valor:* R$ ${c.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
                            `💳 *Pagamento:* ${c.pagamento}\n` +
                            `🏦 *Conta:* ${c.contaBancaria}\n` +
                            `📅 *Vencimento:* ${c.data}\n` +
                            (c.dataConfirmacao ? `✅ *Confirmado em:* ${c.dataConfirmacao}\n` : "") +
                            (c.confirmadoPor ? `👤 *Confirmado por:* ${c.confirmadoPor}\n` : "");
                          const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
                          window.open(url, "_blank");
                        }}>
                          <MessageCircle className="h-4 w-4 mr-2" /> Enviar via WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success("Pagamento duplicado")}>
                          <Copy className="h-4 w-4 mr-2" /> Duplicar pagamento
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar pagamento</DialogTitle>
            <p className="text-xs text-muted-foreground">Início &gt; Contas a pagar &gt; Adicionar</p>
          </DialogHeader>

          <Tabs value={addTab} onValueChange={setAddTab}>
            <TabsList>
              <TabsTrigger value="financeiro">Lançamento financeiro</TabsTrigger>
              <TabsTrigger value="outras">Outras informações</TabsTrigger>
              <TabsTrigger value="anexos">Anexos</TabsTrigger>
            </TabsList>

            <TabsContent value="financeiro" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4 border rounded-lg p-4">
                  <h3 className="font-semibold flex items-center gap-2"><Edit className="h-4 w-4" /> Dados gerais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Descrição do pagamento * ℹ️</Label>
                      <Input value={descricao} onChange={e => setDescricao(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Vencimento *</Label>
                      <Input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Plano de contas *</Label>
                      <PlanoContasCombobox value={planoContas} onChange={setPlanoContas} tipoMovimentacao="Pagamentos" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Forma de pagamento *</Label>
                      <FormaPagamentoCombobox value={formaPagamento} onChange={(v, conta) => { setFormaPagamento(v); if (conta) setContaBancaria(conta); }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Conta bancária *</Label>
                      <ContaBancariaCombobox value={contaBancaria} onChange={setContaBancaria} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Pagamento quitado *</Label>
                      <Select value={pagamentoQuitado} onValueChange={setPagamentoQuitado}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao">Não</SelectItem>
                          <SelectItem value="sim">Sim</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Data de compensação</Label>
                      <Input type="date" value={dataCompensacao} onChange={e => setDataCompensacao(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" /> Valores</h3>
                  <div className="space-y-1.5">
                    <Label>Valor bruto *</Label>
                    <Input value={valorBruto} onChange={e => setValorBruto(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Juros</Label>
                    <Input value={juros} onChange={e => setJuros(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Desconto</Label>
                    <Input value={desconto} onChange={e => setDesconto(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={ativarParcelamento} onCheckedChange={setAtivarParcelamento} />
                    <span className="text-sm">Ativar parcelamento/recorrência</span>
                  </div>
                  <p className="text-right font-bold text-lg">Total: 0,00</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="outras" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Entidade</Label>
                  <Select value={entidade} onValueChange={setEntidade}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fornecedor">Fornecedor</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{entidade === "cliente" ? "Cliente" : "Fornecedor"}</Label>
                  {entidade === "cliente" ? (
                    <ClienteCombobox value={fornecedor} onChange={setFornecedor} />
                  ) : (
                    <FornecedorCombobox value={fornecedor} onChange={setFornecedor} />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Data de competência *</Label>
                  <Input type="date" value={dataCompetencia} onChange={e => setDataCompetencia(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Informações complementares</Label>
                <Textarea rows={4} value={infoComplementares} onChange={e => setInfoComplementares(e.target.value)} />
              </div>
            </TabsContent>

            <TabsContent value="anexos" className="space-y-4 mt-4">
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                Utilize este espaço para anexar comprovantes e documentos. Tamanho máximo 5Mb. (PDF, JPG, PNG)
              </div>
              {anexos.length > 0 && (
                <div className="space-y-2">
                  {anexos.map((a, i) => (
                    <div key={i} className="flex items-center justify-between border rounded p-2">
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline truncate">{a.name}</a>
                      <Button variant="ghost" size="icon" onClick={() => setAnexos(anexos.filter((_, idx) => idx !== i))}><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
              <div
                className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) await handleFileUpload(f); }}
              >
                <p className="text-muted-foreground">Solte o arquivo aqui para fazer upload...</p>
                <p className="text-xs text-muted-foreground mt-1">ou</p>
                <input ref={fileInputRef2} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleFileUpload(f); e.target.value = ""; }} />
                <Button variant="default" className="mt-3" onClick={() => fileInputRef2.current?.click()}>
                  <Upload className="h-4 w-4 mr-1" /> Selecionar arquivo
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-2">
            <Button className="bg-green-600 hover:bg-green-700 text-white"><Check className="h-4 w-4 mr-1" /> Cadastrar</Button>
            <Button variant="destructive" onClick={() => setShowAddDialog(false)}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <PagamentoLoteDialog
        open={showPagamentoLote}
        onOpenChange={setShowPagamentoLote}
        contas={contasList.map(c => ({ id: c.id, numero: c.numero, descricao: c.descricao, entidade: c.entidade, pagamento: c.pagamento, contaBancaria: c.contaBancaria, data: c.data, situacao: c.situacao, valor: c.valor }))}
        onConfirmar={(ids, fp, cb, dt) => {
          setContasList(prev => prev.map(c =>
            ids.includes(c.id) ? { ...c, situacao: "Confirmado" as const, pagamento: fp, contaBancaria: cb, dataConfirmacao: dt, confirmadoPor: "SISTEMA" } : c
          ));
          toast.success(`${ids.length} pagamento(s) confirmado(s) em lote!`);
        }}
      />
    </div>
  );
}
