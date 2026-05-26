import { useState, useRef } from "react";
import { Download, Loader2, CheckCircle2, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Phase = "idle" | "mapping" | "mapped" | "scraping" | "done";
type SearchPhase = "idle" | "searching" | "done";

const BATCH_SIZE = 5;

export function ImportPerereDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();

  // Catalog import state
  const [phase, setPhase] = useState<Phase>("idle");
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [totalInserted, setTotalInserted] = useState(0);
  const [totalFound, setTotalFound] = useState(0);
  const [failedSubcats, setFailedSubcats] = useState<string[]>([]);
  const cancelRef = useRef(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchPhase, setSearchPhase] = useState<SearchPhase>("idle");
  const [searchFound, setSearchFound] = useState(0);
  const [searchInserted, setSearchInserted] = useState(0);
  const [searchPages, setSearchPages] = useState(0);

  const progress = totalBatches > 0 ? (currentBatch / totalBatches) * 100 : 0;

  const startMapping = async () => {
    setPhase("mapping");
    try {
      const { data, error } = await supabase.functions.invoke("import-perere-catalog", {
        body: { action: "map" },
      });
      if (error) throw error;

      const subcats = ["", ...(data.subcategories || [])];
      setSubcategories(subcats);
      setTotalBatches(Math.ceil(subcats.length / BATCH_SIZE));
      setPhase("mapped");
      toast({ title: "Mapeamento concluído!", description: `${subcats.length} páginas encontradas, ${Math.ceil(subcats.length / BATCH_SIZE)} lotes.` });
    } catch (err) {
      console.error("Map error:", err);
      toast({ title: "Erro no mapeamento", description: "Não foi possível mapear.", variant: "destructive" });
      setPhase("idle");
    }
  };

  const startScraping = async () => {
    setPhase("scraping");
    cancelRef.current = false;
    let inserted = 0;
    let found = 0;
    const failed: string[] = [];

    const batches: string[][] = [];
    for (let i = 0; i < subcategories.length; i += BATCH_SIZE) {
      batches.push(subcategories.slice(i, i + BATCH_SIZE));
    }

    for (let b = 0; b < batches.length; b++) {
      if (cancelRef.current) break;
      setCurrentBatch(b + 1);

      try {
        const { data, error } = await supabase.functions.invoke("import-perere-catalog", {
          body: { action: "scrape_batch", subcategories: batches[b] },
        });

        if (error) {
          console.warn(`Batch ${b + 1} error:`, error);
          failed.push(...batches[b]);
          continue;
        }

        inserted += data.total_inserted || 0;
        found += data.total_found || 0;

        if (data.completed) {
          for (const r of data.completed) {
            if (r.found === 0 && r.pages === 0) {
              failed.push(r.subcategory);
            }
          }
        }
      } catch (err) {
        console.warn(`Batch ${b + 1} exception:`, err);
        failed.push(...batches[b]);
      }

      setTotalInserted(inserted);
      setTotalFound(found);
      setFailedSubcats([...failed]);
    }

    if (failed.length > 0 && !cancelRef.current) {
      const retryFailed = [...failed];
      failed.length = 0;

      for (const subcat of retryFailed) {
        if (cancelRef.current) break;
        try {
          const { data, error } = await supabase.functions.invoke("import-perere-catalog", {
            body: { action: "scrape_subcategory", subcategory: subcat },
          });
          if (!error && data) {
            inserted += data.inserted || 0;
            found += data.products_found || 0;
          } else {
            failed.push(subcat);
          }
        } catch {
          failed.push(subcat);
        }
        setTotalInserted(inserted);
        setTotalFound(found);
      }
      setFailedSubcats(failed);
    }

    setPhase("done");
    toast({
      title: "Importação Pererê concluída!",
      description: `${inserted} produtos importados de ${found} encontrados.${failed.length > 0 ? ` ${failed.length} subcategorias falharam.` : ""}`,
    });
  };

  const handleCancel = () => {
    cancelRef.current = true;
    toast({ title: "Cancelando...", description: "Aguardando o lote atual terminar." });
  };

  const startSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearchPhase("searching");
    setSearchFound(0);
    setSearchInserted(0);
    setSearchPages(0);

    try {
      const { data, error } = await supabase.functions.invoke("import-perere-catalog", {
        body: { action: "search", search_term: searchTerm.trim() },
      });
      if (error) throw error;

      setSearchFound(data.products_found || 0);
      setSearchInserted(data.inserted || 0);
      setSearchPages(data.pages_scraped || 0);
      setSearchPhase("done");
      toast({
        title: "Busca concluída!",
        description: `${data.inserted || 0} produtos importados de ${data.products_found || 0} encontrados.`,
      });
    } catch (err) {
      console.error("Search error:", err);
      toast({ title: "Erro na busca", description: "Não foi possível buscar.", variant: "destructive" });
      setSearchPhase("idle");
    }
  };

  const isBusy = phase === "mapping" || phase === "scraping" || searchPhase === "searching";

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-primary" />
            Importar Catálogo Pererê
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isBusy}>✕</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="search">
          <TabsList className="w-full">
            <TabsTrigger value="search" className="flex-1 gap-1.5" disabled={isBusy}>
              <Search className="h-3.5 w-3.5" /> Buscar
            </TabsTrigger>
            <TabsTrigger value="catalog" className="flex-1 gap-1.5" disabled={isBusy}>
              <Download className="h-3.5 w-3.5" /> Catálogo Completo
            </TabsTrigger>
          </TabsList>

          {/* SEARCH TAB */}
          <TabsContent value="search" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">
              Busque produtos por termo (ex: paralama, coroa, pneu) e importe diretamente.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: paralama, coroa, guidão..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={searchPhase === "searching"}
                onKeyDown={(e) => e.key === "Enter" && startSearch()}
              />
              <Button
                onClick={startSearch}
                disabled={searchPhase === "searching" || !searchTerm.trim()}
                className="gap-1.5 shrink-0"
              >
                {searchPhase === "searching" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </Button>
            </div>

            {searchPhase === "searching" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Buscando "{searchTerm}"...
              </div>
            )}

            {searchPhase === "done" && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-border/50 bg-secondary/20 p-2 text-center">
                    <p className="text-lg font-bold text-foreground">{searchFound}</p>
                    <p className="text-[10px] text-muted-foreground">Encontrados</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-secondary/20 p-2 text-center">
                    <p className="text-lg font-bold text-emerald-500">{searchInserted}</p>
                    <p className="text-[10px] text-muted-foreground">Importados</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-secondary/20 p-2 text-center">
                    <p className="text-lg font-bold text-foreground">{searchPages}</p>
                    <p className="text-[10px] text-muted-foreground">Páginas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm text-foreground">Concluído! {searchInserted} produtos salvos.</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* CATALOG TAB */}
          <TabsContent value="catalog" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">
              Importa todo o catálogo de moto com paginação AJAX e lotes de {BATCH_SIZE}. Usa upsert (sem duplicados).
            </p>

            {/* Phase indicators */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                {phase === "mapping" ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : subcategories.length > 0 ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />}
                <span className={subcategories.length > 0 ? "text-foreground" : "text-muted-foreground"}>1. Mapear</span>
              </div>
              <div className="h-px flex-1 bg-border" />
              <div className="flex items-center gap-1.5">
                {phase === "scraping" ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : phase === "done" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />}
                <span className={phase === "scraping" || phase === "done" ? "text-foreground" : "text-muted-foreground"}>2. Importar</span>
              </div>
            </div>

            {/* Stats grid */}
            {(totalFound > 0 || subcategories.length > 0) && (
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg border border-border/50 bg-secondary/20 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{subcategories.length}</p>
                  <p className="text-[10px] text-muted-foreground">Páginas</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-secondary/20 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{totalBatches}</p>
                  <p className="text-[10px] text-muted-foreground">Lotes</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-secondary/20 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{totalFound}</p>
                  <p className="text-[10px] text-muted-foreground">Encontrados</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-secondary/20 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-500">{totalInserted}</p>
                  <p className="text-[10px] text-muted-foreground">Importados</p>
                </div>
              </div>
            )}

            {/* Progress bar */}
            {phase === "scraping" && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Lote {currentBatch} de {totalBatches}</span>
                  <span>{totalFound} produtos</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {failedSubcats.length > 0 && phase === "done" && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <XCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-xs text-foreground">{failedSubcats.length} subcategorias falharam: {failedSubcats.slice(0, 5).join(", ")}{failedSubcats.length > 5 ? "..." : ""}</p>
              </div>
            )}

            {phase === "done" && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <p className="text-sm text-foreground">Concluído! {totalInserted} produtos salvos no catálogo.</p>
              </div>
            )}

            {/* Action buttons */}
            {phase === "idle" && (
              <Button onClick={startMapping} className="w-full gradient-primary text-primary-foreground gap-2">
                <Search className="h-4 w-4" />1. Mapear Subcategorias
              </Button>
            )}
            {phase === "mapping" && <Button disabled className="w-full gap-2"><Loader2 className="h-4 w-4 animate-spin" />Mapeando...</Button>}
            {phase === "mapped" && (
              <Button onClick={startScraping} className="w-full gradient-primary text-primary-foreground gap-2">
                <Download className="h-4 w-4" />2. Importar ({totalBatches} lotes de {BATCH_SIZE})
              </Button>
            )}
            {phase === "scraping" && (
              <div className="flex gap-2">
                <Button disabled className="flex-1 gap-2"><Loader2 className="h-4 w-4 animate-spin" />Lote {currentBatch}/{totalBatches}</Button>
                <Button variant="destructive" size="sm" onClick={handleCancel}>Cancelar</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
