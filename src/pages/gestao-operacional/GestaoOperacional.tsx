import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench, ShoppingCart, Headphones, Package, Monitor, DollarSign,
  Calculator, Building2, ShoppingBag, Crown, Settings, Store,
  Shield, CreditCard, TrendingUp, Pencil, Plus, RotateCcw, Check, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSetoresEditaveis } from "@/hooks/useSetoresEditaveis";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  Wrench, ShoppingCart, Headphones, Package, Monitor, DollarSign,
  Calculator, Building: Building2, ShoppingBag, Crown, Settings, Store,
  Shield, CreditCard, TrendingUp,
};

export default function GestaoOperacional() {
  const navigate = useNavigate();
  const role = useRole();
  const isAdmin = role === "ADMIN" || role === "GERENTE";
  const { setores, updateSetorNome, updateSetorDescricao, addSetor, resetToDefaults } = useSetoresEditaveis();
  const [completados, setCompletados] = useState<Record<string, string[]>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoDesc, setNovoDesc] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("gestao-operacional-tarefas");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedDate = localStorage.getItem("gestao-operacional-date");
        const today = new Date().toDateString();
        if (savedDate !== today) {
          localStorage.setItem("gestao-operacional-date", today);
          localStorage.removeItem("gestao-operacional-tarefas");
          setCompletados({});
        } else {
          setCompletados(parsed);
        }
      } catch { setCompletados({}); }
    }
  }, []);

  const startEdit = (e: React.MouseEvent, setorId: string, nome: string, desc: string) => {
    e.stopPropagation();
    setEditingId(setorId);
    setEditNome(nome);
    setEditDesc(desc);
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId && editNome.trim()) {
      updateSetorNome(editingId, editNome.trim());
      updateSetorDescricao(editingId, editDesc.trim());
      toast.success("Setor atualizado!");
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleAddSetor = () => {
    if (novoNome.trim()) {
      addSetor(novoNome.trim(), novoDesc.trim() || "Novo setor");
      setNovoNome("");
      setNovoDesc("");
      setShowAddDialog(false);
      toast.success("Setor adicionado!");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-zinc-900 text-white p-6 md:p-8 rounded-b-2xl mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Gestão Operacional</h1>
              <p className="text-zinc-400 text-sm">Sistema de Controle de Tarefas Diárias</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-zinc-900" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> Novo Setor
              </Button>
              <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => { resetToDefaults(); toast.success("Restaurado ao padrão!"); }}>
                <RotateCcw className="h-4 w-4 mr-1" /> Restaurar
              </Button>
            </div>
          )}
        </div>
        <p className="text-zinc-300 text-sm mt-3">
          Acompanhe e gerencie as atividades de todos os setores da sua empresa de motopeças e oficina.
        </p>
      </div>

      {/* Setores e Cargos */}
      <div className="px-4 md:px-6 pb-8">
        <h2 className="text-xl font-bold mb-1">Setores e Cargos</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Selecione um setor para visualizar e gerenciar as tarefas diárias
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {setores.map((setor) => {
            const Icon = iconMap[setor.icon] || Building2;
            const done = completados[setor.id]?.length || 0;
            const total = setor.tarefas.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const isEditing = editingId === setor.id;

            return (
              <Card
                key={setor.id}
                className="cursor-pointer hover:shadow-lg transition-shadow border hover:border-primary/30"
                onClick={() => !isEditing && navigate(`/gestao-operacional/${setor.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex items-center gap-1">
                      {isAdmin && !isEditing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => startEdit(e, setor.id, setor.nome, setor.descricao)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                      <Badge variant={pct === 100 ? "default" : "secondary"} className="text-xs">
                        {done}/{total}
                      </Badge>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="h-8 text-sm font-semibold"
                        placeholder="Nome do setor"
                      />
                      <Input
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Descrição"
                      />
                      <div className="flex gap-1">
                        <Button size="sm" variant="default" className="h-7 text-xs" onClick={saveEdit}>
                          <Check className="h-3 w-3 mr-1" /> Salvar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-base mb-1">{setor.nome}</h3>
                      <p className="text-muted-foreground text-xs mb-3">{setor.descricao}</p>
                    </>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1 mt-2">
                    <span>Progresso</span>
                    <span>{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Gerente Geral info */}
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">Gerente Geral</h3>
                <p className="text-muted-foreground text-sm">
                  Acesso completo a todos os setores e relatórios. Supervisão geral das operações.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para adicionar setor */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Setor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Nome do setor"
            />
            <Input
              value={novoDesc}
              onChange={(e) => setNovoDesc(e.target.value)}
              placeholder="Descrição (opcional)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddSetor} disabled={!novoNome.trim()}>Criar Setor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
