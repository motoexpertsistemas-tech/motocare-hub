import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp, ArrowLeftRight, HelpCircle, Building2, DollarSign, BarChart3, ChevronDown, ChevronUp, ArrowLeft, FileSpreadsheet, Percent, Info, CheckCircle2 } from "lucide-react";
import { toBRL, fromBRL } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BRLInput } from "@/components/BRLInput";

/* ── Simples Nacional (DAS) - Tabelas por Anexo ── */
const faixasSN_I = [
  { faixa: 1, min: 0, max: 180000, aliq: 4, ded: 0 },
  { faixa: 2, min: 180000.01, max: 360000, aliq: 7.3, ded: 5940 },
  { faixa: 3, min: 360000.01, max: 720000, aliq: 9.5, ded: 13860 },
  { faixa: 4, min: 720000.01, max: 1800000, aliq: 10.7, ded: 22500 },
  { faixa: 5, min: 1800000.01, max: 3600000, aliq: 14.3, ded: 87300 },
  { faixa: 6, min: 3600000.01, max: 4800000, aliq: 19, ded: 378000 },
];

const faixasSN_II = [
  { faixa: 1, min: 0, max: 180000, aliq: 4.5, ded: 0 },
  { faixa: 2, min: 180000.01, max: 360000, aliq: 7.8, ded: 5940 },
  { faixa: 3, min: 360000.01, max: 720000, aliq: 10, ded: 13860 },
  { faixa: 4, min: 720000.01, max: 1800000, aliq: 11.2, ded: 22500 },
  { faixa: 5, min: 1800000.01, max: 3600000, aliq: 14.7, ded: 85500 },
  { faixa: 6, min: 3600000.01, max: 4800000, aliq: 30, ded: 720000 },
];

const faixasSN_III = [
  { faixa: 1, min: 0, max: 180000, aliq: 6, ded: 0 },
  { faixa: 2, min: 180000.01, max: 360000, aliq: 11.2, ded: 9360 },
  { faixa: 3, min: 360000.01, max: 720000, aliq: 13.5, ded: 17640 },
  { faixa: 4, min: 720000.01, max: 1800000, aliq: 16, ded: 35640 },
  { faixa: 5, min: 1800000.01, max: 3600000, aliq: 21, ded: 125640 },
  { faixa: 6, min: 3600000.01, max: 4800000, aliq: 33, ded: 648000 },
];

const faixasSNByAnexo: Record<string, typeof faixasSN_I> = {
  "1": faixasSN_I,
  "2": faixasSN_II,
  "3": faixasSN_III,
};

const rbt12Ranges = [
  { value: "150000", label: "Até R$ 180.000,00" },
  { value: "270000", label: "R$ 180.000,01 até R$ 360.000,00" },
  { value: "540000", label: "R$ 360.000,01 até R$ 720.000,00" },
  { value: "1200000", label: "R$ 720.000,01 até R$ 1.800.000,00" },
  { value: "2700000", label: "R$ 1.800.000,01 até R$ 3.600.000,00" },
];

function calcSN(rbt12: number, fatMes: number, anexo: string = "1") {
  const faixas = faixasSNByAnexo[anexo] || faixasSN_I;
  const faixa = faixas.find((f) => rbt12 <= f.max) ?? faixas[faixas.length - 1];
  const aliqEfetiva = (rbt12 * (faixa.aliq / 100) - faixa.ded) / rbt12;
  const imposto = fatMes * aliqEfetiva;
  return { faixaNum: faixa.faixa, aliqNominal: faixa.aliq, aliqEfetiva: aliqEfetiva * 100, imposto, ded: faixa.ded };
}

function parseBRL(val: string) {
  return parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
}

function formatBRL(val: number | undefined | null) {
  if (val === undefined || val === null || isNaN(val)) return "0,00";
  return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ══════════════════════════════════════════ */
/* ── Simples Nacional (DAS) ── */
/* ══════════════════════════════════════════ */
function TabSimplesNacional() {
  const [rbt12, setRbt12] = useState("");
  const [fatMes, setFatMes] = useState("0.00");
  const [anexo, setAnexo] = useState("1");
  const [showTable, setShowTable] = useState(true);
  const [result, setResult] = useState<ReturnType<typeof calcSN> | null>(null);

  const tryCalc = (r: string, f: string, a: string = anexo) => {
    const rv = parseFloat(r) || 0;
    const fv = parseFloat(f) || 0;
    if (rv > 0 && fv > 0) setResult(calcSN(rv, fv, a));
  };

  const handleAnexoChange = (v: string) => { setAnexo(v); tryCalc(rbt12, fatMes, v); };
  const handleRbt12Change = (v: string) => { setRbt12(v); tryCalc(v, fatMes); };
  const handleFatMesChange = (v: string) => { setFatMes(v); tryCalc(rbt12, v); };

  const anexoLabel = anexo === "1" ? "Comércio" : anexo === "2" ? "Indústria" : "Serviços";
  const fatMesVal = parseFloat(fatMes) || 0;
  const fatProjetado = fatMesVal * 12;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-100">
          <Calculator className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Calculadora Simples Nacional (DAS)</h2>
          <p className="text-sm text-muted-foreground">Calcule sua alíquota efetiva e valor do DAS mensal</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Anexo</label>
              <Select value={anexo} onValueChange={handleAnexoChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Anexo I - Comércio</SelectItem>
                  <SelectItem value="2">Anexo II - Indústria</SelectItem>
                  <SelectItem value="3">Anexo III - Serviços</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Faturamento últimos 12 meses (RBT12)</label>
              <Select value={rbt12} onValueChange={handleRbt12Change}>
                <SelectTrigger><SelectValue placeholder="Selecione o faturamento" /></SelectTrigger>
                <SelectContent>
                  {[100000,200000,300000,400000,500000,600000,700000,800000,900000,1000000,1100000,1200000,1300000,1400000,1500000,1600000,1700000,1800000,1900000,2000000,2100000,2200000,2300000,2400000,2500000,2600000,2700000,2800000,2900000,3000000,3100000,3200000,3300000,3400000,3500000,3600000].map(v => (
                    <SelectItem key={v} value={String(v)}>R$ {(v/1000).toLocaleString("pt-BR")}.000</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Faturamento do mês atual</label>
              <BRLInput prefix="R$" value={fatMes} onChange={handleFatMesChange} />
            </div>
          </div>

          {/* Resultado */}
          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Valor do DAS */}
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">Valor do DAS</span>
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-700">R$ {formatBRL(result.imposto)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Alíquota efetiva: <strong className="text-emerald-700">{result.aliqEfetiva.toFixed(2)}%</strong></p>
                  <p className="text-xs text-muted-foreground">Faixa {result.faixaNum} | Alíquota nominal: {result.aliqNominal}%</p>
                </CardContent>
              </Card>

              {/* Projeção Anual */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700">Projeção Anual</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Faturamento projetado</p>
                  <p className="text-xl font-bold text-blue-700">R$ {formatBRL(fatProjetado)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total DAS projetado</p>
                  <p className="text-xl font-bold text-blue-700">R$ {formatBRL(result.imposto * 12)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Resumo faturamento - DAS = líquido */}
          {result && fatMesVal > 0 && (
            <Card className="border">
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-5 items-center text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Faturamento mensal</p>
                    <p className="text-lg font-bold">R$ {formatBRL(fatMesVal)}</p>
                  </div>
                  <div className="text-xl text-muted-foreground font-bold">−</div>
                  <div>
                    <p className="text-xs text-muted-foreground">DAS</p>
                    <p className="text-lg font-bold text-destructive">R$ {formatBRL(result.imposto)}</p>
                  </div>
                  <div className="text-xl text-muted-foreground font-bold">=</div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor líquido (antes custos)</p>
                    <p className="text-lg font-bold text-emerald-700">R$ {formatBRL(fatMesVal - result.imposto)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Tabela de faixas colapsável */}
      <Collapsible open={showTable} onOpenChange={setShowTable}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline cursor-pointer">
          {showTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Ver tabela de alíquotas - Anexo {anexo === "1" ? "I" : anexo === "2" ? "II" : "III"} - {anexoLabel}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-3">
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2.5 font-semibold w-16">Faixa</th>
                      <th className="text-left py-2.5 font-semibold">Faturamento (12 meses)</th>
                      <th className="text-right py-2.5 font-semibold">Alíquota</th>
                      <th className="text-right py-2.5 font-semibold">Dedução</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(faixasSNByAnexo[anexo] || faixasSN_I).map((f) => (
                      <tr key={f.faixa} className={`border-b last:border-0 ${result?.faixaNum === f.faixa ? "bg-blue-50 font-semibold" : ""}`}>
                        <td className="py-2.5 text-muted-foreground italic">{f.faixa}ª</td>
                        <td className="py-2.5 text-blue-600">R$ {formatBRL(f.min)} até R$ {formatBRL(f.max)}</td>
                        <td className="text-right py-2.5">{f.aliq}%</td>
                        <td className="text-right py-2.5 text-blue-600">R$ {formatBRL(f.ded)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/* ══════════════════════════════════════════ */
/* ── Lucro Presumido ── */
/* ══════════════════════════════════════════ */
function TabLucroPresumido({ onCompararRegimes }: { onCompararRegimes?: (fatBruto: string, icmsVenda: string) => void }) {
  const [tipoOp, setTipoOp] = useState("comercio");
  const [fatBruto, setFatBruto] = useState("0.00");
  const [valorCompras, setValorCompras] = useState("0.00");
  const [icmsVenda, setIcmsVenda] = useState("18");
  const [icmsCompra, setIcmsCompra] = useState("12");
  const [pis, setPis] = useState("0.65");
  const [cofins, setCofins] = useState("3");
  const [obs, setObs] = useState("");
  const [result, setResult] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  const doCalc = (tipo: string, fat: string, compras: string, iv: string, ic: string, p: string, c: string) => {
    const fatVal = parseFloat(fat) || 0;
    const comprasVal = parseFloat(compras) || 0;
    if (fatVal <= 0) { setResult(null); return; }

    const presuncao = tipo === "servicos" ? 32 : tipo === "misto" ? 16 : 8;
    const baseIR = fatVal * (presuncao / 100);
    const irpj = baseIR * 0.15;
    const adicionalIR = baseIR > 20000 ? (baseIR - 20000) * 0.1 : 0;
    const baseCSLL = fatVal * (tipo === "servicos" ? 0.32 : 0.12);
    const csll = baseCSLL * 0.09;

    const icmsVendaVal = fatVal * (parseFloat(iv) || 0) / 100;
    const icmsCompraVal = comprasVal * (parseFloat(ic) || 0) / 100;
    const icmsRecolher = Math.max(icmsVendaVal - icmsCompraVal, 0);

    // PIS/COFINS: base exclui ICMS
    const basePisCofins = fatVal - icmsVendaVal;
    const pisVal = basePisCofins * (parseFloat(p) || 0) / 100;
    const cofinsVal = basePisCofins * (parseFloat(c) || 0) / 100;

    const total = irpj + adicionalIR + csll + pisVal + cofinsVal + icmsRecolher;

    setResult({
      presuncao, baseIR, irpj, adicionalIR, csll, baseCSLL,
      icmsVendaVal, icmsCompraVal, icmsRecolher, basePisCofins,
      pisVal, cofinsVal, total, fatVal,
      aliqEfetiva: (total / fatVal) * 100,
      liquido: fatVal - total,
      pisPerc: parseFloat(p) || 0,
      cofinsPerc: parseFloat(c) || 0,
      icmsVendaPerc: parseFloat(iv) || 0,
      icmsCompraPerc: parseFloat(ic) || 0,
      comprasVal,
    });
  };

  const recalc = (overrides: Record<string, string> = {}) => {
    const t = overrides.tipoOp ?? tipoOp;
    const f = overrides.fatBruto ?? fatBruto;
    const co = overrides.valorCompras ?? valorCompras;
    const iv = overrides.icmsVenda ?? icmsVenda;
    const ic = overrides.icmsCompra ?? icmsCompra;
    const p = overrides.pis ?? pis;
    const c = overrides.cofins ?? cofins;
    doCalc(t, f, co, iv, ic, p, c);
  };

  const tipoLabel = tipoOp === "servicos" ? "Serviços" : tipoOp === "misto" ? "Misto" : "Comércio";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-green-100">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Lucro Presumido</h2>
          <p className="text-sm text-muted-foreground">{tipoLabel} / E-commerce</p>
        </div>
      </div>

      {/* Entradas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Entradas</CardTitle>
          <CardDescription>Informe os dados do faturamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Operação</label>
            <Select value={tipoOp} onValueChange={(v) => { setTipoOp(v); recalc({ tipoOp: v }); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="comercio">Comércio</SelectItem>
                <SelectItem value="servicos">Serviços</SelectItem>
                <SelectItem value="misto">Misto (Comércio + Serviços)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Faturamento Bruto do Mês (R$)</label>
            <BRLInput prefix="R$" value={fatBruto} onChange={(v) => { setFatBruto(v); recalc({ fatBruto: v }); }} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Valor das Compras do Mês (R$)</label>
            <p className="text-xs text-muted-foreground">Para calcular crédito de ICMS (entrada - saída)</p>
            <BRLInput prefix="R$" value={valorCompras} onChange={(v) => { setValorCompras(v); recalc({ valorCompras: v }); }} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ICMS Venda (%)</label>
              <Input value={icmsVenda} onChange={(e) => { setIcmsVenda(e.target.value); recalc({ icmsVenda: e.target.value }); }} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ICMS Compra (%)</label>
              <Input value={icmsCompra} onChange={(e) => { setIcmsCompra(e.target.value); recalc({ icmsCompra: e.target.value }); }} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PIS (%)</label>
              <Input value={pis} onChange={(e) => { setPis(e.target.value); recalc({ pis: e.target.value }); }} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">COFINS (%)</label>
              <Input value={cofins} onChange={(e) => { setCofins(e.target.value); recalc({ cofins: e.target.value }); }} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observações</label>
            <Textarea placeholder="Anotações sobre este cálculo..." value={obs} onChange={(e) => setObs(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {result && (
        <div className="space-y-4">
          <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-orange-700">Resultados</CardTitle>
              <CardDescription>Impostos calculados para Lucro Presumido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Cards resumo dos impostos */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground">IRPJ</p>
                  <p className="text-lg font-bold text-orange-600">R$ {formatBRL(result.irpj)}</p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground">CSLL</p>
                  <p className="text-lg font-bold text-blue-600">R$ {formatBRL(result.csll)}</p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground">PIS</p>
                  <p className="text-lg font-bold text-purple-600">R$ {formatBRL(result.pisVal)}</p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground">COFINS</p>
                  <p className="text-lg font-bold text-emerald-600">R$ {formatBRL(result.cofinsVal)}</p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground">ICMS líquido</p>
                  <p className="text-lg font-bold text-red-600">R$ {formatBRL(result.icmsRecolher)}</p>
                </div>
              </div>

              {/* Total / Carga / Líquido */}
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-orange-100/80 rounded-lg px-4 py-3 border border-orange-200">
                  <span className="font-semibold">Total de Impostos</span>
                  <span className="text-2xl font-extrabold text-orange-700">R$ {formatBRL(result.total)}</span>
                </div>
                <div className="flex justify-between items-center bg-background rounded-lg px-4 py-2.5 border">
                  <span className="font-medium text-sm">Carga Efetiva</span>
                  <span className="text-lg font-bold text-orange-600">{result.aliqEfetiva.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center bg-emerald-50 rounded-lg px-4 py-2.5 border border-emerald-200">
                  <span className="font-medium text-sm">Faturamento Líquido</span>
                  <span className="text-lg font-bold text-emerald-700">R$ {formatBRL(result.liquido)}</span>
                </div>
              </div>

              {/* Detalhamento colapsável */}
              <Collapsible open={showDetail} onOpenChange={setShowDetail}>
                <CollapsibleTrigger className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground w-full py-2 cursor-pointer">
                  {showDetail ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Detalhamento do Cálculo →
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3 text-sm mt-2 border-t pt-3">
                    <p className="text-muted-foreground">Faturamento: <strong className="text-foreground">R$ {formatBRL(result.fatVal)}</strong></p>

                    <div>
                      <p className="font-semibold text-orange-600">IRPJ:</p>
                      <p className="text-muted-foreground">Base de Presunção ({result.presuncao}% comércio / 32% serviços): <strong>R$ {formatBRL(result.baseIR)}</strong></p>
                      <p className="text-muted-foreground">IRPJ: Base × 15% = <strong className="text-orange-600">R$ {formatBRL(result.irpj)}</strong></p>
                      {result.adicionalIR > 0 && <p className="text-muted-foreground">Adicional IR (10%): <strong className="text-orange-600">R$ {formatBRL(result.adicionalIR)}</strong></p>}
                    </div>

                    <div>
                      <p className="font-semibold text-blue-600">CSLL:</p>
                      <p className="text-muted-foreground">Base de Presunção (12% comércio / 32% serviços): <strong>R$ {formatBRL(result.baseCSLL)}</strong></p>
                      <p className="text-muted-foreground">CSLL: Base × 9% = <strong className="text-blue-600">R$ {formatBRL(result.csll)}</strong></p>
                    </div>

                    <div>
                      <p className="font-semibold text-red-600">ICMS (Débito - Crédito):</p>
                      <p className="text-muted-foreground">ICMS Débito (Vendas): R$ {formatBRL(result.fatVal)} × {result.icmsVendaPerc}% = <strong>R$ {formatBRL(result.icmsVendaVal)}</strong></p>
                      <p className="text-muted-foreground">ICMS Crédito (Compras): R$ {formatBRL(result.comprasVal)} × {result.icmsCompraPerc}% = <strong className="text-emerald-600">R$ {formatBRL(result.icmsCompraVal)}</strong></p>
                      <p className="text-muted-foreground">ICMS a Recolher: R$ {formatBRL(result.icmsVendaVal)} - R$ {formatBRL(result.icmsCompraVal)} = <strong className="text-red-600">R$ {formatBRL(result.icmsRecolher)}</strong></p>
                    </div>

                    <div>
                      <p className="font-semibold text-purple-600">PIS/COFINS (Base excluindo ICMS):</p>
                      <p className="text-muted-foreground">Base de Cálculo: R$ {formatBRL(result.fatVal)} - R$ {formatBRL(result.icmsVendaVal)} = <strong>R$ {formatBRL(result.basePisCofins)}</strong></p>
                      <p className="text-muted-foreground">PIS: Base × {result.pisPerc}% = <strong className="text-purple-600">R$ {formatBRL(result.pisVal)}</strong></p>
                      <p className="text-muted-foreground">COFINS: Base × {result.cofinsPerc}% = <strong className="text-emerald-600">R$ {formatBRL(result.cofinsVal)}</strong></p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparar Regimes Tributários */}
      {onCompararRegimes && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <BarChart3 className="h-10 w-10 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">Compare Simples Nacional, Lucro Presumido e Lucro Real</p>
            <Button
              onClick={() => onCompararRegimes(fatBruto, icmsVenda)}
              className="gap-2"
              size="lg"
            >
              <BarChart3 className="h-4 w-4" /> Comparar Regimes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Widget Comparar Regimes (dentro do Lucro Presumido) ── */
function CompararRegimesWidget({ fatBruto, icmsVenda }: { fatBruto: string; icmsVenda: string }) {
  const [rbt12Comp, setRbt12Comp] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [resultComp, setResultComp] = useState<any>(null);
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});

  const fatVal = parseFloat(fatBruto) || 0;
  const icmsPerc = parseFloat(icmsVenda) || 0;

  const handleCompare = () => {
    if (!rbt12Comp || fatVal <= 0) return;
    const rbt12Val = parseFloat(rbt12Comp) || 0;

    // Simples Nacional (Anexo I - Comércio)
    const snResult = calcSN(rbt12Val, fatVal, "1");
    const snMensal = snResult.imposto;
    const faixaObj = (faixasSNByAnexo["1"]).find((f) => rbt12Val <= f.max) ?? faixasSN_I[faixasSN_I.length - 1];

    // Lucro Presumido
    const baseIR = fatVal * 0.08;
    const irpjLP = baseIR * 0.15;
    const csllLP = fatVal * 0.12 * 0.09;
    const icmsLP = fatVal * icmsPerc / 100;
    const basePisCofins = fatVal - icmsLP;
    const pisLP = basePisCofins * 0.0065;
    const cofinsLP = basePisCofins * 0.03;
    const lpMensal = irpjLP + csllLP + pisLP + cofinsLP + icmsLP;

    const regimes = [
      {
        nome: "Simples Nacional",
        mensal: snMensal,
        aliq: (snMensal / fatVal) * 100,
        numColor: "bg-emerald-500",
        borderColor: "border-emerald-500",
        details: {
          type: "sn" as const,
          rbt12: formatBRL(rbt12Val),
          faixa: `Até R$ ${formatBRL(faixaObj.max)}`,
          aliqNominal: `${snResult.aliqNominal}%`,
          deducao: formatBRL(snResult.ded),
          aliqEfetiva: `${snResult.aliqEfetiva.toFixed(2)}%`,
          das: formatBRL(snMensal),
        },
      },
      {
        nome: "Lucro Presumido",
        mensal: lpMensal,
        aliq: (lpMensal / fatVal) * 100,
        numColor: "bg-blue-500",
        borderColor: "border-blue-500",
        details: {
          type: "lp" as const,
          basePresuncao: formatBRL(baseIR),
          irpj: formatBRL(irpjLP),
          csll: formatBRL(csllLP),
          pis: formatBRL(pisLP),
          cofins: formatBRL(cofinsLP),
          icms: formatBRL(icmsLP),
          total: formatBRL(lpMensal),
        },
      },
    ].sort((a, b) => a.mensal - b.mensal);

    setResultComp(regimes);
    setShowResult(true);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <div>
            <CardTitle className="text-lg font-bold">Ranking - Menor Custo</CardTitle>
            <CardDescription>Comparação dos regimes tributários</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* RBT12 selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">RBT12 para comparar com Simples Nacional</label>
          <Select value={rbt12Comp} onValueChange={setRbt12Comp}>
            <SelectTrigger><SelectValue placeholder="Informe o RBT12" /></SelectTrigger>
            <SelectContent>
              {[100000,200000,300000,400000,500000,600000,700000,800000,900000,1000000,1500000,2000000,2500000,3000000,3600000].map(v => (
                <SelectItem key={v} value={String(v)}>R$ {v.toLocaleString("pt-BR")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleCompare}
          disabled={!rbt12Comp || fatVal <= 0}
          className="w-full gap-2"
          size="lg"
        >
          <BarChart3 className="h-4 w-4" /> Comparar Regimes
        </Button>

        {showResult && resultComp && (
          <div className="space-y-3 pt-2">
            {resultComp.map((regime: any, idx: number) => {
              const isMelhor = idx === 0;
              const perc = regime.aliq.toFixed(2);
              const isOpen = openDetails[regime.nome] || false;
              const economia = isMelhor && resultComp.length > 1
                ? resultComp[resultComp.length - 1].mensal - regime.mensal
                : 0;

              return (
                <div key={regime.nome} className={`rounded-lg border ${isMelhor ? `border-2 ${regime.borderColor}` : "border"} overflow-hidden`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full ${regime.numColor} text-white flex items-center justify-center text-sm font-bold`}>
                          {idx + 1}
                        </div>
                        <div>
                          <span className="font-semibold text-sm">{regime.nome}</span>
                          {isMelhor && (
                            <>
                              <div className="mt-0.5">
                                <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">MELHOR NO MÊS</Badge>
                              </div>
                              {economia > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Economia de R$ {formatBRL(economia)} vs {resultComp[resultComp.length - 1].nome}
                                </p>
                              )}
                              {regime.nome === "Simples Nacional" && (
                                <p className="text-[10px] text-muted-foreground italic">DAS efetivo ficou menor que a soma do presumido/real.</p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">R$ {formatBRL(regime.mensal)}</p>
                        <p className="text-xs text-muted-foreground">{perc}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible details */}
                  <Collapsible open={isOpen} onOpenChange={(v) => setOpenDetails((prev) => ({ ...prev, [regime.nome]: v }))}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground hover:bg-muted/40 transition-colors border-t">
                        <HelpCircle className="h-3 w-3" />
                        Ver detalhes do {regime.nome}
                        <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 text-sm space-y-1 bg-muted/20">
                        {regime.details.type === "sn" && (
                          <>
                            <p><strong>RBT12:</strong> R$ {regime.details.rbt12}</p>
                            <p><strong>Faixa:</strong> {regime.details.faixa}</p>
                            <p><strong>Alíquota Nominal:</strong> {regime.details.aliqNominal}</p>
                            <p><strong>Dedução:</strong> R$ {regime.details.deducao}</p>
                            <p><strong>Alíquota Efetiva:</strong> {regime.details.aliqEfetiva}</p>
                            <p><strong>DAS:</strong> R$ {regime.details.das}</p>
                          </>
                        )}
                        {regime.details.type === "lp" && (
                          <>
                            <p><strong>Base Presunção:</strong> R$ {regime.details.basePresuncao}</p>
                            <p><strong>IRPJ:</strong> R$ {regime.details.irpj}</p>
                            <p><strong>CSLL:</strong> R$ {regime.details.csll}</p>
                            <p><strong>PIS:</strong> R$ {regime.details.pis}</p>
                            <p><strong>COFINS:</strong> R$ {regime.details.cofins}</p>
                            <p><strong>ICMS:</strong> R$ {regime.details.icms}</p>
                            <hr className="my-1" />
                            <p><strong>Total:</strong> R$ {regime.details.total}</p>
                          </>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800">
            <strong>Importante:</strong> Esta é uma estimativa para fins de planejamento. Valores reais podem variar conforme particularidades do negócio, estado, CNAE e enquadramentos específicos. Consulte sempre um contador.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Comparar Regimes (dentro do Lucro Real) ── */
interface CompararRegimesLucroRealCardProps {
  fatBruto: string; cmv: string; icmsVenda: string; pisVenda: string; cofinsVenda: string;
  icmsCompra: string; pisCompra: string; cofinsCompra: string; totalDespesas: number;
}

function CompararRegimesLucroRealCard({ fatBruto, cmv, icmsVenda, pisVenda, cofinsVenda, icmsCompra, pisCompra, cofinsCompra, totalDespesas }: CompararRegimesLucroRealCardProps) {
  const [rbt12Comp, setRbt12Comp] = useState("");
  const [rbt12Manual, setRbt12Manual] = useState("0.00");
  const [showResult, setShowResult] = useState(false);
  const [resultComp, setResultComp] = useState<any>(null);
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});

  const fat = parseFloat(fatBruto) || 0;
  const cmvVal = parseFloat(cmv) || 0;
  const icmsPerc = parseFloat(icmsVenda) || 0;

  useEffect(() => {
    if (rbt12Comp) setRbt12Manual(rbt12Comp);
  }, [rbt12Comp]);

  const handleCompare = () => {
    const rbt12Val = parseFloat(rbt12Manual) || parseFloat(rbt12Comp) || 0;
    if (fat <= 0 || rbt12Val <= 0) return;

    const snResult = calcSN(rbt12Val, fat, "1");
    const snMensal = snResult.imposto;
    const faixaObj = faixasSN_I.find((f) => rbt12Val <= f.max) ?? faixasSN_I[faixasSN_I.length - 1];

    const baseIR = fat * 0.08;
    const irpjLP = baseIR * 0.15;
    const csllLP = fat * 0.12 * 0.09;
    const icmsLP = fat * icmsPerc / 100;
    const basePisCofins = fat - icmsLP;
    const pisLP = basePisCofins * 0.0065;
    const cofinsLP = basePisCofins * 0.03;
    const lpMensal = irpjLP + csllLP + pisLP + cofinsLP + icmsLP;

    const icmsVendaVal = fat * (parseFloat(icmsVenda) || 0) / 100;
    const pisVendaVal = fat * (parseFloat(pisVenda) || 0) / 100;
    const cofinsVendaVal = fat * (parseFloat(cofinsVenda) || 0) / 100;
    const icmsCompraVal = cmvVal * (parseFloat(icmsCompra) || 0) / 100;
    const pisCompraVal = cmvVal * (parseFloat(pisCompra) || 0) / 100;
    const cofinsCompraVal = cmvVal * (parseFloat(cofinsCompra) || 0) / 100;
    const receitaLiquida = fat - icmsVendaVal - pisVendaVal - cofinsVendaVal;
    const cmvLiquido = cmvVal - icmsCompraVal - pisCompraVal - cofinsCompraVal;
    const lucroBruto = receitaLiquida - cmvLiquido;
    const lucroLiquido = lucroBruto - totalDespesas;
    const lucroAjustado = Math.max(lucroLiquido, 0);
    const irpjLR = lucroAjustado * 0.15;
    const adicionalIR = lucroAjustado > 20000 ? (lucroAjustado - 20000) * 0.1 : 0;
    const csllLR = lucroAjustado * 0.09;
    const icmsRecolher = Math.max(icmsVendaVal - icmsCompraVal, 0);
    const pisLiq = Math.max(pisVendaVal - pisCompraVal, 0);
    const cofinsLiq = Math.max(cofinsVendaVal - cofinsCompraVal, 0);
    const lrMensal = irpjLR + adicionalIR + csllLR + icmsRecolher + pisLiq + cofinsLiq;

    const regimes = [
      {
        nome: "Simples Nacional", mensal: snMensal,
        aliq: fat > 0 ? (snMensal / fat) * 100 : 0,
        numColor: "bg-emerald-500", borderColor: "border-emerald-500",
        details: {
          items: [
            { label: "RBT12", value: `R$ ${formatBRL(rbt12Val)}` },
            { label: "Faixa", value: `Até R$ ${formatBRL(faixaObj.max)}` },
            { label: "Alíquota Nominal", value: `${snResult.aliqNominal}%` },
            { label: "Dedução", value: `R$ ${formatBRL(snResult.ded)}` },
            { label: "Alíquota Efetiva", value: `${snResult.aliqEfetiva.toFixed(2)}%` },
            { label: "DAS Mensal", value: `R$ ${formatBRL(snMensal)}` },
          ],
        },
      },
      {
        nome: "Lucro Presumido", mensal: lpMensal,
        aliq: fat > 0 ? (lpMensal / fat) * 100 : 0,
        numColor: "bg-blue-500", borderColor: "border-blue-500",
        details: {
          items: [
            { label: "Base Presunção (8%)", value: `R$ ${formatBRL(baseIR)}` },
            { label: "IRPJ (15%)", value: `R$ ${formatBRL(irpjLP)}` },
            { label: "CSLL (9%)", value: `R$ ${formatBRL(csllLP)}` },
            { label: "PIS (0,65%)", value: `R$ ${formatBRL(pisLP)}` },
            { label: "COFINS (3%)", value: `R$ ${formatBRL(cofinsLP)}` },
            { label: "ICMS", value: `R$ ${formatBRL(icmsLP)}` },
          ],
        },
      },
      {
        nome: "Lucro Real", mensal: lrMensal,
        aliq: fat > 0 ? (lrMensal / fat) * 100 : 0,
        numColor: "bg-amber-500", borderColor: "border-amber-500",
        details: {
          items: [
            { label: "Lucro Ajustado", value: `R$ ${formatBRL(lucroAjustado)}` },
            { label: "IRPJ (15%)", value: `R$ ${formatBRL(irpjLR)}` },
            ...(adicionalIR > 0 ? [{ label: "Adicional IR (10%)", value: `R$ ${formatBRL(adicionalIR)}` }] : []),
            { label: "CSLL (9%)", value: `R$ ${formatBRL(csllLR)}` },
            { label: "ICMS a Recolher", value: `R$ ${formatBRL(icmsRecolher)}` },
            { label: "PIS Líquido", value: `R$ ${formatBRL(pisLiq)}` },
            { label: "COFINS Líquido", value: `R$ ${formatBRL(cofinsLiq)}` },
          ],
        },
      },
    ].sort((a, b) => a.mensal - b.mensal);

    setResultComp(regimes);
    setShowResult(true);
  };

  const economia = showResult && resultComp && resultComp.length > 1
    ? resultComp[resultComp.length - 1].mensal - resultComp[0].mensal
    : 0;

  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-amber-600" /> Comparar Regimes Tributários
        </CardTitle>
        <CardDescription>Compare Simples Nacional x Lucro Presumido x Lucro Real com estes dados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={rbt12Comp} onValueChange={setRbt12Comp}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o RBT12" />
          </SelectTrigger>
          <SelectContent>
            {[100000,200000,360000,500000,720000,1000000,1800000,2400000,3600000].map(v => (
              <SelectItem key={v} value={String(v)}>RBT12: R$ {formatBRL(v)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="space-y-1">
          <label className="text-sm font-medium">RBT12 - Receita Bruta Últimos 12 Meses (R$)</label>
          <BRLInput prefix="" value={rbt12Manual} onChange={(v) => { setRbt12Manual(v); setRbt12Comp(""); }} />
          <p className="text-xs text-muted-foreground">Necessário para determinar a faixa do Simples Nacional</p>
        </div>

        {fat > 0 && (
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Faturamento:</p>
              <p className="font-semibold text-amber-700">R$ {formatBRL(fat)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CMV:</p>
              <p className="font-semibold text-amber-700">R$ {formatBRL(cmvVal)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Despesas:</p>
              <p className="font-semibold text-amber-700">R$ {formatBRL(totalDespesas)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ICMS:</p>
              <p className="font-semibold text-amber-700">{icmsVenda}%</p>
            </div>
          </div>
        )}

        <Button
          onClick={handleCompare}
          disabled={fat <= 0 || ((parseFloat(rbt12Manual) || 0) <= 0 && !rbt12Comp)}
          className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          size="lg"
        >
          <BarChart3 className="h-4 w-4" /> Comparar Simples x Presumido x Real
        </Button>

        {showResult && resultComp && (
          <div className="space-y-3 pt-3 border-t border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🏆</span>
              <div>
                <p className="font-bold text-sm">Ranking - Menor Custo Tributário</p>
                {economia > 0 && (
                  <p className="text-xs text-emerald-700">
                    Economia de R$ {formatBRL(economia)}/mês com {resultComp[0].nome}
                  </p>
                )}
              </div>
            </div>
            {resultComp.map((regime: any, idx: number) => {
              const isMelhor = idx === 0;
              const isOpen = openDetails[regime.nome] || false;
              return (
                <div key={regime.nome} className={`rounded-lg border bg-white ${isMelhor ? `border-2 ${regime.borderColor}` : "border"} overflow-hidden`}>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full ${regime.numColor} text-white flex items-center justify-center text-sm font-bold`}>
                          {idx + 1}
                        </div>
                        <div>
                          <span className="font-semibold text-sm">{regime.nome}</span>
                          {isMelhor && (
                            <div className="mt-0.5">
                              <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">MELHOR OPÇÃO</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-base">R$ {formatBRL(regime.mensal)}</p>
                        <p className="text-xs text-muted-foreground">{regime.aliq.toFixed(2)}% do fat.</p>
                      </div>
                    </div>
                  </div>
                  <Collapsible open={isOpen} onOpenChange={(v) => setOpenDetails((prev) => ({ ...prev, [regime.nome]: v }))}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/40 transition-colors border-t">
                        <HelpCircle className="h-3 w-3" /> Ver detalhes
                        <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3 pt-1.5 text-sm space-y-1 bg-muted/10">
                        {regime.details.items.map((item: any) => (
                          <div key={item.label} className="flex justify-between">
                            <span className="text-muted-foreground">{item.label}</span>
                            <strong>{item.value}</strong>
                          </div>
                        ))}
                        <hr className="my-1" />
                        <div className="flex justify-between font-semibold">
                          <span>Total Mensal</span>
                          <span>R$ {formatBRL(regime.mensal)}</span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════ */
/* ── Lucro Real ── */
/* ══════════════════════════════════════════ */
// Lucro Real - auto-calculate
function TabLucroReal() {
  const [fatBruto, setFatBruto] = useState("0.00");
  const [cmv, setCmv] = useState("0.00");
  const [icmsVenda, setIcmsVenda] = useState("18");
  const [pisVenda, setPisVenda] = useState("1.65");
  const [cofinsVenda, setCofinsVenda] = useState("7.6");
  const [icmsCompra, setIcmsCompra] = useState("12");
  const [pisCompra, setPisCompra] = useState("1.65");
  const [cofinsCompra, setCofinsCompra] = useState("7.6");
  const [showDespesas, setShowDespesas] = useState(true);
  const [prejuizoAcumulado, setPrejuizoAcumulado] = useState("0.00");
  const [showDetalhamento, setShowDetalhamento] = useState(false);

  // Despesas operacionais
  const [anuncios, setAnuncios] = useState("0.00");
  const [fretes, setFretes] = useState("0.00");
  const [folha, setFolha] = useState("0.00");
  const [sistemas, setSistemas] = useState("0.00");
  const [contabilidade, setContabilidade] = useState("0.00");
  const [aluguel, setAluguel] = useState("0.00");
  const [outrasDespesas, setOutrasDespesas] = useState("0.00");

  

  const totalDespesas = [anuncios, fretes, folha, sistemas, contabilidade, aluguel, outrasDespesas]
    .reduce((acc, v) => acc + (parseFloat(v) || 0), 0);

  // Auto-calculate whenever inputs change
  const result = (() => {
    const fat = parseFloat(fatBruto) || 0;
    const compras = parseFloat(cmv) || 0;
    const prejAcum = parseFloat(prejuizoAcumulado) || 0;
    if (fat <= 0) return null;

    const icmsVendaVal = fat * (parseFloat(icmsVenda) || 0) / 100;
    const pisVendaVal = fat * (parseFloat(pisVenda) || 0) / 100;
    const cofinsVendaVal = fat * (parseFloat(cofinsVenda) || 0) / 100;
    const totalDebitos = icmsVendaVal + pisVendaVal + cofinsVendaVal;

    const icmsCompraVal = compras * (parseFloat(icmsCompra) || 0) / 100;
    const pisCompraVal = compras * (parseFloat(pisCompra) || 0) / 100;
    const cofinsCompraVal = compras * (parseFloat(cofinsCompra) || 0) / 100;
    const totalCreditos = icmsCompraVal + pisCompraVal + cofinsCompraVal;

    const receitaLiquida = fat - totalDebitos;
    const cmvLiquido = compras - totalCreditos;
    const lucroBruto = receitaLiquida - cmvLiquido;
    const lucroLiquido = lucroBruto - totalDespesas;

    const limitePrejuizo = Math.max(lucroLiquido * 0.3, 0);
    const prejuizoCompensado = Math.min(prejAcum, limitePrejuizo);
    const lucroAjustado = Math.max(lucroLiquido - prejuizoCompensado, 0);

    const irpj = Math.max(lucroAjustado * 0.15, 0);
    const adicionalIR = lucroAjustado > 20000 ? (lucroAjustado - 20000) * 0.1 : 0;
    const csll = Math.max(lucroAjustado * 0.09, 0);

    const icmsRecolher = Math.max(icmsVendaVal - icmsCompraVal, 0);
    const pisLiquido = Math.max(pisVendaVal - pisCompraVal, 0);
    const cofinsLiquido = Math.max(cofinsVendaVal - cofinsCompraVal, 0);

    const totalImpostosRecolher = irpj + adicionalIR + csll + icmsRecolher + pisLiquido + cofinsLiquido;
    const cargaEfetiva = fat > 0 ? (totalImpostosRecolher / fat) * 100 : 0;
    const resultadoFinal = lucroLiquido - irpj - adicionalIR - csll;

    return {
      fat, compras, totalDebitos, totalCreditos,
      icmsVendaVal, pisVendaVal, cofinsVendaVal,
      icmsCompraVal, pisCompraVal, cofinsCompraVal,
      receitaLiquida, cmvLiquido, lucroBruto, lucroLiquido,
      lucroAjustado, prejuizoCompensado,
      irpj, adicionalIR, csll,
      icmsRecolher, pisLiquido, cofinsLiquido,
      totalImpostosRecolher, cargaEfetiva, resultadoFinal,
      totalDespesas,
    };
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100">
          <FileSpreadsheet className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Lucro Real</h2>
          <p className="text-sm text-blue-600">Comércio / E-commerce</p>
        </div>
      </div>

      {/* Receitas e Custos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Receitas e Custos</CardTitle>
          <CardDescription>Faturamento bruto e custo das mercadorias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Faturamento Bruto do Mês (R$)</label>
              <BRLInput prefix="R$" value={fatBruto} onChange={setFatBruto} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CMV - Valor das Compras (R$)</label>
              <p className="text-xs text-muted-foreground">Valor bruto das mercadorias vendidas</p>
              <BRLInput prefix="R$" value={cmv} onChange={setCmv} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impostos sobre Vendas (Débitos) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Impostos sobre Vendas (Débitos)</CardTitle>
          <CardDescription>Alíquotas aplicadas sobre o faturamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ICMS Venda (%)</label>
              <Input value={icmsVenda} onChange={(e) => setIcmsVenda(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PIS Venda (%)</label>
              <Input value={pisVenda} onChange={(e) => setPisVenda(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">COFINS Venda (%)</label>
              <Input value={cofinsVenda} onChange={(e) => setCofinsVenda(e.target.value)} />
            </div>
          </div>
          {(() => {
            const fat = parseFloat(fatBruto) || 0;
            if (fat <= 0) return null;
            const icmsCalc = fat * (parseFloat(icmsVenda) || 0) / 100;
            const pisCalc = fat * (parseFloat(pisVenda) || 0) / 100;
            const cofinsCalc = fat * (parseFloat(cofinsVenda) || 0) / 100;
            const totalCalc = icmsCalc + pisCalc + cofinsCalc;
            return (
              <div className="text-sm pt-2 border-t">
                <p className="font-semibold mb-1">Débitos calculados:</p>
                <p className="text-blue-600">
                  ICMS: R$ {formatBRL(icmsCalc)} | PIS: R$ {formatBRL(pisCalc)} | COFINS: R$ {formatBRL(cofinsCalc)}
                </p>
                <p className="text-blue-600">Total: R$ {formatBRL(totalCalc)}</p>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Créditos sobre Compras */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Créditos sobre Compras</CardTitle>
          <CardDescription>Alíquotas para recuperar créditos do CMV</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ICMS Compra (%)</label>
              <Input value={icmsCompra} onChange={(e) => setIcmsCompra(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PIS Compra (%)</label>
              <Input value={pisCompra} onChange={(e) => setPisCompra(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">COFINS Compra (%)</label>
              <Input value={cofinsCompra} onChange={(e) => setCofinsCompra(e.target.value)} />
            </div>
          </div>
          {(() => {
            const compras = parseFloat(cmv) || 0;
            if (compras <= 0) return null;
            const icmsCalc = compras * (parseFloat(icmsCompra) || 0) / 100;
            const pisCalc = compras * (parseFloat(pisCompra) || 0) / 100;
            const cofinsCalc = compras * (parseFloat(cofinsCompra) || 0) / 100;
            const totalCalc = icmsCalc + pisCalc + cofinsCalc;
            return (
              <div className="text-sm pt-2 border-t">
                <p className="font-semibold mb-1">Créditos calculados:</p>
                <p className="text-emerald-600">
                  ICMS: R$ {formatBRL(icmsCalc)} | PIS: R$ {formatBRL(pisCalc)} | COFINS: R$ {formatBRL(cofinsCalc)}
                </p>
                <p className="text-emerald-600">Total de créditos: R$ {formatBRL(totalCalc)}</p>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Despesas Operacionais */}
      <Collapsible open={showDespesas} onOpenChange={setShowDespesas}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Despesas Operacionais</CardTitle>
                <CardDescription>Total: R$ {formatBRL(totalDespesas)}</CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {showDespesas ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Anúncios (R$)</label>
                  <BRLInput prefix="R$" value={anuncios} onChange={setAnuncios} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fretes (R$)</label>
                  <BRLInput prefix="R$" value={fretes} onChange={setFretes} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Folha/Salários (R$)</label>
                  <BRLInput prefix="R$" value={folha} onChange={setFolha} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sistemas (R$)</label>
                  <BRLInput prefix="R$" value={sistemas} onChange={setSistemas} />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contabilidade (R$)</label>
                  <BRLInput prefix="R$" value={contabilidade} onChange={setContabilidade} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Aluguel/Infra (R$)</label>
                  <BRLInput prefix="R$" value={aluguel} onChange={setAluguel} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Outras Despesas (R$)</label>
                  <BRLInput prefix="R$" value={outrasDespesas} onChange={setOutrasDespesas} />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Prejuízo Fiscal Acumulado */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Prejuízo Fiscal Acumulado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">Prejuízo Fiscal Acumulado (R$)</label>
            <BRLInput prefix="R$" value={prejuizoAcumulado} onChange={setPrejuizoAcumulado} />
          </div>
        </CardContent>
      </Card>


      {/* Resultados */}
      {result && (
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-orange-700">Resultados</CardTitle>
            <CardDescription>Impostos calculados para Lucro Real</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* DRE Breakdown */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between py-1"><span>Faturamento Bruto</span><span className="font-semibold">R$ {formatBRL(result.fat)}</span></div>
              <div className="flex justify-between py-1 text-destructive"><span>(-) Impostos sobre vendas (ICMS, PIS, COFINS)</span><span>R$ {formatBRL(result.totalDebitos)}</span></div>
              <hr />
              <div className="flex justify-between py-1 font-semibold"><span>= Receita Líquida</span><span className="text-blue-600">R$ {formatBRL(result.receitaLiquida)}</span></div>
              <div className="flex justify-between py-1 text-emerald-600"><span>(-) CMV Líquido (após créditos)</span><span>R$ {formatBRL(result.cmvLiquido)}</span></div>
              <hr />
              <div className="flex justify-between py-1 font-semibold"><span>= Lucro Bruto</span><span>R$ {formatBRL(result.lucroBruto)}</span></div>
              <div className="flex justify-between py-1 text-destructive"><span>(-) Despesas Operacionais</span><span>R$ {formatBRL(result.totalDespesas)}</span></div>
              <hr />
              <div className="flex justify-between py-1 font-semibold"><span>= Lucro Líquido</span><span>R$ {formatBRL(result.lucroLiquido)}</span></div>
              {result.prejuizoCompensado > 0 && (
                <div className="flex justify-between py-1 text-purple-600"><span>(-) Prejuízo compensado (máx 30%)</span><span>R$ {formatBRL(result.prejuizoCompensado)}</span></div>
              )}
              <div className="flex justify-between py-1 font-semibold"><span>= Lucro Ajustado (Base IR/CSLL)</span><span>R$ {formatBRL(result.lucroAjustado)}</span></div>
            </div>

            {/* Tax Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-background rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground">IRPJ (15%)</p>
                <p className="text-lg font-bold text-orange-600">R$ {formatBRL(result.irpj)}</p>
              </div>
              <div className="bg-background rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground">CSLL (9%)</p>
                <p className="text-lg font-bold text-blue-600">R$ {formatBRL(result.csll)}</p>
              </div>
              <div className="bg-background rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground">ICMS a Recolher</p>
                <p className="text-lg font-bold text-purple-600">R$ {formatBRL(result.icmsRecolher)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground">PIS Líquido</p>
                <p className="text-lg font-bold text-teal-600">R$ {formatBRL(result.pisLiquido)}</p>
              </div>
              <div className="bg-background rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground">COFINS Líquido</p>
                <p className="text-lg font-bold text-emerald-600">R$ {formatBRL(result.cofinsLiquido)}</p>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center bg-orange-100/80 rounded-lg px-4 py-3 border border-orange-200">
              <span className="font-semibold">Total de Impostos a Recolher</span>
              <span className="text-2xl font-extrabold text-orange-700">R$ {formatBRL(result.totalImpostosRecolher)}</span>
            </div>

            {/* Carga Efetiva */}
            <div className="flex justify-between items-center bg-background rounded-lg px-4 py-2.5 border">
              <span className="font-semibold">Carga Efetiva</span>
              <span className="text-xl font-bold text-emerald-600">{result.cargaEfetiva.toFixed(2)}%</span>
            </div>

            {/* Resultado Final */}
            <div className="flex justify-between items-center bg-emerald-50 rounded-lg px-4 py-3 border border-emerald-200">
              <span className="font-semibold">Resultado Final (após IR/CSLL)</span>
              <span className="text-2xl font-extrabold text-emerald-700">R$ {formatBRL(result.resultadoFinal)}</span>
            </div>

            {/* Detalhamento Completo */}
            <Collapsible open={showDetalhamento} onOpenChange={setShowDetalhamento}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <Info className="h-4 w-4" /> Detalhamento Completo {showDetalhamento ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 space-y-4 text-sm border rounded-lg p-4">
                  {/* 1. Débitos */}
                  <div>
                    <p className="font-semibold text-orange-700 mb-1">1. Impostos sobre Vendas (Débitos):</p>
                    <p className="text-muted-foreground">ICMS: R$ {formatBRL(result.fat)} × {icmsVenda}% = <strong>R$ {formatBRL(result.icmsVendaVal)}</strong></p>
                    <p className="text-muted-foreground">PIS: R$ {formatBRL(result.fat)} × {pisVenda}% = <strong>R$ {formatBRL(result.pisVendaVal)}</strong></p>
                    <p className="text-muted-foreground">COFINS: R$ {formatBRL(result.fat)} × {cofinsVenda}% = <strong>R$ {formatBRL(result.cofinsVendaVal)}</strong></p>
                    <p className="font-semibold text-destructive">Total Débitos: R$ {formatBRL(result.totalDebitos)}</p>
                  </div>

                  {/* 2. Receita Líquida */}
                  <div>
                    <p className="font-semibold text-blue-700 mb-1">2. Receita Líquida:</p>
                    <p className="text-muted-foreground">R$ {formatBRL(result.fat)} - R$ {formatBRL(result.totalDebitos)} = <strong className="text-blue-600">R$ {formatBRL(result.receitaLiquida)}</strong></p>
                  </div>

                  {/* 3. Créditos */}
                  <div>
                    <p className="font-semibold text-emerald-700 mb-1">3. Créditos sobre Compras:</p>
                    <p className="text-muted-foreground">ICMS: R$ {formatBRL(result.compras)} × {icmsCompra}% = <strong>R$ {formatBRL(result.icmsCompraVal)}</strong></p>
                    <p className="text-muted-foreground">PIS: R$ {formatBRL(result.compras)} × {pisCompra}% = <strong>R$ {formatBRL(result.pisCompraVal)}</strong></p>
                    <p className="text-muted-foreground">COFINS: R$ {formatBRL(result.compras)} × {cofinsCompra}% = <strong>R$ {formatBRL(result.cofinsCompraVal)}</strong></p>
                    <p className="font-semibold text-emerald-600">Total Créditos: R$ {formatBRL(result.totalCreditos)}</p>
                  </div>

                  {/* 4. CMV Líquido */}
                  <div>
                    <p className="font-semibold text-purple-700 mb-1">4. CMV Líquido:</p>
                    <p className="text-muted-foreground">R$ {formatBRL(result.compras)} - R$ {formatBRL(result.totalCreditos)} = <strong>R$ {formatBRL(result.cmvLiquido)}</strong></p>
                  </div>

                  {/* 5. Lucro Bruto */}
                  <div>
                    <p className="font-semibold text-blue-700 mb-1">5. Lucro Bruto:</p>
                    <p className="text-muted-foreground">R$ {formatBRL(result.receitaLiquida)} - R$ {formatBRL(result.cmvLiquido)} = <strong>R$ {formatBRL(result.lucroBruto)}</strong></p>
                  </div>

                  {/* 6. Lucro Líquido */}
                  <div>
                    <p className="font-semibold text-emerald-700 mb-1">6. Lucro Líquido:</p>
                    <p className="text-muted-foreground">R$ {formatBRL(result.lucroBruto)} - R$ {formatBRL(result.totalDespesas)} = <strong>R$ {formatBRL(result.lucroLiquido)}</strong></p>
                  </div>

                  {/* 7. IR e CSLL */}
                  <div>
                    <p className="font-semibold text-orange-700 mb-1">7. IR e CSLL (sobre Lucro Ajustado: R$ {formatBRL(result.lucroAjustado)}):</p>
                    <p className="text-muted-foreground">IRPJ: R$ {formatBRL(result.lucroAjustado)} × 15% = <strong>R$ {formatBRL(result.irpj)}</strong></p>
                    {result.adicionalIR > 0 && (
                      <p className="text-muted-foreground">Adicional IR: (R$ {formatBRL(result.lucroAjustado)} - R$ 20.000,00) × 10% = <strong>R$ {formatBRL(result.adicionalIR)}</strong></p>
                    )}
                    <p className="text-muted-foreground">CSLL: R$ {formatBRL(result.lucroAjustado)} × 9% = <strong>R$ {formatBRL(result.csll)}</strong></p>
                  </div>

                  {/* 8. Impostos a Recolher */}
                  <div>
                    <p className="font-semibold text-destructive mb-1">8. Impostos a Recolher (Débito - Crédito):</p>
                    <p className="text-muted-foreground">ICMS: R$ {formatBRL(result.icmsVendaVal)} - R$ {formatBRL(result.icmsCompraVal)} = <strong>R$ {formatBRL(result.icmsRecolher)}</strong></p>
                    <p className="text-muted-foreground">PIS: R$ {formatBRL(result.pisVendaVal)} - R$ {formatBRL(result.pisCompraVal)} = <strong>R$ {formatBRL(result.pisLiquido)}</strong></p>
                    <p className="text-muted-foreground">COFINS: R$ {formatBRL(result.cofinsVendaVal)} - R$ {formatBRL(result.cofinsCompraVal)} = <strong>R$ {formatBRL(result.cofinsLiquido)}</strong></p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Comparar Regimes Tributários */}
      <CompararRegimesLucroRealCard
        fatBruto={fatBruto}
        cmv={cmv}
        icmsVenda={icmsVenda}
        pisVenda={pisVenda}
        cofinsVenda={cofinsVenda}
        icmsCompra={icmsCompra}
        pisCompra={pisCompra}
        cofinsCompra={cofinsCompra}
        totalDespesas={totalDespesas}
      />
    </div>
  );
}


/* ══════════════════════════════════════════ */
const ufs = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const aliqInternas: Record<string, number> = {
  AC:19,AL:19,AM:20,AP:18,BA:20.5,CE:20,DF:20,ES:17,GO:19,MA:22,MG:18,MS:17,MT:17,PA:19,PB:20,PE:20.5,PI:21,PR:19.5,RJ:22,RN:20,RO:19.5,RR:20,RS:17,SC:17,SE:19,SP:18,TO:20
};

function getAliqInterestadual(ufOrigem: string, ufDestino: string) {
  if (!ufOrigem || !ufDestino || ufOrigem === ufDestino) return 0;
  const sulSudeste = ["SP","RJ","MG","ES","PR","SC","RS"];
  const isSulSudesteOrigem = sulSudeste.includes(ufOrigem);
  const isSulSudesteDestino = sulSudeste.includes(ufDestino);
  if (isSulSudesteOrigem && !isSulSudesteDestino) return 7;
  return 12;
}

function TabDIFAL() {
  const [ufOrigem, setUfOrigem] = useState("SP");
  const [ufDestino, setUfDestino] = useState("");
  const [valor, setValor] = useState("0.00");
  const [aliqInter, setAliqInter] = useState("12");
  const [aliqInterna, setAliqInterna] = useState("18.00");
  const [fcp, setFcp] = useState("2.00");
  const [consumidorFinal, setConsumidorFinal] = useState(true);
  const [destinatarioContribuinte, setDestinatarioContribuinte] = useState(false);
  const [regime, setRegime] = useState("presumido");
  const [result, setResult] = useState<any>(null);

  // Auto-calculate when inputs change
  useEffect(() => {
    const v = parseFloat(valor) || 0;
    const inter = parseFloat(aliqInter) || 0;
    const interna = parseFloat(aliqInterna) || 0;
    const fcpVal = parseFloat(fcp) || 0;
    if (v <= 0 || !ufDestino) { setResult(null); return; }
    const dif = interna - inter;
    const difal = v * (dif / 100);
    const fcpTotal = v * (fcpVal / 100);
    const total = difal + fcpTotal;
    setResult({ difal, fcpTotal, total, dif, inter, interna, fcpPerc: fcpVal });
  }, [valor, aliqInter, aliqInterna, fcp, ufDestino]);

  // Auto-fill aliquotas when UFs change
  const handleUfOrigemChange = (uf: string) => {
    setUfOrigem(uf);
    if (ufDestino) {
      setAliqInter(String(getAliqInterestadual(uf, ufDestino)));
    }
  };

  const handleUfDestinoChange = (uf: string) => {
    setUfDestino(uf);
    setAliqInterna(String(aliqInternas[uf] ?? 18));
    if (ufOrigem) {
      setAliqInter(String(getAliqInterestadual(ufOrigem, uf)));
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-purple-100">
          <ArrowLeftRight className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">DIFAL (ICMS)</h2>
          <p className="text-sm text-muted-foreground">Diferencial de Alíquota</p>
        </div>
      </div>

      {/* Entradas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Entradas</CardTitle>
          <CardDescription>Informe os dados da operação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* UF Origem / Destino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">UF de Origem</label>
              <Select value={ufOrigem} onValueChange={handleUfOrigemChange}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {ufs.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">UF de Destino</label>
              <Select value={ufDestino} onValueChange={handleUfDestinoChange}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {ufs.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valor da Mercadoria */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor da Mercadoria (R$)</label>
            <BRLInput prefix="R$" value={valor} onChange={setValor} />
          </div>

          {/* Alíquotas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Alíquota Interestadual (%)</label>
              <div className="flex gap-2">
                <Select value={aliqInter} onValueChange={setAliqInter}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4%</SelectItem>
                    <SelectItem value="7">7%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Alíquota Interna do Destino (%)</label>
              <div className="flex items-center gap-1">
                <Input value={aliqInterna} onChange={(e) => setAliqInterna(e.target.value)} />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">FCP do Destino (%)</label>
              <div className="flex items-center gap-1">
                <Input value={fcp} onChange={(e) => setFcp(e.target.value)} />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Operação para Consumidor Final?</p>
                <p className="text-xs text-muted-foreground">DIFAL aplica-se a consumidores finais</p>
              </div>
              <button
                onClick={() => setConsumidorFinal(!consumidorFinal)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${consumidorFinal ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${consumidorFinal ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Destinatário é Contribuinte de ICMS?</p>
                <p className="text-xs text-muted-foreground">Contribuintes têm regras diferentes</p>
              </div>
              <button
                onClick={() => setDestinatarioContribuinte(!destinatarioContribuinte)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${destinatarioContribuinte ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${destinatarioContribuinte ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>

          {/* Regime do Remetente */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Regime do Remetente</label>
            <Select value={regime} onValueChange={setRegime}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simples">Simples Nacional</SelectItem>
                <SelectItem value="presumido">Lucro Presumido</SelectItem>
                <SelectItem value="real">Lucro Real</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Warning banner for contribuinte */}
      {destinatarioContribuinte && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            Contribuinte de ICMS: em geral DIFAL não se aplica (confira a regra/nota da operação).
          </p>
        </div>
      )}

      {/* Placeholder / CTA */}
      {!result && !destinatarioContribuinte && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <ArrowLeftRight className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">Preencha o valor da mercadoria e os estados para calcular</p>
        </div>
      )}

      {/* DIFAL Não Aplicável (contribuinte) */}
      {result && destinatarioContribuinte && (
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
              <Info className="h-5 w-5 text-yellow-500" />
              DIFAL Não Aplicável
            </CardTitle>
            <CardDescription>Destinatário é contribuinte de ICMS, em geral DIFAL não se aplica.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">DIFAL (%)</p>
                <p className="text-lg font-bold text-muted-foreground">0,00%</p>
              </div>
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-blue-600 mb-1">DIFAL (R$)</p>
                <p className="text-lg font-bold text-muted-foreground">R$ 0,00</p>
              </div>
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-purple-600 mb-1">FCP (R$)</p>
                <p className="text-lg font-bold text-muted-foreground">R$ 0,00</p>
              </div>
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Total a Recolher</p>
                <p className="text-lg font-bold text-muted-foreground">R$ 0,00</p>
              </div>
            </div>
            <Collapsible>
              <CollapsibleTrigger className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground border rounded-lg bg-white transition-colors">
                <Info className="h-4 w-4" />
                Detalhamento do Cálculo
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="bg-white rounded-lg border p-4 text-sm text-muted-foreground text-center py-6">
                  DIFAL não aplicável para contribuintes de ICMS nesta operação.
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* DIFAL Aplicável - Cards */}
      {result && !destinatarioContribuinte && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              DIFAL Aplicável
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">DIFAL (%)</p>
                <p className="text-lg font-bold text-foreground">{result.dif.toFixed(2)}%</p>
              </div>
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-blue-600 mb-1">DIFAL (R$)</p>
                <p className="text-lg font-bold text-foreground">R$ {formatBRL(result.difal)}</p>
              </div>
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-purple-600 mb-1">FCP (R$)</p>
                <p className="text-lg font-bold text-foreground">R$ {formatBRL(result.fcpTotal)}</p>
              </div>
              <div className="bg-white rounded-lg border border-green-200 p-3">
                <p className="text-xs text-green-600 mb-1">Total a Recolher</p>
                <p className="text-lg font-bold text-green-700">R$ {formatBRL(result.total)}</p>
              </div>
            </div>
            <Collapsible>
              <CollapsibleTrigger className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground border rounded-lg bg-white transition-colors">
                <Info className="h-4 w-4" />
                Detalhamento do Cálculo
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="bg-white rounded-lg border p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Alíquota interestadual</span><strong>{result.inter}%</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Alíquota interna destino</span><strong>{result.interna}%</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Diferença de alíquota</span><strong>{result.dif.toFixed(1)}%</strong></div>
                  <hr />
                  <div className="flex justify-between"><span className="text-muted-foreground">Base de cálculo</span><strong>R$ {formatBRL(parseFloat(valor) || 0)}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">DIFAL ({result.dif.toFixed(1)}%)</span><strong>R$ {formatBRL(result.difal)}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">FCP ({result.fcpPerc}%)</span><strong>R$ {formatBRL(result.fcpTotal)}</strong></div>
                  <hr />
                  <div className="flex justify-between items-center text-base">
                    <span className="font-semibold">Total a recolher</span>
                    <span className="text-xl font-extrabold text-green-700">R$ {formatBRL(result.total)}</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Comparar Regimes Tributários */}
      {result && !destinatarioContribuinte && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
              <BarChart3 className="h-5 w-5" />
              Comparar Regimes Tributários
            </CardTitle>
            <CardDescription>Compare Simples Nacional x Lucro Presumido x Lucro Real com estes dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Informe o RBT12 para comparar" />
              </SelectTrigger>
              <SelectContent>
                {["180000","360000","540000","720000","900000","1080000","1260000","1440000","1620000","1800000","2340000","2700000","3060000","3420000","3600000"].map(v => (
                  <SelectItem key={v} value={v}>R$ {formatBRL(parseFloat(v))}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold">
              <BarChart3 className="h-4 w-4 mr-2" />
              Comparar Simples x Presumido x Real
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lembrete */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-800">
          <strong className="text-red-600">Lembrete:</strong> ICMS e DIFAL variam por UF e tipo de operação. Confira a regra do seu estado e o CFOP da nota fiscal.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════ */
/* ── Qual Melhor Regime ── */
/* ══════════════════════════════════════════ */
function TabMelhorRegime({ initialFat, initialIcms }: { initialFat?: string; initialIcms?: string }) {
  const [modoAvancado, setModoAvancado] = useState(false);
  const [fatMes, setFatMes] = useState(initialFat || "0.00");
  const [rbt12, setRbt12] = useState("0.00");
  const [tipo, setTipo] = useState("comercio");
  const [icmsSaida, setIcmsSaida] = useState(initialIcms || "18");
  // Lucro Real extras
  const [cmv, setCmv] = useState("0.00");
  const [despOp, setDespOp] = useState("0.00");
  const [investAnuncios, setInvestAnuncios] = useState("0.00");
  const [temCreditos, setTemCreditos] = useState(false);
  const [creditosPIS, setCreditosPIS] = useState("0.00");
  const [creditosCOFINS, setCreditosCOFINS] = useState("0.00");
  const [percNFEntrada, setPercNFEntrada] = useState("100");
  // DIFAL
  const [percVendasInterestaduais, setPercVendasInterestaduais] = useState("0");
  const [aliqInterna, setAliqInterna] = useState("18");
  const [aliqInterestadual, setAliqInterestadual] = useState("12%");
  const [fcpMedio, setFcpMedio] = useState("2");

  const [result, setResult] = useState<any>(null);
  const [openLR, setOpenLR] = useState(true);
  const [openDifal, setOpenDifal] = useState(false);
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});

  const creditosHabilitadosSemValor = temCreditos && (parseFloat(creditosPIS) || 0) === 0 && (parseFloat(creditosCOFINS) || 0) === 0;

  const handleCalc = () => {
    const mensal = parseFloat(fatMes) || 0;
    const rbt12Val = parseFloat(rbt12) || 0;
    const anual = rbt12Val > 0 ? rbt12Val : mensal * 12;
    if (mensal <= 0 && anual <= 0) return;
    const fatAnual = anual > 0 ? anual : mensal * 12;

    // Simples Nacional
    const snResult = calcSN(fatAnual, mensal);
    const snMensal = snResult.imposto;
    const faixaObj = (faixasSNByAnexo["1"]).find((f) => fatAnual <= f.max) ?? faixasSN_I[faixasSN_I.length - 1];

    // Lucro Presumido
    const presuncao = tipo === "servicos" ? 32 : 8;
    const basePresuncaoMes = mensal * (presuncao / 100);
    const irpjLP = basePresuncaoMes * 0.15;
    const csllLP = basePresuncaoMes * (tipo === "servicos" ? 0.32 : 0.12) * 0.09 / (presuncao / 100);
    const csllLPCalc = mensal * (tipo === "servicos" ? 0.32 : 0.12) * 0.09;
    const pisLP = mensal * 0.0065;
    const cofinsLP = mensal * 0.03;
    const icmsLP = mensal * (parseFloat(icmsSaida) / 100 || 0);
    const lpMensal = irpjLP + csllLPCalc + pisLP + cofinsLP + icmsLP;

    // Lucro Real
    const cmvVal = parseFloat(cmv) || 0;
    const despVal = parseFloat(despOp) || 0;
    const investVal = parseFloat(investAnuncios) || 0;
    const credPIS = temCreditos ? (parseFloat(creditosPIS) || 0) : 0;
    const credCOF = temCreditos ? (parseFloat(creditosCOFINS) || 0) : 0;
    const nfPerc = parseFloat(percNFEntrada) / 100 || 1;
    const lucroBaseMes = mensal - cmvVal - despVal - investVal;
    const irpjLR = Math.max(lucroBaseMes * 0.15, 0);
    const csllLR = Math.max(lucroBaseMes * 0.09, 0);
    const pisLR = Math.max(mensal * 0.0165 - credPIS * nfPerc, 0);
    const cofinsLR = Math.max(mensal * 0.076 - credCOF * nfPerc, 0);
    const icmsLR = mensal * (parseFloat(icmsSaida) / 100 || 0);
    const lrMensal = irpjLR + csllLR + pisLR + cofinsLR + icmsLR;

    // DIFAL estimado
    let difalMensal = 0;
    const percInter = parseFloat(percVendasInterestaduais) / 100 || 0;
    if (percInter > 0) {
      const aInt = parseFloat(aliqInterna) || 0;
      const aInter = parseFloat(aliqInterestadual.replace("%", "")) || 0;
      const fcpV = parseFloat(fcpMedio) || 0;
      difalMensal = mensal * percInter * ((aInt - aInter + fcpV) / 100);
    }

    const options = [
      {
        name: "Simples Nacional", value: snMensal + difalMensal, base: snMensal, difal: difalMensal,
        color: "bg-emerald-500", borderColor: "border-emerald-500", textColor: "text-emerald-700", bgColor: "bg-emerald-100",
        numColor: "bg-emerald-500",
        details: {
          rbt12: formatBRL(fatAnual),
          faixa: `Até R$ ${formatBRL(faixaObj.max)}`,
          aliqNominal: `${snResult.aliqNominal}%`,
          deducao: formatBRL(snResult.ded),
          aliqEfetiva: `${snResult.aliqEfetiva.toFixed(2)}%`,
          das: formatBRL(snMensal),
        },
      },
      {
        name: "Lucro Presumido", value: lpMensal + difalMensal, base: lpMensal, difal: difalMensal,
        color: "bg-blue-500", borderColor: "border-blue-500", textColor: "text-blue-700", bgColor: "bg-blue-100",
        numColor: "bg-blue-500",
        details: {
          basePresuncao: formatBRL(basePresuncaoMes),
          irpj: formatBRL(irpjLP),
          csll: formatBRL(csllLPCalc),
          pis: formatBRL(pisLP),
          cofins: formatBRL(cofinsLP),
          icms: formatBRL(icmsLP),
          total: formatBRL(lpMensal),
        },
      },
      {
        name: "Lucro Real", value: lrMensal + difalMensal, base: lrMensal, difal: difalMensal,
        color: "bg-amber-500", borderColor: "border-amber-500", textColor: "text-amber-700", bgColor: "bg-amber-100",
        numColor: "bg-amber-500",
        details: {
          lucroBase: formatBRL(lucroBaseMes),
          irpj: formatBRL(irpjLR),
          csll: formatBRL(csllLR),
          pis: formatBRL(pisLR),
          cofins: formatBRL(cofinsLR),
          icms: formatBRL(icmsLR),
          total: formatBRL(lrMensal),
        },
      },
    ];

    const sorted = [...options].sort((a, b) => a.value - b.value);
    const melhor = sorted[0];
    const segundo = sorted[1];
    const economia = segundo.value - melhor.value;

    setResult({ options: sorted, melhor: melhor.name, economia, segundo: segundo.name });
  };




  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-100">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Qual Melhor Regime?</h2>
            <p className="text-sm text-muted-foreground">Simples × Presumido × Real</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setModoAvancado(!modoAvancado)}>
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Modo Avançado
        </Button>
      </div>

      {/* Warning banner */}
      {creditosHabilitadosSemValor && (
        <div className="rounded-lg bg-orange-100 border border-orange-300 px-4 py-2.5 flex items-center gap-2">
          <span className="text-orange-600 font-bold text-sm">⊘</span>
          <p className="text-sm text-orange-800">Você habilitou créditos, mas não informou os valores.</p>
        </div>
      )}

      {/* Dados do Faturamento */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Dados do Faturamento</CardTitle>
          <CardDescription>Campos obrigatórios para comparação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Faturamento do Mês (R$) *</label>
              <BRLInput prefix="R$" value={fatMes} onChange={setFatMes} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">RBT12 - Receita Bruta Últimos 12 Meses (R$) *</label>
              <BRLInput prefix="R$" value={rbt12} onChange={setRbt12} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Atividade Principal *</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="comercio">Comércio / E-commerce</SelectItem>
                  <SelectItem value="servicos">Serviços</SelectItem>
                  <SelectItem value="transporte">Transporte</SelectItem>
                  <SelectItem value="industria">Indústria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ICMS Médio de Saída (%)</label>
              <Input value={icmsSaida} onChange={(e) => setIcmsSaida(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Lucro Real (Opcional) */}
      <Collapsible open={openLR} onOpenChange={setOpenLR}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Dados para Lucro Real (Opcional)</CardTitle>
                  <CardDescription>Preencha para comparar com Lucro Real</CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openLR ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-5 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">CMV do Mês (R$)</label>
                  <BRLInput prefix="R$" value={cmv} onChange={setCmv} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Despesas Operacionais (R$)</label>
                  <BRLInput prefix="R$" value={despOp} onChange={setDespOp} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Investimento em Anúncios (R$)</label>
                  <BRLInput prefix="R$" value={investAnuncios} onChange={setInvestAnuncios} />
                </div>
              </div>

              {/* Créditos PIS/COFINS toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Tem créditos de PIS/COFINS?</p>
                  <p className="text-xs text-muted-foreground">Habilite para informar os créditos</p>
                </div>
                <Switch checked={temCreditos} onCheckedChange={setTemCreditos} />
              </div>

              {temCreditos && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Créditos PIS (R$)</label>
                      <Input value={creditosPIS} onChange={(e) => setCreditosPIS(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Créditos COFINS (R$)</label>
                      <Input value={creditosCOFINS} onChange={(e) => setCreditosCOFINS(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">% das Compras com Nota Fiscal de Entrada Correta</label>
                    <Input value={percNFEntrada} onChange={(e) => setPercNFEntrada(e.target.value)} />
                    <p className="text-xs text-orange-600">Impacta diretamente a viabilidade do Lucro Real</p>
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* DIFAL Estimado */}
      <Collapsible open={openDifal} onOpenChange={setOpenDifal}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">DIFAL Estimado (E-commerce)</CardTitle>
                  <CardDescription>Para vendas interestaduais B2C</CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openDifal ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
           <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">% de Vendas Interestaduais B2C</label>
                  <Input value={percVendasInterestaduais} onChange={(e) => setPercVendasInterestaduais(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Consumidor final não contribuinte</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Alíquota Interna Média Destino (%)</label>
                  <Input value={aliqInterna} onChange={(e) => setAliqInterna(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Alíquota Interestadual Média (%)</label>
                  <Select value={aliqInterestadual} onValueChange={setAliqInterestadual}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4%">4%</SelectItem>
                      <SelectItem value="7%">7%</SelectItem>
                      <SelectItem value="12%">12%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">FCP Médio (%)</label>
                  <Input value={fcpMedio} onChange={(e) => setFcpMedio(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Botão + Resultado */}
      {!result ? (
        <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
          <BarChart3 className="h-10 w-10 opacity-30" />
          <p className="text-sm">Preencha faturamento e RBT12 para comparar os regimes</p>
          <Button onClick={handleCalc} className="gap-2 mt-2" size="lg">
            <BarChart3 className="h-4 w-4" /> Comparar Regimes
          </Button>
        </div>
      ) : (
        <>
          <Button onClick={handleCalc} variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Recalcular
          </Button>

          {/* Ranking - Menor Custo */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <div>
                  <CardTitle className="text-lg font-bold">Ranking - Menor Custo</CardTitle>
                  <CardDescription>Comparação dos regimes tributários</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.options.map((regime: any, idx: number) => {
                const isMelhor = idx === 0;
                const perc = regime.value > 0 && (parseFloat(fatMes) || 0) > 0 ? ((regime.value / (parseFloat(fatMes) || 1)) * 100).toFixed(2) : "0.00";
                const isOpen = openDetails[regime.name] || false;

                return (
                  <div key={regime.name} className={`rounded-lg border ${isMelhor ? `border-2 ${regime.borderColor}` : "border"} overflow-hidden`}>
                    {/* Regime header */}
                    <div className={`p-4 ${isMelhor ? "bg-card" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full ${regime.numColor} text-white flex items-center justify-center text-sm font-bold`}>
                            {idx + 1}
                          </div>
                          <div>
                            <span className="font-semibold text-sm">{regime.name}</span>
                            {isMelhor && (
                              <>
                                <div className="mt-0.5">
                                  <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">MELHOR NO MÊS</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Economia de R$ {formatBRL(result.economia)} vs {result.segundo}
                                </p>
                                {regime.name === "Simples Nacional" && (
                                  <p className="text-[10px] text-muted-foreground italic">DAS efetivo fica menor que a soma do presumido/real.</p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">R$ {formatBRL(regime.value)}</p>
                          <p className="text-xs text-muted-foreground">{perc}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible details */}
                    <Collapsible open={isOpen} onOpenChange={(v) => setOpenDetails((prev) => ({ ...prev, [regime.name]: v }))}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground hover:bg-muted/40 transition-colors border-t">
                          <HelpCircle className="h-3 w-3" />
                          Ver detalhes do {regime.name}
                          <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-2 text-sm space-y-1 bg-muted/20">
                          {regime.name === "Simples Nacional" && regime.details && (
                            <>
                              <p><strong>RBT12:</strong> R$ {regime.details.rbt12}</p>
                              <p><strong>Faixa:</strong> {regime.details.faixa}</p>
                              <p><strong>Alíquota Nominal:</strong> {regime.details.aliqNominal}</p>
                              <p><strong>Dedução:</strong> R$ {regime.details.deducao}</p>
                              <p><strong>Alíquota Efetiva:</strong> {regime.details.aliqEfetiva}</p>
                              <p><strong>DAS:</strong> R$ {regime.details.das}</p>
                            </>
                          )}
                          {regime.name === "Lucro Presumido" && regime.details && (
                            <>
                              <p><strong>Base Presunção:</strong> R$ {regime.details.basePresuncao}</p>
                              <p><strong>IRPJ:</strong> R$ {regime.details.irpj}</p>
                              <p><strong>CSLL:</strong> R$ {regime.details.csll}</p>
                              <p><strong>PIS:</strong> R$ {regime.details.pis}</p>
                              <p><strong>COFINS:</strong> R$ {regime.details.cofins}</p>
                              <p><strong>ICMS:</strong> R$ {regime.details.icms}</p>
                              <hr className="my-1" />
                              <p><strong>Total:</strong> R$ {regime.details.total}</p>
                            </>
                          )}
                          {regime.name === "Lucro Real" && regime.details && (
                            <>
                              <p><strong>Lucro Base:</strong> R$ {regime.details.lucroBase}</p>
                              <p><strong>IRPJ:</strong> R$ {regime.details.irpj}</p>
                              <p><strong>CSLL:</strong> R$ {regime.details.csll}</p>
                              <p><strong>PIS:</strong> R$ {regime.details.pis}</p>
                              <p><strong>COFINS:</strong> R$ {regime.details.cofins}</p>
                              <p><strong>ICMS:</strong> R$ {regime.details.icms}</p>
                              <hr className="my-1" />
                              <p><strong>Total:</strong> R$ {regime.details.total}</p>
                            </>
                          )}
                          {regime.difal > 0 && (
                            <p className="text-orange-600"><strong>+ DIFAL:</strong> R$ {formatBRL(regime.difal)}</p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}

      {/* Disclaimer */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs text-amber-800">
          <strong>Importante:</strong> Esta é uma estimativa para fins de planejamento. Valores reais podem variar conforme particularidades do negócio, estado, CNAE e enquadramentos específicos. Consulte sempre um contador.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════ */
/* ── Markup ── */
/* ══════════════════════════════════════════ */
function TabMarkup() {
  const [custo, setCusto] = useState("0.00");
  const [impostos, setImpostos] = useState("8");
  const [despesas, setDespesas] = useState("15");
  const [lucro, setLucro] = useState("20");

  const custoVal = parseFloat(custo) || 0;
  const impVal = parseFloat(impostos) || 0;
  const despVal = parseFloat(despesas) || 0;
  const lucroVal = parseFloat(lucro) || 0;
  const somaPerc = impVal + despVal + lucroVal;
  const markup = somaPerc < 100 ? 100 / (100 - somaPerc) : 0;
  const precoVenda = custoVal * markup;
  const lucroRS = precoVenda > 0 ? precoVenda - custoVal - (precoVenda * impVal / 100) - (precoVenda * despVal / 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-teal-100">
          <Percent className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Calculadora de Markup</h2>
          <p className="text-sm text-muted-foreground">Defina o preço de venda ideal considerando impostos e margem</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Entradas</CardTitle>
          <CardDescription>Informe o custo e os percentuais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Custo do produto (R$)</label>
              <BRLInput prefix="R$" value={custo} onChange={setCusto} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Impostos (%)</label>
              <Input value={impostos} onChange={(e) => setImpostos(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Despesas fixas (%)</label>
              <Input value={despesas} onChange={(e) => setDespesas(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lucro desejado (%)</label>
              <Input value={lucro} onChange={(e) => setLucro(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {custoVal > 0 && markup > 0 && isFinite(markup) && (
        <Card className="border-teal-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4 mb-2">
              <div className="bg-card rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Markup</p>
                <p className="text-lg font-bold text-teal-700">{markup.toFixed(4)}x</p>
              </div>
              <div className="bg-card rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Preço de venda</p>
                <p className="text-lg font-bold text-teal-700">R$ {formatBRL(precoVenda)}</p>
              </div>
              <div className="bg-card rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Lucro (R$)</p>
                <p className="text-lg font-bold text-emerald-600">R$ {formatBRL(lucroRS)}</p>
              </div>
            </div>

            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span>Custo</span><strong>R$ {formatBRL(custoVal)}</strong></div>
              <div className="flex justify-between"><span>Impostos ({impVal}%)</span><strong>R$ {formatBRL(precoVenda * impVal / 100)}</strong></div>
              <div className="flex justify-between"><span>Despesas ({despVal}%)</span><strong>R$ {formatBRL(precoVenda * despVal / 100)}</strong></div>
              <div className="flex justify-between"><span>Lucro ({lucroVal}%)</span><strong className="text-emerald-600">R$ {formatBRL(precoVenda * lucroVal / 100)}</strong></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════ */
/* ── PÁGINA PRINCIPAL ── */
/* ══════════════════════════════════════════ */
const calculadoras = [
  { id: "simples", icon: Percent, label: "Simples Nacional", desc: "Calcule o DAS mensal com base no anexo e faturamento", color: "bg-emerald-500", textColor: "text-white" },
  { id: "presumido", icon: FileSpreadsheet, label: "Lucro Presumido", desc: "IRPJ, CSLL, PIS, COFINS para comércio ou serviços", color: "bg-indigo-500", textColor: "text-white" },
  { id: "real", icon: FileSpreadsheet, label: "Lucro Real", desc: "CMV, despesas, créditos PIS/COFINS", color: "bg-emerald-600", textColor: "text-white" },
  { id: "difal", icon: ArrowLeftRight, label: "DIFAL (ICMS)", desc: "Diferencial de alíquota interestadual", color: "bg-purple-500", textColor: "text-white" },
  { id: "markup", icon: TrendingUp, label: "Markup", desc: "Formação de preço com impostos e margem de lucro", color: "bg-teal-500", textColor: "text-white" },
  { id: "comparar", icon: BarChart3, label: "Qual Melhor Regime?", desc: "Simples x Presumido x Real com DIFAL estimado", color: "bg-orange-500", textColor: "text-white" },
];

export default function CalculadorasImpostos() {
  const [active, setActive] = useState("simples");
  const [prefillFat, setPrefillFat] = useState<string | undefined>();
  const [prefillIcms, setPrefillIcms] = useState<string | undefined>();

  const handleCompararFromPresumido = (fat: string, icms: string) => {
    setPrefillFat(fat);
    setPrefillIcms(icms);
    setActive("comparar");
  };

  const renderContent = () => {
    switch (active) {
      case "simples": return <TabSimplesNacional />;
      case "presumido": return <TabLucroPresumido onCompararRegimes={handleCompararFromPresumido} />;
      case "real": return <TabLucroReal />;
      case "difal": return <TabDIFAL />;
      case "markup": return <TabMarkup />;
      case "comparar": return <TabMelhorRegime key={`${prefillFat}-${prefillIcms}`} initialFat={prefillFat} initialIcms={prefillIcms} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header centrado */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="p-3 rounded-xl bg-emerald-100">
          <FileSpreadsheet className="h-7 w-7 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Calculadoras de Impostos</h1>
          <p className="text-sm text-muted-foreground">Simule impostos em diferentes regimes e encontre o melhor para seu negócio</p>
        </div>
      </div>

      {/* Calculator selector - cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {calculadoras.map((calc) => {
          const Icon = calc.icon;
          const isActive = active === calc.id;
          return (
            <button
              key={calc.id}
              onClick={() => setActive(calc.id)}
              className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 text-center
                ${isActive
                  ? "bg-emerald-50 border-emerald-400 shadow-lg ring-2 ring-emerald-200 scale-[1.02]"
                  : "bg-card border-border hover:border-muted-foreground/30 hover:shadow-md"
                }`}
            >
              <div className={`p-2.5 rounded-lg ${calc.color}`}>
                <Icon className={`h-5 w-5 ${calc.textColor}`} />
              </div>
              <div>
                <span className={`text-sm font-bold block ${isActive ? "text-foreground" : "text-foreground"}`}>{calc.label}</span>
                <span className="text-[11px] text-muted-foreground leading-tight block mt-1">{calc.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}
