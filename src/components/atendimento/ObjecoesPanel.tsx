import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquareWarning, Plus, Trash2, Pencil, Sparkles, Copy, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

interface Objecao {
  id: string; categoria: string; objecao: string; resposta: string;
  tags: string[] | null; vezes_usada: number;
}

const CATEGORIAS = ["GERAL", "PRECO", "CONFIANCA", "TEMPO", "CONCORRENCIA"];

export default function ObjecoesPanel() {
  const [items, setItems] = useState<Objecao[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroCat, setFiltroCat] = useState("TODAS");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Objecao | null>(null);
  const [loading, setLoading] = useState(true);

  // Form
  const [form, setForm] = useState({ categoria: "GERAL", objecao: "", resposta: "" });
  const [gerando, setGerando] = useState(false);

  const carregar = async () => {
    setLoading(true);
    const { data } = await supabase.from("objecoes" as any).select("*").order("vezes_usada", { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { carregar(); }, []);

  const salvar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: u } = await supabase.from("usuarios").select("empresa_id").eq("auth_user_id", user!.id).maybeSingle();
    if (edit) {
      await supabase.from("objecoes" as any).update({ ...form }).eq("id", edit.id);
    } else {
      await supabase.from("objecoes" as any).insert({ ...form, empresa_id: u!.empresa_id });
    }
    toast.success("Salvo"); setOpen(false); setEdit(null);
    setForm({ categoria: "GERAL", objecao: "", resposta: "" });
    carregar();
  };

  const remover = async (id: string) => {
    if (!confirm("Excluir objeção?")) return;
    await supabase.from("objecoes" as any).delete().eq("id", id);
    carregar();
  };

  const gerarComIA = async () => {
    if (!form.objecao.trim()) return toast.error("Digite a objeção primeiro");
    setGerando(true);
    try {
      const { data, error } = await supabase.functions.invoke("sugerir-resposta-objecao", {
        body: { objecao: form.objecao },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setForm({ ...form, resposta: data.resposta });
      toast.success("Resposta gerada");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar");
    } finally { setGerando(false); }
  };

  const copiar = async (o: Objecao) => {
    await navigator.clipboard.writeText(o.resposta);
    await supabase.from("objecoes" as any).update({ vezes_usada: o.vezes_usada + 1 }).eq("id", o.id);
    toast.success("Copiado"); carregar();
  };

  const filtrados = items.filter(i =>
    (filtroCat === "TODAS" || i.categoria === filtroCat) &&
    (busca === "" || i.objecao.toLowerCase().includes(busca.toLowerCase()) || i.resposta.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><MessageSquareWarning className="h-5 w-5" /> Biblioteca de Objeções</h2>
          <p className="text-xs text-muted-foreground">Respostas prontas para o que o cliente costuma falar</p>
        </div>
        <Button onClick={() => { setEdit(null); setForm({ categoria: "GERAL", objecao: "", resposta: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nova Objeção
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <Select value={filtroCat} onValueChange={setFiltroCat}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todas categorias</SelectItem>
            {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto mt-10" /> :
        filtrados.length === 0 ? (
          <Card><CardContent className="pt-10 pb-10 text-center text-sm text-muted-foreground">
            Nenhuma objeção. Crie a primeira.
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {filtrados.map(o => (
              <Card key={o.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{o.categoria}</span>
                        <span className="text-[10px] text-muted-foreground">Usada {o.vezes_usada}x</span>
                      </div>
                      <div className="text-sm font-medium text-foreground">"{o.objecao}"</div>
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">{o.resposta}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="outline" className="text-blue-600 h-8 w-8" onClick={() => copiar(o)} title="Copiar">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="outline" className="text-green-600 h-8 w-8"
                        onClick={() => { setEdit(o); setForm({ categoria: o.categoria, objecao: o.objecao, resposta: o.resposta }); setOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="outline" className="text-red-600 h-8 w-8" onClick={() => remover(o.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Editar" : "Nova"} Objeção</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>O que o cliente diz</Label>
              <Textarea rows={2} value={form.objecao} onChange={e => setForm({ ...form, objecao: e.target.value })}
                placeholder='Ex: "Tá muito caro"' />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Resposta sugerida</Label>
                <Button size="sm" variant="outline" onClick={gerarComIA} disabled={gerando} className="gap-1.5 h-7 text-xs">
                  {gerando ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Gerar com IA
                </Button>
              </div>
              <Textarea rows={5} value={form.resposta} onChange={e => setForm({ ...form, resposta: e.target.value })} />
            </div>
            <Button className="w-full" onClick={salvar}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
