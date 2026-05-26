import { useState } from "react";
import { Search, Filter, Shield, AlertTriangle, DollarSign, FileText, Wrench, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type AuditEvent = {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  severity: "info" | "warning" | "critical";
};

const mockLogs: AuditEvent[] = [];

const severityConfig = {
  info: { icon: FileText, color: "text-info", bg: "bg-info/10", label: "Info" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", label: "Atenção" },
  critical: { icon: Shield, color: "text-destructive", bg: "bg-destructive/10", label: "Crítico" },
};

const actionIcons: Record<string, typeof Shield> = {
  estorno_venda: DollarSign,
  desconto_aplicado: DollarSign,
  alteracao_preco: Package,
  nfe_emitida: FileText,
  cancelamento_os: Wrench,
  venda_pdv: DollarSign,
  status_os: Wrench,
  estoque_importado: Package,
};

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  const filtered = mockLogs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = !severityFilter || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const criticalCount = mockLogs.filter((l) => l.severity === "critical").length;
  const warningCount = mockLogs.filter((l) => l.severity === "warning").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Auditoria & Logs</h1>
        <p className="text-sm text-muted-foreground">Registro completo de todas as ações sensíveis do sistema</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-panel">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Eventos</p>
              <p className="text-xl font-bold">{mockLogs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-warning/30">
          <CardContent className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setSeverityFilter(severityFilter === "warning" ? null : "warning")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alertas</p>
              <p className="text-xl font-bold text-warning">{warningCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-destructive/30">
          <CardContent className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setSeverityFilter(severityFilter === "critical" ? null : "critical")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Eventos Críticos</p>
              <p className="text-xl font-bold text-destructive">{criticalCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuário, ação, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>
        <Button
          variant={severityFilter ? "default" : "outline"}
          size="icon"
          onClick={() => setSeverityFilter(null)}
          className={severityFilter ? "gradient-primary text-primary-foreground" : ""}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Log entries */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="glass-panel">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum registro de auditoria encontrado</p>
              <p className="text-xs mt-1">Os eventos serão registrados automaticamente conforme o uso do sistema.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((log) => {
            const sev = severityConfig[log.severity];
            const ActionIcon = actionIcons[log.action] || FileText;
            return (
              <Card key={log.id} className="glass-panel hover:border-border transition-colors">
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${sev.bg}`}>
                    <ActionIcon className={`h-4 w-4 ${sev.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{log.user}</span>
                      <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">
                        {log.role}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${sev.color} border-current/30`}>
                        {sev.label}
                      </Badge>
                      <span className="font-mono text-[10px] text-muted-foreground ml-auto">{log.entityId}</span>
                    </div>
                    <p className="text-sm text-foreground/80">{log.details}</p>
                    <p className="text-[11px] text-muted-foreground">{log.timestamp}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
