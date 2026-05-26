import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Send, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminAfiliadosPagamentos() {
  const [pendentes, setPendentes] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [processando, setProcessando] = useState(false);

  useEffect(() => { carregarPendentes(); }, []);

  const carregarPendentes = async () => {
    const { data } = await supabase
      .from("afiliados_comissoes_recorrentes")
      .select("*, afiliados(nome_completo, email, pix_chave, pix_tipo)")
      .eq("status", "aprovada");

    const agrupado = (data || []).reduce((acc: any, c) => {
      if (!acc[c.afiliado_id]) acc[c.afiliado_id] = { afiliado: c.afiliados, afiliado_id: c.afiliado_id, comissoes: [], total: 0 };
      acc[c.afiliado_id].comissoes.push(c);
      acc[c.afiliado_id].total += c.comissao_valor;
      return acc;
    }, {});
    setPendentes(Object.values(agrupado));
  };

  const toggle = (id: string) => setSelecionados(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelecionados(p => p.length === pendentes.length ? [] : pendentes.map(c => c.afiliado_id));

  const processar = async () => {
    if (!selecionados.length || !confirm(`Processar pagamento para ${selecionados.length} afiliado(s)?`)) return;
    setProcessando(true);
    try {
      for (const aId of selecionados) {
        const p = pendentes.find(x => x.afiliado_id === aId);
        if (!p) continue;

        await supabase.from("afiliados_pagamentos").insert({
          afiliado_id: aId,
          valor_bruto: p.total,
          valor_liquido: p.total,
          metodo_pagamento: "pix",
          dados_bancarios: { pix_chave: p.afiliado.pix_chave, pix_tipo: p.afiliado.pix_tipo },
          mes_referencia: new Date().getMonth() + 1,
          ano_referencia: new Date().getFullYear(),
          status: "concluido",
          processado_em: new Date().toISOString(),
        });

        const ids = p.comissoes.map((c: any) => c.id);
        await supabase.from("afiliados_comissoes_recorrentes").update({ status: "paga", data_pagamento: new Date().toISOString() }).in("id", ids);
        await supabase.rpc("atualizar_comissoes_afiliado", { p_afiliado_id: aId, p_valor: p.total });
      }
      toast.success("Pagamentos processados!");
      setSelecionados([]);
      carregarPendentes();
    } catch (e) {
      toast.error("Erro ao processar pagamentos");
    } finally { setProcessando(false); }
  };

  const totalSel = pendentes.filter(c => selecionados.includes(c.afiliado_id)).reduce((s, c) => s + c.total, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pagamentos de Afiliados</h1>
          <p className="text-muted-foreground text-sm">Processe comissões pendentes</p>
        </div>
        <Button onClick={processar} disabled={!selecionados.length || processando}>
          <Send className="h-4 w-4 mr-2" />{processando ? "Processando..." : `Pagar (${selecionados.length})`}
        </Button>
      </div>

      {selecionados.length > 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="text-green-500 h-8 w-8" />
              <div>
                <p className="font-semibold text-green-600">{selecionados.length} afiliado(s) selecionado(s)</p>
                <p className="text-sm text-green-500">Total: R$ {totalSel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setSelecionados([])}>Limpar</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Comissões Aprovadas</CardTitle>
            <Button variant="outline" size="sm" onClick={toggleAll}>{selecionados.length === pendentes.length ? "Desmarcar" : "Selecionar"} Todos</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={selecionados.length === pendentes.length && pendentes.length > 0} onCheckedChange={toggleAll} /></TableHead>
                <TableHead>Afiliado</TableHead>
                <TableHead>PIX</TableHead>
                <TableHead className="text-right">Comissões</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendentes.map(p => (
                <TableRow key={p.afiliado_id}>
                  <TableCell><Checkbox checked={selecionados.includes(p.afiliado_id)} onCheckedChange={() => toggle(p.afiliado_id)} /></TableCell>
                  <TableCell>
                    <p className="font-medium">{p.afiliado?.nome_completo}</p>
                    <p className="text-xs text-muted-foreground">{p.afiliado?.email}</p>
                  </TableCell>
                  <TableCell>
                    {p.afiliado?.pix_chave ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">{p.afiliado.pix_chave}</code>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600"><AlertCircle className="h-3 w-3 mr-1" />Sem PIX</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{p.comissoes.length}</TableCell>
                  <TableCell className="text-right text-lg font-bold text-green-600">R$ {p.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
              {pendentes.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <Check className="mx-auto h-10 w-10 mb-3 opacity-50" />Nenhuma comissão pendente
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
