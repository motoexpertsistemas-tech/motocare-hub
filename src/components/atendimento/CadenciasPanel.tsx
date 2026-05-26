import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GitBranch, Pencil, Loader2, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ExecucoesAtivasPanel from "./ExecucoesAtivasPanel";

interface Cadencia { id: string; nome: string; descricao: string | null; ativa: boolean; }
interface Passo { id?: string; ordem: number; dias_apos: number; canal: string; assunto: string | null; mensagem: string; }

export default function CadenciasPanel() {
  const [cadencias, setCadencias] = useState<Cadencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Cadencia | null>(null);
  const [open, setOpen] = useState(false);

  const carregar = async () => {
    setLoading(true);
    const { data } = await supabase.from("cadencias" as any).select("*").order("created_at", { ascending: false });
    setCadencias((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { carregar(); }, []);

  const novaCadencia = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: u } = await supabase.from("usuarios").select("empresa_id").eq("auth_user_id", user!.id).maybeSingle();
    const { data, error } = await supabase.from("cadencias" as any).insert({
      empresa_id: u!.empresa_id, nome: "NOVA CADÊNCIA", ativa: true,
    }).select().single();
    if (error) return toast.error(error.message);
    setEditando(data as any); setOpen(true); carregar();
  };

  const remover = async (id: string) => {
    if (!confirm("Excluir cadência?")) return;
    await supabase.from("cadencias" as any).delete().eq("id", id);
    carregar();
  };

  return (
    <Tabs defaultValue="cadencias" className="w-full">
      <div className="px-6 pt-4">
        <TabsList>
          <TabsTrigger value="cadencias" className="gap-1.5"><GitBranch className="h-4 w-4" /> Cadências</TabsTrigger>
          <TabsTrigger value="execucoes" className="gap-1.5"><Activity className="h-4 w-4" /> Execuções Ativas</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="cadencias">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2"><GitBranch className="h-5 w-5" /> Cadências de Follow-up</h2>
              <p className="text-xs text-muted-foreground">Sequências automáticas para leads que não responderam</p>
            </div>
            <Button onClick={novaCadencia} className="gap-1.5"><Plus className="h-4 w-4" /> Nova Cadência</Button>
          </div>

          {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto mt-10" /> :
        cadencias.length === 0 ? (
          <Card><CardContent className="pt-10 pb-10 text-center text-sm text-muted-foreground">
            Nenhuma cadência criada. Clique em "Nova Cadência" para começar.
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {cadencias.map(c => (
              <Card key={c.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{c.nome}</div>
                    <div className="text-xs text-muted-foreground">{c.descricao || "Sem descrição"}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${c.ativa ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {c.ativa ? "ATIVA" : "INATIVA"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="outline" className="text-green-600" onClick={() => { setEditando(c); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="text-red-600" onClick={() => remover(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

          <CadenciaEditor cadencia={editando} open={open} onOpenChange={setOpen} onSaved={carregar} />
        </div>
      </TabsContent>
      <TabsContent value="execucoes">
        <ExecucoesAtivasPanel />
      </TabsContent>
    </Tabs>
  );
}

function CadenciaEditor({ cadencia, open, onOpenChange, onSaved }: {
  cadencia: Cadencia | null; open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativa, setAtiva] = useState(true);
  const [passos, setPassos] = useState<Passo[]>([]);

  useEffect(() => {
    if (!cadencia) return;
    setNome(cadencia.nome); setDescricao(cadencia.descricao || ""); setAtiva(cadencia.ativa);
    supabase.from("cadencia_passos" as any).select("*").eq("cadencia_id", cadencia.id).order("ordem")
      .then(({ data }) => setPassos((data as any) || []));
  }, [cadencia]);

  const adicionarPasso = () => {
    setPassos([...passos, { ordem: passos.length + 1, dias_apos: 1, canal: "whatsapp", assunto: "", mensagem: "" }]);
  };
  const removerPasso = (idx: number) => setPassos(passos.filter((_, i) => i !== idx));
  const atualizarPasso = (idx: number, campo: keyof Passo, valor: any) =>
    setPassos(passos.map((p, i) => i === idx ? { ...p, [campo]: valor } : p));

  const salvar = async () => {
    if (!cadencia) return;
    await supabase.from("cadencias" as any).update({ nome: nome.toUpperCase(), descricao, ativa }).eq("id", cadencia.id);
    await supabase.from("cadencia_passos" as any).delete().eq("cadencia_id", cadencia.id);
    if (passos.length > 0) {
      await supabase.from("cadencia_passos" as any).insert(passos.map((p, i) => ({
        cadencia_id: cadencia.id, ordem: i + 1, dias_apos: p.dias_apos,
        canal: p.canal, assunto: p.assunto, mensagem: p.mensagem,
      })));
    }
    toast.success("Cadência salva");
    onSaved(); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Cadência</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value.toUpperCase())} /></div>
            <div className="flex items-end gap-2">
              <input type="checkbox" checked={ativa} onChange={e => setAtiva(e.target.checked)} className="h-4 w-4" />
              <Label>Ativa</Label>
            </div>
          </div>
          <div><Label>Descrição</Label><Textarea rows={2} value={descricao} onChange={e => setDescricao(e.target.value)} /></div>

          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Passos da sequência</h3>
              <Button size="sm" variant="outline" onClick={adicionarPasso}><Plus className="h-3 w-3 mr-1" /> Passo</Button>
            </div>
            <div className="space-y-2">
              {passos.map((p, i) => (
                <Card key={i}><CardContent className="pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">{i + 1}</span>
                    <Label className="text-xs">D+</Label>
                    <Input type="number" className="w-20 h-8" value={p.dias_apos} onChange={e => atualizarPasso(i, "dias_apos", parseInt(e.target.value) || 0)} />
                    <Select value={p.canal} onValueChange={v => atualizarPasso(i, "canal", v)}>
                      <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="ligacao">Ligação</SelectItem>
                        <SelectItem value="tarefa">Tarefa</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" className="ml-auto text-red-600 h-7 w-7" onClick={() => removerPasso(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {p.canal === "email" && (
                    <Input placeholder="Assunto" value={p.assunto || ""} onChange={e => atualizarPasso(i, "assunto", e.target.value)} />
                  )}
                  <Textarea rows={3} placeholder="Mensagem (use {{nome}} para personalizar)" value={p.mensagem} onChange={e => atualizarPasso(i, "mensagem", e.target.value)} />
                </CardContent></Card>
              ))}
              {passos.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum passo. Clique em "Passo" para adicionar.</p>}
            </div>
          </div>
        </div>
        <Button className="w-full mt-3" onClick={salvar}>Salvar Cadência</Button>
      </DialogContent>
    </Dialog>
  );
}
