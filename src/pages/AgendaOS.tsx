import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { generateICSContent, downloadICS } from "@/lib/generateICS";
import { toast } from "@/hooks/use-toast";

const STATUS_AGENDA = ["agendada", "AGENDAMENTO", "em_execucao", "aguardando_pecas", "pronta"];

const STATUS_LABELS: Record<string, string> = {
  agendada: "Agendada",
  AGENDAMENTO: "Agendamento",
  em_execucao: "Em Execução",
  aguardando_pecas: "Aguardando Peças",
  pronta: "Pronta",
};

const STATUS_COLORS: Record<string, string> = {
  agendada: "bg-blue-500",
  AGENDAMENTO: "bg-blue-500",
  em_execucao: "bg-red-500",
  aguardando_pecas: "bg-amber-500",
  pronta: "bg-green-500",
};

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MESES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

export default function AgendaOS() {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const { data: ordens = [] } = useQuery({
    queryKey: ["agenda_os", year, month],
    queryFn: async () => {
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const { data, error } = await supabase
        .from("ordem_servico")
        .select("id, numero_os, cliente_nome, placa, veiculo_modelo, status, data_prevista_conclusao, data_entrada")
        .in("status", STATUS_AGENDA)
        .gte("data_entrada", start)
        .lte("data_entrada", end)
        .order("data_entrada", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const osByDay = useMemo(() => {
    const map: Record<number, typeof ordens> = {};
    ordens.forEach((os) => {
      const d = new Date(os.data_entrada).getDate();
      if (!map[d]) map[d] = [];
      map[d].push(os);
    });
    return map;
  }, [ordens]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDay(null);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(null);
  };

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedOrdens = selectedDay ? osByDay[selectedDay] || [] : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
        </div>
        <Button onClick={() => navigate("/os/nova?status=agendamento")}>AGENDAR</Button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Hoje</Button>
          <Button variant="outline" size="sm" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /> Anterior</Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>Próximo <ChevronRight className="h-4 w-4" /></Button>
        </div>
        <h2 className="text-lg font-bold text-foreground">{MESES[month]} DE {year}</h2>
        <div />
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {STATUS_AGENDA.map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`h-3 w-3 rounded-full ${STATUS_COLORS[s]}`} />
            {STATUS_LABELS[s]}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-7 bg-muted/50">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2 border-b border-border">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const count = day ? (osByDay[day]?.length || 0) : 0;
            const isTodayCell = day ? isToday(day) : false;
            const isSelected = day === selectedDay;

            return (
              <div
                key={i}
                className={`min-h-[90px] border-b border-r border-border p-1.5 cursor-pointer transition-colors
                  ${!day ? "bg-muted/20" : "hover:bg-muted/30"}
                  ${isTodayCell ? "bg-primary/10" : ""}
                  ${isSelected ? "ring-2 ring-primary ring-inset" : ""}
                `}
                onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${isTodayCell ? "text-primary font-bold" : "text-foreground"}`}>
                      {String(day).padStart(2, "0")}
                    </div>
                    {count > 0 && (
                      <div className="space-y-0.5">
                        {(osByDay[day] || []).slice(0, 3).map((os) => {
                          const hora = os.data_entrada ? new Date(os.data_entrada).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
                          return (
                          <div
                            key={os.id}
                            className={`text-[10px] text-white px-1 py-0.5 rounded truncate ${STATUS_COLORS[os.status]}`}
                            title={`${os.numero_os} — ${os.cliente_nome || ""} — ${os.placa || ""}`}
                          >
                            {hora ? `${hora} ` : ""}{os.placa || os.numero_os}{os.cliente_nome ? ` · ${os.cliente_nome.split(" ")[0]}` : ""}
                          </div>
                          );
                        })}
                        {count > 3 && (
                          <div className="text-[10px] text-muted-foreground pl-1">
                            +{count - 3} mais
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel with hourly slots */}
      {selectedDay && (() => {
        // Generate time slots from 08:00 to 17:30 in 30-min increments
        const slots: string[] = [];
        for (let h = 8; h <= 17; h++) {
          slots.push(`${String(h).padStart(2, "0")}:00`);
          if (h < 17 || true) slots.push(`${String(h).padStart(2, "0")}:30`);
        }
        // Remove 18:00 if accidentally added; keep up to 17:30
        const finalSlots = slots.filter(s => s <= "17:30");

        const getOSForSlot = (slot: string) => {
          return selectedOrdens.filter((os) => {
            if (!os.data_entrada) return false;
            const d = new Date(os.data_entrada);
            const osTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            return osTime === slot;
          });
        };

        return (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground">
              📋 Dia {String(selectedDay).padStart(2, "0")}/{String(month + 1).padStart(2, "0")} — {selectedOrdens.length} OS
            </h3>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {finalSlots.map((slot) => {
              const osInSlot = getOSForSlot(slot);
              return (
                <div key={slot} className={`flex gap-3 px-3 py-2 min-h-[42px] ${osInSlot.length > 0 ? "bg-primary/5" : "hover:bg-muted/20"}`}>
                  <span className="text-xs font-mono text-muted-foreground w-12 pt-1 shrink-0">{slot}</span>
                  <div className="flex-1 space-y-1">
                    {osInSlot.length === 0 ? (
                      <span className="text-xs text-muted-foreground/50 italic">—</span>
                    ) : (
                      osInSlot.map((os) => (
                        <div
                          key={os.id}
                          className={`flex items-center justify-between p-2 rounded-md text-white text-xs cursor-pointer ${STATUS_COLORS[os.status]} hover:opacity-90 transition-opacity`}
                          onClick={() => navigate(`/os/${os.id}`)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono font-semibold shrink-0">{os.numero_os}</span>
                            <span className="truncate">{os.cliente_nome || (os.placa ? `🏍️ ${os.placa} — A cadastrar` : "—")}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {os.placa && <Badge variant="outline" className="text-[10px] border-white/40 text-white">{os.placa}</Badge>}
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-white hover:bg-white/20" onClick={(e) => {
                              e.stopPropagation();
                              const dataEntrada = new Date(os.data_entrada);
                              const dataFim = os.data_prevista_conclusao ? new Date(os.data_prevista_conclusao) : new Date(dataEntrada.getTime() + 2 * 60 * 60 * 1000);
                              const desc = [`OS: ${os.numero_os}`, os.cliente_nome ? `Cliente: ${os.cliente_nome}` : "", os.placa ? `Placa: ${os.placa}` : ""].filter(Boolean).join("\n");
                              const content = generateICSContent({ uid: `os-${os.id}@mecsystem`, summary: `OS ${os.numero_os} — ${os.cliente_nome || "Sem cliente"}`, description: desc, dtStart: dataEntrada, dtEnd: dataFim });
                              downloadICS(`OS-${os.numero_os}.ics`, content);
                              toast({ title: "📅 Arquivo .ics baixado!" });
                            }} title="Baixar .ics">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        );
      })()}
    </div>
  );
}
