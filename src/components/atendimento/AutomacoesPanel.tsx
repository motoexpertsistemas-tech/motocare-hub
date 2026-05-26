import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Zap, Play, Pause, Trash2, Clock, Target, MessageCircle } from "lucide-react";

interface Automacao {
  id: string; nome: string; descricao: string | null; trigger_evento: string;
  trigger_config: any; condicoes: any; acoes: any[]; ativo: boolean;
  prioridade: number; total_execucoes: number; ultima_execucao: string | null;
}

const triggerOpcoes = [
  { value: "nova_mensagem", label: "Nova mensagem recebida", icon: "💬" },
  { value: "novo_lead", label: "Novo lead cadastrado", icon: "👤" },
  { value: "negocio_movido", label: "Negócio movido de etapa", icon: "📊" },
  { value: "inatividade", label: "Inatividade do cliente", icon: "⏰" },
  { value: "tag_adicionada", label: "Tag adicionada", icon: "🏷️" },
  { value: "horario", label: "Horário agendado", icon: "🕐" },
];

const acaoOpcoes = [
  { value: "enviar_mensagem", label: "Enviar mensagem", icon: "📤" },
  { value: "adicionar_tag", label: "Adicionar tag", icon: "🏷️" },
  { value: "mover_etapa", label: "Mover para etapa", icon: "➡️" },
  { value: "atribuir_responsavel", label: "Atribuir responsável", icon: "👤" },
  { value: "notificar_equipe", label: "Notificar equipe", icon: "🔔" },
  { value: "webhook", label: "Disparar webhook", icon: "🔗" },
];

export default function AutomacoesPanel() {
  const [automacoes, setAutomacoes] = useState<Automacao[]>([]);
  const [showNova, setShowNova] = useState(false);
  const [nova, setNova] = useState({ nome: "", descricao: "", trigger_evento: "nova_mensagem", acao_tipo: "enviar_mensagem", acao_valor: "" });

  useEffect(() => { carregarAutomacoes(); }, []);

  const carregarAutomacoes = async () => {
    const { data } = await supabase.from("automacoes").select("*").order("prioridade");
    setAutomacoes((data as Automacao[]) || []);
  };

  const criarAutomacao = async () => {
    if (!nova.nome.trim()) return;
    const { error } = await supabase.from("automacoes").insert({
      nome: nova.nome, descricao: nova.descricao || null,
      trigger_evento: nova.trigger_evento,
      acoes: [{ tipo: nova.acao_tipo, valor: nova.acao_valor }],
    });
    if (!error) {
      toast.success("Automação criada!"); setShowNova(false);
      setNova({ nome: "", descricao: "", trigger_evento: "nova_mensagem", acao_tipo: "enviar_mensagem", acao_valor: "" });
      carregarAutomacoes();
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await supabase.from("automacoes").update({ ativo: !ativo }).eq("id", id);
    carregarAutomacoes();
  };

  const excluirAutomacao = async (id: string) => {
    await supabase.from("automacoes").delete().eq("id", id);
    toast.success("Automação removida"); carregarAutomacoes();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Automações</h2>
          <p className="text-sm text-muted-foreground">Configure automações ilimitadas para otimizar interações</p>
        </div>
        <Dialog open={showNova} onOpenChange={setShowNova}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Nova Automação</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Automação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Nome da automação" value={nova.nome} onChange={e => setNova({ ...nova, nome: e.target.value })} />
              <Textarea placeholder="Descrição (opcional)" value={nova.descricao} onChange={e => setNova({ ...nova, descricao: e.target.value })} />
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Quando (Trigger)</label>
                <Select value={nova.trigger_evento} onValueChange={v => setNova({ ...nova, trigger_evento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {triggerOpcoes.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Então (Ação)</label>
                <Select value={nova.acao_tipo} onValueChange={v => setNova({ ...nova, acao_tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {acaoOpcoes.map(a => <SelectItem key={a.value} value={a.value}>{a.icon} {a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Textarea placeholder="Valor/Conteúdo da ação" value={nova.acao_valor} onChange={e => setNova({ ...nova, acao_valor: e.target.value })} />
              <Button onClick={criarAutomacao} className="w-full">Criar Automação</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {automacoes.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma automação configurada</p>
              <p className="text-sm mt-1">Crie automações para otimizar seu atendimento</p>
            </CardContent>
          </Card>
        )}
        {automacoes.map(auto => {
          const trigger = triggerOpcoes.find(t => t.value === auto.trigger_evento);
          return (
            <Card key={auto.id} className={`${!auto.ativo ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                      {trigger?.icon || "⚡"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{auto.nome}</h3>
                      <p className="text-xs text-muted-foreground">{trigger?.label || auto.trigger_evento}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{auto.total_execucoes} execuções</p>
                      {auto.ultima_execucao && <p>{new Date(auto.ultima_execucao).toLocaleDateString("pt-BR")}</p>}
                    </div>
                    <Switch checked={auto.ativo} onCheckedChange={() => toggleAtivo(auto.id, auto.ativo)} />
                    <Button variant="ghost" size="icon" onClick={() => excluirAutomacao(auto.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {auto.descricao && <p className="text-sm text-muted-foreground mt-2 ml-[52px]">{auto.descricao}</p>}
                {Array.isArray(auto.acoes) && auto.acoes.length > 0 && (
                  <div className="mt-3 ml-[52px] flex gap-2 flex-wrap">
                    {auto.acoes.map((acao: any, i: number) => {
                      const acaoInfo = acaoOpcoes.find(a => a.value === acao.tipo);
                      return (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {acaoInfo?.icon} {acaoInfo?.label || acao.tipo}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
