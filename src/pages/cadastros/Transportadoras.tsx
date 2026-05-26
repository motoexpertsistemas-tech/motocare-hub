import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, Search, Pencil, Trash2, Truck, Upload, Download, FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useEmpresa } from "@/contexts/EmpresaContext";

const emptyForm = {
  tipo: "pessoa_juridica", ativo: "true",
  nome: "", cnpj: "", inscricao_estadual: "", telefone: "", whatsapp: "", email: "",
  contato_nome: "", cep: "", logradouro: "", numero: "", complemento: "", bairro: "",
  cidade: "", estado: "", tipo_frete: "", valor_frete_padrao: "", prazo_entrega_dias: "",
  website: "", observacoes: "",
};

export default function Transportadoras() {
  const queryClient = useQueryClient();
  const { empresaId } = useEmpresa();
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const { data: transportadoras = [], isLoading } = useQuery({
    queryKey: ["transportadoras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transportadoras" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = {
        nome: form.nome,
        tipo: form.tipo || "pessoa_juridica",
        ativo: form.ativo === "true",
        cnpj: form.cnpj || null,
        inscricao_estadual: form.inscricao_estadual || null,
        telefone: form.telefone || null,
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
        tipo_frete: form.tipo_frete || null,
        valor_frete_padrao: form.valor_frete_padrao ? Number(form.valor_frete_padrao) : 0,
        prazo_entrega_dias: form.prazo_entrega_dias ? Number(form.prazo_entrega_dias) : null,
        website: form.website || null,
        observacoes: form.observacoes || null,
        empresa_id: empresaId,
      };
      if (editingId) {
        const { error } = await supabase.from("transportadoras" as any).update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("transportadoras" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transportadoras"] });
      toast.success(editingId ? "Transportadora atualizada!" : "Transportadora cadastrada!");
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transportadoras" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transportadoras"] });
      toast.success("Transportadora excluída!");
    },
  });

  const openEdit = (t: any) => {
    setForm({
      tipo: t.tipo || "pessoa_juridica",
      ativo: t.ativo !== false ? "true" : "false",
      nome: t.nome || "",
      cnpj: t.cnpj || "",
      inscricao_estadual: t.inscricao_estadual || "",
      telefone: t.telefone || "",
      whatsapp: t.whatsapp || "",
      email: t.email || "",
      contato_nome: t.contato_nome || "",
      cep: t.cep || "",
      logradouro: t.logradouro || "",
      numero: t.numero || "",
      complemento: t.complemento || "",
      bairro: t.bairro || "",
      cidade: t.cidade || "",
      estado: t.estado || "",
      tipo_frete: t.tipo_frete || "",
      valor_frete_padrao: t.valor_frete_padrao?.toString() || "",
      prazo_entrega_dias: t.prazo_entrega_dias?.toString() || "",
      website: t.website || "",
      observacoes: t.observacoes || "",
    });
    setEditingId(t.id);
    setDialogOpen(true);
  };

  const filtradas = transportadoras.filter((t: any) => {
    const term = busca.toLowerCase();
    return (t.nome || "").toLowerCase().includes(term) || (t.cnpj || "").includes(busca);
  });

  const f = form;
  const setF = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  // CNPJ auto lookup
  const cnpjTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const formRef = useRef(form);
  formRef.current = form;

  const handleCnpjChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 14);
    setF({ cnpj: digits });
    if (cnpjTimerRef.current) clearTimeout(cnpjTimerRef.current);
    if (digits.length === 14) {
      cnpjTimerRef.current = setTimeout(async () => {
        if (formRef.current.tipo !== "pessoa_juridica") return;
        setCnpjLoading(true);
        try {
          const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
          if (!res.ok) throw new Error("CNPJ não encontrado");
          const data = await res.json();
          setForm((prev) => ({
            ...prev,
            nome: (data.razao_social || data.nome_fantasia || prev.nome).toUpperCase(),
            email: data.email?.toLowerCase() || prev.email,
            telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.substring(0,2)}) ${data.ddd_telefone_1.substring(2)}` : prev.telefone,
            logradouro: (data.logradouro || "").toUpperCase() || prev.logradouro,
            numero: data.numero || prev.numero,
            complemento: (data.complemento || "").toUpperCase() || prev.complemento,
            bairro: (data.bairro || "").toUpperCase() || prev.bairro,
            cidade: (data.municipio || "").toUpperCase() || prev.cidade,
            estado: (data.uf || "").toUpperCase() || prev.estado,
            cep: String(data.cep || "").replace(/\D/g, "") || prev.cep,
          }));
          toast.success("Dados do CNPJ preenchidos automaticamente!");
        } catch {
          toast.error("Não foi possível buscar o CNPJ. Verifique o número.");
        } finally {
          setCnpjLoading(false);
        }
      }, 800);
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
            }));
          }
        } catch {}
      }, 600);
    }
  };

  // Export
  const handleExport = () => {
    if (transportadoras.length === 0) { toast.error("Nenhuma transportadora para exportar."); return; }
    const rows = transportadoras.map((t: any) => ({
      "Nome": t.nome || "", "CNPJ": t.cnpj || "", "IE": t.inscricao_estadual || "",
      "Telefone": t.telefone || "", "WhatsApp": t.whatsapp || "", "Email": t.email || "",
      "Contato": t.contato_nome || "", "CEP": t.cep || "", "Logradouro": t.logradouro || "",
      "Número": t.numero || "", "Complemento": t.complemento || "", "Bairro": t.bairro || "",
      "Cidade": t.cidade || "", "Estado": t.estado || "", "Tipo Frete": t.tipo_frete || "",
      "Valor Frete Padrão": t.valor_frete_padrao || "", "Prazo Entrega (dias)": t.prazo_entrega_dias || "",
      "Website": t.website || "", "Observações": t.observacoes || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transportadoras");
    XLSX.writeFile(wb, "transportadoras.xlsx");
    toast.success("Exportação concluída!");
  };

  // Import
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
        const payload: any = {
          nome: row["Nome"] || "SEM NOME",
          cnpj: row["CNPJ"] || null,
          inscricao_estadual: row["IE"] || null,
          telefone: row["Telefone"] || null,
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
          tipo_frete: row["Tipo Frete"] || null,
          valor_frete_padrao: row["Valor Frete Padrão"] || row["Valor Frete Padrao"] ? Number(row["Valor Frete Padrão"] || row["Valor Frete Padrao"]) : 0,
          prazo_entrega_dias: row["Prazo Entrega (dias)"] ? Number(row["Prazo Entrega (dias)"]) : null,
          website: row["Website"] || null,
          observacoes: row["Observações"] || row["Observacoes"] || null,
          empresa_id: empresaId,
        };
        if (payload.cnpj) {
          const { error } = await supabase.from("transportadoras" as any).upsert(payload, { onConflict: "cnpj", ignoreDuplicates: false });
          if (!error) count++;
        } else {
          const { error } = await supabase.from("transportadoras" as any).insert(payload);
          if (!error) count++;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["transportadoras"] });
      toast.success(`${count} transportadora(s) importada(s) de ${rows.length}!`);
    } catch (err: any) {
      toast.error("Erro ao importar: " + err.message);
    }
    if (importFileRef.current) importFileRef.current.value = "";
  }, [queryClient, empresaId]);

  // Template download
  const handleDownloadTemplate = () => {
    const headers = [
      "Nome", "CNPJ", "IE", "Telefone", "WhatsApp", "Email", "Contato",
      "CEP", "Logradouro", "Número", "Complemento", "Bairro", "Cidade", "Estado",
      "Tipo Frete", "Valor Frete Padrão", "Prazo Entrega (dias)", "Website", "Observações",
    ];
    const example = [
      "TRANSLOG EXPRESS", "12.345.678/0001-90", "", "(11) 3333-0001", "(11) 99999-0000",
      "contato@translog.com", "JOÃO SILVA", "01310-100", "AV PAULISTA", "1000", "SALA 5",
      "BELA VISTA", "SÃO PAULO", "SP", "CIF", "25.00", "3", "www.translog.com", "",
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "modelo_transportadoras.xlsx");
    toast.success("Planilha modelo baixada!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" /> Transportadoras
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie as transportadoras parceiras</p>
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
              <Button><Plus className="h-4 w-4 mr-1" /> Nova Transportadora</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Transportadora" : "Nova Transportadora"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Tipo de transportadora *</Label>
                    <Select value={f.tipo} onValueChange={(v) => setF({ tipo: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pessoa_fisica">Pessoa física</SelectItem>
                        <SelectItem value="pessoa_juridica">Pessoa jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Situação</Label>
                    <Select value={f.ativo} onValueChange={(v) => setF({ ativo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Nome *</Label><Input value={f.nome} onChange={(e) => setF({ nome: e.target.value.toUpperCase() })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Label>CNPJ / CPF</Label>
                    <Input value={f.cnpj} onChange={(e) => handleCnpjChange(e.target.value)} placeholder={f.tipo === "pessoa_fisica" ? "000.000.000-00" : "00.000.000/0000-00"} />
                    {cnpjLoading && <span className="absolute right-3 top-8 text-xs text-muted-foreground animate-pulse">Buscando...</span>}
                  </div>
                  <div><Label>IE</Label><Input value={f.inscricao_estadual} onChange={(e) => setF({ inscricao_estadual: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Telefone</Label><Input value={f.telefone} onChange={(e) => setF({ telefone: e.target.value })} /></div>
                  <div><Label>WhatsApp</Label><Input value={f.whatsapp} onChange={(e) => setF({ whatsapp: e.target.value })} /></div>
                  <div><Label>E-mail</Label><Input value={f.email} onChange={(e) => setF({ email: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Contato</Label><Input value={f.contato_nome} onChange={(e) => setF({ contato_nome: e.target.value.toUpperCase() })} /></div>
                </div>
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
                  <div><Label>Tipo Frete</Label><Input value={f.tipo_frete} onChange={(e) => setF({ tipo_frete: e.target.value })} placeholder="CIF, FOB" /></div>
                  <div><Label>Valor Frete Padrão (R$)</Label><Input type="number" value={f.valor_frete_padrao} onChange={(e) => setF({ valor_frete_padrao: e.target.value })} /></div>
                  <div><Label>Prazo Entrega (dias)</Label><Input type="number" value={f.prazo_entrega_dias} onChange={(e) => setF({ prazo_entrega_dias: e.target.value })} /></div>
                </div>
                <div><Label>Website</Label><Input value={f.website} onChange={(e) => setF({ website: e.target.value })} /></div>
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

      {/* Template hint */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3 flex-wrap">
        <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
        <p className="text-sm text-muted-foreground">
          Se preferir, <span className="font-semibold text-primary cursor-pointer hover:underline" onClick={handleDownloadTemplate}>baixe nossa planilha padrão</span>, preencha com seus dados e envie para o sistema clicando em <strong>Importar</strong>.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou CNPJ..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {[
          { label: "Total", value: transportadoras.length },
          { label: "Ativas", value: transportadoras.filter((t: any) => t.ativo).length },
          { label: "Com website", value: transportadoras.filter((t: any) => t.website).length },
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
                <TableHead>Tipo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ/CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Tipo Frete</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtradas.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma transportadora encontrada</TableCell></TableRow>
              ) : (
                filtradas.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Badge variant="outline">{t.tipo === "pessoa_fisica" ? "PF" : "PJ"}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{t.nome}</TableCell>
                    <TableCell className="font-mono text-xs">{t.cnpj || "—"}</TableCell>
                    <TableCell>{t.telefone || "—"}</TableCell>
                    <TableCell>{t.cidade ? `${t.cidade}${t.estado ? ` - ${t.estado}` : ""}` : "—"}</TableCell>
                    <TableCell>{t.tipo_frete || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={t.ativo ? "default" : "secondary"}>
                        {t.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => { if (confirm("Excluir transportadora?")) deleteMut.mutate(t.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
