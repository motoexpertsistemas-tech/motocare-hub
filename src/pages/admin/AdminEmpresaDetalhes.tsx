import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Building2, ArrowLeft, CreditCard, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminEmpresaDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<any>(null);
  const [assinatura, setAssinatura] = useState<any>(null);
  const [faturas, setFaturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) carregarDados();
  }, [id]);

  const carregarDados = async () => {
    const [empresaRes, assinaturaRes, faturasRes] = await Promise.all([
      supabase.from("empresas").select("*").eq("id", id!).single(),
      supabase.from("assinaturas").select("*").eq("empresa_id", id!).maybeSingle(),
      supabase.from("faturas").select("*").eq("empresa_id", id!).order("data_vencimento", { ascending: false }),
    ]);
    setEmpresa(empresaRes.data);
    setAssinatura(assinaturaRes.data);
    setFaturas(faturasRes.data || []);
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-20 text-muted-foreground">Carregando...</div>;
  }

  if (!empresa) {
    return <div className="flex justify-center py-20 text-muted-foreground">Empresa não encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/empresas")}>
          <ArrowLeft size={16} className="mr-2" /> Voltar
        </Button>
        <h1 className="text-3xl font-bold">{empresa.nome}</h1>
        <Badge variant={empresa.status === "ativo" ? "default" : "secondary"}>
          {empresa.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INFO EMPRESA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 size={20} /> Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Nome Fantasia</p>
                <p className="font-medium">{empresa.nome_fantasia || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CNPJ</p>
                <p className="font-medium">{empresa.cnpj || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{empresa.email || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Telefone</p>
                <p className="font-medium">{empresa.telefone || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Plano Ativo</p>
                <Badge variant="outline">{empresa.plano_ativo}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Máx. Usuários</p>
                <p className="font-medium">{empresa.max_usuarios}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">
                  {new Date(empresa.criado_em).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ASSINATURA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={20} /> Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assinatura ? (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Plano</p>
                    <p className="font-medium capitalize">{assinatura.plano}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Periodicidade</p>
                    <p className="font-medium capitalize">{assinatura.periodicidade}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor</p>
                    <p className="font-medium">
                      R$ {Number(assinatura.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge>{assinatura.status}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Próx. Cobrança</p>
                    <p className="font-medium">
                      {assinatura.proxima_cobranca
                        ? new Date(assinatura.proxima_cobranca).toLocaleDateString("pt-BR")
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Sem assinatura cadastrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FATURAS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} /> Faturas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faturas.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-sm">{f.numero_fatura}</TableCell>
                  <TableCell>
                    {String(f.referencia_mes).padStart(2, "0")}/{f.referencia_ano}
                  </TableCell>
                  <TableCell className="font-semibold">
                    R$ {Number(f.valor_final).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={f.status === "paid" ? "default" : f.status === "overdue" ? "destructive" : "outline"}>
                      {f.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(f.data_vencimento).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    {f.data_pagamento ? new Date(f.data_pagamento).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {faturas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma fatura
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
