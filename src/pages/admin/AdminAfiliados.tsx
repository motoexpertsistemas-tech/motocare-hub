import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, Check, X, DollarSign, TrendingUp, UserCheck, Eye, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AdminAfiliados() {
  const navigate = useNavigate();
  const [afiliados, setAfiliados] = useState<any[]>([]);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const [stats, setStats] = useState<any>({ totalAfiliados: 0, totalAtivos: 0, totalPendentes: 0, totalComissoesPendentes: 0, totalComissoesPagas: 0 });

  useEffect(() => { carregarDados(); }, [filtroStatus]);

  const carregarDados = async () => {
    const { data: todos } = await supabase.from("afiliados").select("*");
    const lista = todos || [];

    setStats({
      totalAfiliados: lista.length,
      totalAtivos: lista.filter(a => a.status === "ativo").length,
      totalPendentes: lista.filter(a => a.status === "pendente").length,
      totalComissoesPendentes: lista.reduce((s, a) => s + (a.comissoes_pendentes || 0), 0),
      totalComissoesPagas: lista.reduce((s, a) => s + (a.comissoes_pagas || 0), 0),
    });

    let query = supabase.from("afiliados").select("*").order("criado_em", { ascending: false });
    if (filtroStatus !== "todos") query = query.eq("status", filtroStatus);
    const { data } = await query;
    setAfiliados(data || []);
  };

  const aprovarAfiliado = async (id: string) => {
    if (!confirm("Aprovar este afiliado?")) return;
    const { error } = await supabase.from("afiliados").update({ status: "ativo", aprovado_em: new Date().toISOString() }).eq("id", id);
    if (!error) { toast.success("Afiliado aprovado!"); carregarDados(); }
  };

  const rejeitarAfiliado = async (id: string) => {
    if (!confirm("Rejeitar este afiliado?")) return;
    await supabase.from("afiliados").update({ status: "bloqueado" }).eq("id", id);
    toast.info("Afiliado rejeitado"); carregarDados();
  };

  const filtrados = afiliados.filter(a =>
    (a.nome_completo || "").toLowerCase().includes(busca.toLowerCase()) ||
    (a.email || "").toLowerCase().includes(busca.toLowerCase()) ||
    (a.codigo_afiliado || "").toLowerCase().includes(busca.toLowerCase())
  );

  const statusColor = (s: string) => s === "ativo" ? "bg-green-600" : s === "pendente" ? "bg-yellow-600" : s === "suspenso" ? "bg-orange-600" : "bg-red-600";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Afiliados</h1>
          <p className="text-muted-foreground text-sm">Gerencie afiliados, aprovações e comissões</p>
        </div>
        <Button onClick={() => navigate("/admin/afiliados/pagamentos")} variant="outline">
          <DollarSign className="h-4 w-4 mr-2" />Pagamentos
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2"><Users className="text-blue-500 h-6 w-6" /><span className="text-sm text-muted-foreground">Total Afiliados</span></div>
          <p className="text-3xl font-bold">{stats.totalAfiliados}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.totalAtivos} ativos • {stats.totalPendentes} pendentes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2"><UserCheck className="text-green-500 h-6 w-6" /><span className="text-sm text-muted-foreground">Ativos</span></div>
          <p className="text-3xl font-bold">{stats.totalAtivos}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2"><DollarSign className="text-yellow-500 h-6 w-6" /><span className="text-sm text-muted-foreground">A Pagar</span></div>
          <p className="text-3xl font-bold">R$ {stats.totalComissoesPendentes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2"><TrendingUp className="text-primary h-6 w-6" /><span className="text-sm text-muted-foreground">Total Pago</span></div>
          <p className="text-3xl font-bold">R$ {stats.totalComissoesPagas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
      </div>

      {/* Filtros */}
      <Card><CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, email ou código..." className="pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["todos", "pendente", "ativo", "suspenso", "bloqueado"].map(s => (
              <Button key={s} onClick={() => setFiltroStatus(s)} variant={filtroStatus === s ? "default" : "outline"} size="sm">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardContent></Card>

      {/* Tabela */}
      <Card>
        <CardHeader><CardTitle>Lista de Afiliados</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Afiliado</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map(af => (
                <TableRow key={af.id}>
                  <TableCell>
                    <p className="font-medium">{af.nome_completo}</p>
                    <p className="text-xs text-muted-foreground">{af.email}</p>
                  </TableCell>
                  <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{af.codigo_afiliado}</code></TableCell>
                  <TableCell className="text-right font-medium">{af.total_vendas}</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">R$ {(af.total_comissoes || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right text-yellow-600 font-medium">R$ {(af.comissoes_pendentes || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-center"><Badge className={statusColor(af.status)}>{af.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {af.status === "pendente" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-green-600" onClick={() => aprovarAfiliado(af.id)}><Check className="h-3 w-3" /></Button>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-600" onClick={() => rejeitarAfiliado(af.id)}><X className="h-3 w-3" /></Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => navigate(`/admin/afiliados/${af.id}`)}><Eye className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Nenhum afiliado encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
