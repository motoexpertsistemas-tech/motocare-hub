import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Upload } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Save, X, Plus, Image as ImageIcon, Package, DollarSign,
  FileText, Truck, MapPin, Info, Camera, Search, Sparkles, Loader2, Layers, Trash2, Check, ChevronsUpDown,
} from "lucide-react";
import { ProductCombobox } from "@/components/ProductCombobox";
import { BRLInput } from "@/components/BRLInput";
import { NcmCestSearch } from "@/components/NcmCestSearch";

const CATEGORIAS_PADRAO = [
  "ACESSÓRIOS", "CABOS", "CARB-INJEÇÃO", "CAREN-PLÁSTICO",
  "CHASSI", "ELÉTRICA", "FERRA - EQUIP", "FIXAÇÃO",
  "MOTOR", "PNEU", "RODA", "SUSPENSÃO", "TRANSMISSÃO",
];
const CATEGORIAS_STORAGE_KEY = "categorias_produto_custom";

interface PrecoVenda {
  tipo: string;
  lucro_sugerido: number;
  lucro_utilizado: number;
  valor_venda_sugerido: number;
  valor_venda_utilizado: number;
}

import { toBRL, fromBRL } from "@/lib/utils";

function gerarSkuAutomatico(nomeProduto: string, codigoFabricante?: string, marcaProduto?: string): string {
  if (!nomeProduto) return '';

  // 1. Remove acentos e joga para maiúsculo
  let texto = nomeProduto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  // 2. Remove palavras irrelevantes (stop words) ou o termo "COD:" se o usuário digitar
  texto = texto.replace(/COD\s*:\s*\d*/g, '').replace(/SHINERAY/g, '');

  // 3. Pega as palavras chaves principais
  const palavras = texto.split(' ').filter(p => p.trim() !== '');
  
  const produto = palavras[0] || 'PROD';
  const complemento = palavras.slice(1, 4).join('');
  
  // 4. Formata o código final com marca e código do fabricante
  const prefixoMarca = marcaProduto ? `-${marcaProduto.substring(0, 4).toUpperCase()}` : '';
  const sufixoCodigo = codigoFabricante ? `-${codigoFabricante.trim()}` : '';
  
  // Limpa traços duplicados ou caracteres especiais restantes
  const skuGerado = `${produto}-${complemento}${prefixoMarca}${sufixoCodigo}`
    .replace(/[^A-Z0-9-]/g, '') // Mantém apenas letras, números e traços
    .substring(0, 30); // Limita tamanho

  return skuGerado;
}

// Extração de Aplicação
const MODELOS_MOTOS = [
  'POP 100', 'POP 110', 'POP 110I',
  'BIZ 100', 'BIZ 110', 'BIZ 125',
  'TITAN 125', 'TITAN 150', 'TITAN 160',
  'FAN 125', 'FAN 150', 'FAN 160',
  'BROS 150', 'BROS 160', 'XRE 190', 'XRE 300',
  'YBR 125', 'FACTOR 150', 'FAZER 250'
];

const MARCAS_MOTOS = ['HONDA', 'YAMAHA', 'SHINERAY', 'SUZUKI', 'TRAXX'];

export function extrairAplicacao(titulo: string): string {
  if (!titulo) return '';

  const textoLimpo = titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

  let modelosEncontrados: string[] = [];
  let marcasEncontradas: string[] = [];

  MODELOS_MOTOS.forEach(modelo => {
    const regex = new RegExp(`\\b${modelo}\\b`, 'g');
    if (regex.test(textoLimpo)) {
      modelosEncontrados.push(modelo);
    }
  });

  if (modelosEncontrados.length === 0) {
    if (textoLimpo.includes('POP') && textoLimpo.includes('100')) modelosEncontrados.push('POP 100');
    if (textoLimpo.includes('POP') && textoLimpo.includes('110')) modelosEncontrados.push('POP 110');
    if (textoLimpo.includes('BIZ') && textoLimpo.includes('100')) modelosEncontrados.push('BIZ 100');
    if (textoLimpo.includes('BIZ') && textoLimpo.includes('125')) modelosEncontrados.push('BIZ 125');
    if (textoLimpo.includes('TITAN') && textoLimpo.includes('150')) modelosEncontrados.push('TITAN 150');
    if (textoLimpo.includes('FAN') && textoLimpo.includes('160')) modelosEncontrados.push('FAN 160');
  }

  MARCAS_MOTOS.forEach(marca => {
    const regex = new RegExp(`\\b${marca}\\b`, 'g');
    if (regex.test(textoLimpo)) {
      marcasEncontradas.push(marca);
    }
  });

  const modelosFinais = [...new Set(modelosEncontrados)];
  const marcasFinais = [...new Set(marcasEncontradas)];

  if (modelosFinais.length > 0) {
    const stringModelos = modelosFinais.join(', ');
    const stringMarcas = marcasFinais.length > 0 ? ` ${marcasFinais.join('/')}` : '';
    return `${stringModelos}${stringMarcas}`.trim();
  }

  return '';
}

export default function EditarProduto() {
  const { id } = useParams();
  const isNew = !id;
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "dados";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(isNew);
  const { empresaId } = useEmpresa();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [categoriasList, setCategoriasList] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CATEGORIAS_STORAGE_KEY) || "[]");
      return Array.from(new Set([...CATEGORIAS_PADRAO, ...saved])).sort();
    } catch {
      return [...CATEGORIAS_PADRAO];
    }
  });
  const [categoriaOpen, setCategoriaOpen] = useState(false);
  const [categoriaSearch, setCategoriaSearch] = useState("");

  const handleAddCategoria = (nomeRaw?: string) => {
    const base = (nomeRaw ?? window.prompt("Nome da nova categoria:") ?? "").trim().toUpperCase();
    if (!base) return;
    if (categoriasList.includes(base)) {
      setCategoria(base);
      setCategoriaOpen(false);
      setCategoriaSearch("");
      return;
    }
    const novas = [...categoriasList, base].sort();
    setCategoriasList(novas);
    const customs = novas.filter((c) => !CATEGORIAS_PADRAO.includes(c));
    localStorage.setItem(CATEGORIAS_STORAGE_KEY, JSON.stringify(customs));
    setCategoria(base);
    setCategoriaOpen(false);
    setCategoriaSearch("");
    toast.success(`Categoria "${base}" adicionada`);
  };

  const handleUploadImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }
    setUploadingImg(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${empresaId || "sem-empresa"}/${id || "novo"}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setImagemUrl(urlData.publicUrl);
      toast.success("Imagem carregada!");
    } catch (err: any) {
      toast.error("Erro no upload: " + (err.message || err));
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Auto-generate code for new products
  const generateCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `MAN-${timestamp}${rand}`;
  };

  // Form state
  const [nome, setNome] = useState("");
  const [codigoCpl, setCodigoCpl] = useState("");
  const [skuEditadoManualmente, setSkuEditadoManualmente] = useState(false);
  const [marca, setMarca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [descricao, setDescricao] = useState("");
  const [unidade, setUnidade] = useState("UN");
  const [peso, setPeso] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [aplicacoes, setAplicacoes] = useState<string[]>([]);
  const [aplicacaoEditadaManualmente, setAplicacaoEditadaManualmente] = useState(false);
  const [cor, setCor] = useState("");
  const [novaAplicacao, setNovaAplicacao] = useState("");

  // Valores
  const [precoCusto, setPrecoCusto] = useState("0.00");
  const [despesasAcessorias, setDespesasAcessorias] = useState("0.00");
  const [outrasDespesas, setOutrasDespesas] = useState("0.00");
  const [custoFinal, setCustoFinal] = useState("0.00");
  const [precosVenda, setPrecosVenda] = useState<PrecoVenda[]>([]);
  const [precosVendaInitialized, setPrecosVendaInitialized] = useState(false);

  // Fetch valores_venda from DB to use as default price types
  const { data: valoresVendaDB } = useQuery({
    queryKey: ["valores_venda_defaults"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("valores_venda" as any)
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as unknown as { id: string; nome: string; media_lucro: number }[];
    },
  });

  // Estoque
  const [estoqueQuantidade, setEstoqueQuantidade] = useState("0");
  const [estoqueMinimo, setEstoqueMinimo] = useState("0");
  const [localizacao, setLocalizacao] = useState("");

  // Fiscal
  const [ncm, setNcm] = useState("");
  const [cest, setCest] = useState("");
  const [ean, setEan] = useState("");

  // Fornecedor
  const [fornecedor, setFornecedor] = useState("");
  const [codigoFornecedor, setCodigoFornecedor] = useState("");

  // Extras
  const [habilitarNf, setHabilitarNf] = useState("Sim");
  const [possuiComposicao, setPossuiComposicao] = useState("Não");

  // Composição
  interface ComposicaoItem {
    id?: string;
    produto_item_id: string;
    produto_nome: string;
    quantidade: number;
    unidade: string;
    custo: number;
  }
  const [composicaoItens, setComposicaoItens] = useState<ComposicaoItem[]>([]);
  const [composicaoLoaded, setComposicaoLoaded] = useState(false);

  // AI search state
  const [aiQuery, setAiQuery] = useState("");
  const [aiSearching, setAiSearching] = useState(false);
  const [fetchingPhoto, setFetchingPhoto] = useState(false);

  const handleFetchPhoto = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome do produto antes de buscar a foto");
      return;
    }
    setFetchingPhoto(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-single-product-image", {
        body: { nome, marca, codigo: codigoCpl, categoria },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      if (data?.image_url) {
        setImagemUrl(data.image_url);
        toast.success("Foto encontrada e adicionada!");
      } else {
        toast.info("Nenhuma foto encontrada para este produto.");
      }
    } catch (e: any) {
      toast.error("Erro ao buscar foto: " + (e.message || "erro desconhecido"));
    } finally {
      setFetchingPhoto(false);
    }
  };

  const handleAiSearch = async () => {
    const q = aiQuery.trim() || nome.trim();
    if (!q) {
      toast.error("Digite o nome do produto ou um termo de pesquisa");
      return;
    }
    setAiSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-product-details", {
        body: { query: q },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      const info = data?.data;
      if (!info) {
        toast.info("Nenhuma informação encontrada");
        return;
      }
      // Populate description and image (always overwrite image if found)
      if (info.descricao) setDescricao(info.descricao);
      if (info.imagem_url) setImagemUrl(info.imagem_url);
      const parts = [];
      if (info.descricao) parts.push("descrição");
      if (info.imagem_url) parts.push("foto");
      toast.success(parts.length > 0 ? `Preenchido com IA: ${parts.join(" e ")}!` : "Pesquisa concluída!");
    } catch (e: any) {
      console.error("AI search error:", e);
      toast.error("Erro na pesquisa IA: " + (e.message || "erro desconhecido"));
    } finally {
      setAiSearching(false);
    }
  };

  const { data: product, isLoading } = useQuery({
    queryKey: ["produto_edit", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos_catalogo")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!product) return;
    setNome(product.nome);
    setCodigoCpl(product.codigo_cpl || "");
    if (product.codigo_cpl) setSkuEditadoManualmente(true);
    setMarca(product.marca || "");
    setCategoria(product.categoria || "");
    setImagemUrl(product.imagem_url || "");
    setDescricao((product as any).descricao || "");
    setUnidade((product as any).unidade || "UN");
    setPeso((product as any).peso?.toString() || "");
    setObservacoes((product as any).observacoes || "");
    setAplicacoes(product.aplicacoes || []);
    if (product.aplicacoes && product.aplicacoes.length > 0) setAplicacaoEditadaManualmente(true);
    setCor((product as any).cor || "");
    setPrecoCusto((product as any).preco_custo ? Number((product as any).preco_custo).toFixed(2) : "0.00");
    setDespesasAcessorias((product as any).despesas_acessorias ? Number((product as any).despesas_acessorias).toFixed(2) : "0.00");
    setOutrasDespesas((product as any).outras_despesas ? Number((product as any).outras_despesas).toFixed(2) : "0.00");
    setCustoFinal((product as any).custo_final?.toString() || "0.00");
    setEstoqueQuantidade((product as any).estoque_quantidade?.toString() || "0");
    setEstoqueMinimo((product as any).estoque_minimo?.toString() || "0");
    setLocalizacao((product as any).localizacao || "");
    setNcm((product as any).ncm || "");
    setCest((product as any).cest || "");
    setEan((product as any).ean || "");
    setFornecedor((product as any).fornecedor || "");
    setCodigoFornecedor((product as any).codigo_fornecedor || "");
    setHabilitarNf((product as any).habilitar_nf === false ? "Não" : "Sim");
    setPossuiComposicao((product as any).possui_composicao === true ? "Sim" : "Não");
    if ((product as any).precos_venda && Array.isArray((product as any).precos_venda) && (product as any).precos_venda.length > 0) {
      // Normalize legacy formats: {nome, valor} → {tipo, valor_venda_utilizado, ...}
      const normalized: PrecoVenda[] = ((product as any).precos_venda as any[]).map((p: any) => {
        const tipo = p.tipo || p.nome || "Sem nome";
        const valorVendaUtilizado = p.valor_venda_utilizado ?? p.valor ?? 0;
        // Try to get lucro_sugerido from valores_venda DB match
        const dbMatch = valoresVendaDB?.find(
          (v) => v.nome.toLowerCase() === tipo.toLowerCase()
        );
        return {
          tipo,
          lucro_sugerido: p.lucro_sugerido ?? dbMatch?.media_lucro ?? 0,
          lucro_utilizado: p.lucro_utilizado ?? 0,
          valor_venda_sugerido: p.valor_venda_sugerido ?? 0,
          valor_venda_utilizado: valorVendaUtilizado,
        };
      });
      setPrecosVenda(normalized);
      setPrecosVendaInitialized(true);
    }
    // Mark as loaded so auto-calc doesn't overwrite DB values on first render
    setTimeout(() => setLoaded(true), 100);
  }, [product, valoresVendaDB]);

  // Load composição items
  useEffect(() => {
    if (!id || composicaoLoaded) return;
    (async () => {
      const { data } = await supabase
        .from("produto_composicao" as any)
        .select("*, produto_item:produto_item_id(nome, preco_custo)")
        .eq("produto_pai_id", id);
      if (data && Array.isArray(data)) {
        setComposicaoItens(data.map((d: any) => ({
          id: d.id,
          produto_item_id: d.produto_item_id,
          produto_nome: d.produto_item?.nome || "Produto",
          quantidade: Number(d.quantidade) || 1,
          unidade: d.unidade || "UN",
          custo: Number(d.custo) || Number(d.produto_item?.preco_custo) || 0,
        })));
      }
      setComposicaoLoaded(true);
    })();
  }, [id, composicaoLoaded]);

  // Initialize precosVenda from valores_venda DB when no saved prices exist,
  // or merge missing types into existing prices
  useEffect(() => {
    if (!valoresVendaDB || valoresVendaDB.length === 0) return;
    if (!precosVendaInitialized) {
      // New product or product without prices — set all defaults
      if (precosVenda.length === 0) {
        setPrecosVenda(valoresVendaDB.map(v => ({
          tipo: v.nome,
          lucro_sugerido: v.media_lucro ?? 0,
          lucro_utilizado: 0,
          valor_venda_sugerido: 0,
          valor_venda_utilizado: 0,
        })));
        setPrecosVendaInitialized(true);
      }
    } else {
      // Product has saved prices — merge any missing DB types
      const existingTypes = new Set(precosVenda.map(p => p.tipo.toLowerCase()));
      const missing = valoresVendaDB.filter(v => !existingTypes.has(v.nome.toLowerCase()));
      if (missing.length > 0) {
        setPrecosVenda(prev => [
          ...prev,
          ...missing.map(v => ({
            tipo: v.nome,
            lucro_sugerido: v.media_lucro ?? 0,
            lucro_utilizado: 0,
            valor_venda_sugerido: 0,
            valor_venda_utilizado: 0,
          })),
        ]);
      }
    }
  }, [valoresVendaDB, precosVenda.length, precosVendaInitialized]);

  // Auto-calc custo final only after user edits (not on initial load)
  useEffect(() => {
    if (!loaded) return;
    const c = parseFloat(precoCusto) || 0;
    const da = parseFloat(despesasAcessorias) || 0;
    const od = parseFloat(outrasDespesas) || 0;
    setCustoFinal((c + da + od).toFixed(2));
  }, [precoCusto, despesasAcessorias, outrasDespesas, loaded]);

  const calcularPrecos = () => {
    const cf = parseFloat(custoFinal) || 0;
    setPrecosVenda(precosVenda.map((p) => {
      const margin = p.lucro_sugerido || 0;
      const sugerido = parseFloat((cf * (1 + margin / 100)).toFixed(2));
      return {
        ...p,
        valor_venda_sugerido: sugerido,
        valor_venda_utilizado: sugerido,
        lucro_utilizado: margin,
      };
    }));
  };

  const updatePrecoVenda = (index: number, field: keyof PrecoVenda, value: number) => {
    setPrecosVenda(precosVenda.map((p, i) => {
      if (i !== index) return p;
      const updated = { ...p, [field]: value };
      // Auto-calculate lucro_utilizado when user types valor_venda_utilizado
      if (field === "valor_venda_utilizado") {
        const cf = parseFloat(custoFinal) || 0;
        if (cf > 0 && value > 0) {
          updated.lucro_utilizado = parseFloat((((value - cf) / cf) * 100).toFixed(2));
        } else {
          updated.lucro_utilizado = 0;
        }
      }
      // Auto-calculate valor_venda_utilizado when user types lucro_utilizado
      if (field === "lucro_utilizado") {
        const cf = parseFloat(custoFinal) || 0;
        if (cf > 0) {
          updated.valor_venda_utilizado = parseFloat((cf * (1 + value / 100)).toFixed(2));
        }
      }
      return updated;
    }));
  };

  const addPrecoVenda = () => {
    setPrecosVenda([...precosVenda, {
      tipo: "Novo", lucro_sugerido: 0, lucro_utilizado: 0,
      valor_venda_sugerido: 0, valor_venda_utilizado: 0,
    }]);
  };

  const addAplicacao = () => {
    const trimmed = novaAplicacao.trim().toUpperCase();
    if (trimmed && !aplicacoes.includes(trimmed)) {
      setAplicacoes([...aplicacoes, trimmed]);
      setNovaAplicacao("");
      setAplicacaoEditadaManualmente(true);
    }
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error("Nome do produto é obrigatório");
      return;
    }
    setSaving(true);

    const payload = {
      nome: nome.trim(),
      codigo_cpl: codigoCpl.trim(),
      marca: marca.trim() || null,
      categoria: categoria || null,
      imagem_url: imagemUrl.trim() || null,
      aplicacoes: aplicacoes.length > 0 ? aplicacoes : null,
      descricao: descricao.trim() || null,
      unidade: unidade || "UN",
      peso: peso ? parseFloat(peso) : null,
      observacoes: observacoes.trim() || null,
      preco_custo: parseFloat(precoCusto) || 0,
      despesas_acessorias: parseFloat(despesasAcessorias) || 0,
      outras_despesas: parseFloat(outrasDespesas) || 0,
      custo_final: parseFloat(custoFinal) || 0,
      precos_venda: precosVenda,
      estoque_quantidade: parseInt(estoqueQuantidade) || 0,
      estoque_minimo: parseInt(estoqueMinimo) || 0,
      localizacao: localizacao.trim() || null,
      ncm: ncm.trim() || null,
      cest: cest.trim() || null,
      ean: ean.trim() || null,
      fornecedor: fornecedor.trim() || null,
      codigo_fornecedor: codigoFornecedor.trim() || null,
      cor: cor.trim() || null,
      habilitar_nf: habilitarNf === "Sim",
      possui_composicao: possuiComposicao === "Sim",
    } as any;

    let error;
    if (isNew) {
      const result = await supabase.from("produtos_catalogo").insert(payload);
      error = result.error;
    } else {
      const result = await supabase.from("produtos_catalogo").update(payload).eq("id", id!);
      error = result.error;
    }

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      // Save composição items
      if (possuiComposicao === "Sim" && !isNew) {
        await supabase.from("produto_composicao" as any).delete().eq("produto_pai_id", id!);
        if (composicaoItens.length > 0) {
          await supabase.from("produto_composicao" as any).insert(
            composicaoItens.map(item => ({
              produto_pai_id: id,
              produto_item_id: item.produto_item_id,
              quantidade: item.quantidade,
              unidade: item.unidade,
              custo: item.custo,
            }))
          );
        }
      }
      toast.success(isNew ? "Produto criado com sucesso!" : "Produto atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      if (!isNew) queryClient.invalidateQueries({ queryKey: ["produto_edit", id] });
      navigate("/estoque");
    }
  };

  if (!isNew && isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando produto...</div>;
  }

  if (!isNew && !product) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Produto não encontrado</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/estoque")} className="gap-1.5 text-foreground border-border hover:bg-secondary/60">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{isNew ? "Novo Produto" : "Editar Produto"}</h1>
            {!isNew && <p className="text-xs text-muted-foreground font-mono">{codigoCpl}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/estoque")} className="gap-1.5 text-foreground border-border hover:bg-secondary/60">
            <X className="h-4 w-4" /> Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : isNew ? "Salvar" : "Atualizar"}
          </Button>
        </div>
      </div>

      {/* AI Search */}
      <Card className="glass-panel border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <Label className="text-xs text-muted-foreground shrink-0">Pesquisa IA</Label>
            <Input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder={nome || "Digite o nome do produto para pesquisar detalhes..."}
              className="bg-secondary/50 flex-1"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAiSearch())}
              disabled={aiSearching}
            />
            <Button
              variant="outline"
              onClick={handleAiSearch}
              disabled={aiSearching}
              className="gap-1.5 shrink-0 border-primary/30 hover:bg-primary/10"
            >
              {aiSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {aiSearching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 ml-6">
            Usa Gemini para buscar descrição, categoria, aplicações e mais detalhes do produto na internet.
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="w-full justify-start bg-secondary/40 border border-border rounded-lg h-10 p-1">
          <TabsTrigger value="dados" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Dados</TabsTrigger>
          <TabsTrigger value="detalhes" className="gap-1.5 text-xs"><Info className="h-3.5 w-3.5" /> Detalhes</TabsTrigger>
          <TabsTrigger value="valores" className="gap-1.5 text-xs"><DollarSign className="h-3.5 w-3.5" /> Valores</TabsTrigger>
          <TabsTrigger value="estoque" className="gap-1.5 text-xs"><Package className="h-3.5 w-3.5" /> Estoque</TabsTrigger>
          <TabsTrigger value="fotos" className="gap-1.5 text-xs"><Camera className="h-3.5 w-3.5" /> Fotos</TabsTrigger>
          <TabsTrigger value="fiscal" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Fiscal</TabsTrigger>
          <TabsTrigger value="fornecedores" className="gap-1.5 text-xs"><Truck className="h-3.5 w-3.5" /> Fornecedores</TabsTrigger>
          {possuiComposicao === "Sim" && (
            <TabsTrigger value="composicao" className="gap-1.5 text-xs"><Layers className="h-3.5 w-3.5" /> Composição</TabsTrigger>
          )}
        </TabsList>

        {/* DADOS */}
        <TabsContent value="dados">
          <Card className="glass-panel">
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Nome do Produto *</Label>
                  <Input 
                    value={nome} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setNome(val);
                      if (!skuEditadoManualmente) setCodigoCpl(gerarSkuAutomatico(val, codigoFornecedor, marca));
                      if (!aplicacaoEditadaManualmente) {
                        const aplicacaoSugerida = extrairAplicacao(val);
                        if (aplicacaoSugerida) {
                          setAplicacoes([aplicacaoSugerida]);
                        } else {
                          setAplicacoes([]);
                        }
                      }
                    }} 
                    className="bg-secondary/50" 
                    placeholder="Ex: ANEL ESCAPE POP BIZ 100..."
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs text-muted-foreground">SKU / Código (Auto)</Label>
                  <Input 
                    value={codigoCpl} 
                    onChange={(e) => {
                      setCodigoCpl(e.target.value);
                      setSkuEditadoManualmente(true);
                    }} 
                    className="bg-gray-50 border-gray-300 font-mono text-blue-600 font-bold dark:bg-black" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Cód. Fornecedor</Label>
                  <Input 
                    value={codigoFornecedor} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setCodigoFornecedor(val);
                      if (!skuEditadoManualmente) setCodigoCpl(gerarSkuAutomatico(nome, val, marca));
                    }} 
                    className="bg-secondary/50 font-mono" 
                    placeholder="Ex: SPT-123456" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Cód. Barras (EAN)</Label>
                  <Input value={ean} onChange={(e) => setEan(e.target.value)} className="bg-secondary/50 font-mono" placeholder="Ex: 7891234567890" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Marca</Label>
                  <Input 
                    value={marca} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setMarca(val);
                      if (!skuEditadoManualmente) setCodigoCpl(gerarSkuAutomatico(nome, codigoFornecedor, val));
                    }} 
                    className="bg-secondary/50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Categoria</Label>
                  <Popover open={categoriaOpen} onOpenChange={setCategoriaOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoriaOpen}
                        className="w-full justify-between bg-secondary/50 font-normal"
                      >
                        <span className={cn(!categoria && "text-muted-foreground")}>
                          {categoria || "Selecione ou digite para buscar..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 bg-popover border-border z-50" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
                      <Command shouldFilter>
                        <CommandInput
                          placeholder="Digite para buscar..."
                          value={categoriaSearch}
                          onValueChange={setCategoriaSearch}
                        />
                        <CommandList>
                          <CommandEmpty className="py-3 text-center text-xs text-muted-foreground">
                            Nenhuma categoria encontrada
                          </CommandEmpty>
                          <CommandGroup>
                            {categoriasList.map((c) => (
                              <CommandItem
                                key={c}
                                value={c}
                                onSelect={() => {
                                  setCategoria(c);
                                  setCategoriaOpen(false);
                                  setCategoriaSearch("");
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", categoria === c ? "opacity-100" : "opacity-0")} />
                                {c}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                        <button
                          type="button"
                          onClick={() => handleAddCategoria(categoriaSearch || undefined)}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          {categoriaSearch.trim() ? `Adicionar "${categoriaSearch.trim().toUpperCase()}"` : "Adicionar novo"}
                        </button>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Unidade</Label>
                  <Select value={unidade} onValueChange={setUnidade}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      <SelectItem value="UN">UN - Unidade</SelectItem>
                      <SelectItem value="PAR">PAR - Par</SelectItem>
                      <SelectItem value="CX">CX - Caixa</SelectItem>
                      <SelectItem value="KG">KG - Quilograma</SelectItem>
                      <SelectItem value="MT">MT - Metro</SelectItem>
                      <SelectItem value="PC">PC - Peça</SelectItem>
                      <SelectItem value="JG">JG - Jogo</SelectItem>
                      <SelectItem value="KIT">KIT - Kit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Peso (kg)</Label>
                  <Input value={peso} onChange={(e) => setPeso(e.target.value)} type="number" step="0.001" className="bg-secondary/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Cor</Label>
                  <Input value={cor} onChange={(e) => setCor(e.target.value)} placeholder="Ex: VERMELHA, PRETA..." className="bg-secondary/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">Habilitar nota fiscal? <Info className="h-3.5 w-3.5 text-muted-foreground/60" /></Label>
                  <Select value={habilitarNf} onValueChange={setHabilitarNf}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      <SelectItem value="Sim">Sim</SelectItem>
                      <SelectItem value="Não">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">Possui composição? <Info className="h-3.5 w-3.5 text-muted-foreground/60" /></Label>
                  <Select value={possuiComposicao} onValueChange={setPossuiComposicao}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      <SelectItem value="Sim">Sim</SelectItem>
                      <SelectItem value="Não">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Aplicações */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">🏍️ Aplicações</Label>
                <div className="flex gap-2">
                  <Input
                    value={novaAplicacao}
                    onChange={(e) => setNovaAplicacao(e.target.value)}
                    placeholder="Ex: CG 150 TITAN"
                    className="bg-secondary/50 flex-1"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAplicacao())}
                  />
                  <Button variant="outline" onClick={addAplicacao} className="gap-1"><Plus className="h-4 w-4" /> Adicionar</Button>
                </div>
                {aplicacoes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {aplicacoes.map((app, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 pr-1">
                        {app}
                        <button onClick={() => {
                          setAplicacoes(aplicacoes.filter((_, idx) => idx !== i));
                          setAplicacaoEditadaManualmente(true);
                        }} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DETALHES */}
        <TabsContent value="detalhes">
          <Card className="glass-panel">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Descrição Detalhada</Label>
                <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={5} className="bg-secondary/50" placeholder="Descrição completa do produto..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Observações Internas</Label>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} className="bg-secondary/50" placeholder="Notas internas sobre o produto..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VALORES */}
        <TabsContent value="valores">
          <div className="grid gap-4 md:grid-cols-[300px_1fr]">
            {/* Custo */}
            <Card className="glass-panel">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4" /> Valores de Custo</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Valor de custo * <Info className="h-3 w-3 inline" /></Label>
                    <BRLInput value={precoCusto} onChange={setPrecoCusto} className="bg-secondary/50 text-right" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Despesas acessórias <Info className="h-3 w-3 inline" /></Label>
                    <BRLInput value={despesasAcessorias} onChange={setDespesasAcessorias} className="bg-secondary/50 text-right" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Outras despesas <Info className="h-3 w-3 inline" /></Label>
                    <BRLInput value={outrasDespesas} onChange={setOutrasDespesas} className="bg-secondary/50 text-right" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground font-semibold">Custo final * <Info className="h-3 w-3 inline" /></Label>
                    <Input value={toBRL(custoFinal)} readOnly className="bg-muted/50 text-right font-bold" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Venda */}
            <Card className="glass-panel">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4" /> Valores de Venda</h3>
                <div className="rounded-lg border border-border/50 bg-accent/5 p-3 text-xs text-muted-foreground">
                  O valor de venda é a valorização monetária dos produtos comercializados pelo estabelecimento. Ele pode ser calculado ou indicado livremente.
                </div>
                <Button variant="default" size="sm" onClick={calcularPrecos} className="gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" /> Calcular valor de venda
                </Button>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/40 border-b border-border">
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Tipo</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Lucro sugerido (%)</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Lucro utilizado (%)</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Valor venda sugerido (R$)</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Valor venda utilizado (R$)</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Markup (%)</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Lucro (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {precosVenda.map((pv, i) => {
                        const cf = parseFloat(custoFinal) || 0;
                        const lucroValor = cf > 0 && pv.valor_venda_utilizado > 0
                          ? pv.valor_venda_utilizado - cf
                          : null;
                        const markup = lucroValor !== null && cf > 0
                          ? ((lucroValor / cf) * 100).toFixed(2)
                          : "—";
                        return (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-3 py-2">
                            <Input value={pv.tipo} onChange={(e) => updatePrecoVenda(i, "tipo", e.target.value as any)} className="bg-secondary/50 h-8 text-xs w-24" />
                          </td>
                          <td className="px-3 py-2 text-center text-xs text-muted-foreground">{toBRL(pv.lucro_sugerido)}%</td>
                          <td className="px-3 py-2">
                            <div className="relative">
                              <Input value={pv.lucro_utilizado} onChange={(e) => updatePrecoVenda(i, "lucro_utilizado", parseFloat(e.target.value) || 0)} type="number" step="0.01" className="bg-secondary/50 h-8 text-xs text-right pr-7" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-muted-foreground">{toBRL(pv.valor_venda_sugerido)}</td>
                          <td className="px-3 py-2">
                            <BRLInput
                              prefix="R$"
                              value={pv.valor_venda_utilizado}
                              onChange={(val) => updatePrecoVenda(i, "valor_venda_utilizado", parseFloat(val) || 0)}
                              className="bg-secondary/50 h-8 text-xs text-right"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-xs font-mono text-muted-foreground">{markup === "—" ? "—" : `${markup}%`}</td>
                          <td className={`px-3 py-2 text-right text-xs font-mono ${lucroValor !== null && lucroValor > 0 ? "text-green-500" : lucroValor !== null && lucroValor < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                            {lucroValor !== null ? `R$ ${toBRL(lucroValor)}` : "—"}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Button variant="outline" size="sm" onClick={addPrecoVenda} className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Cadastrar novo valor de venda
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ESTOQUE */}
        <TabsContent value="estoque">
          <Card className="glass-panel">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm"><Package className="h-4 w-4" /> Controle de Estoque</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Quantidade em Estoque</Label>
                  <Input value={estoqueQuantidade} onChange={(e) => setEstoqueQuantidade(e.target.value)} type="number" className="bg-secondary/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Estoque Mínimo</Label>
                  <Input value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} type="number" className="bg-secondary/50" />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Localização (Rua - Prateleira - Coluna - Caixa)</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground">R (Rua)</span>
                      <Input
                        value={localizacao.split("-")[0] || ""}
                        onChange={(e) => {
                          const pts = localizacao.split("-");
                          pts[0] = e.target.value.replace(/\D/g, "").slice(0, 3);
                          setLocalizacao(pts.join("-"));
                        }}
                        placeholder="05"
                        className="bg-secondary/50 font-mono text-center"
                        maxLength={3}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">P (Prateleira)</span>
                      <Input
                        value={localizacao.split("-")[1] || ""}
                        onChange={(e) => {
                          const pts = localizacao.split("-");
                          while (pts.length < 4) pts.push("");
                          pts[1] = e.target.value.replace(/\D/g, "").slice(0, 3);
                          setLocalizacao(pts.join("-"));
                        }}
                        placeholder="02"
                        className="bg-secondary/50 font-mono text-center"
                        maxLength={3}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">C (Coluna)</span>
                      <Input
                        value={localizacao.split("-")[2] || ""}
                        onChange={(e) => {
                          const pts = localizacao.split("-");
                          while (pts.length < 4) pts.push("");
                          pts[2] = e.target.value.replace(/\D/g, "").slice(0, 3);
                          setLocalizacao(pts.join("-"));
                        }}
                        placeholder="04"
                        className="bg-secondary/50 font-mono text-center"
                        maxLength={3}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">CX (Caixa)</span>
                      <Input
                        value={localizacao.split("-")[3] || ""}
                        onChange={(e) => {
                          const pts = localizacao.split("-");
                          while (pts.length < 4) pts.push("");
                          pts[3] = e.target.value.replace(/\D/g, "").slice(0, 3);
                          setLocalizacao(pts.join("-"));
                        }}
                        placeholder="12"
                        className="bg-secondary/50 font-mono text-center"
                        maxLength={3}
                      />
                    </div>
                  </div>
                  {localizacao && localizacao !== "---" && (
                    <p className="text-xs font-mono text-primary mt-1">
                      📍 {(() => { const pts = localizacao.split("-"); return `R${pts[0] || "00"} P${pts[1] || "00"} C${pts[2] || "00"} CX${pts[3] || "00"}`; })()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FOTOS */}
        <TabsContent value="fotos">
          <Card className="glass-panel">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm"><Camera className="h-4 w-4" /> Fotos do Produto</h3>
              <div className="flex gap-6 items-start">
                <div className="relative h-48 w-48 rounded-lg border border-border bg-secondary/20 overflow-hidden flex-shrink-0">
                  {imagemUrl ? (
                    <>
                      <img
                        src={imagemUrl}
                        alt={nome}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center -z-10">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">URL da Imagem Principal</Label>
                    <Input value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} placeholder="https://..." className="bg-secondary/50" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={handleUploadImagem}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImg}
                      className="gap-2"
                    >
                      {uploadingImg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploadingImg ? "Enviando..." : "Importar do PC (JPG/PNG)"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFetchPhoto}
                      disabled={fetchingPhoto || !nome.trim()}
                      className="gap-2 border-primary/30 hover:bg-primary/10"
                    >
                      {fetchingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                      {fetchingPhoto ? "Buscando..." : "Buscar foto (IA)"}
                    </Button>
                    {imagemUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setImagemUrl("")}
                        className="gap-1 text-muted-foreground"
                      >
                        <Trash2 className="h-4 w-4" /> Remover
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Cole uma URL, faça upload de uma imagem do seu PC (JPG/PNG/WebP, máx 5MB) ou use IA para buscar automaticamente.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FISCAL */}
        <TabsContent value="fiscal">
          <Card className="glass-panel">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm"><FileText className="h-4 w-4" /> Dados Fiscais</h3>
                <NcmCestSearch
                  onSelect={(rec) => {
                    setNcm(rec.ncm);
                    setCest(rec.cest);
                    toast.success(`NCM ${rec.ncm} e CEST ${rec.cest} preenchidos!`);
                  }}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">NCM</Label>
                  <Input value={ncm} onChange={(e) => setNcm(e.target.value)} placeholder="0000.00.00" className="bg-secondary/50 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">CEST</Label>
                  <Input value={cest} onChange={(e) => setCest(e.target.value)} placeholder="00.000.00" className="bg-secondary/50 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">EAN / Código de Barras</Label>
                  <Input value={ean} onChange={(e) => setEan(e.target.value)} placeholder="0000000000000" className="bg-secondary/50 font-mono" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                💡 Use <strong>"Buscar NCM/CEST"</strong> para consultar o catálogo oficial do RICMS BA 2026 (258 itens) por descrição, NCM ou código.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FORNECEDORES */}
        <TabsContent value="fornecedores">
          <Card className="glass-panel">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm"><Truck className="h-4 w-4" /> Fornecedor</h3>
              <div className="space-y-1.5 max-w-md">
                <Label className="text-xs text-muted-foreground">Nome do Fornecedor</Label>
                <Input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="Ex: CPL Motoparts" className="bg-secondary/50" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPOSIÇÃO */}
        {possuiComposicao === "Sim" && (
          <TabsContent value="composicao">
            <Card className="glass-panel">
              <CardContent className="p-6 space-y-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground space-y-1">
                  <p><strong className="text-foreground">Para que é usada:</strong> A composição é utilizada por empresas que fabricam ou produzem seus próprios produtos. Ex: Sanduíches, Bicicletas, Kits.</p>
                  <p><strong className="text-foreground">Como funciona:</strong> Indique os produtos usados para "produção" deste produto e suas quantidades. Depois, pode-se criar ou desfazer composições, realizando o acréscimo ou decréscimo do estoque.</p>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/40 border-b border-border">
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Produto</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-28">Quantidade</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-28">Unidade</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-28">Custo</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-28">Total</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-16">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {composicaoItens.map((item, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-3 py-2 text-foreground text-xs">{item.produto_nome}</td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={item.quantidade}
                              onChange={(e) => {
                                const updated = [...composicaoItens];
                                updated[i] = { ...updated[i], quantidade: parseFloat(e.target.value) || 0 };
                                setComposicaoItens(updated);
                              }}
                              className="bg-secondary/50 h-8 text-xs text-center w-full"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Select value={item.unidade} onValueChange={(v) => {
                              const updated = [...composicaoItens];
                              updated[i] = { ...updated[i], unidade: v };
                              setComposicaoItens(updated);
                            }}>
                              <SelectTrigger className="bg-secondary/50 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-popover border-border z-50">
                                <SelectItem value="UN">UN</SelectItem>
                                <SelectItem value="PAR">PAR</SelectItem>
                                <SelectItem value="CX">CX</SelectItem>
                                <SelectItem value="KG">KG</SelectItem>
                                <SelectItem value="MT">MT</SelectItem>
                                <SelectItem value="PC">PC</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2">
                            <BRLInput
                              value={item.custo}
                              onChange={(v) => {
                                const updated = [...composicaoItens];
                                updated[i] = { ...updated[i], custo: parseFloat(v) || 0 };
                                setComposicaoItens(updated);
                              }}
                              className="bg-secondary/50 h-8 text-xs text-right w-full"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-xs font-mono text-foreground">
                            R$ {(item.quantidade * item.custo).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => setComposicaoItens(composicaoItens.filter((_, idx) => idx !== i))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {/* Add row */}
                      <tr>
                        <td className="px-3 py-2" colSpan={6}>
                          <ProductCombobox
                            value=""
                            onChange={(_val, prod) => {
                              if (prod) {
                                setComposicaoItens([...composicaoItens, {
                                  produto_item_id: prod.id,
                                  produto_nome: prod.nome,
                                  quantidade: 1,
                                  unidade: "UN",
                                  custo: prod.preco_custo || 0,
                                }]);
                              }
                            }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      const total = composicaoItens.reduce((s, item) => s + (item.quantidade * item.custo), 0);
                      setPrecoCusto(total.toFixed(2));
                      toast.success(`Custo do produto atualizado para R$ ${total.toFixed(2)}`);
                    }}
                  >
                    <DollarSign className="h-3.5 w-3.5" /> Atualizar custo do produto
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Total composição: <strong className="text-foreground">R$ {composicaoItens.reduce((s, item) => s + (item.quantidade * item.custo), 0).toFixed(2)}</strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Bottom actions */}
      <div className="flex gap-2 pb-6">
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Atualizar"}
        </Button>
        <Button variant="outline" onClick={() => navigate("/estoque")} className="gap-1.5 text-foreground border-border hover:bg-secondary/60">
          <X className="h-4 w-4" /> Cancelar
        </Button>
      </div>
    </div>
  );
}
