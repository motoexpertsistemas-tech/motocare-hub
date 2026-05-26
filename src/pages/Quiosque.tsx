import { useState, useEffect, useMemo } from "react";
import { AjudanteOnline } from "@/components/AjudanteOnline";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bike, Delete, Check, ArrowLeft, Loader2, Fuel, Droplets, Gauge, Pencil, Plus, AlertTriangle, ChevronsUp, ChevronUp, CheckCircle, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

const mechanics: Record<string, { name: string; pin: string }> = {
  noel: { name: "Noel", pin: "1234" },
  jose: { name: "José", pin: "5678" },
};

const statusFlow: Record<string, string> = {
  "agendada": "em_execucao",
  "em_execucao": "pronta",
  "aguardando_pecas": "em_execucao",
};

const statusLabels: Record<string, string> = {
  "agendada": "Agendada",
  "em_execucao": "Em Execução",
  "aguardando_pecas": "Aguardando Peças",
  "pronta": "Pronta",
  "atendimento": "Atendimento",
};

const statusStyles: Record<string, string> = {
  "em_execucao": "bg-primary/15 text-primary border-primary/30",
  "aguardando_pecas": "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  "agendada": "bg-blue-500/15 text-blue-600 border-blue-500/30",
  "pronta": "bg-green-500/15 text-green-600 border-green-500/30",
  "atendimento": "bg-purple-500/15 text-purple-600 border-purple-500/30",
};

function PinPad({ onLogin }: { onLogin: (name: string) => void }) {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + d;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      const found = Object.values(mechanics).find((m) => m.pin === newPin);
      if (found) {
        onLogin(found.name);
      } else {
        setError(true);
        setTimeout(() => {
          setPin("");
          setError(false);
        }, 800);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background dark">
      <div className="w-full max-w-sm space-y-8 text-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
            <Bike className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">Otto Tech Sistemas</h1>
          <p className="text-sm text-muted-foreground">Modo Mecânico</p>
        </div>

        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-5 w-5 rounded-full border-2 transition-all duration-200 ${
                error
                  ? "border-destructive bg-destructive animate-pulse"
                  : i < pin.length
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30 bg-transparent"
              }`}
            />
          ))}
        </div>
        {error && <p className="text-sm text-destructive font-medium">PIN incorreto</p>}

        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((key) => {
            if (key === "") return <div key="empty" />;
            if (key === "del")
              return (
                <Button key="del" variant="ghost" className="h-[72px] text-lg rounded-xl" onClick={handleDelete}>
                  <Delete className="h-6 w-6" />
                </Button>
              );
            return (
              <Button
                key={key}
                variant="outline"
                className="h-[72px] text-2xl font-semibold rounded-xl hover:bg-primary/10 hover:border-primary/40 active:scale-95 transition-all"
                onClick={() => handleDigit(key)}
              >
                {key}
              </Button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">Digite seu PIN de 4 dígitos para acessar</p>

        <Button
          variant="ghost"
          className="mx-auto flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Sistema
        </Button>
      </div>
    </div>
  );
}

function KioskDashboard({ mechanicName, onLogout }: { mechanicName: string; onLogout: () => void }) {
  const navigate = useNavigate();
  const [osList, setOsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<string | null>(null);
  const [obs, setObs] = useState<Record<string, string>>({});
  const [servicos, setServicos] = useState<Record<string, any[]>>({});
  const [situacoes, setSituacoes] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState<string>("hoje");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (dateFilter) {
      case "hoje": return { start: startOfDay(now), end: endOfDay(now) };
      case "semana": return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
      case "mes_passado": { const m = subMonths(now, 1); return { start: startOfMonth(m), end: endOfMonth(m) }; }
      case "este_mes": return { start: startOfMonth(now), end: endOfMonth(now) };
      case "proximo_mes": { const m = addMonths(now, 1); return { start: startOfMonth(m), end: endOfMonth(m) }; }
      case "todo": return null;
      case "custom": return customDate ? { start: startOfDay(customDate), end: endOfDay(customDate) } : null;
      default: return null;
    }
  }, [dateFilter, customDate]);

  const dateFilterLabels: Record<string, string> = {
    hoje: "Hoje",
    semana: "Esta semana",
    mes_passado: "Mês passado",
    este_mes: "Este mês",
    proximo_mes: "Próximo mês",
    todo: "Todo o período",
    custom: customDate ? format(customDate, "dd/MM/yyyy") : "Escolha o dia",
  };

  useEffect(() => {
    supabase.from("situacoes_os").select("*").order("ordem", { ascending: true }).then(({ data }) => {
      if (data) setSituacoes(data);
    });
  }, []);

  const fetchOS = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("ordem_servico")
        .select("*")
        .in("status", ["agendada", "em_execucao", "aguardando_pecas", "pronta", "atendimento"])
        .order("created_at", { ascending: false });

      if (dateRange) {
        query = query.gte("created_at", dateRange.start.toISOString()).lte("created_at", dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setOsList(data || []);

      // Fetch services for each OS
      if (data && data.length > 0) {
        const ids = data.map((os: any) => os.id);
        const { data: itens } = await supabase
          .from("os_itens")
          .select("*")
          .in("os_id", ids);
        if (itens) {
          const grouped: Record<string, any[]> = {};
          itens.forEach((item: any) => {
            if (!grouped[item.os_id]) grouped[item.os_id] = [];
            grouped[item.os_id].push(item);
          });
          setServicos(grouped);
        }
      }
    } catch (e: any) {
      toast({ title: "Erro ao carregar OS", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOS();
  }, [dateRange]);

  const changeStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("ordem_servico")
        .update({ status: newStatus } as any)
        .eq("id", id);
      if (error) throw error;
      setOsList((prev) =>
        prev.map((os) => (os.id === id ? { ...os, status: newStatus } : os))
      );
      toast({ title: `✅ Status atualizado para ${statusLabels[newStatus] || newStatus}` });
    } catch (e: any) {
      toast({ title: "Erro ao atualizar status", description: e.message, variant: "destructive" });
    }
  };

  const saveObservations = async (id: string, value: string) => {
    try {
      const { error } = await supabase
        .from("ordem_servico")
        .update({ observacoes: value } as any)
        .eq("id", id);
      if (error) throw error;
      setOsList((prev) =>
        prev.map((os) => (os.id === id ? { ...os, observacoes: value } : os))
      );
      toast({ title: "✅ Observações salvas com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar observações", description: e.message, variant: "destructive" });
    }
  };

  const calcDaysAgo = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <Bike className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Olá, {mechanicName}!</h1>
            <p className="text-xs text-muted-foreground">Modo Quiosque · {osList.length} OS ativas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Filter */}
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 px-4 gap-2 text-sm font-medium bg-white/10 border-white/30 text-white hover:bg-white/20">
                <CalendarIcon className="h-4 w-4" />
                {dateFilterLabels[dateFilter]}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex flex-col">
                {["hoje", "semana", "mes_passado", "este_mes", "proximo_mes", "todo"].map((key) => (
                  <button
                    key={key}
                    className={cn(
                      "px-4 py-2.5 text-sm text-left hover:bg-accent transition-colors",
                      dateFilter === key && "bg-accent font-medium text-primary"
                    )}
                    onClick={() => { setDateFilter(key); setDatePopoverOpen(false); }}
                  >
                    {dateFilterLabels[key]}
                  </button>
                ))}
                <div className="border-t border-border">
                  <button
                    className={cn(
                      "px-4 py-2.5 text-sm text-left w-full hover:bg-accent transition-colors",
                      dateFilter === "custom" && "bg-accent font-medium text-primary"
                    )}
                    onClick={() => setDateFilter("custom")}
                  >
                    Escolha o dia
                  </button>
                  {dateFilter === "custom" && (
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={(d) => { setCustomDate(d); setDatePopoverOpen(false); }}
                      className="p-3 pointer-events-auto"
                      locale={ptBR}
                    />
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            className="h-12 px-6 text-base font-bold gap-2 gradient-primary text-primary-foreground"
            onClick={() => navigate("/os/nova?from=quiosque")}
          >
            <Plus className="h-5 w-5" />
            Nova OS
          </Button>
          <Button variant="destructive" onClick={onLogout} className="h-12 px-6 text-base font-bold">
            Sair
          </Button>
        </div>
      </div>

      {/* Priority Panel */}
      <div className="px-6 pt-6">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Urgente", key: "urgente", bg: "bg-red-800", icon: AlertTriangle },
            { label: "Alta", key: "alta", bg: "bg-orange-500", icon: ChevronsUp },
            { label: "Normal", key: "normal", bg: "bg-yellow-500", icon: ChevronUp },
            { label: "Baixa", key: "baixa", bg: "bg-green-500", icon: CheckCircle },
          ].map((p) => {
            const count = osList.filter((os) => (os.prioridade || "normal") === p.key).length;
            return (
              <div key={p.key} className={`${p.bg} rounded-xl p-4 flex items-center justify-between text-white`}>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs font-medium opacity-90">{p.label}</p>
                </div>
                <p.icon className="h-5 w-5 opacity-60" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {osList.map((os) => {
          const osServicos = servicos[os.id] || [];
          const diasTrocaOleo = calcDaysAgo(os.ultima_troca_oleo);
          const kmDiff = os.km_entrada && os.km_ultima_revisao ? os.km_entrada - os.km_ultima_revisao : null;

          return (
            <Card
              key={os.id}
              className={`glass-panel cursor-pointer transition-all duration-200 ${
                selectedOS === os.id ? "border-primary glow-primary" : "hover:border-primary/30"
              }`}
              onClick={() => setSelectedOS(selectedOS === os.id ? null : os.id)}
            >
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <span className="font-mono text-sm font-bold text-primary">{os.numero_os}</span>
                     {(() => {
                       const prio = os.prioridade || "normal";
                       const prioConfig: Record<string, { label: string; bg: string }> = {
                         urgente: { label: "Urgente", bg: "bg-red-800 text-white" },
                         alta: { label: "Alta", bg: "bg-orange-500 text-white" },
                         normal: { label: "Normal", bg: "bg-yellow-500 text-black" },
                         baixa: { label: "Baixa", bg: "bg-green-500 text-white" },
                       };
                       const p = prioConfig[prio];
                       return p ? (
                         <span className={`${p.bg} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}>{p.label}</span>
                       ) : null;
                     })()}
                   </div>
                   {(() => {
                     const sit = situacoes.find(s => {
                       const key = s.nome.toLowerCase().replace(/\s+/g, "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                       return key === os.status || s.nome === os.status;
                     });
                     return (
                       <Badge variant="outline" className="text-xs px-3 py-1" style={sit ? { borderColor: sit.cor + "4D", color: sit.cor, backgroundColor: sit.cor + "1A" } : {}}>
                         {sit?.nome || statusLabels[os.status] || os.status}
                       </Badge>
                     );
                   })()}
                 </div>

                {/* Client & Vehicle */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Cliente</p>
                    <p className="font-semibold text-sm">{os.cliente_nome || "—"}</p>
                    {os.cliente_telefone && (
                      <p className="text-xs text-muted-foreground">{os.cliente_telefone}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Veículo</p>
                    <p className="font-semibold text-sm">
                      {os.veiculo_marca} {os.veiculo_modelo}
                      {os.veiculo_cor ? ` · ${os.veiculo_cor}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {os.placa || "—"} {os.veiculo_ano ? `- ${os.veiculo_ano}` : ""}
                    </p>
                  </div>
                </div>

                {/* Vehicle data row */}
                <div className="grid grid-cols-3 gap-2 bg-secondary/30 rounded-lg p-3">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">KM</p>
                      <p className="text-sm font-medium">{os.km_entrada ? `${os.km_entrada.toLocaleString()} km` : "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Última Rev.</p>
                      <p className="text-sm font-medium">
                        {os.km_ultima_revisao ? `${os.km_ultima_revisao.toLocaleString()} km` : "—"}
                      </p>
                      {kmDiff !== null && kmDiff > 0 && (
                        <p className="text-[10px] text-muted-foreground">({kmDiff.toLocaleString()} atrás)</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Combust.</p>
                      <p className="text-sm font-medium">{os.nivel_combustivel || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Oil data */}
                {(os.oleo_recomendado || os.ultima_troca_oleo) && (
                  <div className="grid grid-cols-2 gap-2 bg-secondary/30 rounded-lg p-3">
                    {os.oleo_recomendado && (
                      <div className="flex items-center gap-1.5">
                        <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Óleo Recomendado</p>
                          <p className="text-sm font-medium">{os.oleo_recomendado}</p>
                        </div>
                      </div>
                    )}
                    {os.ultima_troca_oleo && (
                      <div className="flex items-center gap-1.5">
                        <Droplets className={`h-3.5 w-3.5 ${diasTrocaOleo && diasTrocaOleo > 90 ? "text-destructive" : "text-muted-foreground"}`} />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Última Troca Óleo</p>
                          <p className={`text-sm font-medium ${diasTrocaOleo && diasTrocaOleo > 90 ? "text-destructive" : ""}`}>
                            {new Date(os.ultima_troca_oleo).toLocaleDateString("pt-BR")}
                            {diasTrocaOleo !== null && ` (há ${diasTrocaOleo} dias)`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Defeitos */}
                {os.defeito_relatado && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-destructive uppercase tracking-wider">⚠️ Defeitos Relatados</p>
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm whitespace-pre-wrap">
                        {os.defeito_relatado}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Services */}
                {(() => {
                  const servicos = osServicos.filter((s) => s.tipo === "servico");
                  return (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Serviços</p>
                      {servicos.length > 0 ? (
                        servicos.map((s) => (
                          <div key={s.id} className="flex items-center gap-2 text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {s.descricao}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">Nenhum serviço cadastrado</p>
                      )}
                    </div>
                  );
                })()}

                {/* Expanded content */}
                {selectedOS === os.id && (
                  <div className="space-y-3 animate-slide-in">
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Observações</p>
                      <textarea
                        value={obs[os.id] !== undefined ? obs[os.id] : (os.observacoes || "")}
                        onChange={(e) => setObs((prev) => ({ ...prev, [os.id]: e.target.value }))}
                        onBlur={(e) => saveObservations(os.id, e.target.value)}
                        placeholder="Adicionar observações..."
                        className="w-full min-h-[80px] rounded-lg border border-border bg-secondary/50 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full h-14 text-base gap-2 border-primary/40 text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/os/${os.id}?editar=true&from=quiosque`);
                      }}
                    >
                      <Pencil className="h-5 w-5" />
                      Editar Ordem de Serviço
                    </Button>

                    {/* Status buttons */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trocar Situação</p>
                      <div className="flex flex-wrap gap-2">
                        {situacoes.map((s) => {
                          const key = s.nome.toLowerCase().replace(/\s+/g, "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                          const isActive = os.status === key || os.status === s.nome;
                          return (
                            <Button
                              key={s.id}
                              variant="outline"
                              size="sm"
                              disabled={isActive}
                              className={`border text-xs font-medium ${isActive ? "opacity-50 ring-2 ring-offset-1 ring-offset-background" : ""}`}
                              style={{
                                borderColor: s.cor + "4D",
                                color: s.cor,
                                backgroundColor: isActive ? s.cor + "26" : s.cor + "1A",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                changeStatus(os.id, key);
                              }}
                            >
                              {isActive && <Check className="h-3 w-3 mr-1" />}
                              {s.nome}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {osList.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhuma OS ativa encontrada.
          </div>
        )}
      </div>
    </div>
  );
}

export default function Quiosque() {
  const [loggedMechanic, setLoggedMechanic] = useState<string | null>(() => {
    return sessionStorage.getItem("quiosque_mechanic");
  });

  const handleLogin = (name: string) => {
    sessionStorage.setItem("quiosque_mechanic", name);
    setLoggedMechanic(name);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("quiosque_mechanic");
    setLoggedMechanic(null);
  };

  if (!loggedMechanic) {
    return <PinPad onLogin={handleLogin} />;
  }

  return (
    <>
      <KioskDashboard mechanicName={loggedMechanic} onLogout={handleLogout} />
      <AjudanteOnline />
    </>
  );
}
