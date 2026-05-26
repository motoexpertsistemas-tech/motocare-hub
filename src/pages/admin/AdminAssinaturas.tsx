import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const STATUS_COLORS: Record<string, string> = {
  trial: "bg-yellow-500",
  active: "bg-green-500",
  past_due: "bg-orange-500",
  canceled: "bg-red-500",
  suspended: "bg-gray-500",
  expired: "bg-gray-400",
};

export default function AdminAssinaturas() {
  const navigate = useNavigate();
  const [assinaturas, setAssinaturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAssinaturas();
  }, []);

  const carregarAssinaturas = async () => {
    const { data } = await supabase
      .from("assinaturas")
      .select("*, empresas(nome, cnpj)")
      .order("criado_em", { ascending: false });
    setAssinaturas(data || []);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assinaturas</h1>
          <p className="text-muted-foreground">{assinaturas.length} assinatura(s)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/admin/faturas")}>
            Faturas
          </Button>
          <Button onClick={() => navigate("/admin")}>← Voltar</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Periodicidade</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Próx. Cobrança</TableHead>
                <TableHead>Início</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assinaturas.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {(a.empresas as any)?.nome || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.plano}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{a.periodicidade}</TableCell>
                  <TableCell>
                    R$ {Number(a.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[a.status] || "bg-gray-500"}>
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {a.proxima_cobranca
                      ? new Date(a.proxima_cobranca).toLocaleDateString("pt-BR")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {new Date(a.data_inicio).toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
              {assinaturas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {loading ? "Carregando..." : "Nenhuma assinatura"}
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
