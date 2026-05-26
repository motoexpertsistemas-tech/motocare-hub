import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Upload, AlertTriangle, Building2, MapPin, Loader2 } from "lucide-react";
import SpedyConfigTab from "@/components/fiscal/SpedyConfigTab";

const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function ConfiguracaoFiscal() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certSenha, setCertSenha] = useState("");
  const [uploadingCert, setUploadingCert] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const certFileRef = useRef<HTMLInputElement>(null);
  const cnpjTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState({
    enviar_email_destinatario: false,
    discrimina_impostos: false,
    nome: "",
    nome_fantasia: "",
    email: "",
    cnpj: "",
    cpf_responsavel: "",
    telefone: "",
    regime_tributario: "Simples Nacional",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    municipio: "",
    uf: "",
    nfe_habilitada: false,
    nfe_inscricao_estadual: "",
    nfe_serie: "",
    nfe_proximo_numero: 1,
    nfse_habilitada: false,
    nfse_nacional_habilitada: false,
    nfse_inscricao_municipal: "",
    nfse_serie: "",
    nfse_proximo_numero: 1,
    nfse_login: "",
    nfse_senha: "",
    certificado_nome: "",
    certificado_validade: "",
    certificado_url: "",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase.from("configuracao_fiscal" as any).select("id,enviar_email_destinatario,discrimina_impostos,nome,nome_fantasia,email,cnpj,cpf_responsavel,telefone,regime_tributario,cep,logradouro,numero,complemento,bairro,municipio,uf,nfe_habilitada,nfe_inscricao_estadual,nfe_serie,nfe_proximo_numero,nfse_habilitada,nfse_nacional_habilitada,nfse_inscricao_municipal,nfse_serie,nfse_proximo_numero,certificado_nome,certificado_validade,certificado_url,empresa_id,focusnfe_ambiente").limit(1).single();
    if (data) {
      setConfigId((data as any).id);
      const d = data as any;
      setForm({
        enviar_email_destinatario: d.enviar_email_destinatario || false,
        discrimina_impostos: d.discrimina_impostos || false,
        nome: d.nome || "",
        nome_fantasia: d.nome_fantasia || "",
        email: d.email || "",
        cnpj: d.cnpj || "",
        cpf_responsavel: d.cpf_responsavel || "",
        telefone: d.telefone || "",
        regime_tributario: d.regime_tributario || "Simples Nacional",
        cep: d.cep || "",
        logradouro: d.logradouro || "",
        numero: d.numero || "",
        complemento: d.complemento || "",
        bairro: d.bairro || "",
        municipio: d.municipio || "",
        uf: d.uf || "",
        nfe_habilitada: d.nfe_habilitada || false,
        nfe_inscricao_estadual: d.nfe_inscricao_estadual || "",
        nfe_serie: d.nfe_serie || "",
        nfe_proximo_numero: d.nfe_proximo_numero || 1,
        nfse_habilitada: d.nfse_habilitada || false,
        nfse_nacional_habilitada: d.nfse_nacional_habilitada || false,
        nfse_inscricao_municipal: d.nfse_inscricao_municipal || "",
        nfse_serie: d.nfse_serie || "",
        nfse_proximo_numero: d.nfse_proximo_numero || 1,
        nfse_login: "",
        nfse_senha: "",
        certificado_nome: d.certificado_nome || "",
        certificado_validade: d.certificado_validade || "",
        certificado_url: d.certificado_url || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (configId) {
        await supabase.from("configuracao_fiscal" as any).update(form as any).eq("id", configId);
      } else {
        const { data } = await supabase.from("configuracao_fiscal" as any).insert(form as any).select().single();
        if (data) setConfigId((data as any).id);
      }
      toast.success("Configuração fiscal salva com sucesso!");
    } catch {
      toast.error("Erro ao salvar configuração fiscal");
    }
    setSaving(false);
  };

  const handleUploadCertificado = async () => {
    if (!certFile || !certSenha) return;
    setUploadingCert(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: usuario } = await supabase.from("usuarios").select("empresa_id").eq("auth_user_id", session?.user?.id || "").maybeSingle();
      const tenantPrefix = usuario?.empresa_id || "default";
      const fileName = `${tenantPrefix}/certificado_${Date.now()}.pfx`;
      const { error: uploadError } = await supabase.storage
        .from("certificados-fiscais")
        .upload(fileName, certFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("certificados-fiscais")
        .getPublicUrl(fileName);

      const updates = {
        certificado_nome: certFile.name,
        certificado_url: urlData.publicUrl,
      };

      if (configId) {
        await supabase.from("configuracao_fiscal" as any).update(updates as any).eq("id", configId);
      }

      setForm(prev => ({ ...prev, ...updates }));
      setCertDialogOpen(false);
      setCertFile(null);
      setCertSenha("");
      toast.success("Certificado enviado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao enviar certificado: " + (err.message || ""));
    }
    setUploadingCert(false);
  };

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleCnpjChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "");
    // Aplica máscara
    let masked = digits;
    if (digits.length > 2) masked = digits.slice(0, 2) + "." + digits.slice(2);
    if (digits.length > 5) masked = masked.slice(0, 6) + "." + digits.slice(5);
    if (digits.length > 8) masked = masked.slice(0, 10) + "/" + digits.slice(8);
    if (digits.length > 12) masked = masked.slice(0, 15) + "-" + digits.slice(12, 14);
    updateField("cnpj", masked);

    if (cnpjTimeoutRef.current) clearTimeout(cnpjTimeoutRef.current);
    if (digits.length === 14) {
      cnpjTimeoutRef.current = setTimeout(() => buscarCnpj(digits), 600);
    }
  };

  const buscarCnpj = async (cnpj: string) => {
    setBuscandoCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!res.ok) throw new Error("CNPJ não encontrado");
      const d = await res.json();
      setForm(prev => ({
        ...prev,
        nome: d.razao_social || prev.nome,
        nome_fantasia: d.nome_fantasia || prev.nome_fantasia,
        email: d.email && d.email !== "null" ? d.email : prev.email,
        telefone: d.ddd_telefone_1 || prev.telefone,
        cep: d.cep ? d.cep.replace(/\D/g, "") : prev.cep,
        logradouro: d.logradouro || prev.logradouro,
        numero: d.numero || prev.numero,
        complemento: d.complemento || prev.complemento,
        bairro: d.bairro || prev.bairro,
        municipio: d.codigo_municipio_ibge ? String(d.codigo_municipio_ibge) : prev.municipio,
        uf: d.uf || prev.uf,
      }));
      toast.success("Dados preenchidos automaticamente via CNPJ!");
    } catch {
      toast.error("Não foi possível buscar os dados do CNPJ");
    }
    setBuscandoCnpj(false);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuração Fiscal</h1>
          <p className="text-sm text-muted-foreground">Gerencie as informações fiscais da sua empresa</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Fiscais da Empresa</CardTitle>
          <CardDescription>Atualize as informações fiscais da sua empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="empresa">
            <TabsList className="mb-6 flex-wrap">
              <TabsTrigger value="empresa" className="gap-2"><Building2 className="h-4 w-4" /> Dados da Empresa</TabsTrigger>
              <TabsTrigger value="endereco" className="gap-2"><MapPin className="h-4 w-4" /> Endereço</TabsTrigger>
              <TabsTrigger value="nfe">NFe</TabsTrigger>
              <TabsTrigger value="nfse">NFSe</TabsTrigger>
              <TabsTrigger value="certificado">● Certificado</TabsTrigger>
              <TabsTrigger value="spedy" className="gap-2">🔌 Spedy</TabsTrigger>
            </TabsList>

            <TabsContent value="empresa" className="space-y-6">
              <div className="flex flex-wrap gap-8">
                <div className="flex items-center gap-3">
                  <Switch checked={form.enviar_email_destinatario} onCheckedChange={(v) => updateField("enviar_email_destinatario", v)} />
                  <Label className="text-destructive font-medium">Enviar email ao destinatário? *</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.discrimina_impostos} onCheckedChange={(v) => updateField("discrimina_impostos", v)} />
                  <Label className="text-destructive font-medium">Discrimina impostos? *</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-destructive">Nome *</Label><Input value={form.nome} onChange={(e) => updateField("nome", e.target.value)} /></div>
                <div><Label className="text-destructive">Nome Fantasia *</Label><Input value={form.nome_fantasia} onChange={(e) => updateField("nome_fantasia", e.target.value)} /></div>
                <div><Label className="text-destructive">Email *</Label><Input value={form.email} onChange={(e) => updateField("email", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Label className="text-destructive">CNPJ *</Label>
                  <div className="relative">
                    <Input value={form.cnpj} onChange={(e) => handleCnpjChange(e.target.value)} maxLength={18} placeholder="00.000.000/0000-00" />
                    {buscandoCnpj && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Digite 14 dígitos para buscar automaticamente</p>
                </div>
                <div><Label>CPF responsável</Label><Input value={form.cpf_responsavel} onChange={(e) => updateField("cpf_responsavel", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="text-destructive">Telefone *</Label><Input value={form.telefone} onChange={(e) => updateField("telefone", e.target.value)} /></div>
                <div>
                  <Label className="text-destructive">Regime Tributário *</Label>
                  <Select value={form.regime_tributario} onValueChange={(v) => updateField("regime_tributario", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                      <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                      <SelectItem value="MEI">MEI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="endereco" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-destructive">CEP *</Label><Input value={form.cep} onChange={(e) => updateField("cep", e.target.value)} /></div>
                <div><Label className="text-destructive">Logradouro *</Label><Input value={form.logradouro} onChange={(e) => updateField("logradouro", e.target.value)} /></div>
                <div><Label className="text-destructive">Número *</Label><Input value={form.numero} onChange={(e) => updateField("numero", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Complemento</Label><Input value={form.complemento} onChange={(e) => updateField("complemento", e.target.value)} /></div>
                <div><Label className="text-destructive">Bairro *</Label><Input value={form.bairro} onChange={(e) => updateField("bairro", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-destructive">Município *</Label>
                  <Input value={form.municipio} onChange={(e) => updateField("municipio", e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">Insira o código IBGE de 7 dígitos</p>
                </div>
                <div>
                  <Label className="text-destructive">UF *</Label>
                  <Select value={form.uf} onValueChange={(v) => updateField("uf", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="nfe" className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={form.nfe_habilitada} onCheckedChange={(v) => updateField("nfe_habilitada", v)} />
                <Label className="text-destructive font-medium">NFe Habilitada *</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1"><Label className="text-destructive">Inscrição Estadual *</Label><Input value={form.nfe_inscricao_estadual} onChange={(e) => updateField("nfe_inscricao_estadual", e.target.value)} /></div>
                <div><Label className="text-destructive">Série *</Label><Input value={form.nfe_serie} onChange={(e) => updateField("nfe_serie", e.target.value)} /></div>
                <div><Label className="text-destructive">Próximo Número *</Label><Input type="number" value={form.nfe_proximo_numero} onChange={(e) => updateField("nfe_proximo_numero", parseInt(e.target.value) || 1)} /></div>
              </div>
            </TabsContent>

            <TabsContent value="nfse" className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Switch checked={form.nfse_habilitada} onCheckedChange={(v) => updateField("nfse_habilitada", v)} />
                  <Label className="text-destructive font-medium">NFSe Habilitada *</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.nfse_nacional_habilitada} onCheckedChange={(v) => updateField("nfse_nacional_habilitada", v)} />
                  <Label className="text-destructive font-medium">NFSe Nacional Habilitada *</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-destructive">Inscrição Municipal *</Label><Input value={form.nfse_inscricao_municipal} onChange={(e) => updateField("nfse_inscricao_municipal", e.target.value)} /></div>
                <div><Label className="text-destructive">Série *</Label><Input value={form.nfse_serie} onChange={(e) => updateField("nfse_serie", e.target.value)} /></div>
                <div><Label className="text-destructive">Próximo Número *</Label><Input type="number" value={form.nfse_proximo_numero} onChange={(e) => updateField("nfse_proximo_numero", parseInt(e.target.value) || 1)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="text-destructive">Login / Número AEDF *</Label><Input value={form.nfse_login} onChange={(e) => updateField("nfse_login", e.target.value)} /></div>
                <div><Label className="text-destructive">Senha Portal NFSe *</Label><Input type="password" value={form.nfse_senha} onChange={(e) => updateField("nfse_senha", e.target.value)} /></div>
              </div>
            </TabsContent>

            <TabsContent value="certificado" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Certificado Digital</h3>
                <Button variant="default" onClick={() => setCertDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" /> Enviar Certificado
                </Button>
              </div>
              {!form.certificado_nome ? (
                <div className="flex items-center gap-3 rounded-lg bg-amber-100 border border-amber-300 p-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="text-amber-800 font-medium">Nenhum certificado digital foi enviado ainda.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm"><strong>Certificado:</strong> {form.certificado_nome}</p>
                  {form.certificado_validade && <p className="text-sm"><strong>Validade:</strong> {new Date(form.certificado_validade).toLocaleDateString("pt-BR")}</p>}
                </div>
              )}
            </TabsContent>

            <TabsContent value="spedy">
              <SpedyConfigTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog Upload Certificado */}
      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload de Certificado Digital</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-destructive">Arquivo (.pfx) *</Label>
              <Button
                variant="default"
                className="w-full mt-1 justify-start"
                onClick={() => certFileRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {certFile ? certFile.name : "Selecionar Arquivo (.pfx, .p12)"}
              </Button>
              <input
                ref={certFileRef}
                type="file"
                accept=".pfx,.p12"
                className="hidden"
                onChange={(e) => setCertFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label className="text-destructive">Senha do Certificado *</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={certSenha}
                onChange={(e) => setCertSenha(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => { setCertDialogOpen(false); setCertFile(null); setCertSenha(""); }}>
              Cancelar
            </Button>
            <Button onClick={handleUploadCertificado} disabled={uploadingCert || !certFile || !certSenha}>
              {uploadingCert ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
