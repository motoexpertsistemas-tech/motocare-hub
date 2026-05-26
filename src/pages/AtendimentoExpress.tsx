import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageCircle,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  Search,
  Filter,
  Star,
  Clock,
  CheckCheck,
  Bot,
  Zap,
  Settings2,
  BarChart3,
  Brain,
  Loader2,
  Kanban,
  Users,
  Webhook,
  Code,
  Target,
  Sparkles,
  GitBranch,
  MessageSquareWarning,
  Trophy,
} from "lucide-react";
import CanaisConfigPanel from "@/components/atendimento/CanaisConfigPanel";
import AgenteIAPanel from "@/components/atendimento/AgenteIAPanel";
import AnalyticsPanel from "@/components/atendimento/AnalyticsPanel";
import PipelineKanbanPanel from "@/components/atendimento/PipelineKanbanPanel";
import LeadsPanel from "@/components/atendimento/LeadsPanel";
import AutomacoesPanel from "@/components/atendimento/AutomacoesPanel";
import MembrosPanel from "@/components/atendimento/MembrosPanel";
import WebhooksPanel from "@/components/atendimento/WebhooksPanel";
import DashboardPipelinePanel from "@/components/atendimento/DashboardPipelinePanel";
import ApiAccessPanel from "@/components/atendimento/ApiAccessPanel";
import CriativosInfinitosPanel from "@/components/atendimento/CriativosInfinitosPanel";
import CadenciasPanel from "@/components/atendimento/CadenciasPanel";
import ObjecoesPanel from "@/components/atendimento/ObjecoesPanel";
import MetasPanel from "@/components/atendimento/MetasPanel";
import BrainPanel from "@/components/atendimento/BrainPanel";
import CatalogoDialog from "@/components/atendimento/CatalogoDialog";
import CobrarDialog from "@/components/atendimento/CobrarDialog";
import NovoEventoDialog from "@/components/atendimento/NovoEventoDialog";
import ContatoPanel from "@/components/atendimento/ContatoPanel";
import ChatActionsBar from "@/components/atendimento/ChatActionsBar";
import { toast } from "sonner";
import { useChatAlerts } from "@/hooks/useChatAlerts";


const CanalIcon = ({ tipo }: { tipo: string }) => {
  const icons: Record<string, string> = {
    whatsapp: "💬", instagram: "📸", telegram: "✈️", facebook: "👥",
    site: "🌐", mercado_livre: "🛒", email: "📧", shopee: "🛍️", magalu: "🏬", b2w: "🏪",
  };
  return <span className="text-xs">{icons[tipo] || "💬"}</span>;
};

interface Conversa {
  id: string; canal_tipo: string; contato_nome: string | null;
  contato_avatar_url: string | null; contato_externo_id: string;
  ultima_mensagem_em: string | null; ultima_mensagem_de: string | null;
  status: string; total_mensagens: number; prioridade: string; tags: string[] | null;
}

interface Mensagem {
  id: string; conversa_id: string; tipo_remetente: string;
  usuario_nome: string | null; tipo_mensagem: string; conteudo: string | null;
  midia_url: string | null; status_envio: string | null; created_at: string;
}

export default function AtendimentoExpress() {
  const { playTransferenciaAlert } = useChatAlerts();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = useMemo(() => searchParams.get("tab") || "chat", []);
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const paramTab = searchParams.get("tab");
    if (paramTab && paramTab !== tab) {
      setTab(paramTab);
    }
  }, [searchParams]);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const [enviandoBot, setEnviandoBot] = useState(false);
  const [showCatalogo, setShowCatalogo] = useState(false);
  const [showCobrar, setShowCobrar] = useState(false);
  const [showEvento, setShowEvento] = useState(false);
  const [analisando, setAnalisando] = useState(false);
  const [analise, setAnalise] = useState<any>(null);

  // Reset análise ao trocar de conversa
  useEffect(() => { setAnalise(null); }, [conversaSelecionada?.id]);

  const marcarQuente = async () => {
    if (!conversaSelecionada) return;
    await supabase.from("conversas").update({ prioridade: "alta" }).eq("id", conversaSelecionada.id);
    toast.success("Conversa marcada como QUENTE 🔥");
    carregarConversas();
  };

  const vincularLead = async () => {
    if (!conversaSelecionada) return;
    const nome = conversaSelecionada.contato_nome || conversaSelecionada.contato_externo_id;
    const { error } = await supabase.from("leads").insert({
      nome, whatsapp: conversaSelecionada.contato_externo_id,
      telefone: conversaSelecionada.contato_externo_id,
      origem: conversaSelecionada.canal_tipo, status: "novo",
    });
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Lead vinculado!");
  };

  const analisarConversa = async () => {
    if (!conversaSelecionada || mensagens.length === 0) {
      toast.error("Sem mensagens para analisar"); return;
    }
    setAnalisando(true);
    try {
      const { data, error } = await supabase.functions.invoke("analisar-conversa", {
        body: { conversa_id: conversaSelecionada.id },
      });
      if (error) throw error;
      setAnalise(data?.analise || null);
      toast.success("Análise gerada");
    } catch (e: any) {
      toast.error("Erro: " + (e.message || "falha"));
    } finally {
      setAnalisando(false);
    }
  };

  useEffect(() => {
    carregarConversas();
    const channel = supabase
      .channel("conversas-channel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens" }, (payload) => {
        const newMsg = payload.new as Mensagem;
        if (conversaSelecionada && newMsg.conversa_id === conversaSelecionada.id) {
          setMensagens((prev) => [...prev, newMsg]);
          scrollToBottom();
        }
        carregarConversas();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversaSelecionada]);

  const carregarConversas = async () => {
    let query = supabase.from("conversas").select("*").order("ultima_mensagem_em", { ascending: false });
    if (filtroStatus !== "todos") query = query.eq("status", filtroStatus);
    const { data } = await query;
    setConversas((data as Conversa[]) || []);
  };

  const carregarMensagens = async (conversaId: string) => {
    const { data } = await supabase.from("mensagens").select("*").eq("conversa_id", conversaId).order("created_at", { ascending: true });
    setMensagens((data as Mensagem[]) || []);
    scrollToBottom();
  };

  const selecionarConversa = async (conversa: Conversa) => {
    setConversaSelecionada(conversa);
    await carregarMensagens(conversa.id);
    await supabase.from("conversas").update({ status: "em_atendimento" }).eq("id", conversa.id);
  };

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !conversaSelecionada) return;
    const { error } = await supabase.from("mensagens").insert({
      conversa_id: conversaSelecionada.id, tipo_remetente: "atendente",
      usuario_nome: "Atendente", tipo_mensagem: "texto",
      conteudo: novaMensagem, status_envio: "enviado",
    });
    if (!error) { setNovaMensagem(""); await carregarMensagens(conversaSelecionada.id); }
  };

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  };

  const pedirRespostaIA = async () => {
    if (!conversaSelecionada) return;
    const ultimaMsgCliente = [...mensagens].reverse().find(m => m.tipo_remetente === "cliente");
    if (!ultimaMsgCliente?.conteudo) {
      toast.error("Nenhuma mensagem do cliente para responder");
      return;
    }
    setEnviandoBot(true);
    try {
      const { data, error } = await supabase.functions.invoke("processar-mensagem", {
        body: { conversa_id: conversaSelecionada.id, mensagem_cliente: ultimaMsgCliente.conteudo },
      });
      if (error) throw error;
      toast.success(`IA respondeu! Intenção: ${data?.intencao || "N/A"}`);
      if (data?.transferir) {
        playTransferenciaAlert();
        toast.warning("🙋 Conversa marcada para transbordo humano");
      }
      await carregarMensagens(conversaSelecionada.id);
    } catch (err: any) {
      toast.error("Erro ao gerar resposta IA: " + (err.message || "Erro desconhecido"));
    } finally {
      setEnviandoBot(false);
    }
  };

  const formatarHora = (timestamp: string | null) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const conversasFiltradas = conversas.filter(
    (c) => busca === "" || c.contato_nome?.toLowerCase().includes(busca.toLowerCase())
  );

  // Stats rápidos
  const totalAguardando = conversas.filter((c) => c.status === "aguardando").length;
  const totalAtendendo = conversas.filter((c) => c.status === "em_atendimento").length;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-6">
      {/* Header com tabs */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-sidebar">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-foreground">Atendimento Omnichannel</h1>
          <div className="flex gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-medium">
              {totalAguardando} aguardando
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 font-medium">
              {totalAtendendo} atendendo
            </span>
          </div>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1">
            <TabsTrigger value="chat" className="gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" /> Chat
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-1.5">
              <Kanban className="h-3.5 w-3.5" /> Pipeline
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-1.5">
              <Target className="h-3.5 w-3.5" /> Leads
            </TabsTrigger>
            <TabsTrigger value="automacoes" className="gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Automações
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="membros" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Membros
            </TabsTrigger>
            <TabsTrigger value="agente" className="gap-1.5">
              <Brain className="h-3.5 w-3.5" /> Agente IA
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-1.5">
              <Webhook className="h-3.5 w-3.5" /> Webhooks
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-1.5">
              <Code className="h-3.5 w-3.5" /> API
            </TabsTrigger>
            <TabsTrigger value="criativos" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Criativos
            </TabsTrigger>
            <TabsTrigger value="cadencias" className="gap-1.5">
              <GitBranch className="h-3.5 w-3.5" /> Cadências
            </TabsTrigger>
            <TabsTrigger value="objecoes" className="gap-1.5">
              <MessageSquareWarning className="h-3.5 w-3.5" /> Objeções
            </TabsTrigger>
            <TabsTrigger value="metas" className="gap-1.5">
              <Trophy className="h-3.5 w-3.5" /> Metas
            </TabsTrigger>
            <TabsTrigger value="brain" className="gap-1.5">
              <Brain className="h-3.5 w-3.5" /> Brain
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-1.5">
              <Settings2 className="h-3.5 w-3.5" /> Canais
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conteúdo baseado na tab */}
      {tab === "pipeline" ? (
        <div className="flex-1 overflow-hidden">
          <PipelineKanbanPanel />
        </div>
      ) : tab === "leads" ? (
        <div className="flex-1 overflow-hidden">
          <LeadsPanel />
        </div>
      ) : tab === "automacoes" ? (
        <div className="flex-1 overflow-y-auto">
          <AutomacoesPanel />
        </div>
      ) : tab === "dashboard" ? (
        <div className="flex-1 overflow-y-auto">
          <DashboardPipelinePanel />
        </div>
      ) : tab === "membros" ? (
        <div className="flex-1 overflow-y-auto">
          <MembrosPanel />
        </div>
      ) : tab === "webhooks" ? (
        <div className="flex-1 overflow-y-auto">
          <WebhooksPanel />
        </div>
      ) : tab === "api" ? (
        <div className="flex-1 overflow-y-auto">
          <ApiAccessPanel />
        </div>
      ) : tab === "config" ? (
        <div className="flex-1 overflow-y-auto p-6">
          <CanaisConfigPanel />
        </div>
      ) : tab === "agente" ? (
        <div className="flex-1 overflow-y-auto">
          <AgenteIAPanel />
        </div>
      ) : tab === "criativos" ? (
        <div className="flex-1 overflow-y-auto">
          <CriativosInfinitosPanel />
        </div>
      ) : tab === "cadencias" ? (
        <div className="flex-1 overflow-y-auto">
          <CadenciasPanel />
        </div>
      ) : tab === "objecoes" ? (
        <div className="flex-1 overflow-y-auto">
          <ObjecoesPanel />
        </div>
      ) : tab === "metas" ? (
        <div className="flex-1 overflow-y-auto">
          <MetasPanel />
        </div>
      ) : tab === "brain" ? (
        <div className="flex-1 overflow-y-auto">
          <BrainPanel />
        </div>
      ) : tab === "analytics" ? (
        <div className="flex-1 overflow-y-auto">
          <AnalyticsPanel />
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* SIDEBAR - LISTA DE CONVERSAS */}
          <div className="w-[360px] border-r border-border flex flex-col bg-sidebar">
            <div className="p-4 border-b border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar conversas..." className="pl-10" />
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {["todos", "aguardando", "em_atendimento", "bot"].map((status) => (
                  <button key={status}
                    onClick={() => { setFiltroStatus(status); carregarConversas(); }}
                    className={`px-3 py-1 text-xs rounded-full transition-all whitespace-nowrap ${
                      filtroStatus === status
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {status === "todos" ? "Todos" : status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversasFiltradas.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nenhuma conversa encontrada</p>
                </div>
              )}
              {conversasFiltradas.map((conversa) => (
                <div key={conversa.id} onClick={() => selecionarConversa(conversa)}
                  className={`p-4 border-b border-border cursor-pointer transition-all hover:bg-accent/50 ${
                    conversaSelecionada?.id === conversa.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-lg">👤</div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center">
                        <CanalIcon tipo={conversa.canal_tipo} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {conversa.contato_nome || "Sem nome"}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {formatarHora(conversa.ultima_mensagem_em)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conversa.ultima_mensagem_de === "atendente" && <CheckCheck className="inline h-3 w-3 mr-1 text-primary" />}
                        {conversa.contato_externo_id}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          conversa.status === "aguardando" ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                          : conversa.status === "em_atendimento" ? "bg-green-500/20 text-green-600 dark:text-green-400"
                          : conversa.status === "bot" ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                          : conversa.status === "resolvido" ? "bg-muted text-muted-foreground"
                          : "bg-secondary text-secondary-foreground"
                        }`}>
                          {conversa.status === "bot" && <Bot className="inline h-3 w-3 mr-0.5" />}
                          {conversa.status.replace("_", " ")}
                        </span>
                        {conversa.prioridade === "alta" && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                        {conversa.prioridade === "urgente" && <Zap className="h-3 w-3 text-destructive fill-destructive" />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ÁREA DE CONVERSA */}
          {conversaSelecionada ? (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-sidebar">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">👤</div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{conversaSelecionada.contato_nome}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CanalIcon tipo={conversaSelecionada.canal_tipo} />
                      <span>{conversaSelecionada.canal_tipo}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost"><Phone className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost"><Video className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost"><Search className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background/50">
                {mensagens.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nenhuma mensagem ainda</p>
                  </div>
                )}
                {mensagens.map((msg) => (
                  <div key={msg.id} className={`flex items-end gap-2 ${msg.tipo_remetente === "atendente" ? "justify-end" : "justify-start"}`}>
                    {msg.tipo_remetente === "cliente" && (
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs shrink-0">👤</div>
                    )}
                    <div className={`max-w-[65%] rounded-2xl px-4 py-2.5 ${
                      msg.tipo_remetente === "atendente" ? "bg-primary text-primary-foreground rounded-br-md"
                      : msg.tipo_remetente === "bot" ? "bg-accent text-accent-foreground border border-border rounded-bl-md"
                      : "bg-card text-card-foreground border border-border rounded-bl-md"
                    }`}>
                      {msg.tipo_remetente === "bot" && (
                        <div className="flex items-center gap-1 text-[10px] text-primary mb-1 font-medium">
                          <Bot className="h-3 w-3" /> Resposta Automática
                        </div>
                      )}
                      {msg.tipo_mensagem === "texto" && <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>}
                      {msg.tipo_mensagem === "imagem" && msg.midia_url && (
                        <div>
                          <img src={msg.midia_url} alt="Imagem" className="rounded-lg max-w-full max-h-60 object-cover" />
                          {msg.conteudo && <p className="text-sm mt-1.5">{msg.conteudo}</p>}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 justify-end mt-1">
                        <span className="text-[10px] opacity-60">{formatarHora(msg.created_at)}</span>
                        {msg.tipo_remetente === "atendente" && (
                          <CheckCheck className={`h-3 w-3 ${msg.status_envio === "lido" ? "text-blue-400" : "opacity-50"}`} />
                        )}
                      </div>
                    </div>
                    {msg.tipo_remetente === "atendente" && (
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs shrink-0">👨‍💼</div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <ChatActionsBar
                onSugerirIA={pedirRespostaIA}
                onCatalogo={() => setShowCatalogo(true)}
                onCobrar={() => setShowCobrar(true)}
                onNovoEvento={() => setShowEvento(true)}
                onFollowUp={() => toast.info("Follow-up agendado para amanhã")}
                onMarcarQuente={marcarQuente}
                onVincularLead={vincularLead}
                onFluxo={() => toast.info("Selecione um fluxo nas Automações")}
                onCadencia={() => toast.info("Cadência iniciada")}
                onAnalisar={analisarConversa}
                carregandoIA={enviandoBot}
                carregandoAnalise={analisando}
              />

              <form onSubmit={enviarMensagem} className="p-3 border-t border-border bg-sidebar">
                <div className="flex items-end gap-2">
                  <Button type="button" size="icon" variant="ghost"><Paperclip className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost"><Smile className="h-4 w-4" /></Button>
                  <Textarea
                    value={novaMensagem} onChange={(e) => setNovaMensagem(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensagem(e); } }}
                    placeholder="Digite sua mensagem..." className="flex-1 min-h-[44px] max-h-32 resize-none" rows={1}
                  />
                  <Button type="submit" disabled={!novaMensagem.trim()} size="icon" className="shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Selecione uma conversa</p>
                <p className="text-sm mt-1">Escolha uma conversa ao lado para começar o atendimento</p>
              </div>
            </div>
          )}

          {/* PAINEL LATERAL DIREITO */}
          {conversaSelecionada && (
            <ContatoPanel conversa={conversaSelecionada} analise={analise}
              onAnalisar={analisarConversa} analisando={analisando} />
          )}

          {/* Dialogs */}
          {conversaSelecionada && (
            <>
              <CatalogoDialog open={showCatalogo} onOpenChange={setShowCatalogo}
                conversaId={conversaSelecionada.id}
                onEnviado={() => carregarMensagens(conversaSelecionada.id)} />
              <CobrarDialog open={showCobrar} onOpenChange={setShowCobrar}
                conversaId={conversaSelecionada.id}
                onEnviado={() => carregarMensagens(conversaSelecionada.id)} />
              <NovoEventoDialog open={showEvento} onOpenChange={setShowEvento}
                conversaId={conversaSelecionada.id}
                contatoNome={conversaSelecionada.contato_nome}
                onEnviado={() => carregarMensagens(conversaSelecionada.id)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
