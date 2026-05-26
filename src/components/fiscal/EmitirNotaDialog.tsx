import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface ItemNota {
  descricao: string;
  codigo: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  origem: string;
  csosn: string;
  cstIcms: string;
  aliquotaIcms: string;
  cstPis: string;
  aliquotaPis: string;
  cstCofins: string;
  aliquotaCofins: string;
}

interface EmitirNotaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const defaultItem = (): ItemNota => ({
  descricao: "", codigo: "", ncm: "", cfop: "5102", unidade: "UN",
  quantidade: 1, valorUnitario: 0, origem: "0", csosn: "400",
  cstIcms: "0", aliquotaIcms: "18", cstPis: "7", aliquotaPis: "0.65",
  cstCofins: "7", aliquotaCofins: "3",
});

type PollingStatus = "idle" | "polling" | "authorized" | "rejected" | "error";

export default function EmitirNotaDialog({ open, onOpenChange, onSuccess }: EmitirNotaDialogProps) {
  const [modo, setModo] = useState<"simplificado" | "completo">("simplificado");
  const [tipo, setTipo] = useState<"nfe" | "nfce" | "nfse">("nfe");
  const [emitindo, setEmitindo] = useState(false);
  const [dest, setDest] = useState({
    tipo: "fisica" as "fisica" | "juridica",
    nome: "", cpfCnpj: "", email: "", ie: "",
    logradouro: "", numero: "", bairro: "", cidade: "", uf: "", cep: "",
  });
  const [itens, setItens] = useState<ItemNota[]>([defaultItem()]);
  const [observacoes, setObservacoes] = useState("");
  const [integrationId, setIntegrationId] = useState("");

  // NFS-e specific
  const [federalServiceCode, setFederalServiceCode] = useState("1.07");
  const [cityServiceCode, setCityServiceCode] = useState("");
  const [taxationType, setTaxationType] = useState("taxationInMunicipality");
  const [issRate, setIssRate] = useState("5");
  const [issWithheld, setIssWithheld] = useState(false);
  const [descricaoServico, setDescricaoServico] = useState("");

  // NF-e specific
  const [presenceType, setPresenceType] = useState("internet");
  const [destination, setDestination] = useState("internal");
  const [formaPagamento, setFormaPagamento] = useState("01");
  const [paymentMethodOrder, setPaymentMethodOrder] = useState("pix");

  // Polling
  const [pollingStatus, setPollingStatus] = useState<PollingStatus>("idle");
  const [pollingMessage, setPollingMessage] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingCountRef = useRef(0);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const valorTotal = itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);

  const addItem = () => setItens([...itens, defaultItem()]);
  const removeItem = (idx: number) => { if (itens.length > 1) setItens(itens.filter((_, i) => i !== idx)); };
  const updateItem = (idx: number, field: keyof ItemNota, value: any) => {
    setItens(itens.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const startPolling = (spedyNotaId: string, tipoNota: string) => {
    setPollingStatus("polling");
    setPollingMessage("Enviando para processamento...");
    pollingCountRef.current = 0;

    pollingRef.current = setInterval(async () => {
      pollingCountRef.current++;
      if (pollingCountRef.current > 12) {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        setPollingStatus("idle");
        setPollingMessage("Tempo esgotado. A nota será atualizada via webhook.");
        return;
      }

      try {
        const endpointPath = tipoNota === "nfse" ? "service-invoices" : "product-invoices";
        const { data, error } = await supabase.functions.invoke("spedy-proxy", {
          body: {
            operacao: "consultar-status",
            tipo: tipoNota,
            notaId: spedyNotaId,
          },
        });

        if (error) return;

        const status = data?.status;
        const detail = data?.processingDetail;

        if (status === "enqueued" || status === "created" || status === "received") {
          setPollingMessage("Na fila de processamento...");
        } else if (status === "authorized") {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setPollingStatus("authorized");
          setPollingMessage(`✅ Nota autorizada! Nº ${data?.number || ""}`);
          onSuccess?.();
        } else if (status === "rejected") {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setPollingStatus("rejected");
          setPollingMessage(`❌ Rejeitada: ${detail?.message || "Verifique os dados"} (Código: ${detail?.code || "N/A"})`);
        } else if (status === "canceled" || status === "denied") {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setPollingStatus("error");
          setPollingMessage(`⚠️ Status: ${status} — ${detail?.message || ""}`);
        }
      } catch {
        // continue polling
      }
    }, 5000);
  };

  const resetForm = () => {
    setDest({ tipo: "fisica", nome: "", cpfCnpj: "", email: "", ie: "", logradouro: "", numero: "", bairro: "", cidade: "", uf: "", cep: "" });
    setItens([defaultItem()]);
    setObservacoes("");
    setIntegrationId("");
    setDescricaoServico("");
    setPollingStatus("idle");
    setPollingMessage("");
  };

  const handleEmitir = async () => {
    if (!dest.nome || !dest.cpfCnpj) {
      toast.error("Preencha o nome e CPF/CNPJ do destinatário");
      return;
    }
    if (itens.some((i) => !i.descricao || i.valorUnitario <= 0)) {
      toast.error("Preencha todos os itens corretamente");
      return;
    }

    setEmitindo(true);
    try {
      const dadosBase: any = {
        destinatario: {
          tipo: dest.tipo,
          nome: dest.nome,
          cpfCnpj: dest.cpfCnpj.replace(/\D/g, ""),
          email: dest.email || undefined,
          ie: dest.ie || undefined,
        },
        itens: itens.map((item, idx) => ({
          numeroItem: idx + 1,
          codigo: item.codigo || `ITEM${idx + 1}`,
          descricao: item.descricao,
          ncm: item.ncm || "00000000",
          cfop: item.cfop,
          unidade: item.unidade,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          valorTotal: item.quantidade * item.valorUnitario,
          origem: item.origem,
          csosn: item.csosn,
          cstIcms: item.cstIcms,
          aliquotaIcms: item.aliquotaIcms,
          cstPis: item.cstPis,
          aliquotaPis: item.aliquotaPis,
          cstCofins: item.cstCofins,
          aliquotaCofins: item.aliquotaCofins,
        })),
        valorProdutos: tipo !== "nfse" ? valorTotal : 0,
        valorServicos: tipo === "nfse" ? valorTotal : 0,
        valorTotal,
        observacoes,
      };

      if (integrationId) dadosBase.integrationId = integrationId;

      // Add address
      if (dest.logradouro) {
        dadosBase.destinatario.endereco = {
          logradouro: dest.logradouro,
          numero: dest.numero,
          bairro: dest.bairro,
          cidade: dest.cidade,
          uf: dest.uf,
          cep: dest.cep.replace(/\D/g, ""),
        };
      }

      let operacao: string;

      if (modo === "simplificado") {
        operacao = "emitir-order";
        dadosBase.paymentMethod = paymentMethodOrder;
      } else {
        operacao = "emitir";
        if (tipo === "nfse") {
          dadosBase.federalServiceCode = federalServiceCode;
          dadosBase.cityServiceCode = cityServiceCode;
          dadosBase.taxationType = taxationType;
          dadosBase.issRate = parseFloat(issRate) / 100;
          dadosBase.issWithheld = issWithheld;
          dadosBase.descricaoServico = descricaoServico;
        } else {
          dadosBase.presenceType = presenceType;
          dadosBase.destination = destination;
          dadosBase.formaPagamento = formaPagamento;
        }
      }

      const { data, error } = await supabase.functions.invoke("spedy-proxy", {
        body: { operacao, tipo, dados: dadosBase },
      });

      if (error) throw new Error(error.message);

      const spedyId = data?.id || data?.invoices?.[0]?.id;
      if (spedyId) {
        toast.success("Nota fiscal enviada para processamento!");
        startPolling(spedyId, tipo);
      } else {
        const errMsg = data?.errors?.[0]?.message || data?.message || data?.error || "Erro ao emitir nota";
        throw new Error(errMsg);
      }
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Falha na emissão"));
    }
    setEmitindo(false);
  };

  const isPollingActive = pollingStatus === "polling";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isPollingActive) { onOpenChange(v); if (!v) resetForm(); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Emitir Nota Fiscal</DialogTitle>
        </DialogHeader>

        {/* Polling status banner */}
        {pollingStatus !== "idle" && (
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
            pollingStatus === "polling" ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" :
            pollingStatus === "authorized" ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" :
            "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}>
            {pollingStatus === "polling" && <Loader2 className="h-4 w-4 animate-spin" />}
            {pollingStatus === "authorized" && <CheckCircle2 className="h-4 w-4" />}
            {(pollingStatus === "rejected" || pollingStatus === "error") && <XCircle className="h-4 w-4" />}
            <span>{pollingMessage}</span>
          </div>
        )}

        {pollingStatus !== "authorized" && (
          <div className="space-y-6">
            {/* Mode selector */}
            <Tabs value={modo} onValueChange={(v: any) => setModo(v)}>
              <TabsList className="w-full">
                <TabsTrigger value="simplificado" className="flex-1">Simplificado (Orders)</TabsTrigger>
                <TabsTrigger value="completo" className="flex-1">Completo (NF-e/NFS-e)</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Tipo */}
            {modo === "completo" && (
              <div>
                <Label>Tipo de Nota</Label>
                <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nfe">NF-e (Produtos)</SelectItem>
                    <SelectItem value="nfce">NFC-e (Consumidor)</SelectItem>
                    <SelectItem value="nfse">NFS-e (Serviços)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Integration ID */}
            <div>
              <Label className="text-xs">ID de Integração (opcional — vincula a venda/OS)</Label>
              <Input value={integrationId} onChange={(e) => setIntegrationId(e.target.value)} placeholder="Ex: VENDA-001, OS-123" />
            </div>

            {/* Destinatário */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Destinatário / Cliente</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo Pessoa</Label>
                  <Select value={dest.tipo} onValueChange={(v: any) => setDest({ ...dest, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fisica">Pessoa Física</SelectItem>
                      <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{dest.tipo === "fisica" ? "CPF" : "CNPJ"} *</Label>
                  <Input value={dest.cpfCnpj} onChange={(e) => setDest({ ...dest, cpfCnpj: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome / Razão Social *</Label>
                  <Input value={dest.nome} onChange={(e) => setDest({ ...dest, nome: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={dest.email} onChange={(e) => setDest({ ...dest, email: e.target.value })} />
                </div>
              </div>
              {modo === "completo" && dest.tipo === "juridica" && (
                <div>
                  <Label>Inscrição Estadual</Label>
                  <Input value={dest.ie} onChange={(e) => setDest({ ...dest, ie: e.target.value })} />
                </div>
              )}
              {(modo === "completo" && tipo !== "nfce") && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Logradouro</Label>
                      <Input value={dest.logradouro} onChange={(e) => setDest({ ...dest, logradouro: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Número</Label>
                      <Input value={dest.numero} onChange={(e) => setDest({ ...dest, numero: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Bairro</Label>
                      <Input value={dest.bairro} onChange={(e) => setDest({ ...dest, bairro: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Cidade</Label>
                      <Input value={dest.cidade} onChange={(e) => setDest({ ...dest, cidade: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">UF</Label>
                      <Input value={dest.uf} maxLength={2} onChange={(e) => setDest({ ...dest, uf: e.target.value.toUpperCase() })} />
                    </div>
                    <div>
                      <Label className="text-xs">CEP</Label>
                      <Input value={dest.cep} onChange={(e) => setDest({ ...dest, cep: e.target.value })} />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* NFS-e specific fields */}
            {modo === "completo" && tipo === "nfse" && (
              <div className="space-y-3 border rounded-lg p-3">
                <h3 className="font-semibold text-sm">Dados do Serviço (NFS-e)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Código Serviço LC 116/03</Label>
                    <Input value={federalServiceCode} onChange={(e) => setFederalServiceCode(e.target.value)} placeholder="Ex: 1.07" />
                  </div>
                  <div>
                    <Label className="text-xs">Código Serviço Municipal</Label>
                    <Input value={cityServiceCode} onChange={(e) => setCityServiceCode(e.target.value)} placeholder="Ex: 0107" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Tributação ISS</Label>
                    <Select value={taxationType} onValueChange={setTaxationType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="taxationInMunicipality">No município</SelectItem>
                        <SelectItem value="taxationOutsideMunicipality">Fora do município</SelectItem>
                        <SelectItem value="exemption">Isento</SelectItem>
                        <SelectItem value="exportation">Exportação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Alíquota ISS (%)</Label>
                    <Input type="number" step="0.01" value={issRate} onChange={(e) => setIssRate(e.target.value)} />
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={issWithheld} onChange={(e) => setIssWithheld(e.target.checked)} />
                      ISS retido na fonte
                    </label>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Discriminação dos Serviços</Label>
                  <Textarea value={descricaoServico} onChange={(e) => setDescricaoServico(e.target.value)} rows={3}
                    placeholder="Descreva os serviços prestados..." />
                </div>
              </div>
            )}

            {/* NF-e specific fields */}
            {modo === "completo" && tipo !== "nfse" && (
              <div className="space-y-3 border rounded-lg p-3">
                <h3 className="font-semibold text-sm">Configuração NF-e</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Presença</Label>
                    <Select value={presenceType} onValueChange={setPresenceType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internet">Internet</SelectItem>
                        <SelectItem value="presence">Presencial</SelectItem>
                        <SelectItem value="telephone">Telefone</SelectItem>
                        <SelectItem value="delivery">Entrega</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Destino</Label>
                    <Select value={destination} onValueChange={setDestination}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Interna (mesmo estado)</SelectItem>
                        <SelectItem value="interstate">Interestadual</SelectItem>
                        <SelectItem value="international">Exportação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Forma Pagamento</Label>
                    <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="01">Dinheiro</SelectItem>
                        <SelectItem value="02">Cheque</SelectItem>
                        <SelectItem value="03">Cartão Crédito</SelectItem>
                        <SelectItem value="04">Cartão Débito</SelectItem>
                        <SelectItem value="15">Boleto</SelectItem>
                        <SelectItem value="17">PIX</SelectItem>
                        <SelectItem value="99">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Payment for simplified mode */}
            {modo === "simplificado" && (
              <div>
                <Label className="text-xs">Forma de Pagamento</Label>
                <Select value={paymentMethodOrder} onValueChange={setPaymentMethodOrder}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="creditCard">Cartão de Crédito</SelectItem>
                    <SelectItem value="debitCard">Cartão de Débito</SelectItem>
                    <SelectItem value="billetBank">Boleto</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="bankTransfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Itens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{tipo === "nfse" && modo === "completo" ? "Serviços" : "Itens"}</h3>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
              </div>
              {itens.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                    {itens.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeItem(idx)}><Trash2 className="h-3 w-3" /></Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Descrição *</Label>
                      <Input value={item.descricao} onChange={(e) => updateItem(idx, "descricao", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Código</Label>
                      <Input value={item.codigo} onChange={(e) => updateItem(idx, "codigo", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {modo === "completo" && tipo !== "nfse" && (
                      <div>
                        <Label className="text-xs">NCM</Label>
                        <Input value={item.ncm} onChange={(e) => updateItem(idx, "ncm", e.target.value)} />
                      </div>
                    )}
                    {modo === "completo" && (
                      <div>
                        <Label className="text-xs">CFOP</Label>
                        <Input value={item.cfop} onChange={(e) => updateItem(idx, "cfop", e.target.value)} />
                      </div>
                    )}
                    <div>
                      <Label className="text-xs">Qtd</Label>
                      <Input type="number" min={1} value={item.quantidade} onChange={(e) => updateItem(idx, "quantidade", parseFloat(e.target.value) || 1)} />
                    </div>
                    <div>
                      <Label className="text-xs">Valor Unit.</Label>
                      <Input type="number" step="0.01" min={0} value={item.valorUnitario} onChange={(e) => updateItem(idx, "valorUnitario", parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>

                  {/* Tax fields for complete mode NF-e */}
                  {modo === "completo" && tipo !== "nfse" && (
                    <div className="grid grid-cols-4 gap-2 pt-1 border-t">
                      <div>
                        <Label className="text-xs">Origem</Label>
                        <Select value={item.origem} onValueChange={(v) => updateItem(idx, "origem", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0 - Nacional</SelectItem>
                            <SelectItem value="1">1 - Import. direta</SelectItem>
                            <SelectItem value="2">2 - Import. interna</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">CSOSN</Label>
                        <Select value={item.csosn} onValueChange={(v) => updateItem(idx, "csosn", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="101">101 - c/ crédito</SelectItem>
                            <SelectItem value="400">400 - s/ crédito</SelectItem>
                            <SelectItem value="500">500 - ICMS ST</SelectItem>
                            <SelectItem value="900">900 - Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">CST PIS</Label>
                        <Input className="h-8 text-xs" value={item.cstPis} onChange={(e) => updateItem(idx, "cstPis", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">CST COFINS</Label>
                        <Input className="h-8 text-xs" value={item.cstCofins} onChange={(e) => updateItem(idx, "cstCofins", e.target.value)} />
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-right text-muted-foreground">
                    Subtotal: R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Observações */}
            <div>
              <Label>Observações / Info. Adicionais</Label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-semibold">Valor Total:</span>
              <span className="text-xl font-bold">R$ {valorTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {pollingStatus === "authorized" ? (
            <Button onClick={() => { onOpenChange(false); resetForm(); }}>Fechar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }} disabled={isPollingActive}>Cancelar</Button>
              <Button onClick={handleEmitir} disabled={emitindo || isPollingActive} className="bg-green-600 hover:bg-green-700 text-white">
                {emitindo ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Emitindo...</> :
                 isPollingActive ? <><Clock className="h-4 w-4 mr-2 animate-pulse" /> Aguardando...</> :
                 modo === "simplificado" ? "Emitir via Orders" : `Emitir ${tipo.toUpperCase()}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
