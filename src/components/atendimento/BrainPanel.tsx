import { useState, useEffect } from "react";
import { supabase as sbBase } from "@/integrations/supabase/client";
const supabase: any = sbBase;
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Plus, Trash2, Sparkles, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Fonte {
  id: string; tipo: string; titulo: string; conteudo: string;
  status: string; total_chunks: number; created_at: string;
}

export default function BrainPanel() {
  const [fontes, setFontes] = useState<Fonte[]>([]);
  const [showNova, setShowNova] = useState(false);
  const [treinando, setTreinando] = useState<string | null>(null);
  const [nova, setNova] = useState({ tipo: "faq", titulo: "", conteudo: "" });

  const carregar = async () => {
    const { data } = await supabase.from("brain_fontes").select("*").order("created_at", { ascending: false });
    setFontes((data as Fonte[]) || []);
  };
  useEffect(() => { carregar(); }, []);

  const criar = async () => {
    if (!nova.titulo.trim() || !nova.conteudo.trim()) { toast.error("Preencha título e conteúdo"); return; }
    const { error } = await supabase.from("brain_fontes").insert(nova);
    if (error) { toast.error(error.message); return; }
    toast.success("Fonte adicionada"); setShowNova(false);
    setNova({ tipo: "faq", titulo: "", conteudo: "" }); carregar();
  };

  const treinar = async (id: string) => {
    setTreinando(id);
    try {
      const { data, error } = await supabase.functions.invoke("treinar-brain", { body: { fonte_id: id } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success(`Treinado: ${data.total} chunks`);
      carregar();
    } catch (e: any) { toast.error("Erro: " + e.message); }
    finally { setTreinando(null); }
  };

  const excluir = async (id: string) => {
    await supabase.from("brain_fontes").delete().eq("id", id);
    toast.success("Removido"); carregar();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Brain do Produto</h2>
          <p className="text-sm text-muted-foreground">Base de conhecimento que alimenta a IA do atendimento</p>
        </div>
        <Dialog open={showNova} onOpenChange={setShowNova}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Nova Fonte</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Fonte de Conhecimento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={nova.tipo} onValueChange={v => setNova({ ...nova, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="faq">FAQ / Pergunta-Resposta</SelectItem>
                  <SelectItem value="servico">Descrição de serviço</SelectItem>
                  <SelectItem value="politica">Política / Garantia</SelectItem>
                  <SelectItem value="texto">Texto livre</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Título" value={nova.titulo} onChange={e => setNova({ ...nova, titulo: e.target.value })} />
              <Textarea rows={8} placeholder="Conteúdo (cole texto, FAQ, descrição de serviço, garantia...)"
                value={nova.conteudo} onChange={e => setNova({ ...nova, conteudo: e.target.value })} />
              <Button onClick={criar} className="w-full">Adicionar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {fontes.length === 0 && (
          <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma fonte cadastrada</p>
            <p className="text-sm">Adicione FAQ, descrições de serviço, garantias e a IA usará isso para responder.</p>
          </CardContent></Card>
        )}
        {fontes.map(f => (
          <Card key={f.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">{f.titulo}</h4>
                  <Badge variant="secondary" className="text-xs">{f.tipo}</Badge>
                  <Badge variant={f.status === "pronto" ? "default" : "outline"} className="text-xs">
                    {f.status} {f.total_chunks ? `· ${f.total_chunks} chunks` : ""}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{f.conteudo}</p>
              </div>
              <Button size="sm" variant="outline" disabled={treinando === f.id} onClick={() => treinar(f.id)}>
                {treinando === f.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                {f.status === "pronto" ? "Re-treinar" : "Treinar"}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => excluir(f.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
