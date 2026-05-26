import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Percent, Search, Filter, ChevronLeft, ChevronRight, DollarSign, ChevronUp, ChevronDown, Printer } from "lucide-react";

export default function Comissoes() {
  const [showFilters, setShowFilters] = useState(false);
  const [nrVendaOS, setNrVendaOS] = useState("");
  const [profissional, setProfissional] = useState("");
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().slice(0, 10));

  const totalPendencias = 0;
  const totalVendas = 0;
  const totalComissoes = 0;
  const totalPago = 0;

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Percent className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Comissões</h1>
        </div>
        <div className="flex items-center gap-2">
          <Card className="bg-primary text-primary-foreground px-4 py-2">
            <p className="text-xs opacity-80">Total de pendências</p>
            <p className="text-lg font-bold">{formatBRL(totalPendencias)}</p>
          </Card>
          <Button className="gradient-primary text-primary-foreground">
            <DollarSign className="h-4 w-4 mr-1" /> Realizar Pagamento
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-1" /> Filtros
        </Button>
        <Button variant="link" size="sm" className="text-muted-foreground" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? <>Ocultar <ChevronUp className="h-3 w-3 ml-1" /></> : <>Exibir <ChevronDown className="h-3 w-3 ml-1" /></>}
        </Button>
      </div>

      {showFilters && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Nº da Venda/OS"
              value={nrVendaOS}
              onChange={(e) => setNrVendaOS(e.target.value)}
              className="max-w-[200px]"
            />
            <Input
              placeholder="Profissional *"
              value={profissional}
              onChange={(e) => setProfissional(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Início de dados</label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-[170px]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Dados finais</label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-[170px]" />
            </div>
            <Button className="gradient-primary text-primary-foreground">PESQUISAR</Button>
            <Button variant="secondary">LIMPAR</Button>
            <Button variant="secondary" size="icon"><Printer className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="glass-panel">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dados</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Utiliza meta</TableHead>
                <TableHead>Total da Venda/Ordem</TableHead>
                <TableHead>Valentia</TableHead>
                <TableHead>Comissão Utilizada</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16">
                  <Search className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Nenhum item encontrado</p>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-end items-center gap-2 p-3 text-sm text-muted-foreground">
            <span>0-0 de 0</span>
            <Button variant="ghost" size="icon" disabled><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" disabled><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="flex gap-8 text-sm">
        <div>
          <p className="text-muted-foreground">Total de vendas/pedidos de serviços no período</p>
          <p className="font-bold">{formatBRL(totalVendas)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total de comissões no período</p>
          <p className="font-bold">{formatBRL(totalComissoes)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Pago no período</p>
          <p className="font-bold">{formatBRL(totalPago)}</p>
        </div>
      </div>
    </div>
  );
}
