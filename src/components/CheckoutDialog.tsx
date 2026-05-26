import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, QrCode, FileText, CreditCard, Package, Ticket } from "lucide-react";

interface CartItem {
  id: string;
  nome: string;
  preco: number;
  imagem_url?: string | null;
  quantidade: number;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  onClearCart: () => void;
  /** Legacy single-product support */
  produto?: { nome: string; preco: number } | null;
  /** Optional roulette coupon to auto-apply */
  cupom?: { code: string; label: string; tipo: "desconto" | "produto"; valor: number } | null;
  /** Callback to remove the roulette coupon */
  onRemoveCupom?: () => void;
  /** Validate & apply a coupon code typed by the user. Returns true on success. */
  onApplyCupomCode?: (code: string) => boolean;
}

type FormaPagamento = "PIX" | "BOLETO" | "CREDIT_CARD";

const PIX_DISCOUNT = 0.03;
const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CheckoutDialog({ open, onOpenChange, cart = [], onClearCart, produto, cupom, onRemoveCupom, onApplyCupomCode }: CheckoutDialogProps) {
  const [cupomInput, setCupomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [forma, setForma] = useState<FormaPagamento>("PIX");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [step, setStep] = useState<"dados" | "resultado">("dados");

  // Build items list from cart or legacy single product
  const items = cart.length > 0
    ? cart
    : produto
      ? [{ id: "single", nome: produto.nome, preco: produto.preco, quantidade: 1, imagem_url: null }]
      : [];

  const subtotalBruto = items.reduce((sum, i) => sum + i.preco * i.quantidade, 0);
  const cupomDescontoPct = cupom?.tipo === "desconto" ? Number(cupom.valor) || 0 : 0;
  const cupomDescontoValor = subtotalBruto * (cupomDescontoPct / 100);
  const subtotal = Math.max(0, subtotalBruto - cupomDescontoValor);
  const totalPix = subtotal * (1 - PIX_DISCOUNT);

  const resetForm = () => {
    setStep("dados");
    setNome("");
    setCpf("");
    setEmail("");
    setTelefone("");
    setResultado(null);
  };

  const handleClose = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const handlePagar = async () => {
    if (!nome || !cpf) {
      toast.error("Preencha nome e CPF/CNPJ");
      return;
    }
    if (items.length === 0) return;

    setLoading(true);
    try {
      const { data: clienteRes, error: clienteErr } = await supabase.functions.invoke("asaas-payment", {
        body: { action: "criar_cliente", nome, cpfCnpj: cpf, email, telefone },
      });
      if (clienteErr) throw clienteErr;
      if (!clienteRes?.success) throw new Error(clienteRes?.error || "Erro ao criar cliente");

      const baseDesc = items.length === 1
        ? items[0].nome
        : `${items.length} itens - DKA Motos`;
      const descricao = cupom
        ? `${baseDesc} | Cupom ${cupom.code} (${cupom.tipo === "desconto" ? `-${cupomDescontoPct}%` : `Brinde: ${cupom.label}`})`
        : baseDesc;

      const { data: cobrancaRes, error: cobrancaErr } = await supabase.functions.invoke("asaas-payment", {
        body: {
          action: "criar_cobranca",
          customerId: clienteRes.cliente.id,
          valor: forma === "PIX" ? totalPix : subtotal,
          descricao,
          formaPagamento: forma,
        },
      });
      if (cobrancaErr) throw cobrancaErr;
      if (!cobrancaRes?.success) throw new Error(cobrancaRes?.error || "Erro ao criar cobrança");

      setResultado(cobrancaRes);
      setStep("resultado");
      toast.success("Cobrança criada com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao processar pagamento: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const formas: { key: FormaPagamento; label: string; icon: React.ReactNode }[] = [
    { key: "PIX", label: "Pix", icon: <QrCode className="h-4 w-4" /> },
    { key: "BOLETO", label: "Boleto", icon: <FileText className="h-4 w-4" /> },
    { key: "CREDIT_CARD", label: "Cartão", icon: <CreditCard className="h-4 w-4" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar Compra</DialogTitle>
        </DialogHeader>

        {/* Cart summary */}
        {items.length > 0 && (
          <div className="space-y-2">
            {items.length <= 3 ? (
              items.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-secondary/30 p-2.5 flex items-center gap-2">
                  <div className="h-10 w-10 rounded bg-white flex items-center justify-center shrink-0 overflow-hidden">
                    {item.imagem_url ? (
                      <img src={item.imagem_url} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.nome}</p>
                    <p className="text-[10px] text-muted-foreground">Qtd: {item.quantidade}</p>
                  </div>
                  <span className="text-primary font-bold text-sm shrink-0">
                    R$ {fmt(item.preco * item.quantidade)}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <p className="text-sm font-medium">{items.length} itens no carrinho</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {items.map(i => `${i.quantidade}x ${i.nome.substring(0, 25)}...`).join(", ")}
                </p>
              </div>
            )}
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-muted-foreground">Subtotal</span>
              <span className="text-sm font-medium">R$ {fmt(subtotalBruto)}</span>
            </div>
            {cupom && cupom.tipo === "desconto" && cupomDescontoValor > 0 && (
              <div className="flex justify-between items-center px-1 gap-2">
                <span className="text-xs text-emerald-500 font-medium flex items-center gap-1 min-w-0">
                  <span className="truncate">🎁 Cupom {cupom.code} (-{cupomDescontoPct}%)</span>
                  {onRemoveCupom && (
                    <button
                      onClick={onRemoveCupom}
                      className="shrink-0 w-4 h-4 rounded-full bg-emerald-500/15 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-colors"
                      aria-label="Remover cupom"
                      title="Remover cupom"
                    >
                      <span className="text-[9px] font-bold leading-none">✕</span>
                    </button>
                  )}
                </span>
                <span className="text-sm font-bold text-emerald-500">- R$ {fmt(cupomDescontoValor)}</span>
              </div>
            )}
            {cupom && cupom.tipo === "produto" && (
              <div className="flex justify-between items-center px-1 gap-2">
                <span className="text-xs text-emerald-500 font-medium flex items-center gap-1 min-w-0">
                  <span className="truncate">🎁 Brinde: {cupom.label}</span>
                  {onRemoveCupom && (
                    <button
                      onClick={onRemoveCupom}
                      className="shrink-0 w-4 h-4 rounded-full bg-emerald-500/15 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-colors"
                      aria-label="Remover brinde"
                      title="Remover brinde"
                    >
                      <span className="text-[9px] font-bold leading-none">✕</span>
                    </button>
                  )}
                </span>
                <span className="text-sm font-bold text-emerald-500">GRÁTIS</span>
              </div>
            )}

            {/* Coupon input — only when no coupon is applied */}
            {!cupom && onApplyCupomCode && (
              <div className="rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/5 p-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Ticket className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wide">Tem um cupom?</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={cupomInput}
                    onChange={(e) => setCupomInput(e.target.value.toUpperCase())}
                    placeholder="Cole o código (ex: DESC2-XXXX)"
                    className="h-9 text-xs font-mono uppercase"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const ok = onApplyCupomCode(cupomInput.trim());
                        if (ok) { setCupomInput(""); toast.success("Cupom aplicado!"); }
                        else toast.error("Cupom inválido ou expirado");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                    onClick={() => {
                      const ok = onApplyCupomCode(cupomInput.trim());
                      if (ok) { setCupomInput(""); toast.success("Cupom aplicado!"); }
                      else toast.error("Cupom inválido ou expirado");
                    }}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-primary font-medium">
                Total {forma === "PIX" ? "no PIX" : forma === "BOLETO" ? "no Boleto" : "no Cartão"}
              </span>
              <span className="text-lg font-bold text-primary">
                R$ {fmt(forma === "PIX" ? totalPix : subtotal)}
              </span>
            </div>
            {forma !== "PIX" && (
              <p className="text-[10px] text-emerald-600 text-right px-1 -mt-1">
                💡 Pagando no PIX: R$ {fmt(totalPix)} (3% de desconto)
              </p>
            )}
          </div>
        )}

        {step === "dados" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="João da Silva" />
            </div>
            <div className="space-y-2">
              <Label>CPF ou CNPJ *</Label>
              <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <div className="flex gap-2">
                {formas.map((f) => (
                  <Button
                    key={f.key}
                    variant={forma === f.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setForma(f.key)}
                    className={forma === f.key ? "gradient-primary text-primary-foreground" : ""}
                  >
                    {f.icon}
                    <span className="ml-1">{f.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full gradient-primary text-primary-foreground"
              onClick={handlePagar}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Pagar R$ {fmt(forma === "PIX" ? totalPix : subtotal)} com {formas.find((f) => f.key === forma)?.label}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">
              🔒 Ambiente Sandbox (testes) — nenhuma cobrança real será gerada.
            </p>
          </div>
        )}

        {step === "resultado" && resultado && (
          <div className="space-y-4">
            <Badge className="bg-success/15 text-success border-success/30">
              Cobrança criada!
            </Badge>

            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> <span className="font-mono text-xs">{resultado.cobranca?.id}</span></p>
              <p><strong>Status:</strong> {resultado.cobranca?.status}</p>
              {resultado.cobranca?.bankSlipUrl && (
                <a href={resultado.cobranca.bankSlipUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                  📄 Abrir Boleto
                </a>
              )}
              {resultado.cobranca?.invoiceUrl && (
                <a href={resultado.cobranca.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm block">
                  🔗 Link de Pagamento
                </a>
              )}
            </div>

            {resultado.pix && (
              <div className="space-y-2">
                <p className="text-sm font-medium">QR Code Pix:</p>
                {resultado.pix.encodedImage && (
                  <img
                    src={`data:image/png;base64,${resultado.pix.encodedImage}`}
                    alt="QR Code Pix"
                    className="w-48 h-48 mx-auto border rounded-lg"
                  />
                )}
                {resultado.pix.payload && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Pix Copia e Cola:</p>
                    <Input
                      readOnly
                      value={resultado.pix.payload}
                      className="text-xs font-mono"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).select();
                        navigator.clipboard.writeText(resultado.pix.payload);
                        toast.success("Código Pix copiado!");
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                handleClose(false);
                onClearCart();
              }}
            >
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
