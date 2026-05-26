import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Pencil, X, Check, Info, Lock, ArrowLeft, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const GRUPOS_USUARIOS = ["ADMIN", "GERENTE", "VENDEDOR", "MECÂNICO", "CLIENTE"];

interface Situacao {
  id: string;
  nome: string;
  confirmar_lancamento: boolean;
  permite_edicao: boolean;
  cor: string;
  cor_nome: string;
  padrao: boolean;
  exibir_listagem: boolean;
  atrasado_nome: string;
  atrasado_cor: string;
  grupos_bloqueados: string[];
}

const CORES = [
  { nome: "Verde", valor: "#22c55e" },
  { nome: "Púrpura", valor: "#9333ea" },
  { nome: "Azul", valor: "#3b82f6" },
  { nome: "Vermelho", valor: "#ef4444" },
  { nome: "Amarelo", valor: "#eab308" },
  { nome: "Laranja", valor: "#DC2626" },
  { nome: "Rosa", valor: "#ec4899" },
  { nome: "Cinza", valor: "#6b7280" },
];

const initialData: Situacao[] = [
  { id: "1", nome: "Em aberto", confirmar_lancamento: false, permite_edicao: true, cor: "#9333ea", cor_nome: "Púrpura", padrao: true, exibir_listagem: true, atrasado_nome: "Atrasado", atrasado_cor: "#ef4444", grupos_bloqueados: [] },
  { id: "2", nome: "Confirmado", confirmar_lancamento: true, permite_edicao: true, cor: "#22c55e", cor_nome: "Verde", padrao: true, exibir_listagem: true, atrasado_nome: "", atrasado_cor: "#ef4444", grupos_bloqueados: [] },
];

type ViewMode = "list" | "add" | "edit" | "view";

export default function SituacoesFinanceiro() {
  const [view, setView] = useState<ViewMode>("list");
  const [situacoes, setSituacoes] = useState<Situacao[]>(initialData);
  const [busca, setBusca] = useState("");
  const [selected, setSelected] = useState<Situacao | null>(null);

  // Form state
  const [nome, setNome] = useState("");
  const [confirmarLancamento, setConfirmarLancamento] = useState("Não");
  const [permiteEdicao, setPermiteEdicao] = useState("Sim");
  const [cor, setCor] = useState("#9333ea");
  const [corNome, setCorNome] = useState("Púrpura");
  const [padrao, setPadrao] = useState("Sim");
  const [exibirListagem, setExibirListagem] = useState("Sim");
  const [atrasadoNome, setAtrasadoNome] = useState("Atrasado");
  const [atrasadoCor, setAtrasadoCor] = useState("#ef4444");
  const [gruposBloqueados, setGruposBloqueados] = useState<string[]>([]);
  const [buscaGrupo, setBuscaGrupo] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const resetForm = () => {
    setNome(""); setConfirmarLancamento("Não"); setPermiteEdicao("Sim");
    setCor("#9333ea"); setCorNome("Púrpura"); setPadrao("Sim");
    setExibirListagem("Sim"); setAtrasadoNome("Atrasado"); setAtrasadoCor("#ef4444");
    setGruposBloqueados([]); setBuscaGrupo("");
  };

  const loadForm = (s: Situacao) => {
    setNome(s.nome);
    setConfirmarLancamento(s.confirmar_lancamento ? "Sim" : "Não");
    setPermiteEdicao(s.permite_edicao ? "Sim" : "Não");
    setCor(s.cor); setCorNome(s.cor_nome);
    setPadrao(s.padrao ? "Sim" : "Não");
    setExibirListagem(s.exibir_listagem ? "Sim" : "Não");
    setAtrasadoNome(s.atrasado_nome); setAtrasadoCor(s.atrasado_cor);
    setGruposBloqueados(s.grupos_bloqueados || []);
  };

  const handleSave = () => {
    if (!nome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (view === "add") {
      const nova: Situacao = {
        id: crypto.randomUUID(), nome: nome.toUpperCase(),
        confirmar_lancamento: confirmarLancamento === "Sim",
        permite_edicao: permiteEdicao === "Sim",
        cor, cor_nome: corNome,
        padrao: padrao === "Sim",
        exibir_listagem: exibirListagem === "Sim",
        atrasado_nome: atrasadoNome, atrasado_cor: atrasadoCor,
        grupos_bloqueados: gruposBloqueados,
      };
      setSituacoes(prev => [...prev, nova]);
      toast.success("Situação criada com sucesso");
    } else if (view === "edit" && selected) {
      setSituacoes(prev => prev.map(s => s.id === selected.id ? {
        ...s, nome: nome.toUpperCase(),
        confirmar_lancamento: confirmarLancamento === "Sim",
        permite_edicao: permiteEdicao === "Sim",
        cor, cor_nome: corNome,
        padrao: padrao === "Sim",
        exibir_listagem: exibirListagem === "Sim",
        atrasado_nome: atrasadoNome, atrasado_cor: atrasadoCor,
        grupos_bloqueados: gruposBloqueados,
      } : s));
      toast.success("Situação atualizada com sucesso");
    }
    setView("list"); resetForm();
  };

  const handleDelete = (id: string) => {
    setSituacoes(prev => prev.filter(s => s.id !== id));
    toast.success("Situação removida");
  };

  const addGrupo = (grupo: string) => {
    if (!gruposBloqueados.includes(grupo)) {
      setGruposBloqueados(prev => [...prev, grupo]);
    }
    setBuscaGrupo("");
    setPopoverOpen(false);
  };

  const removeGrupo = (grupo: string) => {
    setGruposBloqueados(prev => prev.filter(g => g !== grupo));
  };

  const gruposDisponiveis = GRUPOS_USUARIOS.filter(
    g => !gruposBloqueados.includes(g) && g.toLowerCase().includes(buscaGrupo.toLowerCase())
  );

  const filtered = situacoes.filter(s => s.nome.toLowerCase().includes(busca.toLowerCase()));

  // View mode - detail table
  if (view === "view" && selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Visualizar situação de financeiro</h1>
          <Button variant="outline" onClick={() => setView("list")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                <TableRow><TableCell className="font-medium w-48">Nome</TableCell><TableCell>{selected.nome}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Cor</TableCell><TableCell><Badge className="text-white text-xs" style={{ backgroundColor: selected.cor }}>{selected.cor_nome}</Badge></TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Confirmar lançamento</TableCell><TableCell>{selected.confirmar_lancamento ? "Sim" : "Não"}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Permite edição</TableCell><TableCell>{selected.permite_edicao ? <Check className="h-4 w-4 text-green-600" /> : "Não"}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Padrão</TableCell><TableCell>{selected.padrao ? <Check className="h-4 w-4 text-green-600" /> : "Não"}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Exibir na listagem</TableCell><TableCell>{selected.exibir_listagem ? <Check className="h-4 w-4 text-green-600" /> : "Não"}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Nome atrasado</TableCell><TableCell>{selected.atrasado_nome || "—"}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Cor atrasado</TableCell><TableCell><Badge className="text-white text-xs" style={{ backgroundColor: selected.atrasado_cor }}>Vermelho</Badge></TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Grupos bloqueados</TableCell><TableCell>{selected.grupos_bloqueados.length > 0 ? selected.grupos_bloqueados.join(", ") : "Nenhum"}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === "add" || view === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{view === "add" ? "Adicionar" : "Editar"} situação de financeiro</h1>
          <Button variant="outline" onClick={() => { setView("list"); resetForm(); }}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>

        {/* Dados gerais */}
        <Card>
          <div className="bg-muted px-4 py-2 border-b font-semibold flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Dados gerais
          </div>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Em aberto" />
              </div>
              <div>
                <Label className="flex items-center gap-1">Confirmar lançamento * <Info className="h-3 w-3 text-muted-foreground" /></Label>
                <Select value={confirmarLancamento} onValueChange={setConfirmarLancamento}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1">Permite edição <Info className="h-3 w-3 text-muted-foreground" /></Label>
                <Select value={permiteEdicao} onValueChange={setPermiteEdicao}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 items-center">
                  <div className="h-10 flex-1 rounded-md border" style={{ backgroundColor: cor }} />
                  <Select value={corNome} onValueChange={v => { setCorNome(v); const c = CORES.find(c => c.nome === v); if (c) setCor(c.valor); }}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CORES.map(c => (
                        <SelectItem key={c.nome} value={c.nome}>
                          <span className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: c.valor }} />
                            {c.nome}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1">Padrão <Info className="h-3 w-3 text-muted-foreground" /></Label>
                <Select value={padrao} onValueChange={setPadrao}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1">Exibir na Listagem <Info className="h-3 w-3 text-muted-foreground" /></Label>
                <Select value={exibirListagem} onValueChange={setExibirListagem}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Situação atrasado */}
        <Card>
          <div className="bg-muted px-4 py-2 border-b font-semibold flex items-center gap-2">
            ⏱ Situação atrasado
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-4 py-2 text-sm">
              Quando o lançamento estiver atrasado, essas configurações serão aplicadas.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input value={atrasadoNome} onChange={e => setAtrasadoNome(e.target.value)} />
              </div>
              <div>
                <Label>Cor</Label>
                <div className="h-10 rounded-md border" style={{ backgroundColor: atrasadoCor }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloqueio de grupos */}
        <Card>
          <div className="bg-muted px-4 py-2 border-b font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4" /> Bloqueio de grupos de usuários
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md px-4 py-2 text-sm">
              Ao bloquear grupos de usuários para esta situação, os usuários pertencentes aos grupos não poderão alterar a situação que estiver vinculada a ela.
            </div>

            {/* Grupos bloqueados */}
            {gruposBloqueados.length > 0 && (
              <div className="space-y-2">
                {gruposBloqueados.map(g => (
                  <div key={g} className="flex items-center justify-between border rounded-md px-3 py-2 bg-muted/50">
                    <span className="font-medium text-sm">{g}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => removeGrupo(g)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Adicionar grupo */}
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Bloquear grupo
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <Input
                  placeholder="Digite para buscar"
                  value={buscaGrupo}
                  onChange={e => setBuscaGrupo(e.target.value)}
                  className="mb-2"
                />
                <div className="max-h-40 overflow-y-auto">
                  {gruposDisponiveis.map(g => (
                    <button
                      key={g}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                      onClick={() => addGrupo(g)}
                    >
                      {g}
                    </button>
                  ))}
                  {gruposDisponiveis.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">Nenhum grupo disponível</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSave}>
            <Check className="h-4 w-4 mr-1" /> {view === "add" ? "Salvar" : "Atualizar"}
          </Button>
          <Button variant="destructive" onClick={() => { setView("list"); resetForm(); }}>
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Situações de financeiro</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input placeholder="Buscar" value={busca} onChange={e => setBusca(e.target.value)} className="pr-10 w-64" />
            <Search className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
          </div>
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { resetForm(); setView("add"); }}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md px-4 py-2 text-sm">
        Durante o cadastro de movimentações, é possível especificar a situação financeira.
      </div>

      <Card className="glass-panel">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-center">Confirmar lançamento</TableHead>
                <TableHead className="text-center">Permite edição</TableHead>
                <TableHead className="text-center">Cor</TableHead>
                <TableHead className="text-center">Padrão</TableHead>
                <TableHead className="text-center">Exibir na listagem</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell className="text-center">
                    {s.confirmar_lancamento
                      ? <Check className="h-4 w-4 text-green-600 mx-auto" />
                      : <X className="h-4 w-4 text-red-500 mx-auto" />}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.permite_edicao
                      ? <Check className="h-4 w-4 text-green-600 mx-auto" />
                      : <X className="h-4 w-4 text-red-500 mx-auto" />}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="text-white text-xs" style={{ backgroundColor: s.cor }}>{s.cor_nome}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {s.padrao ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.exibir_listagem ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button size="icon" className="h-8 w-8 rounded-full bg-teal-500 hover:bg-teal-600 text-white" onClick={() => { setSelected(s); setView("view"); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" className="h-8 w-8 rounded-full bg-amber-400 hover:bg-amber-500 text-white" onClick={() => { setSelected(s); loadForm(s); setView("edit"); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDelete(s.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma situação encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {filtered.length > 0 && (
            <div className="px-4 py-2 text-sm text-muted-foreground border-t">
              Mostrando 1 a {filtered.length} de um total de {filtered.length}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
