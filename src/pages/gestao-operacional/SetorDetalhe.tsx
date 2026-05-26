import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Wrench, ShoppingCart, Headphones, Package, Monitor, DollarSign,
  Calculator, Building2, ShoppingBag, Crown, Settings, Store,
  Shield, CreditCard, TrendingUp, ArrowLeft, RotateCcw, Plus,
  Pencil, Trash2, Check, X, UserCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSetoresEditaveis } from "@/hooks/useSetoresEditaveis";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { salvarLogDiario } from "./RelatorioTarefas";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  Wrench, ShoppingCart, Headphones, Package, Monitor, DollarSign,
  Calculator, Building: Building2, ShoppingBag, Crown, Settings, Store,
  Shield, CreditCard, TrendingUp,
};

const FUNC_SETOR_KEY = "gestao-operacional-func-setor";

export default function SetorDetalhe() {
  const { setorId } = useParams<{ setorId: string }>();
  const navigate = useNavigate();
  const role = useRole();
  const isAdmin = role === "ADMIN" || role === "GERENTE";
  const { setores, addTarefa, removeTarefa, editTarefa } = useSetoresEditaveis();

  const setor = setores.find((s) => s.id === setorId);
  const [completados, setCompletados] = useState<string[]>([]);
  const [novaTarefa, setNovaTarefa] = useState("");
  const [editingTarefaId, setEditingTarefaId] = useState<string | null>(null);
  const [editingTexto, setEditingTexto] = useState("");
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<string>("");

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios-setor"],
    queryFn: async () => {
      const { data } = await supabase
        .from("funcionarios")
        .select("id, nome, cargo")
        .eq("ativo", true)
        .order("nome");
      return data || [];
    },
  });

  // Load saved funcionário assignment
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FUNC_SETOR_KEY);
      if (saved && setorId) {
        const map = JSON.parse(saved);
        setFuncionarioSelecionado(map[setorId] || "");
      }
    } catch { /* empty */ }
  }, [setorId]);

  useEffect(() => {
    const saved = localStorage.getItem("gestao-operacional-tarefas");
    const savedDate = localStorage.getItem("gestao-operacional-date");
    const today = new Date().toDateString();
    if (savedDate !== today) {
      localStorage.setItem("gestao-operacional-date", today);
      localStorage.removeItem("gestao-operacional-tarefas");
      return;
    }
    if (saved && setorId) {
      try {
        const parsed = JSON.parse(saved);
        setCompletados(parsed[setorId] || []);
      } catch { /* empty */ }
    }
  }, [setorId]);

  // Save log whenever completados changes
  useEffect(() => {
    if (!setor || !funcionarioSelecionado || !setorId) return;
    const func = funcionarios.find((f) => f.id === funcionarioSelecionado);
    if (func) {
      salvarLogDiario(
        func.id,
        func.nome,
        setorId,
        setor.nome,
        setor.tarefas.length,
        completados.length
      );
    }
  }, [completados, funcionarioSelecionado, setor, setorId, funcionarios]);

  const saveFuncionario = (funcId: string) => {
    setFuncionarioSelecionado(funcId);
    try {
      const saved = localStorage.getItem(FUNC_SETOR_KEY);
      const map = saved ? JSON.parse(saved) : {};
      map[setorId!] = funcId;
      localStorage.setItem(FUNC_SETOR_KEY, JSON.stringify(map));
    } catch { /* empty */ }
    const func = funcionarios.find((f) => f.id === funcId);
    if (func) toast.success(`${func.nome} vinculado ao setor!`);
  };

  const toggleTarefa = (tarefaId: string) => {
    if (editingTarefaId) return;
    setCompletados((prev) => {
      const next = prev.includes(tarefaId)
        ? prev.filter((id) => id !== tarefaId)
        : [...prev, tarefaId];
      const saved = localStorage.getItem("gestao-operacional-tarefas");
      const all = saved ? JSON.parse(saved) : {};
      all[setorId!] = next;
      localStorage.setItem("gestao-operacional-tarefas", JSON.stringify(all));
      localStorage.setItem("gestao-operacional-date", new Date().toDateString());
      return next;
    });
  };

  const resetTarefas = () => {
    setCompletados([]);
    const saved = localStorage.getItem("gestao-operacional-tarefas");
    const all = saved ? JSON.parse(saved) : {};
    all[setorId!] = [];
    localStorage.setItem("gestao-operacional-tarefas", JSON.stringify(all));
    toast.success("Tarefas resetadas!");
  };

  const handleAddTarefa = () => {
    if (novaTarefa.trim() && setorId) {
      addTarefa(setorId, novaTarefa.trim());
      setNovaTarefa("");
      toast.success("Tarefa adicionada!");
    }
  };

  const handleRemoveTarefa = (e: React.MouseEvent, tarefaId: string) => {
    e.stopPropagation();
    if (setorId) {
      removeTarefa(setorId, tarefaId);
      toast.success("Tarefa removida!");
    }
  };

  const startEditTarefa = (e: React.MouseEvent, tarefaId: string, texto: string) => {
    e.stopPropagation();
    setEditingTarefaId(tarefaId);
    setEditingTexto(texto);
  };

  const saveEditTarefa = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingTarefaId && editingTexto.trim() && setorId) {
      editTarefa(setorId, editingTarefaId, editingTexto.trim());
      toast.success("Tarefa atualizada!");
    }
    setEditingTarefaId(null);
  };

  const cancelEditTarefa = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTarefaId(null);
  };

  if (!setor) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Setor não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/gestao-operacional")}>
          Voltar
        </Button>
      </div>
    );
  }

  const Icon = iconMap[setor.icon] || Building2;
  const done = completados.length;
  const total = setor.tarefas.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-zinc-900 text-white p-6 md:p-8 rounded-b-2xl mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-white mb-3 -ml-2"
          onClick={() => navigate("/gestao-operacional")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{setor.nome}</h1>
            <p className="text-zinc-400 text-sm">{setor.descricao}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-zinc-400">Progresso</span>
              <span className="text-white font-medium">{pct}%</span>
            </div>
            <Progress value={pct} className="h-3 bg-white/10" />
          </div>
          <Badge variant={pct === 100 ? "default" : "secondary"} className="text-sm px-3 py-1">
            {done}/{total}
          </Badge>
        </div>
      </div>

      {/* Tarefas */}
      <div className="px-4 md:px-6 pb-8">
        {/* Funcionário selector */}
        <Card className="mb-4 border-primary/20">
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <UserCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Funcionário responsável:</span>
            <Select value={funcionarioSelecionado} onValueChange={saveFuncionario}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome} {f.cargo ? `(${f.cargo})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Tarefas Diárias</h2>
          <Button variant="outline" size="sm" onClick={resetTarefas}>
            <RotateCcw className="h-4 w-4 mr-1" /> Resetar
          </Button>
        </div>

        {/* Admin: Adicionar tarefa */}
        {isAdmin && (
          <div className="flex gap-2 mb-4">
            <Input
              value={novaTarefa}
              onChange={(e) => setNovaTarefa(e.target.value)}
              placeholder="Nova tarefa..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAddTarefa()}
            />
            <Button onClick={handleAddTarefa} disabled={!novaTarefa.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {setor.tarefas.map((tarefa, index) => {
            const checked = completados.includes(tarefa.id);
            const isEditing = editingTarefaId === tarefa.id;

            return (
              <Card
                key={tarefa.id}
                className={`cursor-pointer transition-colors ${checked ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50"}`}
                onClick={() => !isEditing && toggleTarefa(tarefa.id)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => !isEditing && toggleTarefa(tarefa.id)}
                    className="pointer-events-none"
                  />
                  <span className="text-xs text-muted-foreground font-mono w-6">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {isEditing ? (
                    <div className="flex-1 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editingTexto}
                        onChange={(e) => setEditingTexto(e.target.value)}
                        className="h-7 text-sm flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditTarefa(e as any);
                          if (e.key === "Escape") cancelEditTarefa(e as any);
                        }}
                        autoFocus
                      />
                      <Button size="icon" variant="default" className="h-7 w-7" onClick={saveEditTarefa}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEditTarefa}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className={`text-sm flex-1 ${checked ? "line-through text-muted-foreground" : ""}`}>
                      {tarefa.texto}
                    </span>
                  )}

                  {!isEditing && isAdmin && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => startEditTarefa(e, tarefa.id, tarefa.texto)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => handleRemoveTarefa(e, tarefa.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {!isEditing && checked && (
                    <Badge variant="default" className="text-xs">✓</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
