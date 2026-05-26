import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  User,
  Building2,
  MapPin,
  CreditCard,
  MessageSquare,
  ArrowLeft,
  Search,
  Car,
  Plus,
  X,
  Camera,
  Paperclip,
  Upload,
  Loader2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function NovoCliente() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const placaFromUrl = searchParams.get("placa");

  const [tipoPessoa, setTipoPessoa] = useState<"fisica" | "juridica">("fisica");
  const [saving, setSaving] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: "",
    cpf: "",
    rg: "",
    data_nascimento: "",
    genero: "",
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    email: "",
    telefone: "",
    whatsapp: "",
    telefone_secundario: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    categoria_cliente: "varejo",
    desconto_padrao: "0",
    limite_credito: "0",
    forma_pagamento_preferida: "pix",
    dia_vencimento_preferido: "",
    consentimento_whatsapp: false,
    consentimento_email: false,
    consentimento_sms: false,
    observacoes: "",
    instagram: "",
    facebook: "",
    placas: [] as string[],
  });

  const { data: valoresVenda = [] } = useQuery({
    queryKey: ["valores_venda"],
    queryFn: async () => {
      const { data, error } = await supabase.from("valores_venda" as any).select("nome, media_lucro").order("nome");
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const [novaPlaca, setNovaPlaca] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [anexos, setAnexos] = useState<{ nome: string; url: string }[]>([]);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const anexoInputRef = useRef<HTMLInputElement>(null);

  const set = (field: string, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem JPG ou GIF de até 5Mb."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 5MB)"); return; }
    setUploadingFoto(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: usuario } = await supabase.from("usuarios").select("empresa_id").eq("auth_user_id", session?.user?.id || "").maybeSingle();
      const tenantPrefix = usuario?.empresa_id || "default";
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${tenantPrefix}/fotos/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("clientes-arquivos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("clientes-arquivos").getPublicUrl(path);
      setFotoUrl(data.publicUrl);
      toast.success("Foto enviada!");
    } catch (err: any) { toast.error("Erro no upload: " + (err.message || err)); }
    finally { setUploadingFoto(false); if (fotoInputRef.current) fotoInputRef.current.value = ""; }
  };

  const handleAnexoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 5MB)"); return; }
    setUploadingAnexo(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: usuario } = await supabase.from("usuarios").select("empresa_id").eq("auth_user_id", session?.user?.id || "").maybeSingle();
      const tenantPrefix = usuario?.empresa_id || "default";
      const path = `${tenantPrefix}/anexos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("clientes-arquivos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("clientes-arquivos").getPublicUrl(path);
      setAnexos((prev) => [...prev, { nome: file.name, url: data.publicUrl }]);
      toast.success("Arquivo anexado!");
    } catch (err: any) { toast.error("Erro no upload: " + (err.message || err)); }
    finally { setUploadingAnexo(false); if (anexoInputRef.current) anexoInputRef.current.value = ""; }
  };

  // Pre-fill placa from URL
  useEffect(() => {
    if (placaFromUrl) {
      setFormData((prev) => ({
        ...prev,
        placas: prev.placas.includes(placaFromUrl) ? prev.placas : [...prev.placas, placaFromUrl],
      }));
    }
  }, [placaFromUrl]);
  const formatCNPJ = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 14);
    return nums
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const handleCnpjChange = (raw: string, setter: (val: string) => void) => {
    const formatted = formatCNPJ(raw);
    setter(formatted);
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 14) buscarCnpj(digits);
  };

  const buscarCnpj = async (cnpjRaw: string) => {
    const cnpjLimpo = cnpjRaw.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) return;
    setBuscandoCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!res.ok) { toast.error("CNPJ não encontrado"); return; }
      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        razao_social: data.razao_social || prev.razao_social,
        nome_fantasia: data.nome_fantasia || prev.nome_fantasia,
        cep: data.cep ? data.cep.replace(/\D/g, "") : prev.cep,
        logradouro: data.logradouro || prev.logradouro,
        numero: data.numero || prev.numero,
        complemento: data.complemento || prev.complemento,
        bairro: data.bairro || prev.bairro,
        cidade: data.municipio || prev.cidade,
        estado: data.uf || prev.estado,
        email: data.email || prev.email,
        telefone: data.ddd_telefone_1 ? data.ddd_telefone_1.replace(/\D/g, "") : prev.telefone,
      }));
      toast.success("Dados do CNPJ preenchidos!");
    } catch {
      toast.error("Erro ao buscar CNPJ");
    } finally {
      setBuscandoCnpj(false);
    }
  };

  const buscarCEP = async () => {
    const cepClean = formData.cep.replace(/\D/g, "");
    if (cepClean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      }
    } catch {
      // silently fail
    }
  };

  const validarCPF = (cpf: string): boolean => {
    const nums = cpf.replace(/\D/g, "");
    if (nums.length !== 11 || /^(\d)\1{10}$/.test(nums)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i);
    let rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    if (rest !== parseInt(nums[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    return rest === parseInt(nums[10]);
  };

  const validarCNPJ = (cnpj: string): boolean => {
    const nums = cnpj.replace(/\D/g, "");
    if (nums.length !== 14 || /^(\d)\1{13}$/.test(nums)) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.telefone.trim()) {
      toast.error("Telefone é obrigatório");
      return;
    }

    if (tipoPessoa === "fisica") {
      if (!formData.nome_completo.trim()) {
        toast.error("Nome completo é obrigatório");
        return;
      }
      if (formData.cpf && !validarCPF(formData.cpf)) {
        toast.error("CPF inválido!");
        return;
      }
    } else {
      if (!formData.razao_social.trim()) {
        toast.error("Razão Social é obrigatória");
        return;
      }
      if (formData.cnpj && !validarCNPJ(formData.cnpj)) {
        toast.error("CNPJ inválido!");
        return;
      }
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Sessão expirada. Faça login novamente.");
        setSaving(false);
        return;
      }
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();
      if (!usuario?.empresa_id) {
        toast.error("Empresa não identificada para o usuário.");
        setSaving(false);
        return;
      }

      const payload: Record<string, unknown> = {
        empresa_id: usuario.empresa_id,
        tipo_pessoa: tipoPessoa,
        telefone: formData.telefone,
        whatsapp: formData.whatsapp || null,
        telefone_secundario: formData.telefone_secundario || null,
        email: formData.email || null,
        cep: formData.cep || null,
        logradouro: formData.logradouro || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        categoria_cliente: formData.categoria_cliente || null,
        forma_pagamento_preferida: formData.forma_pagamento_preferida || null,
        desconto_padrao: parseFloat(formData.desconto_padrao) || 0,
        limite_credito: parseFloat(formData.limite_credito) || 0,
        dia_vencimento_preferido: formData.dia_vencimento_preferido
          ? parseInt(formData.dia_vencimento_preferido)
          : null,
        consentimento_whatsapp: formData.consentimento_whatsapp,
        consentimento_email: formData.consentimento_email,
        consentimento_sms: formData.consentimento_sms,
        data_consentimento:
          formData.consentimento_whatsapp ||
          formData.consentimento_email ||
          formData.consentimento_sms
            ? new Date().toISOString()
            : null,
        observacoes: formData.observacoes || null,
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        origem_cadastro: "loja_fisica",
        placas: formData.placas.length > 0 ? formData.placas : [],
        foto_url: fotoUrl || null,
        anexos: anexos.length > 0 ? anexos : [],
      };

      if (tipoPessoa === "fisica") {
        payload.nome_completo = formData.nome_completo;
        payload.nome_fantasia = formData.nome_fantasia || null;
        payload.cpf = formData.cpf || null;
        payload.rg = formData.rg || null;
        payload.data_nascimento = formData.data_nascimento || null;
        payload.genero = formData.genero || null;
      } else {
        payload.razao_social = formData.razao_social;
        payload.nome_fantasia = formData.nome_fantasia || null;
        payload.cnpj = formData.cnpj || null;
        payload.inscricao_estadual = formData.inscricao_estadual || null;
        payload.inscricao_municipal = formData.inscricao_municipal || null;
      }

      const { error } = await supabase.from("clientes").insert(payload as any);
      if (error) throw error;

      toast.success("Cliente cadastrado com sucesso!");
      navigate(returnTo || "/clientes");
    } catch (error: any) {
      toast.error("Erro ao cadastrar: " + (error.message || "erro desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(returnTo || "/clientes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Cliente</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre um novo cliente no sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tipo de Pessoa */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Label className="mb-3 block">Tipo de Pessoa</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={tipoPessoa === "fisica" ? "default" : "outline"}
                onClick={() => setTipoPessoa("fisica")}
              >
                <User className="mr-2 h-4 w-4" />
                Pessoa Física
              </Button>
              <Button
                type="button"
                variant={tipoPessoa === "juridica" ? "default" : "outline"}
                onClick={() => setTipoPessoa("juridica")}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Pessoa Jurídica
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="dados" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
            <TabsTrigger value="endereco">Endereço</TabsTrigger>
            <TabsTrigger value="comercial">Dados Comerciais</TabsTrigger>
            <TabsTrigger value="outros">Outros</TabsTrigger>
          </TabsList>

          {/* DADOS BÁSICOS */}
          <TabsContent value="dados">
            <Card>
              <CardHeader>
                <CardTitle>
                  {tipoPessoa === "fisica" ? "Dados Pessoais" : "Dados da Empresa"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tipoPessoa === "fisica" ? (
                  <>
                    <div>
                      <Label>Nome Completo *</Label>
                      <Input
                        value={formData.nome_completo}
                        onChange={(e) => set("nome_completo", e.target.value.toUpperCase())}
                        required
                      />
                    </div>
                    <div>
                      <Label>Apelido / Nome Fantasia</Label>
                      <Input
                        value={formData.nome_fantasia}
                        onChange={(e) => set("nome_fantasia", e.target.value.toUpperCase())}
                        placeholder="Como o cliente é conhecido"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label>CPF</Label>
                        <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground border-primary" onClick={() => { if (!formData.cpf) { toast.error("Informe o CPF primeiro"); return; } window.open("https://www.serasa.com.br", "_blank"); }}>
                          <Search className="h-3 w-3" /> Consulta SERASA
                        </Button>
                      </div>
                      <Input
                        value={formData.cpf}
                        onChange={(e) => set("cpf", e.target.value)}
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                    </div>
                    <div>
                      <Label>RG</Label>
                      <Input
                        value={formData.rg}
                        onChange={(e) => set("rg", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Data de Nascimento</Label>
                      <Input
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) => set("data_nascimento", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Gênero</Label>
                      <Select
                        value={formData.genero}
                        onValueChange={(v) => set("genero", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Não informar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-full">
                      <Label>Razão Social *</Label>
                      <Input
                        value={formData.razao_social}
                        onChange={(e) => set("razao_social", e.target.value.toUpperCase())}
                        required
                      />
                    </div>
                    <div>
                      <Label>Nome Fantasia</Label>
                      <Input
                        value={formData.nome_fantasia}
                        onChange={(e) => set("nome_fantasia", e.target.value.toUpperCase())}
                      />
                    </div>
                    <div>
                      <Label>CNPJ</Label>
                      <div className="relative">
                        <Input
                          value={formData.cnpj}
                          onChange={(e) => handleCnpjChange(e.target.value, (v) => set("cnpj", v))}
                          placeholder="00.000.000/0000-00"
                          maxLength={18}
                        />
                        {buscandoCnpj && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">Buscando...</span>}
                      </div>
                    </div>
                    <div>
                      <Label>Inscrição Estadual</Label>
                      <Input
                        value={formData.inscricao_estadual}
                        onChange={(e) => set("inscricao_estadual", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Inscrição Municipal</Label>
                      <Input
                        value={formData.inscricao_municipal}
                        onChange={(e) => set("inscricao_municipal", e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Contato */}
                <div className="col-span-full border-t border-border pt-4 mt-2">
                  <h3 className="font-semibold mb-4 text-foreground">Contato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>WhatsApp 1 *</Label>
                      <Input
                        value={formData.telefone}
                        onChange={(e) => set("telefone", e.target.value)}
                        placeholder="(11) 98765-4321"
                        required
                      />
                    </div>
                    <div>
                      <Label>WhatsApp 2</Label>
                      <Input
                        value={formData.whatsapp}
                        onChange={(e) => set("whatsapp", e.target.value)}
                        placeholder="(11) 98765-4321"
                      />
                    </div>
                    <div>
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => set("email", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ENDEREÇO */}
          <TabsContent value="endereco">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>CEP</Label>
                  <Input
                    value={formData.cep}
                    onChange={(e) => set("cep", e.target.value)}
                    onBlur={buscarCEP}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Logradouro</Label>
                  <Input
                    value={formData.logradouro}
                    onChange={(e) => set("logradouro", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => set("numero", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Complemento</Label>
                  <Input
                    value={formData.complemento}
                    onChange={(e) => set("complemento", e.target.value)}
                    placeholder="Apto, Bloco..."
                  />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => set("bairro", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => set("cidade", e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input
                    value={formData.estado}
                    onChange={(e) => set("estado", e.target.value)}
                    maxLength={2}
                    placeholder="PB"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* COMERCIAL */}
          <TabsContent value="comercial">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Dados Comerciais
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={formData.categoria_cliente}
                    onValueChange={(v) => set("categoria_cliente", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(valoresVenda.length > 0
                        ? valoresVenda.map((v: any) => ({ label: v.nome, value: v.nome.toLowerCase().replace(/\s+/g, "_") }))
                        : [
                            { label: "Varejo", value: "varejo" },
                            { label: "Atacado", value: "atacado" },
                            { label: "Revenda", value: "revenda" },
                            { label: "VIP", value: "vip" },
                          ]
                      ).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Forma de Pagamento Preferida</Label>
                  <Select
                    value={formData.forma_pagamento_preferida}
                    onValueChange={(v) => set("forma_pagamento_preferida", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="debito">Débito</SelectItem>
                      <SelectItem value="credito">Crédito</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Desconto Padrão (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.desconto_padrao}
                    onChange={(e) => set("desconto_padrao", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Limite de Crédito (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.limite_credito}
                    onChange={(e) => set("limite_credito", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Dia de Vencimento Preferido</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_vencimento_preferido}
                    onChange={(e) => set("dia_vencimento_preferido", e.target.value)}
                    placeholder="Ex: 10"
                  />
                </div>

                {/* LGPD */}
                <div className="col-span-full border-t border-border pt-4 mt-2">
                  <h3 className="font-semibold mb-4 text-foreground">
                    Consentimentos (LGPD)
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.consentimento_whatsapp}
                        onCheckedChange={(v) => set("consentimento_whatsapp", !!v)}
                      />
                      <span className="text-sm text-foreground">
                        Autorizo contato via WhatsApp para ofertas e promoções
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.consentimento_email}
                        onCheckedChange={(v) => set("consentimento_email", !!v)}
                      />
                      <span className="text-sm text-foreground">
                        Autorizo envio de e-mails promocionais
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.consentimento_sms}
                        onCheckedChange={(v) => set("consentimento_sms", !!v)}
                      />
                      <span className="text-sm text-foreground">
                        Autorizo envio de SMS
                      </span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OUTROS */}
          <TabsContent value="outros">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Foto */}
                <div>
                  <Label className="flex items-center gap-1.5 mb-2">
                    <Camera className="h-4 w-4" />
                    Foto
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2 bg-accent/50 rounded px-2 py-1">
                    Insira uma imagem JPG ou GIF de até 5Mb.
                  </p>
                  <div className="flex items-end gap-4">
                    <div className="w-24 h-24 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                      {fotoUrl ? (
                        <img src={fotoUrl} alt="Foto do cliente" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <input ref={fotoInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleFotoUpload} />
                      <Button type="button" variant="default" size="sm" className="gap-1.5" onClick={() => fotoInputRef.current?.click()} disabled={uploadingFoto}>
                        {uploadingFoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploadingFoto ? "Enviando..." : "Selecione uma foto"}
                      </Button>
                      {fotoUrl && (
                        <Button type="button" variant="ghost" size="sm" className="text-destructive gap-1" onClick={() => setFotoUrl(null)}>
                          <Trash2 className="h-3 w-3" /> Remover
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Anexos */}
                <div>
                  <Label className="flex items-center gap-1.5 mb-2">
                    <Paperclip className="h-4 w-4" />
                    Anexos
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2 bg-accent/50 rounded px-2 py-1">
                    Utilize este espaço para anexar arquivos e documentos. Tamanho máximo 5Mb.
                  </p>
                  {anexos.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {anexos.map((a, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm bg-muted rounded px-2 py-1">
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                          <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate flex-1">{a.nome}</a>
                          <button type="button" onClick={() => setAnexos((prev) => prev.filter((_, i) => i !== idx))}>
                            <X className="h-3 w-3 text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input ref={anexoInputRef} type="file" className="hidden" onChange={handleAnexoUpload} />
                  <Button type="button" variant="default" size="sm" className="gap-1.5" onClick={() => anexoInputRef.current?.click()} disabled={uploadingAnexo}>
                    {uploadingAnexo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingAnexo ? "Enviando..." : "Selecionar arquivo"}
                  </Button>
                </div>

                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => set("observacoes", e.target.value)}
                    rows={4}
                    placeholder="Anotações internas sobre o cliente..."
                  />
                </div>

                {/* Placas de veículos */}
                <div>
                  <Label className="flex items-center gap-1.5 mb-2">
                    <Car className="h-4 w-4" />
                    Placas de Veículos
                  </Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.placas.map((p, idx) => (
                      <Badge key={idx} variant="outline" className="gap-1 font-mono text-sm">
                        {p}
                        <button type="button" onClick={() => setFormData({ ...formData, placas: formData.placas.filter((_, i) => i !== idx) })}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={novaPlaca}
                      onChange={(e) => setNovaPlaca(e.target.value.toUpperCase())}
                      placeholder="ABC1D23"
                      maxLength={8}
                      className="max-w-[160px] font-mono uppercase"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = novaPlaca.replace(/[^A-Z0-9]/g, "");
                          if (val.length >= 6 && !formData.placas.includes(val)) {
                            setFormData({ ...formData, placas: [...formData.placas, val] });
                            setNovaPlaca("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const val = novaPlaca.replace(/[^A-Z0-9]/g, "");
                        if (val.length >= 6 && !formData.placas.includes(val)) {
                          setFormData({ ...formData, placas: [...formData.placas, val] });
                          setNovaPlaca("");
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Pressione Enter ou clique em Adicionar para vincular placas</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Instagram</Label>
                    <Input
                      value={formData.instagram}
                      onChange={(e) => set("instagram", e.target.value)}
                      placeholder="@cliente"
                    />
                  </div>
                  <div>
                    <Label>Facebook</Label>
                    <Input
                      value={formData.facebook}
                      onChange={(e) => set("facebook", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões */}
        <div className="flex gap-4 justify-end mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/clientes")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar Cliente"}
          </Button>
        </div>
      </form>
    </div>
  );
}
