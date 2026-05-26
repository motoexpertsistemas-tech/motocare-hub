import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, Package, ChevronLeft, ChevronRight, ShoppingCart, Phone, MessageCircle, Camera, Mic, Loader2, X, Plus, Minus, Trash2, Settings, Instagram, Facebook, Youtube, Globe, SlidersHorizontal, ChevronDown, User, LogIn, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CheckoutDialog from "@/components/CheckoutDialog";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link, useNavigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { usePlano } from "@/contexts/PlanoContext";
import { Navigate } from "react-router-dom";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { HighlightCarousel } from "@/components/HighlightCarousel";
import { useEcommerceAuth } from "@/contexts/EcommerceAuthContext";
import { SpinWheelPopup } from "@/components/SpinWheelPopup";
import { useEmpresa } from "@/contexts/EmpresaContext";

const PAGE_SIZE = 20;
const DEFAULT_PIX_DISCOUNT = 0.03;
const DEFAULT_MAX_PARCELAS = 10;

interface CartItem {
  id: string;
  nome: string;
  preco: number;
  imagem_url?: string | null;
  quantidade: number;
}

function BrandsCarousel({ fornecedores, fornecedor, onSelect }: { fornecedores: string[]; fornecedor: string; onSelect: (f: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || fornecedores.length === 0) return;

    let animId: number;
    let scrollPos = 0;
    const speed = 0.5;
    let paused = false;

    const animate = () => {
      if (!paused && el) {
        scrollPos += speed;
        if (scrollPos >= el.scrollWidth - el.clientWidth) {
          scrollPos = 0;
        }
        el.scrollLeft = scrollPos;
      }
      animId = requestAnimationFrame(animate);
    };

    const pause = () => { paused = true; };
    const resume = () => { paused = false; scrollPos = el.scrollLeft; };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause);
    el.addEventListener("touchend", resume);

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, [fornecedores]);

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div ref={scrollRef} className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => onSelect("todos")}
            className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-all duration-200 ${
              fornecedor === "todos"
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            Todas as Marcas
          </button>
          {fornecedores.map((f) => (
            <button
              key={f}
              onClick={() => onSelect(f)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-all duration-200 ${
                fornecedor === f
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroBannerCarousel({ banners }: { banners: { url: string; link?: string; titulo?: string }[] }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const b = banners[current];
  if (!b) return null;

  const inner = (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "1306/400" }}>
      <img src={b.url} alt={b.titulo || "Banner"} className="w-full h-full object-cover" />
      {banners.length > 1 && (
        <>
          <button onClick={(e) => { e.preventDefault(); setCurrent((c) => (c - 1 + banners.length) % banners.length); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={(e) => { e.preventDefault(); setCurrent((c) => (c + 1) % banners.length); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button key={i} onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );

  return b.link ? <a href={b.link} target="_blank" rel="noopener noreferrer">{inner}</a> : inner;
}

function CategoriesCarousel({ categorias, categoria, onSelect }: { categorias: string[]; categoria: string; onSelect: (c: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || categorias.length === 0) return;

    let animId: number;
    let scrollPos = 0;
    const speed = 0.4;
    let paused = false;

    const animate = () => {
      if (!paused && el) {
        scrollPos += speed;
        if (scrollPos >= el.scrollWidth - el.clientWidth) {
          scrollPos = 0;
        }
        el.scrollLeft = scrollPos;
      }
      animId = requestAnimationFrame(animate);
    };

    const pause = () => { paused = true; };
    const resume = () => { paused = false; scrollPos = el.scrollLeft; };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause);
    el.addEventListener("touchend", resume);

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, [categorias]);

  return (
    <div className="bg-foreground border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div ref={scrollRef} className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => onSelect("todas")}
            className={`shrink-0 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-base font-bold uppercase whitespace-nowrap transition-colors ${
              categoria === "todas" ? "text-primary border-b-2 border-primary" : "text-white/80 hover:text-primary"
            }`}
          >
            TODOS
          </button>
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => onSelect(c)}
              className={`shrink-0 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-base font-bold uppercase whitespace-nowrap transition-colors ${
                categoria === c ? "text-primary border-b-2 border-primary" : "text-white/80 hover:text-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function useEcommerceConfig(empresaId: string | null) {
  const [cfg, setCfg] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const loadFromDb = async () => {
      if (!empresaId) return;
      const { data } = await supabase.rpc("get_ecommerce_config" as any, { p_empresa_id: empresaId });
      if (!cancelled && data) {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        setCfg(parsed);
        return;
      }
      // Fallback to localStorage
      if (!cancelled) {
        try {
          const saved = localStorage.getItem("ecommerce_config");
          if (saved) setCfg(JSON.parse(saved));
        } catch { /* ignore */ }
      }
    };
    loadFromDb();
    return () => { cancelled = true; };
  }, [empresaId]);

  return cfg;
}

interface EcommerceProps {
  slugOverride?: string;
}

export default function Ecommerce({ slugOverride }: EcommerceProps) {
  const role = useRole();
  const plano = usePlano();
  const navigate = useNavigate();
  const { empresaId: contextEmpresaId } = useEmpresa();

  // When slugOverride is provided, fetch empresa_id by slug
  const { data: slugEmpresaId, isLoading: slugLoading, isError: slugError } = useQuery({
    queryKey: ["empresa-by-slug", slugOverride],
    queryFn: async () => {
      if (!slugOverride) return null;
      const { data, error } = await supabase
        .rpc("get_empresa_by_slug", { p_slug: slugOverride });
      if (error) throw error;
      return data as string | null;
    },
    enabled: !!slugOverride,
    staleTime: 300000,
  });

  const empresaId = slugOverride ? (slugEmpresaId ?? null) : contextEmpresaId;
  const ecomConfig = useEcommerceConfig(empresaId);
  const { isLoggedIn, cliente, logout } = useEcommerceAuth();

  const STORE = useMemo(() => ({
    nome: ecomConfig?.nome_loja || "Minha Loja",
    telefone: ecomConfig?.telefone || "",
    telefone_secundario: ecomConfig?.telefone_secundario || "",
    whatsapp: ecomConfig?.whatsapp || "",
    email: ecomConfig?.email || "",
    endereco: ecomConfig?.endereco || "",
    horario: ecomConfig?.horario || "",
    logo_url: ecomConfig?.logo_url || "",
    instagram: ecomConfig?.instagram || "",
    facebook: ecomConfig?.facebook || "",
    youtube: ecomConfig?.youtube || "",
    tiktok: ecomConfig?.tiktok || "",
    institucional: ecomConfig?.institucional || [
      { titulo: "Política de Troca e Devolução", visivel: true },
      { titulo: "Política de Privacidade", visivel: true },
      { titulo: "Pagamento e Envio", visivel: true },
      { titulo: "Como Comprar", visivel: true },
    ],
  }), [ecomConfig]);
  const PIX_DISCOUNT = (ecomConfig?.pix_desconto ?? 3) / 100;
  const MAX_PARCELAS = ecomConfig?.max_parcelas ?? DEFAULT_MAX_PARCELAS;
  const banners = ecomConfig?.banners || [];
  const bannersCentrais = ecomConfig?.banners_centrais || [];

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [categoria, setCategoria] = useState<string>("todas");
  const [fornecedor, setFornecedor] = useState<string>("todos");
  const [soComEstoque, setSoComEstoque] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResult, setAiResult] = useState<{ mensagem: string; produtos: any[] } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [ordenacao, setOrdenacao] = useState<string>("relevantes");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roletaOpen, setRoletaOpen] = useState(false);

  // Show wheel popup for new visitors (locks for 24h after spinning)
  const [roletaLockedUntil, setRoletaLockedUntil] = useState<number | null>(null);
  const [roletaCupom, setRoletaCupom] = useState<{ code: string; label: string; valor: number; tipo: "desconto" | "produto"; expiresAt: number } | null>(null);
  const [roletaNow, setRoletaNow] = useState(Date.now());
  const [roletaBarHidden, setRoletaBarHidden] = useState(false);

  useEffect(() => {
    if (ecomConfig?.roleta_ativa && ecomConfig.roleta_opcoes?.length > 0) {
      const lastSpun = localStorage.getItem("roleta_girada_ts");
      const oneDayMs = 24 * 60 * 60 * 1000;
      const until = lastSpun ? Number(lastSpun) + oneDayMs : 0;
      setRoletaLockedUntil(until > Date.now() ? until : null);
      try {
        const raw = localStorage.getItem("roleta_cupom");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.expiresAt > Date.now()) setRoletaCupom(parsed);
          else localStorage.removeItem("roleta_cupom");
        }
      } catch {}
      const timer = setTimeout(() => setRoletaOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [ecomConfig?.roleta_ativa, ecomConfig?.roleta_opcoes]);

  // Tick for the floating bar
  useEffect(() => {
    if (!roletaCupom || roletaCupom.expiresAt <= Date.now()) return;
    const id = setInterval(() => {
      const t = Date.now();
      setRoletaNow(t);
      if (roletaCupom.expiresAt <= t) {
        setRoletaCupom(null);
        localStorage.removeItem("roleta_cupom");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [roletaCupom]);

  const removerCupom = () => {
    setRoletaCupom(null);
    setRoletaBarHidden(false);
    localStorage.removeItem("roleta_cupom");
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cart functions
  const addToCart = useCallback((item: { id: string; nome: string; preco: number; imagem_url?: string | null }) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantidade: c.quantidade + 1 } : c);
      }
      return [...prev, { ...item, quantidade: 1 }];
    });
    toast.success("Adicionado ao carrinho!", { duration: 1500 });
  }, []);

  const updateCartQty = useCallback((id: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.id !== id) return c;
        const newQty = c.quantidade + delta;
        if (newQty <= 0) return null as any;
        return { ...c, quantidade: newQty };
      }).filter(Boolean);
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(c => c.id !== id));
  }, []);

  const cartSubtotal = cart.reduce((sum, c) => sum + c.preco * c.quantidade, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantidade, 0);
  const cupomAtivo = !!(roletaCupom && roletaCupom.expiresAt > roletaNow);
  const cupomDescontoPct = cupomAtivo && roletaCupom?.tipo === "desconto" ? Number(roletaCupom.valor) || 0 : 0;
  const cupomDescontoValor = cartSubtotal * (cupomDescontoPct / 100);
  const cartTotal = Math.max(0, cartSubtotal - cupomDescontoValor);

  const markImageAsBroken = useCallback((productId: string) => {
    setBrokenImageIds((prev) => {
      if (prev.has(productId)) return prev;
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
  }, []);

  const handleAiPhotoSearch = useCallback(async (file: File) => {
    setAiSearching(true);
    setAiResult(null);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("ai-search-product", {
        body: { image_base64: base64 },
      });

      if (error) throw error;
      setAiResult(data);
      toast.success(data.mensagem);

      if (data.identificacao?.nome_peca && data.identificacao.nome_peca !== "não identificada") {
        setSearch(data.identificacao.nome_peca);
        setPage(0);
      }
    } catch (err: any) {
      console.error("AI search error:", err);
      toast.error("Erro na busca por IA. Tente novamente.");
    } finally {
      setAiSearching(false);
    }
  }, []);

  const handleAiAudioSearch = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        toast.info("Processando áudio...");
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        } else {
          toast.error("Seu navegador não suporta reconhecimento de voz. Tente digitar.");
        }
      };

      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "pt-BR";
        recognition.interimResults = false;

        recognition.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          toast.info(`Você disse: "${transcript}"`);

          setAiSearching(true);
          setAiResult(null);
          try {
            const { data, error } = await supabase.functions.invoke("ai-search-product", {
              body: { audio_text: transcript },
            });
            if (error) throw error;
            setAiResult(data);
            toast.success(data.mensagem);
            if (data.identificacao?.nome_peca && data.identificacao.nome_peca !== "não identificada") {
              setSearch(data.identificacao.nome_peca);
              setPage(0);
            }
          } catch (err) {
            toast.error("Erro na busca por IA.");
          } finally {
            setAiSearching(false);
          }
        };

        recognition.onerror = () => {
          toast.error("Erro no reconhecimento de voz. Tente novamente.");
          setIsRecording(false);
        };

        recognition.onend = () => setIsRecording(false);

        recognition.start();
        setIsRecording(true);
        toast.info("🎤 Fale o nome da peça...", { duration: 3000 });

        setTimeout(() => {
          if (mediaRecorderRef.current?.state === "recording") {
            recognition.stop();
          }
        }, 8000);
      } else {
        toast.error("Reconhecimento de voz não disponível neste navegador.");
      }

      mediaRecorder.start();
    } catch (err) {
      toast.error("Permita o acesso ao microfone para usar esta função.");
      setIsRecording(false);
    }
  }, [isRecording]);

  const CATEGORIAS_OFICIAIS = [
    "ACESSÓRIOS", "CABOS", "CARB-INJEÇÃO", "CAREN-PLÁSTICO", "CHASSI",
    "ELÉTRICA", "FERRA - EQUIP", "FIXAÇÃO", "MOTOR", "PNEU", "RODA",
    "SUSPENSÃO", "TRANSMISSÃO"
  ];

  const { data: categoriasRaw } = useQuery({
    queryKey: ["ecommerce-categorias", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ecommerce_categorias", { p_empresa_id: empresaId });
      if (error) throw error;
      const dbCats = (data || []).map((d: any) => d.categoria).filter(Boolean) as string[];
      const oficiais = CATEGORIAS_OFICIAIS.filter(c => dbCats.includes(c));
      const extras = dbCats.filter(c => !CATEGORIAS_OFICIAIS.includes(c) && c !== "SEM CATEGORIA");
      return [...oficiais, ...extras];
    },
    staleTime: 60000,
  });

  // Apply user-defined customizations from ecommerce_config:
  // - categorias_extras: manually added categories (appear even without products)
  // - categorias_ocultas: deactivated categories (hidden from menu)
  // - categorias_ordem: custom ordering
  const categorias = useMemo(() => {
    const base = categoriasRaw || [];
    const extras: string[] = Array.isArray(ecomConfig?.categorias_extras) ? ecomConfig.categorias_extras : [];
    const ocultas: string[] = Array.isArray(ecomConfig?.categorias_ocultas) ? ecomConfig.categorias_ocultas : [];
    const ordem: string[] = Array.isArray(ecomConfig?.categorias_ordem) ? ecomConfig.categorias_ordem : [];
    const merged = Array.from(new Set([...base, ...extras])).filter(c => !ocultas.includes(c));
    if (ordem.length === 0) return merged;
    const ordered = ordem.filter(c => merged.includes(c));
    const rest = merged.filter(c => !ordered.includes(c));
    return [...ordered, ...rest];
  }, [categoriasRaw, ecomConfig]);

  const { data: fornecedores } = useQuery({
    queryKey: ["ecommerce-fornecedores", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ecommerce_fornecedores", { p_empresa_id: empresaId });
      if (error) throw error;
      return (data || []).map((d: any) => d.fornecedor).filter(Boolean) as string[];
    },
    staleTime: 60000,
  });

  // Highlighted products queries
  const { data: ofertasDoDia } = useQuery({
    queryKey: ["ecommerce-ofertas-dia"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos_catalogo")
        .select("id, nome, imagem_url, precos_venda, fornecedor, estoque_quantidade, codigo_fornecedor, aplicacoes, categoria")
        .contains("destaques" as any, ["oferta_dia"])
        .not("imagem_url", "is", null)
        .neq("imagem_url", "")
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchInterval: 30000,
  });

  const { data: promoRelampago } = useQuery({
    queryKey: ["ecommerce-promo-relampago"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos_catalogo")
        .select("id, nome, imagem_url, precos_venda, fornecedor, estoque_quantidade, codigo_fornecedor, aplicacoes, categoria")
        .contains("destaques" as any, ["promo_relampago"])
        .not("imagem_url", "is", null)
        .neq("imagem_url", "")
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchInterval: 30000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["ecommerce-products", search, page, categoria, fornecedor, soComEstoque, ordenacao],
    staleTime: 5000,
    refetchInterval: 30000,
    queryFn: async () => {
      const searchTrimmed = search.trim();

      // For multi-term search, still use RPC buscar_produtos_catalogo
      if (searchTrimmed) {
        const termos = searchTrimmed.split(/\s+/).filter(t => t.length >= 2);
        if (termos.length > 0) {
          const { data: rpcProducts, error: rpcError } = await supabase
            .rpc("buscar_produtos_catalogo", { termos, p_empresa_id: empresaId })
            .select("id, nome, codigo_fornecedor, imagem_url, aplicacoes, estoque_quantidade, precos_venda, fornecedor, categoria");
          if (rpcError) throw rpcError;
          let filtered = rpcProducts || [];
          if (categoria && categoria !== "todas") filtered = filtered.filter((p: any) => p.categoria === categoria);
          if (fornecedor && fornecedor !== "todos") filtered = filtered.filter((p: any) => p.fornecedor === fornecedor);
          if (soComEstoque) filtered = filtered.filter((p: any) => (p.estoque_quantidade || 0) > 0);
          return { products: filtered, count: filtered.length };
        }
      }

      // Use server-side paginated + ranked RPC
      const ordMap: Record<string, string> = {
        "relevantes": "relevantes",
        "nome_az": "nome_az",
        "nome_za": "nome_za",
      };

      const { data: rows, error } = await supabase.rpc("ecommerce_produtos_paginados", {
        p_empresa_id: empresaId,
        p_busca: searchTrimmed,
        p_categoria: categoria || "",
        p_fornecedor: fornecedor || "",
        p_com_estoque: soComEstoque,
        p_pagina: page,
        p_por_pagina: PAGE_SIZE,
        p_ordenacao: ordMap[ordenacao] || "relevantes",
      });
      if (error) throw error;

      const totalCount = rows && rows.length > 0 ? Number(rows[0].total_count) : 0;
      return { products: rows || [], count: totalCount };
    },
  });

  const products = data?.products || [];
  const visibleProductsRaw = products.filter((p: any) => !(p.imagem_url && brokenImageIds.has(p.id)));
  
  const visibleProducts = useMemo(() => {
    const sorted = [...visibleProductsRaw];
    switch (ordenacao) {
      case "menor_preco":
        return sorted.sort((a, b) => (getPrecoVenda(a.precos_venda) || 99999) - (getPrecoVenda(b.precos_venda) || 99999));
      case "maior_preco":
        return sorted.sort((a, b) => (getPrecoVenda(b.precos_venda) || 0) - (getPrecoVenda(a.precos_venda) || 0));
      case "maior_desconto":
        return sorted.sort((a, b) => {
          const pa = getPrecoVenda(a.precos_venda);
          const pb = getPrecoVenda(b.precos_venda);
          return (pb || 0) - (pa || 0); // approximate
        });
      case "nome_az":
        return sorted.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
      default:
        return sorted;
    }
  }, [visibleProductsRaw, ordenacao]);
  
  const totalPages = Math.ceil((data?.count || 0) / PAGE_SIZE);

  function getPrecoVenda(precos: any, precoCusto?: number | null): number | null {
    if (precos) {
      if (Array.isArray(precos) && precos.length > 0) {
        // Prioridade 1: Tabela E-commerce (suporta nome/tipo, case-insensitive)
        const ecommerce = precos.find((p: any) => {
          const label = (p.nome || p.tipo || "").toString().toUpperCase();
          return label === "E-COMMERCE";
        });
        if (ecommerce) {
          const val = Number(ecommerce.valor || ecommerce.valor_venda_utilizado || 0);
          if (val > 0) return val;
        }
        // Prioridade 2: Tabela Varejo
        const varejo = precos.find((p: any) => {
          const label = (p.nome || p.tipo || "").toString().toUpperCase();
          return label === "VAREJO";
        });
        if (varejo) {
          const val = Number(varejo.valor || varejo.valor_venda_utilizado || 0);
          if (val > 0) return val;
        }
        // Prioridade 3: Qualquer tabela com valor
        const first = precos.find((p: any) => 
          (Number(p.valor) > 0) || (Number(p.valor_venda_utilizado) > 0)
        );
        if (first) return Number(first.valor || first.valor_venda_utilizado);
      }
      if (typeof precos === "object" && !Array.isArray(precos)) {
        if (precos.preco_1) return Number(precos.preco_1);
        if (precos.varejo) return Number(precos.varejo);
        const first = Object.values(precos).find((v) => typeof v === "number" && v > 0);
        if (first) return Number(first);
      }
    }
    if (precoCusto && precoCusto > 0) {
      return Math.round(precoCusto * 1.8 * 100) / 100;
    }
    return null;
  }

  function calcParcelas(preco: number) {
    const parcela = preco / MAX_PARCELAS;
    return parcela >= 1 ? { n: MAX_PARCELAS, valor: parcela } : { n: 1, valor: preco };
  }

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const isPublicStorefront = !!slugOverride;

  // Public storefront: show loading or not-found states
  if (isPublicStorefront && slugLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando loja...</p>
        </div>
      </div>
    );
  }

  if (isPublicStorefront && (slugError || !slugEmpresaId)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <Package className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Loja não encontrada</h1>
          <p className="text-muted-foreground">O endereço <strong>{slugOverride}.ottotechsistemas.com.br</strong> não corresponde a nenhuma loja cadastrada.</p>
        </div>
      </div>
    );
  }

  if (!isPublicStorefront && plano !== "platina") {
    return <Navigate to="/" replace />;
  }

  const whatsappClean = STORE.whatsapp?.replace(/\D/g, "") || "";

  return (
    <div className="min-h-screen bg-background -m-6 -mt-4">
      {/* ===== TOP BAR ===== */}
      <div className="bg-foreground text-background">
        {/* Contact strip */}
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              {STORE.telefone && (
                <a href={`tel:${STORE.telefone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Phone className="h-3 w-3" /> {STORE.telefone}
                </a>
              )}
              {STORE.whatsapp && (
                <a
                  href={`https://wa.me/${whatsappClean}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <MessageCircle className="h-3 w-3" /> {STORE.whatsapp}
                </a>
              )}
            </div>
            <div className="flex items-center gap-3">
              {STORE.email && <span className="hidden md:block text-white/60">{STORE.email}</span>}
              {STORE.horario && <span className="hidden lg:block text-white/50">🕐 {STORE.horario}</span>}
              {!isPublicStorefront && role !== "CLIENTE" && (
                <Link to="/ecommerce/config" className="text-white/40 hover:text-primary transition-colors" title="Configurar loja">
                  <Settings className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Logo + Search + Cart */}
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center gap-3 md:gap-6">
          <Link to="/ecommerce" className="shrink-0 flex items-center gap-2 md:gap-3">
            {STORE.logo_url && (
              <img src={STORE.logo_url} alt={STORE.nome} className="h-8 md:h-14 max-w-[140px] md:max-w-[200px] object-contain" />
            )}
            <h1 className="text-lg md:text-3xl font-black tracking-tight whitespace-nowrap hidden sm:block">
              {!STORE.logo_url && "🏍️ "}<span className="text-primary">{STORE.nome}</span>
            </h1>
          </Link>

          <div className="flex-1 max-w-xl mx-auto relative flex items-center gap-1.5 md:gap-2">
            <div className="relative flex-1">
              {aiSearching ? (
                <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              )}
              <Input
                placeholder="O que você procura?"
                className="pl-9 pr-3 bg-white text-foreground border-0 h-10 rounded-lg text-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); setAiResult(null); }}
              />
            </div>

            {/* Camera button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAiPhotoSearch(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={aiSearching}
              className="h-10 w-10 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center text-primary transition-colors disabled:opacity-50 hidden sm:flex"
              title="Escanear peça com foto"
            >
              <Camera className="h-5 w-5" />
            </button>

            {/* Mic button */}
            <button
              onClick={handleAiAudioSearch}
              disabled={aiSearching}
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 hidden sm:flex ${
                isRecording
                  ? "bg-destructive/80 text-white animate-pulse"
                  : "bg-primary/20 hover:bg-primary/30 text-primary"
              }`}
              title={isRecording ? "Parar gravação" : "Buscar por voz"}
            >
              {isRecording ? <X className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          </div>

          {/* Account button */}
          {isLoggedIn ? (
            <Link to="/ecommerce/minha-conta" className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors shrink-0">
              <User className="h-5 w-5" />
              <span className="hidden md:block text-white/70 text-xs max-w-[80px] truncate">{cliente?.nome?.split(" ")[0]}</span>
            </Link>
          ) : (
            <Link to="/ecommerce/login" className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors shrink-0">
              <LogIn className="h-5 w-5" />
              <span className="hidden md:block text-white/70 text-xs">Entrar</span>
            </Link>
          )}

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 text-sm hover:text-primary transition-colors cursor-pointer shrink-0"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
            <span className="hidden md:block text-white/70">
              R$ {fmt(cartTotal)}
            </span>
          </button>
        </div>

        {/* Categories nav */}
        <CategoriesCarousel categorias={categorias || []} categoria={categoria} onSelect={(c) => { setCategoria(c); setPage(0); }} />
      </div>

      {/* ===== HERO BANNER ===== */}
      {banners.length > 0 ? (
        <HeroBannerCarousel banners={banners} />
      ) : (
        <div className="relative bg-gradient-to-r from-foreground via-foreground/95 to-foreground/80 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 py-10 md:py-16 relative z-10">
            <p className="text-primary font-bold text-sm uppercase tracking-widest">{STORE.nome}</p>
            <h2 className="text-3xl md:text-5xl font-black text-white mt-2 leading-tight">
              ENCONTRE AQUI<br />
              <span className="text-primary">PEÇAS & ACESSÓRIOS</span><br />
              PARA SUA MOTO
            </h2>
            <p className="text-white/60 mt-3 text-sm max-w-md">
              Qualidade, preço justo e entrega para todo o Brasil. Pague com Pix, Boleto ou Cartão em até {MAX_PARCELAS}x sem juros.
            </p>
            <div className="flex items-center gap-2 sm:gap-3 mt-5 flex-wrap">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] sm:text-xs font-bold">
                {Math.round(PIX_DISCOUNT * 100)}% OFF NO PIX
              </Badge>
              <Badge className="bg-white/10 text-white border-white/20 text-[10px] sm:text-xs">
                ATÉ {MAX_PARCELAS}X SEM JUROS
              </Badge>
            </div>
          </div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDQpIi8+PC9zdmc+')] opacity-60" />
        </div>
      )}

      {/* ===== OFERTAS DO DIA ===== */}
      {(ofertasDoDia || []).length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <HighlightCarousel
            title="Ofertas do Dia"
            emoji="🔥"
            products={(ofertasDoDia || []).map((p: any) => {
              const preco = getPrecoVenda(p.precos_venda);
              return {
                ...p,
                preco,
                precoPix: preco ? preco * (1 - PIX_DISCOUNT) : null,
                parcelas: preco ? calcParcelas(preco) : null,
              };
            })}
            onProductClick={setSelectedProduct}
            onAddToCart={(p: any) => {
              const preco = getPrecoVenda(p.precos_venda);
              if (preco) addToCart({ id: p.id, nome: p.nome, preco, imagem_url: p.imagem_url });
            }}
            onBuy={(p: any) => {
              const preco = getPrecoVenda(p.precos_venda);
              if (preco) { addToCart({ id: p.id, nome: p.nome, preco, imagem_url: p.imagem_url }); setCartOpen(true); }
            }}
            fmt={fmt}
            isLoggedIn={isLoggedIn}
            onRequireLogin={() => { window.location.href = "/ecommerce/login"; }}
          />
        </div>
      )}

      {/* ===== PROMOÇÃO RELÂMPAGO ===== */}
      {(promoRelampago || []).length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <HighlightCarousel
            title="Promoção Relâmpago"
            emoji="⚡"
            products={(promoRelampago || []).map((p: any) => {
              const preco = getPrecoVenda(p.precos_venda);
              return {
                ...p,
                preco,
                precoPix: preco ? preco * (1 - PIX_DISCOUNT) : null,
                parcelas: preco ? calcParcelas(preco) : null,
              };
            })}
            onProductClick={setSelectedProduct}
            onAddToCart={(p: any) => {
              const preco = getPrecoVenda(p.precos_venda);
              if (preco) addToCart({ id: p.id, nome: p.nome, preco, imagem_url: p.imagem_url });
            }}
            onBuy={(p: any) => {
              const preco = getPrecoVenda(p.precos_venda);
              if (preco) { addToCart({ id: p.id, nome: p.nome, preco, imagem_url: p.imagem_url }); setCartOpen(true); }
            }}
            fmt={fmt}
            isLoggedIn={isLoggedIn}
            onRequireLogin={() => { window.location.href = "/ecommerce/login"; }}
          />
        </div>
      )}

      {/* ===== BRANDS CAROUSEL ===== */}
      <BrandsCarousel
        fornecedores={fornecedores || []}
        fornecedor={fornecedor}
        onSelect={(f) => { setFornecedor(f); setPage(0); }}
      />

      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 border-b border-border">
        <Button
          variant={soComEstoque ? "default" : "outline"}
          size="sm"
          className={`text-xs h-9 ${soComEstoque ? "gradient-primary text-white" : ""}`}
          onClick={() => { setSoComEstoque(!soComEstoque); setPage(0); }}
        >
          📦 Pronta Entrega
        </Button>

        <span className="text-xs text-muted-foreground ml-auto">
          {data?.count ?? 0} produtos encontrados
        </span>
      </div>

      {/* ===== PRODUCT AREA WITH SIDEBAR ===== */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* ===== SIDEBAR FILTERS (desktop) ===== */}
          <aside className="hidden lg:block w-56 shrink-0 space-y-6">
            {/* Ordenação */}
            <div>
              <h3 className="font-bold text-sm text-foreground mb-2">Ordenação</h3>
              <div className="space-y-1">
                {[
                  { key: "relevantes", label: "Mais Relevantes" },
                  { key: "menor_preco", label: "Menor Preço" },
                  { key: "maior_preco", label: "Maior Preço" },
                  { key: "maior_desconto", label: "Maior Desconto" },
                  { key: "nome_az", label: "Nome (A-Z)" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setOrdenacao(opt.key)}
                    className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                      ordenacao === opt.key
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Marcas */}
            {(fornecedores || []).length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-foreground mb-2">Marcas</h3>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  <button
                    onClick={() => { setFornecedor("todos"); setPage(0); }}
                    className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                      fornecedor === "todos" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    Todas as Marcas
                  </button>
                  {(fornecedores || []).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setFornecedor(f); setPage(0); }}
                      className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                        fornecedor === f ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categorias */}
            {(categorias || []).length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-foreground mb-2">Categorias</h3>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  <button
                    onClick={() => { setCategoria("todas"); setPage(0); }}
                    className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                      categoria === "todas" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    Todas
                  </button>
                  {(categorias || []).map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCategoria(c); setPage(0); }}
                      className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                        categoria === c ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ===== MOBILE FILTER BUTTON ===== */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-72 p-4 space-y-6 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Filtros
                </SheetTitle>
              </SheetHeader>
              {/* Ordenação */}
              <div>
                <h3 className="font-bold text-sm text-foreground mb-2">Ordenação</h3>
                <div className="space-y-1">
                  {[
                    { key: "relevantes", label: "Mais Relevantes" },
                    { key: "menor_preco", label: "Menor Preço" },
                    { key: "maior_preco", label: "Maior Preço" },
                    { key: "maior_desconto", label: "Maior Desconto" },
                    { key: "nome_az", label: "Nome (A-Z)" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setOrdenacao(opt.key); }}
                      className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                        ordenacao === opt.key ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Marcas */}
              {(fornecedores || []).length > 0 && (
                <div>
                  <h3 className="font-bold text-sm text-foreground mb-2">Marcas</h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    <button onClick={() => { setFornecedor("todos"); setPage(0); }} className={`block w-full text-left text-sm px-3 py-1.5 rounded-md ${fornecedor === "todos" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"}`}>Todas</button>
                    {(fornecedores || []).map((f) => (
                      <button key={f} onClick={() => { setFornecedor(f); setPage(0); }} className={`block w-full text-left text-sm px-3 py-1.5 rounded-md ${fornecedor === f ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"}`}>{f}</button>
                    ))}
                  </div>
                </div>
              )}
              {/* Categorias */}
              {(categorias || []).length > 0 && (
                <div>
                  <h3 className="font-bold text-sm text-foreground mb-2">Categorias</h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    <button onClick={() => { setCategoria("todas"); setPage(0); }} className={`block w-full text-left text-sm px-3 py-1.5 rounded-md ${categoria === "todas" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"}`}>Todas</button>
                    {(categorias || []).map((c) => (
                      <button key={c} onClick={() => { setCategoria(c); setPage(0); }} className={`block w-full text-left text-sm px-3 py-1.5 rounded-md ${categoria === c ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"}`}>{c}</button>
                    ))}
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* ===== PRODUCT GRID ===== */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter bar */}
            <div className="flex items-center gap-2 mb-4 lg:hidden">
              <Button variant="outline" size="sm" className="text-xs h-9" onClick={() => setSidebarOpen(true)}>
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" /> Filtros
              </Button>
              {fornecedor !== "todos" && (
                <Badge variant="secondary" className="text-[10px] cursor-pointer" onClick={() => { setFornecedor("todos"); setPage(0); }}>
                  {fornecedor} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {categoria !== "todas" && (
                <Badge variant="secondary" className="text-[10px] cursor-pointer" onClick={() => { setCategoria("todas"); setPage(0); }}>
                  {categoria} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>

            {/* Active filters badges (desktop) */}
            <div className="hidden lg:flex items-center gap-2 mb-4">
              {ordenacao !== "relevantes" && (
                <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setOrdenacao("relevantes")}>
                  {ordenacao === "menor_preco" ? "Menor Preço" : ordenacao === "maior_preco" ? "Maior Preço" : ordenacao === "maior_desconto" ? "Maior Desconto" : "Nome (A-Z)"} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {fornecedor !== "todos" && (
                <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => { setFornecedor("todos"); setPage(0); }}>
                  {fornecedor} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {categoria !== "todas" && (
                <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => { setCategoria("todas"); setPage(0); }}>
                  {categoria} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>

        {isLoading ? (
          <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
                <div className="h-44 bg-muted/50" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted/50 rounded w-3/4" />
                  <div className="h-3 bg-muted/50 rounded w-1/2" />
                  <div className="h-6 bg-muted/50 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Package className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground font-medium">Nenhum produto encontrado</p>
            <p className="text-xs text-muted-foreground">Tente ajustar os filtros ou buscar por outro termo</p>
          </div>
        ) : (
          <>
          <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.slice(0, 10).map((p) => {
                const preco = getPrecoVenda(p.precos_venda);
                const app = (p.aplicacoes as string[] | null)?.[0];
                const est = p.estoque_quantidade ?? 0;
                const precoPix = preco ? preco * (1 - PIX_DISCOUNT) : null;
                const parc = preco ? calcParcelas(preco) : null;
                const inCart = cart.find(c => c.id === p.id);

                return (
                  <div
                    key={p.id}
                    className="bg-card rounded-xl border border-border overflow-hidden group hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col cursor-pointer"
                    onClick={() => {
                      if (!isLoggedIn) {
                        navigate("/ecommerce/login");
                        return;
                      }
                      setSelectedProduct(p);
                    }}
                  >
                    <div className="relative flex items-center justify-center h-32 sm:h-44 bg-white p-2 sm:p-3">
                      {p.imagem_url ? (
                        <img src={p.imagem_url} alt={p.nome} className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy" onError={() => markImageAsBroken(p.id)} />
                      ) : null}
                      <Package className={`h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 ${p.imagem_url ? "hidden" : ""}`} />
                      {est > 0 && <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-primary text-primary-foreground text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded">PRONTA ENTREGA</span>}
                      {p.fornecedor && <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-foreground/80 text-white text-[8px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded backdrop-blur-sm">{p.fornecedor}</span>}
                    </div>
                    <div className="p-2 sm:p-3 flex flex-col flex-1">
                      <h3 className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 min-h-[2rem] group-hover:text-primary transition-colors">{p.nome}</h3>
                      {p.codigo_fornecedor && <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono mt-0.5 block">REF: {p.codigo_fornecedor}</span>}
                      {app && <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 truncate hidden sm:block">🏍️ {app}</p>}
                      <div className="mt-auto pt-1.5 sm:pt-2">
                        {preco ? (
                          isLoggedIn ? (
                            <div className="space-y-0.5 sm:space-y-1">
                              <div className="flex items-baseline gap-1"><span className="text-sm sm:text-lg font-black text-primary">R$ {fmt(precoPix!)}</span></div>
                              <span className="text-[9px] sm:text-[10px] text-primary/80 font-medium block">no PIX ({Math.round(PIX_DISCOUNT * 100)}% off)</span>
                              {parc && parc.n > 1 && <p className="text-[9px] sm:text-[10px] text-muted-foreground hidden sm:block">ou <strong>{parc.n}x</strong> de <strong>R$ {fmt(parc.valor)}</strong> s/ juros</p>}
                              <p className="text-[9px] sm:text-[10px] text-muted-foreground/70 line-through">R$ {fmt(preco)}</p>
                              <div className="flex gap-1 sm:gap-1.5 mt-1.5 sm:mt-2" onClick={(e) => e.stopPropagation()}>
                                <Button size="sm" variant="outline" className={`flex-1 text-[10px] sm:text-xs h-8 sm:h-9 px-1.5 sm:px-3 ${inCart ? "border-primary text-primary" : ""}`} onClick={() => addToCart({ id: p.id, nome: p.nome, preco, imagem_url: p.imagem_url })}>
                                  <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" />{inCart ? `(${inCart.quantidade})` : "Carrinho"}
                                </Button>
                                <Button size="sm" className="flex-1 gradient-primary text-white font-bold text-[10px] sm:text-xs h-8 sm:h-9 px-1.5 sm:px-3" onClick={() => { addToCart({ id: p.id, nome: p.nome, preco, imagem_url: p.imagem_url }); setCartOpen(true); }}>COMPRAR</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5 sm:space-y-2" onClick={(e) => e.stopPropagation()}>
                              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">🔒 Faça login para ver preços</p>
                              <Link to="/ecommerce/login">
                                <Button size="sm" variant="outline" className="w-full text-[10px] sm:text-xs h-8 sm:h-9">
                                  <LogIn className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" /> Entrar
                                </Button>
                              </Link>
                            </div>
                          )
                        ) : (
                          <p className="text-xs sm:text-sm text-muted-foreground">Consulte o preço</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ===== BANNERS CENTRAIS ===== */}
            {bannersCentrais.length > 0 && visibleProducts.length > 10 && (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 my-8">
                {bannersCentrais.map((b, idx) => (
                  <a
                    key={idx}
                    href={b.link || "#"}
                    target={b.link?.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="block rounded-xl overflow-hidden border border-border hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                  >
                    {b.url.toLowerCase().endsWith(".pdf") ? (
                      <iframe src={b.url} className="w-full pointer-events-none" style={{ aspectRatio: "345/560" }} title={b.titulo || "Banner Central"} />
                    ) : (
                      <img src={b.url} alt={b.titulo || "Banner"} className="w-full h-full object-cover" style={{ aspectRatio: "345/560" }} loading="lazy" />
                    )}
                  </a>
                ))}
              </div>
            )}

            {/* Remaining products */}
            {visibleProducts.length > 10 && (
              <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.slice(10).map((p) => {
                  const preco = getPrecoVenda(p.precos_venda);
                  const app = (p.aplicacoes as string[] | null)?.[0];
                  const est = p.estoque_quantidade ?? 0;
                  const precoPix = preco ? preco * (1 - PIX_DISCOUNT) : null;
                  const parc = preco ? calcParcelas(preco) : null;
                  const inCart = cart.find(c => c.id === p.id);

                  return (
                    <div
                      key={p.id}
                      className="bg-card rounded-xl border border-border overflow-hidden group hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col cursor-pointer"
                      onClick={() => {
                        if (!isLoggedIn) {
                          navigate("/ecommerce/login");
                          return;
                        }
                        setSelectedProduct(p);
                      }}
                    >
                      <div className="relative flex items-center justify-center h-32 sm:h-44 bg-white p-2 sm:p-3">
                        {p.imagem_url ? (
                          <img src={p.imagem_url} alt={p.nome} className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy" onError={() => markImageAsBroken(p.id)} />
                        ) : null}
                        <Package className={`h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 ${p.imagem_url ? "hidden" : ""}`} />
                        {est > 0 && <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-primary text-primary-foreground text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded">PRONTA ENTREGA</span>}
                        {p.fornecedor && <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-foreground/80 text-white text-[8px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded backdrop-blur-sm">{p.fornecedor}</span>}
                      </div>
                      <div className="p-2 sm:p-3 flex flex-col flex-1">
                        <h3 className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 min-h-[2rem] group-hover:text-primary transition-colors">{p.nome}</h3>
                        {p.codigo_fornecedor && <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono mt-0.5 block">REF: {p.codigo_fornecedor}</span>}
                        {app && <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 truncate hidden sm:block">🏍️ {app}</p>}
                        <div className="mt-auto pt-1.5 sm:pt-2">
                          {preco ? (
                          isLoggedIn ? (
                            <div className="space-y-0.5 sm:space-y-1">
                              <div className="flex items-baseline gap-1"><span className="text-sm sm:text-lg font-black text-primary">R$ {fmt(precoPix!)}</span></div>
                              <span className="text-[9px] sm:text-[10px] text-primary/80 font-medium block">no PIX ({Math.round(PIX_DISCOUNT * 100)}% off)</span>
                              {parc && parc.n > 1 && <p className="text-[9px] sm:text-[10px] text-muted-foreground hidden sm:block">ou <strong>{parc.n}x</strong> de <strong>R$ {fmt(parc.valor)}</strong> s/ juros</p>}
                              <p className="text-[9px] sm:text-[10px] text-muted-foreground/70 line-through">R$ {fmt(preco)}</p>
                              <div className="flex gap-1 sm:gap-1.5 mt-1.5 sm:mt-2" onClick={(e) => e.stopPropagation()}>
                                <Button size="sm" variant="outline" className={`flex-1 text-[10px] sm:text-xs h-8 sm:h-9 px-1.5 sm:px-3 ${inCart ? "border-primary text-primary" : ""}`} onClick={() => addToCart({ id: p.id, nome: p.nome, preco, imagem_url: p.imagem_url })}>
                                  <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" />{inCart ? `(${inCart.quantidade})` : "Carrinho"}
                                </Button>
                                <Button size="sm" className="flex-1 gradient-primary text-white font-bold text-[10px] sm:text-xs h-8 sm:h-9 px-1.5 sm:px-3" onClick={() => { addToCart({ id: p.id, nome: p.nome, preco, imagem_url: p.imagem_url }); setCartOpen(true); }}>COMPRAR</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5 sm:space-y-2" onClick={(e) => e.stopPropagation()}>
                              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">🔒 Faça login para ver preços</p>
                              <Link to="/ecommerce/login">
                                <Button size="sm" variant="outline" className="w-full text-[10px] sm:text-xs h-8 sm:h-9">
                                  <LogIn className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" /> Entrar
                                </Button>
                              </Link>
                            </div>
                          )
                        ) : (
                          <p className="text-xs sm:text-sm text-muted-foreground">Consulte o preço</p>
                        )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-8">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page + 1} de {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="bg-foreground text-background mt-12">
        {/* Top section: Logo + Social + Newsletter */}
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo / Nome */}
            <div className="flex items-center gap-3">
              {STORE.logo_url ? (
                <img src={STORE.logo_url} alt={STORE.nome} className="h-10 w-auto object-contain" />
              ) : (
                <span className="text-xl font-bold tracking-widest uppercase">{STORE.nome}</span>
              )}
            </div>
            {/* Social icons */}
            <div className="flex items-center gap-4">
              {STORE.instagram && (
                <a href={STORE.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-primary hover:border-primary transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {STORE.facebook && (
                <a href={STORE.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-primary hover:border-primary transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {STORE.youtube && (
                <a href={STORE.youtube} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-primary hover:border-primary transition-colors">
                  <Youtube className="h-4 w-4" />
                </a>
              )}
              {STORE.tiktok && (
                <a href={STORE.tiktok} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-primary hover:border-primary transition-colors">
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
            {/* Newsletter */}
            <div className="text-center md:text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-white/80 mb-2">Receba novidades e promoções</p>
              <div className="flex gap-2">
                <Input placeholder="Seu e-mail" className="h-9 bg-white/5 border-white/15 text-white placeholder:text-white/40 text-xs rounded-lg w-48" />
                <Button size="sm" className="h-9 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg px-4">
                  Cadastrar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle section: Navigation columns */}
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Navegação */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/90 mb-4 pb-2 border-b border-white/10">Navegação</h4>
            <ul className="space-y-2.5">
              {["Todos os Produtos", "Mais Vendidos", "Lançamentos", "Promoções"].map((item) => (
                <li key={item}>
                  <button onClick={() => { setCategoria("todas"); setPage(0); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-xs uppercase tracking-wide text-white/50 hover:text-primary transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/90 mb-4 pb-2 border-b border-white/10">Institucional</h4>
            <ul className="space-y-2.5">
              {(STORE.institucional as { titulo: string; visivel: boolean }[])
                .filter((item) => item.visivel && item.titulo.trim())
                .map((item) => (
                  <li key={item.titulo}>
                    <span className="text-xs uppercase tracking-wide text-white/50 hover:text-primary transition-colors cursor-pointer">{item.titulo}</span>
                  </li>
                ))}
            </ul>
          </div>

          {/* Central de Atendimento */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/90 mb-4 pb-2 border-b border-white/10">Central de Atendimento</h4>
            <div className="space-y-3 text-xs text-white/60">
              {STORE.whatsapp && (
                <a href={`https://wa.me/${STORE.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-primary transition-colors">
                  <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                  <span className="uppercase tracking-wide">{STORE.whatsapp}</span>
                </a>
              )}
              {STORE.telefone && (
                <p className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span className="uppercase tracking-wide">{STORE.telefone}</span>
                </p>
              )}
              {STORE.telefone_secundario && (
                <p className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span className="uppercase tracking-wide">{STORE.telefone_secundario}</span>
                </p>
              )}
              {STORE.email && (
                <a href={`mailto:${STORE.email}`} className="flex items-center gap-2.5 hover:text-primary transition-colors">
                  <svg className="h-4 w-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <span className="uppercase tracking-wide">{STORE.email}</span>
                </a>
              )}
              {STORE.endereco && (
                <p className="leading-relaxed uppercase tracking-wide mt-2">{STORE.endereco}</p>
              )}
              {STORE.horario && (
                <p className="uppercase tracking-wide text-white/40">{STORE.horario}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom section: Payment + Copyright */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pagamento */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Pagamento</p>
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { name: "Visa", src: "/images/visa.png" },
                  { name: "Mastercard", src: "/images/mastercard.png" },
                  { name: "Amex", src: "/images/amex.png" },
                  { name: "Elo", src: "/images/elo.png" },
                  { name: "Diners", src: "/images/diners.png" },
                  { name: "Boleto", src: "/images/boleto.png" },
                ].map((m) => (
                  <span key={m.name} className="flex items-center justify-center w-14 h-10 bg-white/10 border border-white/10 rounded-md p-1.5">
                    <img src={m.src} alt={m.name} className="h-6 w-auto object-contain brightness-0 invert opacity-90" />
                  </span>
                ))}
                <span className="flex items-center justify-center h-10 bg-white/10 border border-white/10 rounded-md px-3 py-1.5">
                  <span className="text-sm font-bold text-white/90 tracking-wide">PIX</span>
                </span>
              </div>
            </div>

            {/* Segurança */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Segurança</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-lg px-3 py-2">
                  <img src="/images/ssl.png" alt="SSL" className="h-7 w-auto" />
                  <div>
                    <p className="text-[10px] font-bold text-white/80 uppercase">Site Seguro</p>
                    <p className="text-[9px] text-white/50">Certificado SSL</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-lg px-3 py-2">
                  <img src="/images/google-safe.png" alt="Google Safe" className="h-7 w-auto" />
                  <div>
                    <p className="text-[10px] font-bold text-white/80 uppercase">Safe Browsing</p>
                    <p className="text-[9px] text-white/50">Google</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificados */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Certificados</p>
              <div className="bg-background rounded-lg px-4 py-3 inline-flex items-center gap-2.5 shadow-sm">
                <Shield className="h-7 w-7 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Verificada por</p>
                  <p className="text-sm font-bold text-primary">Reclame Aqui</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 text-center">
            <p className="text-[11px] text-white/30">
              © {new Date().getFullYear()} {STORE.nome} — Todos os direitos reservados
            </p>
            <p className="text-[10px] text-white/20 mt-1">
              Powered by <span className="text-primary font-semibold">Otto Tech Sistemas</span>
            </p>
          </div>
        </div>
      </footer>

      {/* ===== WHATSAPP FLOAT ===== */}
      {whatsappClean && (
        <a
          href={`https://wa.me/${whatsappClean}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 left-6 z-50 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white rounded-full p-3.5 shadow-lg transition-transform hover:scale-110"
          title="Fale conosco pelo WhatsApp"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
      )}

      {/* ===== CART FLOATING BUTTON (mobile) ===== */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full p-3.5 shadow-lg transition-transform hover:scale-110 md:hidden flex items-center gap-2"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="font-bold text-sm">{cartCount}</span>
        </button>
      )}

      {/* ===== CART DRAWER ===== */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Carrinho ({cartCount} {cartCount === 1 ? "item" : "itens"})
            </SheetTitle>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <ShoppingCart className="h-16 w-16 opacity-20" />
              <p className="font-medium">Seu carrinho está vazio</p>
              <p className="text-xs">Adicione produtos para continuar</p>
              <Button variant="outline" onClick={() => setCartOpen(false)}>
                Continuar comprando
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map((item) => {
                  const itemPix = item.preco * (1 - PIX_DISCOUNT);
                  return (
                    <div key={item.id} className="flex gap-3 p-3 rounded-lg border border-border bg-card">
                      <div className="h-16 w-16 rounded-md bg-white flex items-center justify-center overflow-hidden shrink-0">
                        {item.imagem_url ? (
                          <img src={item.imagem_url} alt={item.nome} className="h-full w-full object-contain" />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold line-clamp-2 leading-tight">{item.nome}</h4>
                        <p className="text-sm font-bold text-primary mt-1">
                          R$ {fmt(itemPix * item.quantidade)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Un: R$ {fmt(item.preco)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
                            onClick={() => updateCartQty(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-bold w-6 text-center">{item.quantidade}</span>
                          <button
                            className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
                            onClick={() => updateCartQty(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            className="ml-auto h-7 w-7 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cart summary */}
              <div className="border-t border-border p-4 space-y-3 bg-card">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">R$ {fmt(cartSubtotal)}</span>
                </div>
                {cupomAtivo && roletaCupom?.tipo === "desconto" && cupomDescontoValor > 0 && (
                  <div className="flex justify-between items-center text-sm gap-2">
                    <span className="text-emerald-500 font-medium flex items-center gap-1 min-w-0">
                      <span className="truncate">🎁 Cupom {roletaCupom.code} (-{cupomDescontoPct}%)</span>
                      <button
                        onClick={removerCupom}
                        className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-colors"
                        aria-label="Remover cupom"
                        title="Remover cupom"
                      >
                        <span className="text-[10px] font-bold leading-none">✕</span>
                      </button>
                    </span>
                    <span className="font-bold text-emerald-500">- R$ {fmt(cupomDescontoValor)}</span>
                  </div>
                )}
                {cupomAtivo && roletaCupom?.tipo === "produto" && (
                  <div className="flex justify-between items-center text-sm gap-2">
                    <span className="text-emerald-500 font-medium flex items-center gap-1 min-w-0">
                      <span className="truncate">🎁 Brinde: {roletaCupom.label}</span>
                      <button
                        onClick={removerCupom}
                        className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-colors"
                        aria-label="Remover brinde"
                        title="Remover brinde"
                      >
                        <span className="text-[10px] font-bold leading-none">✕</span>
                      </button>
                    </span>
                    <span className="font-bold text-emerald-500">GRÁTIS</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-primary font-medium">Total no PIX (3% off)</span>
                  <span className="font-bold text-primary text-lg">R$ {fmt(cartTotal * (1 - PIX_DISCOUNT))}</span>
                </div>
                {cartTotal > 0 && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    ou até {MAX_PARCELAS}x de R$ {fmt(cartTotal / MAX_PARCELAS)} sem juros
                  </p>
                )}
                <Button
                  className="w-full gradient-primary text-white font-bold h-12 text-sm uppercase tracking-wide"
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                >
                  Finalizar Compra
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => setCartOpen(false)}
                >
                  Continuar comprando
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ProductDetailModal
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(v) => { if (!v) setSelectedProduct(null); }}
        getPrecoVenda={getPrecoVenda}
        pixDiscount={PIX_DISCOUNT}
        maxParcelas={MAX_PARCELAS}
        onAddToCart={addToCart}
        onBuyNow={(item) => { addToCart(item); setCartOpen(true); }}
        isLoggedIn={isLoggedIn}
        onRequireLogin={() => { window.location.href = "/ecommerce/login"; }}
      />

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        cart={cart}
        onClearCart={() => setCart([])}
        cupom={cupomAtivo && roletaCupom ? { code: roletaCupom.code, label: roletaCupom.label, tipo: roletaCupom.tipo, valor: roletaCupom.valor } : null}
        onRemoveCupom={removerCupom}
        onApplyCupomCode={(code) => {
          if (!code) return false;
          try {
            const raw = localStorage.getItem("roleta_cupom");
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            if (!parsed?.code || parsed.expiresAt <= Date.now()) return false;
            if (parsed.code.toUpperCase() !== code.toUpperCase()) return false;
            setRoletaCupom(parsed);
            setRoletaBarHidden(false);
            return true;
          } catch { return false; }
        }}
      />

      {ecomConfig?.roleta_ativa && ecomConfig.roleta_opcoes?.length > 0 && (
        <SpinWheelPopup
          open={roletaOpen}
          onOpenChange={setRoletaOpen}
          opcoes={ecomConfig.roleta_opcoes}
          lockedUntil={roletaLockedUntil}
          initialResult={roletaCupom}
          onSpun={({ code, label, expiresAt }) => {
            const ts = Date.now();
            localStorage.setItem("roleta_girada_ts", String(ts));
            setRoletaLockedUntil(expiresAt);
            // find original option to keep valor/tipo
            const op = ecomConfig.roleta_opcoes.find((o: any) => o.label === label);
            const cupom = {
              code,
              label,
              valor: op?.valor ?? 0,
              tipo: (op?.tipo ?? "desconto") as "desconto" | "produto",
              expiresAt,
            };
            setRoletaCupom(cupom);
            setRoletaBarHidden(false);
            localStorage.setItem("roleta_cupom", JSON.stringify(cupom));
          }}
        />
      )}

      {/* Floating coupon countdown bar */}
      {roletaCupom && roletaCupom.expiresAt > roletaNow && !roletaOpen && !roletaBarHidden && (() => {
        const ms = Math.max(0, roletaCupom.expiresAt - roletaNow);
        const hh = String(Math.floor(ms / 3600000)).padStart(2, "0");
        const mm = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
        const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
        return (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
            <div className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-full pl-4 pr-2 py-2 shadow-2xl shadow-red-500/40 border-2 border-yellow-400">
              <button
                onClick={() => setRoletaOpen(true)}
                className="flex items-center gap-3 hover:scale-105 transition-transform"
                aria-label="Ver cupom da roleta"
              >
                <span className="text-2xl">🎟️</span>
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider opacity-90 leading-tight">Cupom {roletaCupom.label}</div>
                  <div className="font-mono text-base font-black tabular-nums leading-tight" aria-live="polite">
                    {hh}:{mm}:{ss}
                  </div>
                </div>
              </button>
              <button
                onClick={removerCupom}
                className="ml-1 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
                aria-label="Remover cupom"
                title="Remover cupom"
              >
                <span className="text-sm font-bold">✕</span>
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
