import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Webhook, Trash2, ExternalLink, CheckCircle, XCircle } from "lucide-react";

interface WebhookConfig {
  id: string; nome: string; url: string; eventos: string[];
  ativo: boolean; secret: string | null; ultimo_disparo: string | null;
  total_disparos: number; ultimo_status: number | null;
}

const eventosDisponiveis = [
  "nova_mensagem", "nova_conversa", "conversa_resolvida", "novo_lead",
  "lead_atualizado", "negocio_criado", "negocio_movido", "negocio_fechado",
];

export default function WebhooksPanel() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [showNovo, setShowNovo] = useState(false);
  const [novo, setNovo] = useState({ nome: "", url: "", secret: "", eventos: [] as string[] });

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    const { data } = await supabase.from("webhooks_config").select("*").order("created_at");
    setWebhooks((data as WebhookConfig[]) || []);
  };

  const criar = async () => {
    if (!novo.nome.trim() || !novo.url.trim()) return;
    const { error } = await supabase.from("webhooks_config").insert({
      nome: novo.nome, url: novo.url, secret: novo.secret || null, eventos: novo.eventos,
    });
    if (!error) { toast.success("Webhook criado!"); setShowNovo(false); setNovo({ nome: "", url: "", secret: "", eventos: [] }); carregar(); }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await supabase.from("webhooks_config").update({ ativo: !ativo }).eq("id", id);
    carregar();
  };

  const excluir = async (id: string) => {
    await supabase.from("webhooks_config").delete().eq("id", id);
    toast.success("Webhook removido"); carregar();
  };

  const toggleEvento = (evento: string) => {
    setNovo(prev => ({
      ...prev,
      eventos: prev.eventos.includes(evento) ? prev.eventos.filter(e => e !== evento) : [...prev.eventos, evento],
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Webhooks</h2>
          <p className="text-sm text-muted-foreground">Integrações ilimitadas com webhooks para conectar ferramentas</p>
        </div>
        <Dialog open={showNovo} onOpenChange={setShowNovo}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Novo Webhook</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Webhook</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Nome" value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} />
              <Input placeholder="URL do webhook" value={novo.url} onChange={e => setNovo({ ...novo, url: e.target.value })} />
              <Input placeholder="Secret (opcional)" value={novo.secret} onChange={e => setNovo({ ...novo, secret: e.target.value })} />
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Eventos</label>
                <div className="flex flex-wrap gap-2">
                  {eventosDisponiveis.map(ev => (
                    <button key={ev} onClick={() => toggleEvento(ev)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        novo.eventos.includes(ev) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
                      }`}>
                      {ev.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={criar} className="w-full">Criar Webhook</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {webhooks.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum webhook configurado</p>
            </CardContent>
          </Card>
        )}
        {webhooks.map(wh => (
          <Card key={wh.id} className={`${!wh.ativo ? "opacity-60" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Webhook className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{wh.nome}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><ExternalLink className="h-3 w-3" />{wh.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{wh.total_disparos} disparos</p>
                    {wh.ultimo_status && (
                      <p className="flex items-center gap-1 justify-end">
                        {wh.ultimo_status < 400 ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-destructive" />}
                        {wh.ultimo_status}
                      </p>
                    )}
                  </div>
                  <Switch checked={wh.ativo} onCheckedChange={() => toggleAtivo(wh.id, wh.ativo)} />
                  <Button variant="ghost" size="icon" onClick={() => excluir(wh.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              {wh.eventos.length > 0 && (
                <div className="mt-3 ml-[52px] flex gap-1.5 flex-wrap">
                  {wh.eventos.map(ev => <Badge key={ev} variant="secondary" className="text-[10px]">{ev.replace(/_/g, " ")}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
