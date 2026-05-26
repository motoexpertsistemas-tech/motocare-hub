import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Eye, Trash2, Ban, ExternalLink, AlertTriangle, Sparkles, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function SubscriptionBanner({ empresa, assinatura }: { empresa: any; assinatura: any }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const plano = assinatura?.plano || empresa.plano_ativo || "trial";
  const status = assinatura?.status || "trial";
  const isTrial = status === "trial";
  const isActive = status === "active";
  const isCanceled = status === "canceled";

  // Calculate expiration
  let expiraEm: Date | null = null;
  if (isTrial && (assinatura?.trial_fim || empresa.trial_expira_em)) {
    expiraEm = new Date(assinatura?.trial_fim || empresa.trial_expira_em);
  }

  const tempoRestante = expiraEm ? expiraEm.getTime() - now.getTime() : null;
  const expirado = tempoRestante !== null && tempoRestante <= 0;
  const horasRestantes = tempoRestante && tempoRestante > 0 ? Math.floor(tempoRestante / (1000 * 60 * 60)) : 0;
  const minutosRestantes = tempoRestante && tempoRestante > 0 ? Math.floor((tempoRestante % (1000 * 60 * 60)) / (1000 * 60)) : 0;
  const diasRestantes = tempoRestante && tempoRestante > 0 ? Math.floor(tempoRestante / (1000 * 60 * 60 * 24)) : 0;

  const planoLabels: Record<string, string> = {
    trial: "Gratuito",
    starter: "Bronze",
    professional: "Prata",
    enterprise: "Ouro",
    platina: "Platina",
  };

  const statusColors: Record<string, string> = {
    trial: "border-warning/40 bg-warning/5",
    active: "border-green-500/30 bg-green-500/5",
    canceled: "border-destructive/40 bg-destructive/5",
    suspended: "border-destructive/40 bg-destructive/5",
  };

  return (
    <div className={`rounded-lg border px-3 py-2 flex items-center gap-3 flex-wrap text-xs ${statusColors[status] || "border-border bg-secondary/20"}`}>
      {/* Icon */}
      {(isTrial || expirado) && <AlertTriangle className="h-4 w-4 text-warning shrink-0" />}
      {isActive && <Sparkles className="h-4 w-4 text-green-500 shrink-0" />}

      {/* Plan info */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground">{planoLabels[plano] || plano}</span>
        {isTrial && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-warning/50 text-warning">Teste</Badge>}
        {isActive && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-green-500/50 text-green-500">Ativo</Badge>}
        {isCanceled && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-destructive/50 text-destructive">Cancelado</Badge>}
      </div>

      {/* Expiration */}
      {expiraEm && !expirado && (
        <>
          <span className="text-muted-foreground">
            ⚠ EXPIRANDO: {expiraEm.toLocaleDateString("pt-BR")} às {expiraEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <Badge className="bg-warning/20 text-warning border-warning/30 text-[10px] gap-1">
            <Clock className="h-3 w-3" />
            {diasRestantes > 0 ? `${diasRestantes}d ${horasRestantes % 24}h restantes` : `${horasRestantes}h ${minutosRestantes}min restantes`}
          </Badge>
        </>
      )}

      {expirado && (
        <span className="text-destructive font-medium">⚠ EXPIRADO</span>
      )}

      {isActive && assinatura?.proxima_cobranca && (
        <span className="text-muted-foreground">
          Próxima cobrança: {new Date(assinatura.proxima_cobranca).toLocaleDateString("pt-BR")}
        </span>
      )}

      {/* Value */}
      {assinatura?.valor > 0 && (
        <span className="text-muted-foreground ml-auto">
          R$ {Number(assinatura.valor).toFixed(2).replace(".", ",")} / {assinatura.periodicidade === "anual" ? "ano" : "mês"}
        </span>
      )}
    </div>
  );
}

export default function AdminEmpresas() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [assinaturas, setAssinaturas] = useState<Record<string, any>>({});
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const carregarEmpresas = async () => {
    const [empRes, assRes] = await Promise.all([
      supabase.from("empresas").select("*").order("criado_em", { ascending: false }),
      supabase.from("assinaturas").select("*"),
    ]);
    setEmpresas(empRes.data || []);
    const assMap: Record<string, any> = {};
    (assRes.data || []).forEach((a: any) => { assMap[a.empresa_id] = a; });
    setAssinaturas(assMap);
    setLoading(false);
  };

  const bloquearEmpresa = async (id: string, statusAtual: string) => {
    const novoStatus = statusAtual === "bloqueado" ? "ativo" : "bloqueado";
    const acao = novoStatus === "bloqueado" ? "bloquear" : "desbloquear";
    if (!confirm(`Deseja ${acao} esta empresa?`)) return;
    const { error } = await supabase.from("empresas").update({ status: novoStatus }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar status"); return; }
    toast.success(`Empresa ${novoStatus === "bloqueado" ? "bloqueada" : "desbloqueada"}!`);
    carregarEmpresas();
  };

  const deletarEmpresa = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja DELETAR a empresa "${nome}"? Todos os dados serão removidos permanentemente.`)) return;
    const { error } = await supabase.from("empresas").delete().eq("id", id);
    if (error) { toast.error("Erro ao deletar empresa: " + error.message); return; }
    toast.success("Empresa deletada com sucesso!");
    carregarEmpresas();
  };

  const filtered = empresas.filter(
    (e) =>
      e.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
      e.cnpj?.toLowerCase().includes(filtro.toLowerCase()) ||
      e.email?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empresas</h1>
          <p className="text-muted-foreground">{empresas.length} empresa(s) cadastrada(s)</p>
        </div>
        <Button onClick={() => navigate("/admin")}>← Voltar</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input placeholder="Buscar por nome, CNPJ ou email..." value={filtro} onChange={(e) => setFiltro(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{e.nome}</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-muted-foreground">{e.email}</p>
                        {e.slug && (
                          <a href={`/app/${e.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-0.5" title={`/app/${e.slug}`}>
                            <ExternalLink size={10} />/app/{e.slug}
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{e.cnpj || "—"}</TableCell>
                  <TableCell className="min-w-[320px]">
                    <SubscriptionBanner empresa={e} assinatura={assinaturas[e.id]} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={e.status === "ativo" ? "default" : "secondary"}>{e.status}</Badge>
                  </TableCell>
                  <TableCell>{e.max_usuarios}</TableCell>
                  <TableCell className="text-sm">{new Date(e.criado_em).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/empresas/${e.id}`)} title="Ver detalhes">
                        <Eye size={16} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => bloquearEmpresa(e.id, e.status)} title={e.status === "bloqueado" ? "Desbloquear" : "Bloquear"} className={e.status === "bloqueado" ? "text-green-600 hover:text-green-700" : "text-yellow-600 hover:text-yellow-700"}>
                        <Ban size={16} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deletarEmpresa(e.id, e.nome)} title="Deletar empresa" className="text-destructive hover:text-destructive">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {loading ? "Carregando..." : "Nenhuma empresa encontrada"}
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
