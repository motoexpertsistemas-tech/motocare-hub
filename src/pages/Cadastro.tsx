import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bike, Check, X, ArrowLeft, Eye, EyeOff, Loader2, Gift, Sparkles, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ottoLogo from "@/assets/otto-tech-logo.png";

const PLANOS = [
  { id: "starter", nome: "Bronze", desc: "Ideal para começar", cor: "from-amber-700 to-amber-500", mensal: 167.69, semestral: 142.54, anual: 89.90 },
  { id: "professional", nome: "Prata", desc: "Mais popular", cor: "from-gray-400 to-gray-300", destaque: true, mensal: 275.38, semestral: 234.07, anual: 179.00 },
  { id: "enterprise", nome: "Ouro", desc: "Para grandes empresas", cor: "from-yellow-500 to-yellow-300", mensal: 398.46, semestral: 338.69, anual: 259.00 },
];

type Ciclo = "mensal" | "semestral" | "anual";

export default function Cadastro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [ciclo, setCiclo] = useState<Ciclo>("mensal");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [brindes, setBrindes] = useState<any[]>([]);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [form, setForm] = useState({
    nome_oficina: "",
    documento: "",
    telefone: "",
    slug: "",
    email: "",
    senha: "",
    confirmar_senha: "",
    plano: "professional",
  });

  const senhaChecks = {
    minLength: form.senha.length >= 8,
    upperLower: /[a-z]/.test(form.senha) && /[A-Z]/.test(form.senha),
    number: /\d/.test(form.senha),
    special: /[^A-Za-z0-9]/.test(form.senha),
  };
  const senhaValida = Object.values(senhaChecks).every(Boolean);

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  // Auto-generate slug when name changes
  useEffect(() => {
    if (step === 2 && form.nome_oficina && !form.slug) {
      generateSlug(form.nome_oficina);
    }
  }, [step]);

  const generateSlug = async (nome: string) => {
    setSlugStatus("checking");
    try {
      const { data, error } = await supabase.rpc("gerar_subdominio_unico", { nome_base: nome });
      if (!error && data) {
        update("slug", data);
        setSlugStatus("available");
      }
    } catch {
      // Fallback client-side
      const slug = nome
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 30);
      update("slug", slug);
      setSlugStatus("available");
    }
  };

  const checkSlug = async (slug: string) => {
    if (!slug || slug.length < 3) { setSlugStatus("idle"); return; }
    setSlugStatus("checking");
    const { data } = await supabase
      .from("empresas" as any)
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    setSlugStatus(data ? "taken" : "available");
  };

  // Load brindes for selected plan
  useEffect(() => {
    supabase
      .from("produtos_brindes" as any)
      .select("*")
      .eq("ativo", true)
      .then(({ data }) => {
        if (data) setBrindes(data);
      });
  }, []);

  const formatDocumento = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const buscarCNPJ = async (cnpj: string) => {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) return;
    setCnpjLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) throw new Error("CNPJ não encontrado");
      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        nome_oficina: (data.nome_fantasia || data.razao_social || "").toUpperCase(),
        telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0, 2)}) ${data.ddd_telefone_1.slice(2)}` : prev.telefone,
      }));
      toast.success("Dados do CNPJ preenchidos automaticamente!");
    } catch {
      toast.error("Não foi possível buscar o CNPJ. Preencha manualmente.");
    } finally {
      setCnpjLoading(false);
    }
  };

  const docDigits = form.documento.replace(/\D/g, "");
  const docLabel = docDigits.length > 11 ? "CNPJ" : docDigits.length > 0 ? "CPF" : "CPF / CNPJ";

  const canAdvance = () => {
    switch (step) {
      case 1: return form.nome_oficina.length >= 3;
      case 2: return form.slug.length >= 3 && slugStatus === "available";
      case 3: return !!form.email && senhaValida && form.senha === form.confirmar_senha;
      case 4: return !!form.plano && aceitouTermos;
      default: return false;
    }
  };

  const handleCadastro = async () => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      // Use secure server-side RPC for all registration logic
      const { data: empresaId, error: rpcError } = await supabase.rpc(
        "criar_empresa_cadastro" as any,
        {
          p_nome: form.nome_oficina,
          p_slug: form.slug,
          p_documento: form.documento || null,
          p_telefone: form.telefone || null,
          p_email: form.email,
          p_plano: form.plano,
          p_auth_user_id: authData.user.id,
        }
      );

      if (rpcError) throw rpcError;

      // Save tenant context
      localStorage.setItem("empresa_id", empresaId as string);
      localStorage.setItem("empresa_slug", form.slug);

      setStep(5); // Success screen
    } catch (error: any) {
      toast.error("Erro ao criar conta: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const planBrindes = brindes.filter((b: any) =>
    (b.planos_aplicaveis as string[])?.includes(form.plano)
  );

  const progress = step <= 4 ? (step / 4) * 100 : 100;

  // Success screen
  if (step === 5) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-primary/10" />
        <Card className="relative w-full max-w-lg bg-[#151515] border-white/10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-green-500 via-emerald-500 to-primary" />
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-6 animate-bounce shadow-lg ring-2 ring-green-500/30">
              <img src={ottoLogo} alt="Otto Tech" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">🎉 Conta Criada!</h1>
            <p className="text-gray-400 mb-6">Sua empresa <span className="text-white font-semibold">{form.nome_oficina}</span> está pronta!</p>

            <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2 font-semibold">
                <Gift className="h-4 w-4 text-primary animate-pulse" /> Brindes do seu plano
              </p>
              {planBrindes.map((b: any) => (
                <div key={b.id} className="flex items-center gap-2 text-sm text-gray-300 py-1 border-b border-white/5 last:border-0 last:pb-0">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  <span>{b.nome}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-400 mb-1 font-medium">Seu link de acesso:</p>
              <p className="text-primary font-mono font-semibold text-base tracking-wide">/app/{form.slug}</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/")}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 rounded-xl text-base transition-all duration-300 transform active:scale-95"
              >
                Acessar Sistema 🚀
              </Button>
            </div>

            <p className="text-xs text-gray-600 mt-4">Trial de 10 dias • Sem cartão de crédito</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />

      <Card className="relative w-full max-w-lg bg-[#151515] border-white/10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-primary via-primary/80 to-purple-600" />
        <CardContent className="p-8">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : navigate("/landing"))}
            className="text-gray-500 hover:text-white text-sm flex items-center gap-1 mb-6 transition-all duration-200 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" /> {step > 1 ? "Voltar" : "Voltar ao site"}
          </button>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Etapa {step} de 4</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-white/5 border border-white/5 rounded-xl p-1 mb-6">
            <button
              onClick={() => navigate("/login")}
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-gray-400 hover:text-white transition-all duration-300 hover:bg-white/5"
            >
              Entrar
            </button>
            <button
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all duration-300"
            >
              Criar conta
            </button>
          </div>

          <div className="text-center mb-4">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {step === 1 && "Dados da Empresa"}
              {step === 2 && "Seu Endereço Digital"}
              {step === 3 && "Credenciais de Acesso"}
              {step === 4 && "Escolha seu Plano"}
            </h1>
          </div>

          {/* Step 1: Company info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">{docLabel} *</label>
                <div className="relative">
                  <Input
                    placeholder="Digite CPF ou CNPJ"
                    value={form.documento}
                    onChange={(e) => {
                      const formatted = formatDocumento(e.target.value);
                      update("documento", formatted);
                      const digits = formatted.replace(/\D/g, "");
                      if (digits.length === 14) buscarCNPJ(formatted);
                    }}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-11 pr-10 focus:border-primary/50 focus:ring-primary/30 rounded-xl"
                  />
                  {cnpjLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
                  )}
                  {!cnpjLoading && docDigits.length === 14 && (
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                {docDigits.length === 14 && (
                  <p className="text-[10px] text-gray-500 mt-1">CNPJ detectado — dados preenchidos automaticamente</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Nome da Empresa *</label>
                <Input
                  placeholder="Ex: MINHA EMPRESA"
                  value={form.nome_oficina}
                  onChange={(e) => update("nome_oficina", e.target.value.toUpperCase())}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-11 focus:border-primary/50 focus:ring-primary/30 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Telefone</label>
                <Input
                  placeholder="(11) 99999-0000"
                  value={form.telefone}
                  onChange={(e) => update("telefone", e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-11 focus:border-primary/50 focus:ring-primary/30 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Step 2: Slug */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Subdomínio da sua empresa</label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="minhaempresa"
                    value={form.slug}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      update("slug", val);
                      checkSlug(val);
                    }}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-11 font-mono focus:border-primary/50 focus:ring-primary/30 rounded-xl"
                  />
                </div>
                <p className="text-xs mt-2 text-gray-400">
                  Acesso: <span className="text-primary font-mono font-semibold">/app/{form.slug || "..."}</span>
                </p>
                {slugStatus === "checking" && <p className="text-xs text-yellow-500 mt-1">⏳ Verificando disponibilidade...</p>}
                {slugStatus === "available" && <p className="text-xs text-green-500 mt-1">✅ Subdomínio disponível!</p>}
                {slugStatus === "taken" && <p className="text-xs text-red-500 mt-1">❌ Já está em uso. Tente outro.</p>}
              </div>
            </div>
          )}

          {/* Step 3: Credentials */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Email *</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value.toLowerCase())}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-11 lowercase focus:border-primary/50 focus:ring-primary/30 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Senha *</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={form.senha}
                    onChange={(e) => update("senha", e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-11 pr-10 focus:border-primary/50 focus:ring-primary/30 rounded-xl"
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
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Confirmar Senha *</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={form.confirmar_senha}
                    onChange={(e) => update("confirmar_senha", e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-11 pr-10 focus:border-primary/50 focus:ring-primary/30 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.confirmar_senha && form.senha !== form.confirmar_senha && (
                  <p className="text-xs text-red-500 mt-1">Senhas não coincidem</p>
                )}
              </div>

              {/* Indicadores de força da senha */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] pt-1">
                {[
                  { ok: senhaChecks.minLength, label: "No mínimo 8 caracteres" },
                  { ok: senhaChecks.upperLower, label: "Letras maiúsculas e minúsculas" },
                  { ok: senhaChecks.number, label: "Pelo menos um número" },
                  { ok: senhaChecks.special, label: "Pelo menos um caractere especial" },
                ].map((c) => (
                  <div key={c.label} className={`flex items-center gap-1.5 ${c.ok ? "text-green-500" : "text-red-500"}`}>
                    {c.ok ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Plan */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Billing cycle toggle */}
              <div className="flex bg-white/5 border border-white/5 rounded-xl p-1 mb-2">
                {([["mensal", "Mensal"], ["semestral", "Semestral (-15%)"], ["anual", "Anual (-35%)"]] as [Ciclo, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setCiclo(key)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      ciclo === key ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {PLANOS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => update("plano", p.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    form.plano === p.id
                      ? "border-primary bg-primary/10 shadow-inner scale-[1.01]"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-sm font-bold bg-gradient-to-r ${p.cor} bg-clip-text text-transparent`}>
                        {p.nome}
                      </span>
                      {p.destaque && (
                        <span className="ml-2 text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-semibold shadow-sm">
                          Popular
                        </span>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-semibold text-sm">
                        R$ {p[ciclo].toFixed(2).replace(".", ",")}/mês
                      </span>
                      {ciclo !== "mensal" && (
                        <p className="text-[10px] text-gray-500 line-through">
                          R$ {p.mensal.toFixed(2).replace(".", ",")}/mês
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              <div className="bg-white/5 border border-white/5 rounded-xl p-4 mt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2 font-semibold">
                  <Gift className="h-3.5 w-3.5 text-primary animate-pulse" /> Brindes inclusos
                </p>
                {planBrindes.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-2 text-xs text-gray-400 py-0.5">
                    <Check className="h-3 w-3 text-green-500 shrink-0" />
                    <span>{b.nome}</span>
                  </div>
                ))}
              </div>

              {/* Aceite dos termos de uso */}
              <label className="flex items-start gap-2 pt-2 cursor-pointer select-none">
                <Checkbox
                  checked={aceitouTermos}
                  onCheckedChange={(c) => setAceitouTermos(c === true)}
                  className="mt-0.5 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-xs text-gray-300 leading-relaxed">
                  Li e concordo com os{" "}
                  <Link to="/termos-de-uso" target="_blank" className="text-primary font-medium underline hover:text-primary/80 transition-colors">
                    termos de uso
                  </Link>
                </span>
              </label>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-6">
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canAdvance()}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base shadow-lg shadow-primary/20 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98]"
              >
                Continuar
              </Button>
            ) : (
              <Button
                onClick={handleCadastro}
                disabled={loading || !canAdvance()}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base shadow-lg shadow-primary/20 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Criando sua conta...</span>
                ) : (
                  "Criar Minha Conta Grátis 🚀"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
