import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEmpresa } from "@/contexts/EmpresaContext";
import * as XLSX from "xlsx";

interface ImportServicosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function normalizeHeader(h: any): string {
  if (!h) return "";
  return String(h).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function parseNumericValue(value: any): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  let cleaned = String(value).replace(/\s/g, "").replace(/[R$]/g, "");
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  if (lastComma > lastDot) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    cleaned = cleaned.replace(/,/g, "");
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function detectColumns(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const normalized = headers.map(normalizeHeader);

  normalized.forEach((h, i) => {
    if (!map.codigo && (h.includes("codigo") || h === "cod" || h === "cod.")) map.codigo = i;
    if (!map.nome && (h.includes("nome") || h.includes("servico") || h.includes("descricao do servico"))) map.nome = i;
    if (!map.valor_custo && (h.includes("custo") || h.includes("valor de custo"))) map.valor_custo = i;
    if (!map.valor_venda && (h.includes("venda") || h.includes("valor de venda") || h.includes("preco") || h.includes("valor"))) {
      // Avoid matching "custo" again
      if (!h.includes("custo")) map.valor_venda = i;
    }
  });

  return map;
}

export default function ImportServicosDialog({ open, onOpenChange }: ImportServicosDialogProps) {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [colMap, setColMap] = useState<Record<string, number>>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [totalRows, setTotalRows] = useState(0);

  const reset = () => {
    setFile(null);
    setPreview([]);
    setColMap({});
    setHeaders([]);
    setTotalRows(0);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Find header row (first row with 3+ non-empty cells)
        let headerIdx = 0;
        for (let i = 0; i < Math.min(10, json.length); i++) {
          const nonEmpty = (json[i] || []).filter((c: any) => c !== null && c !== undefined && String(c).trim() !== "").length;
          if (nonEmpty >= 3) { headerIdx = i; break; }
        }

        const hdrs = (json[headerIdx] || []).map((c: any) => String(c || "").trim());
        const rows = json.slice(headerIdx + 1).filter((r: any[]) => r.some((c: any) => c !== null && c !== undefined && String(c).trim() !== ""));

        setHeaders(hdrs);
        setTotalRows(rows.length);
        setPreview(rows.slice(0, 5));
        setColMap(detectColumns(hdrs));
      } catch {
        toast.error("Erro ao ler o arquivo");
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = async () => {
    if (!colMap.nome && colMap.nome !== 0) {
      toast.error("Coluna 'Nome' não foi detectada. Verifique o arquivo.");
      return;
    }

    setImporting(true);
    try {
      const reader = new FileReader();
      const result = await new Promise<any[][]>((resolve) => {
        reader.onload = (ev) => {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
          let headerIdx = 0;
          for (let i = 0; i < Math.min(10, json.length); i++) {
            const nonEmpty = (json[i] || []).filter((c: any) => c !== null && c !== undefined && String(c).trim() !== "").length;
            if (nonEmpty >= 3) { headerIdx = i; break; }
          }
          resolve(json.slice(headerIdx + 1).filter((r: any[]) => r.some((c: any) => c !== null && c !== undefined && String(c).trim() !== "")));
        };
        reader.readAsArrayBuffer(file!);
      });

      const records = result.map((row) => {
        const nome = String(row[colMap.nome] || "").trim().toUpperCase();
        const codigo = colMap.codigo !== undefined ? String(row[colMap.codigo] || "").trim() : "";
        const valor_custo = colMap.valor_custo !== undefined ? parseNumericValue(row[colMap.valor_custo]) : 0;
        const valor_venda = colMap.valor_venda !== undefined ? parseNumericValue(row[colMap.valor_venda]) : 0;
        return { nome, codigo_interno: codigo, valor_custo, valor_venda, comissao: 0, empresa_id: empresaId };
      }).filter((r) => r.nome.length > 0);

      if (records.length === 0) {
        toast.error("Nenhum registro válido encontrado");
        setImporting(false);
        return;
      }

      let inserted = 0;
      let errors = 0;
      const chunkSize = 50;

      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const { error } = await supabase.from("servicos" as any).insert(chunk);
        if (error) {
          // Try individual inserts
          for (const rec of chunk) {
            const { error: e2 } = await supabase.from("servicos" as any).insert(rec);
            if (e2) errors++;
            else inserted++;
          }
        } else {
          inserted += chunk.length;
        }
      }

      qc.invalidateQueries({ queryKey: ["servicos"] });
      if (errors > 0) {
        toast.warning(`Importados ${inserted} serviços. ${errors} erros (possíveis duplicados).`);
      } else {
        toast.success(`${inserted} serviços importados com sucesso!`);
      }
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro na importação: " + (err?.message || "Tente novamente"));
    }
    setImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!importing) { if (!v) reset(); onOpenChange(v); } }}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Serviços (Excel / CSV)
          </DialogTitle>
        </DialogHeader>

        {!file ? (
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Clique para selecionar ou arraste um arquivo</p>
            <p className="text-xs text-muted-foreground mt-1">Formatos: .xlsx, .xls, .csv</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="font-medium">{file.name}</span>
              <span className="text-muted-foreground">— {totalRows} registros encontrados</span>
              <Button variant="ghost" size="sm" onClick={reset} className="ml-auto text-xs">Trocar arquivo</Button>
            </div>

            {/* Detected columns */}
            <div className="bg-secondary/30 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground mb-1">Colunas detectadas:</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className={colMap.codigo !== undefined ? "text-primary" : "text-destructive"}>
                  {colMap.codigo !== undefined ? `✅ Código → "${headers[colMap.codigo]}"` : "❌ Código (não encontrado)"}
                </span>
                <span className={colMap.nome !== undefined ? "text-primary" : "text-destructive"}>
                  {colMap.nome !== undefined ? `✅ Nome → "${headers[colMap.nome]}"` : "❌ Nome (obrigatório!)"}
                </span>
                <span className={colMap.valor_custo !== undefined ? "text-primary" : "text-muted-foreground"}>
                  {colMap.valor_custo !== undefined ? `✅ Custo → "${headers[colMap.valor_custo]}"` : "⚠️ Custo (não encontrado, usará 0)"}
                </span>
                <span className={colMap.valor_venda !== undefined ? "text-primary" : "text-muted-foreground"}>
                  {colMap.valor_venda !== undefined ? `✅ Venda → "${headers[colMap.valor_venda]}"` : "⚠️ Venda (não encontrado, usará 0)"}
                </span>
              </div>
            </div>

            {colMap.nome === undefined && (
              <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 p-2 rounded">
                <AlertCircle className="h-4 w-4" />
                Coluna "Nome" é obrigatória. Verifique se o cabeçalho contém "Nome" ou "Serviço".
              </div>
            )}

            {/* Preview */}
            {preview.length > 0 && (
              <div className="overflow-x-auto border border-border rounded">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      {headers.map((h, i) => (
                        <th key={i} className="px-2 py-1.5 text-left font-medium text-muted-foreground">{h || `Col ${i + 1}`}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, ri) => (
                      <tr key={ri} className="border-t border-border">
                        {headers.map((_, ci) => (
                          <td key={ci} className="px-2 py-1 text-foreground">{row[ci] ?? ""}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalRows > 5 && <p className="text-[10px] text-muted-foreground p-1 text-center">Mostrando 5 de {totalRows} registros</p>}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={importing}>Cancelar</Button>
          {file && (
            <Button onClick={handleImport} disabled={importing || colMap.nome === undefined}>
              {importing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Importando...</> : `Importar ${totalRows} serviços`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
