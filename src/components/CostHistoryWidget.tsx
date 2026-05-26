import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface CostHistoryWidgetProps {
  precoCusto: number | null;
  custoFinal: number | null;
}

const MOCK_HISTORICO: { data: string; fornecedor: string; qtd: number; unitario: number }[] = [];

export function CostHistoryWidget({ precoCusto, custoFinal }: CostHistoryWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  const ultimoPreco = precoCusto ?? 0;

  // Calculate weighted average from mock data
  const totalGasto = MOCK_HISTORICO.reduce((sum, c) => sum + c.qtd * c.unitario, 0);
  const totalQtd = MOCK_HISTORICO.reduce((sum, c) => sum + c.qtd, 0);
  const mediaPonderada = totalQtd > 0 ? totalGasto / totalQtd : 0;

  const custoSubiu = ultimoPreco > mediaPonderada && mediaPonderada > 0;

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          📊 Histórico de Custos
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "Ocultar histórico" : "Ver últimas compras"}
        >
          {expanded ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded-md border p-2 ${custoSubiu ? "border-destructive/50 bg-destructive/10" : "border-border bg-secondary/30"}`}>
          <p className="text-[10px] text-muted-foreground uppercase">Último Custo</p>
          <div className="flex items-center gap-1">
            <p className={`font-mono font-bold text-sm ${custoSubiu ? "text-destructive" : "text-foreground"}`}>
              {formatCurrency(ultimoPreco)}
            </p>
            {custoSubiu && <AlertTriangle className="h-3 w-3 text-destructive" />}
          </div>
          {custoSubiu && (
            <p className="text-[9px] text-destructive mt-0.5">Acima da média!</p>
          )}
        </div>

        <div className="rounded-md border border-border bg-secondary/30 p-2">
          <p className="text-[10px] text-muted-foreground uppercase">Custo Médio</p>
          <div className="flex items-center gap-1">
            <p className="font-mono font-bold text-sm text-foreground">
              {formatCurrency(mediaPonderada)}
            </p>
            {mediaPonderada > 0 && (
              ultimoPreco > mediaPonderada
                ? <TrendingUp className="h-3 w-3 text-destructive" />
                : <TrendingDown className="h-3 w-3 text-green-500" />
            )}
          </div>
          <p className="text-[9px] text-muted-foreground mt-0.5">
            Pond. {totalQtd} un.
          </p>
        </div>
      </div>

      {expanded && (
        <div className="space-y-1 pt-1">
          <p className="text-[10px] text-muted-foreground font-medium">Últimas compras:</p>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {MOCK_HISTORICO.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded border border-border/50 bg-secondary/20 px-2 py-1.5 text-[11px]"
              >
                <div className="flex flex-col">
                  <span className="text-foreground font-medium">{c.fornecedor}</span>
                  <span className="text-muted-foreground text-[10px]">{c.data} · {c.qtd} un.</span>
                </div>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(c.unitario)}
                </span>
              </div>
            ))}
          </div>
          <Badge variant="outline" className="text-[9px] text-muted-foreground">
            Dados simulados — será alimentado pelo módulo de Compras
          </Badge>
        </div>
      )}
    </div>
  );
}
