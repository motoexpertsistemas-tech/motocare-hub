import { useState, useMemo } from "react";
import { Plus, Trash2, Search, ChevronDown, ChevronRight, Pencil, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { type DRECategoria } from "@/pages/relatorios/dreData";

const tipoOptions: { value: DRECategoria["tipo"]; label: string }[] = [
  { value: "receita", label: "Receita" },
  { value: "deducao", label: "Dedução" },
  { value: "custo", label: "Custo" },
  { value: "despesa", label: "Despesa" },
  { value: "resultado", label: "Outras" },
];

interface ConfigurarDREDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorias: DRECategoria[];
  onAddConta: (conta: DRECategoria) => void;
  onRemoveConta: (id: string) => void;
  onEditConta: (id: string, newLabel: string) => void;
}

interface GroupedData {
  group: DRECategoria;
  subgroups: { subgroup: DRECategoria; items: DRECategoria[] }[];
  directItems: DRECategoria[];
}

export default function ConfigurarDREDialog({ open, onOpenChange, categorias, onAddConta, onRemoveConta, onEditConta }: ConfigurarDREDialogProps) {
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedSubgroups, setExpandedSubgroups] = useState<Set<string>>(new Set());
  const [disabledGroups, setDisabledGroups] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newContaNome, setNewContaNome] = useState("");
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupId, setNewGroupId] = useState("");
  const [newGroupNome, setNewGroupNome] = useState("");
  const [newGroupTipo, setNewGroupTipo] = useState<DRECategoria["tipo"]>("despesa");
  const [newGroupParent, setNewGroupParent] = useState("none");

  const level1 = categorias.filter(c => c.nivel === 1);
  const level2 = categorias.filter(c => c.nivel === 2);
  const level3 = categorias.filter(c => c.nivel === 3);

  const grouped = useMemo(() => {
    const result: GroupedData[] = [];
    for (const g of level1) {
      const prefix = g.id + ".";
      const subs = level2.filter(s => s.id.startsWith(prefix));
      const subgroups = subs.map(s => ({
        subgroup: s,
        items: level3.filter(i => i.id.startsWith(s.id + ".")),
      })).filter(s => s.items.length > 0);

      const directItems = level3.filter(i => {
        if (!i.id.startsWith(prefix)) return false;
        return !subs.some(s => i.id.startsWith(s.id + "."));
      });

      if (subgroups.length > 0 || directItems.length > 0) {
        result.push({ group: g, subgroups, directItems });
      }
    }
    result.sort((a, b) => {
      const aNum = a.group.id.replace("CMV", "1.9");
      const bNum = b.group.id.replace("CMV", "1.9");
      return aNum.localeCompare(bNum, undefined, { numeric: true });
    });
    return result;
  }, [categorias, level1, level2, level3]);

  const filteredGrouped = useMemo(() => {
    if (!search) return grouped;
    const q = search.toLowerCase();
    return grouped.map(g => ({
      ...g,
      subgroups: g.subgroups.map(s => ({
        ...s,
        items: s.items.filter(i => i.label.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)),
      })).filter(s => s.items.length > 0 || s.subgroup.label.toLowerCase().includes(q)),
      directItems: g.directItems.filter(i => i.label.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)),
    })).filter(g => g.subgroups.length > 0 || g.directItems.length > 0 || g.group.label.toLowerCase().includes(q));
  }, [grouped, search]);

  const toggle = (set: Set<string>, id: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    setter(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startEdit = (id: string, label: string) => {
    setEditingId(id);
    setEditingLabel(label.replace(/^\([+-=]\)\s*/, ""));
  };

  const saveEdit = () => {
    if (editingId && editingLabel.trim()) {
      onEditConta(editingId, editingLabel.toUpperCase());
      toast.success(`Conta "${editingLabel}" atualizada`);
    }
    setEditingId(null);
    setEditingLabel("");
  };

  const handleRemove = (id: string, label: string) => {
    onRemoveConta(id);
    toast.success(`"${label}" removida`);
  };

  const handleAddInline = (parentId: string) => {
    if (!newContaNome.trim()) return;
    const prefix = parentId + ".";
    const existing = categorias
      .filter(c => c.id.startsWith(prefix))
      .map(c => parseInt(c.id.replace(prefix, "")) || 0);
    const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    const parentCat = categorias.find(c => c.id === parentId);
    const tipo = parentCat?.tipo || "despesa";

    const novaConta: DRECategoria = {
      id: `${parentId}.${nextNum}`,
      label: newContaNome.toUpperCase(),
      nivel: 3,
      tipo: tipo as DRECategoria["tipo"],
      valores: [0, 0, 0, 0, 0, 0, 0, 0],
    };
    onAddConta(novaConta);
    setNewContaNome("");
    setAddingTo(null);
    toast.success(`"${newContaNome}" adicionada`);
  };

  const cleanLabel = (label: string) => label.replace(/^\([+-=]\)\s*/, "");

  // ── Level 3 item row: id | label | edit | delete ──
  const renderItemRow = (item: DRECategoria, indent: number) => {
    const isEditing = editingId === item.id;
    return (
      <div
        key={item.id}
        className="flex items-center h-12 border-b border-border/30 hover:bg-muted/20 transition-colors group"
        style={{ paddingLeft: `${indent * 24 + 16}px`, paddingRight: 16 }}
      >
        <span className="text-xs font-mono text-muted-foreground w-14 shrink-0">{item.id}</span>

        {isEditing ? (
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <Input value={editingLabel} onChange={e => setEditingLabel(e.target.value)} className="h-8 text-sm" autoFocus onKeyDown={e => e.key === "Enter" && saveEdit()} />
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary" onClick={saveEdit}><Check className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
          </div>
        ) : (
          <span className="flex-1 text-sm truncate min-w-0">{cleanLabel(item.label)}</span>
        )}

        {!isEditing && (
          <div className="flex items-center gap-0.5 shrink-0 ml-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => startEdit(item.id, item.label)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemove(item.id, item.label)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  // ── Group / Subgroup header: id | label | edit | delete | switch | chevron ──
  const renderHeader = (item: DRECategoria, indent: number, isExpanded: boolean, onToggle: () => void) => {
    const isDisabled = disabledGroups.has(item.id);
    const isEditing = editingId === item.id;
    const isLevel1 = item.nivel === 1;

    return (
      <div
        key={item.id}
        className={`flex items-center h-12 border-b border-border/50 transition-colors ${isDisabled ? "opacity-40" : ""} ${isLevel1 ? "bg-muted/50" : "bg-muted/25"}`}
        style={{ paddingLeft: `${indent * 24 + 16}px`, paddingRight: 16 }}
      >
        <span className="text-xs font-mono text-muted-foreground w-14 shrink-0">{item.id}</span>

        {isEditing ? (
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <Input value={editingLabel} onChange={e => setEditingLabel(e.target.value)} className="h-8 text-sm font-semibold" autoFocus onKeyDown={e => e.key === "Enter" && saveEdit()} />
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary" onClick={saveEdit}><Check className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
          </div>
        ) : (
          <span className={`flex-1 text-sm truncate min-w-0 ${isLevel1 ? "font-bold" : "font-semibold"}`}>{cleanLabel(item.label)}</span>
        )}

        {!isEditing && (
          <div className="flex items-center gap-0.5 shrink-0 ml-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => startEdit(item.id, item.label)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemove(item.id, item.label)}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Switch
              checked={!isDisabled}
              onCheckedChange={() => toggle(disabledGroups, item.id, setDisabledGroups)}
              className="data-[state=checked]:bg-destructive ml-1"
            />
            <button onClick={onToggle} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground ml-0.5">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Inline add row ──
  const renderAddRow = (parentId: string, indent: number) => {
    if (addingTo === parentId) {
      return (
        <div key={`add-${parentId}`} className="flex items-center h-12 border-b border-border/30 bg-muted/10" style={{ paddingLeft: `${indent * 24 + 16}px`, paddingRight: 16 }}>
          <Plus className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
          <Input
            value={newContaNome}
            onChange={e => setNewContaNome(e.target.value)}
            placeholder="Nome da nova conta..."
            className="h-8 text-sm flex-1"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") handleAddInline(parentId); if (e.key === "Escape") { setAddingTo(null); setNewContaNome(""); } }}
          />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary ml-1" onClick={() => handleAddInline(parentId)}><Check className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-0.5" onClick={() => { setAddingTo(null); setNewContaNome(""); }}><X className="h-3.5 w-3.5" /></Button>
        </div>
      );
    }
    return (
      <button
        key={`add-btn-${parentId}`}
        onClick={() => { setAddingTo(parentId); setNewContaNome(""); }}
        className="flex items-center h-10 w-full text-left text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors text-sm border-b border-border/30"
        style={{ paddingLeft: `${indent * 24 + 16}px` }}
      >
        <Plus className="h-3.5 w-3.5 mr-2" />
        Adicionar conta
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Configurar Plano de Contas DRE</DialogTitle>
          <DialogDescription>Gerencie grupos, subgrupos e contas do demonstrativo</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar conta ou grupo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <ScrollArea className="h-[480px]">
          <div className="border rounded-lg overflow-hidden">
            {filteredGrouped.map(({ group, subgroups, directItems }) => {
              const isGroupExpanded = expandedGroups.has(group.id);

              return (
                <div key={group.id}>
                  {renderHeader(group, 0, isGroupExpanded, () => toggle(expandedGroups, group.id, setExpandedGroups))}

                  {isGroupExpanded && (
                    <>
                      {directItems.map(item => renderItemRow(item, 1))}
                      {directItems.length > 0 && renderAddRow(group.id, 1)}

                      {subgroups.map(({ subgroup, items }) => {
                        const isSubExpanded = expandedSubgroups.has(subgroup.id);
                        return (
                          <div key={subgroup.id}>
                            {renderHeader(subgroup, 1, isSubExpanded, () => toggle(expandedSubgroups, subgroup.id, setExpandedSubgroups))}
                            {isSubExpanded && (
                              <>
                                {items.map(item => renderItemRow(item, 2))}
                                {renderAddRow(subgroup.id, 2)}
                              </>
                            )}
                          </div>
                        );
                      })}

                      {subgroups.length > 0 && directItems.length === 0 && renderAddRow(group.id, 1)}
                    </>
                  )}
                </div>
              );
            })}

            {filteredGrouped.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conta encontrada</p>
            )}
          </div>

          {/* Adicionar Grupo */}
          {showAddGroup ? (
            <div className="border border-dashed border-border rounded-lg p-4 mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Classificação</Label>
                  <Input
                    value={newGroupId}
                    onChange={e => setNewGroupId(e.target.value)}
                    placeholder="Ex: 4.7"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome</Label>
                  <Input
                    value={newGroupNome}
                    onChange={e => setNewGroupNome(e.target.value)}
                    placeholder="Ex: CUSTOS DIRETOS"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={newGroupTipo} onValueChange={(v) => setNewGroupTipo(v as DRECategoria["tipo"])}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoOptions.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Grupo Pai (opcional)</Label>
                  <Select value={newGroupParent} onValueChange={setNewGroupParent}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (raiz)</SelectItem>
                      {level1.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.id} - {cleanLabel(g.label)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => { setShowAddGroup(false); setNewGroupId(""); setNewGroupNome(""); }}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground"
                  onClick={() => {
                    if (!newGroupId.trim() || !newGroupNome.trim()) {
                      toast.error("Preencha classificação e nome");
                      return;
                    }
                    if (categorias.some(c => c.id === newGroupId.trim())) {
                      toast.error("Classificação já existe");
                      return;
                    }
                    const nivel = newGroupParent === "none" ? 1 : 2;
                    const novoGrupo: DRECategoria = {
                      id: newGroupId.trim(),
                      label: `(-) ${newGroupNome.toUpperCase()}`,
                      nivel,
                      tipo: newGroupTipo,
                      valores: [0, 0, 0, 0, 0, 0, 0, 0],
                      negrito: true,
                    };
                    onAddConta(novoGrupo);
                    setShowAddGroup(false);
                    setNewGroupId("");
                    setNewGroupNome("");
                    setNewGroupParent("none");
                    toast.success(`Grupo "${newGroupNome}" criado`);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Salvar Grupo
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddGroup(true)}
              className="flex items-center justify-center gap-2 w-full h-11 mt-3 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar Grupo
            </button>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
