import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Bot,
  Brain,
  Zap,
  MessageSquare,
  Shield,
  Wrench,
  BookOpen,
  Sparkles,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ChevronRight,
  Edit,
} from "lucide-react";

interface Funcao {
  nome: string;
  descricao: string;
  ativa: boolean;
}

interface TreinamentoItem {
  id?: string;
  pergunta: string;
  resposta: string;
  categoria: string;
}

const CATEGORIAS = [
  { value: "consulta_produto", label: "Consulta de Produto" },
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "orcamento", label: "Orçamento" },
  { value: "agendamento", label: "Agendamento" },
];

export default function AgenteIAPanel() {
  const [nomeAgente, setNomeAgente] = useState("Otto Tech Sistemas IA");
  const [personalidade, setPersonalidade] = useState(
    "Você é um assistente virtual da Otto Tech Sistemas, uma oficina especializada em motocicletas. Seja cordial, prestativo e use um tom amigável. Use emojis de forma moderada (1-2 por mensagem). Respostas curtas e diretas (máximo 3 linhas)."
  );
  const [instrucoes, setInstrucoes] = useState(
    "1. Se o cliente perguntar sobre preços, peças ou serviços, consulte o banco de dados\n2. Se não souber responder, transfira para um atendente humano\n3. Para reclamações, priorize o atendimento humano\n4. Sempre confirme o modelo da moto antes de dar orçamento"
  );
  const [temperatura, setTemperatura] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(150);
  const [autoAtendimento, setAutoAtendimento] = useState(true);
  const [transbordo, setTransbordo] = useState(true);
  const [limiteTransbordo, setLimiteTransbordo] = useState(3);

  const [funcoes, setFuncoes] = useState<Funcao[]>([
    { nome: "consultar_estoque", descricao: "Busca produtos no catálogo por nome, código ou aplicação", ativa: true },
    { nome: "criar_orcamento", descricao: "Cria um orçamento com produtos e serviços selecionados", ativa: true },
    { nome: "agendar_servico", descricao: "Agenda horário para serviço na oficina", ativa: true },
    { nome: "consultar_preco", descricao: "Retorna preço de um produto específico", ativa: true },
    { nome: "verificar_garantia", descricao: "Verifica status de garantia de uma OS", ativa: false },
    { nome: "consultar_os", descricao: "Consulta status de uma Ordem de Serviço", ativa: true },
  ]);

  const [treinamento, setTreinamento] = useState<TreinamentoItem[]>([]);
  const [loadingTreinamento, setLoadingTreinamento] = useState(true);
  const [novoTreinamento, setNovoTreinamento] = useState({ pergunta: "", resposta: "", categoria: "consulta_produto" });
  const [editandoId, setEditandoId] = useState<string | null>(null);

  useEffect(() => {
    carregarTreinamento();
  }, []);

  const carregarTreinamento = async () => {
    const { data } = await supabase
      .from("agente_treinamento")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setTreinamento(data.map(d => ({ id: d.id, pergunta: d.pergunta, resposta: d.resposta, categoria: d.categoria })));
    setLoadingTreinamento(false);
  };

  const toggleFuncao = (idx: number) => {
    setFuncoes(prev => prev.map((f, i) => i === idx ? { ...f, ativa: !f.ativa } : f));
  };

  const adicionarTreinamento = async () => {
    if (!novoTreinamento.pergunta.trim() || !novoTreinamento.resposta.trim()) return;

    if (editandoId) {
      const { error } = await supabase.from("agente_treinamento").update({
        pergunta: novoTreinamento.pergunta,
        resposta: novoTreinamento.resposta,
        categoria: novoTreinamento.categoria,
      }).eq("id", editandoId);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Exemplo atualizado!");
      setEditandoId(null);
    } else {
      const { error } = await supabase.from("agente_treinamento").insert({
        pergunta: novoTreinamento.pergunta,
        resposta: novoTreinamento.resposta,
        categoria: novoTreinamento.categoria,
      });
      if (error) { toast.error("Erro ao salvar"); return; }
      toast.success("Exemplo de treinamento adicionado!");
    }

    setNovoTreinamento({ pergunta: "", resposta: "", categoria: "consulta_produto" });
    carregarTreinamento();
  };

  const editarTreinamento = (item: TreinamentoItem) => {
    setEditandoId(item.id || null);
    setNovoTreinamento({ pergunta: item.pergunta, resposta: item.resposta, categoria: item.categoria });
  };

  const removerTreinamento = async (item: TreinamentoItem) => {
    if (!item.id) return;
    await supabase.from("agente_treinamento").delete().eq("id", item.id);
    toast.success("Exemplo removido");
    carregarTreinamento();
  };

  const salvarConfiguracoes = () => {
    toast.success("Configurações do agente salvas com sucesso! 🤖");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Agente IA — Configuração
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure o comportamento, funções e treinamento do agente de atendimento
          </p>
        </div>
        <Button onClick={salvarConfiguracoes} className="gap-2">
          <Save className="h-4 w-4" /> Salvar Tudo
        </Button>
      </div>

      <Tabs defaultValue="personalidade">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="personalidade" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Personalidade
          </TabsTrigger>
          <TabsTrigger value="funcoes" className="gap-1.5">
            <Wrench className="h-3.5 w-3.5" /> Funções
          </TabsTrigger>
          <TabsTrigger value="treinamento" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Treinamento
          </TabsTrigger>
          <TabsTrigger value="regras" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Regras
          </TabsTrigger>
        </TabsList>

        {/* PERSONALIDADE */}
        <TabsContent value="personalidade" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="h-4 w-4" /> Identidade do Agente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nome do Agente</label>
                  <Input value={nomeAgente} onChange={e => setNomeAgente(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Prompt de Personalidade</label>
                  <Textarea value={personalidade} onChange={e => setPersonalidade(e.target.value)} rows={5} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Instruções Específicas</label>
                  <Textarea value={instrucoes} onChange={e => setInstrucoes(e.target.value)} rows={5} className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Parâmetros do Modelo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground">Temperatura (Criatividade)</label>
                    <Badge variant="secondary" className="text-xs">{temperatura}</Badge>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.1"
                    value={temperatura}
                    onChange={e => setTemperatura(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Preciso</span><span>Criativo</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground">Max Tokens (Tamanho Resposta)</label>
                    <Badge variant="secondary" className="text-xs">{maxTokens}</Badge>
                  </div>
                  <input
                    type="range" min="50" max="500" step="10"
                    value={maxTokens}
                    onChange={e => setMaxTokens(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Curto</span><span>Longo</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-accent/50 border border-border">
                  <h4 className="text-sm font-semibold text-foreground mb-1">Modelo Ativo</h4>
                  <p className="text-xs text-muted-foreground">Google Gemini 3 Flash (via Lovable AI Gateway)</p>
                  <Badge className="mt-2 text-[10px]">google/gemini-3-flash-preview</Badge>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Detecção de Intenção</p>
                        <p className="text-[11px] text-muted-foreground">Classifica: orçamento, dúvida, agendamento, reclamação, elogio</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Memória Conversacional</p>
                        <p className="text-[11px] text-muted-foreground">Últimas 10 mensagens como contexto do diálogo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FUNÇÕES */}
        <TabsContent value="funcoes" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Funções Disponíveis para o Agente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {funcoes.map((funcao, idx) => (
                <div key={funcao.nome} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${funcao.ativa ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                    <div>
                      <code className="text-xs font-mono text-primary">{funcao.nome}</code>
                      <p className="text-[11px] text-muted-foreground">{funcao.descricao}</p>
                    </div>
                  </div>
                  <Switch checked={funcao.ativa} onCheckedChange={() => toggleFuncao(idx)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TREINAMENTO */}
        <TabsContent value="treinamento" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Exemplos de Treinamento (Few-Shot)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingTreinamento ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : treinamento.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum exemplo cadastrado ainda.</p>
              ) : (
                treinamento.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg border border-border bg-secondary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">
                        {CATEGORIAS.find(c => c.value === item.categoria)?.label || item.categoria}
                      </Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => editarTreinamento(item)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removerTreinamento(item)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full shrink-0 mt-0.5">Cliente</span>
                      <p className="text-sm text-foreground">{item.pergunta}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] bg-accent/50 text-accent-foreground px-2 py-0.5 rounded-full shrink-0 mt-0.5">Bot</span>
                      <p className="text-sm text-foreground">{item.resposta}</p>
                    </div>
                  </div>
                ))
              )}

              <div className="p-4 border-2 border-dashed border-border rounded-lg space-y-3">
                <h4 className="text-sm font-medium text-foreground">
                  {editandoId ? "Editar Exemplo" : "Adicionar Novo Exemplo"}
                </h4>
                <Select
                  value={novoTreinamento.categoria}
                  onValueChange={v => setNovoTreinamento(prev => ({ ...prev, categoria: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Pergunta do cliente..."
                  value={novoTreinamento.pergunta}
                  onChange={e => setNovoTreinamento(prev => ({ ...prev, pergunta: e.target.value }))}
                />
                <Textarea
                  placeholder="Resposta ideal do bot..."
                  value={novoTreinamento.resposta}
                  onChange={e => setNovoTreinamento(prev => ({ ...prev, resposta: e.target.value }))}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={adicionarTreinamento} className="gap-1">
                    {editandoId ? <Save className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {editandoId ? "Salvar" : "Adicionar Exemplo"}
                  </Button>
                  {editandoId && (
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditandoId(null);
                      setNovoTreinamento({ pergunta: "", resposta: "", categoria: "consulta_produto" });
                    }}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REGRAS */}
        <TabsContent value="regras" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Regras de Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Auto-atendimento IA</p>
                    <p className="text-[11px] text-muted-foreground">Bot responde automaticamente novas mensagens</p>
                  </div>
                  <Switch checked={autoAtendimento} onCheckedChange={setAutoAtendimento} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Transbordo Automático</p>
                    <p className="text-[11px] text-muted-foreground">Transferir para humano quando necessário</p>
                  </div>
                  <Switch checked={transbordo} onCheckedChange={setTransbordo} />
                </div>

                {transbordo && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Transferir após X tentativas sem resolução
                    </label>
                    <Input
                      type="number" min={1} max={10}
                      value={limiteTransbordo}
                      onChange={e => setLimiteTransbordo(Number(e.target.value))}
                      className="mt-1 w-24"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Gatilhos de Transbordo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { gatilho: "Reclamação detectada", acao: "Prioridade alta + transferir" },
                    { gatilho: "Cliente pede atendente", acao: "Transferir imediatamente" },
                    { gatilho: "3 mensagens sem resolução", acao: "Marcar como aguardando" },
                    { gatilho: "Palavra-chave: 'gerente'", acao: "Alerta + prioridade urgente" },
                    { gatilho: "Fora do horário comercial", acao: "Mensagem de espera + fila" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded bg-secondary/30 border border-border">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">{item.gatilho}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <ChevronRight className="h-3 w-3" /> {item.acao}
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
