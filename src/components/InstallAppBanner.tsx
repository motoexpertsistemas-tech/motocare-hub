import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    if (isStandalone) return;
    if (sessionStorage.getItem("pwa-banner-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Always show banner after a short delay (iOS, iframe previews, or fallback)
    const timer = setTimeout(() => setShowBanner(true), 2000);
    return () => { clearTimeout(timer); window.removeEventListener("beforeinstallprompt", handler); };
  }, [isStandalone, isIOS]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Show manual instructions (iOS or fallback)
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    sessionStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (isStandalone || dismissed || !showBanner) return null;

  return (
    <>
      {/* Floating banner */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 bg-background border border-border shadow-2xl rounded-full px-5 py-3">
          <div className="bg-primary rounded-full p-2">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <button
            onClick={handleInstall}
            className="text-primary font-bold text-sm whitespace-nowrap"
          >
            Instalar App
          </button>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground ml-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Instructions dialog (iOS / fallback) */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Instalar o App
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {isIOS ? (
              <>
                <Step number={1}>
                  Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta) na barra do navegador
                </Step>
                <Step number={2}>
                  Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>
                </Step>
                <Step number={3}>Confirme tocando em <strong>Adicionar</strong></Step>
              </>
            ) : (
              <>
                <Step number={1}>
                  Toque no menu <strong>⋮</strong> (três pontos) do navegador
                </Step>
                <Step number={2}>
                  Toque em <strong>Adicionar à tela inicial</strong> ou <strong>Instalar app</strong>
                </Step>
                <Step number={3}>Confirme a instalação</Step>
              </>
            )}
            <p className="text-sm text-muted-foreground text-center pt-2">
              O app ficará na sua tela inicial como um app nativo!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center">
        {number}
      </span>
      <p className="text-sm leading-relaxed pt-0.5">{children}</p>
    </div>
  );
}
