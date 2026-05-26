import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign, RotateCcw, ScanLine, Info, TrendingUp, TrendingDown, AlertTriangle, AlertCircle, CheckCircle2, Link as LinkIcon, BarChart3, Package, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ── Taxas reais 2026 por marketplace ──
const MARKETPLACES = {
  personalizado: {
    nome: "＋ Criar Marketplace",
    ano: 2026,
    categorias: [{ id: "geral", nome: "Geral", classico: 0, premium: 0 }],
    taxaFixaPorFaixa: [{ min: 0, max: Infinity, taxa: 0 }],
  },
  mercado_livre: {
    nome: "Mercado Livre",
    ano: 2026,
    categorias: [
      { id: "geral", nome: "Geral (Casa, Ferramentas, Brinquedos)", classico: 11, premium: 16 },
      { id: "eletronicos", nome: "Eletrônicos e Informática", classico: 13, premium: 16 },
      { id: "moda", nome: "Moda e Acessórios", classico: 14, premium: 16 },
      { id: "autopecas", nome: "Autopeças", classico: 12, premium: 17 },
      { id: "saude", nome: "Saúde e Beleza", classico: 14, premium: 16 },
      { id: "esporte", nome: "Esportes e Fitness", classico: 12, premium: 16 },
      { id: "alimentos", nome: "Alimentos e Bebidas", classico: 10, premium: 15 },
    ],
    taxaFixaPorFaixa: [
      { min: 0, max: 12.50, taxa: 0, nota: "Isento (mais 50% comissão total)" },
      { min: 12.51, max: 29.00, taxa: 6.25 },
      { min: 29.01, max: 50.00, taxa: 6.50 },
      { min: 50.01, max: 78.99, taxa: 6.75 },
      { min: 79.00, max: Infinity, taxa: 0, nota: "Isento (frete grátis obrigatório)" },
    ],
  },
  shopee: {
    nome: "Shopee",
    ano: 2026,
    categorias: [
      { id: "geral", nome: "Geral", classico: 14, premium: 18 },
      { id: "eletronicos", nome: "Eletrônicos", classico: 14, premium: 18 },
      { id: "moda", nome: "Moda", classico: 16, premium: 20 },
      { id: "automotivo", nome: "Automotivo", classico: 14, premium: 18 },
      { id: "casa", nome: "Casa e Decoração", classico: 14, premium: 18 },
    ],
    taxaFixaPorFaixa: [{ min: 0, max: Infinity, taxa: 4 }],
    taxaTransacao: 2,
  },
  amazon: {
    nome: "Amazon",
    ano: 2026,
    categorias: [
      { id: "outros", nome: "Outros (Padrão)", classico: 15, premium: 15 },
      { id: "eletronicos", nome: "Eletrônicos", classico: 13, premium: 13 },
      { id: "automotivo", nome: "Automotivo/Autopeças", classico: 12, premium: 12 },
      { id: "moda", nome: "Moda", classico: 17, premium: 17 },
      { id: "livros", nome: "Livros", classico: 15, premium: 15 },
      { id: "casa", nome: "Casa e Jardim", classico: 15, premium: 15 },
      { id: "esportes", nome: "Esportes", classico: 15, premium: 15 },
    ],
    taxaFixaPorFaixa: [{ min: 0, max: Infinity, taxa: 0 }],
    comissaoMinima: 2.00,
    planoIndividualTaxa: 2.00,
    planoProfissionalMensal: 19.00,
  },
  tiktok_shop: {
    nome: "TikTok Shop",
    ano: 2026,
    categorias: [
      { id: "geral", nome: "Geral", classico: 6, premium: 6 },
      { id: "moda", nome: "Moda e Beleza", classico: 6, premium: 6 },
      { id: "eletronicos", nome: "Eletrônicos", classico: 6, premium: 6 },
    ],
    taxaFixaPorFaixa: [{ min: 0, max: 79, taxa: 2 }, { min: 79, max: Infinity, taxa: 0 }],
    taxaTransacao: 0,
  },
  shein: {
    nome: "Shein",
    ano: 2026,
    categorias: [
      { id: "geral", nome: "Geral", classico: 10, premium: 14 },
      { id: "moda", nome: "Moda", classico: 12, premium: 16 },
      { id: "acessorios", nome: "Acessórios", classico: 10, premium: 14 },
    ],
    taxaFixaPorFaixa: [{ min: 0, max: Infinity, taxa: 0 }],
  },
  magalu: {
    nome: "Magalu",
    ano: 2026,
    categorias: [
      { id: "geral", nome: "Geral", classico: 16, premium: 16 },
      { id: "eletronicos", nome: "Eletrônicos", classico: 14, premium: 14 },
      { id: "moda", nome: "Moda e Acessórios", classico: 18, premium: 18 },
      { id: "automotivo", nome: "Automotivo", classico: 14, premium: 14 },
      { id: "casa", nome: "Casa e Decoração", classico: 16, premium: 16 },
      { id: "esportes", nome: "Esportes", classico: 16, premium: 16 },
    ],
    taxaFixaPorFaixa: [{ min: 0, max: Infinity, taxa: 5 }],
  },
};

type MarketplaceKey = keyof typeof MARKETPLACES | string;

interface SavedMarketplace {
  nome: string;
  comissao: number;
  taxaTransacao: number;
  taxaFixa: number;
  imposto: number;
}

const STORAGE_KEY = "custom_marketplaces";

function loadSavedMarketplaces(): Record<string, SavedMarketplace> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveSavedMarketplaces(data: Record<string, SavedMarketplace>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function InfoIcon({ tip }: { tip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground inline-block ml-1 cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{tip}</TooltipContent>
    </Tooltip>
  );
}

interface Resultado {
  precoVenda: number;
  comissaoValor: number;
  taxaFixaValor: number;
  taxaTransacaoValor: number;
  freteValor: number;
  adsValor: number;
  impostoValor: number;
  custoTotal: number;
  lucroLiquido: number;
  margemLiquida: number;
  roiPercentual: number;
}

interface ResultadoReversa {
  custoMaximo: number;
  precoConcorrente: number;
  margemDesejada: number;
  lucroEstimado: number;
  comissaoValor: number;
  taxaFixaValor: number;
  taxaTransacaoValor: number;
  impostoValor: number;
  adsValor: number;
  embalagemValor: number;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const parseNum = (v: string) => parseFloat(v.replace(",", ".")) || 0;

function detectMarketplaceFromUrl(url: string): { key: MarketplaceKey; nome: string } | null {
  const lower = url.toLowerCase();
  if (lower.includes("mercadolivre.com") || lower.includes("mercadolibre.com") || lower.includes("mlb"))
    return { key: "mercado_livre", nome: "Mercado Livre" };
  if (lower.includes("shopee.com")) return { key: "shopee", nome: "Shopee" };
  if (lower.includes("amazon.com")) return { key: "amazon", nome: "Amazon" };
  if (lower.includes("tiktok")) return { key: "tiktok_shop", nome: "TikTok Shop" };
  if (lower.includes("shein.com")) return { key: "shein", nome: "Shein" };
  if (lower.includes("magalu.com") || lower.includes("magazineluiza.com")) return { key: "magalu", nome: "Magalu" };
  return null;
}

// ══════════════════════════════════════
// Tab: Custo
// ══════════════════════════════════════
function TabCusto() {
  const [savedMks, setSavedMks] = useState<Record<string, SavedMarketplace>>(() => loadSavedMarketplaces());
  const [marketplace, setMarketplace] = useState<MarketplaceKey>("mercado_livre");
  const [categoria, setCategoria] = useState("geral");
  const [isPremium, setIsPremium] = useState(false);
  const [comissaoCustom, setComissaoCustom] = useState("");
  const [taxaTransacao, setTaxaTransacao] = useState("");
  const [taxaFixa, setTaxaFixa] = useState("0");
  const [imposto, setImposto] = useState("6");
  const [marketingAds, setMarketingAds] = useState("11.7");
  const [frete, setFrete] = useState("0");
  const [mercadoAds, setMercadoAds] = useState("0");
  const [embalagem, setEmbalagem] = useState("0");
  const [nomeCustom, setNomeCustom] = useState("");
  const [custo, setCusto] = useState("");
  const [qtd, setQtd] = useState("1");
  const [margemDesejada, setMargemDesejada] = useState("30");
  const [margemTipo, setMargemTipo] = useState<"percent" | "brl">("percent");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [amazonPlano, setAmazonPlano] = useState<"individual" | "profissional">("individual");
  const [amazonFBA, setAmazonFBA] = useState("");
  const [shopeeFreteGratis, setShopeeFreteGratis] = useState(false);
  const [tiktokNovoVendedor, setTiktokNovoVendedor] = useState(false);
  const [tiktokSFP, setTiktokSFP] = useState(false);
  const [tiktokAfiliados, setTiktokAfiliados] = useState("");
  const [tiktokFrete, setTiktokFrete] = useState("");
  const [sheinIncentivo, setSheinIncentivo] = useState(false);

  const isSavedCustom = !!(marketplace.startsWith("custom_") && savedMks[marketplace]);
  const isCreatingNew = marketplace === "personalizado";

  const mkData = isSavedCustom
    ? {
        nome: savedMks[marketplace].nome,
        ano: 2026,
        categorias: [{ id: "geral", nome: "Geral", classico: savedMks[marketplace].comissao, premium: savedMks[marketplace].comissao }],
        taxaFixaPorFaixa: [{ min: 0, max: Infinity, taxa: savedMks[marketplace].taxaFixa }],
      }
    : MARKETPLACES[marketplace as keyof typeof MARKETPLACES] || MARKETPLACES.personalizado;
  const catData = mkData.categorias.find((c) => c.id === categoria) || mkData.categorias[0];

  const salvarMarketplaceCustom = () => {
    if (!nomeCustom.trim()) { toast.error("Informe o nome do marketplace"); return; }
    const key = "custom_" + nomeCustom.trim().toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    const entry: SavedMarketplace = {
      nome: nomeCustom.trim(),
      comissao: parseNum(comissaoCustom),
      taxaTransacao: parseNum(taxaTransacao),
      taxaFixa: parseNum(taxaFixa),
      imposto: parseNum(imposto),
    };
    const updated = { ...savedMks, [key]: entry };
    saveSavedMarketplaces(updated);
    setSavedMks(updated);
    setMarketplace(key);
    toast.success(`Marketplace "${entry.nome}" salvo com sucesso!`);
  };

  const excluirMarketplaceSalvo = (key: string) => {
    const updated = { ...savedMks };
    delete updated[key];
    saveSavedMarketplaces(updated);
    setSavedMks(updated);
    if (marketplace === key) setMarketplace("mercado_livre");
    toast.success("Marketplace removido");
  };
  const shopeeComissaoEfetiva = shopeeFreteGratis ? 20 : 14;
  const tiktokComissaoBase = tiktokNovoVendedor ? 0 : 6;
  const tiktokSFPTaxa = tiktokSFP ? 6 : 0;
  const tiktokComissaoEfetiva = tiktokComissaoBase + tiktokSFPTaxa;
  const sheinComissaoEfetiva = sheinIncentivo ? 10 : 16;
  const comissaoEfetiva = comissaoCustom !== "" ? parseFloat(comissaoCustom) || 0 : marketplace === "shopee" ? shopeeComissaoEfetiva : marketplace === "tiktok_shop" ? tiktokComissaoEfetiva : marketplace === "shein" ? sheinComissaoEfetiva : isPremium ? catData.premium : catData.classico;
  const txTransacaoEfetiva = taxaTransacao !== "" ? parseFloat(taxaTransacao) || 0 : (mkData as any).taxaTransacao || 0;

  const handleChangeMarketplace = (val: MarketplaceKey) => {
    setMarketplace(val);
    setCategoria(val === "amazon" ? "outros" : "geral");
    setComissaoCustom("");
    setTaxaTransacao("");
    setAmazonPlano("individual");
    setAmazonFBA("");
    setShopeeFreteGratis(false);
    setTiktokNovoVendedor(false);
    setTiktokSFP(false);
    setTiktokAfiliados("");
    setTiktokFrete("");
    setSheinIncentivo(false);
    if (val === "amazon") {
      setTaxaFixa("2");
    } else if (val === "shopee") {
      setTaxaFixa("4");
    } else if (val === "tiktok_shop") {
      setTaxaFixa("2");
    } else {
      setTaxaFixa("19");
    }
    setResultado(null);
  };

  const calcular = () => {
    const custoNum = parseNum(custo);
    const qtdNum = parseInt(qtd) || 1;
    const margemNum = parseNum(margemDesejada);
    const freteNum = parseNum(frete) + (marketplace === "tiktok_shop" ? parseNum(tiktokFrete) : 0);
    const adsNum = parseNum(mercadoAds);
    const mktAdsNum = parseNum(marketingAds);
    const impostoNum = parseNum(imposto);
    const taxaFixaNum = parseNum(taxaFixa);
    const fbaNum = parseNum(amazonFBA);
    const embalagemNum = parseNum(embalagem);
    const tiktokAfiliadosNum = marketplace === "tiktok_shop" ? parseNum(tiktokAfiliados) : 0;

    // Taxa fixa já inclui a taxa do plano Individual (preenchida automaticamente)
    const taxaFixaEfetiva = taxaFixaNum;

    const custoBase = custoNum * qtdNum;
    const embalagemTotal = embalagemNum * qtdNum;

    // When margin is in BRL, treat it as fixed cost; when %, add to percentual
    const margemPercentual = margemTipo === "percent" ? margemNum : 0;
    const margemFixa = margemTipo === "brl" ? margemNum : 0;
    const totalPercentual = (comissaoEfetiva + txTransacaoEfetiva + impostoNum + mktAdsNum + margemPercentual + tiktokAfiliadosNum) / 100;
    if (totalPercentual >= 1) { setResultado(null); return; }

    // First pass: calculate price with all percentages
    let precoVenda = (custoBase + embalagemTotal + freteNum + adsNum + fbaNum + margemFixa + (taxaFixaEfetiva * qtdNum)) / (1 - totalPercentual);

    // ML fixed fee by range
    let taxaFixaFaixa = taxaFixaEfetiva;
    if (marketplace === "mercado_livre" && taxaFixaNum === 0) {
      const faixa = mkData.taxaFixaPorFaixa.find((f) => precoVenda >= f.min && precoVenda < f.max);
      if (faixa) taxaFixaFaixa = faixa.taxa;
    }
    if (taxaFixaFaixa !== taxaFixaEfetiva)
      precoVenda = (custoBase + embalagemTotal + freteNum + adsNum + fbaNum + margemFixa + (taxaFixaFaixa * qtdNum)) / (1 - totalPercentual);

    // Amazon: check if minimum commission applies and recalculate
    let comissaoValor = precoVenda * (comissaoEfetiva / 100);
    let comissaoMinimaAplicada = false;
    if (marketplace === "amazon" && (mkData as any).comissaoMinima && comissaoValor < (mkData as any).comissaoMinima) {
      comissaoMinimaAplicada = true;
      comissaoValor = (mkData as any).comissaoMinima;
      // Recalculate: remove commission from percentages, add as fixed cost
      const totalPercentualSemComissao = (txTransacaoEfetiva + impostoNum + mktAdsNum + margemPercentual) / 100;
      if (totalPercentualSemComissao < 1) {
        precoVenda = (custoBase + embalagemTotal + freteNum + adsNum + fbaNum + margemFixa + (taxaFixaFaixa * qtdNum) + comissaoValor) / (1 - totalPercentualSemComissao);
      }
    }

    const taxaTransacaoValor = precoVenda * (txTransacaoEfetiva / 100);
    const impostoValor = precoVenda * (impostoNum / 100);
    const adsValorMkt = precoVenda * (mktAdsNum / 100);
    const custoTotal = custoBase + embalagemTotal + freteNum + adsNum + fbaNum + comissaoValor + taxaTransacaoValor + (taxaFixaFaixa * qtdNum) + impostoValor + adsValorMkt;
    const lucroLiquido = precoVenda - custoTotal;
    const margemLiquida = precoVenda > 0 ? (lucroLiquido / precoVenda) * 100 : 0;
    const roiPercentual = custoTotal > 0 ? (lucroLiquido / custoTotal) * 100 : 0;

    setResultado({
      precoVenda, comissaoValor, taxaFixaValor: taxaFixaFaixa * qtdNum, taxaTransacaoValor,
      freteValor: freteNum + fbaNum, adsValor: adsNum + adsValorMkt, impostoValor, custoTotal, lucroLiquido, margemLiquida, roiPercentual,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-primary/20">
        <CardContent className="p-5 space-y-5">
          <div>
            <h2 className="text-base font-bold text-foreground">Dados do Produto</h2>
            <p className="text-xs text-muted-foreground">Insira o custo e taxas para calcular</p>
          </div>

          <div className="space-y-1.5">
            <Label>Marketplace <InfoIcon tip="Selecione o marketplace para aplicar as taxas correspondentes" /></Label>
            <Select value={marketplace} onValueChange={(v) => handleChangeMarketplace(v as MarketplaceKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(savedMks).length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">📌 Salvos</div>
                    {Object.entries(savedMks).map(([key, mk]) => (
                      <SelectItem key={key} value={key}>📌 {mk.nome}</SelectItem>
                    ))}
                    <div className="my-1 h-px bg-border" />
                  </>
                )}
                {Object.entries(MARKETPLACES).map(([key, mk]) => (
                  <SelectItem key={key} value={key}>{mk.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCreatingNew && (
            <Card className="border-primary bg-primary/5 shadow-md">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Criar Marketplace Personalizado</p>
                    <p className="text-xs text-muted-foreground">Defina o nome e as taxas abaixo, depois salve</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold">Nome do Marketplace *</Label>
                  <Input placeholder="Ex: Kwai, Minha Loja Virtual" value={nomeCustom} onChange={(e) => setNomeCustom(e.target.value)} className="border-primary/40" autoFocus />
                </div>
                <Button onClick={salvarMarketplaceCustom} className="w-full gap-2 text-base py-5" size="lg" disabled={!nomeCustom.trim()}>
                  <Save className="h-5 w-5" />
                  Salvar Marketplace
                </Button>
              </CardContent>
            </Card>
          )}

          {isSavedCustom && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm">📌</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{savedMks[marketplace]?.nome}</p>
                      <p className="text-xs text-muted-foreground">Marketplace salvo — edite as taxas abaixo</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => excluirMarketplaceSalvo(marketplace)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isCreatingNew && !isSavedCustom && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-amber-600">{mkData.nome.charAt(0).toLowerCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Configurações {mkData.nome}</p>
                  </div>
                </div>

                {/* Amazon: Plano de Conta */}
                {marketplace === "amazon" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Plano de Conta <InfoIcon tip="Individual cobra R$ 2,00 por unidade vendida. Profissional cobra R$ 19,00/mês sem taxa por item." /></Label>
                      <Select value={amazonPlano} onValueChange={(v: "individual" | "profissional") => { setAmazonPlano(v); setTaxaFixa(v === "individual" ? "2" : "19"); setResultado(null); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual - R$ 2,00 por unidade vendida</SelectItem>
                          <SelectItem value="profissional">Profissional - Mensalidade de R$ 19,00/mês</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {amazonPlano === "individual" && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
                        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-semibold">Plano Individual</p>
                          <p className="text-[11px] text-muted-foreground">Taxa de R$ 2,00 por unidade será adicionada automaticamente</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">⚙️ Categoria do Produto <InfoIcon tip="Selecione a categoria para aplicar a comissão correta" /></Label>
                  <Select value={categoria} onValueChange={(v) => { setCategoria(v); setComissaoCustom(""); setResultado(null); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {mkData.categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nome} ({cat.classico}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-muted-foreground">Comissão da Categoria:</span>
                  <span className="font-bold text-primary">{marketplace === "shopee" ? shopeeComissaoEfetiva : marketplace === "tiktok_shop" ? tiktokComissaoEfetiva : marketplace === "shein" ? sheinComissaoEfetiva : catData.classico}%</span>
                </div>

                {/* Amazon: comissão mínima alert */}
                {marketplace === "amazon" && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/30 border border-amber-300/50">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">Comissão mínima de R$ 2,00 será aplicada automaticamente</p>
                  </div>
                )}

                {/* Shopee: Programa de Frete Grátis */}
                {marketplace === "shopee" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                      <div>
                        <p className="text-xs font-semibold">Programa de Frete Grátis</p>
                        <p className="text-[11px] text-muted-foreground">Comissão total sobe de 14% para 20%</p>
                      </div>
                      <Switch checked={shopeeFreteGratis} onCheckedChange={(v) => { setShopeeFreteGratis(v); setComissaoCustom(""); setResultado(null); }} />
                    </div>
                  </div>
                )}

                {/* TikTok Shop: Configurações */}
                {marketplace === "tiktok_shop" && (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                      <div>
                        <p className="text-xs font-semibold">🏠 Sou Novo Vendedor (Isenção 0%)</p>
                        <p className="text-[11px] text-muted-foreground">Comissão base de 6% será zerada</p>
                      </div>
                      <Switch checked={tiktokNovoVendedor} onCheckedChange={(v) => { setTiktokNovoVendedor(v); setComissaoCustom(""); setResultado(null); }} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                      <div>
                        <p className="text-xs font-semibold">🚚 Programa Frete Grátis (SFP)</p>
                        <p className="text-[11px] text-muted-foreground">Adiciona taxa de 6% sobre o preço</p>
                      </div>
                      <Switch checked={tiktokSFP} onCheckedChange={(v) => { setTiktokSFP(v); setComissaoCustom(""); setResultado(null); }} />
                    </div>

                    {tiktokNovoVendedor && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/30 border border-emerald-300/50">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <p className="text-[11px] text-emerald-800 dark:text-emerald-300">Isenção ativa: Comissão 0%</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/30 border border-amber-300/50">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">Taxa fixa de R$ 2,00 (preço {"<"} R$ 79)</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">👥 Comissão de Afiliados (%) <InfoIcon tip="Percentual pago a afiliados que promovem seu produto no TikTok Shop" /></Label>
                      <Input value={tiktokAfiliados} onChange={(e) => { setTiktokAfiliados(e.target.value); setResultado(null); }} placeholder="Ex: 10" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">🚛 Custo de Frete / Diferença de Subsídio (R$) <InfoIcon tip="Diferença entre o valor do frete real e o subsídio do TikTok Shop" /></Label>
                      <Input value={tiktokFrete} onChange={(e) => { setTiktokFrete(e.target.value); setResultado(null); }} placeholder="Ex: 8.50" />
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-1">
                      <p className="font-semibold flex items-center gap-1">📊 Resumo TikTok Shop:</p>
                      <div className="space-y-0.5 text-muted-foreground">
                        <div className="flex justify-between"><span>Comissão Base:</span><span className="font-medium text-foreground">{tiktokComissaoBase}%</span></div>
                        <div className="flex justify-between"><span>Taxa SFP:</span><span className="font-medium text-foreground">{tiktokSFPTaxa > 0 ? `${tiktokSFPTaxa}%` : "—"}</span></div>
                        <div className="flex justify-between"><span>Taxa Fixa:</span><span className="font-medium text-foreground">R$ 2,00</span></div>
                        <div className="flex justify-between"><span>Afiliados:</span><span className="font-medium text-foreground">{tiktokAfiliados ? `${tiktokAfiliados}%` : "—"}</span></div>
                        <div className="flex justify-between"><span>Frete:</span><span className="font-medium text-foreground">{tiktokFrete ? `R$ ${tiktokFrete}` : "—"}</span></div>
                      </div>
                    </div>
                  </>
                )}

                {/* SHEIN: Configurações */}
                {marketplace === "shein" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                      <div>
                        <p className="text-xs font-semibold flex items-center gap-1.5">🏷️ Período de Carência / Incentivo <InfoIcon tip="Período de incentivo para novos vendedores na SHEIN Brasil: comissão reduzida de 16% para 10%" /></p>
                        <p className="text-[11px] text-muted-foreground">Comissão reduzida de 16% para 10%</p>
                      </div>
                      <Switch checked={sheinIncentivo} onCheckedChange={(v) => { setSheinIncentivo(v); setComissaoCustom(""); setResultado(null); }} />
                    </div>

                    <div className="flex items-center justify-between px-3">
                      <span className="text-xs text-muted-foreground">Comissão Atual:</span>
                      <span className="text-sm font-bold text-primary">{sheinComissaoEfetiva}%</span>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-1">
                      <p className="font-semibold flex items-center gap-1">🇧🇷 Taxas SHEIN Brasil:</p>
                      <ul className="space-y-0.5 text-muted-foreground list-disc pl-4">
                        <li>Comissão padrão: 16% sobre o valor da venda</li>
                        <li>Sem taxa fixa por item no modelo local</li>
                        <li>Período de incentivo: 10% para novos vendedores</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Non-Amazon/Non-Shopee/Non-TikTok/Non-Shein: Tipo de Anúncio toggle */}
                {marketplace !== "amazon" && marketplace !== "shopee" && marketplace !== "tiktok_shop" && marketplace !== "shein" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de Anúncio <InfoIcon tip={`${isPremium ? "Premium" : "Clássico"}: ${isPremium ? catData.premium : catData.classico}% de comissão`} /></Label>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-background border">
                      <span className={`text-xs font-medium ${!isPremium ? "text-primary" : "text-muted-foreground"}`}>Clássico</span>
                      <Switch checked={isPremium} onCheckedChange={(v) => { setIsPremium(v); setComissaoCustom(""); setResultado(null); }} />
                      <span className={`text-xs font-medium ${isPremium ? "text-primary" : "text-muted-foreground"}`}>Premium</span>
                    </div>
                  </div>
                )}

                {/* Mercado Livre: Comissão Aplicada */}
                {marketplace === "mercado_livre" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Comissão Aplicada (%) <InfoIcon tip="Comissão efetiva que será cobrada pelo Mercado Livre nesta categoria e tipo de anúncio." /></Label>
                      <Input value={comissaoCustom !== "" ? comissaoCustom : comissaoEfetiva.toString()} onChange={(e) => { setComissaoCustom(e.target.value); setResultado(null); }} className="font-semibold text-primary" />
                    </div>

                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300/60 space-y-1.5">
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Tarifa Fixa Automática
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Isento de tarifa fixa (preço até R$ 12,50)
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Atenção: Produtos abaixo de R$ 12,50 têm comissão total de 50%
                      </p>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border text-xs">
                      <BarChart3 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-muted-foreground">Resumo:</span>
                      <span className="font-bold text-foreground">
                        Taxa ML: {comissaoCustom !== "" ? comissaoCustom : comissaoEfetiva}% + Tarifa Fixa: R$ {parseFloat(taxaFixa || "0").toFixed(2)}
                      </span>
                    </div>
                  </>
                )}

                {/* Amazon: Taxa FBA */}
                {marketplace === "amazon" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">📦 Taxa FBA - Envio/Armazenamento (R$) <InfoIcon tip="Custo de logística FBA (Fulfillment by Amazon) por unidade" /></Label>
                    <Input value={amazonFBA} onChange={(e) => setAmazonFBA(e.target.value)} placeholder="Ex: 15.00" />
                    <p className="text-[11px] text-muted-foreground">Opcional: preencha se utiliza logística FBA da Amazon</p>
                  </div>
                )}

                {/* Amazon: resumo taxas */}
                {marketplace === "amazon" && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-1">
                    <p className="font-semibold flex items-center gap-1">🇧🇷 Taxas Amazon Brasil:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      <li>Comissão por categoria: {catData.classico}%</li>
                      <li>Comissão mínima: R$ 2,00 por item</li>
                      <li>Plano Individual: +R$ 2,00/unidade vendida</li>
                      <li>Plano Profissional: R$ 19,00/mês</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Comissão (%) <InfoIcon tip="Percentual que o marketplace cobra sobre cada venda. Varia conforme a categoria e programa." /></Label>
              <Input value={comissaoCustom !== "" ? comissaoCustom : comissaoEfetiva.toString()} onChange={(e) => setComissaoCustom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Taxa Transação (%) <InfoIcon tip="Taxa de processamento de pagamento cobrada pelo marketplace (ex: Shopee cobra 2%)." /></Label>
              <Input value={taxaTransacao !== "" ? taxaTransacao : txTransacaoEfetiva.toString()} onChange={(e) => setTaxaTransacao(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Taxa Fixa/Unidade (R$) <InfoIcon tip="Valor fixo cobrado por venda" /></Label>
              <Input value={taxaFixa} onChange={(e) => setTaxaFixa(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Imposto (%) <InfoIcon tip="Impostos sobre a venda (ICMS, PIS, COFINS, etc). Simples Nacional geralmente fica entre 4% e 11%." /></Label>
              <Input value={imposto} onChange={(e) => setImposto(e.target.value)} placeholder="6" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Marketing / Ads (%) <InfoIcon tip="Percentual do preço de venda destinado a marketing e publicidade (Google Ads, Meta Ads, etc)." /></Label>
              <Input value={marketingAds} onChange={(e) => setMarketingAds(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">Custo (R$)</Label>
              <Input value={custo} onChange={(e) => setCusto(e.target.value)} placeholder="Ex: 50.00" className="font-semibold" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">⚙️ Qtd</Label>
              <Input value={qtd} onChange={(e) => setQtd(e.target.value)} placeholder="1" className="font-semibold" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><Package className="h-3.5 w-3.5" /> Embalagem (R$) <InfoIcon tip="Custo da embalagem por unidade (caixa, fita, plástico bolha, etc)." /></Label>
            <Input value={embalagem} onChange={(e) => setEmbalagem(e.target.value)} placeholder="0,00" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-primary">
                Lucro Desejado <InfoIcon tip="Defina o lucro desejado em percentual (%) ou valor fixo (R$) por unidade." />
              </Label>
              <div className="flex rounded-md overflow-hidden border border-primary/40">
                <button
                  type="button"
                  onClick={() => setMargemTipo("brl")}
                  className={`px-2.5 py-0.5 text-xs font-bold transition-colors ${margemTipo === "brl" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  R$
                </button>
                <button
                  type="button"
                  onClick={() => setMargemTipo("percent")}
                  className={`px-2.5 py-0.5 text-xs font-bold transition-colors ${margemTipo === "percent" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  %
                </button>
              </div>
            </div>
            <Input
              value={margemDesejada}
              onChange={(e) => setMargemDesejada(e.target.value)}
              placeholder={margemTipo === "percent" ? "30" : "0,00"}
              className="border-primary/40 font-semibold"
            />
          </div>

          {marketplace === "mercado_livre" && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground transition-colors">📋 Ver tabela de tarifas fixas {mkData.ano}</summary>
              <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-1">
                {mkData.taxaFixaPorFaixa.map((f, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{f.max === Infinity ? `Acima de R$ ${f.min.toFixed(2)}` : `R$ ${f.min.toFixed(2)} ~ R$ ${f.max.toFixed(2)}`}</span>
                    <span className="font-medium">{f.taxa > 0 ? `R$ ${f.taxa.toFixed(2)}` : "Isento"}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          <Button onClick={calcular} className="w-full h-12 text-base font-bold">Calcular Preço de Venda</Button>
        </CardContent>
      </Card>

      {/* Resultado */}
      <Card className="border-primary/10 h-full">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Resultado</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-6">Preço sugerido e lucro estimado</p>

          {!resultado ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mb-3 text-muted-foreground/40" />
              <p className="text-sm">Preencha os dados e clique em calcular</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Preço de Venda Sugerido</p>
                <p className="text-3xl font-black text-primary">{fmt(resultado.precoVenda)}</p>
                <Badge variant="outline" className="mt-2 text-xs">{MARKETPLACES[marketplace].nome}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border ${resultado.lucroLiquido >= 0 ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50" : "bg-red-50/50 dark:bg-red-950/20 border-red-200/50"}`}>
                  <p className="text-[11px] text-muted-foreground">Lucro Líquido</p>
                  <p className={`text-lg font-bold ${resultado.lucroLiquido >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(resultado.lucroLiquido)}</p>
                </div>
                <div className={`p-3 rounded-lg border ${resultado.margemLiquida >= 0 ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50" : "bg-red-50/50 dark:bg-red-950/20 border-red-200/50"}`}>
                  <p className="text-[11px] text-muted-foreground">Margem Líquida</p>
                  <p className={`text-lg font-bold ${resultado.margemLiquida >= 0 ? "text-emerald-600" : "text-red-600"}`}>{resultado.margemLiquida.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-[11px] text-muted-foreground">ROI</p>
                  <p className="text-lg font-bold text-foreground">{resultado.roiPercentual.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-[11px] text-muted-foreground">Custo Total</p>
                  <p className="text-lg font-bold text-foreground">{fmt(resultado.custoTotal)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold text-foreground">Detalhamento de Custos e Taxas</p>
                </div>
                <div className="space-y-1">
                  {/* Custos fixos */}
                  <div className="flex items-center justify-between text-xs py-2 px-3 border-b border-border/50">
                    <span className="text-muted-foreground">Custo do Produto</span>
                    <span className="font-semibold text-foreground">{fmt(parseFloat(custo) || 0)}</span>
                  </div>
                  {(parseFloat(embalagem) || 0) > 0 && (
                    <div className="flex items-center justify-between text-xs py-2 px-3 border-b border-border/50">
                      <span className="text-muted-foreground">Custo da Embalagem</span>
                      <span className="font-semibold text-foreground">{fmt(parseFloat(embalagem) || 0)}</span>
                    </div>
                  )}
                  {/* Taxas */}
                  {[
                    { label: `Comissão ${MARKETPLACES[marketplace].nome}`, valor: resultado.comissaoValor, pct: comissaoEfetiva },
                    { label: "Taxa de Transação", valor: resultado.taxaTransacaoValor, pct: txTransacaoEfetiva },
                    { label: "Frete / Logística", valor: resultado.freteValor },
                    { label: `Taxa Fixa ${MARKETPLACES[marketplace].nome}`, valor: resultado.taxaFixaValor },
                    { label: "Ads / Marketing", valor: resultado.adsValor },
                    { label: "Impostos", valor: resultado.impostoValor, pct: parseFloat(imposto) || 0 },
                  ].filter((item) => item.valor > 0).map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs py-2 px-3 rounded-md bg-muted/40 border border-border/30 mb-1">
                      <span className="text-muted-foreground">{item.label}{item.pct ? ` (${item.pct}%)` : ""}</span>
                      <span className="font-semibold text-destructive">{fmt(item.valor)}</span>
                    </div>
                  ))}
                </div>
                {/* Total de Custos + Taxas */}
                <div className="flex items-center justify-between text-sm py-2.5 px-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <span className="font-bold text-destructive">Total de Custos + Taxas</span>
                  <span className="font-black text-destructive">{fmt(resultado.custoTotal)}</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
                resultado.margemLiquida >= 20 ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : resultado.margemLiquida >= 10 ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
              }`}>
                {resultado.margemLiquida >= 20 ? <><CheckCircle2 className="h-4 w-4" /> Margem saudável! Boa precificação.</>
                : resultado.margemLiquida >= 10 ? <><AlertTriangle className="h-4 w-4" /> Margem apertada. Considere ajustar.</>
                : <><TrendingDown className="h-4 w-4" /> Margem baixa ou negativa. Revise custos.</>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════
// Tab: Reversa (Análise de Concorrência)
// ══════════════════════════════════════
function TabReversa() {
  const [marketplace, setMarketplace] = useState<MarketplaceKey>("personalizado");
  const [precoConcorrente, setPrecoConcorrente] = useState("");
  const [qtd, setQtd] = useState("1");
  const [comissao, setComissao] = useState("20");
  const [taxaTransacao, setTaxaTransacao] = useState("0");
  const [taxaFixa, setTaxaFixa] = useState("5");
  const [imposto, setImposto] = useState("6");
  const [marketingAds, setMarketingAds] = useState("12");
  const [margemDesejada, setMargemDesejada] = useState("30");
  const [resultado, setResultado] = useState<ResultadoReversa | null>(null);

  const [amazonPlano, setAmazonPlano] = useState<"individual" | "profissional">("individual");
  const [amazonCategoria, setAmazonCategoria] = useState("outros");
  const [amazonFBA, setAmazonFBA] = useState("");
  const [shopeeFreteGratis, setShopeeFreteGratis] = useState(false);
  const [tiktokNovoVendedor, setTiktokNovoVendedor] = useState(false);
  const [tiktokSFP, setTiktokSFP] = useState(false);
  const [tiktokAfiliados, setTiktokAfiliados] = useState("");
  const [tiktokFrete, setTiktokFrete] = useState("");
  const [sheinIncentivo, setSheinIncentivo] = useState(false);
  const [embalagem, setEmbalagem] = useState("0");
  const sheinComissaoEfetiva = sheinIncentivo ? 10 : 16;

  const tiktokComissaoBase = tiktokNovoVendedor ? 0 : 6;
  const tiktokSFPTaxa = tiktokSFP ? 6 : 0;

  const handleChangeMarketplace = (val: MarketplaceKey) => {
    setMarketplace(val);
    setShopeeFreteGratis(false);
    setTiktokNovoVendedor(false);
    setTiktokSFP(false);
    setTiktokAfiliados("");
    setTiktokFrete("");
    setSheinIncentivo(false);
    if (val !== "personalizado") {
      const mk = MARKETPLACES[val];
      const cat = mk.categorias[0];
      setComissao(val === "shopee" ? "14" : val === "tiktok_shop" ? "6" : val === "shein" ? "16" : cat.classico.toString());
      setTaxaTransacao(((mk as any).taxaTransacao || 0).toString());
      if (val === "amazon") {
        setTaxaFixa("2");
        setAmazonPlano("individual");
        setAmazonCategoria("outros");
      } else if (val === "tiktok_shop") {
        setTaxaFixa("2");
      } else {
        const faixa = mk.taxaFixaPorFaixa[0];
        setTaxaFixa(faixa.taxa.toString());
      }
    }
    setMarketingAds("11.7");
  };

  const calcular = () => {
    const preco = parseNum(precoConcorrente);
    if (preco <= 0) return;
    const qtdNum = parseInt(qtd) || 1;
    let comissaoNum = parseNum(comissao);
    // TikTok: override comissao with toggles
    if (marketplace === "tiktok_shop") {
      comissaoNum = tiktokComissaoBase + tiktokSFPTaxa;
    }
    // SHEIN: override comissao with toggle
    if (marketplace === "shein") {
      comissaoNum = sheinComissaoEfetiva;
    }
    const txTransNum = parseNum(taxaTransacao);
    const taxaFixaNum = parseNum(taxaFixa);
    const impostoNum = parseNum(imposto);
    const mktAdsNum = parseNum(marketingAds);
    const margemNum = parseNum(margemDesejada);
    const tiktokAfiliadosNum = marketplace === "tiktok_shop" ? parseNum(tiktokAfiliados) : 0;
    const tiktokFreteNum = marketplace === "tiktok_shop" ? parseNum(tiktokFrete) : 0;
    const embalagemNum = parseNum(embalagem);

    const precoTotal = preco * qtdNum;
    const embalagemTotal = embalagemNum * qtdNum;

    // Auto-detect ML fixed fee
    let taxaFixaEfetiva = taxaFixaNum;
    if (marketplace === "mercado_livre") {
      const mk = MARKETPLACES.mercado_livre;
      const faixa = mk.taxaFixaPorFaixa.find((f) => preco >= f.min && preco < f.max);
      if (faixa) taxaFixaEfetiva = faixa.taxa;
    }

    // Amazon: comissão mínima R$ 2,00
    let comissaoValor = precoTotal * (comissaoNum / 100);
    if (marketplace === "amazon" && comissaoValor < 2) {
      comissaoValor = 2;
    }

    const taxaTransacaoValor = precoTotal * (txTransNum / 100);
    const impostoValor = precoTotal * (impostoNum / 100);
    const adsValor = precoTotal * (mktAdsNum / 100);
    const afiliadosValor = precoTotal * (tiktokAfiliadosNum / 100);
    const taxaFixaValor = taxaFixaEfetiva * qtdNum;
    const fbaValor = marketplace === "amazon" ? parseNum(amazonFBA) * qtdNum : 0;
    const lucroDesejado = precoTotal * (margemNum / 100);

    const custoMaximo = precoTotal - comissaoValor - taxaTransacaoValor - taxaFixaValor - impostoValor - adsValor - afiliadosValor - fbaValor - tiktokFreteNum - embalagemTotal - lucroDesejado;

    setResultado({
      custoMaximo: Math.max(0, custoMaximo),
      precoConcorrente: precoTotal,
      margemDesejada: margemNum,
      lucroEstimado: lucroDesejado,
      comissaoValor,
      taxaFixaValor,
      taxaTransacaoValor,
      impostoValor,
      adsValor,
      embalagemValor: embalagemTotal,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-primary/20">
        <CardContent className="p-5 space-y-5">
          <div>
            <h2 className="text-base font-bold text-foreground">Análise de Concorrência</h2>
            <p className="text-xs text-muted-foreground">Descubra o custo máximo para competir com um preço específico</p>
          </div>

          <div className="space-y-1.5">
            <Label>Marketplace <InfoIcon tip="Selecione para aplicar as taxas automaticamente" /></Label>
            <Select value={marketplace} onValueChange={(v) => handleChangeMarketplace(v as MarketplaceKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MARKETPLACES).map(([key, mk]) => (
                  <SelectItem key={key} value={key}>{mk.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amazon Config */}
          {marketplace === "amazon" && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-amber-600">a</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">Configurações Amazon</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Plano de Conta <InfoIcon tip="Individual cobra R$ 2,00 por unidade vendida. Profissional cobra R$ 19,00/mês sem taxa por item." /></Label>
                  <Select value={amazonPlano} onValueChange={(v: "individual" | "profissional") => { setAmazonPlano(v); setTaxaFixa(v === "individual" ? "2" : "19"); setResultado(null); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual - R$ 2,00 por unidade vendida</SelectItem>
                      <SelectItem value="profissional">Profissional - Mensalidade de R$ 19,00/mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {amazonPlano === "individual" && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">Plano Individual</p>
                      <p className="text-[11px] text-muted-foreground">Taxa de R$ 2,00 por unidade será adicionada automaticamente</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">⚙️ Categoria do Produto <InfoIcon tip="Selecione a categoria para aplicar a comissão correta" /></Label>
                  <Select value={amazonCategoria} onValueChange={(v) => {
                    setAmazonCategoria(v);
                    const mk = MARKETPLACES.amazon;
                    const cat = mk.categorias.find(c => c.id === v) || mk.categorias[0];
                    setComissao(cat.classico.toString());
                    setResultado(null);
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MARKETPLACES.amazon.categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nome} ({cat.classico}%)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-muted-foreground">Comissão da Categoria:</span>
                  <span className="font-bold text-primary">{comissao}%</span>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/30 border border-amber-300/50">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">Comissão mínima de R$ 2,00 será aplicada automaticamente</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">📦 Taxa FBA - Envio/Armazenamento (R$) <InfoIcon tip="Custo de logística FBA (Fulfillment by Amazon) por unidade" /></Label>
                  <Input value={amazonFBA} onChange={(e) => setAmazonFBA(e.target.value)} placeholder="Ex: 15.00" />
                  <p className="text-[11px] text-muted-foreground">Opcional: preencha se utiliza logística FBA da Amazon</p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-1">
                  <p className="font-semibold flex items-center gap-1">🇧🇷 Taxas Amazon Brasil:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>Comissão por categoria: {comissao}%</li>
                    <li>Comissão mínima: R$ 2,00 por item</li>
                    <li>Plano Individual: +R$ 2,00/unidade vendida</li>
                    <li>Plano Profissional: R$ 19,00/mês</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shopee Config */}
          {marketplace === "shopee" && (
            <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-600">s</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">Configurações Shopee</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                  <div>
                    <p className="text-xs font-semibold">Programa de Frete Grátis</p>
                    <p className="text-[11px] text-muted-foreground">Comissão total sobe de 14% para 20%</p>
                  </div>
                  <Switch checked={shopeeFreteGratis} onCheckedChange={(v) => { setShopeeFreteGratis(v); setComissao(v ? "20" : "14"); setResultado(null); }} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* TikTok Shop Config */}
          {marketplace === "tiktok_shop" && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-amber-600">t</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">Configurações TikTok Shop</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                  <div>
                    <p className="text-xs font-semibold">🏠 Sou Novo Vendedor (Isenção 0%)</p>
                    <p className="text-[11px] text-muted-foreground">Comissão base de 6% será zerada</p>
                  </div>
                  <Switch checked={tiktokNovoVendedor} onCheckedChange={(v) => { setTiktokNovoVendedor(v); setComissao((v ? 0 : 6) + tiktokSFPTaxa + ""); setResultado(null); }} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                  <div>
                    <p className="text-xs font-semibold">🚚 Programa Frete Grátis (SFP)</p>
                    <p className="text-[11px] text-muted-foreground">Adiciona taxa de 6% sobre o preço</p>
                  </div>
                  <Switch checked={tiktokSFP} onCheckedChange={(v) => { setTiktokSFP(v); setComissao((tiktokNovoVendedor ? 0 : 6) + (v ? 6 : 0) + ""); setResultado(null); }} />
                </div>
                {tiktokNovoVendedor && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/30 border border-emerald-300/50">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">Isenção ativa: Comissão 0%</p>
                  </div>
                )}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/30 border border-amber-300/50">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">Taxa fixa de R$ 2,00 (preço {"<"} R$ 79)</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">👥 Comissão de Afiliados (%) <InfoIcon tip="Percentual pago a afiliados que promovem seu produto no TikTok Shop" /></Label>
                  <Input value={tiktokAfiliados} onChange={(e) => { setTiktokAfiliados(e.target.value); setResultado(null); }} placeholder="Ex: 10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">🚛 Custo de Frete / Diferença de Subsídio (R$) <InfoIcon tip="Diferença entre o valor do frete real e o subsídio do TikTok Shop" /></Label>
                  <Input value={tiktokFrete} onChange={(e) => { setTiktokFrete(e.target.value); setResultado(null); }} placeholder="Ex: 8.50" />
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-1">
                  <p className="font-semibold flex items-center gap-1">📊 Resumo TikTok Shop:</p>
                  <div className="space-y-0.5 text-muted-foreground">
                    <div className="flex justify-between"><span>Comissão Base:</span><span className="font-medium text-foreground">{tiktokComissaoBase}%</span></div>
                    <div className="flex justify-between"><span>Taxa SFP:</span><span className="font-medium text-foreground">{tiktokSFPTaxa > 0 ? `${tiktokSFPTaxa}%` : "—"}</span></div>
                    <div className="flex justify-between"><span>Taxa Fixa:</span><span className="font-medium text-foreground">R$ 2,00</span></div>
                    <div className="flex justify-between"><span>Afiliados:</span><span className="font-medium text-foreground">{tiktokAfiliados ? `${tiktokAfiliados}%` : "—"}</span></div>
                    <div className="flex justify-between"><span>Frete:</span><span className="font-medium text-foreground">{tiktokFrete ? `R$ ${tiktokFrete}` : "—"}</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SHEIN Config */}
          {marketplace === "shein" && (
            <Card className="bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-200/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-zinc-600">S</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">Configurações SHEIN</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                  <div>
                    <p className="text-xs font-semibold flex items-center gap-1.5">🏷️ Período de Carência / Incentivo <InfoIcon tip="Período de incentivo para novos vendedores na SHEIN Brasil: comissão reduzida de 16% para 10%" /></p>
                    <p className="text-[11px] text-muted-foreground">Comissão reduzida de 16% para 10%</p>
                  </div>
                  <Switch checked={sheinIncentivo} onCheckedChange={(v) => { setSheinIncentivo(v); setComissao(v ? "10" : "16"); setResultado(null); }} />
                </div>
                <div className="flex items-center justify-between px-3">
                  <span className="text-xs text-muted-foreground">Comissão Atual:</span>
                  <span className="text-sm font-bold text-primary">{sheinComissaoEfetiva}%</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-1">
                  <p className="font-semibold flex items-center gap-1">🇧🇷 Taxas SHEIN Brasil:</p>
                  <ul className="space-y-0.5 text-muted-foreground list-disc pl-4">
                    <li>Comissão padrão: 16% sobre o valor da venda</li>
                    <li>Sem taxa fixa por item no modelo local</li>
                    <li>Período de incentivo: 10% para novos vendedores</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Preço do Concorrente (R$) <InfoIcon tip="Preço de venda do concorrente no marketplace" /></Label>
              <Input value={precoConcorrente} onChange={(e) => setPrecoConcorrente(e.target.value)} placeholder="Ex: 150.00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">⚙️ Quantidade <InfoIcon tip="Quantidade de unidades por venda" /></Label>
              <Input value={qtd} onChange={(e) => setQtd(e.target.value)} placeholder="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Comissão (%) <InfoIcon tip="Percentual que o marketplace cobra sobre cada venda. Varia conforme a categoria e programa." /></Label>
              <Input value={comissao} onChange={(e) => setComissao(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Taxa Transação (%) <InfoIcon tip="Taxa de processamento de pagamento cobrada pelo marketplace (ex: Shopee cobra 2%)." /></Label>
              <Input value={taxaTransacao} onChange={(e) => setTaxaTransacao(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Taxa Fixa/Unidade (R$) <InfoIcon tip="Valor fixo cobrado por venda" /></Label>
              <Input type="number" value={taxaFixa} onChange={(e) => setTaxaFixa(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Imposto (%) <InfoIcon tip="Impostos sobre a venda (ICMS, PIS, COFINS, etc). Simples Nacional geralmente fica entre 4% e 11%." /></Label>
              <Input value={imposto} onChange={(e) => setImposto(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Marketing / Ads (%) <InfoIcon tip="Percentual do preço de venda destinado a marketing e publicidade (Google Ads, Meta Ads, etc)." /></Label>
            <Input value={marketingAds} onChange={(e) => setMarketingAds(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Package className="h-3.5 w-3.5" /> Embalagem (R$) <InfoIcon tip="Custo da embalagem por unidade (caixa, fita, plástico bolha, etc)." /></Label>
            <Input value={embalagem} onChange={(e) => setEmbalagem(e.target.value)} placeholder="0,00" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-primary">Margem Desejada (%) <InfoIcon tip="Percentual de lucro que você deseja ter sobre o preço de venda." /></Label>
            <Input value={margemDesejada} onChange={(e) => setMargemDesejada(e.target.value)} className="border-primary/40 font-semibold" />
          </div>

          <Button onClick={calcular} className="w-full h-12 text-base font-bold">
            <RotateCcw className="h-4 w-4 mr-2" /> Calcular Custo Máximo
          </Button>
        </CardContent>
      </Card>

      {/* Resultado Reversa */}
      <Card className="border-primary/10 h-full">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Resultado</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-6">Custo máximo para manter sua margem</p>

          {!resultado ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mb-3 text-muted-foreground/40" />
              <p className="text-sm">Preencha os dados e clique em calcular</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Para competir com este anúncio e ter <span className="font-bold text-primary">{resultado.margemDesejada}% de lucro</span>, você pode pagar no máximo:
                </p>
                <p className="text-4xl font-black text-primary my-2">{fmt(resultado.custoMaximo)}</p>
                <p className="text-xs text-muted-foreground">no fornecedor</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border bg-muted/30 text-center">
                  <p className="text-[11px] text-primary font-medium">Preço Concorrente</p>
                  <p className="text-lg font-bold text-foreground">{fmt(resultado.precoConcorrente)}</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30 text-center">
                  <p className="text-[11px] text-primary font-medium">Sua Margem</p>
                  <p className="text-lg font-bold text-foreground">{resultado.margemDesejada}%</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30 text-center">
                  <p className="text-[11px] text-primary font-medium">Lucro Estimado</p>
                  <p className="text-lg font-bold text-emerald-600">{fmt(resultado.lucroEstimado)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Detalhamento dos Descontos</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Comissão", valor: resultado.comissaoValor },
                    { label: "Taxa Transação", valor: resultado.taxaTransacaoValor },
                    { label: "Taxa Fixa", valor: resultado.taxaFixaValor },
                    { label: "Impostos", valor: resultado.impostoValor },
                    { label: "Marketing/Ads", valor: resultado.adsValor },
                    { label: "Embalagem", valor: resultado.embalagemValor },
                    { label: "Lucro desejado", valor: resultado.lucroEstimado },
                  ].filter((item) => item.valor > 0).map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-red-500">-{fmt(item.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
                resultado.custoMaximo > 0
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
              }`}>
                {resultado.custoMaximo > 0
                  ? <><CheckCircle2 className="h-4 w-4" /> Viável! Busque fornecedores abaixo de {fmt(resultado.custoMaximo)}.</>
                  : <><TrendingDown className="h-4 w-4" /> Inviável com essas taxas e margem. Revise os parâmetros.</>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════
// Tab: Scanner de Concorrência
// ══════════════════════════════════════
function TabScanner() {
  const [url, setUrl] = useState("");
  const [detected, setDetected] = useState<{ key: MarketplaceKey; nome: string } | null>(null);
  const [precoAnuncio, setPrecoAnuncio] = useState("");
  const [margemDesejada, setMargemDesejada] = useState("20");
  const [resultado, setResultado] = useState<ResultadoReversa | null>(null);
  const [analisando, setAnalisando] = useState(false);

  const analisarLink = () => {
    setAnalisando(true);
    setResultado(null);
    setTimeout(() => {
      const mk = detectMarketplaceFromUrl(url);
      setDetected(mk);
      setAnalisando(false);
    }, 600);
  };

  const calcularCustoMaximo = () => {
    if (!detected) return;
    const preco = parseNum(precoAnuncio);
    if (preco <= 0) return;

    const mk = MARKETPLACES[detected.key];
    const cat = mk.categorias[0];
    const comissaoNum = cat.classico;
    const txTransNum = (mk as any).taxaTransacao || 0;
    const margemNum = parseNum(margemDesejada);
    const impostoNum = 6;

    let taxaFixaEfetiva = 0;
    if (detected.key === "mercado_livre") {
      const faixa = mk.taxaFixaPorFaixa.find((f) => preco >= f.min && preco < f.max);
      if (faixa) taxaFixaEfetiva = faixa.taxa;
    }

    const comissaoValor = preco * (comissaoNum / 100);
    const taxaTransacaoValor = preco * (txTransNum / 100);
    const impostoValor = preco * (impostoNum / 100);
    const taxaFixaValor = taxaFixaEfetiva;
    const lucroDesejado = preco * (margemNum / 100);
    const custoMaximo = preco - comissaoValor - taxaTransacaoValor - taxaFixaValor - impostoValor - lucroDesejado;

    setResultado({
      custoMaximo: Math.max(0, custoMaximo),
      precoConcorrente: preco,
      margemDesejada: margemNum,
      lucroEstimado: lucroDesejado,
      comissaoValor,
      taxaFixaValor,
      taxaTransacaoValor,
      impostoValor,
      adsValor: 0,
      embalagemValor: 0,
    });
  };

  const novaAnalise = () => {
    setUrl("");
    setDetected(null);
    setPrecoAnuncio("");
    setResultado(null);
  };

  const taxasResumo = detected
    ? (() => {
        const mk = MARKETPLACES[detected.key];
        const cat = mk.categorias[0];
        const tx = (mk as any).taxaTransacao || 0;
        let fixaStr = "";
        if (detected.key === "mercado_livre") fixaStr = " + R$ 6";
        return `${cat.classico}%${tx ? ` + ${tx}%` : ""}${fixaStr} + 6% impostos`;
      })()
    : "";

  return (
    <div className="space-y-6">
      {/* Header Scanner */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <ScanLine className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Scanner de Concorrência</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Cole o link do anúncio do concorrente para análise automática</p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.mercadolivre.com.br/produto..."
                className="pl-9 border-primary/30"
              />
            </div>
            <Button onClick={analisarLink} disabled={!url || analisando} className="gap-2 px-6">
              <ScanLine className="h-4 w-4" /> Analisar Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Marketplace Detectado */}
      {detected && (
        <Card className="border-primary/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-600">Marketplace Detectado</p>
                <p className="text-lg font-bold text-foreground">{detected.nome}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Para uma análise precisa, confirme o preço de venda atual do anúncio:
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Preço do Anúncio (R$)</Label>
                <Input
                  value={precoAnuncio}
                  onChange={(e) => setPrecoAnuncio(e.target.value)}
                  placeholder="Ex: 89.90"
                  className="text-lg font-semibold border-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Margem de Lucro Desejada (%)</Label>
                <Input
                  value={margemDesejada}
                  onChange={(e) => setMargemDesejada(e.target.value)}
                  className="text-lg"
                />
              </div>
            </div>

            {taxasResumo && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                ⚙️ Taxas aplicadas: <span className="text-primary font-medium">{taxasResumo}</span>
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={novaAnalise} className="h-11">Nova Análise</Button>
              <Button onClick={calcularCustoMaximo} className="h-11 gap-2">
                <RotateCcw className="h-4 w-4" /> Calcular Custo Máximo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado do Scanner */}
      {resultado && (
        <Card className="border-primary/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 justify-center">
              <span className="text-lg">⚙️</span>
              <h3 className="text-base font-bold text-foreground">Resultado da Análise</h3>
            </div>

            <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Para competir com este anúncio e ter <span className="font-bold text-primary">{resultado.margemDesejada}% de lucro</span>, você pode pagar no máximo:
              </p>
              <p className="text-4xl font-black text-primary my-2">{fmt(resultado.custoMaximo)}</p>
              <p className="text-xs text-muted-foreground">no fornecedor</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <p className="text-[11px] text-primary font-medium">Preço Concorrente</p>
                <p className="text-lg font-bold text-foreground">{fmt(resultado.precoConcorrente)}</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <p className="text-[11px] text-primary font-medium">Sua Margem</p>
                <p className="text-lg font-bold text-foreground">{resultado.margemDesejada}%</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <p className="text-[11px] text-primary font-medium">Lucro Estimado</p>
                <p className="text-lg font-bold text-emerald-600">{fmt(resultado.lucroEstimado)}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              {[
                { label: "Comissão", valor: resultado.comissaoValor },
                { label: "Taxa Fixa", valor: resultado.taxaFixaValor },
                { label: "Taxa Transação", valor: resultado.taxaTransacaoValor },
                { label: "Impostos", valor: resultado.impostoValor },
              ].filter((item) => item.valor > 0).map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-red-500">-{fmt(item.valor)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!detected && !analisando && (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="p-12 text-center text-muted-foreground">
            <ScanLine className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="font-medium">Cole um link de anúncio acima</p>
            <p className="text-sm mt-1">Detectamos automaticamente: Mercado Livre, Shopee, Amazon, TikTok Shop e Shein</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// Main Component
// ══════════════════════════════════════
export default function CalculadoraLucro() {
  const [tabAtiva, setTabAtiva] = useState("custo");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Calculator className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Calculadora de Lucro</h1>
        </div>
        <p className="text-sm text-muted-foreground">Simule preços e margens para seus produtos nos marketplaces.</p>
      </div>

      <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="custo" className="gap-2"><DollarSign className="h-4 w-4" /> Custo</TabsTrigger>
          <TabsTrigger value="reversa" className="gap-2"><RotateCcw className="h-4 w-4" /> Reversa</TabsTrigger>
          <TabsTrigger value="scanner" className="gap-2"><ScanLine className="h-4 w-4" /> Scanner</TabsTrigger>
        </TabsList>
        <TabsContent value="custo" className="mt-4"><TabCusto /></TabsContent>
        <TabsContent value="reversa" className="mt-4"><TabReversa /></TabsContent>
        <TabsContent value="scanner" className="mt-4"><TabScanner /></TabsContent>
      </Tabs>
    </div>
  );
}
