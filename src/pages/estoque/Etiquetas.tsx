import { useState } from "react";
import { Tag, Plus, Printer, Search, Eye, Pencil, Trash2 } from "lucide-react";
import GerarEtiquetasDialog from "@/components/GerarEtiquetasDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const PADROES = ["Indefinido", "Pimaco", "Colacril", "Personalizado"];
const TAMANHOS_PAGINA = ["A4 – 21,0 X 29,7 cm", "Carta – 21,6 X 27,9 cm", "Personalizado"];
const FONTES = ["Times New Roman", "Arial", "Courier New", "Verdana", "Helvetica"];
const TAMANHOS_FONTE = ["8pt", "9pt", "10pt", "11pt", "12pt", "14pt", "16pt"];
const SIM_NAO = ["Sim", "Não"];
const TAMANHOS_FONTE_VALOR = ["Padrão", "Pequeno", "Grande"];
const POSICOES_BARRAS = ["Superior", "Inferior", "Esquerda", "Direita"];

interface EtiquetaModelo {
  id: string;
  nome: string;
  tamanho_pagina: string;
  padrao_etiqueta: string;
  margem_superior_cm: number;
  margem_lateral_cm: number;
  densidade_vertical_cm: number;
  densidade_horizontal_cm: number;
  altura_etiqueta_cm: number;
  largura_etiqueta_cm: number;
  fonte_etiqueta: string;
  tamanho_fonte: string;
  limite_caracteres: number;
  colunas: number;
  linhas: number;
  descricao_topo: string;
  exibir_codigo_interno: string;
  exibir_codigo_barras: string;
  exibir_numero_codigo_barras: string;
  exibir_valor_produto: string;
  tamanho_fonte_valor: string;
  posicao_codigo_barras: string;
  criado_em: string;
  atualizado_em: string;
}

const defaultForm = {
  nome: "",
  padrao_etiqueta: "Indefinido",
  margem_superior_cm: "0",
  margem_lateral_cm: "0",
  densidade_vertical_cm: "0",
  densidade_horizontal_cm: "0",
  altura_etiqueta_cm: "0",
  largura_etiqueta_cm: "0",
  fonte_etiqueta: "Times New Roman",
  tamanho_fonte: "10pt",
  limite_caracteres: "0",
  colunas: "2",
  linhas: "7",
  tamanho_pagina: TAMANHOS_PAGINA[0],
  descricao_topo: "",
  exibir_codigo_interno: "Sim",
  exibir_codigo_barras: "Sim",
  exibir_numero_codigo_barras: "Não",
  exibir_valor_produto: "Sim",
  tamanho_fonte_valor: "Padrão",
  posicao_codigo_barras: "Superior",
};

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}

function SelectField({ label, value, onChange, options, disabled }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
        <SelectContent className="bg-popover border-border z-50">
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

interface NumFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  step?: string;
}

function NumField({ label, value, onChange, disabled, step }: NumFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type="number" step={step || "0.01"} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="bg-secondary/50" />
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
}

function TextField({ label, value, onChange, disabled, required }: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}{required && " *"}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="bg-secondary/50" />
    </div>
  );
}

export default function Etiquetas() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editing, setEditing] = useState<EtiquetaModelo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EtiquetaModelo | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [gerarOpen, setGerarOpen] = useState(false);

  const setField = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const { data: modelos = [], isLoading } = useQuery({
    queryKey: ["etiquetas_modelos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("etiquetas_modelos" as any)
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as unknown as EtiquetaModelo[];
    },
  });

  const filtered = modelos.filter((m) =>
    !search || m.nome.toLowerCase().includes(search.toLowerCase())
  );

  const loadForm = (m: EtiquetaModelo) => {
    setForm({
      nome: m.nome,
      padrao_etiqueta: m.padrao_etiqueta || "Indefinido",
      margem_superior_cm: String(m.margem_superior_cm || 0),
      margem_lateral_cm: String(m.margem_lateral_cm || 0),
      densidade_vertical_cm: String(m.densidade_vertical_cm || 0),
      densidade_horizontal_cm: String(m.densidade_horizontal_cm || 0),
      altura_etiqueta_cm: String(m.altura_etiqueta_cm || 0),
      largura_etiqueta_cm: String(m.largura_etiqueta_cm || 0),
      fonte_etiqueta: m.fonte_etiqueta || "Times New Roman",
      tamanho_fonte: m.tamanho_fonte || "10pt",
      limite_caracteres: String(m.limite_caracteres || 0),
      colunas: String(m.colunas || 2),
      linhas: String(m.linhas || 7),
      tamanho_pagina: m.tamanho_pagina || TAMANHOS_PAGINA[0],
      descricao_topo: m.descricao_topo || "",
      exibir_codigo_interno: m.exibir_codigo_interno || "Sim",
      exibir_codigo_barras: m.exibir_codigo_barras || "Sim",
      exibir_numero_codigo_barras: m.exibir_numero_codigo_barras || "Não",
      exibir_valor_produto: m.exibir_valor_produto || "Sim",
      tamanho_fonte_valor: m.tamanho_fonte_valor || "Padrão",
      posicao_codigo_barras: m.posicao_codigo_barras || "Superior",
    });
  };

  const openAdd = () => {
    setEditing(null);
    setViewMode(false);
    setForm({ ...defaultForm });
    setDialogOpen(true);
  };

  const openEdit = (m: EtiquetaModelo) => {
    setEditing(m);
    setViewMode(false);
    loadForm(m);
    setDialogOpen(true);
  };

  const openView = (m: EtiquetaModelo) => {
    setEditing(m);
    setViewMode(true);
    loadForm(m);
    setDialogOpen(true);
  };

  const buildPayload = () => ({
    nome: form.nome.trim(),
    padrao_etiqueta: form.padrao_etiqueta,
    margem_superior_cm: parseFloat(form.margem_superior_cm) || 0,
    margem_lateral_cm: parseFloat(form.margem_lateral_cm) || 0,
    densidade_vertical_cm: parseFloat(form.densidade_vertical_cm) || 0,
    densidade_horizontal_cm: parseFloat(form.densidade_horizontal_cm) || 0,
    altura_etiqueta_cm: parseFloat(form.altura_etiqueta_cm) || 0,
    largura_etiqueta_cm: parseFloat(form.largura_etiqueta_cm) || 0,
    fonte_etiqueta: form.fonte_etiqueta,
    tamanho_fonte: form.tamanho_fonte,
    limite_caracteres: parseInt(form.limite_caracteres) || 0,
    colunas: parseInt(form.colunas) || 1,
    linhas: parseInt(form.linhas) || 1,
    tamanho_pagina: form.tamanho_pagina,
    descricao_topo: form.descricao_topo,
    exibir_codigo_interno: form.exibir_codigo_interno,
    exibir_codigo_barras: form.exibir_codigo_barras,
    exibir_numero_codigo_barras: form.exibir_numero_codigo_barras,
    exibir_valor_produto: form.exibir_valor_produto,
    tamanho_fonte_valor: form.tamanho_fonte_valor,
    posicao_codigo_barras: form.posicao_codigo_barras,
  });

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    const payload = buildPayload();

    if (editing) {
      const { error } = await supabase
        .from("etiquetas_modelos" as any)
        .update(payload as any)
        .eq("id", editing.id);
      if (error) toast.error("Erro: " + error.message);
      else toast.success("Modelo atualizado!");
    } else {
      const { data: inserted, error } = await supabase
        .from("etiquetas_modelos" as any)
        .insert(payload as any)
        .select()
        .single();
      if (error) {
        toast.error("Erro: " + error.message);
      } else {
        toast.success("Modelo adicionado!");
        const newModel = inserted as unknown as EtiquetaModelo;
        setEditing(newModel);
        setViewMode(false);
        queryClient.invalidateQueries({ queryKey: ["etiquetas_modelos"] });
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["etiquetas_modelos"] });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("etiquetas_modelos" as any)
      .delete()
      .eq("id", deleteTarget.id);
    if (error) toast.error("Erro: " + error.message);
    else toast.success("Modelo excluído!");
    setDeleteTarget(null);
    queryClient.invalidateQueries({ queryKey: ["etiquetas_modelos"] });
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Tag className="h-6 w-6 text-primary" /> Etiquetas
        </h1>
        <p className="text-sm text-muted-foreground">Crie modelos de etiquetas de produtos para impressão em vários padrões diferentes.</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button onClick={openAdd} className="gap-1.5">
            <Plus className="h-4 w-4" /> Adicionar modelo
          </Button>
          <Button variant="outline" className="gap-1.5 text-foreground border-border hover:bg-secondary/60" onClick={() => setGerarOpen(true)}>
            <Printer className="h-4 w-4" /> Gerar etiquetas
          </Button>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs text-muted-foreground leading-relaxed">
        Crie modelos de etiquetas de produtos para impressão em vários padrões diferentes.
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tamanho da página</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Nenhum modelo de etiqueta encontrado.</td></tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{m.nome}</td>
                  <td className="px-4 py-3 text-foreground">{m.tamanho_pagina}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-info/40 bg-info/10 hover:bg-info/20 text-info" onClick={() => openView(m)} title="Visualizar">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-warning/40 bg-warning/10 hover:bg-warning/20 text-warning" onClick={() => openEdit(m)} title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-destructive/40 bg-destructive/10 hover:bg-destructive/20 text-destructive" onClick={() => setDeleteTarget(m)} title="Excluir">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-4 py-2 text-xs text-muted-foreground bg-secondary/20">
            Mostrando 1 a {filtered.length} de um total de {filtered.length}
          </div>
        )}
      </div>

      {/* Add/Edit/View Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {viewMode ? "Visualizar Modelo" : editing ? "Editar Modelo" : "Adicionar Modelo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Row 1: Padrão, Nome, Margem superior */}
            <div className="grid grid-cols-3 gap-4">
              <SelectField label="Padrão de etiqueta" value={form.padrao_etiqueta} onChange={(v) => setField("padrao_etiqueta", v)} options={PADROES} disabled={viewMode} />
              <TextField label="Nome da etiqueta" value={form.nome} onChange={(v) => setField("nome", v)} disabled={viewMode} required />
              <NumField label="Margem superior (cm)" value={form.margem_superior_cm} onChange={(v) => setField("margem_superior_cm", v)} disabled={viewMode} />
            </div>

            {/* Row 2: Margem lateral, Densidade vertical, Densidade horizontal */}
            <div className="grid grid-cols-3 gap-4">
              <NumField label="Margem lateral (cm)" value={form.margem_lateral_cm} onChange={(v) => setField("margem_lateral_cm", v)} disabled={viewMode} />
              <NumField label="Densidade vertical (cm)" value={form.densidade_vertical_cm} onChange={(v) => setField("densidade_vertical_cm", v)} disabled={viewMode} />
              <NumField label="Densidade horizontal (cm)" value={form.densidade_horizontal_cm} onChange={(v) => setField("densidade_horizontal_cm", v)} disabled={viewMode} />
            </div>

            {/* Row 3: Altura, Largura, Fonte */}
            <div className="grid grid-cols-3 gap-4">
              <NumField label="Altura da etiqueta (cm)" value={form.altura_etiqueta_cm} onChange={(v) => setField("altura_etiqueta_cm", v)} disabled={viewMode} />
              <NumField label="Largura da etiqueta (cm)" value={form.largura_etiqueta_cm} onChange={(v) => setField("largura_etiqueta_cm", v)} disabled={viewMode} />
              <SelectField label="Fonte da etiqueta" value={form.fonte_etiqueta} onChange={(v) => setField("fonte_etiqueta", v)} options={FONTES} disabled={viewMode} />
            </div>

            {/* Row 4: Tamanho fonte, Limite caracteres, Colunas */}
            <div className="grid grid-cols-3 gap-4">
              <SelectField label="Tamanho de fonte" value={form.tamanho_fonte} onChange={(v) => setField("tamanho_fonte", v)} options={TAMANHOS_FONTE} disabled={viewMode} />
              <NumField label="Limite caracteres produto" value={form.limite_caracteres} onChange={(v) => setField("limite_caracteres", v)} disabled={viewMode} step="1" />
              <NumField label="Colunas na página" value={form.colunas} onChange={(v) => setField("colunas", v)} disabled={viewMode} step="1" />
            </div>

            {/* Row 5: Linhas, Tamanho página, Descrição topo */}
            <div className="grid grid-cols-3 gap-4">
              <NumField label="Linhas na página" value={form.linhas} onChange={(v) => setField("linhas", v)} disabled={viewMode} step="1" />
              <SelectField label="Tamanho da página" value={form.tamanho_pagina} onChange={(v) => setField("tamanho_pagina", v)} options={TAMANHOS_PAGINA} disabled={viewMode} />
              <TextField label="Descrição no topo" value={form.descricao_topo} onChange={(v) => setField("descricao_topo", v)} disabled={viewMode} />
            </div>

            {/* Row 6: Exibir código interno, Exibir código barras, Exibir número código barras */}
            <div className="grid grid-cols-3 gap-4">
              <SelectField label="Exibir código interno" value={form.exibir_codigo_interno} onChange={(v) => setField("exibir_codigo_interno", v)} options={SIM_NAO} disabled={viewMode} />
              <SelectField label="Exibir código de barras" value={form.exibir_codigo_barras} onChange={(v) => setField("exibir_codigo_barras", v)} options={SIM_NAO} disabled={viewMode} />
              <SelectField label="Exibir número do código de barras" value={form.exibir_numero_codigo_barras} onChange={(v) => setField("exibir_numero_codigo_barras", v)} options={SIM_NAO} disabled={viewMode} />
            </div>

            {/* Row 7: Exibir valor, Tamanho fonte valor, Posição código barras */}
            <div className="grid grid-cols-3 gap-4">
              <SelectField label="Exibir valor do produto" value={form.exibir_valor_produto} onChange={(v) => setField("exibir_valor_produto", v)} options={SIM_NAO} disabled={viewMode} />
              <SelectField label="Tamanho da fonte do valor" value={form.tamanho_fonte_valor} onChange={(v) => setField("tamanho_fonte_valor", v)} options={TAMANHOS_FONTE_VALOR} disabled={viewMode} />
              <SelectField label="Posição do código de barras" value={form.posicao_codigo_barras} onChange={(v) => setField("posicao_codigo_barras", v)} options={POSICOES_BARRAS} disabled={viewMode} />
            </div>
          </div>
          <DialogFooter>
            {viewMode ? (
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-foreground border-border">Fechar</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-foreground border-border">Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : editing ? "Atualizar" : "Salvar"}</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir modelo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>"{deleteTarget?.nome}"</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <GerarEtiquetasDialog open={gerarOpen} onOpenChange={setGerarOpen} modelos={modelos} />
    </div>
  );
}
