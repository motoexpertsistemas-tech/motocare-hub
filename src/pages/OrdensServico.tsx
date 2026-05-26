import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Search, Filter, Wrench, Car, User, Clock, Camera, Eye, ChevronDown, ChevronUp, ChevronRight, CheckCircle2, Gauge, Fuel, Droplets, DollarSign, TrendingUp, Timer, Phone, MessageCircle, Bike, Printer, Pencil, MoreVertical, FileText, Tag, Share2, Mail, MessageSquare, Receipt, Copy, ArrowLeftRight, CreditCard, RefreshCw, Factory, Ticket, FileCheck, FilePlus, PenTool, Activity, CalendarCheck, CalendarCheck2, FileInput, Undo2, Landmark, StickyNote, AlertTriangle, Zap, ChevronsUp, CheckIcon, Settings, Trash2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { printOS } from "@/lib/printOS";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRole } from "@/contexts/RoleContext";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";



const statusStyles: Record<string, string> = {
  "Em Execução": "bg-red-500/15 text-red-600 border-red-500/30",
  "Aguardando Peças": "bg-amber-500/15 text-amber-600 border-amber-500/30",
  "Pronta": "bg-green-500/15 text-green-600 border-green-500/30",
  "Entregue": "bg-muted text-muted-foreground border-border",
  "Agendada": "bg-blue-500/15 text-blue-600 border-blue-500/30",
  "Atendimento": "bg-orange-500/15 text-orange-600 border-orange-500/30",
  em_execucao: "bg-red-500/15 text-red-600 border-red-500/30",
  aguardando_pecas: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  pronta: "bg-green-500/15 text-green-600 border-green-500/30",
  entregue: "bg-muted text-muted-foreground border-border",
  agendada: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  agendamento: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  AGENDAMENTO: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  atendimento: "bg-orange-500/15 text-orange-600 border-orange-500/30",
};

const statusFlow = ["Agendada", "Em Execução", "Aguardando Peças", "Pronta", "Entregue"];

function OSDashboard({ realOS }: { realOS: any[] }) {
  const now = new Date();

  // Current week boundaries (Monday to Sunday)
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Current month boundaries
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const stats = useMemo(() => {
    const activeStatuses = ["agendada", "AGENDAMENTO", "agendamento", "em_execucao", "aguardando_pecas", "pronta", "atendimento"];
    const osAtivas = realOS.filter((os) => activeStatuses.includes(os.status)).length;

    const entregues = realOS.filter((os) => os.status === "entregue");
    const entreguesSemana = entregues.filter((os) => {
      const d = new Date(os.updated_at || os.created_at);
      return d >= monday && d <= sunday;
    });

    const osMes = realOS.filter((os) => {
      const d = new Date(os.created_at);
      return d >= monthStart && d <= monthEnd;
    });
    const osMesConcluidas = osMes.filter((os) => os.status === "concluido" || os.status === "concretizado");
    const faturamentoMes = osMesConcluidas.reduce((sum, os) => sum + (os.valor_total || 0), 0);
    const ticketMedio = osMesConcluidas.length > 0 ? faturamentoMes / osMesConcluidas.length : 0;

    // Weekly revenue by day
    const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const weeklyRevenue = diasSemana.map((dia, i) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dayStart = new Date(dayDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOS = realOS.filter((os) => {
        const d = new Date(os.created_at);
        return d >= dayStart && d <= dayEnd && (os.status === "concluido" || os.status === "concretizado");
      });
      return { dia, valor: dayOS.reduce((sum: number, os: any) => sum + (os.valor_total || 0), 0) };
    });

    // Status pie chart
    const statusMap: Record<string, { name: string; color: string }> = {
      atendimento: { name: "Atendimento", color: "hsl(25, 90%, 55%)" },
      em_execucao: { name: "Em Execução", color: "hsl(3, 55%, 52%)" },
      aguardando_pecas: { name: "Aguard. Peças", color: "hsl(40, 95%, 55%)" },
      pronta: { name: "Pronta", color: "hsl(150, 60%, 45%)" },
      agendada: { name: "Agendada", color: "hsl(200, 70%, 50%)" },
      AGENDAMENTO: { name: "Agendamento", color: "hsl(200, 70%, 50%)" },
      agendamento: { name: "Agendamento", color: "hsl(200, 70%, 50%)" },
      entregue: { name: "Entregue", color: "hsl(220, 10%, 55%)" },
    };
    const statusCount: Record<string, number> = {};
    realOS.forEach((os) => {
      const key = os.status;
      if (statusMap[key]) {
        const name = statusMap[key].name;
        statusCount[name] = (statusCount[name] || 0) + 1;
      }
    });
    const osStatusPie = Object.entries(statusCount).map(([name, value]) => {
      const entry = Object.values(statusMap).find((s) => s.name === name);
      return { name, value, color: entry?.color || "hsl(220, 10%, 55%)" };
    });

    return { osAtivas, entreguesSemana: entreguesSemana.length, faturamentoMes, ticketMedio, weeklyRevenue, osStatusPie };
  }, [realOS]);

  const kpis = [
    {
      title: "OS Ativas",
      value: String(stats.osAtivas),
      icon: Wrench,
      gradient: "from-blue-500/10 to-indigo-500/5",
      iconColor: "text-blue-500",
      borderColor: "border-blue-500/20 hover:border-blue-500/40",
      glowColor: "hover:shadow-blue-500/10"
    },
    {
      title: "Faturamento OS (mês)",
      value: `R$ ${stats.faturamentoMes.toLocaleString("pt-BR")}`,
      icon: DollarSign,
      gradient: "from-emerald-500/10 to-teal-500/5",
      iconColor: "text-emerald-500",
      borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
      glowColor: "hover:shadow-emerald-500/10"
    },
    {
      title: "Ticket Médio OS",
      value: `R$ ${Math.round(stats.ticketMedio).toLocaleString("pt-BR")}`,
      icon: TrendingUp,
      gradient: "from-violet-500/10 to-purple-500/5",
      iconColor: "text-violet-500",
      borderColor: "border-violet-500/20 hover:border-violet-500/40",
      glowColor: "hover:shadow-violet-500/10"
    },
    {
      title: "Entregues (semana)",
      value: String(stats.entreguesSemana),
      icon: Bike,
      gradient: "from-amber-500/10 to-orange-500/5",
      iconColor: "text-amber-500",
      borderColor: "border-amber-500/20 hover:border-amber-500/40",
      glowColor: "hover:shadow-amber-500/10"
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card 
            key={kpi.title} 
            className={`glass-panel border ${kpi.borderColor} ${kpi.glowColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-default overflow-hidden relative group`}
          >
            {/* Efeito sutil de brilho no fundo */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-br ${kpi.gradient} opacity-20 group-hover:scale-125 transition-transform duration-500 pointer-events-none blur-lg`} />
            
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{kpi.title}</p>
                  <p className="text-3xl font-extrabold font-mono tracking-tight text-foreground">{kpi.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.gradient} ${kpi.borderColor} border shrink-0`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prioridade */}
      {(() => {
        const prioridadeConfig = [
          { label: "Urgente", key: "urgente", bg: "bg-[#8B1A1A]", icon: AlertTriangle },
          { label: "Alta", key: "alta", bg: "bg-[#F28C28]", icon: ChevronsUp },
          { label: "Normal", key: "normal", bg: "bg-[#F5B800]", icon: ChevronUp },
          { label: "Baixa", key: "baixa", bg: "bg-[#00A651]", icon: CheckIcon },
        ];
        const priCount: Record<string, number> = {};
        realOS.forEach((os) => {
          const p = (os.prioridade || "normal").toLowerCase();
          prioridadeConfig.forEach((pc) => {
            if (p === pc.key) {
              priCount[pc.key] = (priCount[pc.key] || 0) + 1;
            }
          });
        });
        return (
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Prioridade
                </span>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {prioridadeConfig.map((p) => (
                  <div key={p.key} className={`${p.bg} rounded-lg p-4 text-white flex flex-col justify-between min-h-[80px]`}>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{priCount[p.key] || 0}</span>
                      <p.icon className="h-6 w-6 opacity-60" />
                    </div>
                    <span className="text-xs font-medium opacity-90 mt-1">{p.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-panel lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Faturamento OS — Semana Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyRevenue}>
                  <XAxis dataKey="dia" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"]}
                  />
                  <Bar dataKey="valor" fill="hsl(3, 62%, 46%)" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4 text-primary" />
              OS por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.osStatusPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={4}>
                    {stats.osStatusPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {stats.osStatusPie.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const statusIcons: Record<string, any> = {
  agendada: Clock,
  atendimento: Phone,
  em_execucao: Wrench,
  aguardando_pecas: Settings,
  pronta: CheckCircle2,
  entregue: Bike,
};

export default function OrdensServico() {
  const role = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedVeiculo, setExpandedVeiculo] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advCodigo, setAdvCodigo] = useState("");
  const [advCliente, setAdvCliente] = useState("");
  const [advEquipamento, setAdvEquipamento] = useState("");
  const [advMarca, setAdvMarca] = useState("");
  const [advModelo, setAdvModelo] = useState("");
  const [advSerie, setAdvSerie] = useState("");
  const [advProduto, setAdvProduto] = useState("");
  const [advServico, setAdvServico] = useState("");
  const [advDataEntradaInicio, setAdvDataEntradaInicio] = useState("");
  const [advDataEntradaFim, setAdvDataEntradaFim] = useState("");
  const [advDataSaidaInicio, setAdvDataSaidaInicio] = useState("");
  const [advDataSaidaFim, setAdvDataSaidaFim] = useState("");
  const [realOS, setRealOS] = useState<any[]>([]);
  const [osItensMap, setOsItensMap] = useState<Record<string, { descricao: string; status: string; tecnico: string | null }[]>>({});
  const [situacoes, setSituacoes] = useState<{ id: string; nome: string; cor: string; ordem: number }[]>([]);

  const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");

  useEffect(() => {
    supabase.from("situacoes_os").select("id, nome, cor, ordem").order("ordem").then(({ data }) => {
      if (data) setSituacoes(data as any);
    });
  }, []);

  const fetchOS = async () => {
    const { data } = await supabase
      .from("ordem_servico")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setRealOS(data as any[]);
      const ids = data.map((os: any) => os.id);
      if (ids.length > 0) {
        const { data: itens } = await supabase
          .from("os_itens")
          .select("os_id, descricao, status, tecnico")
          .in("os_id", ids);
        if (itens) {
          const map: Record<string, { descricao: string; status: string; tecnico: string | null }[]> = {};
          itens.forEach((item: any) => {
            if (!map[item.os_id]) map[item.os_id] = [];
            map[item.os_id].push({ descricao: item.descricao, status: item.status || "pendente", tecnico: item.tecnico });
          });
          setOsItensMap(map);
        }
      }
    }
  };

  useEffect(() => { fetchOS(); }, [location.key]);

  const handleAlterarStatus = async (osId: string, novoStatus: string) => {
    const { error } = await supabase.from("ordem_servico").update({ status: novoStatus }).eq("id", osId);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Situação atualizada");
    fetchOS();
  };

  const handleCancelarOS = async (os: any) => {
    if (!window.confirm(`Cancelar a OS ${os.numero_os}? O status será marcado como Cancelada.`)) return;
    const { error } = await supabase.from("ordem_servico").update({ status: "cancelada" }).eq("id", os.id);
    if (error) { toast.error("Erro ao cancelar: " + error.message); return; }
    toast.success("OS cancelada");
    fetchOS();
  };

  const handleExcluirOS = async (os: any) => {
    if (!window.confirm(`Excluir definitivamente o agendamento ${os.numero_os}? Esta ação não pode ser desfeita.`)) return;
    await supabase.from("os_itens").delete().eq("os_id", os.id);
    const { error } = await supabase.from("ordem_servico").delete().eq("id", os.id);
    if (error) { toast.error("Erro ao excluir: " + error.message); return; }
    toast.success("Agendamento excluído");
    fetchOS();
  };

  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const hasAdvancedFilters = advCodigo || advCliente || advEquipamento || advMarca || advModelo || advSerie || advProduto || advServico || advDataEntradaInicio || advDataEntradaFim || advDataSaidaInicio || advDataSaidaFim;
  const clearAdvancedFilters = () => { setAdvCodigo(""); setAdvCliente(""); setAdvEquipamento(""); setAdvMarca(""); setAdvModelo(""); setAdvSerie(""); setAdvProduto(""); setAdvServico(""); setAdvDataEntradaInicio(""); setAdvDataEntradaFim(""); setAdvDataSaidaInicio(""); setAdvDataSaidaFim(""); };


  // Advanced filter for real OS
  const matchesAdvanced = (os: any) => {
    if (advCodigo && !normalize(os.numero_os || "").includes(normalize(advCodigo))) return false;
    if (advCliente && !normalize(os.cliente_nome || "").includes(normalize(advCliente))) return false;
    if (advEquipamento && !normalize(os.placa || "").includes(normalize(advEquipamento))) return false;
    if (advMarca && !normalize(os.veiculo_marca || "").includes(normalize(advMarca))) return false;
    if (advModelo && !normalize(os.veiculo_modelo || "").includes(normalize(advModelo))) return false;
    if (advSerie && !normalize(os.veiculo_chassi || "").includes(normalize(advSerie))) return false;
    if (advDataEntradaInicio) {
      const d = os.created_at ? os.created_at.slice(0, 10) : "";
      if (d < advDataEntradaInicio) return false;
    }
    if (advDataEntradaFim) {
      const d = os.created_at ? os.created_at.slice(0, 10) : "";
      if (d > advDataEntradaFim) return false;
    }
    if (advDataSaidaInicio) {
      const d = os.updated_at ? os.updated_at.slice(0, 10) : "";
      if (d < advDataSaidaInicio) return false;
    }
    if (advDataSaidaFim) {
      const d = os.updated_at ? os.updated_at.slice(0, 10) : "";
      if (d > advDataSaidaFim) return false;
    }
    // Product / Service filters check items
    if (advProduto || advServico) {
      const itens = osItensMap[os.id] || [];
      if (advProduto && !itens.some(i => normalize(i.descricao || "").includes(normalize(advProduto)))) return false;
      if (advServico && !itens.some(i => normalize(i.descricao || "").includes(normalize(advServico)))) return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ordens de Serviço</h1>
          <p className="text-sm text-muted-foreground">Gerencie todas as OS da oficina</p>
        </div>
        <Button className="gradient-primary text-primary-foreground gap-2" onClick={() => navigate("/os/nova")}>
          <Plus className="h-4 w-4" />
          Nova OS
        </Button>
      </div>

      {/* Status summary from real data */}
      <div className="flex flex-wrap gap-2.5">
        <Badge
          variant="outline"
          className="px-4 py-2 text-xs font-semibold cursor-pointer transition-all duration-300 rounded-full border border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/60 hover:scale-105 active:scale-95 shadow-sm hover:shadow flex items-center gap-2"
          onClick={() => navigate("/os/revisoes-agendadas")}
        >
          <CalendarCheck2 className="h-4 w-4 text-primary animate-pulse" />
          <span className="font-medium tracking-wide">Revisões Agendadas</span>
          {realOS.filter(os => ["agendada", "agendada_confirmada", "agendada_recusada"].includes(os.status)).length > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-extrabold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center border border-primary-foreground/20">
              {realOS.filter(os => ["agendada", "agendada_confirmada", "agendada_recusada"].includes(os.status)).length}
            </span>
          )}
        </Badge>

        {(situacoes.length > 0
          ? situacoes.map(s => ({ key: slug(s.nome), label: s.nome, cor: s.cor }))
          : [
              { key: "agendada", label: "Agendada", cor: "#3b82f6" },
              { key: "atendimento", label: "Atendimento", cor: "#f97316" },
              { key: "em_execucao", label: "Em Execução", cor: "#ef4444" },
              { key: "aguardando_pecas", label: "Aguardando Peças", cor: "#f59e0b" },
              { key: "pronta", label: "Pronta", cor: "#22c55e" },
              { key: "entregue", label: "Entregue", cor: "#6b7280" },
            ]
        ).map(({ key, label, cor }) => {
          const count = realOS.filter((os) => {
            const osKey = slug(os.status || "");
            return osKey === key || (key === "agendada" && (os.status === "AGENDAMENTO" || os.status === "agendamento"));
          }).length;
          const isActive = statusFilter === key;
          const StatusIcon = statusIcons[key] || Tag;
          
          return (
            <Badge
              key={key}
              variant="outline"
              className="px-4 py-2 text-xs font-semibold cursor-pointer transition-all duration-300 rounded-full flex items-center gap-2 border hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
              style={{ 
                backgroundColor: isActive ? cor : `${cor}12`, 
                color: isActive ? "#ffffff" : cor, 
                borderColor: isActive ? cor : `${cor}33`,
                boxShadow: isActive ? `0 4px 12px ${cor}40` : "none"
              }}
              onClick={() => setStatusFilter(isActive ? null : key)}
            >
              <StatusIcon className={`h-4 w-4 ${isActive ? "text-white" : ""}`} style={{ color: isActive ? "#ffffff" : cor }} />
              <span className="font-medium tracking-wide">{label}</span>
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{ 
                  backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.04)", 
                  color: isActive ? "#ffffff" : cor, 
                  borderColor: isActive ? "rgba(255,255,255,0.3)" : `${cor}22` 
                }}
              >
                {count}
              </span>
            </Badge>
          );
        })}
      </div>

      {/* Admin-only dashboard */}
      {role === "ADMIN" && <OSDashboard realOS={realOS} />}

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por OS, placa, modelo ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>
        <Button
          variant={showAdvanced || hasAdvancedFilters ? "default" : "outline"}
          size="sm"
          className="gap-1.5 whitespace-nowrap"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Search className="h-4 w-4" />
          Busca avançada
          {hasAdvancedFilters && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">!</Badge>
          )}
        </Button>
      </div>

      {/* Advanced Search Panel */}
      {showAdvanced && (
        <Card className="glass-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Busca Avançada</h3>
              {hasAdvancedFilters && (
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={clearAdvancedFilters}>
                  <Filter className="h-3 w-3 mr-1" /> Limpar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Código</label>
                <Input placeholder="Nº da OS" value={advCodigo} onChange={(e) => setAdvCodigo(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-muted-foreground font-medium">Data de entrada</label>
                <div className="flex items-center gap-1.5">
                  <Input type="date" value={advDataEntradaInicio} onChange={(e) => setAdvDataEntradaInicio(e.target.value)} className="h-8 text-xs" />
                  <span className="text-xs text-muted-foreground">a</span>
                  <Input type="date" value={advDataEntradaFim} onChange={(e) => setAdvDataEntradaFim(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Data de saída</label>
                <div className="flex items-center gap-1.5">
                  <Input type="date" value={advDataSaidaInicio} onChange={(e) => setAdvDataSaidaInicio(e.target.value)} className="h-8 text-xs" />
                  <span className="text-xs text-muted-foreground">a</span>
                  <Input type="date" value={advDataSaidaFim} onChange={(e) => setAdvDataSaidaFim(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Cliente</label>
                <Input placeholder="Digite para buscar" value={advCliente} onChange={(e) => setAdvCliente(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Equipamento</label>
                <Input placeholder="Placa / equipamento" value={advEquipamento} onChange={(e) => setAdvEquipamento(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Marca</label>
                <Input placeholder="Marca" value={advMarca} onChange={(e) => setAdvMarca(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Modelo</label>
                <Input placeholder="Modelo" value={advModelo} onChange={(e) => setAdvModelo(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Série</label>
                <Input placeholder="Nº série / chassi" value={advSerie} onChange={(e) => setAdvSerie(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Produto</label>
                <Input placeholder="Produto utilizado" value={advProduto} onChange={(e) => setAdvProduto(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Serviço</label>
                <Input placeholder="Serviço prestado" value={advServico} onChange={(e) => setAdvServico(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real OS from database */}
      {realOS.length > 0 && (
        <div className="grid gap-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Ordens de Serviço</h2>
          {realOS
            .filter((os) => {
              // Status filter
              if (statusFilter) {
                const matchesStatus = os.status === statusFilter || 
                  (statusFilter === "agendada" && (os.status === "AGENDAMENTO" || os.status === "agendamento"));
                if (!matchesStatus) return false;
              }
              // Advanced filters
              if (!matchesAdvanced(os)) return false;
              // Search filter
              const q = search.toLowerCase();
              return !q ||
                (os.numero_os || "").toLowerCase().includes(q) ||
                (os.placa || "").toLowerCase().includes(q) ||
                (os.veiculo_modelo || "").toLowerCase().includes(q) ||
                (os.cliente_nome || "").toLowerCase().includes(q);
            })
            .map((os) => {
              const statusLabel: Record<string, string> = {
                atendimento: "Atendimento", em_execucao: "Em Execução", aguardando: "Aguardando Peças",
                aguardando_pecas: "Aguardando Peças", aguardando_pagamento: "Aguardando Pagamento",
                pronta: "Pronta", entregue: "Entregue", concretizada: "Concretizada", cancelada: "Cancelada",
                agendada: "Agendada", agendamento: "Agendamento", AGENDAMENTO: "Agendamento",
              };
              const itens = osItensMap[os.id] || [];
              const totalItens = itens.length;
              const doneItens = itens.filter((i) => i.status === "concluido").length;
              const progressPct = totalItens > 0 ? Math.round((doneItens / totalItens) * 100) : 0;
              // Get primary mechanic from items
              const mecanico = itens.find((i) => i.tecnico)?.tecnico || null;

              return (
                <Card key={os.id} className="glass-panel hover:border-primary/30 transition-colors overflow-hidden">
                  <CardContent className="p-0">
                    {/* Top: ID + Status */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-primary">{os.numero_os}</span>
                        <Badge variant="outline" className={`${statusStyles[os.status] || "bg-muted text-muted-foreground border-border"} text-[11px] uppercase font-bold tracking-wider`}>
                          {statusLabel[os.status] || os.status}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 w-8 rounded-full" onClick={() => navigate(`/os/${os.id}`)} title="Visualizar OS">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Client + Vehicle */}
                    <div className="grid grid-cols-2 border-t border-border/50">
                      <div className="px-5 py-3 border-r border-border/50 flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cliente</p>
                          <p className="text-sm font-bold mt-0.5">{os.cliente_nome || "—"}</p>
                          <p className="text-xs text-muted-foreground">{os.cliente_telefone || ""}</p>
                          {os.cliente_telefone && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px] px-2" onClick={() => window.open(`tel:${os.cliente_telefone}`)}>
                                <Phone className="h-3 w-3" />
                                Ligar
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px] px-2 text-green-600 border-green-500/30 hover:bg-green-500/10" onClick={() => window.open(`https://wa.me/55${(os.cliente_telefone || "").replace(/\D/g, "")}`)}>
                                <MessageCircle className="h-3 w-3" />
                                WhatsApp
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="px-5 py-3 flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 mt-0.5">
                          <Car className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Veículo</p>
                          <p className="text-sm font-bold mt-0.5">
                            {[os.veiculo_marca, os.veiculo_modelo].filter(Boolean).join(" ") || "—"}
                            {os.veiculo_cor ? ` · ${os.veiculo_cor}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {os.placa || ""}
                            {os.veiculo_ano ? ` · ${os.veiculo_ano}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Info row: Mecânico, Previsão, Check-in, Valor */}
                    <div className="grid grid-cols-4 border-t border-border/50">
                      <div className="px-5 py-3 border-r border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Wrench className="h-3 w-3" /> Mecânico
                        </p>
                        <p className="text-sm font-bold mt-1">{mecanico || "—"}</p>
                      </div>
                      <div className="px-5 py-3 border-r border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> Previsão
                        </p>
                        <p className="text-sm font-bold mt-1">
                          {os.data_prevista_conclusao ? new Date(os.data_prevista_conclusao).toLocaleDateString("pt-BR") : "—"}
                        </p>
                      </div>
                      <div className="px-5 py-3 border-r border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Camera className="h-3 w-3" /> Check-in
                        </p>
                        <p className="text-sm font-bold mt-1">{os.observacoes_checkin ? "✓" : "—"}</p>
                      </div>
                      <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-br-lg">
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                          <DollarSign className="h-3 w-3" /> Valor
                        </p>
                        <p className="text-sm font-bold font-mono mt-1 text-emerald-700 dark:text-emerald-300">
                          {(os.valor_total || 0) > 0 ? `R$ ${Number(os.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Dados do Veículo - expandable */}
                    <div className="border-t border-border/50">
                      <button
                        onClick={() => setExpandedVeiculo(expandedVeiculo === os.id ? null : os.id)}
                        className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline px-5 py-2.5 w-full text-left"
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        Dados do Veículo
                        {expandedVeiculo === os.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>

                      {expandedVeiculo === os.id && (
                        <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2.5 rounded-lg bg-secondary/40 px-3 py-2.5">
                            <Gauge className="h-4 w-4 text-primary shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">KM Atual</p>
                              <p className="text-sm font-bold font-mono">{os.km_atual ? Number(os.km_atual).toLocaleString("pt-BR") + " km" : "—"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 rounded-lg bg-secondary/40 px-3 py-2.5">
                            <Gauge className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">KM Última Revisão</p>
                              <p className="text-sm font-bold font-mono">{os.km_ultima_revisao ? Number(os.km_ultima_revisao).toLocaleString("pt-BR") + " km" : "—"}</p>
                              {os.km_atual && os.km_ultima_revisao && (
                                <p className="text-[10px] text-muted-foreground">({(Number(os.km_atual) - Number(os.km_ultima_revisao)).toLocaleString("pt-BR")} km atrás)</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 rounded-lg bg-secondary/40 px-3 py-2.5">
                            <Fuel className="h-4 w-4 text-primary shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Combustível</p>
                              <p className="text-sm font-bold">{os.combustivel || "—"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 rounded-lg bg-secondary/40 px-3 py-2.5">
                            <Droplets className="h-4 w-4 text-primary shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Óleo Recomendado</p>
                              <p className="text-sm font-bold">{os.oleo_recomendado || "—"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 rounded-lg bg-secondary/40 px-3 py-2.5 col-span-2">
                            <Droplets className="h-4 w-4 text-amber-500 shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Última Troca de Óleo</p>
                              <p className="text-sm font-bold">
                                {os.ultima_troca_oleo ? new Date(os.ultima_troca_oleo).toLocaleDateString("pt-BR") : "—"}
                                {os.ultima_troca_oleo && (
                                  <span className="text-xs font-normal text-muted-foreground ml-1">
                                    (há {Math.round((Date.now() - new Date(os.ultima_troca_oleo).getTime()) / 86400000)} dias)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress + Service Badges */}
                    {(
                      <div className="px-5 py-3 border-t border-border/50 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progresso: {doneItens}/{totalItens} serviços</span>
                          <span className="font-bold text-primary">{progressPct}%</span>
                        </div>
                        <Progress value={progressPct} className="h-2" />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {itens.map((item, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className={
                                item.status === "concluido"
                                  ? "bg-primary/15 text-primary border-primary/30 text-[11px] line-through"
                                  : "text-muted-foreground border-border text-[11px]"
                              }
                            >
                              {item.status === "concluido" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {item.descricao}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-secondary/20">
                      <p className="text-xs text-muted-foreground">
                        Criado em {new Date(os.created_at).toLocaleDateString("pt-BR")}
                        {os.criado_por && <> · por <span className="font-bold text-foreground">{os.criado_por}</span></>}
                      </p>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                              <MoreVertical className="h-3.5 w-3.5" />
                              Ações
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => {}}>
                              <CreditCard className="h-4 w-4 mr-2" /> Link de cobrança
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Printer className="h-4 w-4 mr-2" /> Imprimir
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => printOS(os.id)}>
                                  <FileText className="h-4 w-4 mr-2" /> Formato A4
                                </DropdownMenuItem>
                                <DropdownMenuItem><Receipt className="h-4 w-4 mr-2" /> Cupom</DropdownMenuItem>
                                <DropdownMenuItem><Tag className="h-4 w-4 mr-2" /> Etiqueta</DropdownMenuItem>
                                <DropdownMenuItem><Factory className="h-4 w-4 mr-2" /> Produção</DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <RefreshCw className="h-4 w-4 mr-2" /> Alterar situação
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleAlterarStatus(os.id, "agendada")}>Agendada</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAlterarStatus(os.id, "atendimento")}>Atendimento</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAlterarStatus(os.id, "em_execucao")}>Em Execução</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAlterarStatus(os.id, "aguardando_pecas")}>Aguardando Peças</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAlterarStatus(os.id, "pronta")}>Pronta</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAlterarStatus(os.id, "entregue")}>Entregue</DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Share2 className="h-4 w-4 mr-2" /> Compartilhar
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${window.location.origin}/os/${os.id}`)}>
                                  <Copy className="h-4 w-4 mr-2" /> Copiar link
                                </DropdownMenuItem>
                                <DropdownMenuItem><Mail className="h-4 w-4 mr-2" /> Via E-mail</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(`https://wa.me/55${(os.cliente_telefone || "").replace(/\D/g, "")}`)}>
                                  <MessageSquare className="h-4 w-4 mr-2" /> Via WhatsApp
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <FileCheck className="h-4 w-4 mr-2" /> Emitir
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem>NFS-e</DropdownMenuItem>
                                <DropdownMenuItem>NF-e</DropdownMenuItem>
                                <DropdownMenuItem>NFC-e</DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <FileInput className="h-4 w-4 mr-2" /> Gerar
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem><Copy className="h-4 w-4 mr-2" /> Cópia</DropdownMenuItem>
                                <DropdownMenuItem><Undo2 className="h-4 w-4 mr-2" /> Devolução</DropdownMenuItem>
                                <DropdownMenuItem><Landmark className="h-4 w-4 mr-2" /> Ver no financeiro</DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-amber-600 focus:text-amber-700 focus:bg-amber-50 dark:focus:bg-amber-950/30"
                              onClick={() => handleCancelarOS(os)}
                            >
                              <XCircle className="h-4 w-4 mr-2" /> Cancelar OS
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30"
                              onClick={() => handleExcluirOS(os)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir agendamento
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button className="bg-green-500 hover:bg-green-600 text-white gap-2 h-9 text-xs" onClick={() => window.open(`https://wa.me/55${(os.cliente_telefone || "").replace(/\D/g, "")}`)}>
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button className="gradient-primary text-primary-foreground gap-2 h-9 text-xs" onClick={() => navigate(`/os/${os.id}?editar=true`)}>
                          <Eye className="h-3.5 w-3.5" />
                          Editar OS
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

    </div>
  );
}
