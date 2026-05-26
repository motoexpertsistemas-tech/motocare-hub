import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Users, DollarSign, TrendingUp, Eye, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminAfiliadoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [afiliado, setAfiliado] = useState<any>(null);
  const [vendas, setVendas] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({ clicks: 0, conversoes: 0, taxa: 0, porMes: [] });

  useEffect(() => { if (id) carregarDados(); }, [id]);

  const carregarDados = async () => {
    const { data: af } = await supabase.from("afiliados").select("*").eq("id", id).maybeSingle();
    setAfiliado(af);

    const { data: v } = await supabase.from("afiliados_vendas").select("*").eq("afiliado_id", id).order("data_venda", { ascending: false });
    setVendas(v || []);

    const { data: clicks } = await supabase.from("afiliados_analytics").select("id").eq("afiliado_id", id).eq("evento", "click");
    const { data: conv } = await supabase.from("afiliados_analytics").select("id").eq("afiliado_id", id).eq("evento", "conversao");
    const cl = clicks?.length || 0;
    const co = conv?.length || 0;

    // Vendas por mês
    const porMes: any[] = [];
    const hoje = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mes = d.toLocaleString("pt-BR", { month: "short" });
      const vm = (v || []).filter(x => { const dv = new Date(x.data_venda); return dv.getMonth() === d.getMonth() && dv.getFullYear() === d.getFullYear(); });
      porMes.push({ mes, vendas: vm.length, comissao: vm.reduce((s: number, x: any) => s + (x.comissao_valor || 0), 0) });
    }

    setAnalytics({ clicks: cl, conversoes: co, taxa: cl ? ((co / cl) * 100).toFixed(1) : 0, porMes });
  };

  if (!afiliado) return <div className="p-6 text-muted-foreground">Carregando...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/afiliados")}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
        <div>
          <h1 className="text-2xl font-bold">{afiliado.nome_completo}</h1>
          <p className="text-sm text-muted-foreground">{afiliado.email} • Código: <strong>{afiliado.codigo_afiliado}</strong></p>
        </div>
        <Badge className={afiliado.status === "ativo" ? "bg-green-600" : "bg-yellow-600"}>{afiliado.status}</Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">Vendas</p><p className="text-2xl font-bold">{afiliado.total_vendas}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">Comissão Total</p><p className="text-2xl font-bold text-green-600">R$ {(afiliado.total_comissoes || 0).toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">Pendente</p><p className="text-2xl font-bold text-yellow-600">R$ {(afiliado.comissoes_pendentes || 0).toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">Clicks</p><p className="text-2xl font-bold">{analytics.clicks}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">Taxa Conversão</p><p className="text-2xl font-bold text-primary">{analytics.taxa}%</p>
        </CardContent></Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader><CardTitle>Vendas e Comissões (6 meses)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.porMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="vendas" fill="hsl(var(--primary))" name="Vendas" />
              <Bar dataKey="comissao" fill="#10B981" name="Comissão (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Últimas Vendas */}
      <Card>
        <CardHeader><CardTitle>Vendas do Afiliado</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Valor Plano</TableHead>
                <TableHead>Comissão %</TableHead>
                <TableHead>Comissão R$</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendas.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium capitalize">{v.plano}</TableCell>
                  <TableCell>R$ {(v.valor_plano || 0).toFixed(2)}</TableCell>
                  <TableCell>{v.comissao_percentual}%</TableCell>
                  <TableCell className="text-green-600 font-medium">R$ {(v.comissao_valor || 0).toFixed(2)}</TableCell>
                  <TableCell><Badge variant="outline">{v.comissao_status}</Badge></TableCell>
                  <TableCell>{new Date(v.data_venda).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
              {vendas.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma venda registrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dados Bancários */}
      <Card>
        <CardHeader><CardTitle>Dados Bancários</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">PIX Chave</p><p className="font-medium">{afiliado.pix_chave || "—"}</p></div>
            <div><p className="text-muted-foreground">PIX Tipo</p><p className="font-medium capitalize">{afiliado.pix_tipo || "—"}</p></div>
            <div><p className="text-muted-foreground">Banco</p><p className="font-medium">{afiliado.banco || "—"}</p></div>
            <div><p className="text-muted-foreground">Conta</p><p className="font-medium">{afiliado.agencia || "—"} / {afiliado.conta || "—"}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
