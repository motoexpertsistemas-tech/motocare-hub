import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Search, X, FileText, CheckCircle2, Play, Trash2, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Cotacao {
  id: string;
  titulo: string;
  fornecedor: string | null;
  status: string;
  observacoes: string | null;
  criado_em: string;
  data_envio: string | null;
  data_resposta: string | null;
}

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  enviada: "Enviada",
  respondida: "Respondida",
  finalizada: "Finalizada",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "secondary",
  enviada: "outline",
  respondida: "default",
  finalizada: "default",
};

export default function Cotacoes() {
  const navigate = useNavigate();
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [fornecedor, setFornecedor] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [respondido, setRespondido] = useState("todas");

  const fetchCotacoes = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("cotacoes" as any).select("*").order("criado_em", { ascending: false });

    if (fornecedor.trim()) {
      query = query.ilike("fornecedor", `%${fornecedor.trim()}%`);
    }
    if (dataInicio) {
      query = query.gte("criado_em", dataInicio);
    }
    if (dataFim) {
      query = query.lte("criado_em", dataFim + "T23:59:59");
    }
    if (respondido === "sim") {
      query = query.eq("status", "respondida");
    } else if (respondido === "nao") {
      query = query.neq("status", "respondida");
    }

    const { data, error } = await query;
    setLoading(false);
    if (error) {
      toast.error("Erro ao buscar cotações");
      return;
    }
    setCotacoes((data as any[]) || []);
  }, [fornecedor, dataInicio, dataFim, respondido]);

  useEffect(() => {
    fetchCotacoes();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta cotação?")) return;
    const { error } = await supabase.from("cotacoes" as any).delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir cotação");
      return;
    }
    toast.success("Cotação excluída");
    fetchCotacoes();
  };

  const handleExport = () => {
    if (cotacoes.length === 0) {
      toast.info("Nenhuma cotação para exportar");
      return;
    }
    const csv = [
      ["Título", "Fornecedor", "Status", "Criado em"].join(";"),
      ...cotacoes.map(c => [c.titulo, c.fornecedor || "", statusLabel[c.status] || c.status, format(new Date(c.criado_em), "dd/MM/yyyy")].join(";"))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cotacoes.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportação concluída");
  };

  const beneficios = [
    "Economizar tempo com ligações telefônicas, e-mails etc...",
    "Economizar dinheiro porque terá a certeza de estar comprando os produtos mais baratos",
    "Aumentar sua margem de lucro",
    "Ser mais competitivo no mercado",
    "Obter histórico de todas as cotações",
    "Transformar cotações em compras",
    "E muito mais...",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Cotações</h1>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5" onClick={() => navigate("/estoque/cotacoes/adicionar")}>
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings className="h-4 w-4" /> Mais ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleExport}>
              <FileText className="h-4 w-4 mr-2" /> Exportar CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fornecedor</Label>
              <Input placeholder="Buscar fornecedor..." value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Período</Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                <span className="text-muted-foreground text-xs">a</span>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Respondido</Label>
              <Select value={respondido} onValueChange={setRespondido}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5" onClick={fetchCotacoes}>
              <Search className="h-4 w-4" /> Buscar
            </Button>
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => { setFornecedor(""); setDataInicio(""); setDataFim(""); setRespondido("todas"); }}>
              <X className="h-4 w-4" /> Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {cotacoes.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cotacoes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.titulo}</TableCell>
                    <TableCell>{c.fornecedor || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[c.status] || "secondary"}>
                        {statusLabel[c.status] || c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(c.criado_em), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} title="Excluir">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : !loading ? (
        <Card>
          <CardContent className="p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Cotações de produtos</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Este módulo permite a tomada de preços simultânea a um número maior de fornecedores, obtendo-se melhores preços e condições de compra.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button className="gap-1.5" onClick={() => navigate("/estoque/cotacoes/adicionar")}>
                <Plus className="h-4 w-4" /> Adicionar minha primeira cotação
              </Button>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">Adicionando cotações você vai conseguir:</h3>
              <ul className="space-y-1.5">
                {beneficios.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
