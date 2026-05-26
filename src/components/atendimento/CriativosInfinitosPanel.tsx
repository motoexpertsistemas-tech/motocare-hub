import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Upload, Image as ImageIcon, Camera, X, Loader2,
  PaintBucket, Type, Wand2, FileSpreadsheet, Palette, Film,
  Heart, Sun, Eye, Zap, Plus, ImagePlus, BarChart3,
  Download, Code2, Copy, ArrowLeft,
} from "lucide-react";

const LOADING_MESSAGES = [
  "Renderizando ativos visuais de alta conversão...",
  "Planejando estrutura narrativa do criativo...",
  "Aplicando estratégias de performance comprovadas...",
  "Calibrando paleta cromática para máximo impacto...",
  "Finalizando composição estratégica para ads...",
];

const FORMAT_LABELS = ["FEED (4:5)", "STORY (9:16)", "QUADRADO (1:1)", "BANNER (16:9)"];

type Stage = "upload" | "studio" | "resultados";
type StudioTab = "criativos" | "fotos";

const ESTRATEGIAS = [
  { id: "novo", label: "Novo Do Zero" },
  { id: "manter", label: "Manter Estilo" },
  { id: "lote", label: "Criativos em Lote" },
];

const FORMATOS = [
  { id: "feed", label: "Food (1:1)", ratio: "1:1", size: "1080×1080" },
  { id: "portrait", label: "Portrait (4:5)", ratio: "4:5", size: "1080×1350" },
  { id: "story", label: "Story (9:16)", ratio: "9:16", size: "1080×1920" },
  { id: "banner", label: "Banner (16:9)", ratio: "16:9", size: "1920×1080" },
];

const RESOLUCOES = [
  { id: "1k", label: "1K · Digital" },
  { id: "2k", label: "2K · Premium" },
  { id: "4k", label: "4K · Master" },
];

const TAMANHOS_PRODUTO = ["Large", "Phone", "Adicional"];

const MODOS_FOTO = [
  { id: "zero", label: "Gerar do Zero" },
  { id: "combinar", label: "Combinar 2 Fotos" },
  { id: "referencia", label: "Referenciar Estilo" },
];

const ESTILOS_ARTISTICOS = [
  "Realistic", "Cinematic", "Anime", "Architecture", "Cartoon", "3D Render",
  "Vector", "Watercolor", "Sketch / Line Art", "Oil Painting", "Abstract",
  "Surreal", "Fashion", "Photography", "Portrait",
];

const ESTILOS_CORPORATIVOS = [
  "Profissional", "Startup", "Luxo", "Jovem", "Institucional", "Descontraído",
];

const GENEROS = [
  "Produto", "Lifestyle", "Retrato", "Paisagem", "Abstrato", "Tecnologia", "Alimentação", "Moda",
];

const MOODS = [
  "Alegre", "Dramático", "Sereno", "Energético", "Sofisticado", "Acolhedor", "Misterioso", "Clean",
];

/* ── Numbered badge ── */
function SectionBadge({ n }: { n: string }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
      {n}
    </span>
  );
}

/* ── Reusable pill/chip ── */
function PillGroup({ items, selected, onSelect }: { items: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-200 ${
            selected === item
              ? "border-primary bg-primary text-primary-foreground shadow-[0_0_14px_-2px_hsl(var(--primary)/0.5)]"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground bg-muted/30"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function TogglePillGroup({ items, selected, onToggle }: { items: { id: string; label: string; size?: string }[]; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onToggle(item.id)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-200 ${
            selected.includes(item.id)
              ? "border-primary bg-primary text-primary-foreground shadow-[0_0_14px_-2px_hsl(var(--primary)/0.5)]"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground bg-muted/30"
          }`}
        >
          {item.label} {item.size && <span className="opacity-50 ml-0.5">({item.size})</span>}
        </button>
      ))}
    </div>
  );
}

export default function CriativosInfinitosPanel() {
  const [stage, setStageRaw] = useState<Stage>(() => {
    const saved = sessionStorage.getItem("criativos_stage");
    return (saved === "upload" || saved === "studio" || saved === "resultados") ? saved : "upload";
  });
  const setStage = (s: Stage) => { sessionStorage.setItem("criativos_stage", s); setStageRaw(s); };
  const [studioTab, setStudioTab] = useState<StudioTab>("criativos");

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [estrategia, setEstrategia] = useState("novo");
  const [formatosSel, setFormatosSel] = useState<string[]>(["feed"]);
  const [resolucao, setResolucao] = useState("1k");
  const [variacoes, setVariacoes] = useState(3);
  const [customFormats, setCustomFormats] = useState<{ w: string; h: string }[]>([]);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [headline1, setHeadline1] = useState("");
  const [headline2, setHeadline2] = useState("");
  const [direcaoArte, setDirecaoArte] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [tamanhoProduto, setTamanhoProduto] = useState("Large");

  const [modoFoto, setModoFoto] = useState("zero");
  const [contextoImagem, setContextoImagem] = useState("");
  const [estiloArtistico, setEstiloArtistico] = useState("Realistic");
  const [estiloCorporativo, setEstiloCorporativo] = useState("Profissional");
  const [genero, setGenero] = useState("Produto");
  const [mood, setMood] = useState("Clean");
  const [qtdFotos, setQtdFotos] = useState(1);
  const [fotosFormatosSel, setFotosFormatosSel] = useState<string[]>(["story"]);
  const [fotosResolucao, setFotosResolucao] = useState("1k");
  const [fotosCustomFormats, setFotosCustomFormats] = useState<{ w: string; h: string }[]>([]);
  const [fotosCustomW, setFotosCustomW] = useState("");
  const [fotosCustomH, setFotosCustomH] = useState("");

  const [gerando, setGerando] = useState(false);
  const [resultados, setResultadosRaw] = useState<{ imageUrl?: string; text: string }[]>(() => {
    try { return JSON.parse(sessionStorage.getItem("criativos_resultados") || "[]"); } catch { return []; }
  });
  const setResultados = (fn: { imageUrl?: string; text: string }[] | ((prev: { imageUrl?: string; text: string }[]) => { imageUrl?: string; text: string }[])) => {
    setResultadosRaw((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      sessionStorage.setItem("criativos_resultados", JSON.stringify(next));
      return next;
    });
  };
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);

  // Refinar com IA
  const [refineIndex, setRefineIndex] = useState<number | null>(null);
  const [refineText, setRefineText] = useState("");
  const [refining, setRefining] = useState(false);

  const parseAIGatewayError = async (error: unknown): Promise<string> => {
    const err = error as { message?: string; context?: Response };
    const status = err?.context?.status;
    let backendMessage = "";

    if (err?.context) {
      try {
        const json = await err.context.clone().json();
        if (json && typeof json.error === "string") backendMessage = json.error;
      } catch {
        try {
          const text = await err.context.clone().text();
          if (text) backendMessage = text;
        } catch {
          backendMessage = "";
        }
      }
    }

    if (status === 402) return "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage.";
    if (status === 429) return "Muitas requisições! Aguarde alguns segundos e tente novamente.";

    return backendMessage || err?.message || "Erro desconhecido ao gerar conteúdo com IA.";
  };

  const invokeGerarCriativos = async (body: { prompt: string; count: number; images?: string[] }) => {
    const { data, error } = await supabase.functions.invoke("gerar-criativos", { body });

    if (error) {
      return {
        data: null,
        errorMessage: await parseAIGatewayError(error),
      };
    }

    if (data?.error) {
      return {
        data: null,
        errorMessage: String(data.error),
      };
    }

    return {
      data: data as { results?: { imageUrl?: string; text: string }[] },
      errorMessage: null,
    };
  };

  const refinarImagem = async () => {
    if (refineIndex === null || !refineText.trim()) return;
    const currentImage = resultados[refineIndex]?.imageUrl;
    if (!currentImage) {
      toast.error("Sem imagem para refinar");
      return;
    }

    setRefining(true);
    try {
      const { data, errorMessage } = await invokeGerarCriativos({
        prompt: `Refine/edite esta imagem: ${refineText.trim()}`,
        count: 1,
        images: [currentImage],
      });

      if (errorMessage) {
        toast.error(errorMessage);
        return;
      }

      const newImg = data?.results?.[0];
      if (newImg) {
        setResultados((prev) =>
          prev.map((r, i) =>
            i === refineIndex
              ? { ...r, imageUrl: newImg.imageUrl || r.imageUrl, text: newImg.text || r.text }
              : r
          )
        );
        toast.success("Imagem refinada com sucesso!");
      }

      setRefineIndex(null);
      setRefineText("");
    } catch {
      toast.error("Não foi possível refinar a imagem agora.");
    } finally {
      setRefining(false);
    }
  };

  // Rotate loading messages
  useEffect(() => {
    if (!gerando) {
      setLoadingMsgIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [gerando]);

  // ── Assets library ──
  const [assets, setAssets] = useState<string[]>([]);
  const assetRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);

  // ── Fotos upload refs ──
  const fotoUploadRef = useRef<HTMLInputElement>(null);
  const [fotosUploaded, setFotosUploaded] = useState<string[]>([]);

  const addAsset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setAssets((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    }
  };

  const addLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFotosUploaded((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    }
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
        setStage("studio");
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
        setStage("studio");
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFormato = (id: string) => {
    setFormatosSel((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const collectReferenceImages = (): string[] => {
    const imgs: string[] = [];
    if (uploadedImage) imgs.push(uploadedImage);
    assets.forEach((a) => imgs.push(a));
    return imgs.slice(0, 3);
  };

  const gerarCriativos = async () => {
    setGerando(true);
    setResultados([]);
    try {
      const prompt = buildCreativePrompt();
      const images = estrategia === "manter" ? collectReferenceImages() : [];
      const { data, errorMessage } = await invokeGerarCriativos({ prompt, count: variacoes, images });

      if (errorMessage) {
        toast.error(errorMessage);
        return;
      }

      const results = data?.results || [];
      setResultados(results);
      if (results.length > 0) setStage("resultados");
      toast.success(`${variacoes} variações geradas!`);
    } catch {
      toast.error("Não foi possível gerar criativos agora.");
    } finally {
      setGerando(false);
    }
  };

  const gerarFotos = async () => {
    setGerando(true);
    setResultados([]);
    try {
      const prompt = buildPhotoPrompt();
      const images =
        modoFoto === "referencia"
          ? fotosUploaded.slice(0, 3)
          : modoFoto === "combinar"
            ? fotosUploaded.slice(0, 3)
            : [];
      const { data, errorMessage } = await invokeGerarCriativos({ prompt, count: qtdFotos, images });

      if (errorMessage) {
        toast.error(errorMessage);
        return;
      }

      const results = data?.results || [];
      setResultados(results);
      if (results.length > 0) setStage("resultados");
      toast.success(`${qtdFotos} fotos geradas!`);
    } catch {
      toast.error("Não foi possível gerar fotos agora.");
    } finally {
      setGerando(false);
    }
  };

  const buildCreativePrompt = () => {
    const mantendo = estrategia === "manter" ? "\nIMPORTANTE: Mantenha o estilo visual, composição, cores e layout da(s) imagem(ns) de referência fornecida(s). Crie variações mantendo a mesma identidade visual." : "";
    return `Crie um anúncio publicitário:\n${[`Estratégia: ${estrategia}`, `Formatos: ${formatosSel.join(", ")}`, `Resolução: ${resolucao}`, headline1 ? `Headline 1: ${headline1}` : "", headline2 ? `Headline 2: ${headline2}` : "", direcaoArte ? `Direção de Arte: ${direcaoArte}` : ""].filter(Boolean).join("\n")}${mantendo}`;
  };

  const buildPhotoPrompt = () => {
    const ref = modoFoto === "referencia" ? "\nIMPORTANTE: Use a(s) imagem(ns) de referência fornecida(s) como base de estilo. Mantenha cores, composição e identidade visual." : "";
    const comb = modoFoto === "combinar" ? "\nIMPORTANTE: Combine as imagens fornecidas numa composição única e harmônica." : "";
    return `Gere uma foto profissional:\n${[`Modo: ${modoFoto}`, `Contexto: ${contextoImagem || "Genérico"}`, `Estilo Artístico: ${estiloArtistico}`, `Estilo Corporativo: ${estiloCorporativo}`, `Gênero: ${genero}`, `Mood: ${mood}`].join("\n")}${ref}${comb}`;
  };

  // ── Shared styles ──
  const glassCard = "bg-card border border-border rounded-2xl";
  const sectionTitle = "text-[13px] font-semibold text-foreground flex items-center gap-2";
  const inputStyle = "bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20";

  // ─── STAGE 1: UPLOAD ───
  if (stage === "upload") {
    return (
      <div className="bg-background min-h-full flex flex-col p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Criativos</h2>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-foreground tracking-tight">Carregue seu Criativo</h3>
              <p className="text-muted-foreground text-sm">Analise qualquer imagem de anúncio para gerar variações de alta conversão.</p>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileRef.current?.click()}
              className={`${glassCard} p-10 text-center cursor-pointer transition-all duration-300 group ${
                dragOver ? "!border-primary/50 !bg-primary/[0.06] shadow-[0_0_40px_-8px_hsl(var(--primary)/0.3)]" : "hover:border-primary/30 hover:bg-muted/20"
              }`}
            >
              <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Clique para carregar ou arraste e solte</p>
              <p className="text-xs text-muted-foreground mt-2">PNG, JPG ou WEBP até 10MB</p>
            </div>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-[11px]">
                <span className="px-4 text-muted-foreground bg-background">Ou se preferir, comece sem uma imagem base</span>
              </div>
            </div>

            <Button variant="outline" className="w-full gap-2 h-11 bg-card border-border text-muted-foreground hover:border-primary/30 font-semibold"
              onClick={() => { setUploadedImage(null); setStage("studio"); }}>
              <Wand2 className="w-4 h-4" /> Iniciar Projeto do Zero
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STAGE 3: RESULTADOS ───
  if (stage === "resultados") {
    return (
      <div className="bg-background min-h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Ativos de Performance</h2>
              <p className="text-sm text-muted-foreground mt-1">Variações estratégicas prontas para escala.</p>
            </div>
            <Button
              variant="outline"
              className="gap-2 border-border text-muted-foreground hover:text-foreground"
              onClick={() => { setStage("studio"); setResultados([]); setExpandedPrompt(null); }}
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Estúdio
            </Button>
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-5 max-w-5xl mx-auto">
            {resultados.map((r, i) => (
              <div key={i} className={`${glassCard} overflow-hidden group`}>
                <div className="relative aspect-square bg-gradient-to-br from-primary/20 via-muted to-primary/10 flex items-center justify-center overflow-hidden">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={`Criativo ${i + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <p className="text-[11px] text-foreground/80 whitespace-pre-wrap line-clamp-6 text-center leading-relaxed p-4">{r.text.slice(0, 200)}</p>
                  )}
                  <span className="absolute top-2 left-2 text-[9px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {FORMAT_LABELS[i % FORMAT_LABELS.length]}
                  </span>

                  {/* Sparkle refine button */}
                  {r.imageUrl && refineIndex !== i && (
                    <button
                      onClick={() => { setRefineIndex(i); setRefineText(""); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
                      title="Refinar com IA"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  )}

                  {/* Refine overlay */}
                  {refineIndex === i && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 gap-3 z-10">
                      <div className="flex items-center gap-1.5 text-primary">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[12px] font-bold">Refinar com IA</span>
                      </div>
                      <textarea
                        value={refineText}
                        onChange={(e) => setRefineText(e.target.value)}
                        placeholder="Descreva o ajuste... Ex: troque a cor da fonte para branco"
                        className="w-full bg-black/50 border border-border/50 rounded-lg p-2.5 text-[11px] text-white placeholder:text-white/40 resize-none focus:outline-none focus:border-primary/60"
                        rows={3}
                        disabled={refining}
                      />
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-[11px] border-border/50 text-white/80 hover:text-white bg-transparent hover:bg-white/10"
                          onClick={() => { setRefineIndex(null); setRefineText(""); }}
                          disabled={refining}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-[11px] gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={refinarImagem}
                          disabled={refining || !refineText.trim()}
                        >
                          {refining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          {refining ? "Ajustando..." : "Aplicar"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2.5">
                  <p className="text-[10px] text-muted-foreground">{FORMAT_LABELS[i % FORMAT_LABELS.length]}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-[11px] gap-1.5"
                      onClick={() => {
                        if (r.imageUrl) {
                          const a = document.createElement("a");
                          a.href = r.imageUrl;
                          a.download = `criativo_${i + 1}.png`;
                          a.target = "_blank";
                          a.click();
                        } else {
                          navigator.clipboard.writeText(r.text);
                          toast.success("Copiado!");
                        }
                      }}
                    >
                      <Download className="w-3 h-3" /> Baixar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-[11px] gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => setExpandedPrompt(expandedPrompt === i ? null : i)}
                    >
                      <Code2 className="w-3 h-3" /> Prompt
                    </Button>
                  </div>
                  {expandedPrompt === i && (
                    <div className="bg-muted rounded-lg p-2.5 text-[10px] text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto border border-border">
                      {r.text}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── STAGE 2: ESTÚDIO ───
  return (
    <div className="bg-background min-h-full flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {uploadedImage ? (
            <button onClick={() => setStage("upload")} className="w-14 h-14 rounded-xl border border-border overflow-hidden shrink-0 hover:opacity-80 transition-opacity">
              <img src={uploadedImage} alt="Referência" className="w-full h-full object-cover" />
            </button>
          ) : (
            <button onClick={() => setStage("upload")} className="w-8 h-8 rounded-lg bg-muted/40 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-base font-bold text-foreground leading-tight">Estúdio de Escala</h2>
            <p className="text-[10px] text-muted-foreground">{uploadedImage ? "Gere múltiplos formatos e sequências estratégicas." : "Crie novas variações do zero usando IA."}</p>
          </div>
        </div>
        <Tabs value={studioTab} onValueChange={(v) => setStudioTab(v as StudioTab)}>
          <TabsList className="bg-card border border-border h-8 p-0.5">
            <TabsTrigger value="criativos" className="gap-1 text-[11px] px-4 h-7 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_16px_-4px_hsl(var(--primary)/0.5)] text-muted-foreground">
              Criativos
            </TabsTrigger>
            <TabsTrigger value="fotos" className="gap-1 text-[11px] px-4 h-7 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_16px_-4px_hsl(var(--primary)/0.5)] text-muted-foreground">
              Fotos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Loading Overlay */}
      {gerando && (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="absolute inset-3 rounded-full border-2 border-primary/30 border-b-transparent animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
          </div>
          <div className="text-center space-y-3 max-w-md">
            <h3 className="text-xl font-bold text-foreground">Processando Inteligência...</h3>
            <p className="text-sm text-muted-foreground transition-all duration-500">{LOADING_MESSAGES[loadingMsgIdx]}</p>
            <div className="flex justify-center gap-1.5 pt-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/60 max-w-sm text-center mt-4">A IA do Criativos está pensando como um estrategista de performance.</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
          {studioTab === "criativos" ? (
            <>
              {/* 01 Estratégia de Geração */}
              <section className={`${glassCard} p-5 space-y-4`}>
                <h3 className={sectionTitle}><SectionBadge n="01" /> Estratégia de Geração</h3>
                <div className="flex gap-2">
                  {ESTRATEGIAS.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setEstrategia(e.id)}
                      className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium border transition-all duration-200 text-center ${
                        estrategia === e.id
                          ? "border-primary bg-primary text-primary-foreground shadow-[0_0_20px_-4px_hsl(var(--primary)/0.5)]"
                          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground bg-muted"
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>

                {estrategia === "lote" && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <SectionBadge n="01.1" /> Upload de Planilha (CSV)
                    </label>
                    <div
                      onClick={() => document.getElementById("csv-input")?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/30 transition-colors bg-muted/20"
                    >
                      <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-semibold text-foreground">Clique para subir seu CSV</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Colunas: headline, subheadline, description, art_direction</p>
                    </div>
                    <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                    {csvFile && <p className="text-[10px] text-muted-foreground">Arquivo: {csvFile.name}</p>}
                  </div>
                )}
              </section>

              {/* 02 Biblioteca de Ativos */}
              <section className={`${glassCard} p-5 space-y-4`}>
                <h3 className={sectionTitle}><SectionBadge n="02" /> Biblioteca de Ativos</h3>
                <input ref={assetRef} type="file" accept="image/*" className="hidden" onChange={addAsset} />
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={addLogo} />
                <div className="flex gap-3">
                  <button
                    onClick={() => assetRef.current?.click()}
                    className="w-28 h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-all bg-muted/20 gap-1"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px]">Adicionar</span>
                  </button>
                  {assets.map((src, i) => (
                    <div key={i} className="relative w-28 h-28 rounded-xl overflow-hidden border border-border group">
                      <img src={src} alt={`Asset ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => setAssets((p) => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3 text-foreground" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => logoRef.current?.click()}
                    className="flex-1 min-w-[140px] h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex items-center justify-center text-muted-foreground hover:text-primary transition-all bg-muted/20 overflow-hidden"
                  >
                    {logoImage ? (
                      <img src={logoImage} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <span className="text-[11px]">Carregar Logo</span>
                    )}
                  </button>
                </div>
              </section>

              {/* 03 Headlines */}
              <section className={`${glassCard} p-5 space-y-4`}>
                <div className="flex items-center justify-between">
                  <h3 className={sectionTitle}><SectionBadge n="03" /> Textos do Anúncio (Headlines)</h3>
                  <button className="text-[11px] text-primary hover:text-primary/80 font-medium">+ ADICIONAR VARIANTE</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Headline #1</label>
                    <Input placeholder="Ex: Transforme seu negócio com IA" value={headline1} onChange={(e) => setHeadline1(e.target.value)} className={`${inputStyle} h-10 text-[12px]`} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Subheadline #1</label>
                    <Input placeholder="Ex: Aumente sua produtividade em até 10x" value={headline2} onChange={(e) => setHeadline2(e.target.value)} className={`${inputStyle} h-10 text-[12px]`} />
                  </div>
                </div>
              </section>

              {/* Direção de Arte */}
              <section className={`${glassCard} p-5 space-y-3`}>
                <h3 className={sectionTitle}><PaintBucket className="w-4 h-4 text-primary" /> Instruções de Direção de Arte</h3>
                <Textarea
                  placeholder="Ex: Use cores discretas, iluminação anágrfica, estilo minimalista..."
                  value={direcaoArte} onChange={(e) => setDirecaoArte(e.target.value)} rows={2}
                  className={`${inputStyle} resize-none text-[12px]`}
                />
              </section>

              {/* Formatos + Variações + Resolução */}
              <section className={`${glassCard} p-5 space-y-5`}>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2.5">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Formatos (Scaling)</h4>
                    <TogglePillGroup items={FORMATOS.map(f => ({ id: f.id, label: f.label }))} selected={formatosSel} onToggle={toggleFormato} />
                  </div>
                  <div className="space-y-2.5">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quantas Variantes?</h4>
                    <div className="flex items-center gap-2.5 mt-1">
                      <button onClick={() => setVariacoes(Math.max(1, variacoes - 1))} className="w-8 h-8 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center justify-center text-sm font-bold">−</button>
                      <Input value={variacoes} onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1 && v <= 20) setVariacoes(v); }} className={`${inputStyle} w-14 h-8 text-center text-sm font-bold`} />
                      <button onClick={() => setVariacoes(Math.min(20, variacoes + 1))} className="w-8 h-8 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center justify-center text-sm font-bold">+</button>
                    </div>
                    <p className="text-[9px] text-muted-foreground">Total estimado: {variacoes} arquivos</p>
                  </div>
                  <div className="space-y-2.5">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Resolução</h4>
                    <PillGroup items={RESOLUCOES.map(r => r.label)} selected={RESOLUCOES.find(r => r.id === resolucao)?.label || ""} onSelect={(v) => setResolucao(RESOLUCOES.find(r => r.label === v)?.id || "1k")} />
                  </div>
                </div>

                {/* Formatos Personalizados */}
                <div className="space-y-2.5 pt-2 border-t border-border">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Formatos Personalizados</h4>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Largura" value={customW} onChange={(e) => setCustomW(e.target.value)} className={`${inputStyle} w-20 h-8 text-[11px]`} />
                    <span className="text-muted-foreground text-xs">x</span>
                    <Input placeholder="Altura" value={customH} onChange={(e) => setCustomH(e.target.value)} className={`${inputStyle} w-20 h-8 text-[11px]`} />
                    <Button variant="outline" size="sm" className="h-8 text-[11px] px-3" onClick={() => {
                      if (customW && customH) { setCustomFormats(p => [...p, { w: customW, h: customH }]); setCustomW(""); setCustomH(""); }
                    }}>Adicionar</Button>
                  </div>
                  {customFormats.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {customFormats.map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border border-primary bg-primary/10 text-primary">
                          {f.w}×{f.h}
                          <button onClick={() => setCustomFormats(p => p.filter((_, j) => j !== i))} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Botão Gerar */}
              <Button
                onClick={gerarCriativos} disabled={gerando}
                className="w-full h-14 text-sm font-bold tracking-wide gap-2.5 bg-gradient-to-r from-primary via-primary to-primary hover:from-primary/90 hover:via-primary/90 hover:to-primary/90 text-primary-foreground border-0 shadow-[0_4px_30px_-4px_hsl(var(--primary)/0.4)] rounded-2xl disabled:opacity-50 uppercase"
                size="lg"
              >
                {gerando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {gerando ? "Gerando..." : `GERAR ${variacoes} VARIAÇÕES ✨`}
              </Button>
            </>
          ) : (
            /* ─── FOTOS TAB ─── */
            <>
              {/* 01 Modo de Geração */}
              <section className={`${glassCard} p-5 space-y-4`}>
                <h3 className={sectionTitle}><SectionBadge n="01" /> Modo de Geração</h3>
                <div className="flex gap-2">
                  {MODOS_FOTO.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setModoFoto(m.id)}
                      className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium border transition-all duration-200 text-center ${
                        modoFoto === m.id
                          ? "border-primary bg-primary text-primary-foreground shadow-[0_0_20px_-4px_hsl(var(--primary)/0.5)]"
                          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground bg-muted"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {(modoFoto === "combinar" || modoFoto === "referencia") && (
                  <>
                    <input ref={fotoUploadRef} type="file" accept="image/*" className="hidden" onChange={addFotoUpload} />
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => fotoUploadRef.current?.click()}
                        className="w-24 h-24 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-all bg-muted/20 gap-1"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="text-[10px]">Carregar</span>
                      </button>
                      {fotosUploaded.map((src, i) => (
                        <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border group">
                          <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                          <button onClick={() => setFotosUploaded((p) => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3 text-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* 02 Contexto */}
              <section className={`${glassCard} p-5 space-y-3`}>
                <h3 className={sectionTitle}><SectionBadge n="02" /> Contexto da Imagem</h3>
                <Textarea placeholder="Descreva o que quer gerar..." value={contextoImagem} onChange={(e) => setContextoImagem(e.target.value)} rows={3} className={`${inputStyle} resize-none text-[12px]`} />
              </section>

              {/* 03 Estilo Artístico */}
              <section className={`${glassCard} p-5 space-y-3`}>
                <h3 className={sectionTitle}><SectionBadge n="03" /> Estilo Artístico</h3>
                <PillGroup items={ESTILOS_ARTISTICOS} selected={estiloArtistico} onSelect={setEstiloArtistico} />
              </section>

              {/* 04 Estilo Corporativo */}
              <section className={`${glassCard} p-5 space-y-3`}>
                <h3 className={sectionTitle}><SectionBadge n="04" /> Estilo Corporativo</h3>
                <PillGroup items={ESTILOS_CORPORATIVOS} selected={estiloCorporativo} onSelect={setEstiloCorporativo} />
              </section>

              <div className="grid grid-cols-2 gap-4">
                <section className={`${glassCard} p-5 space-y-3`}>
                  <h3 className={sectionTitle}><Heart className="w-4 h-4 text-primary" /> Gênero / Tema</h3>
                  <PillGroup items={GENEROS} selected={genero} onSelect={setGenero} />
                </section>
                <section className={`${glassCard} p-5 space-y-3`}>
                  <h3 className={sectionTitle}><Sun className="w-4 h-4 text-primary" /> Mood / Tom</h3>
                  <PillGroup items={MOODS} selected={mood} onSelect={setMood} />
                </section>
              </div>

              {/* Formatos + Variantes + Resolução */}
              <section className={`${glassCard} p-5 space-y-5`}>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2.5">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Formatos (Scaling)</h4>
                    <TogglePillGroup items={FORMATOS.map(f => ({ id: f.id, label: f.label }))} selected={fotosFormatosSel} onToggle={(id) => setFotosFormatosSel(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])} />
                  </div>
                  <div className="space-y-2.5">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quantas Variantes?</h4>
                    <div className="flex items-center gap-2.5 mt-1">
                      <button onClick={() => setQtdFotos(Math.max(1, qtdFotos - 1))} className="w-8 h-8 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center justify-center text-sm font-bold">−</button>
                      <Input value={qtdFotos} onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1 && v <= 20) setQtdFotos(v); }} className={`${inputStyle} w-14 h-8 text-center text-sm font-bold`} />
                      <button onClick={() => setQtdFotos(Math.min(20, qtdFotos + 1))} className="w-8 h-8 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center justify-center text-sm font-bold">+</button>
                    </div>
                    <p className="text-[9px] text-muted-foreground">Total estimado: {qtdFotos} arquivos</p>
                  </div>
                  <div className="space-y-2.5">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Resolução</h4>
                    <PillGroup items={RESOLUCOES.map(r => r.label)} selected={RESOLUCOES.find(r => r.id === fotosResolucao)?.label || ""} onSelect={(v) => setFotosResolucao(RESOLUCOES.find(r => r.label === v)?.id || "1k")} />
                  </div>
                </div>

                {/* Formatos Personalizados */}
                <div className="space-y-2.5 pt-2 border-t border-border">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Formatos Personalizados</h4>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Largura" value={fotosCustomW} onChange={(e) => setFotosCustomW(e.target.value)} className={`${inputStyle} w-20 h-8 text-[11px]`} />
                    <span className="text-muted-foreground text-xs">x</span>
                    <Input placeholder="Altura" value={fotosCustomH} onChange={(e) => setFotosCustomH(e.target.value)} className={`${inputStyle} w-20 h-8 text-[11px]`} />
                    <Button variant="outline" size="sm" className="h-8 text-[11px] px-3" onClick={() => {
                      if (fotosCustomW && fotosCustomH) { setFotosCustomFormats(p => [...p, { w: fotosCustomW, h: fotosCustomH }]); setFotosCustomW(""); setFotosCustomH(""); }
                    }}>Adicionar</Button>
                  </div>
                  {fotosCustomFormats.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {fotosCustomFormats.map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border border-primary bg-primary/10 text-primary">
                          {f.w}×{f.h}
                          <button onClick={() => setFotosCustomFormats(p => p.filter((_, j) => j !== i))} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <Button
                onClick={gerarFotos} disabled={gerando}
                className="w-full h-14 text-sm font-bold tracking-wide gap-2.5 bg-gradient-to-r from-primary via-primary to-primary hover:from-primary/90 hover:via-primary/90 hover:to-primary/90 text-primary-foreground border-0 shadow-[0_4px_30px_-4px_hsl(var(--primary)/0.4)] rounded-2xl disabled:opacity-50 uppercase"
                size="lg"
              >
                {gerando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                {gerando ? "Gerando..." : `GERAR ${qtdFotos} FOTOS 📷`}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
