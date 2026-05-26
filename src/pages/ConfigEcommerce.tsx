import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Store, Image, Phone, MapPin, Share2, Percent, Gift, Save, Loader2, Trash2, Plus, ArrowLeft,
  Instagram, Facebook, Youtube, MessageCircle, Mail, Clock, Globe, Check, X, Settings, ExternalLink, Rocket,
  Layers, ChevronUp, ChevronDown, Eye, EyeOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Link, Navigate } from "react-router-dom";
import { usePlano } from "@/contexts/PlanoContext";
import { EcommerceSetupWizard } from "@/components/EcommerceSetupWizard";
import { SpinWheelPopup } from "@/components/SpinWheelPopup";
import { Play } from "lucide-react";

interface EcommerceConfig {
  logo_url: string;
  banners: { url: string; link: string; titulo: string }[];
  banners_centrais: { url: string; link: string; titulo: string }[];
  telefone: string;
  telefone_secundario: string;
  whatsapp: string;
  email: string;
  horario: string;
  endereco: string;
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  site: string;
  roleta_ativa: boolean;
  roleta_opcoes: { label: string; valor: number; tipo: "desconto" | "produto" }[];
  pix_desconto: number;
  max_parcelas: number;
  nome_loja: string;
  cor_primaria: string;
  texto_banner_hero: string;
  subtitulo_hero: string;
  institucional: { titulo: string; conteudo: string; visivel: boolean }[];
  subdominio: string;
  dominio_proprio: string;
  emails_contato: string[];
  categorias_ocultas: string[];
  categorias_extras: string[];
  categorias_ordem: string[];
}

const DEFAULT_CONFIG: EcommerceConfig = {
  logo_url: "",
  banners: [],
  banners_centrais: [],
  telefone: "",
  telefone_secundario: "",
  whatsapp: "",
  email: "",
  horario: "",
  endereco: "",
  instagram: "",
  facebook: "",
  youtube: "",
  tiktok: "",
  site: "",
  roleta_ativa: false,
  roleta_opcoes: [
    { label: "5% OFF", valor: 5, tipo: "desconto" },
    { label: "10% OFF", valor: 10, tipo: "desconto" },
    { label: "15% OFF", valor: 15, tipo: "desconto" },
    { label: "25% OFF", valor: 25, tipo: "desconto" },
    { label: "30% OFF", valor: 30, tipo: "desconto" },
    { label: "50% OFF", valor: 50, tipo: "desconto" },
  ],
  pix_desconto: 3,
  max_parcelas: 10,
  nome_loja: "",
  cor_primaria: "",
  texto_banner_hero: "ENCONTRE AQUI\nPEÇAS & ACESSÓRIOS\nPARA SUA MOTO",
  subtitulo_hero: "Qualidade, preço justo e entrega para todo o Brasil.",
  institucional: [
    { titulo: "Política de Troca e Devolução", conteudo: "", visivel: true },
    { titulo: "Política de Privacidade", conteudo: "", visivel: true },
    { titulo: "Pagamento e Envio", conteudo: "", visivel: true },
    { titulo: "Como Comprar", conteudo: "", visivel: true },
  ],
  subdominio: "",
  dominio_proprio: "",
  emails_contato: [""],
  categorias_ocultas: [],
  categorias_extras: [],
  categorias_ordem: [],
};

const STORAGE_KEY = "ecommerce_config";

export default function ConfigEcommerce() {
  const plano = usePlano();
  const { empresaId } = useEmpresa();
  const [config, setConfig] = useState<EcommerceConfig>(DEFAULT_CONFIG);
  const [salvando, setSalvando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [activeTab, setActiveTab] = useState<"geral" | "configuracoes" | "banners" | "banners_centrais" | "contato" | "redes" | "institucional" | "roleta" | "precos" | "categorias">("geral");
  const [categoriasDetectadas, setCategoriasDetectadas] = useState<string[]>([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [testRoletaOpen, setTestRoletaOpen] = useState(false);

  useEffect(() => {
    if (!empresaId) return;
    supabase.rpc("ecommerce_categorias", { p_empresa_id: empresaId }).then(({ data }) => {
      const cats = ((data as any[]) || []).map((d: any) => d.categoria).filter(Boolean) as string[];
      setCategoriasDetectadas(cats);
    });
  }, [empresaId]);


  useEffect(() => {
    const loadConfig = async () => {
      // Try DB first
      if (empresaId) {
        const { data } = await supabase
          .from("ecommerce_config")
          .select("config")
          .eq("empresa_id", empresaId)
          .maybeSingle();
        if (data?.config) {
          const dbConfig = typeof data.config === "string" ? JSON.parse(data.config) : data.config;
          setConfig({ ...DEFAULT_CONFIG, ...dbConfig });
          return;
        }
      }
      // Fallback to localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
        } catch { /* ignore */ }
      }
    };
    loadConfig();
  }, [empresaId]);

  // Load slug from empresa
  useEffect(() => {
    if (!empresaId) return;
    supabase
      .from("empresas" as any)
      .select("slug")
      .eq("id", empresaId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.slug && !config.subdominio) {
          setConfig(prev => ({ ...prev, subdominio: data.slug }));
          setSlugStatus("available");
        }
      });
  }, [empresaId]);

  const checkSlug = async (slug: string) => {
    if (!slug || slug.length < 3) { setSlugStatus("idle"); return; }
    setSlugStatus("checking");
    const { data } = await supabase
      .from("empresas" as any)
      .select("id")
      .eq("slug", slug)
      .neq("id", empresaId || "")
      .maybeSingle();
    setSlugStatus(data ? "taken" : "available");
  };

  const addEmailContato = () => {
    if (config.emails_contato.length >= 5) {
      toast.error("Máximo de 5 e-mails");
      return;
    }
    update("emails_contato", [...config.emails_contato, ""]);
  };

  const updateEmailContato = (idx: number, value: string) => {
    const updated = [...config.emails_contato];
    updated[idx] = value;
    update("emails_contato", updated);
  };

  const removeEmailContato = (idx: number) => {
    update("emails_contato", config.emails_contato.filter((_, i) => i !== idx));
  };

  if (plano !== "platina") {
    return <Navigate to="/" replace />;
  }

  const salvarConfig = async (configToSave: EcommerceConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
    if (empresaId) {
      const { error } = await supabase
        .from("ecommerce_config")
        .upsert(
          { empresa_id: empresaId, config: configToSave as any, updated_at: new Date().toISOString() },
          { onConflict: "empresa_id" }
        );
      if (error) throw error;

      if (configToSave.subdominio && slugStatus === "available") {
        await supabase
          .from("empresas" as any)
          .update({ slug: configToSave.subdominio } as any)
          .eq("id", empresaId);
      }
    }
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      await salvarConfig(config);
      toast.success("Configurações do E-commerce salvas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar config:", err);
      toast.error("Erro ao salvar: " + (err?.message || "Tente novamente"));
    } finally {
      setSalvando(false);
    }
  };

  const publicarVitrine = async () => {
    if (!config.subdominio || slugStatus !== "available") {
      toast.error("Defina um subdomínio válido antes de publicar.");
      return;
    }
    setPublicando(true);
    try {
      const configPublicada = { ...config, publicada: true };
      await salvarConfig(configPublicada);
      setConfig(configPublicada);
      const url = `https://${config.subdominio}.ottotechsistemas.com.br`;
      toast.success(`Vitrine publicada com sucesso! Acesse: ${url}`, { duration: 8000 });
    } catch (err: any) {
      console.error("Erro ao publicar:", err);
      toast.error("Erro ao publicar: " + (err?.message || "Tente novamente"));
    } finally {
      setPublicando(false);
    }
  };

  const isPublicada = !!(config as any).publicada;

  const update = <K extends keyof EcommerceConfig>(key: K, value: EcommerceConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const addBanner = () => {
    if (config.banners.length >= 5) {
      toast.error("Máximo de 5 banners permitidos");
      return;
    }
    update("banners", [...config.banners, { url: "", link: "", titulo: "" }]);
  };

  const updateBanner = (idx: number, field: string, value: string) => {
    const updated = [...config.banners];
    updated[idx] = { ...updated[idx], [field]: value };
    update("banners", updated);
  };

  const removeBanner = (idx: number) => {
    update("banners", config.banners.filter((_, i) => i !== idx));
  };

  const addBannerCentral = () => {
    if (config.banners_centrais.length >= 4) {
      toast.error("Máximo de 4 banners centrais");
      return;
    }
    update("banners_centrais", [...config.banners_centrais, { url: "", link: "", titulo: "" }]);
  };

  const updateBannerCentral = (idx: number, field: string, value: string) => {
    const updated = [...config.banners_centrais];
    updated[idx] = { ...updated[idx], [field]: value };
    update("banners_centrais", updated);
  };

  const removeBannerCentral = (idx: number) => {
    update("banners_centrais", config.banners_centrais.filter((_, i) => i !== idx));
  };

  const addRoletaOpcao = () => {
    if (config.roleta_opcoes.length >= 8) {
      toast.error("Máximo de 8 opções na roleta");
      return;
    }
    update("roleta_opcoes", [...config.roleta_opcoes, { label: "Novo Prêmio", valor: 0, tipo: "desconto" }]);
  };

  const updateRoletaOpcao = (idx: number, field: string, value: any) => {
    const updated = [...config.roleta_opcoes];
    updated[idx] = { ...updated[idx], [field]: value };
    update("roleta_opcoes", updated);
  };

  const removeRoletaOpcao = (idx: number) => {
    update("roleta_opcoes", config.roleta_opcoes.filter((_, i) => i !== idx));
  };

  const tabs = [
    { key: "geral" as const, label: "Geral", icon: Store },
    { key: "configuracoes" as const, label: "Configurações", icon: Settings },
    { key: "banners" as const, label: "Banners Topo", icon: Image },
    { key: "banners_centrais" as const, label: "Banners Centrais", icon: Image },
    { key: "contato" as const, label: "Contato & Endereço", icon: Phone },
    { key: "redes" as const, label: "Redes Sociais", icon: Share2 },
    { key: "institucional" as const, label: "Institucional", icon: Globe },
    { key: "roleta" as const, label: "Roleta de Prêmios", icon: Gift },
    { key: "precos" as const, label: "Preços & Descontos", icon: Percent },
    { key: "categorias" as const, label: "Categorias do Menu", icon: Layers },
  ];

  const handleWizardComplete = (wizardData: any) => {
    setConfig(prev => ({
      ...prev,
      nome_loja: wizardData.nome_loja || prev.nome_loja,
      logo_url: wizardData.logo_url || prev.logo_url,
      cor_primaria: wizardData.cor_primaria || prev.cor_primaria,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...config,
      nome_loja: wizardData.nome_loja || config.nome_loja,
      logo_url: wizardData.logo_url || config.logo_url,
      cor_primaria: wizardData.cor_primaria || config.cor_primaria,
    }));
    localStorage.setItem("ecommerce_wizard_data", JSON.stringify(wizardData));
    toast.success("Configurações iniciais aplicadas! 🎉");
  };

  return (
    <div className="space-y-6">
      <EcommerceSetupWizard onComplete={handleWizardComplete} />
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/ecommerce">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Configurações do E-commerce</h1>
          <p className="text-sm text-muted-foreground">Personalize a página da sua loja online</p>
        </div>
        <Button className="ml-auto gradient-primary text-primary-foreground" onClick={salvar} disabled={salvando}>
          {salvando ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</> : <><Save className="h-4 w-4 mr-2" /> Salvar Tudo</>}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-auto border-b border-border pb-px">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-primary/10 text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl">
        {/* ===== GERAL ===== */}
        {activeTab === "geral" && (
          <div className="space-y-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Store className="h-4 w-4 text-primary" />
                  Identidade da Loja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome da Loja</Label>
                    <Input value={config.nome_loja} onChange={e => update("nome_loja", e.target.value)} placeholder="Nome da sua loja" className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo (canto superior esquerdo)</Label>
                    <Input value={config.logo_url} onChange={e => update("logo_url", e.target.value)} placeholder="https://... ou cole a URL da imagem" className="bg-secondary/50" />
                    <Input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.pdf"
                      className="bg-secondary/50 text-sm cursor-pointer file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB."); return; }
                        const reader = new FileReader();
                        reader.onload = () => { if (reader.result) update("logo_url", reader.result as string); };
                        reader.readAsDataURL(file);
                      }}
                    />
                    {config.logo_url && (
                      <div className="relative h-16 w-40 bg-foreground rounded-lg flex items-center justify-center p-2 group">
                        <img src={config.logo_url} alt="Logo" className="h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => update("logo_url", "")}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover logo"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Texto Principal do Banner Hero</Label>
                  <Textarea value={config.texto_banner_hero} onChange={e => update("texto_banner_hero", e.target.value)} rows={3} placeholder="ENCONTRE AQUI..." className="bg-secondary/50 font-mono text-sm" />
                  <p className="text-[10px] text-muted-foreground">Use \n para quebra de linha. A segunda linha ficará em destaque (cor primária).</p>
                </div>

                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input value={config.subtitulo_hero} onChange={e => update("subtitulo_hero", e.target.value)} placeholder="Qualidade, preço justo..." className="bg-secondary/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== CONFIGURAÇÕES ===== */}
        {activeTab === "configuracoes" && (
          <div className="space-y-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4 text-primary" />
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-medium">Subdomínio *</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={config.subdominio}
                        onChange={e => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                          update("subdominio", val);
                          checkSlug(val);
                        }}
                        placeholder="minha-loja"
                        className="bg-secondary/50 pr-10 font-mono"
                      />
                      {slugStatus === "available" && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {slugStatus === "taken" && (
                        <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">.ottotechsistemas.com.br</span>
                  </div>
                  {slugStatus === "checking" && <p className="text-xs text-yellow-500">⏳ Verificando disponibilidade...</p>}
                  {slugStatus === "available" && config.subdominio && (
                     <div className="space-y-2">
                       <div className="flex items-center gap-2">
                         <p className="text-xs text-green-500">✅ Seu site ficará acessível em <strong>{config.subdominio}.ottotechsistemas.com.br</strong></p>
                         {isPublicada && (
                           <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/15 text-green-600 border border-green-500/30">
                             <Check className="h-3 w-3" /> Publicada
                           </span>
                         )}
                       </div>
                       <div className="flex items-center gap-2">
                         <Button
                           type="button"
                           size="sm"
                           onClick={publicarVitrine}
                           disabled={publicando}
                           className="h-8 text-xs gap-1.5"
                         >
                           {publicando ? (
                             <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publicando...</>
                           ) : isPublicada ? (
                             <><Rocket className="h-3.5 w-3.5" /> Atualizar Vitrine</>
                           ) : (
                             <><Rocket className="h-3.5 w-3.5" /> Publicar Vitrine</>
                           )}
                         </Button>
                         {isPublicada && (
                           <Button
                             type="button"
                             size="sm"
                             variant="outline"
                             className="h-8 text-xs gap-1"
                             onClick={() => window.open(`https://${config.subdominio}.ottotechsistemas.com.br`, '_blank')}
                           >
                             <ExternalLink className="h-3 w-3" />
                             Visitar Loja
                           </Button>
                         )}
                       </div>
                     </div>
                   )}
                  {slugStatus === "taken" && <p className="text-xs text-destructive">❌ Já está em uso. Tente outro.</p>}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="font-medium">Domínio próprio (opcional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={config.dominio_proprio}
                      onChange={e => update("dominio_proprio", e.target.value)}
                      placeholder="minhaloja.com.br"
                      className="bg-secondary/50 flex-1"
                    />
                    <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => {
                      if (!config.dominio_proprio) {
                        toast.error("Digite um domínio primeiro");
                        return;
                      }
                      toast.info(`Aponte o DNS (tipo A) para 76.223.92.75 para ativar o domínio ${config.dominio_proprio}`);
                    }}>
                      <Globe className="h-4 w-4 mr-1" /> Verificar
                    </Button>
                  </div>
                  {config.dominio_proprio && (
                    <p className="text-xs text-muted-foreground">
                      ⚠ Nenhum registro A encontrado para <strong>{config.dominio_proprio}</strong>. Aponte o DNS (tipo A) para <strong>76.223.92.75</strong>.
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mails de contato
                  </Label>
                  <p className="text-xs text-muted-foreground">E-mails que receberão as mensagens do formulário de contato e orçamentos (máximo 5)</p>
                  {config.emails_contato.map((email, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={email}
                        onChange={e => updateEmailContato(idx, e.target.value)}
                        placeholder="email@suaempresa.com"
                        type="email"
                        className="bg-secondary/50 flex-1"
                      />
                      {config.emails_contato.length > 1 && (
                        <Button variant="destructive" size="icon" className="shrink-0 h-9 w-9" onClick={() => removeEmailContato(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {config.emails_contato.length < 5 && (
                    <Button variant="outline" size="sm" onClick={addEmailContato}>
                      <Plus className="h-4 w-4 mr-1" /> Adicionar e-mail
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== BANNERS ===== */}
        {activeTab === "banners" && (
          <div className="space-y-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-primary" />
                    Banners Rotativos (até 5)
                  </span>
                  <Button size="sm" onClick={addBanner} disabled={config.banners.length >= 5}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground flex items-center gap-2">
                  <Image className="h-4 w-4 shrink-0" />
                  <span>Tamanho padrão recomendado: <strong>1306 × 400 px</strong>. Cole a URL da imagem (PNG, JPG, WebP) ou link de PDF. Imagens fora desse tamanho serão ajustadas automaticamente via <code>object-cover</code>.</span>
                </div>

                {config.banners.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum banner cadastrado. Os banners aparecem no topo da loja, como um carrossel.
                  </p>
                )}

                {config.banners.map((banner, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4 space-y-3 bg-secondary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">Banner {idx + 1}</span>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeBanner(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">URL da Imagem</Label>
                        <Input value={banner.url} onChange={e => updateBanner(idx, "url", e.target.value)} placeholder="https://..." className="bg-background text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Ou anexar arquivo (PDF, PNG, JPG)</Label>
                        <Input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          className="bg-background text-sm cursor-pointer file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("Arquivo muito grande. Máximo 5MB.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (reader.result) updateBanner(idx, "url", reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Link (ao clicar)</Label>
                        <Input value={banner.link} onChange={e => updateBanner(idx, "link", e.target.value)} placeholder="https://... ou /categoria" className="bg-background text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Título / Texto Alternativo</Label>
                        <Input value={banner.titulo} onChange={e => updateBanner(idx, "titulo", e.target.value)} placeholder="Promoção de Capacetes" className="bg-background text-sm" />
                      </div>
                    </div>
                    {banner.url && (
                      <div className="rounded-lg overflow-hidden border border-border" style={{ aspectRatio: "1306/400" }}>
                        {banner.url.toLowerCase().endsWith(".pdf") ? (
                          <iframe src={banner.url} className="w-full h-full" title={banner.titulo || "Banner PDF"} />
                        ) : (
                          <img src={banner.url} alt={banner.titulo || "Preview"} className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== BANNERS CENTRAIS ===== */}
        {activeTab === "banners_centrais" && (
          <div className="space-y-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-primary" />
                    Banners Centrais entre Vitrines (até 4)
                  </span>
                  <Button size="sm" onClick={addBannerCentral} disabled={config.banners_centrais.length >= 4}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground flex items-center gap-2">
                  <Image className="h-4 w-4 shrink-0" />
                  <span>Esses banners aparecem <strong>entre os produtos</strong> na vitrine. Tamanho recomendado: <strong>345 × 560 px</strong>. Serão exibidos lado a lado (2 por linha no desktop).</span>
                </div>

                {config.banners_centrais.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum banner central cadastrado. Eles aparecem entre os produtos da vitrine.
                  </p>
                )}

                {config.banners_centrais.map((banner, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4 space-y-3 bg-secondary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">Banner Central {idx + 1}</span>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeBannerCentral(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">URL da Imagem</Label>
                        <Input value={banner.url} onChange={e => updateBannerCentral(idx, "url", e.target.value)} placeholder="https://..." className="bg-background text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Ou anexar arquivo (PDF, PNG, JPG)</Label>
                        <Input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          className="bg-background text-sm cursor-pointer file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) { toast.error("Arquivo muito grande. Máximo 5MB."); return; }
                            const reader = new FileReader();
                            reader.onload = () => { if (reader.result) updateBannerCentral(idx, "url", reader.result as string); };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Link (ao clicar)</Label>
                        <Input value={banner.link} onChange={e => updateBannerCentral(idx, "link", e.target.value)} placeholder="https://... ou /categoria" className="bg-background text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Título / Texto Alternativo</Label>
                        <Input value={banner.titulo} onChange={e => updateBannerCentral(idx, "titulo", e.target.value)} placeholder="Linha de Vestidos" className="bg-background text-sm" />
                      </div>
                    </div>
                    {banner.url && (
                      <div className="rounded-lg overflow-hidden border border-border" style={{ aspectRatio: "640/300" }}>
                        {banner.url.toLowerCase().endsWith(".pdf") ? (
                          <iframe src={banner.url} className="w-full h-full" title={banner.titulo || "Banner Central PDF"} />
                        ) : (
                          <img src={banner.url} alt={banner.titulo || "Preview"} className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== CONTATO & ENDEREÇO ===== */}
        {activeTab === "contato" && (
          <div className="space-y-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-4 w-4 text-primary" />
                  Central de Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> Telefone Principal</Label>
                    <Input value={config.telefone} onChange={e => update("telefone", e.target.value)} placeholder="(11) 99999-9999" className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> Telefone Secundário</Label>
                    <Input value={config.telefone_secundario} onChange={e => update("telefone_secundario", e.target.value)} placeholder="(11) 99999-9999" className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> WhatsApp</Label>
                    <Input value={config.whatsapp} onChange={e => update("whatsapp", e.target.value)} placeholder="(11) 99999-9999" className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> E-mail</Label>
                    <Input value={config.email} onChange={e => update("email", e.target.value)} placeholder="contato@loja.com" className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Horário de Funcionamento</Label>
                    <Input value={config.horario} onChange={e => update("horario", e.target.value)} placeholder="Seg a Sex: 8h às 18h" className="bg-secondary/50" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Endereço Completo</Label>
                  <Textarea value={config.endereco} onChange={e => update("endereco", e.target.value)} placeholder="Rua..., Nº... – Cidade/UF" className="bg-secondary/50" rows={2} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== INSTITUCIONAL ===== */}
        {activeTab === "institucional" && (
          <div className="space-y-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Links Institucionais (Rodapé)
                  </span>
                  <Button size="sm" onClick={() => {
                    const items = config.institucional || [];
                    if (items.length >= 8) { toast.error("Máximo de 8 links"); return; }
                    update("institucional", [...items, { titulo: "", conteudo: "", visivel: true }]);
                  }}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Preencha o título e o conteúdo de cada página institucional. Elas aparecem no rodapé da loja.
                </p>

                {(!config.institucional || config.institucional.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum link institucional cadastrado.
                  </p>
                )}

                {(config.institucional || []).map((item, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4 space-y-3 bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={item.visivel}
                        onCheckedChange={checked => {
                          const updated = [...config.institucional];
                          updated[idx] = { ...updated[idx], visivel: checked };
                          update("institucional", updated);
                        }}
                      />
                      <Input
                        value={item.titulo}
                        onChange={e => {
                          const updated = [...config.institucional];
                          updated[idx] = { ...updated[idx], titulo: e.target.value };
                          update("institucional", updated);
                        }}
                        placeholder="Ex: Política de Troca e Devolução"
                        className="bg-background text-sm flex-1"
                      />
                      <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => {
                        update("institucional", config.institucional.filter((_, i) => i !== idx));
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={item.conteudo || ""}
                      onChange={e => {
                        const updated = [...config.institucional];
                        updated[idx] = { ...updated[idx], conteudo: e.target.value };
                        update("institucional", updated);
                      }}
                      placeholder="Escreva aqui o conteúdo desta página institucional..."
                      className="bg-background text-sm min-h-[100px]"
                      rows={4}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "redes" && (
          <div className="space-y-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Share2 className="h-4 w-4 text-primary" />
                  Redes Sociais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">Os links aparecerão no rodapé da loja. Deixe em branco para ocultar.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Instagram className="h-3 w-3" /> Instagram</Label>
                    <Input value={config.instagram} onChange={e => update("instagram", e.target.value)} placeholder="https://instagram.com/sualoja" className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Facebook className="h-3 w-3" /> Facebook</Label>
                    <Input value={config.facebook} onChange={e => update("facebook", e.target.value)} placeholder="https://facebook.com/sualoja" className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Youtube className="h-3 w-3" /> YouTube</Label>
                    <Input value={config.youtube} onChange={e => update("youtube", e.target.value)} placeholder="https://youtube.com/@sualoja" className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /> TikTok</Label>
                    <Input value={config.tiktok} onChange={e => update("tiktok", e.target.value)} placeholder="https://tiktok.com/@sualoja" className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /> Website</Label>
                    <Input value={config.site} onChange={e => update("site", e.target.value)} placeholder="https://sualoja.com.br" className="bg-secondary/50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== ROLETA DE PRÊMIOS ===== */}
        {activeTab === "roleta" && (
          <div className="space-y-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    Roleta de Prêmios / Cupons
                  </span>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Ativar Roleta</Label>
                    <Switch checked={config.roleta_ativa} onCheckedChange={v => update("roleta_ativa", v)} />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Quando ativa, a roleta aparecerá como popup para novos visitantes. O cliente gira a roleta e ganha um cupom de desconto ou produto especial.
                </p>

                {!config.roleta_ativa && (
                  <div className="bg-muted/50 rounded-lg p-6 text-center text-sm text-muted-foreground">
                    A roleta está desativada. Ative o switch acima para configurar os prêmios.
                  </div>
                )}

                {config.roleta_ativa && (
                  <>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm font-medium">Opções da Roleta ({config.roleta_opcoes.length}/8)</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setTestRoletaOpen(true)}
                          disabled={config.roleta_opcoes.length < 2}
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black"
                        >
                          <Play className="h-4 w-4 mr-1" /> Testar Roleta
                        </Button>
                        <Button size="sm" variant="outline" onClick={addRoletaOpcao} disabled={config.roleta_opcoes.length >= 8}>
                          <Plus className="h-4 w-4 mr-1" /> Adicionar Opção
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {config.roleta_opcoes.map((opcao, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-secondary/20">
                          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1 grid gap-2 md:grid-cols-3">
                            <Input
                              value={opcao.label}
                              onChange={e => updateRoletaOpcao(idx, "label", e.target.value)}
                              placeholder="Nome do prêmio"
                              className="bg-background text-sm"
                            />
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                value={opcao.valor}
                                onChange={e => updateRoletaOpcao(idx, "valor", Number(e.target.value))}
                                placeholder="Valor"
                                className="bg-background text-sm"
                              />
                              <select
                                value={opcao.tipo}
                                onChange={e => updateRoletaOpcao(idx, "tipo", e.target.value)}
                                className="rounded-md border border-input bg-background px-2 text-sm"
                              >
                                <option value="desconto">% Desconto</option>
                                <option value="produto">Produto</option>
                              </select>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => removeRoletaOpcao(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Preview da roleta */}
                    <div className="mt-4 p-6 bg-foreground rounded-xl text-center">
                      <div className="relative w-48 h-48 mx-auto">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                          {config.roleta_opcoes.map((opcao, idx) => {
                            const total = config.roleta_opcoes.length;
                            const angle = 360 / total;
                            const startAngle = idx * angle - 90;
                            const endAngle = startAngle + angle;
                            const startRad = (startAngle * Math.PI) / 180;
                            const endRad = (endAngle * Math.PI) / 180;
                            const x1 = 100 + 90 * Math.cos(startRad);
                            const y1 = 100 + 90 * Math.sin(startRad);
                            const x2 = 100 + 90 * Math.cos(endRad);
                            const y2 = 100 + 90 * Math.sin(endRad);
                            const largeArc = angle > 180 ? 1 : 0;
                            const colors = ["hsl(142,70%,45%)", "hsl(0,0%,20%)", "hsl(142,70%,45%)", "hsl(0,0%,20%)", "hsl(142,70%,45%)", "hsl(0,0%,20%)", "hsl(142,70%,45%)", "hsl(0,0%,20%)"];
                            return (
                              <g key={idx}>
                                <path
                                  d={`M100,100 L${x1},${y1} A90,90 0 ${largeArc},1 ${x2},${y2} Z`}
                                  fill={colors[idx % colors.length]}
                                  stroke="hsl(0,0%,15%)"
                                  strokeWidth="1"
                                />
                                <text
                                  x={100 + 55 * Math.cos(((startAngle + angle / 2) * Math.PI) / 180)}
                                  y={100 + 55 * Math.sin(((startAngle + angle / 2) * Math.PI) / 180)}
                                  fill="white"
                                  fontSize="8"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  transform={`rotate(${startAngle + angle / 2 + 90}, ${100 + 55 * Math.cos(((startAngle + angle / 2) * Math.PI) / 180)}, ${100 + 55 * Math.sin(((startAngle + angle / 2) * Math.PI) / 180)})`}
                                >
                                  {opcao.label}
                                </text>
                              </g>
                            );
                          })}
                          <circle cx="100" cy="100" r="15" fill="hsl(0,0%,25%)" stroke="hsl(0,0%,15%)" strokeWidth="2" />
                          <text x="100" y="102" fill="white" fontSize="10" textAnchor="middle" dominantBaseline="middle">🎁</text>
                        </svg>
                        {/* Pointer */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-4 h-6 flex justify-center">
                          <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[16px] border-l-transparent border-r-transparent border-t-destructive" />
                        </div>
                      </div>
                      <p className="text-white text-xs mt-3 opacity-60">Preview da roleta</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== PREÇOS & DESCONTOS ===== */}
        {activeTab === "precos" && (
          <div className="space-y-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Percent className="h-4 w-4 text-primary" />
                  Preços & Descontos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Desconto no PIX (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        max={50}
                        value={config.pix_desconto}
                        onChange={e => update("pix_desconto", Number(e.target.value))}
                        className="bg-secondary/50 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Desconto aplicado automaticamente quando o cliente escolhe pagamento via PIX.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Máximo de Parcelas (cartão)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        max={24}
                        value={config.max_parcelas}
                        onChange={e => update("max_parcelas", Number(e.target.value))}
                        className="bg-secondary/50 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">x</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Quantidade máxima de parcelas sem juros oferecidas.</p>
                  </div>
                </div>

                <Separator />

                {/* Preview das condições */}
                <div className="bg-foreground rounded-xl p-6 text-white">
                  <p className="text-xs text-white/50 mb-3 uppercase tracking-wide font-bold">Preview das condições exibidas na loja:</p>
                  <div className="flex items-center gap-3">
                    <span className="bg-primary/20 text-primary border border-primary/30 text-xs font-bold px-3 py-1.5 rounded-full">
                      {config.pix_desconto}% OFF NO PIX
                    </span>
                    <span className="bg-white/10 text-white border border-white/20 text-xs px-3 py-1.5 rounded-full">
                      ATÉ {config.max_parcelas}X SEM JUROS
                    </span>
                  </div>
                  <div className="mt-4 text-sm">
                    <p className="text-white/70">Exemplo: Produto de R$ 100,00</p>
                    <p className="text-primary font-bold text-lg mt-1">
                      R$ {(100 * (1 - config.pix_desconto / 100)).toFixed(2).replace(".", ",")} <span className="text-xs font-normal text-primary/70">no PIX</span>
                    </p>
                    <p className="text-white/50 text-xs mt-0.5">
                      ou {config.max_parcelas}x de R$ {(100 / config.max_parcelas).toFixed(2).replace(".", ",")} sem juros
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== CATEGORIAS DO MENU ===== */}
        {activeTab === "categorias" && (() => {
          const todasCategorias = Array.from(new Set([...categoriasDetectadas, ...config.categorias_extras]));
          const ordemAtual = config.categorias_ordem.length > 0
            ? [...config.categorias_ordem.filter(c => todasCategorias.includes(c)), ...todasCategorias.filter(c => !config.categorias_ordem.includes(c))]
            : todasCategorias;

          const toggleOculta = (cat: string) => {
            const oculta = config.categorias_ocultas.includes(cat);
            update("categorias_ocultas", oculta
              ? config.categorias_ocultas.filter(c => c !== cat)
              : [...config.categorias_ocultas, cat]);
          };
          const removerExtra = (cat: string) => {
            update("categorias_extras", config.categorias_extras.filter(c => c !== cat));
            update("categorias_ordem", config.categorias_ordem.filter(c => c !== cat));
            update("categorias_ocultas", config.categorias_ocultas.filter(c => c !== cat));
          };
          const adicionarExtra = () => {
            const nome = novaCategoria.trim().toUpperCase();
            if (!nome) { toast.error("Digite o nome da categoria"); return; }
            if (todasCategorias.includes(nome)) { toast.error("Essa categoria já existe"); return; }
            update("categorias_extras", [...config.categorias_extras, nome]);
            setNovaCategoria("");
          };
          const mover = (cat: string, dir: -1 | 1) => {
            const lista = [...ordemAtual];
            const idx = lista.indexOf(cat);
            const novo = idx + dir;
            if (novo < 0 || novo >= lista.length) return;
            [lista[idx], lista[novo]] = [lista[novo], lista[idx]];
            update("categorias_ordem", lista);
          };

          return (
            <div className="space-y-4">
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Layers className="h-4 w-4 text-primary" />
                    Categorias do Menu da Vitrine
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Ative, desative, adicione e reordene as categorias que aparecem no menu da loja online.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Adicionar nova */}
                  <div className="flex gap-2">
                    <Input
                      value={novaCategoria}
                      onChange={e => setNovaCategoria(e.target.value.toUpperCase())}
                      placeholder="Ex.: PROMOÇÕES, LANÇAMENTOS..."
                      className="bg-secondary/50"
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); adicionarExtra(); } }}
                    />
                    <Button onClick={adicionarExtra} className="gap-1.5">
                      <Plus className="h-4 w-4" /> Adicionar
                    </Button>
                  </div>

                  <Separator />

                  {ordemAtual.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma categoria encontrada. Cadastre produtos com categoria ou adicione uma categoria personalizada acima.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {ordemAtual.map((cat, idx) => {
                        const oculta = config.categorias_ocultas.includes(cat);
                        const isExtra = config.categorias_extras.includes(cat);
                        return (
                          <div
                            key={cat}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${oculta ? "bg-muted/30 border-border opacity-60" : "bg-secondary/30 border-border"}`}
                          >
                            <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className={`text-sm font-medium flex-1 truncate ${oculta ? "line-through" : ""}`}>
                              {cat}
                            </span>
                            {isExtra && (
                              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">
                                Personalizada
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={idx === 0}
                              onClick={() => mover(cat, -1)}
                              title="Mover para cima"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={idx === ordemAtual.length - 1}
                              onClick={() => mover(cat, 1)}
                              title="Mover para baixo"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleOculta(cat)}
                              title={oculta ? "Ativar categoria" : "Desativar categoria"}
                            >
                              {oculta ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-green-600" />}
                            </Button>
                            {isExtra && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => removerExtra(cat)}
                                title="Excluir categoria personalizada"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground">
                    Lembre-se de clicar em <strong>"Salvar Tudo"</strong> no topo para aplicar as mudanças à vitrine.
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })()}
      </div>
      <SpinWheelPopup
        open={testRoletaOpen}
        onOpenChange={setTestRoletaOpen}
        opcoes={config.roleta_opcoes}
      />
    </div>
  );
}
