import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type AjusteTipo = "lucro" | "valor";

interface AjusteValorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direction: "up" | "down";
  tiposVenda: { id: string; nome: string; media_lucro: number }[];
  onApply: (selectedTipos: string[], percent: number, tipo: AjusteTipo) => void;
}

export default function AjusteValorDialog({ open, onOpenChange, direction, tiposVenda, onApply }: AjusteValorDialogProps) {
  const [selectedTipos, setSelectedTipos] = useState<Set<string>>(new Set());
  const [percent, setPercent] = useState("10");
  const [tipo, setTipo] = useState<AjusteTipo>("lucro");

  useEffect(() => {
    if (open) {
      setSelectedTipos(new Set(tiposVenda.map((t) => t.nome)));
      setPercent("10");
      setTipo("lucro");
    }
  }, [open, tiposVenda]);

  const toggleTipo = (nome: string) => {
    setSelectedTipos((prev) => {
      const next = new Set(prev);
      next.has(nome) ? next.delete(nome) : next.add(nome);
      return next;
    });
  };

  const handleApply = () => {
    const pct = parseFloat(percent) || 0;
    if (pct <= 0) return;
    onApply(Array.from(selectedTipos), pct, tipo);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {direction === "up" ? "Aumentar" : "Diminuir"} valor de venda
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as AjusteTipo)} className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="lucro" />
                <span className="text-sm">Lucro utilizado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="valor" />
                <span className="text-sm">Valor de venda</span>
              </label>
            </RadioGroup>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {tiposVenda.map((tv) => (
              <label key={tv.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedTipos.has(tv.nome)}
                  onCheckedChange={() => toggleTipo(tv.nome)}
                />
                <span className="text-sm">Vr. {tv.nome}</span>
              </label>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Porcentagem a ser {direction === "up" ? "aumentada" : "diminuída"}
            </Label>
            <Input
              type="number"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="bg-secondary/50 text-right"
              step="1"
              min="0"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleApply}>Aplicar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
