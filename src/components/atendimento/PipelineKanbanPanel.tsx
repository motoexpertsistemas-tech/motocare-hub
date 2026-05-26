import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, GripVertical, DollarSign, User, Calendar, MoreVertical, Trash2, Edit2, Settings2, Tag, TrendingUp, Users as UsersIcon, Layers, Target, GitBranch } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import EditarEtapaDialog from "./EditarEtapaDialog";
import LeadDetailDialog from "./LeadDetailDialog";
import AplicarCadenciaDialog from "./AplicarCadenciaDialog";

interface Pipeline { id: string; nome: string; descricao: string | null; ativa: boolean; }
interface Etapa { id: string; pipeline_id: string; nome: string; cor: string; ordem: number; }
interface Negocio {
  id: string; titulo: string; valor: number; lead_id: string | null;
  pipeline_id: string; etapa_id: string; probabilidade: number;
  data_previsao_fechamento: string | null; responsavel: string | null;
  notas: string | null; status: string; tags: string[];
}

export default function PipelineKanbanPanel() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [pipelineSelecionada, setPipelineSelecionada] = useState<string>("");
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [showNovoNegocio, setShowNovoNegocio] = useState(false);
  const [showNovaPipeline, setShowNovaPipeline] = useState(false);
  const [showNovaEtapa, setShowNovaEtapa] = useState(false);
  const [novoNegocio, setNovoNegocio] = useState({ titulo: "", valor: "", responsavel: "", etapa_id: "", tags: "" });
  const [novaPipeline, setNovaPipeline] = useState({ nome: "", descricao: "" });
  const [novaEtapa, setNovaEtapa] = useState({ nome: "", cor: "#3b82f6" });
  const [draggedNegocio, setDraggedNegocio] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<{ id: string; value: string } | null>(null);
  const [editEtapa, setEditEtapa] = useState<Etapa | null>(null);
  const [leadDetail, setLeadDetail] = useState<Negocio | null>(null);
  const [aplicarCadenciaNegocio, setAplicarCadenciaNegocio] = useState<Negocio | null>(null);

  useEffect(() => { carregarPipelines(); }, []);
  useEffect(() => { if (pipelineSelecionada) { carregarEtapas(); carregarNegocios(); } }, [pipelineSelecionada]);

  const carregarPipelines = async () => {
    const { data } = await supabase.from("pipelines").select("*").eq("ativa", true).order("created_at");
    if (data && data.length > 0) {
      setPipelines(data as Pipeline[]);
      if (!pipelineSelecionada) setPipelineSelecionada(data[0].id);
    }
  };

  const carregarEtapas = async () => {
    const { data } = await supabase.from("pipeline_etapas").select("*").eq("pipeline_id", pipelineSelecionada).order("ordem");
    setEtapas((data as Etapa[]) || []);
  };

  const carregarNegocios = async () => {
    const { data } = await supabase.from("negocios").select("*").eq("pipeline_id", pipelineSelecionada).order("created_at");
    setNegocios((data as Negocio[]) || []);
  };

  const criarPipeline = async () => {
    if (!novaPipeline.nome.trim()) return;
    const { error } = await supabase.from("pipelines").insert({ nome: novaPipeline.nome, descricao: novaPipeline.descricao || null });
    if (!error) { toast.success("Pipeline criada!"); setShowNovaPipeline(false); setNovaPipeline({ nome: "", descricao: "" }); carregarPipelines(); }
    else toast.error("Erro ao criar pipeline");
  };

  const criarEtapa = async () => {
    if (!novaEtapa.nome.trim()) return;
    const maxOrdem = etapas.length > 0 ? Math.max(...etapas.map(e => e.ordem)) + 1 : 0;
    if (etapas.length >= 25) { toast.error("Máximo de 25 etapas por pipeline"); return; }
    const { error } = await supabase.from("pipeline_etapas").insert({
      pipeline_id: pipelineSelecionada, nome: novaEtapa.nome, cor: novaEtapa.cor, ordem: maxOrdem,
    });
    if (!error) { toast.success("Etapa adicionada!"); setShowNovaEtapa(false); setNovaEtapa({ nome: "", cor: "#3b82f6" }); carregarEtapas(); }
  };

  const criarNegocio = async () => {
    if (!novoNegocio.titulo.trim() || !novoNegocio.etapa_id) return;
    const tags = novoNegocio.tags.split(",").map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from("negocios").insert({
      titulo: novoNegocio.titulo, valor: parseFloat(novoNegocio.valor) || 0,
      responsavel: novoNegocio.responsavel || null, etapa_id: novoNegocio.etapa_id,
      pipeline_id: pipelineSelecionada, tags,
    } as any);
    if (!error) { toast.success("Negócio criado!"); setShowNovoNegocio(false); setNovoNegocio({ titulo: "", valor: "", responsavel: "", etapa_id: "", tags: "" }); carregarNegocios(); }
  };

  const moverNegocio = async (negocioId: string, novaEtapaId: string) => {
    const { error } = await supabase.from("negocios").update({ etapa_id: novaEtapaId }).eq("id", negocioId);
    if (!error) carregarNegocios();
  };

  const excluirNegocio = async (id: string) => {
    await supabase.from("negocios").delete().eq("id", id);
    toast.success("Negócio removido"); carregarNegocios();
  };

  const excluirEtapa = async (id: string) => {
    const negociosNaEtapa = negocios.filter(n => n.etapa_id === id);
    if (negociosNaEtapa.length > 0) { toast.error("Mova os negócios antes de excluir a etapa"); return; }
    await supabase.from("pipeline_etapas").delete().eq("id", id);
    toast.success("Etapa removida"); carregarEtapas();
  };

  const adicionarTagNegocio = async (negocioId: string, tag: string) => {
    const negocio = negocios.find(n => n.id === negocioId);
    if (!negocio || (negocio.tags || []).includes(tag)) return;
    const newTags = [...(negocio.tags || []), tag];
    await supabase.from("negocios").update({ tags: newTags } as any).eq("id", negocioId);
    setTagInput(null); carregarNegocios();
  };

  const removerTagNegocio = async (negocioId: string, tag: string) => {
    const negocio = negocios.find(n => n.id === negocioId);
    if (!negocio) return;
    const newTags = (negocio.tags || []).filter(t => t !== tag);
    await supabase.from("negocios").update({ tags: newTags } as any).eq("id", negocioId);
    carregarNegocios();
  };

  const handleDragStart = (negocioId: string) => setDraggedNegocio(negocioId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (etapaId: string) => { if (draggedNegocio) { moverNegocio(draggedNegocio, etapaId); setDraggedNegocio(null); } };

  const totalPorEtapa = (etapaId: string) => negocios.filter(n => n.etapa_id === etapaId).reduce((sum, n) => sum + (n.valor || 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Select value={pipelineSelecionada} onValueChange={setPipelineSelecionada}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Selecione uma pipeline" /></SelectTrigger>
            <SelectContent>
              {pipelines.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={showNovaPipeline} onOpenChange={setShowNovaPipeline}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Pipeline</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Pipeline</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nome da pipeline" value={novaPipeline.nome} onChange={e => setNovaPipeline({ ...novaPipeline, nome: e.target.value })} />
                <Input placeholder="Descrição (opcional)" value={novaPipeline.descricao} onChange={e => setNovaPipeline({ ...novaPipeline, descricao: e.target.value })} />
                <Button onClick={criarPipeline} className="w-full">Criar Pipeline</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showNovaEtapa} onOpenChange={setShowNovaEtapa}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><Settings2 className="h-4 w-4 mr-1" /> Etapa</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Etapa</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nome da etapa" value={novaEtapa.nome} onChange={e => setNovaEtapa({ ...novaEtapa, nome: e.target.value })} />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Cor:</span>
                  <input type="color" value={novaEtapa.cor} onChange={e => setNovaEtapa({ ...novaEtapa, cor: e.target.value })} className="w-10 h-8 rounded cursor-pointer" />
                </div>
                <p className="text-xs text-muted-foreground">{etapas.length}/25 etapas</p>
                <Button onClick={criarEtapa} className="w-full">Adicionar Etapa</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showNovoNegocio} onOpenChange={setShowNovoNegocio}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Negócio</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Negócio</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Título" value={novoNegocio.titulo} onChange={e => setNovoNegocio({ ...novoNegocio, titulo: e.target.value })} />
                <Input placeholder="Valor (R$)" type="number" value={novoNegocio.valor} onChange={e => setNovoNegocio({ ...novoNegocio, valor: e.target.value })} />
                <Input placeholder="Responsável" value={novoNegocio.responsavel} onChange={e => setNovoNegocio({ ...novoNegocio, responsavel: e.target.value })} />
                <Input placeholder="Tags (separadas por vírgula)" value={novoNegocio.tags} onChange={e => setNovoNegocio({ ...novoNegocio, tags: e.target.value })} />
                <Select value={novoNegocio.etapa_id} onValueChange={v => setNovoNegocio({ ...novoNegocio, etapa_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Etapa" /></SelectTrigger>
                  <SelectContent>{etapas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
                </Select>
                <Button onClick={criarNegocio} className="w-full">Criar Negócio</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 border-b border-border bg-muted/20">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><TrendingUp className="h-3 w-3" /> Valor Total</div>
          <p className="text-xl font-bold text-foreground mt-0.5">R$ {negocios.reduce((s,n)=>s+(n.valor||0),0).toLocaleString("pt-BR",{minimumFractionDigits:2})}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><UsersIcon className="h-3 w-3" /> Total de Leads</div>
          <p className="text-xl font-bold text-foreground mt-0.5">{negocios.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Layers className="h-3 w-3" /> Etapas</div>
          <p className="text-xl font-bold text-foreground mt-0.5">{etapas.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Target className="h-3 w-3" /> Ticket Médio</div>
          <p className="text-xl font-bold text-foreground mt-0.5">R$ {(negocios.length ? negocios.reduce((s,n)=>s+(n.valor||0),0)/negocios.length : 0).toLocaleString("pt-BR",{minimumFractionDigits:2})}</p>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {etapas.map(etapa => {
            const etapaNegocios = negocios.filter(n => n.etapa_id === etapa.id);
            const total = totalPorEtapa(etapa.id);
            return (
              <div key={etapa.id} className="w-72 flex flex-col bg-muted/30 rounded-xl border border-border"
                onDragOver={handleDragOver} onDrop={() => handleDrop(etapa.id)}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: etapa.cor }} />
                    <span className="font-semibold text-sm text-foreground">{etapa.nome}</span>
                    <Badge variant="secondary" className="text-[10px]">{etapaNegocios.length}</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="h-3 w-3" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setEditEtapa(etapa)}><Edit2 className="h-3 w-3 mr-2" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => excluirEtapa(etapa.id)} className="text-destructive"><Trash2 className="h-3 w-3 mr-2" /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {total > 0 && (
                  <div className="px-4 py-1.5 text-xs text-muted-foreground border-b border-border">
                    Total: <span className="font-medium text-foreground">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {etapaNegocios.map(negocio => (
                    <Card key={negocio.id} draggable onDragStart={() => handleDragStart(negocio.id)}
                      onClick={() => setLeadDetail(negocio)}
                      className="cursor-pointer hover:shadow-md transition-shadow border-border">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium text-sm text-foreground">{negocio.titulo}</span>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5"><MoreVertical className="h-3 w-3" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setAplicarCadenciaNegocio(negocio)}>
                                <GitBranch className="h-3 w-3 mr-2" /> Aplicar Cadência
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => excluirNegocio(negocio.id)} className="text-destructive"><Trash2 className="h-3 w-3 mr-2" /> Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          </div>
                        </div>
                        {negocio.valor > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                            <DollarSign className="h-3 w-3" />
                            R$ {negocio.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {negocio.responsavel && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <User className="h-3 w-3" /> {negocio.responsavel}
                            </div>
                          )}
                          {negocio.data_previsao_fechamento && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3" /> {new Date(negocio.data_previsao_fechamento).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                        </div>
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(negocio.tags || []).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[9px] gap-0.5 px-1.5 py-0">
                              {tag}
                              <button onClick={(e) => { e.stopPropagation(); removerTagNegocio(negocio.id, tag); }} className="hover:text-destructive ml-0.5">×</button>
                            </Badge>
                          ))}
                          {tagInput?.id === negocio.id ? (
                            <Input
                              autoFocus
                              value={tagInput.value}
                              onChange={e => setTagInput({ ...tagInput, value: e.target.value })}
                              onKeyDown={e => { if (e.key === "Enter" && tagInput.value.trim()) adicionarTagNegocio(negocio.id, tagInput.value.trim()); if (e.key === "Escape") setTagInput(null); }}
                              onBlur={() => { if (tagInput.value.trim()) adicionarTagNegocio(negocio.id, tagInput.value.trim()); else setTagInput(null); }}
                              className="h-5 w-20 text-[10px] px-1"
                              placeholder="Tag..."
                            />
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); setTagInput({ id: negocio.id, value: "" }); }}
                              className="text-[9px] px-1.5 py-0 rounded-full bg-secondary text-muted-foreground hover:bg-accent flex items-center gap-0.5">
                              <Tag className="h-2.5 w-2.5" /> +
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <EditarEtapaDialog etapa={editEtapa} open={!!editEtapa}
        onOpenChange={(v) => !v && setEditEtapa(null)} onSaved={carregarEtapas} />
      <LeadDetailDialog negocio={leadDetail} open={!!leadDetail}
        onOpenChange={(v) => !v && setLeadDetail(null)} onSaved={carregarNegocios} />
      <AplicarCadenciaDialog
        negocioId={aplicarCadenciaNegocio?.id || null}
        negocioTitulo={aplicarCadenciaNegocio?.titulo}
        leadId={aplicarCadenciaNegocio?.lead_id || null}
        open={!!aplicarCadenciaNegocio}
        onOpenChange={(v) => !v && setAplicarCadenciaNegocio(null)}
      />
    </div>
  );
}
