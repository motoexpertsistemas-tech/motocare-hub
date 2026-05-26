import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Search, Plus, Trash2, Pencil, Upload, Package, ShoppingCart, Loader2, ChevronUp, ChevronDown, X, Info, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import logoMercadoLivre from "@/assets/logo-mercadolivre.png";
import logoAmazon from "@/assets/logo-amazon.png";
import logoShopee from "@/assets/logo-shopee.png";
import logoTikTok from "@/assets/logo-tiktok.png";
import logoShein from "@/assets/logo-shein.png";
import logoMagalu from "@/assets/logo-magalu.png";

// ── Canais disponíveis ──
const CANAIS = [
  { id: "mercado_livre", nome: "Mercado Livre", cor: "#facc15", bg: "bg-yellow-400", text: "text-black", logo: logoMercadoLivre },
  { id: "shopee", nome: "Shopee", cor: "#DC2626", bg: "bg-orange-500", text: "text-white", logo: logoShopee },
  { id: "amazon", nome: "Amazon", cor: "#f59e0b", bg: "bg-amber-500", text: "text-white", logo: logoAmazon },
  { id: "tiktok_shop", nome: "TikTok Shop", cor: "#18181b", bg: "bg-zinc-900", text: "text-white", logo: logoTikTok },
  { id: "shein", nome: "Shein", cor: "#ec4899", bg: "bg-pink-500", text: "text-white", logo: logoShein },
  { id: "magalu", nome: "Magalu", cor: "#0086ff", bg: "bg-blue-500", text: "text-white", logo: logoMagalu },
];

// ── Mercado Livre Categories ──
const ML_CATEGORIAS = [
  { id: "geral", nome: "Geral (Casa, Ferramentas, Brinquedos)", classico: 11, premium: 16 },
  { id: "eletronicos", nome: "Eletrônicos e Informática", classico: 13, premium: 16 },
  { id: "moda", nome: "Moda e Acessórios", classico: 14, premium: 16 },
  { id: "autopecas", nome: "Autopeças", classico: 12, premium: 17 },
  { id: "saude", nome: "Saúde e Beleza", classico: 14, premium: 16 },
  { id: "esporte", nome: "Esportes e Fitness", classico: 12, premium: 16 },
  { id: "alimentos", nome: "Alimentos e Bebidas", classico: 10, premium: 15 },
];

// ── Amazon Categories ──
const AMAZON_CATEGORIAS = [
  { id: "outros", nome: "Outros (Padrão)", comissao: 15 },
  { id: "eletronicos", nome: "Eletrônicos", comissao: 15 },
  { id: "informatica", nome: "Informática", comissao: 13 },
  { id: "moda", nome: "Roupas e Acessórios", comissao: 17 },
  { id: "casa", nome: "Casa e Cozinha", comissao: 15 },
  { id: "esportes", nome: "Esportes e Ar Livre", comissao: 15 },
  { id: "auto", nome: "Automotivo", comissao: 12 },
  { id: "brinquedos", nome: "Brinquedos e Jogos", comissao: 15 },
  { id: "beleza", nome: "Beleza e Cuidados Pessoais", comissao: 15 },
  { id: "ferramentas", nome: "Ferramentas", comissao: 15 },
];

// ── Tarifas fixas ML 2026 ──
const ML_TARIFAS_FIXAS = [
  { min: 0, max: 12.50, classico: 0, premium: 0, nota: "Isento (mais 50% comissão total)" },
  { min: 12.51, max: 29.00, classico: 6.25, premium: 6.25, nota: "" },
  { min: 29.01, max: 50.00, classico: 6.50, premium: 6.50, nota: "" },
  { min: 50.01, max: 78.99, classico: 6.75, premium: 6.75, nota: "" },
  { min: 79.00, max: Infinity, classico: 0, premium: 0, nota: "Isento (frete grátis obrigatório)" },
];

// Tarifa fixa especial para Livros
const ML_TARIFA_LIVROS = 3.00;

interface CanalConfig {
  canal: string;
  comissao: number;
  frete: number;
  ads: number;
  // ML specific
  mlCategoria?: string;
  mlPremium?: boolean;
  // Shopee specific
  shopeeFreteExtra?: boolean;
  // Amazon specific
  amazonPlano?: "individual" | "profissional";
  amazonCategoria?: string;
  amazonFba?: number;
}

function getTarifaFixaML(preco: number, premium: boolean): number {
  const tarifa = ML_TARIFAS_FIXAS.find(t => preco >= t.min && preco < t.max);
  if (!tarifa) return 0;
  return premium ? tarifa.premium : tarifa.classico;
}

function calcPrecoCanal(custo: number, margem: number, comissao: number, imposto: number, frete: number, ads: number): number {
  const totalPercent = (comissao + imposto + margem) / 100;
  if (totalPercent >= 1) return custo * 3;
  const precoBase = custo / (1 - totalPercent);
  return Math.round((precoBase + frete + ads) * 100) / 100;
}

function calcLucro(custo: number, preco: number, comissao: number, imposto: number, frete: number, ads: number): number {
  return preco - custo - (preco * comissao / 100) - (preco * imposto / 100) - frete - ads;
}

function calcMargemReal(custo: number, preco: number, comissao: number, imposto: number, frete: number, ads: number): number {
  if (preco <= 0) return 0;
  const lucro = calcLucro(custo, preco, comissao, imposto, frete, ads);
  return Math.round((lucro / preco) * 1000) / 10;
}

function getDefaultComissao(canal: string): number {
  switch (canal) {
    case "mercado_livre": return 11;
    case "shopee": return 14;
    case "amazon": return 15;
    case "tiktok_shop": return 10;
    case "shein": return 15;
    default: return 15;
  }
}

interface ProdutoComCanais {
  id: string;
  nome: string;
  codigo_cpl: string;
  codigo_fornecedor: string | null;
  custo_final: number;
  imagem_url: string | null;
  canais: { id: string; canal: string; preco: number; margem: number }[];
}

export default function CanaisVenda() {
  const { empresaId } = useEmpresa();
  const [produtos, setProdutos] = useState<ProdutoComCanais[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroSku, setFiltroSku] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("todos");

  // Dialog: Novo Produto Multicanal
  const [dialogNovo, setDialogNovo] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoSku, setNovoSku] = useState("");
  const [novoCusto, setNovoCusto] = useState("");
  const [novoValorVenda, setNovoValorVenda] = useState("");
  const [novoImposto, setNovoImposto] = useState("6");
  const [novoMargem, setNovoMargem] = useState("30");
  const [novoCanaisSelecionados, setNovoCanaisSelecionados] = useState<Set<string>>(new Set());
  const [canaisConfig, setCanaisConfig] = useState<Record<string, CanalConfig>>({});
  const [canaisAbertos, setCanaisAbertos] = useState<Set<string>>(new Set());

  // Dialog: Importar
  const [dialogImportar, setDialogImportar] = useState(false);
  const [produtosCatalogo, setProdutosCatalogo] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [margemImportar, setMargemImportar] = useState("30");
  const [impostoImportar, setImpostoImportar] = useState("6");
  const [canaisImportar, setCanaisImportar] = useState<Set<string>>(new Set(["mercado_livre"]));
  const [buscaImportar, setBuscaImportar] = useState("");
  const [importando, setImportando] = useState(false);

  // Dialog: Editar Produto (full config)
  const [editDialog, setEditDialog] = useState<{ produtoId: string; canalId: string; canal: string } | null>(null);
  const [editPreco, setEditPreco] = useState("");
  const [editCusto, setEditCusto] = useState("");
  const [editImposto, setEditImposto] = useState("6");
  const [editMargem, setEditMargem] = useState("30");
  const [editComissao, setEditComissao] = useState("");
  const [editFrete, setEditFrete] = useState("0");
  const [editAds, setEditAds] = useState("0");
  const [editNome, setEditNome] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editMLCategoria, setEditMLCategoria] = useState("geral");
  const [editMLPremium, setEditMLPremium] = useState(false);
  const [editShopeeFreteExtra, setEditShopeeFreteExtra] = useState(false);
  const [editAmazonPlano, setEditAmazonPlano] = useState<"individual" | "profissional">("individual");
  const [editAmazonCategoria, setEditAmazonCategoria] = useState("outros");
  const [editAmazonFba, setEditAmazonFba] = useState("0");
  const [editTarifasAberto, setEditTarifasAberto] = useState(false);

  // Dialog: Adicionar Canal
  const [addCanalDialog, setAddCanalDialog] = useState<string | null>(null);
  const [addCanalId, setAddCanalId] = useState("");
  const [addCanalMargem, setAddCanalMargem] = useState("30");

  // ── Helpers for canal config ──
  function toggleCanal(canalId: string) {
    setNovoCanaisSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(canalId)) {
        next.delete(canalId);
        setCanaisConfig(prev => { const n = { ...prev }; delete n[canalId]; return n; });
        setCanaisAbertos(prev => { const n = new Set(prev); n.delete(canalId); return n; });
      } else {
        next.add(canalId);
        setCanaisConfig(prev => ({
          ...prev,
          [canalId]: {
            canal: canalId,
            comissao: getDefaultComissao(canalId),
            frete: 0,
            ads: 0,
            mlCategoria: "geral",
            mlPremium: false,
            shopeeFreteExtra: false,
            amazonPlano: "individual",
            amazonCategoria: "outros",
            amazonFba: 0,
          },
        }));
        setCanaisAbertos(prev => new Set(prev).add(canalId));
      }
      return next;
    });
  }

  function updateCanalConfig(canalId: string, updates: Partial<CanalConfig>) {
    setCanaisConfig(prev => ({
      ...prev,
      [canalId]: { ...prev[canalId], ...updates },
    }));
  }

  function getPrecoForCanal(canalId: string): number {
    const custo = parseFloat(novoCusto) || 0;
    const margem = parseFloat(novoMargem) || 30;
    const imposto = parseFloat(novoImposto) || 6;
    const config = canaisConfig[canalId];
    if (!config) return 0;
    let extraFixo = config.frete + config.ads;
    // Amazon: individual plan adds R$2/unit, FBA adds storage cost
    if (canalId === "amazon") {
      if (config.amazonPlano === "individual") extraFixo += 2;
      extraFixo += (config.amazonFba || 0);
    }
    return calcPrecoCanal(custo, margem, config.comissao, imposto, extraFixo, 0);
  }

  function getLucroForCanal(canalId: string): number {
    const custo = parseFloat(novoCusto) || 0;
    const imposto = parseFloat(novoImposto) || 6;
    const config = canaisConfig[canalId];
    if (!config) return 0;
    const preco = getPrecoForCanal(canalId);
    let extraFixo = config.frete + config.ads;
    if (canalId === "amazon") {
      if (config.amazonPlano === "individual") extraFixo += 2;
      extraFixo += (config.amazonFba || 0);
    }
    return calcLucro(custo, preco, config.comissao, imposto, extraFixo, 0);
  }

  function getMargemRealForCanal(canalId: string): number {
    const custo = parseFloat(novoCusto) || 0;
    const imposto = parseFloat(novoImposto) || 6;
    const config = canaisConfig[canalId];
    if (!config) return 0;
    const preco = getPrecoForCanal(canalId);
    let extraFixo = config.frete + config.ads;
    if (canalId === "amazon") {
      if (config.amazonPlano === "individual") extraFixo += 2;
      extraFixo += (config.amazonFba || 0);
    }
    return calcMargemReal(custo, preco, config.comissao, imposto, extraFixo, 0);
  }

  // ── Carregar dados ──
  const carregarProdutos = useCallback(async () => {
    setLoading(true);
    const { data: mkProdutos, error } = await supabase
      .from("marketplace_produtos" as any)
      .select("id, produto_id, canal, preco, margem")
      .eq("ativo", true)
      .order("criado_em", { ascending: false });

    if (error) { console.error(error); setLoading(false); return; }

    const produtoIds = [...new Set((mkProdutos || []).map((mp: any) => mp.produto_id))];
    if (produtoIds.length === 0) { setProdutos([]); setLoading(false); return; }

    const { data: prods } = await supabase
      .from("produtos_catalogo")
      .select("id, nome, codigo_cpl, codigo_fornecedor, custo_final, preco_custo, imagem_url")
      .in("id", produtoIds);

    const prodMap = new Map((prods || []).map((p) => [p.id, p]));
    const agrupado = new Map<string, ProdutoComCanais>();

    for (const mp of (mkProdutos || []) as any[]) {
      const prod = prodMap.get(mp.produto_id);
      if (!prod) continue;
      if (!agrupado.has(mp.produto_id)) {
        agrupado.set(mp.produto_id, {
          id: prod.id, nome: prod.nome, codigo_cpl: prod.codigo_cpl,
          codigo_fornecedor: prod.codigo_fornecedor, custo_final: prod.custo_final || prod.preco_custo || 0,
          imagem_url: prod.imagem_url, canais: [],
        });
      }
      agrupado.get(mp.produto_id)!.canais.push({
        id: mp.id, canal: mp.canal, preco: mp.preco, margem: mp.margem,
      });
    }

    setProdutos(Array.from(agrupado.values()));
    setLoading(false);
  }, []);

  useEffect(() => { carregarProdutos(); }, [carregarProdutos]);

  // ── Filtros ──
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase());
      const matchSku = !filtroSku || (p.codigo_cpl + (p.codigo_fornecedor || "")).toLowerCase().includes(filtroSku.toLowerCase());
      const matchCanal = filtroCanal === "todos" || p.canais.some((c) => c.canal === filtroCanal);
      return matchBusca && matchSku && matchCanal;
    });
  }, [produtos, busca, filtroSku, filtroCanal]);

  // ── Novo Produto Multicanal ──
  async function criarProduto() {
    if (!novoNome.trim()) { toast.error("Informe o nome"); return; }
    if (novoCanaisSelecionados.size === 0) { toast.error("Selecione ao menos 1 canal"); return; }

    const custo = parseFloat(novoCusto) || 0;
    const imposto = parseFloat(novoImposto) || 6;
    const margem = parseFloat(novoMargem) || 30;
    const codigo = novoSku.trim() || `MKT-${Date.now().toString(36).toUpperCase()}`;

    const { data: prod, error: prodErr } = await supabase
      .from("produtos_catalogo")
      .insert({ nome: novoNome.trim(), codigo_cpl: codigo, custo_final: custo, preco_custo: custo })
      .select("id")
      .single();

    if (prodErr) { toast.error("Erro ao criar produto"); console.error(prodErr); return; }

    const canaisInsert = Array.from(novoCanaisSelecionados).map((canalId) => {
      const config = canaisConfig[canalId];
      const preco = getPrecoForCanal(canalId);
      const margemReal = getMargemRealForCanal(canalId);
      return {
        produto_id: prod.id, canal: canalId, preco, margem: margemReal,
      };
    });

    const { error: cErr } = await supabase.from("marketplace_produtos" as any).insert(canaisInsert);
    if (cErr) { toast.error("Erro ao vincular canais"); console.error(cErr); return; }

    toast.success(`Produto salvo em ${novoCanaisSelecionados.size} canal(is)`);
    setDialogNovo(false);
    resetNovoForm();
    carregarProdutos();
  }

  function resetNovoForm() {
    setNovoNome(""); setNovoSku(""); setNovoCusto(""); setNovoValorVenda("");
    setNovoImposto("6"); setNovoMargem("30"); setNovoCanaisSelecionados(new Set());
    setCanaisConfig({}); setCanaisAbertos(new Set());
  }

  // ── Importar do Catálogo ──
  const buscaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [buscandoCatalogo, setBuscandoCatalogo] = useState(false);

  async function abrirImportar() {
    setDialogImportar(true);
    setSelecionados(new Set());
    setBuscaImportar("");
    await buscarCatalogo("");
  }

  async function buscarCatalogo(termo: string) {
    setBuscandoCatalogo(true);
    if (termo.trim().length >= 2) {
      const termos = termo.trim().split(/\s+/).filter(Boolean);
      const { data } = await supabase.rpc("buscar_produtos_catalogo", { termos, p_empresa_id: empresaId });
      // Sort by relevance: items whose name contains the full search term first,
      // then by how many search terms appear consecutively in the name
      const termoLower = termo.trim().toLowerCase();
      const sorted = (data || []).sort((a: any, b: any) => {
        const nA = (a.nome || "").toLowerCase();
        const nB = (b.nome || "").toLowerCase();
        // Exact substring match of full query gets top priority
        const exactA = nA.includes(termoLower) ? 0 : 1;
        const exactB = nB.includes(termoLower) ? 0 : 1;
        if (exactA !== exactB) return exactA - exactB;
        // Then sort by position of first term in name (earlier = better)
        const posA = nA.indexOf(termos[0].toLowerCase());
        const posB = nB.indexOf(termos[0].toLowerCase());
        if (posA !== posB) return posA - posB;
        // Alphabetical fallback
        return nA.localeCompare(nB);
      });
      setProdutosCatalogo(sorted);
    } else {
      const { data } = await supabase
        .from("produtos_catalogo")
        .select("id, nome, codigo_cpl, codigo_fornecedor, custo_final, preco_custo, imagem_url")
        .order("nome").limit(50);
      setProdutosCatalogo(data || []);
    }
    setBuscandoCatalogo(false);
  }

  function handleBuscaImportarChange(valor: string) {
    setBuscaImportar(valor);
    if (buscaTimerRef.current) clearTimeout(buscaTimerRef.current);
    buscaTimerRef.current = setTimeout(() => buscarCatalogo(valor), 400);
  }

  async function importarSelecionados() {
    if (selecionados.size === 0) { toast.error("Selecione ao menos 1 produto"); return; }
    if (canaisImportar.size === 0) { toast.error("Selecione ao menos 1 canal"); return; }
    setImportando(true);

    const margem = parseFloat(margemImportar) || 30;
    const imposto = parseFloat(impostoImportar) || 6;
    const rows: any[] = [];

    produtosCatalogo.filter((p) => selecionados.has(p.id)).forEach((p) => {
      const custo = p.custo_final || p.preco_custo || 0;
      Array.from(canaisImportar).forEach((canal) => {
        const comissao = getDefaultComissao(canal);
        rows.push({
          produto_id: p.id, canal,
          preco: calcPrecoCanal(custo, margem, comissao, imposto, 0, 0),
          margem,
        });
      });
    });

    const { error } = await supabase.from("marketplace_produtos" as any).upsert(rows, { onConflict: "produto_id,canal" });
    setImportando(false);

    if (error) { toast.error("Erro ao importar"); console.error(error); return; }
    toast.success(`${selecionados.size} produto(s) importado(s) para ${canaisImportar.size} canal(is)`);
    setDialogImportar(false);
    carregarProdutos();
  }

  // ── Editar Preço ──
  function abrirEditPreco(produtoId: string, canalId: string, canal: string, preco: number) {
    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return;
    const canalData = produto.canais.find((c) => c.id === canalId);
    setEditNome(produto.nome);
    setEditSku(produto.codigo_fornecedor || produto.codigo_cpl);
    setEditCusto(produto.custo_final.toFixed(2));
    setEditPreco(preco.toFixed(2));
    setEditImposto("6");
    setEditFrete("0");
    setEditAds("0");
    setEditComissao(String(getDefaultComissao(canal)));
    setEditMargem(canalData?.margem?.toString() || "30");
    setEditMLCategoria("geral");
    setEditMLPremium(false);
    setEditShopeeFreteExtra(false);
    setEditAmazonPlano("individual");
    setEditAmazonCategoria("outros");
    setEditAmazonFba("0");
    setEditTarifasAberto(false);
    // Set canal-specific defaults
    if (canal === "mercado_livre") {
      setEditComissao("11");
    } else if (canal === "shopee") {
      setEditComissao("14");
    } else if (canal === "amazon") {
      setEditComissao("15");
    }
    setEditDialog({ produtoId, canalId, canal });
  }

  // Edit dialog calculation helpers
  function getEditPrecoSugerido(): number {
    const custo = parseFloat(editCusto) || 0;
    const margem = parseFloat(editMargem) || 30;
    const imposto = parseFloat(editImposto) || 6;
    const comissao = parseFloat(editComissao) || 0;
    const frete = parseFloat(editFrete) || 0;
    const ads = parseFloat(editAds) || 0;
    let extraFixo = frete + ads;
    if (editDialog?.canal === "amazon") {
      if (editAmazonPlano === "individual") extraFixo += 2;
      extraFixo += (parseFloat(editAmazonFba) || 0);
    }
    return calcPrecoCanal(custo, margem, comissao, imposto, extraFixo, 0);
  }

  function getEditLucro(): number {
    const custo = parseFloat(editCusto) || 0;
    const preco = parseFloat(editPreco) || 0;
    const imposto = parseFloat(editImposto) || 6;
    const comissao = parseFloat(editComissao) || 0;
    const frete = parseFloat(editFrete) || 0;
    const ads = parseFloat(editAds) || 0;
    let extraFixo = frete + ads;
    if (editDialog?.canal === "amazon") {
      if (editAmazonPlano === "individual") extraFixo += 2;
      extraFixo += (parseFloat(editAmazonFba) || 0);
    }
    return calcLucro(custo, preco, comissao, imposto, extraFixo, 0);
  }

  function getEditMargemReal(): number {
    const custo = parseFloat(editCusto) || 0;
    const preco = parseFloat(editPreco) || 0;
    const imposto = parseFloat(editImposto) || 6;
    const comissao = parseFloat(editComissao) || 0;
    const frete = parseFloat(editFrete) || 0;
    const ads = parseFloat(editAds) || 0;
    let extraFixo = frete + ads;
    if (editDialog?.canal === "amazon") {
      if (editAmazonPlano === "individual") extraFixo += 2;
      extraFixo += (parseFloat(editAmazonFba) || 0);
    }
    return calcMargemReal(custo, preco, comissao, imposto, extraFixo, 0);
  }

  function handleEditMLCategoriaChange(catId: string) {
    const cat = ML_CATEGORIAS.find(c => c.id === catId);
    if (!cat) return;
    setEditMLCategoria(catId);
    setEditComissao(String(editMLPremium ? cat.premium : cat.classico));
  }

  function handleEditMLPremiumToggle(premium: boolean) {
    setEditMLPremium(premium);
    const cat = ML_CATEGORIAS.find(c => c.id === editMLCategoria);
    if (cat) setEditComissao(String(premium ? cat.premium : cat.classico));
  }

  async function salvarEditPreco() {
    if (!editDialog) return;
    const preco = parseFloat(editPreco) || 0;
    const margem = getEditMargemReal();
    const margemDesejada = parseFloat(editMargem) || 0;
    // Use the desired margin if it's explicitly set, otherwise use the real calculated margin
    const margemFinal = Math.round(margemDesejada * 10) / 10;

    console.log("[salvarEditPreco]", { preco, margem, margemDesejada, margemFinal, canalId: editDialog.canalId });

    const { error, data } = await supabase
      .from("marketplace_produtos" as any)
      .update({ preco, margem: margemFinal, atualizado_em: new Date().toISOString() })
      .eq("id", editDialog.canalId)
      .select();

    console.log("[salvarEditPreco] result:", { error, data });

    if (error) { toast.error("Erro ao atualizar: " + error.message); return; }
    if (!data || (data as any[]).length === 0) { toast.error("Nenhum registro atualizado. Verifique o ID."); return; }
    const produto = produtos.find((p) => p.id === editDialog.produtoId);
    const canalInfo = getCanalInfo(editDialog.canal);
    toast.success(`${produto?.nome || "Produto"} atualizado no ${canalInfo?.nome || editDialog.canal} com sucesso!`);
    setEditDialog(null);
    carregarProdutos();
  }

  // ── Remover / Adicionar canal ──
  async function removerCanal(mkId: string) {
    const { error } = await supabase.from("marketplace_produtos" as any).delete().eq("id", mkId);
    if (error) { toast.error("Erro ao remover"); return; }
    toast.success("Canal removido");
    carregarProdutos();
  }

  async function adicionarCanal() {
    if (!addCanalDialog || !addCanalId) return;
    const produto = produtos.find((p) => p.id === addCanalDialog);
    if (!produto) return;
    if (produto.canais.some((c) => c.canal === addCanalId)) { toast.error("Canal já adicionado"); return; }
    const margem = parseFloat(addCanalMargem) || 30;
    const comissao = getDefaultComissao(addCanalId);
    const preco = calcPrecoCanal(produto.custo_final, margem, comissao, 6, 0, 0);

    const { error } = await supabase.from("marketplace_produtos" as any).insert({
      produto_id: produto.id, canal: addCanalId, preco, margem,
    });

    if (error) { toast.error("Erro ao adicionar canal"); return; }
    toast.success("Canal adicionado");
    setAddCanalDialog(null); setAddCanalId("");
    carregarProdutos();
  }

  async function limparCatalogo() {
    if (produtos.length === 0) return;
    const { error } = await supabase.from("marketplace_produtos" as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) { toast.error("Erro ao limpar"); return; }
    toast.success("Catálogo marketplace limpo");
    carregarProdutos();
  }

  function getCanalInfo(id: string) {
    return CANAIS.find((c) => c.id === id);
  }

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  // ── ML Commission handler ──
  function handleMLCategoriaChange(catId: string) {
    const cat = ML_CATEGORIAS.find(c => c.id === catId);
    if (!cat) return;
    const config = canaisConfig["mercado_livre"];
    const isPremium = config?.mlPremium || false;
    updateCanalConfig("mercado_livre", {
      mlCategoria: catId,
      comissao: isPremium ? cat.premium : cat.classico,
    });
  }

  function handleMLPremiumToggle(premium: boolean) {
    const catId = canaisConfig["mercado_livre"]?.mlCategoria || "geral";
    const cat = ML_CATEGORIAS.find(c => c.id === catId);
    if (!cat) return;
    updateCanalConfig("mercado_livre", {
      mlPremium: premium,
      comissao: premium ? cat.premium : cat.classico,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus Produtos</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus produtos em múltiplos marketplaces</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" onClick={limparCatalogo} disabled={produtos.length === 0} className="gap-2">
            <Trash2 className="h-4 w-4" /> Limpar Catálogo
          </Button>
          <Button variant="outline" onClick={abrirImportar} className="gap-2">
            <Upload className="h-4 w-4" /> Importar
          </Button>
          <Button onClick={() => { resetNovoForm(); setDialogNovo(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar produtos..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>
        <Input placeholder="SKU..." value={filtroSku} onChange={(e) => setFiltroSku(e.target.value)} className="w-full sm:w-32" />
        <Select value={filtroCanal} onValueChange={setFiltroCanal}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {CANAIS.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : produtosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg mb-1">Nenhum produto cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">Importe produtos do seu catálogo ou adicione manualmente</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={abrirImportar} className="gap-2"><Upload className="h-4 w-4" /> Importar do Catálogo</Button>
              <Button onClick={() => { resetNovoForm(); setDialogNovo(true); }} className="gap-2"><Plus className="h-4 w-4" /> Novo Produto</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {produtosFiltrados.map((produto) => (
            <Card key={produto.id} className="overflow-hidden">
              <CardContent className="p-5 space-y-3">
                {/* Badges dos canais */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  {produto.canais.map((c) => {
                    const info = getCanalInfo(c.canal);
                    if (!info) return null;
                    return (
                      <Badge key={c.id} className={`${info.bg} ${info.text} text-[10px] px-2 py-0.5 font-semibold border-0 gap-1`}>
                        {info.logo && <img src={info.logo} alt={info.nome} className="h-3.5 w-3.5 object-contain" />}
                        {info.nome}
                      </Badge>
                    );
                  })}
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" /> {produto.canais.length} canais
                  </span>
                </div>

                {/* Nome e SKU */}
                <div>
                  <h3 className="font-bold text-base leading-tight">{produto.nome}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">SKU: {produto.codigo_fornecedor || produto.codigo_cpl}</p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Custo: <span className="font-semibold text-foreground">{formatBRL(produto.custo_final)}</span>
                </p>

                {/* Preços por canal */}
                <div className="space-y-2">
                  {produto.canais.map((canal) => {
                    const info = getCanalInfo(canal.canal);
                    if (!info) return null;
                    const margemColor = canal.margem >= 20 ? "text-emerald-600" : canal.margem >= 10 ? "text-amber-600" : "text-destructive";
                    return (
                      <div key={canal.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <Badge className={`${info.bg} ${info.text} text-[9px] px-2 py-0.5 font-semibold border-0 shrink-0 gap-1`}>
                          {info.logo && <img src={info.logo} alt={info.nome} className="h-3.5 w-3.5 object-contain" />}
                          {info.nome}
                        </Badge>
                        <span className="font-bold text-sm">{formatBRL(canal.preco)}</span>
                        <span className={`text-xs font-semibold ${margemColor}`}>{canal.margem}%</span>
                        <div className="ml-auto flex gap-1.5">
                          <button onClick={() => abrirEditPreco(produto.id, canal.id, canal.canal, canal.preco)} className="text-muted-foreground hover:text-primary transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => removerCanal(canal.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => { setAddCanalDialog(produto.id); setAddCanalId(""); setAddCanalMargem("30"); }}
                  className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors py-1.5 border border-dashed border-border rounded-lg"
                >
                  + Adicionar canal
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}



      {/* ══════════ Dialog: Novo Produto Multicanal ══════════ */}
      <Dialog open={dialogNovo} onOpenChange={setDialogNovo}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Novo Produto Multicanal
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Cadastre uma vez e configure para múltiplos marketplaces</p>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Dados do Produto */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados do Produto</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Nome do Produto</Label>
                <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex: Kit Transmissão Riffel" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">SKU</Label>
                <Input value={novoSku} onChange={(e) => setNovoSku(e.target.value)} placeholder="Ex: 3534" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Custo (R$)</Label>
                <Input type="number" value={novoCusto} onChange={(e) => setNovoCusto(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Valor de Venda (R$)</Label>
                <Input type="number" value={novoValorVenda} onChange={(e) => setNovoValorVenda(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Impostos (%)</Label>
                <Input type="number" value={novoImposto} onChange={(e) => setNovoImposto(e.target.value)} placeholder="6" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Margem (%)</Label>
                <Input type="number" value={novoMargem} onChange={(e) => setNovoMargem(e.target.value)} placeholder="30" />
              </div>
            </div>

            {/* Canais de Venda */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Canais de Venda</p>
            <div className="grid grid-cols-3 gap-3">
              {CANAIS.map((c) => {
                const selected = novoCanaisSelecionados.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCanal(c.id)}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-all ${
                      selected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    {selected ? (
                      <div className="h-5 w-5 rounded-md bg-primary flex items-center justify-center shrink-0">
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-border shrink-0" />
                    )}
                    {c.logo && <img src={c.logo} alt={c.nome} className="h-5 w-5 object-contain shrink-0" />}
                    <span className="text-sm font-medium">{c.nome}</span>
                  </button>
                );
              })}
            </div>

            {/* Configuração por Canal */}
            {novoCanaisSelecionados.size > 0 && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Configuração por Canal ({novoCanaisSelecionados.size})
                </p>
                <div className="space-y-3">
                  {Array.from(novoCanaisSelecionados).map((canalId) => {
                    const info = getCanalInfo(canalId);
                    const config = canaisConfig[canalId];
                    if (!info || !config) return null;
                    const isOpen = canaisAbertos.has(canalId);
                    const preco = getPrecoForCanal(canalId);
                    const lucro = getLucroForCanal(canalId);
                    const margemReal = getMargemRealForCanal(canalId);
                    const mlCat = ML_CATEGORIAS.find(c => c.id === config.mlCategoria);

                    return (
                      <div key={canalId} className="rounded-xl border-2 border-amber-300/60 bg-amber-50/30 dark:bg-amber-950/10 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          <Badge className={`${info.bg} ${info.text} text-xs px-2.5 py-0.5 font-semibold border-0`}>
                            {info.nome}
                          </Badge>
                          <span className="font-bold text-sm text-primary">{formatBRL(preco)}</span>
                          <span className="text-xs text-muted-foreground">Margem: {margemReal.toFixed(1)}%</span>
                          <div className="ml-auto flex items-center gap-1">
                            <button onClick={() => toggleCanal(canalId)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setCanaisAbertos(prev => {
                                const n = new Set(prev);
                                n.has(canalId) ? n.delete(canalId) : n.add(canalId);
                                return n;
                              })}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            >
                              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Config */}
                        {isOpen && (
                          <div className="px-4 pb-4 space-y-4">
                            {/* ML Specific Config */}
                            {canalId === "mercado_livre" && (
                              <div className="rounded-lg bg-background border border-border p-3 space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🛒</span>
                                  <div>
                                    <p className="text-sm font-semibold">Configurações Mercado Livre 2026</p>
                                    <p className="text-xs text-muted-foreground">Taxas oficiais por categoria</p>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium flex items-center gap-1">
                                    Categoria do Produto
                                    <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                    <TooltipContent><p className="text-xs">Selecione a categoria para aplicar a comissão correta</p></TooltipContent></Tooltip></TooltipProvider>
                                  </Label>
                                  <Select value={config.mlCategoria || "geral"} onValueChange={handleMLCategoriaChange}>
                                    <SelectTrigger className="bg-background">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ML_CATEGORIAS.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                          {cat.nome} <span className="text-muted-foreground ml-1">({cat.classico}% | {cat.premium}%)</span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                                  <div>
                                    <Label className="text-xs font-medium flex items-center gap-1">
                                      Tipo de Anúncio
                                      <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                      <TooltipContent><p className="text-xs">Clássico tem comissão menor, Premium tem mais visibilidade</p></TooltipContent></Tooltip></TooltipProvider>
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                      {config.mlPremium ? "Premium" : "Clássico"}: {config.comissao}% de comissão
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs font-medium">
                                    <span className={!config.mlPremium ? "text-foreground" : "text-muted-foreground"}>Clássico</span>
                                    <Switch checked={config.mlPremium} onCheckedChange={handleMLPremiumToggle} />
                                    <span className={config.mlPremium ? "text-foreground" : "text-muted-foreground"}>Premium</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Shopee Specific */}
                            {canalId === "shopee" && (
                              <div className="rounded-lg bg-background border border-border p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-semibold">Frete Grátis Extra</p>
                                    <p className="text-xs text-muted-foreground">Comissão: {config.comissao}%</p>
                                  </div>
                                  <Switch
                                    checked={config.shopeeFreteExtra}
                                    onCheckedChange={(v) => updateCanalConfig("shopee", {
                                      shopeeFreteExtra: v,
                                      comissao: v ? 20 : 14,
                                    })}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Amazon Specific */}
                            {canalId === "amazon" && (
                              <div className="rounded-lg bg-background border border-border p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">a</span>
                                  <div>
                                    <p className="text-sm font-semibold">Configurações Amazon</p>
                                  </div>
                                </div>

                                {/* Plano */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium flex items-center gap-1">
                                    Plano de Conta
                                    <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                    <TooltipContent><p className="text-xs">Individual cobra R$2/unidade. Profissional cobra R$19/mês.</p></TooltipContent></Tooltip></TooltipProvider>
                                  </Label>
                                  <Select
                                    value={config.amazonPlano || "individual"}
                                    onValueChange={(v: "individual" | "profissional") => updateCanalConfig("amazon", { amazonPlano: v })}
                                  >
                                    <SelectTrigger className="bg-background">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="individual">Individual - R$ 2,00 por unidade vendida</SelectItem>
                                      <SelectItem value="profissional">Profissional - Mensalidade de R$ 19,00/mês</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Plano info */}
                                <div className="rounded-lg bg-muted/50 border border-border p-3">
                                  <div className="flex items-start gap-2">
                                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                      <p className="text-xs font-semibold">
                                        {config.amazonPlano === "profissional" ? "Plano Profissional" : "Plano Individual"}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {config.amazonPlano === "profissional"
                                          ? "Sem taxa por unidade. Considere a mensalidade de R$ 19,00 em seus custos fixos."
                                          : "Taxa de R$ 2,00 por unidade será adicionada automaticamente"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Categoria */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium flex items-center gap-1">
                                    📦 Categoria do Produto
                                    <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                    <TooltipContent><p className="text-xs">Cada categoria tem uma comissão diferente</p></TooltipContent></Tooltip></TooltipProvider>
                                  </Label>
                                  <Select
                                    value={config.amazonCategoria || "outros"}
                                    onValueChange={(v) => {
                                      const cat = AMAZON_CATEGORIAS.find(c => c.id === v);
                                      updateCanalConfig("amazon", {
                                        amazonCategoria: v,
                                        comissao: cat?.comissao || 15,
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="bg-background">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {AMAZON_CATEGORIAS.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                          {cat.nome} ({cat.comissao}%)
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Comissão da categoria */}
                                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                                  <span className="text-xs text-muted-foreground">Comissão da Categoria:</span>
                                  <span className="text-sm font-bold text-primary">{config.comissao}%</span>
                                </div>

                                {/* Comissão mínima info */}
                                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                    <p className="text-xs">Comissão mínima de R$ 2,00 será aplicada automaticamente</p>
                                  </div>
                                </div>

                                {/* FBA */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium flex items-center gap-1">
                                    📦 Taxa FBA - Envio/Armazenamento (R$)
                                    <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                    <TooltipContent><p className="text-xs">Custo da logística FBA por unidade</p></TooltipContent></Tooltip></TooltipProvider>
                                  </Label>
                                  <Input
                                    type="number"
                                    value={config.amazonFba || ""}
                                    onChange={(e) => updateCanalConfig("amazon", { amazonFba: parseFloat(e.target.value) || 0 })}
                                    placeholder="Ex: 15.00"
                                    className="bg-background"
                                  />
                                  <p className="text-[10px] text-muted-foreground">Opcional: preencha se utiliza logística FBA da Amazon</p>
                                </div>

                                {/* Resumo taxas */}
                                <div className="rounded-lg bg-muted border border-border p-3 space-y-1">
                                  <p className="text-xs font-semibold">📊 Taxas Amazon Brasil:</p>
                                  <ul className="text-xs text-muted-foreground space-y-0.5">
                                    <li>• Comissão por categoria: {config.comissao}%</li>
                                    <li>• Comissão mínima: R$ 2,00 por item</li>
                                    <li>• Plano Individual: +R$ 2,00/unidade vendida</li>
                                    <li>• Plano Profissional: R$ 19,00/mês</li>
                                  </ul>
                                </div>
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium flex items-center gap-1">
                                Comissão Aplicada (%)
                                <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                <TooltipContent><p className="text-xs">Percentual cobrado pelo marketplace sobre cada venda</p></TooltipContent></Tooltip></TooltipProvider>
                              </Label>
                              <Input
                                type="number"
                                value={config.comissao}
                                onChange={(e) => updateCanalConfig(canalId, { comissao: parseFloat(e.target.value) || 0 })}
                                className="bg-background"
                              />
                            </div>

                            {/* ML Tarifa Fixa Info */}
                            {canalId === "mercado_livre" && (
                              <>
                                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                                  <div className="flex items-start gap-2">
                                    <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                    <div>
                                      <p className="text-xs font-semibold">Tarifa Fixa Automática</p>
                                      <p className="text-xs text-muted-foreground">Isento de tarifa fixa (acima de R$ 79,00)</p>
                                      <p className="text-xs text-muted-foreground">🚚 Frete Grátis é obrigatório para produtos acima de R$ 79,00</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 px-3 py-2">
                                  <p className="text-xs font-semibold">📊 Resumo: Taxa ML: {config.comissao}% + Tarifa Fixa: {formatBRL(getTarifaFixaML(preco, config.mlPremium || false))}</p>
                                </div>
                              </>
                            )}

                            {/* Frete e Ads */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium flex items-center gap-1">
                                  📦 Frete/Logística (R$)
                                  <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                  <TooltipContent><p className="text-xs">Custo de envio por unidade</p></TooltipContent></Tooltip></TooltipProvider>
                                </Label>
                                <Input
                                  type="number"
                                  value={config.frete}
                                  onChange={(e) => updateCanalConfig(canalId, { frete: parseFloat(e.target.value) || 0 })}
                                  placeholder="0.00"
                                  className="bg-background"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium flex items-center gap-1">
                                  📢 {canalId === "mercado_livre" ? "Mercado Ads" : "Ads"} (R$)
                                  <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                  <TooltipContent><p className="text-xs">Custo de publicidade por unidade vendida</p></TooltipContent></Tooltip></TooltipProvider>
                                </Label>
                                <Input
                                  type="number"
                                  value={config.ads}
                                  onChange={(e) => updateCanalConfig(canalId, { ads: parseFloat(e.target.value) || 0 })}
                                  placeholder="0.00"
                                  className="bg-background"
                                />
                              </div>
                            </div>

                            {/* Summary Footer */}
                            <div className="rounded-lg bg-muted/50 p-3 grid grid-cols-3 gap-2 text-center">
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">Preço Sugerido</p>
                                <p className="text-sm font-bold text-primary">{formatBRL(preco)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">Lucro</p>
                                <p className={`text-sm font-bold ${lucro >= 0 ? "text-emerald-600" : "text-destructive"}`}>{formatBRL(lucro)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">Margem Real</p>
                                <p className={`text-sm font-bold ${margemReal >= 20 ? "text-emerald-600" : margemReal >= 10 ? "text-amber-600" : "text-destructive"}`}>
                                  {margemReal.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={criarProduto} className="gap-2">
              {novoCanaisSelecionados.size > 0
                ? `Salvar em ${novoCanaisSelecionados.size} canal${novoCanaisSelecionados.size > 1 ? "is" : ""}`
                : "Salvar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Importar */}
      <Dialog open={dialogImportar} onOpenChange={setDialogImportar}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Importar do Catálogo</DialogTitle></DialogHeader>
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="space-y-1">
              <Label>Canais</Label>
              <div className="flex flex-wrap gap-2">
                {CANAIS.map((c) => (
                  <button key={c.id} onClick={() => setCanaisImportar((prev) => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${canaisImportar.has(c.id) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"}`}
                  >{c.nome}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Margem (%)</Label>
                <Input type="number" value={margemImportar} onChange={(e) => setMargemImportar(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Impostos (%)</Label>
                <Input type="number" value={impostoImportar} onChange={(e) => setImpostoImportar(e.target.value)} />
              </div>
            </div>
            <Input placeholder="Buscar no catálogo... (digite ao menos 2 letras)" value={buscaImportar} onChange={(e) => handleBuscaImportarChange(e.target.value)} />
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {buscandoCatalogo ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : produtosCatalogo.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {buscaImportar ? "Nenhum produto encontrado" : "Digite para buscar no catálogo"}
                </p>
              ) : (
                produtosCatalogo.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer text-sm">
                    <input type="checkbox" checked={selecionados.has(p.id)}
                      onChange={() => setSelecionados((prev) => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}
                      className="rounded" />
                    <span className="flex-1 truncate">{p.nome}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatBRL(p.custo_final || p.preco_custo || 0)}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={importarSelecionados} disabled={importando} className="gap-2">
              {importando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Importar ({selecionados.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Produto */}
      <Dialog open={editDialog !== null} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Nome e SKU */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Nome do Produto</Label>
                <Input value={editNome} readOnly className="bg-muted" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium flex items-center gap-1">
                  SKU
                  <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">Código identificador do produto</p></TooltipContent></Tooltip></TooltipProvider>
                </Label>
                <Input value={editSku} readOnly className="bg-muted" />
              </div>
            </div>

            {/* Marketplace */}
            <div className="space-y-1">
              <Label className="text-xs font-medium flex items-center gap-1">
                Marketplace
                <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent><p className="text-xs">Canal de venda deste produto</p></TooltipContent></Tooltip></TooltipProvider>
              </Label>
              <div className="flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: getCanalInfo(editDialog?.canal || "")?.cor }} />
                <span className="text-sm font-medium">{getCanalInfo(editDialog?.canal || "")?.nome || editDialog?.canal}</span>
              </div>
            </div>

            {/* ML Specific Config */}
            {editDialog?.canal === "mercado_livre" && (
              <div className="rounded-xl border-2 border-amber-300/60 bg-amber-50/30 dark:bg-amber-950/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛒</span>
                  <div>
                    <p className="text-sm font-semibold">Configurações Mercado Livre 2026</p>
                    <p className="text-xs text-muted-foreground">Taxas oficiais por categoria</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    Categoria do Produto
                    <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs">Selecione a categoria para aplicar a comissão correta</p></TooltipContent></Tooltip></TooltipProvider>
                  </Label>
                  <Select value={editMLCategoria} onValueChange={handleEditMLCategoriaChange}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ML_CATEGORIAS.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nome} <span className="text-muted-foreground ml-1">({cat.classico}% | {cat.premium}%)</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                  <div>
                    <Label className="text-xs font-medium flex items-center gap-1">
                      Tipo de Anúncio
                      <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent><p className="text-xs">Clássico tem comissão menor, Premium tem mais visibilidade</p></TooltipContent></Tooltip></TooltipProvider>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {editMLPremium ? "Premium" : "Clássico"}: {editComissao}% de comissão
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className={!editMLPremium ? "text-foreground" : "text-muted-foreground"}>Clássico</span>
                    <Switch checked={editMLPremium} onCheckedChange={handleEditMLPremiumToggle} />
                    <span className={editMLPremium ? "text-foreground" : "text-muted-foreground"}>Premium</span>
                  </div>
                </div>
              </div>
            )}

            {/* Shopee Specific */}
            {editDialog?.canal === "shopee" && (
              <div className="rounded-xl border-2 border-amber-300/60 bg-amber-50/30 dark:bg-amber-950/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Frete Grátis Extra</p>
                    <p className="text-xs text-muted-foreground">Comissão: {editComissao}%</p>
                  </div>
                  <Switch
                    checked={editShopeeFreteExtra}
                    onCheckedChange={(v) => {
                      setEditShopeeFreteExtra(v);
                      setEditComissao(v ? "20" : "14");
                    }}
                  />
                </div>
              </div>
            )}

            {/* Amazon Specific */}
            {editDialog?.canal === "amazon" && (
              <div className="rounded-xl border-2 border-amber-300/60 bg-amber-50/30 dark:bg-amber-950/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">a</span>
                  <p className="text-sm font-semibold">Configurações Amazon</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Plano de Conta</Label>
                  <Select value={editAmazonPlano} onValueChange={(v: "individual" | "profissional") => setEditAmazonPlano(v)}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual - R$ 2,00 por unidade vendida</SelectItem>
                      <SelectItem value="profissional">Profissional - R$ 19,00/mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">📦 Categoria do Produto</Label>
                  <Select value={editAmazonCategoria} onValueChange={(v) => {
                    const cat = AMAZON_CATEGORIAS.find(c => c.id === v);
                    setEditAmazonCategoria(v);
                    if (cat) setEditComissao(String(cat.comissao));
                  }}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AMAZON_CATEGORIAS.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nome} ({cat.comissao}%)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">📦 Taxa FBA (R$)</Label>
                  <Input type="number" value={editAmazonFba} onChange={(e) => setEditAmazonFba(e.target.value)} placeholder="0.00" className="bg-background" />
                </div>
              </div>
            )}

            {/* Comissão Aplicada */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                Comissão Aplicada (%)
                <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent><p className="text-xs">Percentual cobrado pelo marketplace sobre cada venda</p></TooltipContent></Tooltip></TooltipProvider>
              </Label>
              <Input type="number" value={editComissao} onChange={(e) => setEditComissao(e.target.value)} />
            </div>

            {/* ML Tarifa Fixa Info */}
            {editDialog?.canal === "mercado_livre" && (
              <>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">Tarifa Fixa Automática</p>
                      <p className="text-xs text-muted-foreground">Isento de tarifa fixa (acima de R$ 79,00)</p>
                      <p className="text-xs text-muted-foreground">🚚 Frete Grátis é obrigatório para produtos acima de R$ 79,00</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 px-3 py-2">
                  <p className="text-xs font-semibold">📊 Resumo: Taxa ML: {editComissao}% + Tarifa Fixa: {formatBRL(getTarifaFixaML(parseFloat(editPreco) || 0, editMLPremium))}</p>
                </div>

                {/* Tabela tarifas fixas */}
                <Collapsible open={editTarifasAberto} onOpenChange={setEditTarifasAberto}>
                  <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {editTarifasAberto ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    📊 Ver tabela de tarifas fixas 2026
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="rounded-lg border border-border overflow-hidden text-xs">
                      <div className="grid grid-cols-3 bg-muted px-3 py-1.5 font-semibold">
                        <span>Faixa de Preço</span><span>Clássico</span><span>Premium</span>
                      </div>
                      {ML_TARIFAS_FIXAS.map((t, i) => (
                        <div key={i} className="grid grid-cols-3 px-3 py-1.5 border-t border-border">
                          <span>R$ {t.min.toFixed(2)} – {t.max === Infinity ? "∞" : `R$ ${t.max.toFixed(2)}`}</span>
                          <span>{t.nota ? t.nota : formatBRL(t.classico)}</span>
                          <span>{t.nota ? "—" : formatBRL(t.premium)}</span>
                        </div>
                      ))}
                      <div className="grid grid-cols-3 px-3 py-1.5 border-t border-border bg-muted/50">
                        <span>Livros</span>
                        <span className="col-span-2">R$ 3,00 (tarifa fixa especial)</span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}

            {/* Frete e Ads */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  📦 Frete/Logística (R$)
                  <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">Custo de envio por unidade</p></TooltipContent></Tooltip></TooltipProvider>
                </Label>
                <Input type="number" value={editFrete} onChange={(e) => setEditFrete(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  📢 {editDialog?.canal === "mercado_livre" ? "Mercado Ads" : "Ads"} (R$)
                  <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">Custo de publicidade por unidade vendida</p></TooltipContent></Tooltip></TooltipProvider>
                </Label>
                <Input type="number" value={editAds} onChange={(e) => setEditAds(e.target.value)} placeholder="0.00" />
              </div>
            </div>

            {/* Custo e Valor de Venda */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  Custo do Produto (R$)
                  <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">Valor de custo do produto no catálogo</p></TooltipContent></Tooltip></TooltipProvider>
                </Label>
                <Input type="number" value={editCusto} onChange={(e) => setEditCusto(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  Valor de Venda (R$)
                  <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">Preço final do anúncio no marketplace</p></TooltipContent></Tooltip></TooltipProvider>
                </Label>
                <Input type="number" value={editPreco} onChange={(e) => setEditPreco(e.target.value)} />
              </div>
            </div>

            {/* Impostos e Margem */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  Impostos (%)
                  <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">Percentual de impostos sobre a venda</p></TooltipContent></Tooltip></TooltipProvider>
                </Label>
                <Input type="number" value={editImposto} onChange={(e) => setEditImposto(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  Margem Desejada (%)
                  <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">Margem de lucro desejada</p></TooltipContent></Tooltip></TooltipProvider>
                </Label>
                <Input type="number" value={editMargem} onChange={(e) => {
                  setEditMargem(e.target.value);
                  // Auto-update price when margin changes
                  const custo = parseFloat(editCusto) || 0;
                  const margem = parseFloat(e.target.value) || 0;
                  const imposto = parseFloat(editImposto) || 6;
                  const comissao = parseFloat(editComissao) || 0;
                  const frete = parseFloat(editFrete) || 0;
                  const ads = parseFloat(editAds) || 0;
                  const totalPct = (comissao + imposto + margem) / 100;
                  if (totalPct < 1) {
                    const newPreco = (custo + frete + ads) / (1 - totalPct);
                    setEditPreco(newPreco.toFixed(2));
                  }
                }} className="border-primary/40" />
              </div>
            </div>

            {/* Comissão Marketplace */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Comissão Marketplace (%)</Label>
              <Input type="number" value={editComissao} readOnly className="bg-muted" />
            </div>

            {/* Resultado */}
            {(() => {
              const precoSugerido = getEditPrecoSugerido();
              const lucro = getEditLucro();
              const margemReal = getEditMargemReal();
              const tarifaFixa = editDialog?.canal === "mercado_livre" ? getTarifaFixaML(parseFloat(editPreco) || 0, editMLPremium) : 0;
              return (
                <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Preço Sugerido</p>
                      <p className="text-xl font-bold text-primary">{formatBRL(precoSugerido)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Lucro Estimado</p>
                      <p className={`text-xl font-bold ${lucro >= 0 ? "text-emerald-600" : "text-destructive"}`}>{formatBRL(lucro)}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Margem Real:</span>
                      <span className={`font-semibold ${margemReal >= 20 ? "text-emerald-600" : margemReal >= 10 ? "text-amber-600" : "text-destructive"}`}>
                        {margemReal.toFixed(1)}%
                      </span>
                    </div>
                    {editDialog?.canal === "mercado_livre" && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Taxa Fixa Calculada:</span>
                        <span className="font-semibold">{formatBRL(tarifaFixa)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={salvarEditPreco}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Adicionar Canal */}
      <Dialog open={addCanalDialog !== null} onOpenChange={() => setAddCanalDialog(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Adicionar Canal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Canal</Label>
              <Select value={addCanalId} onValueChange={setAddCanalId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{CANAIS.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Margem (%)</Label>
              <Input type="number" value={addCanalMargem} onChange={(e) => setAddCanalMargem(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={adicionarCanal} className="gap-2"><Plus className="h-4 w-4" />Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
