import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  CreditCard,
  FileText,
  Users,
  Shield,
  Upload,
  Check,
  X,
  Settings2,
  Loader2,
  Save,
  Trash2,
  Pencil,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const roles = [
  {
    name: "Admin / Proprietário",
    key: "admin",
    color: "bg-primary/15 text-primary border-primary/30",
    permissions: ["Acesso total", "Configurações fiscais", "Financeiro completo", "Emissão de notas", "Gestão de usuários"],
  },
  {
    name: "Gerente",
    key: "gerente",
    color: "bg-info/15 text-info border-info/30",
    permissions: ["Aprovar descontos", "Estornos", "Visualizar DRE", "Gestão de OS", "PDV"],
  },
  {
    name: "Vendedor",
    key: "vendedor",
    color: "bg-success/15 text-success border-success/30",
    permissions: ["PDV", "Cadastrar clientes", "Consultar estoque (sem custo)"],
    restricted: ["Preço de custo", "Financeiro", "Configurações"],
  },
  {
    name: "Mecânico",
    key: "mecanico",
    color: "bg-warning/15 text-warning border-warning/30",
    permissions: ["Modo quiosque", "Gerenciar suas OS", "Upload de fotos"],
    restricted: ["Valores de custo", "Faturamento", "Preços", "Emissão fiscal"],
  },
  {
    name: "Cliente",
    key: "cliente",
    color: "bg-muted text-muted-foreground border-border",
    permissions: ["Portal do cliente", "Minha garagem", "Histórico", "E-commerce"],
  },
];

interface DBUser {
  id: string;
  nome_completo: string;
  email: string;
  ativo: boolean;
  role?: string;
}

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState<"empresa" | "fiscal" | "rbac" | "integracoes" | "importador">("empresa");
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const cnpjTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [empresa, setEmpresa] = useState({
    razao_social: "",
    cnpj: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    endereco: "",
    cidade_uf: "",
    cep: "",
    telefone: "",
  });
  const [fiscal, setFiscal] = useState({
    regime_tributario: "Simples Nacional",
    aliquota_iss: "5.00",
    icms_padrao: "18.00",
    pis: "1.65",
    cofins: "7.60",
    ambiente_nfe: "homologacao",
  });
  const [salvandoFiscal, setSalvandoFiscal] = useState(false);
  const [dbUsers, setDbUsers] = useState<DBUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editUser, setEditUser] = useState<DBUser | null>(null);
  const [editRole, setEditRole] = useState("vendedor");
  const [deleteUser, setDeleteUser] = useState<DBUser | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ nome: "", email: "", role: "vendedor" });
  const [savingUser, setSavingUser] = useState(false);

  // Carregar dados existentes da configuracoes_loja
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("configuracoes_loja").select("*").limit(1).single();
      if (data) {
        const endereco = [data.logradouro, data.numero].filter(Boolean).join(", ");
        const cidade_uf = [data.cidade, data.estado].filter(Boolean).join(" / ");
        setEmpresa({
          razao_social: data.razao_social || "",
          cnpj: data.cnpj || "",
          inscricao_estadual: data.inscricao_estadual || "",
          inscricao_municipal: "",
          endereco: endereco,
          cidade_uf: cidade_uf,
          cep: data.cep || "",
          telefone: data.telefone || "",
        });
      }
    }
    load();
  }, []);

  // Load fiscal config
  useEffect(() => {
    async function loadFiscal() {
      const { data } = await supabase.from("configuracao_fiscal").select("*").limit(1).single();
      if (data) {
        setFiscal({
          regime_tributario: data.regime_tributario || "Simples Nacional",
          aliquota_iss: "5.00",
          icms_padrao: "18.00",
          pis: "1.65",
          cofins: "7.60",
          ambiente_nfe: data.focusnfe_ambiente || "homologacao",
        });
      }
    }
    loadFiscal();
  }, []);

  const salvarFiscal = async () => {
    setSalvandoFiscal(true);
    try {
      const { data: existing } = await supabase.from("configuracao_fiscal").select("id").limit(1).single();
      const payload = {
        regime_tributario: fiscal.regime_tributario,
        focusnfe_ambiente: fiscal.ambiente_nfe,
      };
      if (existing) {
        await supabase.from("configuracao_fiscal").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("configuracao_fiscal").insert(payload);
      }
      toast.success("Configurações fiscais salvas!");
    } catch (err) {
      toast.error("Erro ao salvar configurações fiscais");
    } finally {
      setSalvandoFiscal(false);
    }
  };

  // Load users from DB
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: usuarios } = await supabase.from("usuarios").select("id, nome_completo, email, ativo");
      if (usuarios) {
        const usersWithRoles: DBUser[] = [];
        for (const u of usuarios) {
          const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", u.id).limit(1).single();
          usersWithRoles.push({ ...u, role: (roleData?.role as string) || "vendedor" });
        }
        setDbUsers(usersWithRoles);
      }
    } catch (err) { console.error(err); }
    finally { setLoadingUsers(false); }
  };

  useEffect(() => { if (activeTab === "rbac") loadUsers(); }, [activeTab]);

  const handleUpdateRole = async () => {
    if (!editUser) return;
    setSavingUser(true);
    try {
      await supabase.from("user_roles").delete().eq("user_id", editUser.id);
      await supabase.from("user_roles").insert({ user_id: editUser.id, role: editRole as any });
      toast.success("Perfil atualizado!");
      setEditUser(null);
      loadUsers();
    } catch { toast.error("Erro ao atualizar perfil"); }
    finally { setSavingUser(false); }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setSavingUser(true);
    try {
      await supabase.from("user_roles").delete().eq("user_id", deleteUser.id);
      await supabase.from("usuarios").delete().eq("id", deleteUser.id);
      toast.success("Usuário removido!");
      setDeleteUser(null);
      loadUsers();
    } catch { toast.error("Erro ao remover usuário"); }
    finally { setSavingUser(false); }
  };

  const handleAddUser = async () => {
    if (!newUser.nome || !newUser.email) { toast.error("Preencha nome e email"); return; }
    setSavingUser(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");
      const { data: me } = await supabase.from("usuarios").select("empresa_id").eq("auth_user_id", userData.user.id).single();
      if (!me) throw new Error("Empresa não encontrada");
      // Check if user with this email already exists in this empresa
      const { data: existing } = await supabase.from("usuarios")
        .select("id")
        .eq("empresa_id", me.empresa_id)
        .eq("email", newUser.email.toLowerCase())
        .maybeSingle();
      if (existing) throw new Error("Já existe um usuário com este email nesta empresa");

      const { data: inserted, error } = await supabase.from("usuarios").insert([{
        nome_completo: newUser.nome, email: newUser.email.toLowerCase(), empresa_id: me.empresa_id,
      } as any]).select("id").single();
      if (error) throw error;
      if (inserted) await supabase.from("user_roles").insert({ user_id: inserted.id, role: newUser.role as any });
      toast.success("Usuário adicionado!");
      setAddUserOpen(false);
      setNewUser({ nome: "", email: "", role: "vendedor" });
      loadUsers();
    } catch (err: any) { toast.error(err.message || "Erro ao adicionar"); }
    finally { setSavingUser(false); }
  };

  const salvarDados = async () => {
    setSalvando(true);
    try {
      // Parse endereco e cidade_uf
      const [logradouro, numero] = empresa.endereco.split(",").map(s => s?.trim());
      const [cidade, estado] = empresa.cidade_uf.split("/").map(s => s?.trim());

      const payload = {
        razao_social: empresa.razao_social,
        nome_fantasia: empresa.razao_social,
        cnpj: empresa.cnpj,
        inscricao_estadual: empresa.inscricao_estadual,
        logradouro: logradouro || "",
        numero: numero || "",
        cidade: cidade || "",
        estado: estado || "",
        cep: empresa.cep,
        telefone: empresa.telefone,
      };

      // Check if record exists
      const { data: existing } = await supabase.from("configuracoes_loja").select("id").limit(1).single();

      if (existing) {
        const { error } = await supabase.from("configuracoes_loja").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("configuracoes_loja").insert(payload);
        if (error) throw error;
      }

      toast.success("Dados da empresa salvos com sucesso! Serão exibidos em todas as impressões e relatórios.");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "tente novamente"));
    }
    setSalvando(false);
  };

  const handleCnpjChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "");
    let masked = digits;
    if (digits.length > 2) masked = digits.slice(0, 2) + "." + digits.slice(2);
    if (digits.length > 5) masked = masked.slice(0, 6) + "." + digits.slice(5);
    if (digits.length > 8) masked = masked.slice(0, 10) + "/" + digits.slice(8);
    if (digits.length > 12) masked = masked.slice(0, 15) + "-" + digits.slice(12, 14);
    setEmpresa(prev => ({ ...prev, cnpj: masked }));

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
      setEmpresa(prev => ({
        ...prev,
        razao_social: d.razao_social || prev.razao_social,
        endereco: d.logradouro ? `${d.logradouro}, ${d.numero || "S/N"}` : prev.endereco,
        cidade_uf: d.municipio ? `${d.municipio} / ${d.uf}` : prev.cidade_uf,
        cep: d.cep ? d.cep.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2") : prev.cep,
        telefone: d.ddd_telefone_1 || prev.telefone,
      }));
      toast.success("Dados preenchidos automaticamente via CNPJ!");
    } catch {
      toast.error("Não foi possível buscar os dados do CNPJ");
    }
    setBuscandoCnpj(false);
  };

  const tabs = [
    { key: "empresa" as const, label: "Empresa", icon: Building2 },
    { key: "fiscal" as const, label: "Fiscal", icon: FileText },
    { key: "rbac" as const, label: "Usuários & Permissões", icon: Shield },
    { key: "integracoes" as const, label: "Integrações", icon: CreditCard },
    { key: "importador" as const, label: "Importador", icon: Upload },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados da empresa, fiscal, permissões e integrações</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-auto border-b border-border pb-px">
        {tabs.map((tab) => (
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
        {/* Empresa Tab */}
        {activeTab === "empresa" && (
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Razão Social</Label>
                  <Input value={empresa.razao_social} onChange={(e) => setEmpresa(prev => ({ ...prev, razao_social: e.target.value }))} placeholder="Otto Tech Sistemas LTDA" className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <div className="relative">
                    <Input value={empresa.cnpj} onChange={(e) => handleCnpjChange(e.target.value)} placeholder="00.000.000/0001-00" className="bg-secondary/50" maxLength={18} />
                    {buscandoCnpj && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">Digite 14 dígitos para buscar automaticamente</p>
                </div>
                <div className="space-y-2">
                  <Label>Inscrição Estadual</Label>
                  <Input value={empresa.inscricao_estadual} onChange={(e) => setEmpresa(prev => ({ ...prev, inscricao_estadual: e.target.value }))} placeholder="" className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Inscrição Municipal</Label>
                  <Input value={empresa.inscricao_municipal} onChange={(e) => setEmpresa(prev => ({ ...prev, inscricao_municipal: e.target.value }))} placeholder="" className="bg-secondary/50" />
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input value={empresa.endereco} onChange={(e) => setEmpresa(prev => ({ ...prev, endereco: e.target.value }))} placeholder="Rua das Motos, 123" className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Cidade / UF</Label>
                  <Input value={empresa.cidade_uf} onChange={(e) => setEmpresa(prev => ({ ...prev, cidade_uf: e.target.value }))} placeholder="São Paulo / SP" className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input value={empresa.cep} onChange={(e) => setEmpresa(prev => ({ ...prev, cep: e.target.value }))} placeholder="01000-000" className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={empresa.telefone} onChange={(e) => setEmpresa(prev => ({ ...prev, telefone: e.target.value }))} placeholder="(11) 99999-9999" className="bg-secondary/50" />
                </div>
              </div>
              <Button className="gradient-primary text-primary-foreground" onClick={salvarDados} disabled={salvando}>
                {salvando ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</> : <><Save className="h-4 w-4 mr-2" /> Salvar Dados</>}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">Esses dados aparecerão em todas as impressões, cupons e relatórios.</p>
            </CardContent>
          </Card>
        )}

        {/* Fiscal Tab */}
        {activeTab === "fiscal" && (
          <div className="space-y-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings2 className="h-4 w-4 text-primary" />
                  Configurações Tributárias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Regime Tributário</Label>
                  <div className="flex gap-3">
                    {["Simples Nacional", "Lucro Presumido", "Lucro Real"].map((regime) => (
                      <Button
                        key={regime}
                        variant={fiscal.regime_tributario === regime ? "default" : "outline"}
                        className={fiscal.regime_tributario === regime ? "gradient-primary text-primary-foreground" : ""}
                        size="sm"
                        onClick={() => setFiscal(f => ({ ...f, regime_tributario: regime }))}
                      >
                        {regime}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Alíquota ISS (sua cidade)</Label>
                    <div className="relative">
                      <Input type="number" value={fiscal.aliquota_iss} onChange={e => setFiscal(f => ({ ...f, aliquota_iss: e.target.value }))} className="bg-secondary/50 pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>ICMS Padrão (seu estado)</Label>
                    <div className="relative">
                      <Input type="number" value={fiscal.icms_padrao} onChange={e => setFiscal(f => ({ ...f, icms_padrao: e.target.value }))} className="bg-secondary/50 pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>PIS</Label>
                    <div className="relative">
                      <Input type="number" value={fiscal.pis} onChange={e => setFiscal(f => ({ ...f, pis: e.target.value }))} className="bg-secondary/50 pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>COFINS</Label>
                    <div className="relative">
                      <Input type="number" value={fiscal.cofins} onChange={e => setFiscal(f => ({ ...f, cofins: e.target.value }))} className="bg-secondary/50 pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Ambiente NF-e</Label>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className={fiscal.ambiente_nfe === "homologacao" ? "border-warning/40 text-warning bg-warning/10" : ""}
                      onClick={() => setFiscal(f => ({ ...f, ambiente_nfe: "homologacao" }))}
                    >
                      🧪 Homologação (Testes)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={fiscal.ambiente_nfe === "producao" ? "border-success/40 text-success bg-success/10" : ""}
                      onClick={() => setFiscal(f => ({ ...f, ambiente_nfe: "producao" }))}
                    >
                      🏭 Produção
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Em homologação, as notas são emitidas apenas para teste e não têm valor fiscal.
                  </p>
                </div>

                <Button className="gradient-primary text-primary-foreground" onClick={salvarFiscal} disabled={salvandoFiscal}>
                  {salvandoFiscal ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</> : "Salvar Configurações Fiscais"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* RBAC Tab */}
        {activeTab === "rbac" && (
          <div className="space-y-4">
            {/* Users */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Usuários ({dbUsers.length})
                  </span>
                  <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold" onClick={() => setAddUserOpen(true)}>+ Adicionar</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : dbUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário cadastrado</p>
                ) : (
                  dbUsers.map((user) => {
                    const role = roles.find((r) => r.key === user.role);
                    return (
                      <div key={user.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                            {(user.nome_completo || "?").charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{user.nome_completo || "Sem nome"}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${role?.color || ""} text-xs`}>
                            {role?.name || user.role}
                          </Badge>
                          <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10 font-medium" onClick={() => { setEditUser(user); setEditRole(user.role || "vendedor"); }}>
                            <Pencil className="h-3 w-3 mr-1" /> Editar
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteUser(user)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Add User Dialog */}
            <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Usuário</DialogTitle>
                  <DialogDescription>Cadastre um novo usuário no sistema</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Nome completo</Label>
                    <Input value={newUser.nome} onChange={e => setNewUser(n => ({ ...n, nome: e.target.value }))} placeholder="Nome do usuário" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" value={newUser.email} onChange={e => setNewUser(n => ({ ...n, email: e.target.value }))} placeholder="email@empresa.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Perfil</Label>
                    <Select value={newUser.role} onValueChange={v => setNewUser(n => ({ ...n, role: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r.key} value={r.key}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddUserOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddUser} disabled={savingUser}>
                    {savingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={!!editUser} onOpenChange={(v) => { if (!v) setEditUser(null); }}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Editar Perfil</DialogTitle>
                  <DialogDescription>{editUser?.nome_completo} — {editUser?.email}</DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5">
                  <Label>Perfil de acesso</Label>
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r.key} value={r.key}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
                  <Button onClick={handleUpdateRole} disabled={savingUser}>
                    {savingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteUser} onOpenChange={(v) => { if (!v) setDeleteUser(null); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover <strong>{deleteUser?.nome_completo}</strong>? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Role Matrix */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-primary" />
                  Matriz de Permissões (RBAC)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roles.map((role) => (
                  <div key={role.key} className="rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-2">
                    <Badge variant="outline" className={`${role.color} text-xs`}>
                      {role.name}
                    </Badge>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {role.permissions.map((p) => (
                        <span key={p} className="inline-flex items-center gap-1 text-xs text-success">
                          <Check className="h-3 w-3" /> {p}
                        </span>
                      ))}
                      {role.restricted?.map((p) => (
                        <span key={p} className="inline-flex items-center gap-1 text-xs text-destructive">
                          <X className="h-3 w-3" /> {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === "integracoes" && (
          <div className="space-y-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Pagamentos — Asaas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                  <span className="text-sm text-warning">Não conectado</span>
                </div>
                <div className="space-y-2">
                  <Label>API Key Asaas</Label>
                  <Input type="password" placeholder="$aact_..." className="bg-secondary/50 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Ambiente</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Sandbox</Button>
                    <Button variant="outline" size="sm">Produção</Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Habilita cobranças via Pix, boleto e cartão de crédito/débito.
                </p>
                <Button className="gradient-primary text-primary-foreground">Conectar Asaas</Button>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  Fiscal — NF-e / NFS-e
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                  <span className="text-sm text-warning">Não conectado</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Provedor</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">FocusNFe</Button>
                      <Button variant="outline" size="sm">PlugNotas</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Token de Acesso</Label>
                    <Input type="password" placeholder="••••••••" className="bg-secondary/50 font-mono" />
                  </div>
                </div>
                <Button className="gradient-primary text-primary-foreground">Conectar</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Importer Tab */}
        {activeTab === "importador" && (
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4 text-primary" />
                Importador de Estoque Paralelo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Importe planilhas CSV ou Excel dos seus fornecedores para atualizar estoques paralelos automaticamente.
              </p>

              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <div className="flex gap-2">
                  {["OSI", "Iron", "Mundiais", "Outro"].map((f) => (
                    <Button key={f} variant="outline" size="sm">{f}</Button>
                  ))}
                </div>
              </div>

              {/* Drop zone */}
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-10 cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-10 w-10 text-primary/50" />
                <div className="text-center">
                  <p className="text-sm font-medium">Arraste sua planilha aqui</p>
                  <p className="text-xs text-muted-foreground">CSV ou Excel (.xlsx) — máx 20MB</p>
                </div>
                <Button variant="outline" size="sm">Selecionar Arquivo</Button>
              </div>

              {/* Expected format */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Formato esperado</p>
                <div className="overflow-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">SKU</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Nome Produto</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Preço Custo</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">Estoque</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Prazo Entrega</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50">
                        <td className="px-3 py-2 font-mono">FLT-001</td>
                        <td className="px-3 py-2">Filtro Óleo</td>
                        <td className="px-3 py-2 text-right">R$ 25,90</td>
                        <td className="px-3 py-2 text-center">120</td>
                        <td className="px-3 py-2">2 dias</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono">PFR-002</td>
                        <td className="px-3 py-2">Pastilha Freio</td>
                        <td className="px-3 py-2 text-right">R$ 14,50</td>
                        <td className="px-3 py-2 text-center">85</td>
                        <td className="px-3 py-2">5 dias</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <Button className="gradient-primary text-primary-foreground w-full" disabled>
                Importar Planilha
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
