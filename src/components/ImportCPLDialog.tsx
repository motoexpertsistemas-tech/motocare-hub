import { useState } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useBranch } from "@/contexts/BranchContext";

const CATEGORIES = [
  "ACESSÓRIOS", "CABOS", "CARBURADOR/INJEÇÃO", "CARENAGEM/PLÁSTICO",
  "CHASSI", "ELÉTRICA", "FERRAMENTA/EQUIPAMENTOS", "FIXAÇÃO",
  "MOTOR", "RODA", "SUSPENSÃO", "TRANSMISSÃO",
];

interface ImportStatus {
  categoria: string;
  status: "pending" | "loading" | "done" | "error";
  products: number;
  pages: number;
}

export function ImportCPLDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const { empresaId } = useEmpresa();
  const { activeBranch } = useBranch();
  const [isRunning, setIsRunning] = useState(false);
  const [statuses, setStatuses] = useState<ImportStatus[]>(
    CATEGORIES.map((c) => ({ categoria: c, status: "pending", products: 0, pages: 0 }))
  );

  const totalProducts = statuses.reduce((s, c) => s + c.products, 0);
  const doneCount = statuses.filter((s) => s.status === "done").length;
  const progress = CATEGORIES.length > 0 ? (doneCount / CATEGORIES.length) * 100 : 0;

  const scrapeCategory = async (categoria: string, index: number) => {
    setStatuses((prev) => prev.map((s, i) => (i === index ? { ...s, status: "loading" } : s)));

    let page = 1;
    let totalProducts = 0;
    let hasMore = true;

    try {
      while (hasMore) {
        const { data, error } = await supabase.functions.invoke("scrape-cpl-catalog", {
          body: { categoria, page, empresa_id: empresaId, branch_id: activeBranch?.id ?? null },
        });

        if (error) throw error;

        totalProducts += data.products_found || 0;
        hasMore = data.has_more && page < 50; // Safety limit
        page++;

        setStatuses((prev) =>
          prev.map((s, i) =>
            i === index ? { ...s, products: totalProducts, pages: page - 1 } : s
          )
        );
      }

      setStatuses((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, status: "done", products: totalProducts, pages: page - 1 } : s
        )
      );
    } catch (err) {
      console.error(`Error scraping ${categoria}:`, err);
      setStatuses((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, status: "error", products: totalProducts, pages: page - 1 } : s
        )
      );
    }
  };

  const startImport = async () => {
    if (!empresaId) {
      toast({ title: "Empresa não identificada", description: "Faça login novamente.", variant: "destructive" });
      return;
    }
    setIsRunning(true);
    // Process categories sequentially to avoid rate limits
    for (let i = 0; i < CATEGORIES.length; i++) {
      await scrapeCategory(CATEGORIES[i], i);
    }

    setIsRunning(false);
    toast({
      title: "Importação concluída!",
      description: `${totalProducts} produtos importados do catálogo CPL.`,
    });
  };

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-primary" />
            Importar Catálogo CPL Motoparts
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isRunning}>
            ✕
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Importa produtos com aplicações do catálogo digital CPL via Firecrawl
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRunning && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{doneCount} de {CATEGORIES.length} categorias</span>
              <span>{totalProducts} produtos</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-auto">
          {statuses.map((s) => (
            <div
              key={s.categoria}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2 text-xs"
            >
              {s.status === "pending" && <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
              {s.status === "loading" && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              {s.status === "done" && <CheckCircle2 className="h-3 w-3 text-success" />}
              {s.status === "error" && <AlertCircle className="h-3 w-3 text-destructive" />}
              <span className="flex-1 truncate">{s.categoria}</span>
              {s.products > 0 && (
                <Badge variant="outline" className="text-[9px] px-1.5">
                  {s.products}
                </Badge>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={startImport}
          disabled={isRunning}
          className="w-full gradient-primary text-primary-foreground gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Iniciar Importação
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
