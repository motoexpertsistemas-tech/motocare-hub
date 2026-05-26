import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Store, Wrench, ShoppingBag, Truck, Target, Palette, Layout,
  ArrowRight, ArrowLeft, Check, Sparkles, Bike, Package, ShieldCheck,
  Heart, Star, Zap, Globe, Megaphone, Users,
} from "lucide-react";

const WIZARD_DONE_KEY = "ecommerce_wizard_done";

interface WizardData {
  nome_loja: string;
  segmento: string;
  servicos: string[];
  objetivo: string;
  layout: string;
  cor_primaria: string;
  logo_url: string;
}

const SEGMENTOS = [
  { id: "pecas", label: "Peças e Acessórios", icon: Package },
  { id: "oficina", label: "Oficina / Serviços", icon: Wrench },
  { id: "loja", label: "Loja de Motos", icon: Bike },
  { id: "ecommerce", label: "E-commerce Geral", icon: ShoppingBag },
  { id: "distribuidora", label: "Distribuidora", icon: Truck },
  { id: "outro", label: "Outro", icon: Store },
];

const SERVICOS = [
  { id: "venda_pecas", label: "Venda de peças", icon: Package },
  { id: "manutencao", label: "Manutenção e reparo", icon: Wrench },
  { id: "delivery", label: "Entrega / Delivery", icon: Truck },
  { id: "orcamento", label: "Orçamento online", icon: ShoppingBag },
  { id: "garantia", label: "Garantia estendida", icon: ShieldCheck },
  { id: "fidelidade", label: "Programa de fidelidade", icon: Heart },
];

const OBJETIVOS = [
  { id: "vender_online", label: "Vender online", desc: "Montar uma loja virtual completa", icon: ShoppingBag },
  { id: "vitrine", label: "Vitrine de produtos", desc: "Mostrar catálogo sem checkout", icon: Star },
  { id: "captacao", label: "Captar clientes", desc: "Landing page + formulário", icon: Users },
  { id: "presenca", label: "Presença digital", desc: "Site institucional da oficina", icon: Globe },
];

const LAYOUTS = [
  { id: "moderno", label: "Moderno", desc: "Clean, minimalista e elegante", color: "from-blue-500 to-cyan-500" },
  { id: "classico", label: "Clássico", desc: "Tradicional com menu lateral", color: "from-amber-500 to-orange-500" },
  { id: "magazine", label: "Magazine", desc: "Estilo revista, com muitas seções", color: "from-purple-500 to-pink-500" },
  { id: "landing", label: "Landing Page", desc: "Página única com scroll", color: "from-green-500 to-emerald-500" },
];

const CORES_PRESETS = [
  "#FF6600", "#E53E3E", "#DD6B20", "#38A169", "#3182CE",
  "#805AD5", "#D53F8C", "#2D3748", "#1A202C", "#319795",
];

interface Props {
  onComplete: (data: WizardData) => void;
}

export function EcommerceSetupWizard({ onComplete }: Props) {
  const [open, setOpen] = useState(() => !localStorage.getItem(WIZARD_DONE_KEY));
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    nome_loja: "",
    segmento: "",
    servicos: [],
    objetivo: "",
    layout: "moderno",
    cor_primaria: "#FF6600",
    logo_url: "",
  });

  const totalSteps = 4;

  const toggleServico = (id: string) => {
    setData(prev => ({
      ...prev,
      servicos: prev.servicos.includes(id)
        ? prev.servicos.filter(s => s !== id)
        : [...prev.servicos, id],
    }));
  };

  const canAdvance = () => {
    if (step === 0) return data.nome_loja.trim().length > 0 && data.segmento;
    if (step === 1) return data.servicos.length > 0;
    if (step === 2) return !!data.objetivo;
    return true;
  };

  const handleFinish = () => {
    localStorage.setItem(WIZARD_DONE_KEY, "true");
    setOpen(false);
    onComplete(data);
  };

  const handleSkip = () => {
    localStorage.setItem(WIZARD_DONE_KEY, "true");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl gap-0 p-0 overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="gradient-primary px-6 py-6 text-center relative">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            {step === 0 && <Store className="h-6 w-6 text-primary-foreground" />}
            {step === 1 && <Wrench className="h-6 w-6 text-primary-foreground" />}
            {step === 2 && <Target className="h-6 w-6 text-primary-foreground" />}
            {step === 3 && <Palette className="h-6 w-6 text-primary-foreground" />}
          </div>
          <h2 className="text-lg font-bold text-primary-foreground">
            {step === 0 && "Sobre seu negócio"}
            {step === 1 && "Serviços oferecidos"}
            {step === 2 && "Qual seu objetivo?"}
            {step === 3 && "Personalização"}
          </h2>
          <p className="text-primary-foreground/70 text-sm mt-1">
            {step === 0 && "Conte-nos sobre sua loja para personalizar tudo pra você"}
            {step === 1 && "Selecione os serviços que sua loja oferece"}
            {step === 2 && "O que você quer alcançar com seu site?"}
            {step === 3 && "Escolha o visual do seu e-commerce"}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? "w-8 bg-white" : i < step ? "w-2 bg-white/80" : "w-2 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 min-h-[320px]">
          {/* Step 0: Nome e Segmento */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nome da sua loja *</Label>
                <Input
                  value={data.nome_loja}
                  onChange={e => setData(prev => ({ ...prev, nome_loja: e.target.value }))}
                  placeholder="Ex: DKA Motos, MotoShop..."
                  className="bg-secondary/50 h-11"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Segmento do negócio *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SEGMENTOS.map(seg => (
                    <button
                      key={seg.id}
                      onClick={() => setData(prev => ({ ...prev, segmento: seg.id }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all ${
                        data.segmento === seg.id
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/40 hover:bg-primary/5 text-foreground"
                      }`}
                    >
                      <seg.icon className="h-4 w-4 shrink-0" />
                      {seg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Serviços */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Selecione um ou mais serviços (aparecerão na sua página)</p>
              <div className="grid grid-cols-2 gap-2">
                {SERVICOS.map(svc => {
                  const selected = data.servicos.includes(svc.id);
                  return (
                    <button
                      key={svc.id}
                      onClick={() => toggleServico(svc.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                        selected ? "bg-primary/20" : "bg-muted"
                      }`}>
                        <svc.icon className={`h-4 w-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <span className={`text-sm font-medium ${selected ? "text-primary" : "text-foreground"}`}>
                        {svc.label}
                      </span>
                      {selected && <Check className="h-4 w-4 text-primary ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Objetivo */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OBJETIVOS.map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => setData(prev => ({ ...prev, objetivo: obj.id }))}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      data.objetivo === obj.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
                      data.objetivo === obj.id ? "bg-primary/20" : "bg-muted"
                    }`}>
                      <obj.icon className={`h-5 w-5 ${data.objetivo === obj.id ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${data.objetivo === obj.id ? "text-primary" : "text-foreground"}`}>
                        {obj.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{obj.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Personalização */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Layout */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Layout do site</Label>
                <div className="grid grid-cols-2 gap-2">
                  {LAYOUTS.map(lay => (
                    <button
                      key={lay.id}
                      onClick={() => setData(prev => ({ ...prev, layout: lay.id }))}
                      className={`relative p-3 rounded-xl border text-left transition-all overflow-hidden ${
                        data.layout === lay.id
                          ? "border-primary ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className={`h-2 w-full rounded-full bg-gradient-to-r ${lay.color} mb-2`} />
                      <p className="text-sm font-medium">{lay.label}</p>
                      <p className="text-xs text-muted-foreground">{lay.desc}</p>
                      {data.layout === lay.id && (
                        <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cor primária */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cor principal</Label>
                <div className="flex flex-wrap gap-2">
                  {CORES_PRESETS.map(cor => (
                    <button
                      key={cor}
                      onClick={() => setData(prev => ({ ...prev, cor_primaria: cor }))}
                      className={`h-9 w-9 rounded-full border-2 transition-all ${
                        data.cor_primaria === cor ? "border-foreground scale-110 ring-2 ring-primary/30" : "border-transparent"
                      }`}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={data.cor_primaria}
                      onChange={e => setData(prev => ({ ...prev, cor_primaria: e.target.value }))}
                      className="h-9 w-9 rounded-full border-0 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">Custom</span>
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Logo da loja (opcional)</Label>
                <Input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  className="bg-secondary/50 text-sm cursor-pointer file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (reader.result) setData(prev => ({ ...prev, logo_url: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {data.logo_url && (
                  <div className="h-12 w-32 bg-muted rounded-lg flex items-center justify-center p-2">
                    <img src={data.logo_url} alt="Logo" className="h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-between">
          <div>
            {step === 0 ? (
              <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Pular configuração
              </button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
            )}
          </div>

          {step < totalSteps - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className="gradient-primary text-primary-foreground"
            >
              Próximo <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="gradient-primary text-primary-foreground"
            >
              <Sparkles className="h-4 w-4 mr-1" /> Criar meu site
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
