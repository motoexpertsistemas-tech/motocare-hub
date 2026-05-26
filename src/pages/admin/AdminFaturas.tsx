import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Paga",
  overdue: "Vencida",
  canceled: "Cancelada",
  refunded: "Reembolsada",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  paid: "default",
  overdue: "destructive",
  canceled: "secondary",
  refunded: "secondary",
};

export default function AdminFaturas() {
  const navigate = useNavigate();
  const [faturas, setFaturas] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarFaturas();
  }, [statusFilter]);

  const carregarFaturas = async () => {
    let query = supabase
      .from("faturas")
      .select("*, empresas(nome)")
      .order("data_vencimento", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query.limit(100);
    setFaturas(data || []);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturas</h1>
          <p className="text-muted-foreground">{faturas.length} fatura(s)</p>
        </div>
        <Button onClick={() => navigate("/admin")}>← Voltar</Button>
      </div>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Paga</SelectItem>
            <SelectItem value="overdue">Vencida</SelectItem>
            <SelectItem value="canceled">Cancelada</SelectItem>
            <SelectItem value="refunded">Reembolsada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Fatura</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Forma</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faturas.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-sm">{f.numero_fatura}</TableCell>
                  <TableCell>{(f.empresas as any)?.nome || "—"}</TableCell>
                  <TableCell>
                    {String(f.referencia_mes).padStart(2, "0")}/{f.referencia_ano}
                  </TableCell>
                  <TableCell className="font-semibold">
                    R$ {Number(f.valor_final).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[f.status] || "secondary"}>
                      {STATUS_LABELS[f.status] || f.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(f.data_vencimento).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {f.data_pagamento
                      ? new Date(f.data_pagamento).toLocaleDateString("pt-BR")
                      : "—"}
                  </TableCell>
                  <TableCell className="uppercase text-xs">{f.forma_pagamento || "—"}</TableCell>
                </TableRow>
              ))}
              {faturas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {loading ? "Carregando..." : "Nenhuma fatura"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
