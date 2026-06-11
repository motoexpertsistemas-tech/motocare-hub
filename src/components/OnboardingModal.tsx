import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Bike, Package, Users, Truck, Settings, ShoppingCart, 
  CheckCircle2, Circle, ArrowRight, Sparkles, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEmpresa } from "@/contexts/EmpresaContext";

const ONBOARDING_KEY = "ottotech_onboarding_done";

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  checkKey: string;
}

const steps: Step[] = [
  {
    id: "config",
    label: "Configurar sua oficina",
    description: "Defina nome, endereço e dados do negócio",
    icon: Settings,
    path: "/config",
    checkKey: "onb_config",
  },
  {
    id: "produto",
    label: "Cadastrar primeiro produto",
    description: "Adicione uma peça ou serviço ao estoque",
    icon: Package,
    path: "/estoque/novo",
    checkKey: "onb_produto",
  },
  {
    id: "cliente",
    label: "Cadastrar primeiro cliente",
    description: "Registre um cliente para ordens de serviço",
    icon: Users,
    path: "/clientes/novo",
    checkKey: "onb_cliente",
  },
  {
    id: "fornecedor",
    label: "Adicionar um fornecedor",
    description: "Cadastre um fornecedor de peças",
    icon: Truck,
    path: "/fornecedores",
    checkKey: "onb_fornecedor",
  },
  {
    id: "pdv",
    label: "Explorar o PDV",
    description: "Conheça o ponto de venda rápido",
    icon: ShoppingCart,
    path: "/pdv",
    checkKey: "onb_pdv",
  },
];

export function OnboardingModal() {
  const { empresaId } = useEmpresa();
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!empresaId) return;

    const onboardingKey = `ottotech_onboarding_done_${empresaId}`;
    const done = localStorage.getItem(onboardingKey);
    if (!done) {
      setOpen(true);
      localStorage.setItem(onboardingKey, "true");
    }

    // Load completed steps
    const comp: Record<string, boolean> = {};
    steps.forEach((s) => {
      const stepKey = `${s.checkKey}_${empresaId}`;
      comp[s.id] = localStorage.getItem(stepKey) === "true";
    });
    setCompleted(comp);
  }, [empresaId]);

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const handleGoToStep = (step: Step) => {
    if (empresaId) {
      const stepKey = `${step.checkKey}_${empresaId}`;
      localStorage.setItem(stepKey, "true");
      const onboardingKey = `ottotech_onboarding_done_${empresaId}`;
      localStorage.setItem(onboardingKey, "true");
    }
    setCompleted((prev) => ({ ...prev, [step.id]: true }));
    setOpen(false);
    navigate(step.path);
  };

  const handleDismiss = () => {
    if (empresaId) {
      const onboardingKey = `ottotech_onboarding_done_${empresaId}`;
      localStorage.setItem(onboardingKey, "true");
    }
    setOpen(false);
  };

  const handleSkip = () => {
    if (empresaId) {
      const onboardingKey = `ottotech_onboarding_done_${empresaId}`;
      localStorage.setItem(onboardingKey, "true");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val && empresaId) {
        localStorage.setItem(`ottotech_onboarding_done_${empresaId}`, "true");
      }
    }}>
      <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="gradient-primary px-6 py-8 text-center relative">
          <button
            onClick={handleSkip}
            className="absolute right-3 top-3 rounded-full p-1 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Bike className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold text-primary-foreground">
              Bem-vindo ao Otto Tech Sistemas! <Sparkles className="inline h-5 w-5 ml-1" />
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-sm">
              Configure seu workspace em poucos passos e comece a gerenciar sua oficina.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Progress */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-muted-foreground">Progresso</span>
            <span className="font-bold text-primary">{completedCount}/{steps.length}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full gradient-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="px-6 py-4 space-y-2">
          {steps.map((step) => {
            const done = completed[step.id];
            return (
              <button
                key={step.id}
                onClick={() => handleGoToStep(step)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 group ${
                  done
                    ? "border-primary/20 bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  done ? "bg-primary/15" : "bg-muted"
                }`}>
                  <step.icon className={`h-4 w-4 ${done ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? "text-primary line-through" : "text-foreground"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                </div>
                {done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular configuração
          </button>
          {completedCount === steps.length && (
            <Button onClick={handleDismiss} className="gradient-primary text-primary-foreground">
              Concluir setup
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
