import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Cadencia { id: string; nome: string; ativa: boolean; }

interface Props {
  negocioId: string | null;
  negocioTitulo?: string;
  leadId?: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function AplicarCadenciaDialog({ negocioId, negocioTitulo, leadId, open, onOpenChange }: Props) {
  const [cadencias, setCadencias] = useState<Cadencia[]>([]);
  const [cadenciaId, setCadenciaId] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [aplicando, setAplicando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("cadencias" as any)
        .select("id, nome, ativa")
        .eq("ativa", true)
        .order("nome");
      setCadencias((data as any) || []);

      if (leadId) {
        const { data: lead } = await supabase
          .from("leads")
          .select("whatsapp, telefone")
          .eq("id", leadId)
          .maybeSingle();
        if (lead) setTelefone((lead.whatsapp || lead.telefone || "").toString());
      }
      setLoading(false);
    })();
  }, [open, leadId]);

  const aplicar = async () => {
    if (!negocioId || !cadenciaId) return toast.error("Selecione uma cadência");
    if (!telefone.trim()) return toast.error("Informe o telefone do contato");
    setAplicando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: u } = await supabase.from("usuarios").select("empresa_id").eq("auth_user_id", user!.id).maybeSingle();

      const { data: existente } = await supabase
        .from("cadencia_execucoes" as any)
        .select("id")
        .eq("negocio_id", negocioId)
        .eq("cadencia_id", cadenciaId)
        .eq("status", "ativa")
        .maybeSingle();

      if (existente) {
        toast.warning("Esta cadência já está ativa neste lead");
        onOpenChange(false);
        return;
      }

      const { error } = await supabase.from("cadencia_execucoes" as any).insert({
        empresa_id: u!.empresa_id,
        cadencia_id: cadenciaId,
        negocio_id: negocioId,
        contato_telefone: telefone.replace(/\D/g, ""),
        passo_atual: 0,
        proximo_envio: new Date().toISOString(),
        status: "ativa",
      });
      if (error) throw error;
      toast.success("Cadência iniciada — primeiro passo será enviado em até 15 min");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao aplicar cadência");
    } finally {
      setAplicando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> Aplicar Cadência
          </DialogTitle>
          <DialogDescription>
            {negocioTitulo ? `Lead: ${negocioTitulo}` : "Inicia o follow-up automático para este lead"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : cadencias.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma cadência ativa. Crie uma na aba <b>Cadências</b> primeiro.
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Cadência</Label>
              <Select value={cadenciaId} onValueChange={setCadenciaId}>
                <SelectTrigger><SelectValue placeholder="Escolha uma cadência" /></SelectTrigger>
                <SelectContent>
                  {cadencias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Telefone WhatsApp (com DDD)</Label>
              <Input
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder="11999998888"
              />
            </div>
            <Button className="w-full" onClick={aplicar} disabled={aplicando}>
              {aplicando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GitBranch className="h-4 w-4 mr-2" />}
              Iniciar Follow-up
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
