import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, Target, TrendingUp, Users, Briefcase, Clock } from "lucide-react";

interface Pipeline { id: string; nome: string; }
interface Etapa { id: string; nome: string; cor: string; ordem: number; }
interface Negocio { id: string; valor: number; etapa_id: string; status: string; created_at: string; }

export default function DashboardPipelinePanel() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [pipelineSelecionada, setPipelineSelecionada] = useState("");
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("pipelines").select("id, nome").eq("ativa", true);
      if (data && data.length > 0) { setPipelines(data as Pipeline[]); setPipelineSelecionada(data[0].id); }
    })();
  }, []);

  useEffect(() => {
    if (!pipelineSelecionada) return;
    Promise.all([
      supabase.from("pipeline_etapas").select("*").eq("pipeline_id", pipelineSelecionada).order("ordem"),
      supabase.from("negocios").select("*").eq("pipeline_id", pipelineSelecionada),
    ]).then(([etapasRes, negociosRes]) => {
      setEtapas((etapasRes.data as Etapa[]) || []);
      setNegocios((negociosRes.data as Negocio[]) || []);
    });
  }, [pipelineSelecionada]);

  const totalValor = negocios.reduce((s, n) => s + (n.valor || 0), 0);
  const totalAbertos = negocios.filter(n => n.status === "aberto").length;
  const totalGanhos = negocios.filter(n => n.status === "ganho").length;
  const totalPerdidos = negocios.filter(n => n.status === "perdido").length;
  const taxaConversao = negocios.length > 0 ? Math.round((totalGanhos / negocios.length) * 100) : 0;

  const dadosEtapa = etapas.map(e => {
    const negociosEtapa = negocios.filter(n => n.etapa_id === e.id);
    return { nome: e.nome, cor: e.cor, quantidade: negociosEtapa.length, valor: negociosEtapa.reduce((s, n) => s + (n.valor || 0), 0) };
  });

  const dadosPie = [
    { name: "Abertos", value: totalAbertos, color: "#3b82f6" },
    { name: "Ganhos", value: totalGanhos, color: "#22c55e" },
    { name: "Perdidos", value: totalPerdidos, color: "#ef4444" },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Dashboard de Negócios</h2>
        <Select value={pipelineSelecionada} onValueChange={setPipelineSelecionada}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>{pipelines.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><DollarSign className="h-4 w-4" /> Valor Total</div>
          <p className="text-2xl font-bold text-foreground">R$ {totalValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Briefcase className="h-4 w-4" /> Negócios</div>
          <p className="text-2xl font-bold text-foreground">{negocios.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="h-4 w-4" /> Conversão</div>
          <p className="text-2xl font-bold text-foreground">{taxaConversao}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Target className="h-4 w-4" /> Abertos</div>
          <p className="text-2xl font-bold text-foreground">{totalAbertos}</p>
        </CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Negócios por Etapa</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosEtapa}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v}`, "Qtd"]} />
                  <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Status dos Negócios</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              {dadosPie.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dadosPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {dadosPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Valor por etapa */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Valor por Etapa</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dadosEtapa.map(d => (
              <div key={d.nome} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.cor }} />
                  <span className="text-sm text-foreground">{d.nome}</span>
                  <span className="text-xs text-muted-foreground">({d.quantidade})</span>
                </div>
                <span className="font-medium text-sm text-foreground">R$ {d.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
