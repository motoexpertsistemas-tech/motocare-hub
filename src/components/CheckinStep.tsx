import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, X, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Wrench, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export type ChecklistItemState = "bom" | "substituir" | "";

export interface ChecklistItem {
  label: string;
  estado: ChecklistItemState;
}

export interface ChecklistCategory {
  categoria: string;
  itens: ChecklistItem[];
}

export interface CheckinData {
  fotos: (File | string | null)[];
  checklist: ChecklistCategory[];
  observacoes_checkin: string;
}

export const CHECKLIST_INICIAL: ChecklistCategory[] = [
  {
    categoria: "CABOS",
    itens: [
      { label: "Acelerador A", estado: "" },
      { label: "Acelerador B", estado: "" },
      { label: "Embreagem", estado: "" },
      { label: "Freio", estado: "" },
      { label: "Velocímetro", estado: "" },
    ],
  },
  {
    categoria: "FREIOS",
    itens: [
      { label: "Pastilha / Patim Diant.", estado: "" },
      { label: "Pastilha / Patim Tras.", estado: "" },
      { label: "Borracha Pinça", estado: "" },
      { label: "Disco Dianteiro", estado: "" },
      { label: "Disco Traseiro", estado: "" },
      { label: "Fluido Freio", estado: "" },
    ],
  },
  {
    categoria: "TRANSMISSÃO",
    itens: [
      { label: "Coroa", estado: "" },
      { label: "Pinhão", estado: "" },
      { label: "Corrente", estado: "" },
    ],
  },
  {
    categoria: "SUSPENSÃO DIANTEIRA",
    itens: [
      { label: "Movimento", estado: "" },
      { label: "Vazamento Esq.", estado: "" },
      { label: "Vazamento Dir.", estado: "" },
      { label: "Caixa de Direção", estado: "" },
    ],
  },
  {
    categoria: "SUSPENSÃO TRASEIRA",
    itens: [
      { label: "Vazamento Esq.", estado: "" },
      { label: "Vazamento Dir.", estado: "" },
    ],
  },
  {
    categoria: "LÂMPADAS",
    itens: [
      { label: "Piscas", estado: "" },
      { label: "Farol", estado: "" },
      { label: "Lanterna Tras.", estado: "" },
      { label: "Buzina", estado: "" },
    ],
  },
  {
    categoria: "RODAS",
    itens: [
      { label: "Dianteira", estado: "" },
      { label: "Traseira", estado: "" },
    ],
  },
  {
    categoria: "PNEUS",
    itens: [
      { label: "Dianteiro", estado: "" },
      { label: "Traseiro", estado: "" },
    ],
  },
  {
    categoria: "ALIMENTAÇÃO",
    itens: [
      { label: "Filtro Combustível", estado: "" },
      { label: "Filtro Ar", estado: "" },
      { label: "Vela Ignição", estado: "" },
    ],
  },
  {
    categoria: "ÓLEO",
    itens: [{ label: "Óleo do motor", estado: "" }],
  },
  {
    categoria: "VÁLVULAS",
    itens: [{ label: "Verificar válvulas", estado: "" }],
  },
];

interface CheckinStepProps {
  onContinue: (data: CheckinData) => void;
  onBack: () => void;
  clienteNome?: string;
  placa?: string;
}

export function CheckinStep({ onContinue, onBack, clienteNome, placa }: CheckinStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const FOTOS_LABELS = ["Frente", "Traseira", "Lateral Esq.", "Lateral Dir.", "Outros 1", "Outros 2", "Outros 3", "Outros 4"];
  const [fotos, setFotos] = useState<(File | string | null)[]>(Array(8).fill(null));
  const activeSlotIndex = useRef<number | null>(null);

  const [checklist, setChecklist] = useState<ChecklistCategory[]>(
    JSON.parse(JSON.stringify(CHECKLIST_INICIAL))
  );
  const [observacoes, setObservacoes] = useState("");

  const triggerUpload = (index: number) => {
    activeSlotIndex.current = index;
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const index = activeSlotIndex.current;
    if (index !== null) {
      setFotos((prev) => {
        const copy = [...prev];
        copy[index] = file;
        return copy;
      });
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const toggleItem = (catIdx: number, itemIdx: number) => {
    setChecklist((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const current = copy[catIdx].itens[itemIdx].estado;
      copy[catIdx].itens[itemIdx].estado =
        current === "" ? "bom" : current === "bom" ? "substituir" : "";
      return copy;
    });
  };

  const totalSubstituir = checklist.reduce(
    (sum, cat) => sum + cat.itens.filter((i) => i.estado === "substituir").length,
    0
  );
  const totalBom = checklist.reduce(
    (sum, cat) => sum + cat.itens.filter((i) => i.estado === "bom").length,
    0
  );

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-start py-4 px-2">
      <div className="w-full max-w-6xl space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Check do Veículo</h2>
          </div>
          {(placa || clienteNome) && (
            <p className="text-sm text-muted-foreground">
              {placa && <span className="font-semibold">{placa}</span>}
              {placa && clienteNome && " • "}
              {clienteNome}
            </p>
          )}
        </div>

        {/* Side by side layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: Fotos */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Fotos do Check-in
                <Badge variant="secondary" className="ml-auto">{fotos.filter(Boolean).length}/8</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Registre até 8 fotos estruturadas do veículo na entrada (Frente, Traseira, Laterais e Outros)
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FOTOS_LABELS.map((label, idx) => {
                  const foto = fotos[idx];
                  const isUrl = typeof foto === "string";
                  const imgSrc = foto ? (isUrl ? (foto as string) : URL.createObjectURL(foto as File)) : null;

                  return (
                    <div key={idx} className="relative aspect-square rounded-lg border border-border bg-secondary/20 flex flex-col items-center justify-center overflow-hidden group">
                      {imgSrc ? (
                        <>
                          <img src={imgSrc} alt={label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => window.open(imgSrc, "_blank")}
                              className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/40"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFotos((prev) => {
                                  const copy = [...prev];
                                  copy[idx] = null;
                                  return copy;
                                });
                              }}
                              className="p-1.5 rounded-full bg-destructive/85 text-destructive-foreground hover:bg-destructive"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-background/80 py-0.5 text-center text-[9px] font-bold text-foreground truncate px-1">
                            {label}
                          </div>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => triggerUpload(idx)}
                          className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-1 hover:bg-secondary/40 transition-colors"
                        >
                          <Camera className="h-4.5 w-4.5 text-muted-foreground" />
                          <span className="text-[9px] font-bold text-muted-foreground truncate w-full px-1">{label}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Observações inside fotos panel */}
              <Textarea
                placeholder="Observações do check-in (opcional)..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* RIGHT: Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Checklist</span>
                {totalSubstituir > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{totalSubstituir}</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-muted border" /> N/V
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Bom
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-destructive" /> Substituir
                </span>
              </div>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {checklist.map((cat, catIdx) => (
                <Card key={cat.categoria} className="overflow-hidden">
                  <CardHeader className="py-2 px-4 bg-muted/30">
                    <CardTitle className="text-xs font-bold tracking-wide">{cat.categoria}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-2 pt-1">
                    <div className="grid grid-cols-2 gap-1">
                      {cat.itens.map((item, itemIdx) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => toggleItem(catIdx, itemIdx)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors border ${
                            item.estado === "bom"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                              : item.estado === "substituir"
                              ? "bg-destructive/10 border-destructive/30 text-destructive"
                              : "bg-muted/50 border-transparent hover:bg-muted"
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                          {item.estado === "bom" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-1" />}
                          {item.estado === "substituir" && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 ml-1" />}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <div className="flex items-center gap-4 text-sm px-1">
              <span className="text-emerald-600 font-medium">✓ Bom: {totalBom}</span>
              <span className="text-destructive font-medium">⚠ Substituir: {totalSubstituir}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Eye className="h-4 w-4" /> Visualizar Checklist
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    Checklist do Veículo
                  </DialogTitle>
                  {(placa || clienteNome) && (
                    <p className="text-sm text-muted-foreground">
                      {placa && <span className="font-semibold">{placa}</span>}
                      {placa && clienteNome && " • "}
                      {clienteNome}
                    </p>
                  )}
                </DialogHeader>

                <div className="space-y-3 mt-2">
                  {checklist.map((cat) => {
                    const preenchidos = cat.itens.filter((i) => i.estado !== "");
                    if (preenchidos.length === 0) return null;
                    return (
                      <div key={cat.categoria} className="border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 px-3 py-1.5">
                          <span className="text-xs font-bold tracking-wide">{cat.categoria}</span>
                        </div>
                        <div className="px-3 py-2 space-y-1">
                          {preenchidos.map((item) => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                              <span>{item.label}</span>
                              {item.estado === "bom" ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Bom
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" /> Substituir
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {checklist.every((cat) => cat.itens.every((i) => i.estado === "")) && (
                    <p className="text-center text-muted-foreground text-sm py-6">
                      Nenhum item foi preenchido ainda.
                    </p>
                  )}

                  {observacoes && (
                    <div className="border rounded-lg p-3">
                      <span className="text-xs font-bold tracking-wide">OBSERVAÇÕES</span>
                      <p className="text-sm mt-1 text-muted-foreground">{observacoes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm pt-1 border-t">
                    <span className="text-emerald-600 font-medium">✓ Bom: {totalBom}</span>
                    <span className="text-destructive font-medium">⚠ Substituir: {totalSubstituir}</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={() => onContinue({ fotos, checklist, observacoes_checkin: observacoes })}
              className="gap-2"
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
