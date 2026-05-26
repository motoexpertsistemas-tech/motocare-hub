import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Building2, Plus, Power, Trash2, Package, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ImportarProdutosLojaDialog from "@/components/ImportarProdutosLojaDialog";

const INITIAL_FORM = {
  nome: "",
  tipo_pessoa: "PJ",
  cnpj: "",
  nome_fantasia: "",
  razao_social: "",
  inscricao_estadual: "",
  inscricao_municipal: "",
  isenta_ie: false,
  cnae_principal: "",
  regime_tributario: "",
  regime_especial_tributacao: "",
  email: "",
  telefone: "",
  celular: "",
  site: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  importar_produtos: false,
  importar_contas: false,
  importar_formas: false,
};

export default function Filiais() {
  const { empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const formRef = useRef(form);
  formRef.current = form;
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nome: string } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches", empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const buscarCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(f => ({
          ...f,
          logradouro: data.logradouro || f.logradouro,
          bairro: data.bairro || f.bairro,
          cidade: data.localidade || f.cidade,
          estado: data.uf || f.estado,
          complemento: data.complemento || f.complemento,
        }));
      }
    } catch { /* ignore */ }
    setCepLoading(false);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!empresaId) throw new Error("Sem empresa");
      const tipo = branches.length === 0 ? "matriz" : "filial";
      const { data: newBranch, error } = await supabase.from("branches").insert({
        empresa_id: empresaId,
        nome: form.nome,
        tipo,
        tipo_pessoa: form.tipo_pessoa,
        cnpj: form.cnpj || null,
        nome_fantasia: form.nome_fantasia || null,
        razao_social: form.razao_social || null,
        inscricao_estadual: form.isenta_ie ? "ISENTO" : (form.inscricao_estadual || null),
        inscricao_municipal: form.inscricao_municipal || null,
        isenta_ie: form.isenta_ie,
        cnae_principal: form.cnae_principal || null,
        regime_tributario: form.regime_tributario || null,
        regime_especial_tributacao: form.regime_especial_tributacao || null,
        email: form.email || null,
        telefone: form.telefone || null,
        celular: form.celular || null,
        site: form.site || null,
        cep: form.cep || null,
        logradouro: form.logradouro || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        endereco: [form.logradouro, form.numero, form.bairro, form.cidade, form.estado].filter(Boolean).join(", ") || null,
      } as any).select("id").single();
      if (error) throw error;

      const matriz = branches.find((b: any) => b.tipo === "matriz");
      const newBranchId = newBranch?.id;
      if (!newBranchId || !matriz) return;

      // Importar produtos da Matriz
      if (formRef.current.importar_produtos) {
        const { data: produtos } = await supabase
          .from("produtos_catalogo")
          .select("*")
          .eq("empresa_id", empresaId)
          .eq("branch_id", matriz.id);
        if (produtos && produtos.length > 0) {
          const copies = produtos.map((p: any) => {
            const { id, created_at, updated_at, ...rest } = p;
            return { ...rest, branch_id: newBranchId };
          });
          await supabase.from("produtos_catalogo").insert(copies as any);
        }
      }

      // Importar contas bancárias
      if (formRef.current.importar_contas) {
        const { data: contas } = await (supabase as any)
          .from("contas_bancarias")
          .select("*")
          .eq("empresa_id", empresaId)
          .eq("branch_id", matriz.id);
        if (contas && contas.length > 0) {
          const copies = contas.map((c: any) => {
            const { id, criado_em, atualizado_em, ...rest } = c;
            return { ...rest, branch_id: newBranchId };
          });
          await (supabase as any).from("contas_bancarias").insert(copies);
        }
      }

      // Importar formas de pagamento
      if (formRef.current.importar_formas) {
        const { data: formas } = await (supabase as any)
          .from("formas_pagamento")
          .select("*")
          .eq("empresa_id", empresaId)
          .eq("branch_id", matriz.id);
        if (formas && formas.length > 0) {
          const copies = formas.map((f: any) => {
            const { id, criado_em, atualizado_em, ...rest } = f;
            return { ...rest, branch_id: newBranchId };
          });
          await (supabase as any).from("formas_pagamento").insert(copies);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setOpen(false);
      setForm(INITIAL_FORM);
      toast.success("Filial criada com sucesso!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("branches").update({ ativo: !ativo } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Status atualizado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("branches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setDeleteTarget(null);
      toast.success("Filial excluída com sucesso!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const maxFiliais = 10;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Minhas Filiais</h1>
          <p className="text-muted-foreground">{branches.length} de {maxFiliais} filiais utilizadas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Package className="w-4 h-4 mr-2" /> Importar Produtos
          </Button>
          <Button onClick={() => setOpen(true)} disabled={branches.length >= maxFiliais}>
            <Plus className="w-4 h-4 mr-2" /> Nova Filial
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : branches.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          Nenhuma filial cadastrada. Crie a primeira unidade (será a Matriz).
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((b: any) => (
            <Card key={b.id} className={!b.ativo ? "opacity-60" : ""}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold text-lg">{b.nome}</span>
                  </div>
                  <Badge className={b.tipo === "matriz" ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-blue-500 text-white hover:bg-blue-600"}>
                    {b.tipo === "matriz" ? "Matriz" : "Filial"}
                  </Badge>
                </div>
                {b.cnpj && <p className="text-sm text-muted-foreground">CNPJ: {b.cnpj}</p>}
                {b.email && <p className="text-sm text-muted-foreground">{b.email}</p>}
                {b.cidade && b.estado && <p className="text-sm text-muted-foreground">{b.cidade}/{b.estado}</p>}
                {!b.cidade && b.endereco && <p className="text-sm text-muted-foreground">{b.endereco}</p>}
                {b.telefone && <p className="text-sm text-muted-foreground">Tel: {b.telefone}</p>}
                <div className="flex items-center justify-between pt-2">
                  <Badge variant={b.ativo ? "default" : "secondary"}>{b.ativo ? "Ativo" : "Inativo"}</Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleMutation.mutate({ id: b.id, ativo: b.ativo })}>
                      <Power className="w-4 h-4 mr-1" /> {b.ativo ? "Desativar" : "Ativar"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget({ id: b.id, nome: b.nome })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Nova Filial Dialog - Formulário Completo */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Filial</DialogTitle></DialogHeader>
          <div className="space-y-6">

            {/* Seção: Dados Gerais */}
            <div>
              <h3 className="text-base font-semibold mb-3 border-b pb-1">Dados Gerais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Nome de referência *</Label>
                  <Input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Ex: Loja Centro" />
                </div>
                <div>
                  <Label>Tipo de pessoa</Label>
                  <Select value={form.tipo_pessoa} onValueChange={v => set("tipo_pessoa", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{form.tipo_pessoa === "PJ" ? "CNPJ" : "CPF"}</Label>
                  <Input value={form.cnpj} onChange={e => set("cnpj", e.target.value)} placeholder={form.tipo_pessoa === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"} />
                </div>
                <div>
                  <Label>Nome fantasia</Label>
                  <Input value={form.nome_fantasia} onChange={e => set("nome_fantasia", e.target.value)} />
                </div>
                <div>
                  <Label>Razão social</Label>
                  <Input value={form.razao_social} onChange={e => set("razao_social", e.target.value)} />
                </div>
                <div>
                  <Label>Inscrição estadual</Label>
                  <div className="space-y-1">
                    <Input value={form.inscricao_estadual} onChange={e => set("inscricao_estadual", e.target.value)} disabled={form.isenta_ie} placeholder={form.isenta_ie ? "ISENTO" : ""} />
                    <div className="flex items-center gap-2">
                      <Checkbox checked={form.isenta_ie} onCheckedChange={v => set("isenta_ie", !!v)} id="isenta_ie" />
                      <label htmlFor="isenta_ie" className="text-xs text-muted-foreground cursor-pointer">Isenta</label>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Inscrição municipal</Label>
                  <Input value={form.inscricao_municipal} onChange={e => set("inscricao_municipal", e.target.value)} />
                </div>
                <div>
                  <Label>CNAE principal</Label>
                  <Input value={form.cnae_principal} onChange={e => set("cnae_principal", e.target.value)} />
                </div>
                <div>
                  <Label>Regime tributário</Label>
                  <Select value={form.regime_tributario} onValueChange={v => set("regime_tributario", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                      <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="lucro_real">Lucro Real</SelectItem>
                      <SelectItem value="mei">MEI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Seção: Contato */}
            <div>
              <h3 className="text-base font-semibold mb-3 border-b pb-1">Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(00) 0000-0000" />
                </div>
                <div>
                  <Label>Celular</Label>
                  <Input value={form.celular} onChange={e => set("celular", e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <Label>Site</Label>
                  <Input value={form.site} onChange={e => set("site", e.target.value)} placeholder="https://" />
                </div>
              </div>
            </div>

            {/* Seção: Endereço */}
            <div>
              <h3 className="text-base font-semibold mb-3 border-b pb-1">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>CEP</Label>
                  <div className="relative">
                    <Input
                      value={form.cep}
                      onChange={e => set("cep", e.target.value)}
                      onBlur={e => buscarCep(e.target.value)}
                      placeholder="00000-000"
                    />
                    {cepLoading && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-muted-foreground" />}
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <Label>Logradouro</Label>
                  <Input value={form.logradouro} onChange={e => set("logradouro", e.target.value)} />
                </div>
                <div>
                  <Label>Número</Label>
                  <Input value={form.numero} onChange={e => set("numero", e.target.value)} />
                </div>
                <div>
                  <Label>Complemento</Label>
                  <Input value={form.complemento} onChange={e => set("complemento", e.target.value)} />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input value={form.bairro} onChange={e => set("bairro", e.target.value)} />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input value={form.cidade} onChange={e => set("cidade", e.target.value)} />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input value={form.estado} onChange={e => set("estado", e.target.value)} maxLength={2} placeholder="UF" />
                </div>
              </div>
          </div>

            {/* Seção: Vincular Cadastros */}
            {branches.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-3 border-b pb-1">Vincular Cadastros</h3>
                <p className="text-sm text-muted-foreground mb-3">Deseja importar dados da Matriz para esta nova filial?</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.importar_produtos} onCheckedChange={v => set("importar_produtos", !!v)} id="imp_prod" />
                    <label htmlFor="imp_prod" className="text-sm cursor-pointer">Importar Produtos da Matriz</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.importar_contas} onCheckedChange={v => set("importar_contas", !!v)} id="imp_contas" />
                    <label htmlFor="imp_contas" className="text-sm cursor-pointer">Importar Contas Bancárias da Matriz</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.importar_formas} onCheckedChange={v => set("importar_formas", !!v)} id="imp_formas" />
                    <label htmlFor="imp_formas" className="text-sm cursor-pointer">Importar Formas de Pagamento da Matriz</label>
                  </div>
                </div>
              </div>
            )}

        </div>
        <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.nome || createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Filial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excluir Filial Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir filial "{deleteTarget?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os dados vinculados a esta filial serão desvinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportarProdutosLojaDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
