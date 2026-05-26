import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, CheckCircle2, XCircle, Wifi } from "lucide-react";

const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function SpedyConfigTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [form, setForm] = useState({
    api_key: "",
    ambiente: "sandbox",
    cnpj: "",
    razao_social: "",
    nome_fantasia: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    codigo_municipio: "",
    serie_nfe: "1",
    serie_nfce: "1",
    serie_nfse: "1",
    regime_tributario: "simples_nacional",
  });
  const [homologado, setHomologado] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase
      .from("spedy_config" as any)
      .select("id,ambiente,cnpj,razao_social,nome_fantasia,cep,logradouro,numero,complemento,bairro,cidade,uf,codigo_municipio,serie_nfe,serie_nfce,serie_nfse,regime_tributario,homologado,ativo")
      .limit(1)
      .single();

    if (data) {
      const d = data as any;
      setConfigId(d.id);
      setHomologado(d.homologado || false);
      setForm({
        api_key: "", // never returned from DB (SELECT revoked)
        ambiente: d.ambiente || "sandbox",
        cnpj: d.cnpj || "",
        razao_social: d.razao_social || "",
        nome_fantasia: d.nome_fantasia || "",
        cep: d.cep || "",
        logradouro: d.logradouro || "",
        numero: d.numero || "",
        complemento: d.complemento || "",
        bairro: d.bairro || "",
        cidade: d.cidade || "",
        uf: d.uf || "",
        codigo_municipio: d.codigo_municipio || "",
        serie_nfe: d.serie_nfe || "1",
        serie_nfce: d.serie_nfce || "1",
        serie_nfse: d.serie_nfse || "1",
        regime_tributario: d.regime_tributario || "simples_nacional",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.cnpj || !form.razao_social) {
      toast.error("Preencha CNPJ e Razão Social");
      return;
    }
    setSaving(true);
    try {
      const payload: any = { ...form };
      // Only send api_key if user typed a new one
      if (!payload.api_key) delete payload.api_key;

      if (configId) {
        await supabase.from("spedy_config" as any).update(payload).eq("id", configId);
      } else {
        if (!form.api_key) {
          toast.error("Informe a API Key da Spedy");
          setSaving(false);
          return;
        }
        const { data } = await supabase.from("spedy_config" as any).insert(payload as any).select().single();
        if (data) setConfigId((data as any).id);
      }
      toast.success("Configuração Spedy salva!");
    } catch {
      toast.error("Erro ao salvar configuração Spedy");
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("spedy-proxy", {
        body: { operacao: "testar-conexao", tipo: "nfe" },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Conexão com Spedy OK!");
    } catch (err: any) {
      toast.error("Falha na conexão: " + (err.message || ""));
    }
    setTesting(false);
  };

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  if (loading) return <div className="p-4 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Integração Spedy</h3>
          {configId && (
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${homologado ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {homologado ? <><CheckCircle2 className="h-3 w-3" /> Homologado</> : <><XCircle className="h-3 w-3" /> Não Homologado</>}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {configId && (
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wifi className="h-4 w-4 mr-2" />}
              Testar Conexão
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Credenciais */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">Credenciais</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>API Key *</Label>
            <Input
              type="password"
              placeholder={configId ? "••••••• (já configurada)" : "spedy_sandbox_xxxx..."}
              value={form.api_key}
              onChange={(e) => updateField("api_key", e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Encontre em sandbox-app.spedy.com.br → Minha Empresa</p>
          </div>
          <div>
            <Label>Ambiente *</Label>
            <Select value={form.ambiente} onValueChange={(v) => updateField("ambiente", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                <SelectItem value="production">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Dados da Empresa */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">Dados da Empresa</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>CNPJ *</Label><Input value={form.cnpj} onChange={(e) => updateField("cnpj", e.target.value)} /></div>
          <div><Label>Razão Social *</Label><Input value={form.razao_social} onChange={(e) => updateField("razao_social", e.target.value)} /></div>
          <div><Label>Nome Fantasia</Label><Input value={form.nome_fantasia} onChange={(e) => updateField("nome_fantasia", e.target.value)} /></div>
        </div>
      </div>

      {/* Endereço */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">Endereço</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>CEP</Label><Input value={form.cep} onChange={(e) => updateField("cep", e.target.value)} /></div>
          <div><Label>Logradouro</Label><Input value={form.logradouro} onChange={(e) => updateField("logradouro", e.target.value)} /></div>
          <div><Label>Número</Label><Input value={form.numero} onChange={(e) => updateField("numero", e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><Label>Bairro</Label><Input value={form.bairro} onChange={(e) => updateField("bairro", e.target.value)} /></div>
          <div><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => updateField("cidade", e.target.value)} /></div>
          <div>
            <Label>UF</Label>
            <Select value={form.uf} onValueChange={(v) => updateField("uf", v)}>
              <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>{UF_LIST.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Cód. Município</Label><Input value={form.codigo_municipio} onChange={(e) => updateField("codigo_municipio", e.target.value)} /></div>
        </div>
      </div>

      {/* Séries e Regime */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">Séries e Regime Tributário</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><Label>Série NF-e</Label><Input value={form.serie_nfe} onChange={(e) => updateField("serie_nfe", e.target.value)} /></div>
          <div><Label>Série NFC-e</Label><Input value={form.serie_nfce} onChange={(e) => updateField("serie_nfce", e.target.value)} /></div>
          <div><Label>Série NFS-e</Label><Input value={form.serie_nfse} onChange={(e) => updateField("serie_nfse", e.target.value)} /></div>
          <div>
            <Label>Regime Tributário</Label>
            <Select value={form.regime_tributario} onValueChange={(v) => updateField("regime_tributario", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                <SelectItem value="simples_nacional_excesso">SN Excesso</SelectItem>
                <SelectItem value="regime_normal">Regime Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
