import { useState } from "react";
import {
  Trophy,
  Star,
  Gift,
  Users,
  TrendingUp,
  Award,
  Crown,
  Gem,
  Medal,
  ArrowUpRight,
  Heart,
  Bell,
  MessageSquare,
  Mail,
  Smartphone,
  ShoppingCart,
  Clock,
  Cake,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

// --- Mock Data ---
const niveis = [
  { id: "bronze", label: "Bronze", icon: Medal, min: 0, max: 499, color: "hsl(30, 50%, 55%)", desconto: "5%" },
  { id: "prata", label: "Prata", icon: Award, min: 500, max: 1499, color: "hsl(220, 15%, 70%)", desconto: "10%" },
  { id: "ouro", label: "Ouro", icon: Crown, min: 1500, max: 3999, color: "hsl(45, 90%, 55%)", desconto: "15%" },
  { id: "platina", label: "Platina", icon: Gem, min: 4000, max: 99999, color: "hsl(270, 60%, 65%)", desconto: "20%" },
];

const beneficiosPorNivel: Record<string, string[]> = {
  bronze: ["5% desconto em peças"],
  prata: ["10% desconto em peças", "Agendamento prioritário"],
  ouro: ["15% desconto em peças", "Brinde mensal", "Frete grátis e-commerce"],
  platina: ["20% desconto em peças", "Gerente dedicado", "Revisão grátis trimestral", "Acesso antecipado a promoções"],
};

const resgates = [
  { item: "Desconto R$ 50", pontos: 500, icon: Gift },
  { item: "Troca de óleo grátis", pontos: 1200, icon: Star },
  { item: "Kit limpeza completa", pontos: 2000, icon: Award },
  { item: "Capacete HJC i70", pontos: 5000, icon: Crown },
  { item: "Jaqueta X11 Breeze", pontos: 8000, icon: Gem },
];

const topClientes = [
  { nome: "Carlos Silva", pontos: 4850, nivel: "platina", gasto: "R$ 12.400", visitas: 34 },
  { nome: "Ana Rodrigues", pontos: 3200, nivel: "ouro", gasto: "R$ 8.900", visitas: 22 },
  { nome: "João Mendes", pontos: 2100, nivel: "ouro", gasto: "R$ 6.300", visitas: 18 },
  { nome: "Maria Oliveira", pontos: 1400, nivel: "prata", gasto: "R$ 4.100", visitas: 12 },
  { nome: "Pedro Santos", pontos: 980, nivel: "prata", gasto: "R$ 2.800", visitas: 9 },
  { nome: "Lucas Costa", pontos: 420, nivel: "bronze", gasto: "R$ 1.200", visitas: 5 },
];

const pontosHistorico = [
  { mes: "Set", emitidos: 4200, resgatados: 1800 },
  { mes: "Out", emitidos: 5100, resgatados: 2200 },
  { mes: "Nov", emitidos: 6300, resgatados: 2800 },
  { mes: "Dez", emitidos: 8900, resgatados: 4100 },
  { mes: "Jan", emitidos: 6800, resgatados: 3200 },
  { mes: "Fev", emitidos: 7400, resgatados: 3600 },
];

const automacoes = [
  { trigger: "Inativo há 60 dias", acao: "Cupom 10% + 'Sentimos sua falta!'", canal: "WhatsApp", icon: Clock, ativos: 23, convertidos: 8 },
  { trigger: "5.000 km desde revisão", acao: "Lembrete de revisão", canal: "WhatsApp", icon: Bell, ativos: 15, convertidos: 11 },
  { trigger: "Produto favoritado em promoção", acao: "Alerta de desconto", canal: "Email", icon: Heart, ativos: 42, convertidos: 19 },
  { trigger: "Aniversário do cliente", acao: "Cupom R$ 30 de presente", canal: "SMS", icon: Cake, ativos: 8, convertidos: 7 },
  { trigger: "Carrinho abandonado (2h)", acao: "Frete grátis para finalizar", canal: "Push", icon: ShoppingCart, ativos: 31, convertidos: 12 },
  { trigger: "Indicação de amigo", acao: "+500 pontos para ambos", canal: "WhatsApp", icon: UserPlus, ativos: 14, convertidos: 9 },
];

const canalIcons: Record<string, typeof Mail> = {
  WhatsApp: MessageSquare,
  Email: Mail,
  SMS: Smartphone,
  Push: Bell,
};

const stats = [
  { title: "Clientes Fidelizados", value: "342", change: "+28 este mês", icon: Users },
  { title: "Pontos Emitidos (mês)", value: "7.400", change: "+8.8%", icon: Star },
  { title: "Resgates Realizados", value: "86", change: "+12 esta semana", icon: Gift },
  { title: "Taxa de Retenção", value: "78%", change: "+4.2%", icon: TrendingUp },
];

function getNivel(pontos: number) {
  return niveis.find((n) => pontos >= n.min && pontos <= n.max) || niveis[0];
}

function NivelBadge({ nivel }: { nivel: string }) {
  const n = niveis.find((x) => x.id === nivel);
  if (!n) return null;
  const Icon = n.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${n.color}20`, color: n.color }}
    >
      <Icon className="h-3 w-3" />
      {n.label}
    </span>
  );
}

export default function Fidelidade() {
  const [tab, setTab] = useState("programa");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fidelidade & Retenção</h1>
        <p className="text-sm text-muted-foreground">Programa de pontos, gamificação e automações de retenção</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title} className="glass-panel">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{s.title}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs">
                <ArrowUpRight className="h-3 w-3 text-success" />
                <span className="text-success">{s.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="programa">Programa de Pontos</TabsTrigger>
          <TabsTrigger value="ranking">Ranking Clientes</TabsTrigger>
          <TabsTrigger value="automacoes">Automações</TabsTrigger>
          <TabsTrigger value="resgates">Catálogo de Resgates</TabsTrigger>
        </TabsList>

        {/* --- Programa de Pontos --- */}
        <TabsContent value="programa" className="space-y-4">
          {/* Níveis */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {niveis.map((n) => {
              const Icon = n.icon;
              return (
                <Card key={n.id} className="glass-panel relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: n.color }} />
                  <CardContent className="p-5 pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${n.color}15` }}>
                        <Icon className="h-6 w-6" style={{ color: n.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: n.color }}>{n.label}</h3>
                        <p className="text-xs text-muted-foreground">{n.min.toLocaleString()} - {n.max < 99999 ? n.max.toLocaleString() : "∞"} pts</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {beneficiosPorNivel[n.id].map((b) => (
                        <div key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 text-primary" />
                          {b}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <span className="text-sm font-semibold" style={{ color: n.color }}>Desconto: {n.desconto}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Regras + Histórico */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  Regras de Pontuação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { regra: "R$ 1 gasto", pontos: "1 ponto", desc: "Todas as compras acumulam" },
                    { regra: "Indicar amigo", pontos: "500 pontos", desc: "Ambos recebem" },
                    { regra: "Avaliar serviço", pontos: "50 pontos", desc: "Após conclusão da OS" },
                    { regra: "Compra no aniversário", pontos: "2x pontos", desc: "Pontos dobrados no dia" },
                    { regra: "Primeira compra e-commerce", pontos: "200 pontos", desc: "Bônus de boas-vindas" },
                  ].map((r) => (
                    <div key={r.regra} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-3">
                      <div>
                        <p className="text-sm font-medium">{r.regra}</p>
                        <p className="text-xs text-muted-foreground">{r.desc}</p>
                      </div>
                      <Badge className="bg-primary/15 text-primary border-0">{r.pontos}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pontos Emitidos vs Resgatados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pontosHistorico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 18%)" />
                      <XAxis dataKey="mes" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                      <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(225, 22%, 11%)",
                          border: "1px solid hsl(225, 18%, 18%)",
                          borderRadius: "8px",
                          color: "hsl(220, 15%, 92%)",
                        }}
                      />
                      <Line type="monotone" dataKey="emitidos" stroke="hsl(3, 62%, 46%)" strokeWidth={2} dot={{ r: 4 }} name="Emitidos" />
                      <Line type="monotone" dataKey="resgatados" stroke="hsl(150, 60%, 45%)" strokeWidth={2} dot={{ r: 4 }} name="Resgatados" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Ranking --- */}
        <TabsContent value="ranking" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Ranking de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topClientes.map((c, i) => {
                  const nivel = getNivel(c.pontos);
                  const proximo = niveis.find((n) => n.min > c.pontos);
                  const progressoPct = proximo
                    ? ((c.pontos - nivel.min) / (proximo.min - nivel.min)) * 100
                    : 100;

                  return (
                    <div key={c.nome} className="rounded-lg border border-border/50 bg-secondary/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${i < 3 ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{c.nome}</p>
                            <p className="text-xs text-muted-foreground">{c.visitas} visitas · {c.gasto} gastos</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <NivelBadge nivel={c.nivel} />
                          <span className="font-mono text-sm font-bold text-primary">{c.pontos.toLocaleString()} pts</span>
                        </div>
                      </div>
                      {proximo && (
                        <div className="flex items-center gap-2">
                          <Progress value={progressoPct} className="h-1.5 flex-1" />
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {proximo.min - c.pontos} pts → {proximo.label}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Automações --- */}
        <TabsContent value="automacoes" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Motor de Automação & Retenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {automacoes.map((a) => {
                  const CanalIcon = canalIcons[a.canal] || Bell;
                  const taxaConversao = Math.round((a.convertidos / a.ativos) * 100);
                  return (
                    <div key={a.trigger} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <a.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{a.trigger}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.acao}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <CanalIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{a.canal}</span>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="text-xs text-muted-foreground">{a.ativos} ativos</p>
                          <p className="text-xs font-semibold text-success">{taxaConversao}% conversão</p>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs">
                          Editar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Resgates --- */}
        <TabsContent value="resgates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resgates.map((r) => {
              const Icon = r.icon;
              return (
                <Card key={r.item} className="glass-panel hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{r.item}</h3>
                        <p className="text-sm font-mono text-primary">{r.pontos.toLocaleString()} pontos</p>
                      </div>
                    </div>
                    <Button className="w-full" size="sm">
                      <Gift className="h-4 w-4 mr-1" />
                      Resgatar
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
