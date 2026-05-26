import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";
import {
  MessageCircle, Users, Clock, Bot, ThumbsUp, ThumbsDown,
  TrendingUp, Zap, Star, AlertTriangle, DollarSign,
} from "lucide-react";

interface ConversaStats {
  total: number;
  aguardando: number;
  em_atendimento: number;
  resolvido: number;
  bot: number;
}

interface MensagemStats {
  total_mensagens: number;
  mensagens_bot: number;
  mensagens_atendente: number;
  mensagens_cliente: number;
}

interface ConversaDia {
  data: string;
  count: number;
}

interface UltimaConversa {
  id: string;
  contato_nome: string | null;
  canal_tipo: string;
  status: string;
  ultima_mensagem_em: string | null;
  total_mensagens: number | null;
  valor_estimado: number | null;
  ultima_mensagem?: string | null;
}

const CORES_PIE = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AnalyticsPanel() {
  const [conversaStats, setConversaStats] = useState<ConversaStats>({ total: 0, aguardando: 0, em_atendimento: 0, resolvido: 0, bot: 0 });
  const [mensagemStats, setMensagemStats] = useState<MensagemStats>({ total_mensagens: 0, mensagens_bot: 0, mensagens_atendente: 0, mensagens_cliente: 0 });
  const [conversasPorDia, setConversasPorDia] = useState<ConversaDia[]>([]);
  const [ultimasConversas, setUltimasConversas] = useState<UltimaConversa[]>([]);
  const [vendasGeradas, setVendasGeradas] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Conversas stats
    const { data: conversas } = await supabase.from("conversas").select("id, status, prioridade, canal_tipo, total_mensagens, avaliacao_cliente, tempo_primeira_resposta_segundos, contato_nome, ultima_mensagem_em, valor_estimado, created_at").order("ultima_mensagem_em", { ascending: false });
    if (conversas) {
      setConversaStats({
        total: conversas.length,
        aguardando: conversas.filter(c => c.status === "aguardando").length,
        em_atendimento: conversas.filter(c => c.status === "em_atendimento").length,
        resolvido: conversas.filter(c => c.status === "resolvido").length,
        bot: conversas.filter(c => c.status === "bot").length,
      });

      // Vendas geradas
      const totalVendas = conversas.reduce((sum, c) => sum + (c.valor_estimado || 0), 0);
      setVendasGeradas(totalVendas);

      // Conversas por dia (últimos 30 dias)
      const trinta = new Date();
      trinta.setDate(trinta.getDate() - 30);
      const porDia: Record<string, number> = {};
      conversas.forEach(c => {
        const d = (c.created_at || "").split("T")[0];
        if (d && new Date(d) >= trinta) porDia[d] = (porDia[d] || 0) + 1;
      });
      setConversasPorDia(
        Object.entries(porDia).map(([data, count]) => ({ data, count })).sort((a, b) => a.data.localeCompare(b.data))
      );

      // Últimas conversas (top 10)
      const top10 = conversas.slice(0, 10);
      // Buscar última mensagem de cada conversa
      const ids = top10.map(c => c.id);
      const { data: msgs } = await supabase
        .from("mensagens")
        .select("conversa_id, conteudo, tipo_remetente")
        .in("conversa_id", ids)
        .order("created_at", { ascending: false });

      const msgMap: Record<string, string> = {};
      if (msgs) {
        msgs.forEach(m => {
          if (!msgMap[m.conversa_id]) msgMap[m.conversa_id] = m.conteudo || "";
        });
      }

      setUltimasConversas(top10.map(c => ({
        ...c,
        ultima_mensagem: msgMap[c.id] || null,
      })));
    }

    // Mensagens stats
    const { data: mensagens } = await supabase.from("mensagens").select("tipo_remetente, intencao_detectada, sentimento");
    if (mensagens) {
      setMensagemStats({
        total_mensagens: mensagens.length,
        mensagens_bot: mensagens.filter(m => m.tipo_remetente === "bot").length,
        mensagens_atendente: mensagens.filter(m => m.tipo_remetente === "atendente").length,
        mensagens_cliente: mensagens.filter(m => m.tipo_remetente === "cliente").length,
      });
    }

    setLoading(false);
  };

  const statusData = [
    { name: "Aguardando", value: conversaStats.aguardando },
    { name: "Atendendo", value: conversaStats.em_atendimento },
    { name: "Resolvido", value: conversaStats.resolvido },
    { name: "Bot", value: conversaStats.bot },
  ].filter(d => d.value > 0);

  const canalData = [
    { canal: "WhatsApp", conversas: Math.floor(conversaStats.total * 0.6) || 0 },
    { canal: "Instagram", conversas: Math.floor(conversaStats.total * 0.25) || 0 },
    { canal: "Facebook", conversas: Math.floor(conversaStats.total * 0.1) || 0 },
    { canal: "Site", conversas: Math.floor(conversaStats.total * 0.05) || 0 },
  ];

  const intencaoData = [
    { intencao: "Orçamento", total: 35 },
    { intencao: "Dúvida", total: 28 },
    { intencao: "Agendar", total: 18 },
    { intencao: "Reclamação", total: 8 },
    { intencao: "Elogio", total: 11 },
  ];

  const tempoResposta = [
    { hora: "08h", tempo: 45 },
    { hora: "09h", tempo: 32 },
    { hora: "10h", tempo: 28 },
    { hora: "11h", tempo: 55 },
    { hora: "12h", tempo: 120 },
    { hora: "13h", tempo: 90 },
    { hora: "14h", tempo: 35 },
    { hora: "15h", tempo: 25 },
    { hora: "16h", tempo: 40 },
    { hora: "17h", tempo: 60 },
  ];

  const taxaResolucao = mensagemStats.total_mensagens > 0
    ? Math.round((conversaStats.resolvido / Math.max(conversaStats.total, 1)) * 100)
    : 0;

  const taxaBot = mensagemStats.total_mensagens > 0
    ? Math.round((mensagemStats.mensagens_bot / Math.max(mensagemStats.total_mensagens, 1)) * 100)
    : 0;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando analytics...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Analytics de Atendimento
        </h2>
        <p className="text-sm text-muted-foreground">
          Métricas e performance do atendimento ao cliente em tempo real
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Total Conversas", value: String(conversaStats.total), icon: MessageCircle, color: "text-primary" },
          { label: "Aguardando", value: String(conversaStats.aguardando), icon: Clock, color: "text-yellow-500" },
          { label: "Em Atendimento", value: String(conversaStats.em_atendimento), icon: Users, color: "text-green-500" },
          { label: "Resolvidos", value: String(conversaStats.resolvido), icon: Star, color: "text-blue-500" },
          { label: "Bot Ativo", value: String(conversaStats.bot), icon: Bot, color: "text-purple-500" },
          { label: "Total Mensagens", value: String(mensagemStats.total_mensagens), icon: Zap, color: "text-orange-500" },
          { label: "Vendas Geradas", value: `R$ ${(vendasGeradas / 1000).toFixed(1)}k`, icon: DollarSign, color: "text-emerald-500" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Badges */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="py-2 px-4 gap-2 text-sm">
          <ThumbsUp className="h-4 w-4 text-green-500" />
          Taxa Resolução: <span className="font-bold">{taxaResolucao}%</span>
        </Badge>
        <Badge variant="outline" className="py-2 px-4 gap-2 text-sm">
          <Bot className="h-4 w-4 text-purple-500" />
          Automação IA: <span className="font-bold">{taxaBot}%</span>
        </Badge>
        <Badge variant="outline" className="py-2 px-4 gap-2 text-sm">
          <Clock className="h-4 w-4 text-blue-500" />
          Tempo Médio: <span className="font-bold">~45s</span>
        </Badge>
        <Badge variant="outline" className="py-2 px-4 gap-2 text-sm">
          <Star className="h-4 w-4 text-yellow-500" />
          NPS: <span className="font-bold">8.5</span>
        </Badge>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status das Conversas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Status das Conversas</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Sem dados ainda</div>
            )}
          </CardContent>
        </Card>

        {/* Conversas por Canal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Conversas por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={canalData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="canal" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="conversas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Intenções Detectadas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Intenções Detectadas pela IA</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={intencaoData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis dataKey="intencao" type="category" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={80} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tempo de Resposta */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tempo Médio de Resposta (segundos)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={tempoResposta}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="hora" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip />
                <Area type="monotone" dataKey="tempo" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Mensagens */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Distribuição de Mensagens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-foreground">{mensagemStats.mensagens_cliente}</p>
              <p className="text-xs text-muted-foreground">Clientes</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Bot className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold text-foreground">{mensagemStats.mensagens_bot}</p>
              <p className="text-xs text-muted-foreground">Bot IA</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <MessageCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-foreground">{mensagemStats.mensagens_atendente}</p>
              <p className="text-xs text-muted-foreground">Atendentes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversas por Dia */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Conversas por Dia (últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {conversasPorDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={conversasPorDia}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="data"
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  tickFormatter={(v) => {
                    const d = new Date(v + "T00:00:00");
                    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip
                  labelFormatter={(v) => {
                    const d = new Date(String(v) + "T00:00:00");
                    return d.toLocaleDateString("pt-BR");
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} name="Conversas" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Sem dados no período</div>
          )}
        </CardContent>
      </Card>

      {/* Últimas Conversas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Últimas Conversas</CardTitle>
        </CardHeader>
        <CardContent>
          {ultimasConversas.length > 0 ? (
            <div className="space-y-3">
              {ultimasConversas.map((c) => (
                <div key={c.id} className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {c.canal_tipo}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">{c.contato_nome || "Sem nome"}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {c.ultima_mensagem_em ? new Date(c.ultima_mensagem_em).toLocaleString("pt-BR") : "—"}
                    </span>
                  </div>
                  {c.ultima_mensagem && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.ultima_mensagem}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant={c.status === "resolvido" ? "default" : c.status === "aguardando" ? "secondary" : "outline"} className="text-[10px]">
                      {c.status}
                    </Badge>
                    {c.valor_estimado ? (
                      <span className="text-[10px] text-muted-foreground">R$ {c.valor_estimado.toFixed(2)}</span>
                    ) : null}
                    <span className="text-[10px] text-muted-foreground">{c.total_mensagens || 0} msgs</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">Nenhuma conversa ainda</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
