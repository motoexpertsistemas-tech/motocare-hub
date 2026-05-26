import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Truck,
  Package,
  RotateCcw,
  Search,
  RefreshCw,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Plus,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { Navigate } from "react-router-dom";
import NovaIntegracaoTransportadoraDialog from "@/components/marketplace/NovaIntegracaoTransportadoraDialog";

const STATUS_ENVIO: Record<string, { label: string; color: string; icon: any }> = {
  pendente: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", icon: Clock },
  coletado: { label: "Coletado", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: Package },
  em_transito: { label: "Em Trânsito", color: "bg-primary/10 text-primary border-primary/20", icon: Truck },
  saiu_entrega: { label: "Saiu p/ Entrega", color: "bg-orange-500/10 text-orange-600 border-orange-200", icon: MapPin },
  entregue: { label: "Entregue", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", icon: CheckCircle },
  devolvido: { label: "Devolvido", color: "bg-destructive/10 text-destructive border-destructive/20", icon: RotateCcw },
};

const STATUS_DEVOLUCAO: Record<string, { label: string; color: string }> = {
  aberta: { label: "Aberta", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  coletando: { label: "Em Coleta", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  em_transito: { label: "Retornando", color: "bg-primary/10 text-primary border-primary/20" },
  recebida: { label: "Recebida", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  reembolsada: { label: "Reembolsada", color: "bg-muted text-muted-foreground border-border" },
  recusada: { label: "Recusada", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function TransportadorasMarketplace() {
  const role = useRole();
  const navigate = useNavigate();
  const [envios, setEnvios] = useState<any[]>([]);
  const [devolucoes, setDevolucoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [tab, setTab] = useState("envios");
  const [integracaoOpen, setIntegracaoOpen] = useState(false);
  const [devForm, setDevForm] = useState({ pedido_id: "", motivo: "", descricao: "", tipo: "devolucao" });
  const [pedidosParaDev, setPedidosParaDev] = useState<any[]>([]);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    const [enviosRes, devRes] = await Promise.all([
      supabase
        .from("marketplace_pedidos")
        .select("*")
        .not("codigo_rastreio", "is", null)
        .order("data_envio", { ascending: false }),
      supabase
        .from("marketplace_devolucoes" as any)
        .select("*")
        .order("data_solicitacao", { ascending: false })
        .then((res: any) => ({ data: res.data || [], error: res.error })),
    ]);
    setEnvios(enviosRes.data || []);
    setDevolucoes(devRes.data || []);
    setLoading(false);
  }, []);

  const carregarPedidosParaDev = useCallback(async () => {
    const { data } = await supabase
      .from("marketplace_pedidos")
      .select("id, numero_pedido, marketplace, cliente_nome, valor_total")
      .in("status", ["entregue", "enviado", "em_transito"])
      .order("data_pedido", { ascending: false })
      .limit(100);
    setPedidosParaDev(data || []);
  }, []);

  useEffect(() => {
    if (role === "ADMIN" || role === "GERENTE") {
      carregarDados();
      carregarPedidosParaDev();
    }
  }, [carregarDados, carregarPedidosParaDev, role]);

  if (role !== "ADMIN" && role !== "GERENTE") {
    return <Navigate to="/" replace />;
  }

  const criarDevolucao = async () => {
    if (!devForm.pedido_id || !devForm.motivo) {
      toast.error("Selecione o pedido e informe o motivo");
      return;
    }
    const pedido = pedidosParaDev.find((p) => p.id === devForm.pedido_id);
    const { error } = await supabase.from("marketplace_devolucoes" as any).insert({
      pedido_id: devForm.pedido_id,
      marketplace: pedido?.marketplace || "",
      numero_pedido: pedido?.numero_pedido || "",
      motivo: devForm.motivo,
      descricao: devForm.descricao,
      tipo: devForm.tipo,
    } as any);
    if (error) {
      toast.error("Erro ao criar devolução: " + error.message);
      return;
    }
    toast.success("Devolução registrada!");
    setIntegracaoOpen(false);
    setDevForm({ pedido_id: "", motivo: "", descricao: "", tipo: "devolucao" });
    carregarDados();
  };

  const getStatusEnvio = (pedido: any) => {
    if (pedido.data_entrega) return "entregue";
    if (pedido.sub_status === "saiu_entrega") return "saiu_entrega";
    if (pedido.data_envio) return "em_transito";
    if (pedido.status === "devolvido") return "devolvido";
    return "pendente";
  };

  const enviosFiltrados = envios.filter((e) => {
    const matchBusca =
      !busca ||
      (e.codigo_rastreio || "").toLowerCase().includes(busca.toLowerCase()) ||
      (e.numero_pedido || "").toLowerCase().includes(busca.toLowerCase()) ||
      (e.cliente_nome || "").toLowerCase().includes(busca.toLowerCase());
    const status = getStatusEnvio(e);
    const matchStatus = filtroStatus === "todos" || status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const devolucoesFiltradas = devolucoes.filter((d: any) => {
    const matchBusca =
      !busca ||
      (d.numero_pedido || "").toLowerCase().includes(busca.toLowerCase()) ||
      (d.motivo || "").toLowerCase().includes(busca.toLowerCase()) ||
      (d.codigo_rastreio_retorno || "").toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || d.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const formatBRL = (v: number) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const kpis = {
    totalEnvios: envios.length,
    emTransito: envios.filter((e) => !e.data_entrega && e.data_envio).length,
    entregues: envios.filter((e) => e.data_entrega).length,
    devolucoes: devolucoes.length,
    devolucoesAbertas: devolucoes.filter((d: any) => d.status === "aberta" || d.status === "coletando" || d.status === "em_transito").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/marketplaces")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Transportadoras & Devoluções</h1>
            <p className="text-sm text-muted-foreground">Rastreie envios e gerencie devoluções dos marketplaces</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setIntegracaoOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Integração
        </Button>
        <NovaIntegracaoTransportadoraDialog
          open={integracaoOpen}
          onOpenChange={setIntegracaoOpen}
          onSuccess={carregarDados}
        />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Envios</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{kpis.totalEnvios}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">{kpis.emTransito}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{kpis.entregues}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Devoluções</CardTitle>
            <RotateCcw className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{kpis.devolucoes}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dev. Abertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{kpis.devolucoesAbertas}</div></CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="envios" className="gap-1.5">
              <Truck className="h-3.5 w-3.5" /> Rastreio de Envios
            </TabsTrigger>
            <TabsTrigger value="devolucoes" className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Devoluções
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar rastreio, pedido..."
                className="pl-9 w-64"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {tab === "envios"
                  ? Object.entries(STATUS_ENVIO).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))
                  : Object.entries(STATUS_DEVOLUCAO).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Envios Tab */}
        <TabsContent value="envios" className="space-y-3 mt-4">
          {enviosFiltrados.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Truck className="h-12 w-12 mb-3 opacity-40" />
                <p className="font-medium">Nenhum envio encontrado</p>
                <p className="text-xs mt-1">Os envios aparecerão aqui quando os pedidos forem despachados</p>
              </CardContent>
            </Card>
          ) : (
            enviosFiltrados.map((envio) => {
              const status = getStatusEnvio(envio);
              const st = STATUS_ENVIO[status] || STATUS_ENVIO.pendente;
              const Icon = st.icon;
              return (
                <Card key={envio.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${st.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">#{envio.numero_pedido}</p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {(envio.marketplace || "").replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{envio.cliente_nome}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {envio.transportadora && <span>🚚 {envio.transportadora}</span>}
                            {envio.codigo_rastreio && (
                              <span className="font-mono font-medium text-foreground">
                                {envio.codigo_rastreio}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <p className="font-semibold">{formatBRL(envio.valor_total)}</p>
                          <p className="text-xs text-muted-foreground">
                            {envio.cidade}/{envio.estado}
                          </p>
                        </div>
                        <Badge className={`${st.color} border`}>{st.label}</Badge>
                        {envio.codigo_rastreio && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() =>
                              window.open(
                                `https://www.google.com/search?q=rastrear+${envio.codigo_rastreio}`,
                                "_blank"
                              )
                            }
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Rastrear
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Timeline mini */}
                    <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                      {envio.data_envio && (
                        <span>
                          📦 Enviado: {new Date(envio.data_envio).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      {envio.data_entrega && (
                        <>
                          <span className="mx-1">→</span>
                          <span>
                            ✅ Entregue: {new Date(envio.data_entrega).toLocaleDateString("pt-BR")}
                          </span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Devoluções Tab */}
        <TabsContent value="devolucoes" className="space-y-3 mt-4">
          {devolucoesFiltradas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <RotateCcw className="h-12 w-12 mb-3 opacity-40" />
                <p className="font-medium">Nenhuma devolução registrada</p>
                <p className="text-xs mt-1">As devoluções aparecerão automaticamente conforme atualização da transportadora</p>
              </CardContent>
            </Card>
          ) : (
            devolucoesFiltradas.map((dev: any) => {
              const st = STATUS_DEVOLUCAO[dev.status] || STATUS_DEVOLUCAO.aberta;
              return (
                <Card key={dev.id} className="hover:border-destructive/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                          <RotateCcw className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">#{dev.numero_pedido}</p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {dev.tipo === "troca" ? "Troca" : dev.tipo === "extravio" ? "Extravio" : "Devolução"}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {(dev.marketplace || "").replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mt-0.5">{dev.motivo}</p>
                          {dev.descricao && <p className="text-xs text-muted-foreground mt-0.5">{dev.descricao}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {dev.valor_reembolso > 0 && (
                          <span className="text-sm font-semibold text-destructive">
                            -{formatBRL(dev.valor_reembolso)}
                          </span>
                        )}
                        <Badge className={`${st.color} border`}>{st.label}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span>📅 Solicitado: {new Date(dev.data_solicitacao).toLocaleDateString("pt-BR")}</span>
                      {dev.codigo_rastreio_retorno && (
                        <span className="font-mono">🔙 {dev.codigo_rastreio_retorno}</span>
                      )}
                      {dev.data_recebimento && (
                        <span>✅ Recebido: {new Date(dev.data_recebimento).toLocaleDateString("pt-BR")}</span>
                      )}
                      {dev.data_reembolso && (
                        <span>💰 Reembolso: {new Date(dev.data_reembolso).toLocaleDateString("pt-BR")}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
