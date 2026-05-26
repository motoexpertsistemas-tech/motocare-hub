import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MARKETPLACE_FEES, calcularPrecoVenda } from "@/lib/marketplaceFees";
import { Calculator, TrendingUp, TrendingDown, DollarSign, Percent, Package, ArrowRight, RotateCcw } from "lucide-react";

interface CanalInfo {
  key: string;
  nome: string;
  logo: string;
  cor: string;
}

interface DetalheData {
  canal: string;
  preco: number;
  margem: number;
  precoCusto: number;
  nomeProduto: string;
  codigoSku: string;
  imagemUrl: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: DetalheData | null;
  getCanalInfo: (key: string) => CanalInfo | undefined;
  onSave?: (mkId: string, preco: number, margem: number) => void;
  mkId?: string;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function MarketplaceCalculatorDialog({ open, onOpenChange, data, getCanalInfo, onSave, mkId }: Props) {
  const [margem, setMargem] = useState("30");
  const [imposto, setImposto] = useState("6");
  const [custoExtra, setCustoExtra] = useState("0");

  useEffect(() => {
    if (data) {
      setMargem(String(data.margem || 30));
      const fees = MARKETPLACE_FEES[data.canal];
      setImposto(String(fees?.imposto || 6));
      setCustoExtra("0");
    }
  }, [data]);

  if (!data) return null;

  const info = getCanalInfo(data.canal);
  const fees = MARKETPLACE_FEES[data.canal];
  const comissao = fees?.comissao || 0;
  const txTransacao = fees?.taxaTransacao || 0;
  const taxaFixa = fees?.taxaFixa || 0;
  const impostoNum = parseFloat(imposto) || 0;
  const margemNum = parseFloat(margem) || 0;
  const custoExtraNum = parseFloat(custoExtra) || 0;
  const custoBase = data.precoCusto + custoExtraNum;

  // Calculate ideal selling price
  const totalPct = (comissao + txTransacao + impostoNum + margemNum) / 100;
  const precoIdeal = totalPct < 1 ? (custoBase + taxaFixa) / (1 - totalPct) : custoBase * 2;

  // Breakdown based on ideal price
  const comissaoVal = precoIdeal * (comissao / 100);
  const txTransacaoVal = precoIdeal * (txTransacao / 100);
  const impostoVal = precoIdeal * (impostoNum / 100);
  const lucro = precoIdeal * (margemNum / 100);
  const custoTotal = custoBase + comissaoVal + txTransacaoVal + taxaFixa + impostoVal;
  const lucroLiquido = precoIdeal - custoTotal;
  const margemLiquida = precoIdeal > 0 ? (lucroLiquido / precoIdeal) * 100 : 0;
  const roi = custoTotal > 0 ? (lucroLiquido / custoTotal) * 100 : 0;

  // Compare with current saved price
  const precoAtual = data.preco;
  const diffPreco = precoIdeal - precoAtual;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-visible">
        {/* Header with gradient */}
        <div className="px-5 pt-5 pb-4" style={{ background: `linear-gradient(135deg, ${info?.cor || '#666'}15, ${info?.cor || '#666'}05)` }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-5 w-5 text-primary" />
              Calculadora de Lucro
            </DialogTitle>
          </DialogHeader>

          {/* Product info card */}
          <div className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-card border border-border">
            <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
              {data.imagemUrl ? (
                <img src={data.imagemUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{data.nomeProduto}</p>
              <p className="text-[10px] text-muted-foreground">SKU: {data.codigoSku}</p>
            </div>
            <Badge className="text-[10px] h-6 px-2.5 text-white font-bold shrink-0" style={{ backgroundColor: info?.cor || "#666" }}>
              {info?.nome || data.canal}
            </Badge>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Inputs row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Custo
              </Label>
              <div className="text-sm font-bold text-foreground bg-muted/50 rounded-md px-3 py-2 border border-border">
                {fmt(data.precoCusto)}
              </div>
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
                <Percent className="h-3 w-3" /> Margem (%)
              </Label>
              <Input
                value={margem}
                onChange={(e) => setMargem(e.target.value)}
                type="number"
                step="1"
                className="h-9 text-sm font-medium"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
                <Percent className="h-3 w-3" /> Imposto (%)
              </Label>
              <Input
                value={imposto}
                onChange={(e) => setImposto(e.target.value)}
                type="number"
                step="0.5"
                className="h-9 text-sm font-medium"
              />
            </div>
          </div>

          {/* Fee breakdown */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/30 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Taxas do {info?.nome || data.canal}
            </div>
            <div className="px-3 py-2 space-y-1.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Comissão ({comissao}%)</span>
                <span className="text-destructive font-medium">- {fmt(comissaoVal)}</span>
              </div>
              {txTransacao > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Taxa Transação ({txTransacao}%)</span>
                  <span className="text-destructive font-medium">- {fmt(txTransacaoVal)}</span>
                </div>
              )}
              {taxaFixa > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Taxa Fixa</span>
                  <span className="text-destructive font-medium">- {fmt(taxaFixa)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Imposto ({impostoNum}%)</span>
                <span className="text-destructive font-medium">- {fmt(impostoVal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Total Taxas</span>
                <span className="text-destructive font-bold">- {fmt(comissaoVal + txTransacaoVal + taxaFixa + impostoVal)}</span>
              </div>
            </div>
          </div>

          {/* Results cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Preço Ideal</p>
              <p className="text-lg font-bold text-primary">{fmt(precoIdeal)}</p>
              {Math.abs(diffPreco) > 0.01 && (
                <p className={`text-[10px] mt-0.5 flex items-center justify-center gap-0.5 ${diffPreco > 0 ? "text-amber-600" : "text-green-600"}`}>
                  {diffPreco > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {diffPreco > 0 ? "+" : ""}{fmt(diffPreco)} vs atual
                </p>
              )}
            </div>
            <div className={`rounded-lg border p-3 text-center ${lucroLiquido >= 0 ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950" : "border-destructive/20 bg-destructive/5"}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Lucro Líquido</p>
              <p className={`text-lg font-bold ${lucroLiquido >= 0 ? "text-green-600" : "text-destructive"}`}>
                {fmt(lucroLiquido)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Margem: {margemLiquida.toFixed(1)}% • ROI: {roi.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Summary row */}
          <div className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>Custo <span className="font-semibold text-foreground">{fmt(custoBase)}</span></span>
              <ArrowRight className="h-3 w-3" />
              <span>Taxa <span className="font-semibold text-destructive">{fmt(comissaoVal + txTransacaoVal + taxaFixa + impostoVal)}</span></span>
              <ArrowRight className="h-3 w-3" />
              <span>Venda <span className="font-semibold text-foreground">{fmt(precoIdeal)}</span></span>
              <ArrowRight className="h-3 w-3" />
              <span className={lucroLiquido >= 0 ? "text-green-600 font-semibold" : "text-destructive font-semibold"}>
                Lucro {fmt(lucroLiquido)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            {onSave && mkId && Math.abs(precoIdeal - precoAtual) > 0.01 && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  onSave(mkId, Math.round(precoIdeal * 100) / 100, margemNum);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Atualizar Preço para {fmt(precoIdeal)}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
