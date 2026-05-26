import { useState } from "react";
import { FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  pages_processed: number;
  products_extracted: number;
  unique_products: number;
  products_inserted: number;
  errors?: string[];
}

export function ImportSportiveDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");

  const startImport = async () => {
    if (!markdown.trim()) {
      toast({ title: "Erro", description: "Cole o conteúdo do catálogo primeiro.", variant: "destructive" });
      return;
    }

    setIsRunning(true);
    setStatus("processing");

    try {
      const { data, error } = await supabase.functions.invoke("import-sportive-catalog", {
        body: { markdown },
      });

      if (error) throw error;

      setResult(data);
      setStatus("done");
      toast({
        title: "Importação concluída!",
        description: `${data.products_inserted} produtos Sportive importados.`,
      });
    } catch (err) {
      console.error("Import error:", err);
      setStatus("error");
      toast({
        title: "Erro na importação",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Importar Catálogo Sportive
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isRunning}>
            ✕
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Cole o conteúdo do catálogo Sportive (markdown) e importe para CARENAGEM/PLÁSTICO
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "idle" && (
          <Textarea
            placeholder="Cole aqui o conteúdo do catálogo Sportive em markdown..."
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={6}
            className="text-xs"
          />
        )}

        {status === "processing" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Processando catálogo com IA... Isso pode levar alguns minutos.
            </p>
            <Progress className="h-2" />
          </div>
        )}

        {status === "done" && result && (
          <div className="space-y-2 rounded-lg border border-border/50 bg-secondary/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              Importação concluída!
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>Páginas processadas: {result.pages_processed}</span>
              <span>Produtos extraídos: {result.products_extracted}</span>
              <span>Produtos únicos: {result.unique_products}</span>
              <span>Inseridos no banco: {result.products_inserted}</span>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2 text-xs text-destructive">
                <AlertCircle className="inline h-3 w-3 mr-1" />
                {result.errors.length} erros encontrados
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 text-sm text-destructive py-4">
            <AlertCircle className="h-4 w-4" />
            Falha na importação. Tente novamente.
          </div>
        )}

        <Button
          onClick={status === "done" || status === "error" ? onClose : startImport}
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
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Iniciar Importação
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
