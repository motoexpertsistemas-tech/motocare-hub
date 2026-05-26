import { useState } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VIPAL_PRODUCTS = [
  { slug: "st200", nome: "ST200", linha: "STREET" },
  { slug: "st300", nome: "ST300", linha: "STREET" },
  { slug: "st400", nome: "ST400", linha: "STREET" },
  { slug: "st500", nome: "ST500", linha: "STREET" },
  { slug: "st500-scooter", nome: "ST500 SCOOTER", linha: "STREET" },
  { slug: "st600", nome: "ST600", linha: "STREET" },
  { slug: "tr300", nome: "TR300", linha: "TRAIL" },
  { slug: "tr350", nome: "TR350", linha: "TRAIL" },
  { slug: "tr400", nome: "TR400", linha: "TRAIL" },
  { slug: "cx200", nome: "CX200", linha: "CROSS" },
  { slug: "cx300", nome: "CX300", linha: "CROSS" },
];

interface ImportStatus {
  slug: string;
  nome: string;
  linha: string;
  status: "pending" | "loading" | "done" | "error";
  products: number;
}

export function ImportVipalDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [statuses, setStatuses] = useState<ImportStatus[]>(
    VIPAL_PRODUCTS.map((p) => ({ slug: p.slug, nome: p.nome, linha: p.linha, status: "pending", products: 0 }))
  );

  const totalProducts = statuses.reduce((s, c) => s + c.products, 0);
  const doneCount = statuses.filter((s) => s.status === "done").length;
  const progress = VIPAL_PRODUCTS.length > 0 ? (doneCount / VIPAL_PRODUCTS.length) * 100 : 0;

  const scrapeProduct = async (slug: string, index: number) => {
    setStatuses((prev) => prev.map((s, i) => (i === index ? { ...s, status: "loading" } : s)));

    try {
      const { data, error } = await supabase.functions.invoke("import-vipal-catalog", {
        body: { slug },
      });

      if (error) throw error;

      setStatuses((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, status: "done", products: data.products_inserted || 0 } : s
        )
      );
    } catch (err) {
      console.error(`Error importing ${slug}:`, err);
      setStatuses((prev) =>
        prev.map((s, i) => (i === index ? { ...s, status: "error" } : s))
      );
    }
  };

  const startImport = async () => {
    setIsRunning(true);

    for (let i = 0; i < VIPAL_PRODUCTS.length; i++) {
      await scrapeProduct(VIPAL_PRODUCTS[i].slug, i);
    }

    setIsRunning(false);
    toast({
      title: "Importação Vipal concluída!",
      description: `${totalProducts} pneus importados do catálogo Vipal.`,
    });
  };

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-primary" />
            Importar Catálogo Vipal Borrachas
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isRunning}>
            ✕
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Importa pneus de moto com especificações e aplicações do site Vipal via Firecrawl
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRunning && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{doneCount} de {VIPAL_PRODUCTS.length} produtos</span>
              <span>{totalProducts} pneus</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-auto">
          {statuses.map((s) => (
            <div
              key={s.slug}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2 text-xs"
            >
              {s.status === "pending" && <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
              {s.status === "loading" && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              {s.status === "done" && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
              {s.status === "error" && <AlertCircle className="h-3 w-3 text-destructive" />}
              <div className="flex-1 truncate">
                <span className="font-medium">{s.nome}</span>
                <span className="text-muted-foreground ml-1">({s.linha})</span>
              </div>
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
              Iniciar Importação Vipal
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
