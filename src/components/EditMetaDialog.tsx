import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface MetaData {
  nome: string;
  valor: number;
  dataInicio: string;
  dataFim: string;
  situacao: "ativa" | "inativa";
  observacao: string;
}

interface EditMetaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta: MetaData;
  onSave: (meta: MetaData) => void;
}

export function EditMetaDialog({ open, onOpenChange, meta, onSave }: EditMetaDialogProps) {
  const [form, setForm] = useState<MetaData>(meta);
  const [valorStr, setValorStr] = useState("");

  useEffect(() => {
    if (open) {
      setForm(meta);
      setValorStr(meta.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
    }
  }, [open, meta]);

  const handleSave = () => {
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px]">
        <DialogHeader>
          <DialogTitle>Editar meta</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3">
          <div>
            <Label>Nome*</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <Label>Valor*</Label>
            <Input
              type="text"
              value={valorStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, "");
                setValorStr(val);
                const raw = val.replace(/\./g, "").replace(",", ".");
                const num = parseFloat(raw);
                if (!isNaN(num)) setForm((f) => ({ ...f, valor: num }));
              }}
            />
          </div>
          <div>
            <Label>Data início*</Label>
            <Input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
          </div>
          <div>
            <Label>Data fim*</Label>
            <Input type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} />
          </div>
          <div>
            <Label>Situação*</Label>
            <Select value={form.situacao} onValueChange={(v) => setForm({ ...form, situacao: v as "ativa" | "inativa" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="inativa">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Observação</Label>
          <Textarea
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            rows={4}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
            ✔ Atualizar
          </Button>
          <Button variant="destructive" onClick={() => onOpenChange(false)}>
            ✖ Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
