import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BRLInput } from "@/components/BRLInput";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conversaId: string;
  onEnviado?: () => void;
}

export default function CobrarDialog({ open, onOpenChange, conversaId, onEnviado }: Props) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [url, setUrl] = useState("");
  const [obs, setObs] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (!descricao.trim() || !valor || !url.trim()) {
      toast.error("Preencha descrição, valor e URL");
      return;
    }
    setEnviando(true);
    const v = parseFloat(valor) || 0;
    const conteudo = `💳 *${descricao}*\n\nValor: *R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}*\n\n🔗 ${url}${obs ? `\n\n${obs}` : ""}`;
    const { error } = await supabase.from("mensagens").insert({
      conversa_id: conversaId,
      tipo_remetente: "atendente",
      usuario_nome: "Atendente",
      tipo_mensagem: "texto",
      conteudo,
      status_envio: "enviado",
      metadata: { tipo: "cobranca", valor: v, url, descricao },
    });
    setEnviando(false);
    if (error) { toast.error("Erro ao enviar"); return; }
    toast.success("Link de pagamento enviado!");
    setDescricao(""); setValor(""); setUrl(""); setObs("");
    onEnviado?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-green-600" /> Enviar link de pagamento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Descrição do pagamento *</Label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Plano Premium • Mensalidade" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Valor (R$) *</Label>
              <BRLInput value={valor} onChange={setValor} placeholder="297,00" />
            </div>
            <div>
              <Label className="text-xs">Moeda</Label>
              <Input value="BRL" readOnly className="bg-muted" />
            </div>
          </div>
          <div>
            <Label className="text-xs">🔗 URL do pagamento *</Label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://pay.cakto.com.br/..." />
            <p className="text-[10px] text-muted-foreground mt-1">Cole o link gerado no Cakto, Stripe, Mercado Pago, Pix QR ou qualquer gateway.</p>
          </div>
          <div>
            <Label className="text-xs">Observação (opcional)</Label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Pagamento via Pix com 5% de desconto à vista" rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={enviar} disabled={enviando} className="bg-green-600 hover:bg-green-700 gap-1.5">
              <Send className="h-4 w-4" /> {enviando ? "Enviando..." : "Enviar no chat"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
