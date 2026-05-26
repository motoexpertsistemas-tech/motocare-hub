import { useState, useEffect } from "react";
import { Download, Loader2, Package, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportarCatalogoMasterDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [totalDisponivel, setTotalDisponivel] = useState(0);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [filtroMarca, setFiltroMarca] = useState("TODAS");
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [filteredCount, setFilteredCount] = useState(0);
  const [result, setResult] = useState<{ imported: number; skipped: number; total: number } | null>(null);

  useEffect(() => {
    if (open) {
      loadCatalogStats();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      loadFilteredCount();
    }
  }, [filtroMarca, filtroCategoria, open]);

  const loadCatalogStats = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { count } = await supabase.from("catalogo_master").select("*", { count: "exact", head: true });
      setTotalDisponivel(count || 0);

      const { data: marcasData } = await supabase.from("catalogo_master").select("marca").not("marca", "is", null);
      const uniqueMarcas = [...new Set((marcasData || []).map(m => m.marca).filter(Boolean))] as string[];
      setMarcas(uniqueMarcas.sort());

      const { data: catData } = await supabase.from("catalogo_master").select("categoria").not("categoria", "is", null);
      const uniqueCats = [...new Set((catData || []).map(c => c.categoria).filter(Boolean))] as string[];
      setCategorias(uniqueCats.sort());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredCount = async () => {
    let query = supabase.from("catalogo_master").select("*", { count: "exact", head: true });
    if (filtroMarca !== "TODAS") query = query.eq("marca", filtroMarca);
    if (filtroCategoria !== "TODAS") query = query.eq("categoria", filtroCategoria);
    const { count } = await query;
    setFilteredCount(count || 0);
  };

  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("auth_user_id", userData.user.id)
        .single();

      if (!usuario) throw new Error("Empresa não encontrada");

      const activeBranch = localStorage.getItem("activeBranchId");

      const { data, error } = await supabase.rpc("importar_catalogo_master", {
        p_empresa_id: usuario.empresa_id,
        p_branch_id: activeBranch || null,
        p_marca: filtroMarca === "TODAS" ? null : filtroMarca,
        p_categoria: filtroCategoria === "TODAS" ? null : filtroCategoria,
      });

      if (error) throw error;

      const res = data as any;
      setResult(res);

      toast({
        title: "Importação concluída!",
        description: `${res.imported} produtos importados, ${res.skipped} já existentes.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro na importação",
        description: err.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Importar Catálogo Pré-Cadastrado
          </DialogTitle>
          <DialogDescription>
            Importe produtos do catálogo master para o seu estoque. Produtos duplicados serão ignorados.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : totalDisponivel === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Package className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Nenhum produto disponível no catálogo master ainda.
            </p>
            <p className="text-xs text-muted-foreground">
              O catálogo será populado pelas importações de fornecedores (CPL, Sportive, Vipal, etc.)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="text-base px-3 py-1">
                {totalDisponivel.toLocaleString("pt-BR")}
              </Badge>
              <span className="text-muted-foreground">produtos disponíveis no catálogo</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Marca
                </label>
                <Select value={filtroMarca} onValueChange={setFiltroMarca}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todas as marcas</SelectItem>
                    {marcas.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Categoria
                </label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todas as categorias</SelectItem>
                    {categorias.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg bg-secondary/30 p-3 text-center">
              <span className="text-2xl font-bold text-foreground">{filteredCount.toLocaleString("pt-BR")}</span>
              <p className="text-xs text-muted-foreground mt-1">produtos serão importados</p>
            </div>

            {result && (
              <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-1">
                <p className="text-sm font-medium text-foreground">Resultado da importação:</p>
                <p className="text-xs text-muted-foreground">
                  ✅ {result.imported} importados • ⏭️ {result.skipped} já existentes
                </p>
              </div>
            )}

            {importing && (
              <div className="space-y-2">
                <Progress className="h-2" />
                <p className="text-xs text-muted-foreground text-center">Importando produtos...</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Fechar
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || totalDisponivel === 0 || filteredCount === 0}
            className="gap-2"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Importar {filteredCount > 0 ? filteredCount.toLocaleString("pt-BR") : ""} Produtos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
