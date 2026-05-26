import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Truck, Plus, Search, Phone, Mail, MapPin, Globe, Edit2, Trash2, Star, Download, Upload, FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";

const emptyForm = {
  tipo_pessoa: "juridica" as string,
  nome_completo: "",
  cpf: "",
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  inscricao_estadual: "",
  telefone: "",
  whatsapp: "",
  email: "",
  contato_nome: "",
  
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  categoria: "",
  prazo_entrega_dias: "",
  condicao_pagamento: "",
  forma_pagamento: "",
  desconto_padrao: "",
  frete_tipo: "",
  pedido_minimo: "",
  banco: "",
  agencia: "",
  conta: "",
  pix: "",
  website: "",
  catalogo_url: "",
  observacoes: "",
};

export default function Fornecedores() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: fornecedores = [], isLoading } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .order("created_at", { ascending: false });
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
        contato_nome: form.contato_nome || null,
        
        cep: form.cep || null,
        logradouro: form.logradouro || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        categoria: form.categoria || null,
        prazo_entrega_dias: form.prazo_entrega_dias ? Number(form.prazo_entrega_dias) : null,
        condicao_pagamento: form.condicao_pagamento || null,
        forma_pagamento: form.forma_pagamento || null,
        desconto_padrao: form.desconto_padrao ? Number(form.desconto_padrao) : 0,
        frete_tipo: form.frete_tipo || null,
        pedido_minimo: form.pedido_minimo ? Number(form.pedido_minimo) : 0,
        banco: form.banco || null,
        agencia: form.agencia || null,
        conta: form.conta || null,
        pix: form.pix || null,
        website: form.website || null,
        catalogo_url: form.catalogo_url || null,
        observacoes: form.observacoes || null,
      };
      if (form.tipo_pessoa === "fisica") {
        payload.nome_completo = form.nome_completo;
        payload.cpf = form.cpf || null;
      } else {
        payload.razao_social = form.razao_social;
        payload.nome_fantasia = form.nome_fantasia || null;
        payload.cnpj = form.cnpj || null;
        payload.inscricao_estadual = form.inscricao_estadual || null;
      }

      if (editingId) {
        const { error } = await supabase.from("fornecedores").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fornecedores").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast.success(editingId ? "Fornecedor atualizado!" : "Fornecedor cadastrado!");
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fornecedores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast.success("Fornecedor excluído!");
    },
  });

  const openEdit = (f: any) => {
    setForm({
      tipo_pessoa: f.tipo_pessoa,
      nome_completo: f.nome_completo || "",
      cpf: f.cpf || "",
      razao_social: f.razao_social || "",
      nome_fantasia: f.nome_fantasia || "",
      cnpj: f.cnpj || "",
      inscricao_estadual: f.inscricao_estadual || "",
      telefone: f.telefone,
      whatsapp: f.whatsapp || "",
      email: f.email || "",
      contato_nome: f.contato_nome || "",
      
      cep: f.cep || "",
      logradouro: f.logradouro || "",
      numero: f.numero || "",
      complemento: f.complemento || "",
      bairro: f.bairro || "",
      cidade: f.cidade || "",
      estado: f.estado || "",
      categoria: f.categoria || "",
      prazo_entrega_dias: f.prazo_entrega_dias?.toString() || "",
      condicao_pagamento: f.condicao_pagamento || "",
      forma_pagamento: f.forma_pagamento || "",
      desconto_padrao: f.desconto_padrao?.toString() || "",
      frete_tipo: f.frete_tipo || "",
      pedido_minimo: f.pedido_minimo?.toString() || "",
      banco: f.banco || "",
      agencia: f.agencia || "",
      conta: f.conta || "",
      pix: f.pix || "",
      website: f.website || "",
      catalogo_url: f.catalogo_url || "",
      observacoes: f.observacoes || "",
    });
    setEditingId(f.id);
    setDialogOpen(true);
  };

  const filtered = fornecedores.filter((f: any) => {
    const term = search.toLowerCase();
    const name = (f.razao_social || f.nome_fantasia || f.nome_completo || "").toLowerCase();
    return name.includes(term) || (f.telefone || "").includes(term) || (f.cnpj || "").includes(term);
  });

  const detailItem = detailId ? fornecedores.find((f: any) => f.id === detailId) : null;

  const f = form;
  const setF = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  // CNPJ mask
  const formatCnpj = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  // Auto CNPJ lookup
  const cnpjTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);

  const handleCnpjChange = (raw: string) => {
    const masked = formatCnpj(raw);
    setF({ cnpj: masked });

    const digits = masked.replace(/\D/g, "");
    if (cnpjTimerRef.current) clearTimeout(cnpjTimerRef.current);

    if (digits.length === 14) {
      cnpjTimerRef.current = setTimeout(async () => {
        setCnpjLoading(true);
        try {
          const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
          if (!res.ok) throw new Error("CNPJ não encontrado");
          const data = await res.json();
          setForm((prev) => ({
            ...prev,
            razao_social: (data.razao_social || "").toUpperCase(),
            nome_fantasia: (data.nome_fantasia || "").toUpperCase(),
            cep: data.cep?.replace(/\D/g, "") || prev.cep,
            logradouro: (data.logradouro || "").toUpperCase(),
            numero: data.numero || prev.numero,
            complemento: (data.complemento || "").toUpperCase(),
            bairro: (data.bairro || "").toUpperCase(),
            cidade: (data.municipio || "").toUpperCase(),
            estado: (data.uf || "").toUpperCase(),
            telefone: data.ddd_telefone_1?.replace(/\D/g, "") || prev.telefone,
            email: (data.email || "").toUpperCase() || prev.email,
          }));
          toast.success("Dados do CNPJ preenchidos automaticamente!");
        } catch {
          toast.error("Não foi possível consultar o CNPJ");
        } finally {
          setCnpjLoading(false);
        }
      }, 600);
    }
  };

  // CEP auto lookup
  const cepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCepChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    setF({ cep: digits });

    if (cepTimerRef.current) clearTimeout(cepTimerRef.current);
    if (digits.length === 8) {
      cepTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
          const data = await res.json();
          if (!data.erro) {
            setForm((prev) => ({
              ...prev,
              logradouro: (data.logradouro || "").toUpperCase(),
              bairro: (data.bairro || "").toUpperCase(),
              cidade: (data.localidade || "").toUpperCase(),
              estado: (data.uf || "").toUpperCase(),
              complemento: (data.complemento || "").toUpperCase(),
            }));
          }
        } catch {}
      }, 600);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Tipo", "Razão Social", "Nome Fantasia", "Nome Completo", "CNPJ", "CPF", "IE",
      "Telefone", "WhatsApp", "Email", "Contato", "CEP", "Logradouro", "Número",
      "Complemento", "Bairro", "Cidade", "Estado", "Categoria", "Prazo Entrega (dias)",
      "Condição Pgto", "Forma Pgto", "Desconto Padrão", "Frete Tipo", "Pedido Mínimo",
      "Banco", "Agência", "Conta", "PIX", "Website", "Observações"
    ];
    const example = [
      "Pessoa Jurídica", "EMPRESA EXEMPLO LTDA", "EXEMPLO", "", "00.000.000/0000-00", "",
      "", "(11) 99999-0000", "(11) 99999-0000", "contato@exemplo.com", "JOÃO", "01310-100",
      "AV PAULISTA", "1000", "SALA 01", "BELA VISTA", "SÃO PAULO", "SP", "PEÇAS",
      "15", "30/60", "Boleto", "5", "CIF", "500", "Banco do Brasil", "0001", "12345-6",
      "email@pix.com", "www.exemplo.com", ""
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "modelo_fornecedores.xlsx");
    toast.success("Planilha modelo baixada!");
  };

  const importFileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (fornecedores.length === 0) { toast.error("Nenhum fornecedor para exportar."); return; }
    const rows = fornecedores.map((f: any) => ({
      "Tipo": f.tipo_pessoa === "fisica" ? "Pessoa Física" : "Pessoa Jurídica",
      "Razão Social": f.razao_social || "",
      "Nome Fantasia": f.nome_fantasia || "",
      "Nome Completo": f.nome_completo || "",
      "CNPJ": f.cnpj || "",
      "CPF": f.cpf || "",
      "IE": f.inscricao_estadual || "",
      "Telefone": f.telefone || "",
      "WhatsApp": f.whatsapp || "",
      "Email": f.email || "",
      "Contato": f.contato_nome || "",
      "CEP": f.cep || "",
      "Logradouro": f.logradouro || "",
      "Número": f.numero || "",
      "Complemento": f.complemento || "",
      "Bairro": f.bairro || "",
      "Cidade": f.cidade || "",
      "Estado": f.estado || "",
      "Categoria": f.categoria || "",
      "Prazo Entrega (dias)": f.prazo_entrega_dias || "",
      "Condição Pgto": f.condicao_pagamento || "",
      "Forma Pgto": f.forma_pagamento || "",
      "Desconto Padrão": f.desconto_padrao || "",
      "Frete Tipo": f.frete_tipo || "",
      "Pedido Mínimo": f.pedido_minimo || "",
      "Banco": f.banco || "",
      "Agência": f.agencia || "",
      "Conta": f.conta || "",
      "PIX": f.pix || "",
      "Website": f.website || "",
      "Observações": f.observacoes || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fornecedores");
    XLSX.writeFile(wb, "fornecedores.xlsx");
    toast.success("Exportação concluída!");
  };

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);
      if (rows.length === 0) { toast.error("Planilha vazia."); return; }

      let count = 0;
      for (const row of rows) {
        const tipo = (row["Tipo"] || "").toLowerCase().includes("física") ? "fisica" : "juridica";
        const payload: any = {
          tipo_pessoa: tipo,
          razao_social: row["Razão Social"] || row["Razao Social"] || null,
          nome_fantasia: row["Nome Fantasia"] || null,
          nome_completo: row["Nome Completo"] || null,
          cnpj: row["CNPJ"] || null,
          cpf: row["CPF"] || null,
          inscricao_estadual: row["IE"] || null,
          telefone: row["Telefone"] || "0000000000",
          whatsapp: row["WhatsApp"] || null,
          email: row["Email"] || null,
          contato_nome: row["Contato"] || null,
          cep: row["CEP"] || null,
          logradouro: row["Logradouro"] || null,
          numero: row["Número"] || row["Numero"] || null,
          complemento: row["Complemento"] || null,
          bairro: row["Bairro"] || null,
          cidade: row["Cidade"] || null,
          estado: row["Estado"] || null,
          categoria: row["Categoria"] || null,
          prazo_entrega_dias: row["Prazo Entrega (dias)"] ? Number(row["Prazo Entrega (dias)"]) : null,
          condicao_pagamento: row["Condição Pgto"] || row["Condicao Pgto"] || null,
          forma_pagamento: row["Forma Pgto"] || null,
          desconto_padrao: row["Desconto Padrão"] || row["Desconto Padrao"] ? Number(row["Desconto Padrão"] || row["Desconto Padrao"]) : 0,
          frete_tipo: row["Frete Tipo"] || null,
          pedido_minimo: row["Pedido Mínimo"] || row["Pedido Minimo"] ? Number(row["Pedido Mínimo"] || row["Pedido Minimo"]) : 0,
          banco: row["Banco"] || null,
          agencia: row["Agência"] || row["Agencia"] || null,
          conta: row["Conta"] || null,
          pix: row["PIX"] || null,
          website: row["Website"] || null,
          observacoes: row["Observações"] || row["Observacoes"] || null,
        };

        if (payload.cnpj) {
          const { error } = await supabase.from("fornecedores").upsert(payload, { onConflict: "cnpj", ignoreDuplicates: false });
          if (!error) count++;
        } else {
          const { error } = await supabase.from("fornecedores").insert(payload);
          if (!error) count++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast.success(`${count} fornecedor(es) importado(s) de ${rows.length}!`);
    } catch (err: any) {
      toast.error("Erro ao importar: " + err.message);
    }
    if (importFileRef.current) importFileRef.current.value = "";
  }, [queryClient]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Truck className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
          </div>
          <p className="text-sm text-muted-foreground">Cadastro e gestão de fornecedores</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
          <Button variant="outline" size="sm" onClick={() => importFileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Importar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditingId(null); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Novo Fornecedor</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={f.tipo_pessoa} onValueChange={(v) => setF({ tipo_pessoa: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fisica">Pessoa Física</SelectItem>
                        <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Categoria</Label><Input value={f.categoria} onChange={(e) => setF({ categoria: e.target.value.toUpperCase() })} placeholder="Ex: PEÇAS, PNEUS" /></div>
                </div>
                {f.tipo_pessoa === "juridica" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>CNPJ</Label><Input value={f.cnpj} onChange={(e) => handleCnpjChange(e.target.value)} placeholder="00.000.000/0000-00" /></div>
                      <div><Label>Razão Social *</Label><Input value={f.razao_social} onChange={(e) => setF({ razao_social: e.target.value.toUpperCase() })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Nome Fantasia</Label><Input value={f.nome_fantasia} onChange={(e) => setF({ nome_fantasia: e.target.value.toUpperCase() })} /></div>
                      <div><Label>Inscrição Estadual</Label><Input value={f.inscricao_estadual} onChange={(e) => setF({ inscricao_estadual: e.target.value })} /></div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Nome Completo *</Label><Input value={f.nome_completo} onChange={(e) => setF({ nome_completo: e.target.value.toUpperCase() })} /></div>
                    <div><Label>CPF</Label><Input value={f.cpf} onChange={(e) => setF({ cpf: e.target.value })} /></div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Telefone *</Label><Input value={f.telefone} onChange={(e) => setF({ telefone: e.target.value })} /></div>
                  <div><Label>WhatsApp</Label><Input value={f.whatsapp} onChange={(e) => setF({ whatsapp: e.target.value })} /></div>
                  <div><Label>E-mail</Label><Input value={f.email} onChange={(e) => setF({ email: e.target.value })} /></div>
                </div>
                <div><Label>Nome do Contato</Label><Input value={f.contato_nome} onChange={(e) => setF({ contato_nome: e.target.value.toUpperCase() })} /></div>
                <div className="grid grid-cols-4 gap-4">
                  <div><Label>CEP</Label><Input value={f.cep} onChange={(e) => handleCepChange(e.target.value)} /></div>
                  <div className="col-span-2"><Label>Logradouro</Label><Input value={f.logradouro} onChange={(e) => setF({ logradouro: e.target.value.toUpperCase() })} /></div>
                  <div><Label>Nº</Label><Input value={f.numero} onChange={(e) => setF({ numero: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div><Label>Complemento</Label><Input value={f.complemento} onChange={(e) => setF({ complemento: e.target.value.toUpperCase() })} /></div>
                  <div><Label>Bairro</Label><Input value={f.bairro} onChange={(e) => setF({ bairro: e.target.value.toUpperCase() })} /></div>
                  <div><Label>Cidade</Label><Input value={f.cidade} onChange={(e) => setF({ cidade: e.target.value.toUpperCase() })} /></div>
                  <div><Label>UF</Label><Input value={f.estado} onChange={(e) => setF({ estado: e.target.value.toUpperCase() })} maxLength={2} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Prazo Entrega (dias)</Label><Input type="number" value={f.prazo_entrega_dias} onChange={(e) => setF({ prazo_entrega_dias: e.target.value })} /></div>
                  <div><Label>Condição Pgto</Label><Input value={f.condicao_pagamento} onChange={(e) => setF({ condicao_pagamento: e.target.value })} placeholder="30/60/90" /></div>
                  <div><Label>Forma Pgto</Label><Input value={f.forma_pagamento} onChange={(e) => setF({ forma_pagamento: e.target.value })} placeholder="Boleto, PIX" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Desconto Padrão (%)</Label><Input type="number" value={f.desconto_padrao} onChange={(e) => setF({ desconto_padrao: e.target.value })} /></div>
                  <div><Label>Frete Tipo</Label><Input value={f.frete_tipo} onChange={(e) => setF({ frete_tipo: e.target.value })} placeholder="CIF, FOB" /></div>
                  <div><Label>Pedido Mínimo (R$)</Label><Input type="number" value={f.pedido_minimo} onChange={(e) => setF({ pedido_minimo: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div><Label>Banco</Label><Input value={f.banco} onChange={(e) => setF({ banco: e.target.value })} /></div>
                  <div><Label>Agência</Label><Input value={f.agencia} onChange={(e) => setF({ agencia: e.target.value })} /></div>
                  <div><Label>Conta</Label><Input value={f.conta} onChange={(e) => setF({ conta: e.target.value })} /></div>
                  <div><Label>PIX</Label><Input value={f.pix} onChange={(e) => setF({ pix: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Website</Label><Input value={f.website} onChange={(e) => setF({ website: e.target.value })} /></div>
                  <div><Label>Catálogo URL</Label><Input value={f.catalogo_url} onChange={(e) => setF({ catalogo_url: e.target.value })} /></div>
                </div>
                <div><Label>Observações</Label><Textarea value={f.observacoes} onChange={(e) => setF({ observacoes: e.target.value })} rows={2} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>
                  {editingId ? "Salvar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Template download hint */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3 flex-wrap">
        <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
        <p className="text-sm text-muted-foreground">
          Se preferir, <span className="font-semibold text-primary cursor-pointer hover:underline" onClick={handleDownloadTemplate}>baixe nossa planilha padrão</span>, preencha com seus dados e envie para o sistema clicando em <strong>Importar</strong>.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nome, CNPJ ou telefone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total", value: fornecedores.length },
          { label: "Ativos", value: fornecedores.filter((f: any) => f.ativo).length },
          { label: "Com website", value: fornecedores.filter((f: any) => f.website).length },
          { label: "Categorias", value: new Set(fornecedores.map((f: any) => f.categoria).filter(Boolean)).size },
        ].map((s) => (
          <Card key={s.label} className="glass-panel">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="glass-panel">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum fornecedor encontrado</TableCell></TableRow>
              ) : (
                filtered.map((f: any) => (
                  <TableRow key={f.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetailId(f.id)}>
                    <TableCell className="font-medium">{f.nome_fantasia || f.razao_social || f.nome_completo || "—"}</TableCell>
                    <TableCell>{f.telefone}</TableCell>
                    <TableCell>{f.email || "—"}</TableCell>
                    <TableCell>{f.cidade || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{f.categoria || "—"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm">{Number(f.nota_avaliacao || 0).toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(f)}><Edit2 className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir fornecedor?")) deleteMut.mutate(f.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!detailId} onOpenChange={(o) => { if (!o) setDetailId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Fornecedor</DialogTitle>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-3 text-sm">
              <p><strong>Nome:</strong> {detailItem.nome_fantasia || detailItem.razao_social || detailItem.nome_completo}</p>
              <p><strong>Tipo:</strong> {detailItem.tipo_pessoa === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}</p>
              {detailItem.cnpj && <p><strong>CNPJ:</strong> {detailItem.cnpj}</p>}
              <div className="flex gap-4">
                <p className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {detailItem.telefone}</p>
                {detailItem.email && <p className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {detailItem.email}</p>}
              </div>
              {detailItem.contato_nome && <p><strong>Contato:</strong> {detailItem.contato_nome}</p>}
              {detailItem.cidade && <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {detailItem.cidade}/{detailItem.estado}</p>}
              {detailItem.website && <p className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> <a href={detailItem.website} target="_blank" rel="noreferrer" className="text-primary underline">{detailItem.website}</a></p>}
              {detailItem.categoria && <p><strong>Categoria:</strong> {detailItem.categoria}</p>}
              {detailItem.condicao_pagamento && <p><strong>Cond. Pagamento:</strong> {detailItem.condicao_pagamento}</p>}
              {detailItem.prazo_entrega_dias && <p><strong>Prazo entrega:</strong> {detailItem.prazo_entrega_dias} dias</p>}
              {detailItem.observacoes && <p><strong>Obs:</strong> {detailItem.observacoes}</p>}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                <div className="text-center"><p className="text-lg font-bold text-foreground">R$ {Number(detailItem.total_gasto || 0).toFixed(2)}</p><p className="text-xs text-muted-foreground">Total gasto</p></div>
                <div className="text-center"><p className="text-lg font-bold text-foreground">{detailItem.total_compras || 0}</p><p className="text-xs text-muted-foreground">Compras</p></div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {Number(detailItem.nota_avaliacao || 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Avaliação</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
