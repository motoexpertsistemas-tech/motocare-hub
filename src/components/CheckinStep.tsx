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
  fotos: File[];
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
  const [fotos, setFotos] = useState<File[]>([]);
  const [checklist, setChecklist] = useState<ChecklistCategory[]>(
    JSON.parse(JSON.stringify(CHECKLIST_INICIAL))
  );
  const [observacoes, setObservacoes] = useState("");

  const handleAddFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const novas = Array.from(e.target.files);
    setFotos((prev) => {
      const total = [...prev, ...novas];
      return total.slice(0, 10);
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const removerFoto = (i: number) => setFotos((prev) => prev.filter((_, idx) => idx !== i));

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
                <Badge variant="secondary" className="ml-auto">{fotos.length}/10</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Registre até 10 fotos do veículo na entrada (arranhões, avarias, estado geral)
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAddFotos}
              />
              <Button
                variant="outline"
                className="w-full gap-2 h-20 border-dashed"
                onClick={() => inputRef.current?.click()}
                disabled={fotos.length >= 10}
              >
                <Upload className="h-5 w-5" />
                {fotos.length >= 10 ? "Limite de 10 fotos atingido" : "Adicionar fotos"}
              </Button>

              {fotos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {fotos.map((f, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                      <img
                        src={URL.createObjectURL(f)}
                        alt={`Foto ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removerFoto(i)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <span className="absolute bottom-0 left-0 right-0 bg-background/70 text-[10px] text-center py-0.5">
                        {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

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
