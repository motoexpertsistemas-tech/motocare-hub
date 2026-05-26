import { useState, useCallback } from "react";
import { ImageIcon, Loader2, CheckCircle2, AlertCircle, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BatchResult {
  url: string;
  title?: string;
  matched?: boolean;
  count?: number;
  samples?: string[];
  reason?: string;
  error?: string;
}

export function FetchSportiveImagesDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "mapping" | "scraping" | "done" | "error">("idle");
  const [allUrls, setAllUrls] = useState<string[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalUpdated, setTotalUpdated] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const BATCH_SIZE = 5;

  const startProcess = useCallback(async () => {
    setIsRunning(true);
    setStatus("mapping");
    setResults([]);
    setProcessedCount(0);
    setTotalUpdated(0);

    try {
      // Step 1: Map all product URLs
      const { data: mapData, error: mapError } = await supabase.functions.invoke("fetch-sportive-images", {
        body: { action: "map" },
      });

      if (mapError) throw mapError;
      if (!mapData?.urls || mapData.urls.length === 0) {
        toast({ title: "Nenhuma URL encontrada", variant: "destructive" });
        setStatus("error");
        setIsRunning(false);
        return;
      }

      const urls = mapData.urls as string[];
      setAllUrls(urls);
      setStatus("scraping");

      // Step 2: Process in batches
      let totalUp = 0;
      let lastRemaining = 0;
      const allResults: BatchResult[] = [];

      for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const batch = urls.slice(i, i + BATCH_SIZE);

        const { data, error } = await supabase.functions.invoke("fetch-sportive-images", {
          body: { action: "batch_scrape", urls: batch },
        });

        if (error) {
          console.error("Batch error:", error);
          continue;
        }

        totalUp += data.total_updated || 0;
        lastRemaining = data.remaining || 0;
        const batchResults = data.results || [];
        allResults.push(...batchResults);

        setProcessedCount(i + batch.length);
        setTotalUpdated(totalUp);
        setRemaining(lastRemaining);
        setResults([...allResults]);

        // Small delay between batches
        await new Promise((r) => setTimeout(r, 200));
      }

      setStatus("done");
      toast({
        title: "Busca concluída!",
        description: `${totalUp} produtos atualizados com fotos.`,
      });
    } catch (err) {
      console.error("Error:", err);
      setStatus("error");
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  }, [toast]);

  const progress = allUrls.length > 0 ? (processedCount / allUrls.length) * 100 : 0;
  const matchedCount = results.filter((r) => r.matched).length;
  const unmatchedCount = results.filter((r) => !r.matched && !r.error).length;

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" />
            Buscar Fotos Sportive
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isRunning}>
            ✕
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Busca automática de fotos no site sportive.com.br para os produtos importados
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "idle" && (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Este processo irá mapear o site da Sportive, fazer scrape das páginas de produto e
              associar as fotos aos produtos do catálogo automaticamente.
            </p>
            <p className="text-xs text-muted-foreground/80">
              ⚠️ Pode levar vários minutos dependendo da quantidade de produtos.
            </p>
          </div>
        )}

        {(status === "mapping" || status === "scraping") && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">
                {status === "mapping" ? "Mapeando site..." : `Processando ${processedCount}/${allUrls.length} URLs...`}
              </span>
            </div>
            {status === "scraping" && (
              <>
                <Progress value={progress} className="h-2" />
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span>✅ Casados: {matchedCount}</span>
                  <span>❌ Sem match: {unmatchedCount}</span>
                  <span>📸 Atualizados: {totalUpdated}</span>
                </div>
              </>
            )}

            {results.length > 0 && (
              <ScrollArea className="h-32 rounded border border-border/50 bg-secondary/20 p-2">
                <div className="space-y-1">
                  {results.slice(-10).reverse().map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px]">
                      {r.matched ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                      <span className="truncate">
                        {r.title || r.url.split("/").pop()}{" "}
                        {r.matched && r.count ? `(${r.count} produtos)` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {status === "done" && (
          <div className="space-y-3 rounded-lg border border-border/50 bg-secondary/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              Busca concluída!
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>URLs processadas: {processedCount}</span>
              <span>Páginas com match: {matchedCount}</span>
              <span>Produtos atualizados: {totalUpdated}</span>
              <span>Restam sem foto: {remaining}</span>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 text-sm text-destructive py-4">
            <AlertCircle className="h-4 w-4" />
            Falha na busca. Tente novamente.
          </div>
        )}

        <Button
          onClick={status === "done" || status === "error" ? (status === "error" ? startProcess : onClose) : startProcess}
          disabled={isRunning}
          className="w-full gradient-primary text-primary-foreground gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : status === "done" ? (
            "Fechar"
          ) : status === "error" ? (
            <>
              <RotateCcw className="h-4 w-4" />
              Tentar Novamente
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Iniciar Busca de Fotos
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
