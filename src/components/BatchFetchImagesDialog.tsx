import { useState, useRef } from "react";
import { ImageIcon, Loader2, CheckCircle2, AlertCircle, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BATCH_SIZE = 5;

export function BatchFetchImagesDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalFound, setTotalFound] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [currentBatch, setCurrentBatch] = useState(0);
  const stopRef = useRef(false);

  const progress = remaining !== null && remaining + totalProcessed > 0
    ? (totalProcessed / (remaining + totalProcessed)) * 100
    : 0;

  const startFetch = async () => {
    setIsRunning(true);
    stopRef.current = false;
    let offset = 0;

    while (!stopRef.current) {
      setCurrentBatch(b => b + 1);

      try {
        const { data, error } = await supabase.functions.invoke("batch-fetch-images", {
          body: { batch_size: BATCH_SIZE, offset: 0 }, // always offset 0 since processed ones get images
        });

        if (error) {
          console.error("Batch error:", error);
          toast({ title: "Erro no lote", description: error.message, variant: "destructive" });
          break;
        }

        setTotalProcessed(prev => prev + (data.processed || 0));
        setTotalFound(prev => prev + (data.found || 0));
        setRemaining(data.remaining || 0);

        if (data.processed === 0 || data.remaining === 0) {
          toast({ title: "Concluído!", description: `Busca finalizada. ${totalFound + (data.found || 0)} fotos encontradas.` });
          break;
        }

        // Small delay between batches
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.error("Fetch error:", err);
        break;
      }
    }

    setIsRunning(false);
  };

  const stopFetch = () => {
    stopRef.current = true;
  };

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" />
            Buscar Fotos em Lote
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isRunning}>
            ✕
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Busca automática de fotos para todos os produtos sem imagem via Google Images + Firecrawl
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-center">
            <p className="text-xs text-muted-foreground">Processados</p>
            <p className="text-lg font-bold text-foreground">{totalProcessed}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-center">
            <p className="text-xs text-muted-foreground">Fotos encontradas</p>
            <p className="text-lg font-bold text-green-500">{totalFound}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-center">
            <p className="text-xs text-muted-foreground">Restantes</p>
            <p className="text-lg font-bold text-foreground">{remaining ?? "—"}</p>
          </div>
        </div>

        {(isRunning || totalProcessed > 0) && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Lote #{currentBatch} ({BATCH_SIZE} por lote)</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Buscando fotos... Cada produto leva ~3-5 segundos
          </div>
        )}

        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              onClick={startFetch}
              className="flex-1 gradient-primary text-primary-foreground gap-2"
            >
              <Play className="h-4 w-4" />
              {totalProcessed > 0 ? "Continuar Busca" : "Iniciar Busca de Fotos"}
            </Button>
          ) : (
            <Button
              onClick={stopFetch}
              variant="destructive"
              className="flex-1 gap-2"
            >
              <Pause className="h-4 w-4" />
              Pausar
            </Button>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          ⚠️ Cada lote consome créditos do Firecrawl. Você pode pausar e continuar a qualquer momento.
        </p>
      </CardContent>
    </Card>
  );
}
