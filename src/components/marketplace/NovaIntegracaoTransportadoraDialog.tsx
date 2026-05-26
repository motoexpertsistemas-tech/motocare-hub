import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Truck, Info } from "lucide-react";

const TRANSPORTADORAS = [
  { value: "correios", label: "Correios", icon: "📮", descricao: "API dos Correios (SIGEP Web / Correios API)" },
  { value: "jadlog", label: "JadLog", icon: "🚛", descricao: "API JadLog para rastreio e cotação" },
  { value: "melhor_envio", label: "Melhor Envio", icon: "📦", descricao: "Hub de fretes com múltiplas transportadoras" },
  { value: "kangu", label: "Kangu", icon: "🏷️", descricao: "Plataforma de envios e logística" },
  { value: "frenet", label: "Frenet", icon: "🔗", descricao: "Gateway de fretes com múltiplas integrações" },
  { value: "mandae", label: "Mandaê", icon: "📬", descricao: "Logística inteligente para e-commerce" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function NovaIntegracaoTransportadoraDialog({ open, onOpenChange, onSuccess }: Props) {
  const [transportadora, setTransportadora] = useState("");
  const [token, setToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [contrato, setContrato] = useState("");
  const [cartaoPostagem, setCartaoPostagem] = useState("");
  const [codigoAdm, setCodigoAdm] = useState("");
  const [sandbox, setSandbox] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [salvando, setSalvando] = useState(false);

  const selectedTr = TRANSPORTADORAS.find((t) => t.value === transportadora);
  const isCorreios = transportadora === "correios";

  const handleSalvar = async () => {
    if (!transportadora) {
      toast.error("Selecione uma transportadora");
      return;
    }
    if (!token && !clientId) {
      toast.error("Informe ao menos o Token ou Client ID");
      return;
    }

    setSalvando(true);
    try {
      const { error } = await supabase.from("transportadora_integracoes" as any).insert({
        transportadora,
        ativo: true,
        ambiente: sandbox ? "sandbox" : "producao",
        credenciais: {
          token: token || null,
          client_id: clientId || null,
          client_secret: clientSecret || null,
          contrato: contrato || null,
          cartao_postagem: cartaoPostagem || null,
          codigo_administrativo: codigoAdm || null,
          webhook_url: webhookUrl || null,
        },
      } as any);

      if (error) throw error;

      toast.success("Integração de transportadora adicionada!");
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (err) {
      toast.error("Erro ao salvar: " + String(err));
    } finally {
      setSalvando(false);
    }
  };

  const resetForm = () => {
    setTransportadora("");
    setToken("");
    setClientId("");
    setClientSecret("");
    setContrato("");
    setCartaoPostagem("");
    setCodigoAdm("");
    setSandbox(true);
    setWebhookUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Nova Integração de Transportadora
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Transportadora *</Label>
            <Select value={transportadora} onValueChange={setTransportadora}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a transportadora" />
              </SelectTrigger>
              <SelectContent>
                {TRANSPORTADORAS.map((tr) => (
                  <SelectItem key={tr.value} value={tr.value}>
                    <span className="flex items-center gap-2">
                      <span>{tr.icon}</span>
                      <span>{tr.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {transportadora && (
            <>
              <div className="rounded-lg border bg-muted/50 p-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {selectedTr?.icon} <strong>{selectedTr?.label}</strong> — {selectedTr?.descricao}.
                  {isCorreios && (
                    <> Acesse o portal <em>Meu Correios</em> para obter as credenciais da API (contrato, cartão de postagem e token).</>
                  )}
                  {!isCorreios && (
                    <> Acesse o painel de desenvolvedores para obter o token de acesso da API.</>
                  )}
                </p>
              </div>

              {/* Ambiente */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">Ambiente</Label>
                  <p className="text-xs text-muted-foreground">
                    {sandbox ? "Modo de teste (sandbox)" : "Modo de produção (real)"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Sandbox</span>
                  <Switch checked={!sandbox} onCheckedChange={(v) => setSandbox(!v)} />
                  <span className="text-xs text-muted-foreground">Produção</span>
                </div>
              </div>

              {/* Campos específicos dos Correios */}
              {isCorreios && (
                <>
                  <div className="space-y-2">
                    <Label>Nº Contrato</Label>
                    <Input
                      value={contrato}
                      onChange={(e) => setContrato(e.target.value)}
                      placeholder="Número do contrato com os Correios"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cartão de Postagem</Label>
                    <Input
                      value={cartaoPostagem}
                      onChange={(e) => setCartaoPostagem(e.target.value)}
                      placeholder="Número do cartão de postagem"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Código Administrativo</Label>
                    <Input
                      value={codigoAdm}
                      onChange={(e) => setCodigoAdm(e.target.value)}
                      placeholder="Código administrativo"
                    />
                  </div>
                </>
              )}

              {/* Credenciais genéricas */}
              <div className="space-y-2">
                <Label>Token / Access Token *</Label>
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Token de acesso à API"
                />
              </div>

              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="ID do aplicativo (se houver)"
                />
              </div>

              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Chave secreta (se houver)"
                />
              </div>

              <div className="space-y-2">
                <Label>URL do Webhook (opcional)</Label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://seusite.com/webhook/transportadora"
                />
                <p className="text-xs text-muted-foreground">
                  URL para receber atualizações automáticas de status e devoluções
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={salvando || !transportadora}>
              {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Integração
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
