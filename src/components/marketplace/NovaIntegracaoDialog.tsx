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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const MARKETPLACES = [
  { value: "mercado_livre", label: "Mercado Livre", icon: "🛒" },
  { value: "shopee", label: "Shopee", icon: "🛍️" },
  { value: "magalu", label: "Magazine Luiza", icon: "🏪" },
  { value: "amazon", label: "Amazon", icon: "📦" },
  { value: "shein", label: "Shein", icon: "👗" },
  { value: "tiktok_shop", label: "TikTok Shop", icon: "🎵" },
  { value: "kwai", label: "Kwai", icon: "📱" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function NovaIntegracaoDialog({ open, onOpenChange, onSuccess }: Props) {
  const [marketplace, setMarketplace] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [userId, setUserId] = useState("");
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    if (!marketplace) {
      toast.error("Selecione um marketplace");
      return;
    }
    if (!accessToken) {
      toast.error("Informe o Access Token");
      return;
    }

    setSalvando(true);
    try {
      const { error } = await supabase.from("marketplace_integracoes").insert({
        marketplace,
        ativo: true,
        sincronizar_pedidos: true,
        sincronizar_estoque: true,
        credenciais: {
          client_id: clientId || null,
          client_secret: clientSecret || null,
          access_token: accessToken,
          refresh_token: refreshToken || null,
          user_id: userId || null,
        },
      });

      if (error) throw error;

      toast.success("Integração adicionada com sucesso!");
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
    setMarketplace("");
    setClientId("");
    setClientSecret("");
    setAccessToken("");
    setRefreshToken("");
    setUserId("");
  };

  const selectedMk = MARKETPLACES.find((m) => m.value === marketplace);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Integração de Marketplace</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Marketplace *</Label>
            <Select value={marketplace} onValueChange={setMarketplace}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o marketplace" />
              </SelectTrigger>
              <SelectContent>
                {MARKETPLACES.map((mk) => (
                  <SelectItem key={mk.value} value={mk.value}>
                    <span className="flex items-center gap-2">
                      <span>{mk.icon}</span>
                      <span>{mk.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {marketplace && (
            <>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  {selectedMk?.icon} Para obter as credenciais do <strong>{selectedMk?.label}</strong>,
                  acesse o portal de desenvolvedores do marketplace e crie um aplicativo.
                  O <em>access_token</em> e <em>refresh_token</em> são obtidos após o fluxo OAuth.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="ID do aplicativo"
                />
              </div>

              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Chave secreta do aplicativo"
                />
              </div>

              <div className="space-y-2">
                <Label>Access Token *</Label>
                <Input
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Token de acesso (obrigatório)"
                />
              </div>

              <div className="space-y-2">
                <Label>Refresh Token</Label>
                <Input
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                  placeholder="Token de renovação"
                />
              </div>

              <div className="space-y-2">
                <Label>User ID / Seller ID</Label>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="ID do vendedor no marketplace"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={salvando || !marketplace}>
              {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Integração
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
