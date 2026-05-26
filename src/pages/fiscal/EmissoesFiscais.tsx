import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, CheckCircle2, XCircle, AlertCircle, FileText, MoreHorizontal, Download, Mail, Ban, Plus, Info } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import EmitirNotaDialog from "@/components/fiscal/EmitirNotaDialog";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  autorizada: { label: "AUTORIZADA", color: "text-green-600", icon: CheckCircle2 },
  erro: { label: "ERRO", color: "text-red-600", icon: XCircle },
  rejeitada: { label: "REJEITADA", color: "text-red-600", icon: XCircle },
  cancelada: { label: "CANCELADA", color: "text-amber-600", icon: AlertCircle },
  processando: { label: "PROCESSANDO", color: "text-blue-600", icon: FileText },
  pendente: { label: "PENDENTE", color: "text-muted-foreground", icon: FileText },
  denegada: { label: "DENEGADA", color: "text-red-600", icon: XCircle },
};

function EmissaoTab({ tipo }: { tipo: string }) {
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [dataInicial, setDataInicial] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [dataFinal, setDataFinal] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1, 0);
    return d.toISOString().split("T")[0];
  });
  const [emitirOpen, setEmitirOpen] = useState(false);

  const { data: notas = [], refetch } = useQuery({
    queryKey: ["notas_fiscais", tipo, statusFilter, dataInicial, dataFinal],
    queryFn: async () => {
      let query = supabase.from("notas_fiscais" as any).select("*")
        .eq("tipo_nota", tipo)
        .gte("criado_em", dataInicial)
        .lte("criado_em", dataFinal + "T23:59:59")
        .order("criado_em", { ascending: false });
      if (statusFilter !== "Todas") {
        query = query.eq("status", statusFilter.toLowerCase());
      }
      const { data } = await query;
      return (data || []) as any[];
    },
  });

  const stats = {
    autorizada: notas.filter((e) => e.status === "autorizada"),
    erro: notas.filter((e) => e.status === "erro" || e.status === "rejeitada"),
    cancelada: notas.filter((e) => e.status === "cancelada"),
  };

  const sumValor = (arr: any[]) => arr.reduce((s, e) => s + (Number(e.valor_total) || 0), 0);

  const handleAction = async (nota: any, action: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("spedy-proxy", {
        body: {
          operacao: action === "xml" ? "download-xml" : action === "pdf" ? "download-pdf" : action === "email" ? "reenviar-email" : "cancelar",
          tipo: nota.tipo_nota,
          notaId: nota.spedy_nota_id,
          ...(action === "cancelar" ? { dados: { justificativa: "Cancelamento solicitado pelo usuário do sistema" } } : {}),
          ...(action === "email" ? { dados: { emails: [nota.destinatario_email] } } : {}),
        },
      });
      if (error) throw new Error(error.message);

      if (action === "xml" && data?.xml_base64) {
        toast.success("XML baixado");
      } else if (action === "pdf" && data?.pdf_url) {
        window.open(data.pdf_url, "_blank");
      } else if (action === "email") {
        toast.success("Email reenviado!");
      } else if (action === "cancelar") {
        toast.success("Cancelamento solicitado");
        refetch();
      }
    } catch (err: any) {
      toast.error("Erro: " + (err.message || ""));
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters + Actions */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              <SelectItem value="Autorizada">Autorizada</SelectItem>
              <SelectItem value="Rejeitada">Rejeitada</SelectItem>
              <SelectItem value="Erro">Erro</SelectItem>
              <SelectItem value="Cancelada">Cancelada</SelectItem>
              <SelectItem value="Processando">Processando</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Data Inicial</Label>
          <Input type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} className="w-44" />
        </div>
        <div>
          <Label className="text-xs">Data Final</Label>
          <Input type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} className="w-44" />
        </div>
        <Button onClick={() => refetch()} variant="default">
          <Search className="h-4 w-4 mr-2" /> Filtrar
        </Button>
        <Button onClick={() => setEmitirOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> Emitir {tipo.toUpperCase()}
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-green-600">AUTORIZADA</p>
              <p className="text-2xl font-bold">{stats.autorizada.length}</p>
              <p className="text-xs text-muted-foreground">R$ {sumValor(stats.autorizada).toFixed(2)}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-red-600">ERRO / REJEITADA</p>
              <p className="text-2xl font-bold">{stats.erro.length}</p>
              <p className="text-xs text-muted-foreground">R$ {sumValor(stats.erro).toFixed(2)}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600">CANCELADA</p>
              <p className="text-2xl font-bold">{stats.cancelada.length}</p>
              <p className="text-xs text-muted-foreground">R$ {sumValor(stats.cancelada).toFixed(2)}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-600">TOTAL</p>
              <p className="text-2xl font-bold">{notas.length}</p>
              <p className="text-xs text-muted-foreground">R$ {sumValor(notas).toFixed(2)}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detalhe</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Chave de Acesso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma nota fiscal encontrada para o período.
                  </TableCell>
                </TableRow>
              ) : (
                notas.map((n: any) => {
                  const sc = statusConfig[n.status] || statusConfig.pendente;
                  const pd = n.processing_detail as any;
                  return (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">{n.numero_nota || "-"}</TableCell>
                      <TableCell><span className={`font-semibold ${sc.color}`}>{sc.label}</span></TableCell>
                      <TableCell>
                        {pd?.message ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                                  <Info className="h-3 w-3" />
                                  {pd.code || "Info"}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">{pd.message}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{n.destinatario_nome || "-"}</TableCell>
                      <TableCell>R$ {(Number(n.valor_total) || 0).toFixed(2)}</TableCell>
                      <TableCell>{n.criado_em ? format(new Date(n.criado_em), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs">{n.chave_acesso || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {n.spedy_nota_id && (
                              <>
                                <DropdownMenuItem onClick={() => handleAction(n, "pdf")}>
                                  <Download className="h-4 w-4 mr-2" /> Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction(n, "xml")}>
                                  <Download className="h-4 w-4 mr-2" /> Download XML
                                </DropdownMenuItem>
                                {n.destinatario_email && (
                                  <DropdownMenuItem onClick={() => handleAction(n, "email")}>
                                    <Mail className="h-4 w-4 mr-2" /> Reenviar Email
                                  </DropdownMenuItem>
                                )}
                                {n.status === "autorizada" && !n.cancelada && (
                                  <DropdownMenuItem onClick={() => handleAction(n, "cancelar")} className="text-destructive">
                                    <Ban className="h-4 w-4 mr-2" /> Cancelar
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EmitirNotaDialog open={emitirOpen} onOpenChange={setEmitirOpen} onSuccess={() => refetch()} />
    </div>
  );
}

export default function EmissoesFiscais() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Emissões Fiscais</h1>
        <p className="text-sm text-muted-foreground">Emita e gerencie NF-e, NFC-e e NFS-e via Spedy</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gerenciamento de Emissões</CardTitle>
          <CardDescription>Visualize e gerencie todas as notas fiscais emitidas</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="nfe">
            <TabsList className="mb-6">
              <TabsTrigger value="nfe">NF-e</TabsTrigger>
              <TabsTrigger value="nfce">NFC-e</TabsTrigger>
              <TabsTrigger value="nfse">NFS-e</TabsTrigger>
            </TabsList>
            <TabsContent value="nfe"><EmissaoTab tipo="nfe" /></TabsContent>
            <TabsContent value="nfce"><EmissaoTab tipo="nfce" /></TabsContent>
            <TabsContent value="nfse"><EmissaoTab tipo="nfse" /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
