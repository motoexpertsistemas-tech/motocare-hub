import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CalendarCheck2, CheckCircle2, Clock, XCircle, Pencil, Eye, Loader2, Search,
} from "lucide-react";
import { toast } from "sonner";

type StatusAg = "agendada" | "agendada_confirmada" | "agendada_recusada";

interface RevisaoOS {
  id: string;
  numero_os: string;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  placa: string | null;
  veiculo_modelo: string | null;
  defeito_relatado: string | null;
  data_entrada: string | null;
  status: string;
  observacoes: string | null;
  created_at: string;
}

const STATUS_META: Record<StatusAg, { label: string; color: string; icon: any }> = {
  agendada: { label: "Pendente", color: "bg-amber-500", icon: Clock },
  agendada_confirmada: { label: "Confirmada", color: "bg-emerald-600", icon: CheckCircle2 },
  agendada_recusada: { label: "Recusada", color: "bg-red-600", icon: XCircle },
};

const FILTROS: { id: "todas" | StatusAg; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "agendada", label: "Pendentes" },
  { id: "agendada_confirmada", label: "Confirmadas" },
  { id: "agendada_recusada", label: "Recusadas" },
];

const fmtDateTime = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

export default function RevisoesAgendadas() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [revisoes, setRevisoes] = useState<RevisaoOS[]>([]);
  const [filtro, setFiltro] = useState<"todas" | StatusAg>("todas");
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<RevisaoOS | null>(null);
  const [editData, setEditData] = useState("");
  const [editStatus, setEditStatus] = useState<StatusAg>("agendada");
  const [salvando, setSalvando] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ordem_servico")
      .select("id, numero_os, cliente_nome, cliente_telefone, placa, veiculo_modelo, defeito_relatado, data_entrada, status, observacoes, created_at")
      .in("status", ["agendada", "agendada_confirmada", "agendada_recusada", "agendamento", "AGENDAMENTO"])
      .not("status", "eq", "cancelada")
      .order("data_entrada", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar revisões: " + error.message);
    } else {
      // Filter out any that might have been cancelled recently if not caught by query
      setRevisoes((data || []).filter(r => r.status !== 'cancelada') as RevisaoOS[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const lista = revisoes.filter((r) => {
    if (filtro !== "todas" && r.status !== filtro && !(filtro === "agendada" && (r.status === "agendamento" || r.status === "AGENDAMENTO"))) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return (
        r.numero_os?.toLowerCase().includes(q) ||
        r.cliente_nome?.toLowerCase().includes(q) ||
        r.placa?.toLowerCase().includes(q) ||
        r.veiculo_modelo?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    todas: revisoes.length,
    agendada: revisoes.filter((r) => r.status === "agendada" || r.status === "agendamento" || r.status === "AGENDAMENTO").length,
    agendada_confirmada: revisoes.filter((r) => r.status === "agendada_confirmada").length,
    agendada_recusada: revisoes.filter((r) => r.status === "agendada_recusada").length,
  };

  const abrirEdicao = (r: RevisaoOS) => {
    setEditando(r);
    setEditStatus((r.status as StatusAg) || "agendada");
    if (r.data_entrada) {
      const d = new Date(r.data_entrada);
      const tz = d.getTimezoneOffset() * 60000;
      setEditData(new Date(d.getTime() - tz).toISOString().slice(0, 16));
    } else {
      setEditData("");
    }
  };

  const salvar = async () => {
    if (!editando) return;
    setSalvando(true);
    const payload: any = { status: editStatus };
    if (editData) {
      payload.data_entrada = new Date(editData).toISOString();
      payload.data_prevista_conclusao = new Date(editData).toISOString();
    }
    const { error } = await supabase
      .from("ordem_servico")
      .update(payload)
      .eq("id", editando.id);
    setSalvando(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Revisão atualizada");
    setEditando(null);
    fetchData();
  };

  const mudarStatusRapido = async (r: RevisaoOS, novo: StatusAg) => {
    const { error } = await supabase
      .from("ordem_servico")
      .update({ status: novo })
      .eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marcada como ${STATUS_META[novo].label.toLowerCase()}`);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <CalendarCheck2 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Revisões Agendadas</h1>
            <p className="text-sm text-muted-foreground">
              Visualize, confirme ou recuse os agendamentos vindos do assistente virtual
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTROS.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filtro === f.id ? "default" : "outline"}
            onClick={() => setFiltro(f.id)}
            className="gap-2"
          >
            {f.label}
            <Badge variant="secondary" className="ml-1">{(counts as any)[f.id]}</Badge>
          </Button>
        ))}
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar OS, cliente, placa..."
            className="pl-8"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{lista.length} revisão(ões)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : lista.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma revisão encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>OS</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Veículo / Placa</TableHead>
                    <TableHead>Data validada</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.map((r) => {
                    const sKey = (r.status === "agendamento" || r.status === "AGENDAMENTO") ? "agendada" : r.status;
                    const meta = STATUS_META[sKey as StatusAg || "agendada"] || STATUS_META.agendada;
                    const Icon = meta.icon;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.numero_os}</TableCell>
                        <TableCell>
                          {r.cliente_nome ? (
                            <div className="font-medium">{r.cliente_nome}</div>
                          ) : (
                            <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/30">
                              ⚠️ Cadastro pendente
                            </Badge>
                          )}
                          <div className="text-xs text-muted-foreground">{r.cliente_telefone || ""}</div>
                        </TableCell>
                        <TableCell>
                          <div>{r.veiculo_modelo || "—"}</div>
                          <div className="text-xs font-mono text-muted-foreground">{r.placa || ""}</div>
                        </TableCell>
                        <TableCell className="text-sm">{fmtDateTime(r.data_entrada)}</TableCell>
                        <TableCell>
                          <Badge className={`${meta.color} text-white gap-1`}>
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {r.status !== "agendada_confirmada" && (
                              <Button size="sm" variant="ghost" className="text-emerald-600"
                                title="Confirmar"
                                onClick={() => mudarStatusRapido(r, "agendada_confirmada")}>
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {r.status !== "agendada_recusada" && (
                              <Button size="sm" variant="ghost" className="text-red-600"
                                title="Recusar"
                                onClick={() => mudarStatusRapido(r, "agendada_recusada")}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-green-600"
                              title="Editar"
                              onClick={() => abrirEdicao(r)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-teal-600"
                              title="Ver OS"
                              onClick={() => navigate(`/os/${r.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar revisão {editando?.numero_os}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Cliente:</span> {editando?.cliente_nome || "—"}</div>
              <div><span className="text-muted-foreground">Placa:</span> {editando?.placa || "—"}</div>
              <div><span className="text-muted-foreground">Serviço:</span> {editando?.defeito_relatado || "—"}</div>
            </div>
            <div className="space-y-1.5">
              <Label>Data e hora validada</Label>
              <Input type="datetime-local" value={editData} onChange={(e) => setEditData(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(STATUS_META) as StatusAg[]).map((s) => {
                  const m = STATUS_META[s];
                  const Icon = m.icon;
                  return (
                    <Button
                      key={s}
                      size="sm"
                      variant={editStatus === s ? "default" : "outline"}
                      onClick={() => setEditStatus(s)}
                      className="gap-1"
                    >
                      <Icon className="h-3 w-3" />
                      {m.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
