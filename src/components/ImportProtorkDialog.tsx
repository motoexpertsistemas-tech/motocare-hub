import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download } from "lucide-react";

const COLORS = [
  { key: "AMARELO", suffix: "AM" },
  { key: "AZUL", suffix: "AZ" },
  { key: "BRANCO", suffix: "BC" },
  { key: "VERMELHO", suffix: "VM" },
  { key: "PRETO", suffix: "PT" },
  { key: "PRATA", suffix: "PR" },
  { key: "ROSA", suffix: "RS" },
  { key: "PINK", suffix: "PK" },
  { key: "LARANJA", suffix: "LJ" },
  { key: "VERDE", suffix: "VD" },
  { key: "CINZA", suffix: "CZ" },
  { key: "GRAFITE", suffix: "GF" },
  { key: "DOURADO", suffix: "DR" },
];

const CATEGORIAS = [
  "ACESSÓRIOS", "CABOS", "CARB-INJEÇÃO", "CAREN-PLÁSTICO",
  "CHASSI", "ELÉTRICA", "FERRA - EQUIP", "FIXAÇÃO",
  "MOTOR", "PNEU", "RODA", "SUSPENSÃO", "TRANSMISSÃO",
];

interface Props {
  onClose: () => void;
}

export function ImportProtorkDialog({ onClose }: Props) {
  const [url, setUrl] = useState("");
  const [baseCode, setBaseCode] = useState("CAP-");
  const [categoria, setCategoria] = useState("ACESSÓRIOS");
  const [selectedColors, setSelectedColors] = useState<string[]>(["AMARELO", "AZUL", "BRANCO", "VERMELHO", "PRETO", "PRATA", "ROSA"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error("Informe a URL da página do produto");
      return;
    }
    if (!baseCode.trim()) {
      toast.error("Informe o código base (ex: CAP-488)");
      return;
    }
    if (selectedColors.length === 0) {
      toast.error("Selecione pelo menos uma cor");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("import-protork-catalog", {
        body: {
          url: url.trim(),
          base_code: baseCode.trim().toUpperCase(),
          colors: selectedColors,
          categoria,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
      toast.success(`${data.products_created} produtos importados com sucesso!`);
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Falha na importação"));
    } finally {
      setLoading(false);
    }
  };

  // Preview codes
  const previewCodes = selectedColors.map((c) => {
    const suffix = COLORS.find((cl) => cl.key === c)?.suffix || c.substring(0, 2);
    return `${baseCode.toUpperCase()}${suffix}`;
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Importar Pro Tork
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>URL da página do produto</Label>
            <Input
              placeholder="https://www.protork.com.br/product-page/capacete-new-liberty-three"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <Label>Código base (prefixo)</Label>
            <Input
              placeholder="CAP-488"
              value={baseCode}
              onChange={(e) => setBaseCode(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              O sistema adicionará o sufixo da cor automaticamente (ex: CAP-488AM, CAP-488AZ)
            </p>
          </div>

          <div>
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Cores para gerar variantes</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {COLORS.map((color) => (
                <label key={color.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedColors.includes(color.key)}
                    onCheckedChange={() => toggleColor(color.key)}
                  />
                  <span>{color.key}</span>
                  <span className="text-muted-foreground font-mono text-xs">({color.suffix})</span>
                </label>
              ))}
            </div>
          </div>

          {previewCodes.length > 0 && baseCode.length > 1 && (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-semibold mb-1">Códigos que serão gerados:</p>
              <div className="flex flex-wrap gap-1.5">
                {previewCodes.map((code) => (
                  <span key={code} className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleImport} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Importar {selectedColors.length} variantes
              </>
            )}
          </Button>

          {result && (
            <div className="rounded-md border p-3 text-sm space-y-1">
              <p className="font-semibold text-green-600">✅ Importação concluída</p>
              <p>Produto: <strong>{result.product_name}</strong></p>
              <p>Imagens encontradas: {result.images_found}</p>
              <p>Produtos criados: {result.products_created}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {result.codes?.map((code: string) => (
                  <span key={code} className="text-xs font-mono bg-green-500/10 text-green-700 px-2 py-0.5 rounded">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
