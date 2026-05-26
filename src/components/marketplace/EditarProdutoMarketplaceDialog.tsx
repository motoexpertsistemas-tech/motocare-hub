import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Image as ImageIcon, X, Plus, Upload, Link2, Crop, Download, PenLine, Package, Truck, HelpCircle, Video, FileVideo } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageUploadButton } from "@/components/ImageUploadButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmpresa } from "@/contexts/EmpresaContext";

const CATEGORIAS = [
  "ACESSÓRIOS", "CABOS", "CARBURADOR/INJEÇÃO", "CARENAGEM/PLÁSTICO",
  "CHASSI", "ELÉTRICA", "FERRAMENTA/EQUIPAMENTOS", "FIXAÇÃO",
  "MOTOR", "RODA", "SUSPENSÃO", "TRANSMISSÃO",
];

const UNIDADES = ["UN", "PAR", "CX", "PC"];

const ORIGENS = [
  "0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8",
  "1 - Estrangeira - Importação direta, exceto a indicada no código 6",
  "2 - Estrangeira - Adquirida no mercado interno, exceto a indicada no código 7",
  "3 - Nacional, mercadoria ou bem com Conteúdo de Importação superior a 40% e inferior ou igual a 70%",
  "4 - Nacional, cuja produção tenha sido feita em conformidade com os processos produtivos básicos",
  "5 - Nacional, mercadoria ou bem com Conteúdo de Importação inferior ou igual a 40%",
  "6 - Estrangeira - Importação direta, sem similar nacional, constante em lista da CAMEX e gás natural",
  "7 - Estrangeira - Adquirida no mercado interno, sem similar nacional, constante lista CAMEX e gás natural",
  "8 - Nacional, mercadoria ou bem com Conteúdo de Importação superior a 70%",
];

interface EditarProdutoMarketplaceDialogProps {
  produtoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

type TabKey = "basica" | "venda" | "midia" | "envio" | "impostos" | "estoque";

const TABS: { key: TabKey; label: string }[] = [
  { key: "basica", label: "Info. Básica" },
  { key: "venda", label: "Info. de Venda e Atributos" },
  { key: "midia", label: "Mídia" },
  { key: "envio", label: "Envio" },
  { key: "impostos", label: "Info. de Impostos" },
  { key: "estoque", label: "Detalhes do Estoque" },
];

export default function EditarProdutoMarketplaceDialog({
  produtoId, open, onOpenChange, onSaved,
}: EditarProdutoMarketplaceDialogProps) {
  const { empresaId } = useEmpresa();
  const [tab, setTab] = useState<TabKey>("basica");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Info Básica
  const [nome, setNome] = useState("");
  const [codigoCpl, setCodigoCpl] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ean, setEan] = useState("");
  const [codigoFornecedor, setCodigoFornecedor] = useState("");

  // Venda e Atributos
  const [precoCusto, setPrecoCusto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [marca, setMarca] = useState("");
  const [peso, setPeso] = useState("");

  // Mídia
  const [imagemUrl, setImagemUrl] = useState("");
  const [imagensAdicionais, setImagensAdicionais] = useState<string[]>([]);
  const [novaImagemUrl, setNovaImagemUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  // Impostos
  const [ncm, setNcm] = useState("");
  const [cest, setCest] = useState("");
  const [unidade, setUnidade] = useState("UN");
  const [origem, setOrigem] = useState(ORIGENS[0]);

  // Estoque
  const [estoqueQuantidade, setEstoqueQuantidade] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [localizacao, setLocalizacao] = useState("");

  // Envio
  const [pesoEnvio, setPesoEnvio] = useState("0,68");
  const [dimLargura, setDimLargura] = useState("37");
  const [dimComprimento, setDimComprimento] = useState("35");
  const [dimAltura, setDimAltura] = useState("7");

  // Aplicações
  const [aplicacoes, setAplicacoes] = useState<string[]>([]);
  const [novaAplicacao, setNovaAplicacao] = useState("");

  useEffect(() => {
    if (!open || !produtoId) return;
    setTab("basica");
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("produtos_catalogo")
        .select("*")
        .eq("id", produtoId)
        .single();
      if (error || !data) {
        toast.error("Erro ao carregar produto");
        setLoading(false);
        return;
      }
      setNome(data.nome || "");
      setCodigoCpl(data.codigo_cpl || "");
      setCategoria(data.categoria || "");
      setEan(data.ean || "");
      setCodigoFornecedor(data.codigo_fornecedor || "");
      setPrecoCusto(String(data.preco_custo || ""));
      setDescricao(data.descricao || "");
      setFornecedor(data.fornecedor || "");
      setMarca(data.marca || "");
      setPeso(String(data.peso || ""));
      setImagemUrl(data.imagem_url || "");
      setImagensAdicionais((data as any).imagens_adicionais || []);
      setNcm(data.ncm || "");
      setCest(data.cest || "");
      setUnidade(data.unidade || "UN");
      setEstoqueQuantidade(String(data.estoque_quantidade || 0));
      setEstoqueMinimo(String(data.estoque_minimo || ""));
      setLocalizacao(data.localizacao || "");
      setAplicacoes(data.aplicacoes || []);
      setLoading(false);
    })();
  }, [open, produtoId]);

  const addAplicacao = () => {
    const trimmed = novaAplicacao.trim().toUpperCase();
    if (trimmed && !aplicacoes.includes(trimmed)) {
      setAplicacoes([...aplicacoes, trimmed]);
      setNovaAplicacao("");
    }
  };

  const handleSave = async () => {
    if (!nome.trim() || !codigoCpl.trim()) {
      toast.error("Nome e SKU são obrigatórios");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("produtos_catalogo")
      .update({
        nome: nome.trim(),
        codigo_cpl: codigoCpl.trim(),
        categoria: categoria || null,
        ean: ean.trim() || null,
        codigo_fornecedor: codigoFornecedor.trim() || null,
        preco_custo: parseFloat(precoCusto) || null,
        descricao: descricao.trim() || null,
        fornecedor: fornecedor.trim() || null,
        marca: marca.trim() || null,
        peso: parseFloat(peso) || null,
        imagem_url: imagemUrl.trim() || null,
        imagens_adicionais: imagensAdicionais.filter(u => u.trim()),
        ncm: ncm.trim() || null,
        cest: cest.trim() || null,
        unidade: unidade || "UN",
        estoque_quantidade: parseInt(estoqueQuantidade) || 0,
        estoque_minimo: parseInt(estoqueMinimo) || null,
        localizacao: localizacao.trim() || null,
        aplicacoes: aplicacoes.length > 0 ? aplicacoes : null,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", produtoId);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Produto atualizado com sucesso!");
      onSaved?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] h-[85vh] overflow-hidden flex flex-col bg-popover border-border p-0">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-foreground">✏️ Editar Produto — Marketplace</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Carregando...</div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar tabs */}
            <nav className="w-48 shrink-0 border-r border-border py-3 px-2 space-y-0.5 overflow-y-auto">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-md transition-colors ${
                    tab === t.key
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {tab === "basica" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Informação Básica</h3>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">SKU *</Label>
                      <Input value={codigoCpl} onChange={(e) => setCodigoCpl(e.target.value)} className="bg-secondary/50 font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Nome do Produto *</Label>
                      <Input value={nome} onChange={(e) => setNome(e.target.value)} className="bg-secondary/50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Categorias</Label>
                      <Select value={categoria} onValueChange={setCategoria}>
                        <SelectTrigger className="bg-secondary/50">
                          <SelectValue placeholder="Por favor selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          {CATEGORIAS.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Código de Barras (EAN)</Label>
                      <Input value={ean} onChange={(e) => setEan(e.target.value)} placeholder="EAN, UPC, GTIN" className="bg-secondary/50 font-mono" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Código do Fornecedor (Apelido de SKU)</Label>
                    <Input value={codigoFornecedor} onChange={(e) => setCodigoFornecedor(e.target.value)} placeholder="SKU do Anúncio, código ML, FNSKU etc." className="bg-secondary/50" />
                  </div>

                  {/* Aplicações */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">🏍️ Aplicações (motos compatíveis)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={novaAplicacao}
                        onChange={(e) => setNovaAplicacao(e.target.value)}
                        placeholder="Ex: CG 150 TITAN 2004-2015"
                        className="bg-secondary/50 flex-1"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAplicacao())}
                      />
                      <Button type="button" size="sm" variant="outline" onClick={addAplicacao} className="gap-1">
                        <Plus className="h-3.5 w-3.5" /> Adicionar
                      </Button>
                    </div>
                    {aplicacoes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {aplicacoes.map((app, i) => (
                          <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1">
                            {app}
                            <button onClick={() => setAplicacoes(aplicacoes.filter((_, idx) => idx !== i))} className="hover:text-destructive ml-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === "venda" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Info. de Venda e Atributos</h3>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Custo de Compra (R$)</Label>
                      <Input value={precoCusto} onChange={(e) => setPrecoCusto(e.target.value)} type="number" step="0.01" className="bg-secondary/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Marca</Label>
                      <Input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ex: TRILHA, DANNIXX" className="bg-secondary/50" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Descrição</Label>
                    <Textarea
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      rows={5}
                      className="bg-secondary/50 resize-y"
                      placeholder="Descrição detalhada do produto..."
                    />
                    <p className="text-[10px] text-muted-foreground text-right">{descricao.length}/1000</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Fornecedor</Label>
                      <Input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} className="bg-secondary/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Peso do Pacote (g)</Label>
                      <Input value={peso} onChange={(e) => setPeso(e.target.value)} type="number" placeholder="Peso" className="bg-secondary/50" />
                    </div>
                  </div>
                </div>
              )}

              {tab === "midia" && (() => {
                const todasImagens = [imagemUrl, ...imagensAdicionais].filter(Boolean);
                const totalImagens = todasImagens.length;
                const fileInputRef = { current: null as HTMLInputElement | null };

                const handleUploadNew = (url: string) => {
                  if (!imagemUrl) {
                    setImagemUrl(url);
                  } else {
                    setImagensAdicionais(prev => [...prev, url]);
                  }
                };

                const handleRemoveImage = (index: number) => {
                  if (index === 0) {
                    if (imagensAdicionais.length > 0) {
                      setImagemUrl(imagensAdicionais[0]);
                      setImagensAdicionais(prev => prev.slice(1));
                    } else {
                      setImagemUrl("");
                    }
                  } else {
                    setImagensAdicionais(prev => prev.filter((_, i) => i !== index - 1));
                  }
                };

                const handleAddUrl = () => {
                  const url = novaImagemUrl.trim();
                  if (!url) return;
                  handleUploadNew(url);
                  setNovaImagemUrl("");
                };

                return (
                  <div className="space-y-5">
                    <h3 className="text-sm font-bold text-foreground">Mídia</h3>
                    <Separator />

                    {/* Header bar — Shopee style */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-foreground">Imagens do Anúncio<span className="text-destructive">*</span></span>

                        {/* Dropdown: + Adicionar Imagens */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 text-primary border-primary hover:bg-primary/5 h-8 text-xs font-medium">
                              <Plus className="h-3.5 w-3.5" /> Adicionar Imagens
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-popover border-border">
                            <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/jpeg,image/png,image/jpg";
                              input.multiple = true;
                              input.onchange = async (e) => {
                                const files = (e.target as HTMLInputElement).files;
                                if (!files) return;
                                for (const file of Array.from(files)) {
                                  if (totalImagens + Array.from(files).indexOf(file) >= 9) break;
                                  const ext = file.name.split(".").pop() || "jpg";
                                  const path = `${empresaId || 'unknown'}/${produtoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                                  const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
                                  if (!error) {
                                    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
                                    handleUploadNew(data.publicUrl);
                                  }
                                }
                                toast.success("Imagens adicionadas!");
                              };
                              input.click();
                            }}>
                              <Upload className="h-4 w-4" />
                              A Partir do Meu Computador
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => {
                              const url = prompt("Cole a URL da imagem:");
                              if (url?.trim()) handleUploadNew(url.trim());
                            }}>
                              <Link2 className="h-4 w-4" />
                              A Partir de Web (Link)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <span className="text-xs text-muted-foreground font-medium">({totalImagens}/9)</span>
                      </div>

                      {/* Right side action links */}
                      <div className="flex items-center gap-3 text-xs">
                        <button className="flex items-center gap-1 text-primary hover:underline">
                          <Crop className="h-3.5 w-3.5" /> Recortar em massa
                        </button>
                        <span className="text-border">|</span>
                        <button className="flex items-center gap-1 text-primary hover:underline">
                          <Download className="h-3.5 w-3.5" /> Exportar
                        </button>
                        <span className="text-border">|</span>
                        <button className="flex items-center gap-1 text-primary hover:underline">
                          <PenLine className="h-3.5 w-3.5" /> Editar Imagens
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground">ⓘ Carregue até 9 imagens, apenas para imagens JPG, JPEG, PNG, não mais que 2M e mínimo 800x800px</p>

                    {/* Image grid */}
                    <div className="flex items-start gap-3 flex-wrap">
                      {todasImagens.map((url, i) => (
                        <div key={i} className="relative group">
                          <div className={`h-[120px] w-[120px] rounded-lg overflow-hidden border-2 ${i === 0 ? "border-destructive" : "border-border"} bg-secondary/30`}>
                            <img src={url} alt={`Imagem ${i + 1}`} className="h-full w-full object-cover" />
                          </div>
                          {i === 0 && (
                            <span className="absolute top-1 left-1 bg-destructive text-destructive-foreground text-[8px] font-bold px-1.5 py-0.5 rounded">
                              Envio imediato
                            </span>
                          )}
                          <button
                            onClick={() => handleRemoveImage(i)}
                            className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {totalImagens < 9 && (
                        <div className="h-[120px] w-[120px] rounded-lg bg-secondary/50 flex flex-col items-center justify-center border-2 border-dashed border-border">
                          <Plus className="h-6 w-6 text-muted-foreground/50" />
                          <span className="text-[10px] text-muted-foreground mt-1">Adicionar</span>
                        </div>
                      )}
                    </div>

                    {/* Inline URL add */}
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Adicionar por URL</Label>
                        <Input
                          value={novaImagemUrl}
                          onChange={(e) => setNovaImagemUrl(e.target.value)}
                          placeholder="https://..."
                          className="bg-secondary/50 text-xs"
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUrl())}
                        />
                      </div>
                      <Button size="sm" variant="outline" onClick={handleAddUrl} disabled={!novaImagemUrl.trim() || totalImagens >= 9} className="gap-1">
                        <Plus className="h-3.5 w-3.5" /> Adicionar
                      </Button>
                    </div>

                    <Separator />

                     {/* Vídeo do Anúncio */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Vídeo do Anúncio*</span>
                          <label className="inline-flex items-center gap-1 px-3 py-1 border border-primary text-primary rounded cursor-pointer hover:bg-primary/10 transition-colors text-xs font-medium">
                            <Plus className="h-3.5 w-3.5" /> Adicionar Vídeo
                            <input
                              type="file"
                              accept="video/mp4"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 30 * 1024 * 1024) {
                                  toast.error("O vídeo deve ter no máximo 30 MB");
                                  return;
                                }
                                if (file.type !== "video/mp4") {
                                  toast.error("Apenas formato MP4 é aceito");
                                  return;
                                }
                                const url = URL.createObjectURL(file);
                                const videoEl = document.createElement("video");
                                videoEl.preload = "metadata";
                                videoEl.onloadedmetadata = () => {
                                  URL.revokeObjectURL(videoEl.src);
                                  if (videoEl.duration < 10 || videoEl.duration > 60) {
                                    toast.error("A duração do vídeo deve ser entre 10s e 60s");
                                    return;
                                  }
                                  if (videoEl.videoWidth > 1280 || videoEl.videoHeight > 1280) {
                                    toast.error("A resolução não deve exceder 1280 x 1280 px");
                                    return;
                                  }
                                  setVideoFile(file);
                                  setVideoPreviewUrl(URL.createObjectURL(file));
                                };
                                videoEl.src = url;
                              }}
                            />
                          </label>
                          <span className="text-xs text-muted-foreground font-medium">({videoFile ? "1" : "0"}/1)</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground">ⓘ Apenas formato MP4, máx 30 MB, resolução máx 1280x1280px, duração 10s~60s</p>

                      {videoPreviewUrl && (
                        <div className="flex items-start gap-4">
                          <div className="relative h-[120px] w-[120px] rounded-lg overflow-hidden border-2 border-border bg-black">
                            <video src={videoPreviewUrl} className="h-full w-full object-cover" muted />
                            <button
                              type="button"
                              onClick={() => { setVideoFile(null); setVideoPreviewUrl(null); }}
                              className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="absolute bottom-1 left-1">
                              <Badge className="text-[8px] bg-primary/80"><FileVideo className="h-2.5 w-2.5 mr-0.5" />MP4</Badge>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Link do Vídeo</Label>
                        <Input placeholder="https://youtube.com/..." className="bg-secondary/50 text-xs" />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {tab === "envio" && (
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-foreground">Envio</h3>
                   <Separator />

                  {(() => {
                    const pesoNum = parseFloat(pesoEnvio.replace(",", ".")) || 0;
                    const pesoGramas = Math.round(pesoNum * 1000);
                    const pesoInvalido = pesoNum < 0.001 || pesoNum > 30;
                    const largNum = parseFloat(dimLargura) || 0;
                    const compNum = parseFloat(dimComprimento) || 0;
                    const altNum = parseFloat(dimAltura) || 0;
                    const somaDim = largNum + compNum + altNum;
                    const dimInvalida = largNum > 120 || compNum > 120 || altNum > 120 || somaDim > 200;
                    const envioInvalido = pesoInvalido || dimInvalida;

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Label className="text-xs text-muted-foreground w-[140px] shrink-0">Configurações de Pacote</Label>
                          <Select defaultValue="anuncio">
                            <SelectTrigger className="bg-secondary/50 max-w-[260px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border z-50">
                              <SelectItem value="anuncio">Configurações por Anúncio</SelectItem>
                              <SelectItem value="variacao">Configurações por Variação</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Peso do Pacote */}
                        <div className="flex items-center gap-3">
                          <Label className="text-xs text-muted-foreground w-[140px] shrink-0">
                            Peso do Pacote<span className="text-destructive">*</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input value={pesoEnvio} onChange={(e) => setPesoEnvio(e.target.value)} className={`bg-secondary/50 w-[100px] text-sm ${pesoInvalido ? "border-destructive" : ""}`} />
                            <span className="text-xs text-muted-foreground bg-secondary/50 border border-border rounded px-2 py-1.5">kg</span>
                            <span className="text-xs text-muted-foreground">= {pesoGramas}g</span>
                          </div>
                        </div>
                        {pesoInvalido ? (
                          <p className="text-[11px] text-destructive ml-[152px]">O peso ou tamanho do método de envio selecionada excede o limite</p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground ml-[152px]">0.001-30kg <HelpCircle className="inline h-3 w-3 ml-0.5" /></p>
                        )}

                        {/* Tamanho da Embalagem */}
                        <div className="flex items-center gap-3">
                          <Label className="text-xs text-muted-foreground w-[140px] shrink-0">
                            Tamanho da Embalagem<span className="text-destructive ml-1">*</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input value={dimLargura} onChange={(e) => setDimLargura(e.target.value)} className="bg-secondary/50 w-[80px] text-sm" />
                            <span className="text-xs text-muted-foreground bg-secondary/50 border border-border rounded px-2 py-1.5">cm</span>
                            <Input value={dimComprimento} onChange={(e) => setDimComprimento(e.target.value)} className="bg-secondary/50 w-[80px] text-sm" />
                            <span className="text-xs text-muted-foreground bg-secondary/50 border border-border rounded px-2 py-1.5">cm</span>
                            <Input value={dimAltura} onChange={(e) => setDimAltura(e.target.value)} className="bg-secondary/50 w-[80px] text-sm" />
                            <span className="text-xs text-muted-foreground bg-secondary/50 border border-border rounded px-2 py-1.5">cm</span>
                          </div>
                        </div>
                        <div className="flex gap-16 ml-[152px]">
                          <span className="text-[11px] text-muted-foreground">≤120cm <HelpCircle className="inline h-3 w-3 ml-0.5" /></span>
                          <span className="text-[11px] text-muted-foreground">≤120cm <HelpCircle className="inline h-3 w-3 ml-0.5" /></span>
                          <span className="text-[11px] text-muted-foreground">≤120cm <HelpCircle className="inline h-3 w-3 ml-0.5" /></span>
                        </div>

                        <Separator />

                        {/* Envio - Métodos */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Label className="text-xs text-muted-foreground w-[140px] shrink-0">
                              Envio<span className="text-destructive">*</span>
                            </Label>
                            <div className="flex-1">
                              {/* Header */}
                              <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                                <div className="flex items-center gap-2">
                                  <Checkbox id="metodo-envio" defaultChecked />
                                  <label htmlFor="metodo-envio" className="text-xs font-medium text-foreground">Método de Envio</label>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <div className="flex items-center gap-6">
                                  <span className="text-xs font-medium text-foreground">Taxa de Envio</span>
                                  <div className="flex items-center gap-1.5">
                                    <Checkbox id="selecionar-todos" />
                                    <label htmlFor="selecionar-todos" className="text-xs text-muted-foreground">Selecionar Todos</label>
                                  </div>
                                </div>
                              </div>

                              {/* Shopee Xpress */}
                              <div className="flex items-center justify-between py-3 border-b border-border/50">
                                <div className="flex items-start gap-2">
                                  <Checkbox id="shopee-xpress" defaultChecked className="mt-0.5" />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <label htmlFor="shopee-xpress" className="text-xs font-medium text-foreground">Shopee Xpress</label>
                                      {envioInvalido && (
                                        <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0">Peso Inválido</Badge>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      Peso: 0.001-30kg;<br />
                                      Largura≤120cm, Comprimento≤120cm, Altura≤120cm;<br />
                                      Soma da Dimensão: 200cm;
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-xs text-muted-foreground">Taxa Estimada da Shopee</span>
                                  <div className="flex items-center gap-1.5">
                                    <Checkbox id="envio-gratis-shopee" />
                                    <label htmlFor="envio-gratis-shopee" className="text-xs text-muted-foreground">Envio Grátis</label>
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                </div>
                              </div>

                              {/* Retirada pelo Comprador */}
                              <div className="flex items-center justify-between py-3">
                                <div className="flex items-start gap-2">
                                  <Checkbox id="retirada" defaultChecked className="mt-0.5" />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <label htmlFor="retirada" className="text-xs font-medium text-foreground">Retirada pelo Comprador</label>
                                      {envioInvalido && (
                                        <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0">Peso Inválido</Badge>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      Peso: 0.001-30kg;<br />
                                      Largura≤120cm, Comprimento≤120cm, Altura≤120cm;<br />
                                      Soma da Dimensão: 200cm;
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-xs text-muted-foreground">Taxa Estimada da Shopee</span>
                                  <div className="flex items-center gap-1.5">
                                    <Checkbox id="envio-gratis-retirada" />
                                    <label htmlFor="envio-gratis-retirada" className="text-xs text-muted-foreground">Envio Grátis</label>
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {tab === "impostos" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Informação da Taxação</h3>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">NCM</Label>
                      <Input value={ncm} onChange={(e) => setNcm(e.target.value)} className="bg-secondary/50 font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">CEST</Label>
                      <Input value={cest} onChange={(e) => setCest(e.target.value)} className="bg-secondary/50 font-mono" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Unidade</Label>
                      <Select value={unidade} onValueChange={setUnidade}>
                        <SelectTrigger className="bg-secondary/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          {UNIDADES.map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Origem</Label>
                      <Select value={origem} onValueChange={setOrigem}>
                        <SelectTrigger className="bg-secondary/50 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          {ORIGENS.map((o) => (
                            <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {tab === "estoque" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Detalhes do Estoque</h3>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Quantidade em Estoque</Label>
                      <Input value={estoqueQuantidade} onChange={(e) => setEstoqueQuantidade(e.target.value)} type="number" className="bg-secondary/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Estoque Mínimo</Label>
                      <Input value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} type="number" className="bg-secondary/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Localização</Label>
                      <Input value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} placeholder="Ex: Prateleira A3" className="bg-secondary/50" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="px-6 py-3 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
