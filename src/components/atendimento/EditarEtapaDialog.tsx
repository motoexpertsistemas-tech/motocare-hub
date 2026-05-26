import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Etapa { id: string; nome: string; cor: string; ordem: number; }
interface Props {
  etapa: Etapa | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}

export default function EditarEtapaDialog({ etapa, open, onOpenChange, onSaved }: Props) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#3b82f6");
  const [ordem, setOrdem] = useState(0);

  useEffect(() => {
    if (etapa) { setNome(etapa.nome); setCor(etapa.cor); setOrdem(etapa.ordem); }
  }, [etapa]);

  const salvar = async () => {
    if (!etapa || !nome.trim()) return;
    const { error } = await supabase.from("pipeline_etapas")
      .update({ nome, cor, ordem }).eq("id", etapa.id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Etapa atualizada");
    onOpenChange(false); onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Etapa</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Nome</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} /></div>
          <div className="flex items-center gap-3">
            <div><Label className="text-xs">Cor</Label>
              <input type="color" value={cor} onChange={e => setCor(e.target.value)}
                className="w-14 h-10 rounded cursor-pointer block" /></div>
            <div className="flex-1"><Label className="text-xs">Ordem</Label>
              <Input type="number" value={ordem} onChange={e => setOrdem(parseInt(e.target.value) || 0)} /></div>
          </div>
          <Button onClick={salvar} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
