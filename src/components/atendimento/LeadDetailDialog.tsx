import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Negocio {
  id: string; titulo: string; valor: number; responsavel: string | null;
  notas: string | null; probabilidade: number;
  data_previsao_fechamento: string | null;
}

interface Props {
  negocio: Negocio | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}

export default function LeadDetailDialog({ negocio, open, onOpenChange, onSaved }: Props) {
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [notas, setNotas] = useState("");
  const [probabilidade, setProbabilidade] = useState(0);
  const [previsao, setPrevisao] = useState("");
  const [bant, setBant] = useState({ budget: "", authority: "", need: "", timeline: "" });

  useEffect(() => {
    if (negocio) {
      setTitulo(negocio.titulo); setValor(String(negocio.valor || ""));
      setResponsavel(negocio.responsavel || ""); setNotas(negocio.notas || "");
      setProbabilidade(negocio.probabilidade || 0);
      setPrevisao(negocio.data_previsao_fechamento || "");
      try {
        const parsed = negocio.notas && negocio.notas.startsWith("{") ? JSON.parse(negocio.notas) : null;
        if (parsed?.bant) setBant(parsed.bant);
      } catch {}
    }
  }, [negocio]);

  const salvar = async () => {
    if (!negocio) return;
    const payload: any = {
      titulo, valor: parseFloat(valor) || 0, responsavel: responsavel || null,
      notas, probabilidade, data_previsao_fechamento: previsao || null,
    };
    const { error } = await supabase.from("negocios").update(payload).eq("id", negocio.id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Lead atualizado");
    onOpenChange(false); onSaved();
  };

  if (!negocio) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Detalhe do Lead</DialogTitle></DialogHeader>
        <Tabs defaultValue="resumo">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="bant">BANT</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="notas">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-3 mt-4">
            <div><Label className="text-xs">Título</Label>
              <Input value={titulo} onChange={e => setTitulo(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Valor da Negociação (R$)</Label>
                <Input type="number" value={valor} onChange={e => setValor(e.target.value)} /></div>
              <div><Label className="text-xs">Probabilidade (%)</Label>
                <Input type="number" min={0} max={100} value={probabilidade}
                  onChange={e => setProbabilidade(parseInt(e.target.value) || 0)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Responsável</Label>
                <Input value={responsavel} onChange={e => setResponsavel(e.target.value)} /></div>
              <div><Label className="text-xs">Previsão de Fechamento</Label>
                <Input type="date" value={previsao} onChange={e => setPrevisao(e.target.value)} /></div>
            </div>
          </TabsContent>

          <TabsContent value="bant" className="space-y-3 mt-4">
            <div><Label className="text-xs">Budget (Orçamento)</Label>
              <Textarea rows={2} value={bant.budget} onChange={e => setBant({ ...bant, budget: e.target.value })} /></div>
            <div><Label className="text-xs">Authority (Decisor)</Label>
              <Textarea rows={2} value={bant.authority} onChange={e => setBant({ ...bant, authority: e.target.value })} /></div>
            <div><Label className="text-xs">Need (Necessidade)</Label>
              <Textarea rows={2} value={bant.need} onChange={e => setBant({ ...bant, need: e.target.value })} /></div>
            <div><Label className="text-xs">Timeline (Prazo)</Label>
              <Textarea rows={2} value={bant.timeline} onChange={e => setBant({ ...bant, timeline: e.target.value })} /></div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <div className="space-y-2 text-sm">
              <div className="flex gap-3 p-3 border border-border rounded">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div className="flex-1">
                  <div className="font-medium text-foreground">Lead criado</div>
                  <div className="text-xs text-muted-foreground">Ações futuras aparecerão aqui</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notas" className="mt-4">
            <Textarea rows={8} value={notas} onChange={e => setNotas(e.target.value)}
              placeholder="Notas livres sobre o lead..." />
          </TabsContent>
        </Tabs>
        <Button onClick={salvar} className="w-full mt-3">Salvar Alterações</Button>
      </DialogContent>
    </Dialog>
  );
}
