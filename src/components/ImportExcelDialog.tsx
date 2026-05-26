import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ImportExcelDialogProps {
  onClose: () => void;
}

interface ParsedProduct {
  codigo_cpl: string;
  nome: string;
  codigo_fornecedor: string | null;
  marca: string | null;
  unidade: string | null;
  aplicacoes: string[] | null;
  cor: string | null;
  preco_custo: number | null;
  categoria: string | null;
}

const CATEGORIAS_MAP: Record<string, string> = {
  "ABA": "CAREN-PLÁSTICO",
  "CARENAGEM": "CAREN-PLÁSTICO",
  "TAMPA": "CAREN-PLÁSTICO",
  "LATERAL": "CAREN-PLÁSTICO",
  "PARALAMA": "CAREN-PLÁSTICO",
  "TANQUE": "CAREN-PLÁSTICO",
  "PAINEL": "CAREN-PLÁSTICO",
  "RABETA": "CAREN-PLÁSTICO",
  "BICO": "CAREN-PLÁSTICO",
  "PROTETOR": "CAREN-PLÁSTICO",
  "CABO": "CABOS",
  "CHICOTE": "ELÉTRICA",
  "BOBINA": "ELÉTRICA",
  "CHAVE": "ELÉTRICA",
  "RELE": "ELÉTRICA",
  "LAMPADA": "ELÉTRICA",
  "FAROL": "ELÉTRICA",
  "LANTERNA": "ELÉTRICA",
  "PISCA": "ELÉTRICA",
  "CDI": "ELÉTRICA",
  "REGULADOR": "ELÉTRICA",
  "MOTOR": "MOTOR",
  "PISTAO": "MOTOR",
  "CILINDRO": "MOTOR",
  "JUNTA": "MOTOR",
  "BIELA": "MOTOR",
  "VALVULA": "MOTOR",
  "VIRABREQUIM": "MOTOR",
  "ANEL": "MOTOR",
  "CORRENTE": "TRANSMISSÃO",
  "COROA": "TRANSMISSÃO",
  "PINHAO": "TRANSMISSÃO",
  "ENGRENAGEM": "TRANSMISSÃO",
  "RELACAO": "TRANSMISSÃO",
  "KIT RELACAO": "TRANSMISSÃO",
  "AMORTECEDOR": "SUSPENSÃO",
  "BENGALA": "SUSPENSÃO",
  "MOLA": "SUSPENSÃO",
  "BIELETA": "SUSPENSÃO",
  "RODA": "RODA",
  "RAIO": "RODA",
  "CUBO": "RODA",
  "ROLAMENTO": "RODA",
  "PNEU": "PNEU",
  "CAMARA": "PNEU",
  "PARAFUSO": "FIXAÇÃO",
  "PORCA": "FIXAÇÃO",
  "ARRUELA": "FIXAÇÃO",
  "PEDAL": "CHASSI",
  "MANETE": "CHASSI",
  "GUIDAO": "CHASSI",
  "SUPORTE": "CHASSI",
  "BAGAGEIRO": "CHASSI",
  "DESCANSO": "CHASSI",
  "PEDALEIRA": "CHASSI",
  "ESTRIBO": "CHASSI",
  "RETROVISOR": "ACESSÓRIOS",
  "CAPACETE": "ACESSÓRIOS",
  "CADEADO": "ACESSÓRIOS",
  "CARBURADOR": "CARB-INJEÇÃO",
  "BICO INJETOR": "CARB-INJEÇÃO",
  "CORPO INJECAO": "CARB-INJEÇÃO",
  "FERRAMENTA": "FERRA - EQUIP",
  "CHAVE COMB": "FERRA - EQUIP",
};

function detectCategoria(nome: string): string | null {
  const upper = nome.toUpperCase();
  // Check longer keys first for better matching
  const sortedKeys = Object.keys(CATEGORIAS_MAP).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeys) {
    if (upper.includes(keyword)) {
      return CATEGORIAS_MAP[keyword];
    }
  }
  return "SEM CATEGORIA";
}

export function ImportExcelDialog({ onClose }: ImportExcelDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ inserted: number; updated: number; errors: number } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet);

      const products: ParsedProduct[] = rows
        .filter((row: any) => row["Nome do Produto*"] || row["Nome do Produto"])
        .map((row: any) => {
          const nome = (row["Nome do Produto*"] || row["Nome do Produto"] || "").toString().trim().toUpperCase();
          const codigo = (row["Código*"] || row["Código"] || row["Codigo*"] || row["Codigo"] || "").toString().trim().toUpperCase();
          const codFornecedor = (row["Cód. Fornecedor*"] || row["Cód. Fornecedor"] || row["Cod. Fornecedor"] || "").toString().trim() || null;
          const marca = (row["Marca*"] || row["Marca"] || "").toString().trim().toUpperCase() || null;
          const unidade = (row["Unidade*"] || row["Unidade"] || "UN").toString().trim().toUpperCase();
          const aplicacoes = (row["Aplicações*"] || row["Aplicações"] || row["Aplicacoes"] || "").toString().trim();
          const cor = (row["Cor*"] || row["Cor"] || "").toString().trim().toUpperCase() || null;
          const custoRaw = row["Valor de Custo*"] || row["Valor de Custo"] || row["Custo"] || 0;
          const precoCusto = typeof custoRaw === "number" ? custoRaw : parseFloat(String(custoRaw).replace(",", ".")) || 0;

          return {
            codigo_cpl: codigo,
            nome,
            codigo_fornecedor: codFornecedor,
            marca,
            unidade,
            aplicacoes: aplicacoes ? [aplicacoes.toUpperCase()] : null,
            cor: cor === "N/A" ? null : cor,
            preco_custo: precoCusto,
            categoria: detectCategoria(nome),
          };
        });

      setParsedProducts(products);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (parsedProducts.length === 0) return;
    setImporting(true);
    setProgress(0);

    let inserted = 0;
    let updated = 0;
    let errors = 0;
    const chunkSize = 50;

    for (let i = 0; i < parsedProducts.length; i += chunkSize) {
      const chunk = parsedProducts.slice(i, i + chunkSize);
      const rows = chunk.map((p) => ({
        codigo_cpl: p.codigo_cpl,
        nome: p.nome,
        codigo_fornecedor: p.codigo_fornecedor,
        marca: p.marca,
        unidade: p.unidade,
        aplicacoes: p.aplicacoes,
        cor: p.cor,
        preco_custo: p.preco_custo,
        categoria: p.categoria,
      }));

      const { data, error } = await supabase
        .from("produtos_catalogo")
        .upsert(rows as any, { onConflict: "codigo_cpl", ignoreDuplicates: false })
        .select("id");

      if (error) {
        console.error("Import chunk error:", error);
        errors += chunk.length;
      } else {
        inserted += data?.length || 0;
      }

      setProgress(Math.round(((i + chunk.length) / parsedProducts.length) * 100));
    }

    setResult({ inserted, updated, errors });
    setImporting(false);
    queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
    toast.success(`Importação concluída! ${inserted} produtos importados.`);
  };

  const categoriasPreview = parsedProducts.reduce<Record<string, number>>((acc, p) => {
    const cat = p.categoria || "SEM CATEGORIA";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Planilha Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File selection */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileSelect}
            />
            {fileName ? (
              <div className="space-y-2">
                <FileSpreadsheet className="h-10 w-10 mx-auto text-primary" />
                <p className="text-sm font-medium text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground">{parsedProducts.length} produtos encontrados</p>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Trocar arquivo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Arraste um arquivo ou clique para selecionar</p>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Selecionar Arquivo
                </Button>
              </div>
            )}
          </div>

          {/* Preview */}
          {parsedProducts.length > 0 && !result && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Categorias detectadas automaticamente:</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(categoriasPreview).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                    <Badge key={cat} variant="secondary" className="text-xs">
                      {cat} ({count})
                    </Badge>
                  ))}
                </div>
              </div>

              <ScrollArea className="h-48 border rounded-md">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr>
                      <th className="text-left p-2 font-medium text-muted-foreground">Código</th>
                      <th className="text-left p-2 font-medium text-muted-foreground">Nome</th>
                      <th className="text-left p-2 font-medium text-muted-foreground">Cód. Forn.</th>
                      <th className="text-left p-2 font-medium text-muted-foreground">Marca</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">Custo</th>
                      <th className="text-left p-2 font-medium text-muted-foreground">Categoria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedProducts.slice(0, 50).map((p, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="p-2 font-mono">{p.codigo_cpl}</td>
                        <td className="p-2 max-w-[200px] truncate">{p.nome}</td>
                        <td className="p-2 font-mono">{p.codigo_fornecedor || "-"}</td>
                        <td className="p-2">{p.marca || "-"}</td>
                        <td className="p-2 text-right">
                          {p.preco_custo ? `R$ ${p.preco_custo.toFixed(2).replace(".", ",")}` : "-"}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-[10px]">{p.categoria}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedProducts.length > 50 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    ... e mais {parsedProducts.length - 50} produtos
                  </p>
                )}
              </ScrollArea>
            </>
          )}

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-foreground">Importando... {progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-foreground">Importação concluída!</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>✅ {result.inserted} produtos importados/atualizados</p>
                {result.errors > 0 && <p>❌ {result.errors} erros</p>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Fechar</Button>
            {parsedProducts.length > 0 && !result && (
              <Button onClick={handleImport} disabled={importing} className="gap-1.5">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Importar {parsedProducts.length} produtos
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
