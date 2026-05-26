import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Users, Plus, Search, Phone, Mail, MapPin, Star, Edit2, Trash2, Eye,
  ShoppingCart, DollarSign, CreditCard, Calendar, Car, X,
  Settings2, FileSpreadsheet, FileText, Download, MailIcon, ChevronDown,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const nivelColors: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-700/20 dark:text-amber-300 dark:border-amber-700/40",
  prata: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-400/20 dark:text-gray-300 dark:border-gray-500/40",
  ouro: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40",
  platina: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-400/20 dark:text-cyan-300 dark:border-cyan-400/40",
};

const emptyForm = {
  tipo_pessoa: "fisica" as string,
  nome_completo: "",
  cpf: "",
  nome_fantasia: "",
  razao_social: "",
  cnpj: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  categoria_cliente: "",
  observacoes: "",
  nivel_fidelidade: "bronze",
  limite_credito: "0",
  desconto_padrao: "0",
  dia_vencimento_preferido: "",
  forma_pagamento_preferida: "",
  placas: [] as string[],
};

export default function Clientes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const formatPhone = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 11);
    if (nums.length <= 2) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 2)}-${nums.slice(2)}`;
    return `${nums.slice(0, 2)}-${nums.slice(2, 7)}-${nums.slice(7)}`;
  };

  const formatCNPJ = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 14);
    return nums
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const handleCnpjChange = (raw: string) => {
    const formatted = formatCNPJ(raw);
    setForm((prev) => ({ ...prev, cnpj: formatted }));
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
      setForm((prev) => ({
        ...prev,
        razao_social: data.razao_social || prev.razao_social,
        nome_fantasia: data.nome_fantasia || prev.nome_fantasia || "",
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

  const { data: valoresVenda = [] } = useQuery({
    queryKey: ["valores_venda"],
    queryFn: async () => {
      const { data, error } = await supabase.from("valores_venda" as any).select("nome, media_lucro").order("nome");
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("codigo", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = {
        tipo_pessoa: form.tipo_pessoa,
        telefone: form.telefone,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        cep: form.cep || null,
        logradouro: form.logradouro || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        categoria_cliente: form.categoria_cliente || null,
        observacoes: form.observacoes || null,
        nivel_fidelidade: form.nivel_fidelidade,
        limite_credito: parseFloat(form.limite_credito) || 0,
        desconto_padrao: parseFloat(form.desconto_padrao) || 0,
        dia_vencimento_preferido: form.dia_vencimento_preferido ? parseInt(form.dia_vencimento_preferido) : null,
        forma_pagamento_preferida: form.forma_pagamento_preferida || null,
        placas: form.placas.length > 0 ? form.placas : [],
      };
      if (form.tipo_pessoa === "fisica") {
        payload.nome_completo = form.nome_completo;
        payload.nome_fantasia = form.nome_fantasia || null;
        payload.cpf = form.cpf || null;
      } else {
        payload.razao_social = form.razao_social;
        payload.cnpj = form.cnpj || null;
      }

      if (editingId) {
        const { error } = await supabase.from("clientes").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clientes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success(editingId ? "Cliente atualizado!" : "Cliente cadastrado!");
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente excluído!");
    },
  });

  const bulkDeleteMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("clientes").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setSelectedIds(new Set());
      toast.success("Clientes excluídos!");
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c: any) => c.id)));
    }
  };

  const openEdit = (c: any) => {
    setForm({
      tipo_pessoa: c.tipo_pessoa,
      nome_completo: c.nome_completo || "",
      cpf: c.cpf || "",
      nome_fantasia: c.nome_fantasia || "",
      razao_social: c.razao_social || "",
      cnpj: c.cnpj || "",
      telefone: c.telefone,
      whatsapp: c.whatsapp || "",
      email: c.email || "",
      cep: c.cep || "",
      logradouro: c.logradouro || "",
      numero: c.numero || "",
      complemento: c.complemento || "",
      bairro: c.bairro || "",
      cidade: c.cidade || "",
      estado: c.estado || "",
      categoria_cliente: c.categoria_cliente || "",
      observacoes: c.observacoes || "",
      nivel_fidelidade: c.nivel_fidelidade || "bronze",
      limite_credito: String(c.limite_credito || 0),
      desconto_padrao: String(c.desconto_padrao || 0),
      dia_vencimento_preferido: c.dia_vencimento_preferido ? String(c.dia_vencimento_preferido) : "",
      forma_pagamento_preferida: c.forma_pagamento_preferida || "",
      placas: c.placas || [],
    });
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const filtered = clientes.filter((c: any) => {
    const term = search.toLowerCase();
    const name = (c.nome_completo || c.razao_social || "").toLowerCase();
    return name.includes(term) || (c.telefone || "").includes(term) || (c.cpf || "").includes(term) || (c.cnpj || "").includes(term) || String(c.codigo || "").includes(term);
  });

  const historyClient = historyId ? clientes.find((c: any) => c.id === historyId) : null;

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Users className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            </div>
            <p className="text-sm text-muted-foreground">Cadastro e gestão de clientes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/clientes/novo")}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1.5">
                <Settings2 className="h-4 w-4" /> Mais ações <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/clientes/importar")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Importar de uma planilha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Importação de notas fiscais em breve!")}>
                <FileText className="h-4 w-4 mr-2" /> Importar de notas fiscais
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const csv = ["Nome,Documento,Telefone,Email,Cidade,Estado"]
                  .concat(clientes.map((c: any) => [c.nome_completo || c.razao_social || "", c.cpf || c.cnpj || "", c.telefone || "", c.email || "", c.cidade || "", c.estado || ""].join(","))).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "clientes.csv"; a.click();
                toast.success("Clientes exportados!");
              }}>
                <Download className="h-4 w-4 mr-2" /> Exportar clientes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const emails = clientes.filter((c: any) => c.email).map((c: any) => c.email).join(", ");
                if (!emails) { toast.error("Nenhum e-mail cadastrado"); return; }
                navigator.clipboard.writeText(emails);
                toast.success("E-mails copiados para a área de transferência!");
              }}>
                <MailIcon className="h-4 w-4 mr-2" /> Exportar e-mails
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => {
                if (selectedIds.size === 0) { toast.info("Selecione os clientes na lista para excluir em lote"); return; }
                if (confirm(`Excluir ${selectedIds.size} cliente(s) selecionado(s)?`)) {
                  bulkDeleteMut.mutate(Array.from(selectedIds));
                }
              }}>
                <Trash2 className="h-4 w-4 mr-2" /> Excluir clientes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditingId(null); } }}>
            <DialogTrigger asChild><span /></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo_pessoa} onValueChange={(v) => setForm({ ...form, tipo_pessoa: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fisica">Pessoa Física</SelectItem>
                      <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nível Fidelidade</Label>
                  <Select value={form.nivel_fidelidade} onValueChange={(v) => setForm({ ...form, nivel_fidelidade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="prata">Prata</SelectItem>
                      <SelectItem value="ouro">Ouro</SelectItem>
                      <SelectItem value="platina">Platina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.tipo_pessoa === "fisica" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nome Completo *</Label><Input value={form.nome_completo} onChange={(e) => setForm({ ...form, nome_completo: e.target.value.toUpperCase() })} /></div>
                   <div><Label>Apelido / Nome Fantasia</Label><Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value.toUpperCase() })} placeholder="Como o cliente é conhecido" /></div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>CPF</Label>
                      <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground border-primary" onClick={() => { if (!form.cpf) { toast.error("Informe o CPF primeiro"); return; } window.open("https://www.serasa.com.br", "_blank"); }}>
                        <Search className="h-3 w-3" /> Consulta SERASA
                      </Button>
                    </div>
                    <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Razão Social *</Label><Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value.toUpperCase() })} /></div>
                  <div>
                    <Label>CNPJ</Label>
                    <div className="relative">
                      <Input value={form.cnpj} onChange={(e) => handleCnpjChange(e.target.value)} placeholder="00.000.000/0000-00" maxLength={18} />
                      {buscandoCnpj && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">Buscando...</span>}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div><Label>WhatsApp 1 *</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })} placeholder="41-98880-0068" maxLength={13} /></div>
                <div><Label>WhatsApp 2</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: formatPhone(e.target.value) })} placeholder="41-98880-0068" maxLength={13} /></div>
                <div><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div><Label>CEP</Label><Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} /></div>
                <div className="col-span-2"><Label>Logradouro</Label><Input value={form.logradouro} onChange={(e) => setForm({ ...form, logradouro: e.target.value })} /></div>
                <div><Label>Número</Label><Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} /></div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div><Label>Complemento</Label><Input value={form.complemento} onChange={(e) => setForm({ ...form, complemento: e.target.value })} /></div>
                <div><Label>Bairro</Label><Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} /></div>
                <div><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value.toUpperCase() })} /></div>
                <div><Label>Estado</Label><Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                   <Select value={form.categoria_cliente} onValueChange={(v) => setForm({ ...form, categoria_cliente: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {valoresVenda.map((v) => (
                        <SelectItem key={v.nome} value={v.nome.toLowerCase().replace(/\s+/g, "_")}>{v.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select value={form.forma_pagamento_preferida} onValueChange={(v) => setForm({ ...form, forma_pagamento_preferida: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="debito">Débito</SelectItem>
                      <SelectItem value="credito">Crédito</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Limite de Crédito (R$)</Label>
                  <Input type="number" step="0.01" value={form.limite_credito} onChange={(e) => setForm({ ...form, limite_credito: e.target.value })} />
                </div>
                <div>
                  <Label>Desconto Padrão (%)</Label>
                  <Input type="number" step="0.01" value={form.desconto_padrao} onChange={(e) => setForm({ ...form, desconto_padrao: e.target.value })} />
                </div>
                <div>
                  <Label>Dia Vencimento</Label>
                  <Input type="number" min="1" max="31" value={form.dia_vencimento_preferido} onChange={(e) => setForm({ ...form, dia_vencimento_preferido: e.target.value })} placeholder="Ex: 10" />
                </div>
              </div>

              <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>

              {/* Placas vinculadas */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1">
                  <Car className="h-4 w-4" />
                  Placas de Veículos
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.placas.map((p, idx) => (
                    <Badge key={idx} variant="outline" className="gap-1 font-mono text-sm">
                      {p}
                      <button type="button" onClick={() => setForm({ ...form, placas: form.placas.filter((_, i) => i !== idx) })}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="ABC1D23"
                    maxLength={8}
                    className="max-w-[160px] font-mono uppercase"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                        if (val.length >= 6 && !form.placas.includes(val)) {
                          setForm({ ...form, placas: [...form.placas, val] });
                          (e.target as HTMLInputElement).value = "";
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="ABC1D23"]') as HTMLInputElement;
                      if (input) {
                        const val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                        if (val.length >= 6 && !form.placas.includes(val)) {
                          setForm({ ...form, placas: [...form.placas, val] });
                          input.value = "";
                        }
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Pressione Enter ou clique em Adicionar para vincular placas</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>
                {editingId ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nome, telefone, CPF ou CNPJ..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total", value: clientes.length },
          { label: "Ativos", value: clientes.filter((c: any) => c.ativo).length },
          { label: "Ouro/Platina", value: clientes.filter((c: any) => ["ouro", "platina"].includes(c.nivel_fidelidade)).length },
          { label: "Bloqueados", value: clientes.filter((c: any) => c.bloqueado).length },
        ].map((s) => (
          <Card key={s.label} className="glass-panel">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
          <span className="text-sm font-medium">{selectedIds.size} selecionado(s)</span>
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => {
            if (confirm(`Excluir ${selectedIds.size} cliente(s)?`)) bulkDeleteMut.mutate(Array.from(selectedIds));
          }}>
            <Trash2 className="h-3.5 w-3.5" /> Excluir selecionados
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Limpar seleção</Button>
        </div>
      )}

      {/* Table */}
      <Card className="glass-panel">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-20">Código</TableHead>
                <TableHead>Nome / Apelido</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Crédito</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
              ) : (
                filtered.map((c: any) => (
                  <TableRow key={c.id} className={`cursor-pointer hover:bg-muted/30 ${selectedIds.has(c.id) ? "bg-primary/5" : ""}`}>
                    <TableCell>
                      <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{c.codigo || "—"}</TableCell>
                    <TableCell className="font-medium">
                      <div>{c.nome_completo || c.razao_social || "—"}</div>
                      {c.nome_fantasia && <div className="text-xs text-muted-foreground">{c.nome_fantasia}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`uppercase ${c.tipo_pessoa === "juridica" ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-700/20 dark:text-blue-300 dark:border-blue-700/40" : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-700/20 dark:text-emerald-300 dark:border-emerald-700/40"}`}>
                        {c.tipo_pessoa === "juridica" ? "pessoa jurídica" : "pessoa física"}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.telefone ? formatPhone(c.telefone) : "—"}</TableCell>
                    <TableCell className="uppercase">{c.cidade || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={nivelColors[c.nivel_fidelidade] || ""}>
                        {c.nivel_fidelidade}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(c.limite_credito || 0))}
                    </TableCell>
                    <TableCell>{c.categoria_cliente || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title="Histórico" onClick={() => setHistoryId(c.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Edit2 className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir cliente?")) deleteMut.mutate(c.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Histórico do Cliente */}
      <Dialog open={!!historyId} onOpenChange={(o) => { if (!o) setHistoryId(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cliente #{historyClient?.codigo || "—"}
            </DialogTitle>
          </DialogHeader>
          {historyClient && (
            <div className="flex gap-6">
              {/* Left panel - Client data */}
              <div className="w-64 shrink-0 space-y-3 border-r border-border pr-4">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente #{historyClient.codigo || "—"}</p>
                  <p className="font-bold text-foreground text-lg mt-1">
                    {historyClient.nome_completo || historyClient.razao_social}
                  </p>
                  {historyClient.nome_fantasia && (
                    <p className="text-sm text-muted-foreground">{historyClient.nome_fantasia}</p>
                  )}
                </div>

                {(historyClient.cpf || historyClient.cnpj) && (
                  <p className="text-sm text-muted-foreground">
                    {historyClient.tipo_pessoa === "fisica" ? "CPF" : "CNPJ"}: {historyClient.cpf || historyClient.cnpj}
                  </p>
                )}

                <p className="text-sm flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {historyClient.telefone}
                </p>

                {(historyClient.cidade || historyClient.estado) && (
                  <p className="text-sm flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {[historyClient.cidade, historyClient.estado].filter(Boolean).join(", ")}
                  </p>
                )}

                <p className="text-sm flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Cadastrado em: {historyClient.created_at ? format(new Date(historyClient.created_at), "dd/MM/yyyy") : "—"}
                </p>

                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total em Vendas:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(Number(historyClient.total_gasto || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Compras:</span>
                    <span className="font-semibold">{historyClient.total_compras || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticket Médio:</span>
                    <span className="font-semibold">{formatCurrency(Number(historyClient.ticket_medio || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score:</span>
                    <span className="font-semibold">{historyClient.score_pagamento || 100}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5" /> Crédito Disponível:
                    </span>
                    <span className="font-semibold text-green-600">{formatCurrency(Number(historyClient.limite_credito || 0))}</span>
                  </div>
                </div>
              </div>

              {/* Right panel - Tabs */}
              <div className="flex-1 min-w-0">
                <Tabs defaultValue="vendas">
                  <TabsList className="w-full">
                    <TabsTrigger value="vendas" className="flex-1 gap-1.5">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Vendas ({historyClient.total_compras || 0})
                    </TabsTrigger>
                    <TabsTrigger value="financeiro" className="flex-1 gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      Financeiro (0)
                    </TabsTrigger>
                    <TabsTrigger value="creditos" className="flex-1 gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      Créditos (0)
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="vendas" className="mt-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Buscar por código, produto..." className="pl-9" />
                    </div>
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                      Nenhuma venda encontrada
                    </div>
                  </TabsContent>

                  <TabsContent value="financeiro" className="mt-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Buscar lançamento..." className="pl-9" />
                    </div>
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                      Nenhum lançamento encontrado
                    </div>
                  </TabsContent>

                  <TabsContent value="creditos" className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        Limite de Crédito: <span className="text-green-600">{formatCurrency(Number(historyClient.limite_credito || 0))}</span>
                      </p>
                    </div>
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                      Nenhum crédito registrado
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

