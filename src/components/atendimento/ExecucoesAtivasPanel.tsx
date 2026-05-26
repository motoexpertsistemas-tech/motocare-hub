import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pause, Play, SkipForward, X, Search, Loader2, Activity, Clock, CheckCircle2, AlertCircle, CheckSquare } from "lucide-react";
import { toast } from "sonner";

interface Execucao {
  id: string;
  cadencia_id: string;
  negocio_id: string | null;
  contato_telefone: string | null;
  passo_atual: number;
  proximo_envio: string;
  status: string;
  created_at: string;
  cadencia?: { nome: string; passos?: { count: number }[] | number };
  negocio?: { titulo: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  ativa: "bg-green-100 text-green-700 border-green-200",
  pausada: "bg-amber-100 text-amber-700 border-amber-200",
  concluida: "bg-slate-100 text-slate-600 border-slate-200",
  cancelada: "bg-red-100 text-red-700 border-red-200",
};

function tempoRelativo(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60000);
  const h = Math.round(abs / 3600000);
  const d = Math.round(abs / 86400000);
  const prefix = diff < 0 ? "atrasado " : "em ";
  if (min < 60) return prefix + min + "min";
  if (h < 24) return prefix + h + "h";
  return prefix + d + "d";
}

export default function ExecucoesAtivasPanel() {
  const [execs, setExecs] = useState<Execucao[]>([]);
  const [cadencias, setCadencias] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroCad, setFiltroCad] = useState("TODAS");
  const [filtroStatus, setFiltroStatus] = useState("ativa");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [processando, setProcessando] = useState(false);

  const carregar = async () => {
    setLoading(true);
    const [execRes, cadRes] = await Promise.all([
      supabase
        .from("cadencia_execucoes" as any)
        .select("*, cadencia:cadencias(nome, passos:cadencia_passos(count)), negocio:negocios(titulo)")
        .order("proximo_envio", { ascending: true })
        .limit(500),
      supabase.from("cadencias" as any).select("id, nome").order("nome"),
    ]);
    setExecs((execRes.data as any) || []);
    setCadencias((cadRes.data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
    const channel = supabase
      .channel("cadencia_execucoes_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "cadencia_execucoes" }, () => carregar())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtrados = useMemo(() => {
    return execs.filter(e => {
      if (filtroStatus !== "TODAS" && e.status !== filtroStatus) return false;
      if (filtroCad !== "TODAS" && e.cadencia_id !== filtroCad) return false;
      if (busca) {
        const q = busca.toLowerCase();
        const tit = (e.negocio?.titulo || "").toLowerCase();
        const tel = (e.contato_telefone || "").toLowerCase();
        if (!tit.includes(q) && !tel.includes(q)) return false;
      }
      return true;
    });
  }, [execs, busca, filtroCad, filtroStatus]);

  // Limpa seleção quando filtros mudam
  useEffect(() => {
    setSelecionados(prev => prev.filter(id => filtrados.some(f => f.id === id)));
  }, [filtrados]);

  const getTotalPassos = (e: Execucao): number => {
    const p: any = e.cadencia?.passos;
    if (Array.isArray(p)) return p[0]?.count || 0;
    if (typeof p === "number") return p;
    return 0;
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = execs.length;
    const ativas = execs.filter(e => e.status === "ativa").length;
    const pausadas = execs.filter(e => e.status === "pausada").length;
    const proximas24h = execs.filter(e => {
      if (e.status !== "ativa") return false;
      const diff = new Date(e.proximo_envio).getTime() - Date.now();
      return diff <= 24 * 3600 * 1000;
    }).length;
    const inicioMes = new Date();
    inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
    const concluidasMes = execs.filter(e => e.status === "concluida" && new Date(e.created_at) >= inicioMes).length;
    return { total, ativas, pausadas, proximas24h, concluidasMes };
  }, [execs]);

  const acaoStatus = async (id: string, novoStatus: string) => {
    const { error } = await supabase.from("cadencia_execucoes" as any).update({ status: novoStatus }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    carregar();
  };

  const avancarAgora = async (id: string) => {
    const { error } = await supabase
      .from("cadencia_execucoes" as any)
      .update({ proximo_envio: new Date().toISOString(), status: "ativa" })
      .eq("id", id);
    if (error) return toast.error(error.message);
    try { await supabase.functions.invoke("executar-cadencias", { body: {} }); } catch {}
    toast.success("Próximo passo será enviado agora");
    carregar();
  };

  const cancelar = async (id: string) => {
    if (!confirm("Cancelar esta execução? O lead deixará de receber as próximas mensagens.")) return;
    acaoStatus(id, "cancelada");
  };

  // Seleção
  const toggleOne = (id: string) => setSelecionados(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const allSelected = filtrados.length > 0 && selecionados.length === filtrados.length;
  const someSelected = selecionados.length > 0 && !allSelected;
  const toggleAll = () => setSelecionados(allSelected ? [] : filtrados.map(e => e.id));

  // Execuções selecionadas (objetos)
  const selObjs = useMemo(() => execs.filter(e => selecionados.includes(e.id)), [execs, selecionados]);
  const podePausar = selObjs.some(e => e.status === "ativa");
  const podeRetomar = selObjs.some(e => e.status === "pausada");
  const podeAvancar = selObjs.some(e => e.status === "ativa" || e.status === "pausada");
  const podeCancelar = selObjs.some(e => e.status === "ativa" || e.status === "pausada");

  const acaoLote = async (acao: "pausar" | "retomar" | "avancar" | "cancelar") => {
    let alvos: string[] = [];
    let payload: any = {};
    let mensagem = "";

    if (acao === "pausar") {
      alvos = selObjs.filter(e => e.status === "ativa").map(e => e.id);
      payload = { status: "pausada" };
      mensagem = "pausada(s)";
    } else if (acao === "retomar") {
      alvos = selObjs.filter(e => e.status === "pausada").map(e => e.id);
      payload = { status: "ativa" };
      mensagem = "retomada(s)";
    } else if (acao === "avancar") {
      alvos = selObjs.filter(e => e.status === "ativa" || e.status === "pausada").map(e => e.id);
      payload = { proximo_envio: new Date().toISOString(), status: "ativa" };
      mensagem = "agendada(s) para envio imediato";
    } else if (acao === "cancelar") {
      alvos = selObjs.filter(e => e.status === "ativa" || e.status === "pausada").map(e => e.id);
      payload = { status: "cancelada" };
      mensagem = "cancelada(s)";
      if (!confirm(`Cancelar ${alvos.length} execução(ões)? Os leads deixarão de receber as próximas mensagens.`)) return;
    }

    if (alvos.length === 0) return toast.warning("Nenhuma execução elegível na seleção");

    setProcessando(true);
    const { error } = await supabase.from("cadencia_execucoes" as any).update(payload).in("id", alvos);
    if (error) {
      setProcessando(false);
      return toast.error(error.message);
    }
    if (acao === "avancar") {
      try { await supabase.functions.invoke("executar-cadencias", { body: {} }); } catch {}
    }
    toast.success(`${alvos.length} execução(ões) ${mensagem}`);
    setSelecionados([]);
    setProcessando(false);
    carregar();
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><Activity className="h-5 w-5" /> Execuções Ativas</h2>
        <p className="text-xs text-muted-foreground">Leads em follow-up automático — pause, retome ou cancele a qualquer momento</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Activity className="h-3 w-3" /> Ativas</div>
          <p className="text-2xl font-bold text-green-600 mt-0.5">{kpis.ativas}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Pause className="h-3 w-3" /> Pausadas</div>
          <p className="text-2xl font-bold text-amber-600 mt-0.5">{kpis.pausadas}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /> Próx. 24h</div>
          <p className="text-2xl font-bold text-blue-600 mt-0.5">{kpis.proximas24h}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><CheckCircle2 className="h-3 w-3" /> Concluídas/mês</div>
          <p className="text-2xl font-bold text-slate-700 mt-0.5">{kpis.concluidasMes}</p>
        </CardContent></Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Buscar por lead ou telefone..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <Select value={filtroCad} onValueChange={setFiltroCad}>
          <SelectTrigger className="md:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todas as cadências</SelectItem>
            {cadencias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todos os status</SelectItem>
            <SelectItem value="ativa">Ativas</SelectItem>
            <SelectItem value="pausada">Pausadas</SelectItem>
            <SelectItem value="concluida">Concluídas</SelectItem>
            <SelectItem value="cancelada">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Barra de ações em lote */}
      {selecionados.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="font-semibold">{selecionados.length}</span> execução(ões) selecionada(s)
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelecionados([])}>Limpar</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={!podePausar || processando} onClick={() => acaoLote("pausar")} className="text-amber-600 border-amber-200">
                <Pause className="h-3.5 w-3.5 mr-1" /> Pausar
              </Button>
              <Button size="sm" variant="outline" disabled={!podeRetomar || processando} onClick={() => acaoLote("retomar")} className="text-green-600 border-green-200">
                <Play className="h-3.5 w-3.5 mr-1" /> Retomar
              </Button>
              <Button size="sm" variant="outline" disabled={!podeAvancar || processando} onClick={() => acaoLote("avancar")} className="text-blue-600 border-blue-200">
                <SkipForward className="h-3.5 w-3.5 mr-1" /> Avançar agora
              </Button>
              <Button size="sm" variant="outline" disabled={!podeCancelar || processando} onClick={() => acaoLote("cancelar")} className="text-red-600 border-red-200">
                <X className="h-3.5 w-3.5 mr-1" /> Cancelar
              </Button>
              {processando && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela */}
      {loading ? (
        <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtrados.length === 0 ? (
        <Card><CardContent className="pt-10 pb-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
          Nenhuma execução encontrada com esses filtros.
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected ? true : (someSelected ? "indeterminate" : false)}
                      onCheckedChange={toggleAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Cadência</TableHead>
                  <TableHead className="w-32">Passo</TableHead>
                  <TableHead className="w-40">Próximo envio</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-32 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map(e => {
                  const total = getTotalPassos(e);
                  const pct = total > 0 ? Math.min(100, (e.passo_atual / total) * 100) : 0;
                  const checked = selecionados.includes(e.id);
                  return (
                    <TableRow key={e.id} data-state={checked ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox checked={checked} onCheckedChange={() => toggleOne(e.id)} aria-label="Selecionar linha" />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{e.negocio?.titulo || "—"}</div>
                        <div className="text-[11px] text-muted-foreground">{e.contato_telefone || "sem telefone"}</div>
                      </TableCell>
                      <TableCell className="text-sm">{e.cadencia?.nome || "—"}</TableCell>
                      <TableCell>
                        <div className="text-xs font-medium mb-1">{e.passo_atual}{total > 0 ? `/${total}` : ""}</div>
                        <Progress value={pct} className="h-1.5" />
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs">
                              {e.status === "ativa" ? tempoRelativo(e.proximo_envio) : "—"}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {new Date(e.proximo_envio).toLocaleString("pt-BR")}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] uppercase ${STATUS_COLORS[e.status] || ""}`}>
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {e.status === "ativa" && (
                            <Tooltip><TooltipTrigger asChild>
                              <Button size="icon" variant="outline" className="h-7 w-7 text-amber-600" onClick={() => acaoStatus(e.id, "pausada")}>
                                <Pause className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger><TooltipContent>Pausar</TooltipContent></Tooltip>
                          )}
                          {e.status === "pausada" && (
                            <Tooltip><TooltipTrigger asChild>
                              <Button size="icon" variant="outline" className="h-7 w-7 text-green-600" onClick={() => acaoStatus(e.id, "ativa")}>
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger><TooltipContent>Retomar</TooltipContent></Tooltip>
                          )}
                          {(e.status === "ativa" || e.status === "pausada") && (
                            <>
                              <Tooltip><TooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-7 w-7 text-blue-600" onClick={() => avancarAgora(e.id)}>
                                  <SkipForward className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger><TooltipContent>Enviar próximo passo agora</TooltipContent></Tooltip>
                              <Tooltip><TooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-7 w-7 text-red-600" onClick={() => cancelar(e.id)}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger><TooltipContent>Cancelar</TooltipContent></Tooltip>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent></Card>
      )}
    </div>
  );
}
