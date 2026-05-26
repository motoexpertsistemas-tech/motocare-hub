import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search, Tag, Trash2, Edit2, Phone, Mail, Building, Star, Filter, Download } from "lucide-react";

interface Lead {
  id: string; nome: string; email: string | null; telefone: string | null;
  whatsapp: string | null; empresa: string | null; cargo: string | null;
  origem: string; tags: string[]; observacoes: string | null;
  score: number; status: string; responsavel: string | null; created_at: string;
}

export default function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroTag, setFiltroTag] = useState("");
  const [showNovoLead, setShowNovoLead] = useState(false);
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [novoLead, setNovoLead] = useState({ nome: "", email: "", telefone: "", whatsapp: "", empresa: "", cargo: "", origem: "manual", tags: "", observacoes: "" });
  const [novaTag, setNovaTag] = useState("");

  useEffect(() => { carregarLeads(); }, [filtroStatus]);

  const carregarLeads = async () => {
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (filtroStatus !== "todos") query = query.eq("status", filtroStatus);
    const { data } = await query;
    setLeads((data as Lead[]) || []);
  };

  const criarLead = async () => {
    if (!novoLead.nome.trim()) return;
    const tags = novoLead.tags.split(",").map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from("leads").insert({
      nome: novoLead.nome, email: novoLead.email || null, telefone: novoLead.telefone || null,
      whatsapp: novoLead.whatsapp || null, empresa: novoLead.empresa || null,
      cargo: novoLead.cargo || null, origem: novoLead.origem, tags, observacoes: novoLead.observacoes || null,
    });
    if (!error) {
      toast.success("Lead criado!"); setShowNovoLead(false);
      setNovoLead({ nome: "", email: "", telefone: "", whatsapp: "", empresa: "", cargo: "", origem: "manual", tags: "", observacoes: "" });
      carregarLeads();
    }
  };

  const excluirLead = async (id: string) => {
    await supabase.from("leads").delete().eq("id", id);
    toast.success("Lead removido"); setLeadSelecionado(null); carregarLeads();
  };

  const adicionarTag = async (leadId: string, tag: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.tags.includes(tag)) return;
    const newTags = [...lead.tags, tag];
    await supabase.from("leads").update({ tags: newTags }).eq("id", leadId);
    setNovaTag(""); carregarLeads();
    if (leadSelecionado?.id === leadId) setLeadSelecionado({ ...leadSelecionado, tags: newTags });
  };

  const removerTag = async (leadId: string, tag: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const newTags = lead.tags.filter(t => t !== tag);
    await supabase.from("leads").update({ tags: newTags }).eq("id", leadId);
    carregarLeads();
    if (leadSelecionado?.id === leadId) setLeadSelecionado({ ...leadSelecionado, tags: newTags });
  };

  const atualizarStatus = async (leadId: string, status: string) => {
    await supabase.from("leads").update({ status }).eq("id", leadId);
    carregarLeads();
    if (leadSelecionado?.id === leadId) setLeadSelecionado({ ...leadSelecionado, status });
  };

  const todasTags = [...new Set(leads.flatMap(l => l.tags))];
  const leadsFiltrados = leads.filter(l => {
    const matchBusca = busca === "" || l.nome.toLowerCase().includes(busca.toLowerCase()) || l.email?.toLowerCase().includes(busca.toLowerCase());
    const matchTag = filtroTag === "" || l.tags.includes(filtroTag);
    return matchBusca && matchTag;
  });

  const statusColors: Record<string, string> = {
    novo: "bg-blue-500/20 text-blue-600", qualificado: "bg-green-500/20 text-green-600",
    negociando: "bg-yellow-500/20 text-yellow-600", convertido: "bg-purple-500/20 text-purple-600",
    perdido: "bg-red-500/20 text-red-600",
  };

  return (
    <div className="flex h-full">
      {/* Lista de Leads */}
      <div className="flex-1 flex flex-col border-r border-border">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground">Leads ({leadsFiltrados.length})</h2>
            <Dialog open={showNovoLead} onOpenChange={setShowNovoLead}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Lead</Button></DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  <Input placeholder="Nome *" value={novoLead.nome} onChange={e => setNovoLead({ ...novoLead, nome: e.target.value })} />
                  <Input placeholder="Email" value={novoLead.email} onChange={e => setNovoLead({ ...novoLead, email: e.target.value })} />
                  <Input placeholder="Telefone" value={novoLead.telefone} onChange={e => setNovoLead({ ...novoLead, telefone: e.target.value })} />
                  <Input placeholder="WhatsApp" value={novoLead.whatsapp} onChange={e => setNovoLead({ ...novoLead, whatsapp: e.target.value })} />
                  <Input placeholder="Empresa" value={novoLead.empresa} onChange={e => setNovoLead({ ...novoLead, empresa: e.target.value })} />
                  <Input placeholder="Cargo" value={novoLead.cargo} onChange={e => setNovoLead({ ...novoLead, cargo: e.target.value })} />
                  <Select value={novoLead.origem} onValueChange={v => setNovoLead({ ...novoLead, origem: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="site">Site</SelectItem>
                      <SelectItem value="indicacao">Indicação</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Tags (separadas por vírgula)" value={novoLead.tags} onChange={e => setNovoLead({ ...novoLead, tags: e.target.value })} />
                  <Textarea placeholder="Observações" value={novoLead.observacoes} onChange={e => setNovoLead({ ...novoLead, observacoes: e.target.value })} />
                  <Button onClick={criarLead} className="w-full">Criar Lead</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar leads..." className="pl-10" />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="qualificado">Qualificado</SelectItem>
                <SelectItem value="negociando">Negociando</SelectItem>
                <SelectItem value="convertido">Convertido</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {todasTags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {todasTags.map(tag => (
                <button key={tag} onClick={() => setFiltroTag(filtroTag === tag ? "" : tag)}
                  className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${filtroTag === tag ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
                  <Tag className="inline h-2.5 w-2.5 mr-0.5" />{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsFiltrados.map(lead => (
                <TableRow key={lead.id} onClick={() => setLeadSelecionado(lead)}
                  className={`cursor-pointer ${leadSelecionado?.id === lead.id ? "bg-accent" : ""}`}>
                  <TableCell>
                    <div><span className="font-medium text-foreground">{lead.nome}</span>
                    {lead.empresa && <p className="text-xs text-muted-foreground">{lead.empresa}</p>}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {lead.telefone && <Phone className="h-3 w-3 text-muted-foreground" />}
                      {lead.email && <Mail className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </TableCell>
                  <TableCell><span className="text-xs">{lead.origem}</span></TableCell>
                  <TableCell>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[lead.status] || "bg-secondary text-secondary-foreground"}`}>
                      {lead.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {lead.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[9px]">{tag}</Badge>
                      ))}
                      {lead.tags.length > 2 && <Badge variant="secondary" className="text-[9px]">+{lead.tags.length - 2}</Badge>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Painel de Detalhes */}
      {leadSelecionado && (
        <div className="w-80 p-4 overflow-y-auto space-y-4 bg-sidebar">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">Detalhes do Lead</h3>
            <Button variant="ghost" size="icon" onClick={() => excluirLead(leadSelecionado.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
          <Card>
            <CardContent className="pt-4 space-y-3">
              <h4 className="font-semibold text-foreground">{leadSelecionado.nome}</h4>
              {leadSelecionado.empresa && <p className="text-sm text-muted-foreground flex items-center gap-1"><Building className="h-3 w-3" />{leadSelecionado.empresa}</p>}
              {leadSelecionado.email && <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{leadSelecionado.email}</p>}
              {leadSelecionado.telefone && <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{leadSelecionado.telefone}</p>}
              <Select value={leadSelecionado.status} onValueChange={v => atualizarStatus(leadSelecionado.id, v)}>
                <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="qualificado">Qualificado</SelectItem>
                  <SelectItem value="negociando">Negociando</SelectItem>
                  <SelectItem value="convertido">Convertido</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Tags</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {leadSelecionado.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs gap-1">
                    {tag}
                    <button onClick={() => removerTag(leadSelecionado.id, tag)} className="hover:text-destructive">×</button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-1">
                <Input value={novaTag} onChange={e => setNovaTag(e.target.value)} placeholder="Nova tag" className="h-7 text-xs"
                  onKeyDown={e => { if (e.key === "Enter" && novaTag.trim()) adicionarTag(leadSelecionado.id, novaTag.trim()); }} />
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { if (novaTag.trim()) adicionarTag(leadSelecionado.id, novaTag.trim()); }}>+</Button>
              </div>
            </CardContent>
          </Card>
          {leadSelecionado.observacoes && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Observações</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{leadSelecionado.observacoes}</p></CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
