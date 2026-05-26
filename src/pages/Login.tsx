import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InstallAppBanner from "@/components/InstallAppBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye, EyeOff, BarChart3, Package, Wrench, FileText, Users,
  ShieldCheck, Zap, TrendingUp, ChevronLeft, ChevronRight
} from "lucide-react";
import ottoIcon from "@/assets/otto-tech-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const slides = [
  {
    icon: BarChart3,
    title: "Controle financeiro completo",
    description: "DRE, fluxo de caixa, contas a pagar e receber. Tenha visão total das finanças da sua empresa em tempo real.",
  },
  {
    icon: Package,
    title: "Gestão de estoque inteligente",
    description: "Controle de produtos, cotações automáticas com fornecedores e alertas de estoque mínimo.",
  },
  {
    icon: Wrench,
    title: "Ordens de serviço digitais",
    description: "Crie e acompanhe OS do início ao fim. Histórico completo e comunicação direta com o cliente.",
  },
  {
    icon: FileText,
    title: "Emissão de NF-e e NFS-e",
    description: "Emita notas fiscais direto do sistema. Integrado com a SEFAZ, sem complicação.",
  },
  {
    icon: Users,
    title: "Gestão de clientes e fidelidade",
    description: "Cadastro completo, histórico de compras, programa de pontos e WhatsApp integrado.",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const forceFreshAppLoad = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }
    } catch (error) {
      console.warn("Falha ao limpar cache do app:", error);
    }
    window.location.replace(`/?v=${Date.now()}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) { toast.error("Preencha email e senha"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) { toast.error("Erro ao entrar: " + error.message); }
    else {
      toast.success("Bem-vindo de volta!");
      await forceFreshAppLoad();
    }
  };

  const currentSlideData = slides[currentSlide];
  const SlideIcon = currentSlideData.icon;

  return (
    <div className="min-h-screen flex bg-[#0A0A0A]" style={{ colorScheme: "dark" }}>
      <InstallAppBanner />

      {/* Left Side - Marketing */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-[#0A0A0A] relative overflow-hidden flex-col border-r border-white/5">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-pulse-glow" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAyIiBoZWlnaHQ9IjYwMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-16">
          {/* Top - Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20 ring-1 ring-primary/30">
              <img src={ottoIcon} alt="Otto Tech" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">Otto Tech Sistemas</span>
          </div>

          {/* Center - Slide Content */}
          <div className="flex-1 flex flex-col justify-center items-center text-center max-w-lg mx-auto">
            <div className="mb-8 transition-all duration-500 ease-in-out transform hover:scale-[1.01]" key={currentSlide}>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10 relative group overflow-hidden">
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <SlideIcon className="h-8 w-8 text-primary relative z-10 animate-pulse-glow" />
              </div>
              <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
                {currentSlideData.title}
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed font-normal">
                {currentSlideData.description}
              </p>
            </div>

            {/* Slide indicators */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/30 transition-all duration-200 active:scale-90"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentSlide
                        ? "w-8 bg-primary shadow-md shadow-primary/45"
                        : "w-3 bg-white/20 hover:bg-white/30"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/30 transition-all duration-200 active:scale-90"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bottom - Features strip */}
          <div className="flex items-center gap-6 text-gray-500 text-sm">
            <div className="flex items-center gap-1.5 hover:text-gray-300 transition-colors duration-200">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Dados seguros</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-gray-300 transition-colors duration-200">
              <Zap className="h-4 w-4 text-primary animate-pulse" />
              <span>Acesso 24/7</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-gray-300 transition-colors duration-200">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>+500 empresas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login */}
      <div className="w-full lg:w-1/2 xl:w-[45%] bg-gradient-to-b from-[#121212] to-[#0A0A0A] flex items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-primary/30">
              <img src={ottoIcon} alt="Otto Tech" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Otto Tech Sistemas</span>
          </div>

          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="h-20 w-20 rounded-2xl mx-auto mb-4 overflow-hidden shadow-xl border border-white/10 ring-2 ring-primary/20 hover:ring-primary/45 transition-all duration-300 transform hover:scale-105">
              <img src={ottoIcon} alt="Otto Tech Sistemas" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Otto Tech Sistemas</h1>
            <p className="text-sm text-gray-400 mt-1">Acesse sua conta para gerenciar sua empresa</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-white/5 border border-white/5 rounded-xl p-1 mb-6">
            <button className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all duration-300 transform active:scale-[0.98]">
              Entrar
            </button>
            <button
              onClick={() => navigate("/cadastro")}
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-gray-400 hover:text-white transition-all duration-300 hover:bg-white/5"
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Email</label>
              <Input 
                type="email" 
                placeholder="seu@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus:border-primary/50 focus:ring-primary/30 transition-all duration-200" 
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Senha</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={senha} 
                  onChange={(e) => setSenha(e.target.value)} 
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12 pr-10 rounded-xl focus:border-primary/50 focus:ring-primary/30 transition-all duration-200" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                type="button" 
                className="text-xs text-primary font-medium hover:text-primary/80 transition-colors hover:underline" 
                onClick={() => toast.info("Funcionalidade em breve!")}
              >
                Esqueci minha senha
              </button>
            </div>
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 rounded-xl text-base transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98]"
            >
              {loading ? "Entrando..." : "Acessar minha conta"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500">ou</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google Sign In */}
          <Button 
            type="button" 
            variant="outline" 
            className="w-full h-12 bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 rounded-xl font-medium transition-all duration-300 hover:border-white/20 hover:scale-[1.01] active:scale-[0.98]"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
              if (error) toast.error("Erro ao entrar com Google: " + error.message);
            }}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </Button>

          {/* Social links */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-600 mb-3">Siga-nos nas redes sociais</p>
            <div className="flex items-center justify-center gap-4">
              {[
                { label: "YouTube", icon: "M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 0 0 .5 6.5S0 8.7 0 10.9v2.2c0 2.2.5 4.4.5 4.4a3 3 0 0 0 2.1 2.1c1.9.4 9.4.4 9.4.4s7.5 0 9.4-.4a3 3 0 0 0 2.1-2.1s.5-2.2.5-4.4v-2.2c0-2.2-.5-4.4-.5-4.4zM9.5 15.5v-7l6.3 3.5-6.3 3.5z" },
                { label: "Facebook", icon: "M24 12c0-6.6-5.4-12-12-12S0 5.4 0 12c0 6 4.4 11 10.1 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4C19.6 23 24 18 24 12z" },
                { label: "Instagram", icon: "M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.2.4-1.3.1-1.6.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1.1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7.1.1 5.8.1 4.9.3 4.1.6c-.8.3-1.5.7-2.1 1.4C1.3 2.6.9 3.3.6 4.1.3 4.9.1 5.8.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.1 1.3.2 2.1.5 2.9.3.8.7 1.5 1.4 2.1.7.7 1.3 1.1 2.1 1.4.8.3 1.7.5 2.9.5C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c1.3-.1 2.1-.2 2.9-.5.8-.3 1.5-.7 2.1-1.4.7-.7 1.1-1.3 1.4-2.1.3-.8.5-1.7.5-2.9.1-1.3.1-1.6.1-4.9s0-3.7-.1-4.9c-.1-1.3-.2-2.1-.5-2.9-.3-.8-.7-1.5-1.4-2.1C21.4 1.3 20.7.9 19.9.6 19.1.3 18.2.1 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.4a1.4 1.4 0 1 0 0-2.9 1.4 1.4 0 0 0 0 2.9z" },
                { label: "LinkedIn", icon: "M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM7.1 20.5H3.5V9h3.6v11.5zM22.2 0H1.8C.8 0 0 .8 0 1.8v20.4c0 1 .8 1.8 1.8 1.8h20.4c1 0 1.8-.8 1.8-1.8V1.8c0-1-.8-1.8-1.8-1.8z" },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/30 transition-all duration-300"
                  title={social.label}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d={social.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-600">
            <p>Powered by <span className="font-semibold text-primary">Otto Tech Sistemas</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
