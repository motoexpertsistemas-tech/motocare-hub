import { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ncmCestData from "@/data/ncm_cest_catalogo.json";

interface NcmCestRecord {
  cest: string;
  ncm: string;
  descricao: string;
  mva: number | null;
}

interface NcmCestSearchProps {
  onSelect: (rec: { ncm: string; cest: string; mva: number | null; descricao: string }) => void;
}

const DATA = ncmCestData as NcmCestRecord[];

export function NcmCestSearch({ onSelect }: NcmCestSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DATA.slice(0, 50);
    const terms = q.split(/\s+/).filter(Boolean);
    return DATA.filter((r) => {
      const hay = `${r.cest} ${r.ncm} ${r.descricao}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    }).slice(0, 100);
  }, [query]);

  const handleSelect = (rec: NcmCestRecord) => {
    // Pegar a primeira NCM se vier "2201.1 e 2201.9"
    const firstNcm = (rec.ncm || "").split(/\s+(?:e|\/|,)\s+/i)[0].trim();
    onSelect({
      ncm: firstNcm,
      cest: rec.cest,
      mva: rec.mva,
      descricao: rec.descricao,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Search className="h-3.5 w-3.5" /> Buscar NCM/CEST
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col bg-popover border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Search className="h-4 w-4" /> Catálogo NCM / CEST (RICMS BA 2026)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 flex-1 min-h-0 flex flex-col">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite a descrição, NCM ou CEST (ex: óleo, refrigerante, peças, 03.003)..."
            className="bg-secondary/50"
          />

          <p className="text-xs text-muted-foreground">
            {results.length} resultado{results.length !== 1 ? "s" : ""} de {DATA.length} no catálogo.
          </p>

          <div className="flex-1 overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 sticky top-0">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">CEST</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">NCM</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Descrição</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-20">MVA</th>
                  <th className="px-3 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((rec) => (
                  <tr
                    key={rec.cest}
                    className="border-b border-border/40 hover:bg-secondary/20 cursor-pointer"
                    onClick={() => handleSelect(rec)}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-foreground">{rec.cest}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{rec.ncm || "—"}</td>
                    <td className="px-3 py-2 text-xs text-foreground">{rec.descricao}</td>
                    <td className="px-3 py-2 text-center text-xs">
                      {rec.mva !== null ? (
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {rec.mva}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-primary hover:bg-primary/10">
                        <Check className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-xs text-muted-foreground">
                      Nenhum resultado. Tente outros termos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
