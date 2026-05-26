import { useState } from "react";
import { MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { registrarHistoricoLocalizacao } from "@/lib/produtoHistorico";

interface SetLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  currentLocation: string | null;
}

export function SetLocationDialog({ open, onOpenChange, productId, productName, currentLocation }: SetLocationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const parts = (currentLocation || "").split("-");
  const [rua, setRua] = useState(parts[0] || "");
  const [prateleira, setPrateleira] = useState(parts[1] || "");
  const [coluna, setColuna] = useState(parts[2] || "");
  const [caixa, setCaixa] = useState(parts[3] || "");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  const pad = (v: string) => v.padStart(2, "0");
  const preview = [rua, prateleira, coluna, caixa].some(Boolean)
    ? [rua, prateleira, coluna, caixa].map((v) => pad(v || "0")).join("-")
    : "";

  const handleSave = async () => {
    const loc = preview || null;
    setSaving(true);
    const { error } = await supabase
      .from("produtos_catalogo")
      .update({ localizacao: loc })
      .eq("id", productId);
    setSaving(false);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }

    // Histórico (fire-and-forget)
    if ((currentLocation || null) !== loc) {
      registrarHistoricoLocalizacao({
        produtoId: productId,
        produtoNome: productName,
        localizacaoAnterior: currentLocation || null,
        localizacaoNova: loc,
        motivo,
      }).catch((e) => console.error("Erro ao registrar histórico:", e));
    }

    toast({ title: "Localização salva", description: `${productName}: ${loc || "removida"}` });
    queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
    queryClient.invalidateQueries({ queryKey: ["produto-historico", productId] });
    onOpenChange(false);
  };

  const handleNumberInput = (value: string, setter: (v: string) => void) => {
    const num = value.replace(/\D/g, "").slice(0, 3);
    setter(num);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Definir Localização
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{productName}</p>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Rua</Label>
            <Input
              placeholder="05"
              value={rua}
              onChange={(e) => handleNumberInput(e.target.value, setRua)}
              className="text-center font-mono text-lg"
              maxLength={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Prateleira</Label>
            <Input
              placeholder="02"
              value={prateleira}
              onChange={(e) => handleNumberInput(e.target.value, setPrateleira)}
              className="text-center font-mono text-lg"
              maxLength={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Coluna</Label>
            <Input
              placeholder="04"
              value={coluna}
              onChange={(e) => handleNumberInput(e.target.value, setColuna)}
              className="text-center font-mono text-lg"
              maxLength={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Caixa</Label>
            <Input
              placeholder="12"
              value={caixa}
              onChange={(e) => handleNumberInput(e.target.value, setCaixa)}
              className="text-center font-mono text-lg"
              maxLength={3}
            />
          </div>
        </div>

        {preview && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/30 py-3">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-mono text-xl font-bold text-foreground tracking-wider">{preview}</span>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center">
          Padrão: RUA - PRATELEIRA - COLUNA - CAIXA (ex: 05-02-04-12)
        </p>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Motivo (opcional)</Label>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value.slice(0, 200))}
            placeholder="Ex: Reorganização do estoque, transferência de prateleira..."
            className="bg-secondary/50 text-sm min-h-[60px]"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Localização"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
