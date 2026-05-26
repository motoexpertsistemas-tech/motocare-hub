import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Users, Trash2, Mail, Shield } from "lucide-react";

interface Membro {
  id: string; nome: string; email: string | null; cargo: string | null;
  avatar_url: string | null; ativo: boolean; permissoes: string[];
}

export default function MembrosPanel() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [showNovo, setShowNovo] = useState(false);
  const [novo, setNovo] = useState({ nome: "", email: "", cargo: "" });

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    const { data } = await supabase.from("membros_equipe").select("*").order("created_at");
    setMembros((data as Membro[]) || []);
  };

  const criar = async () => {
    if (!novo.nome.trim()) return;
    const { error } = await supabase.from("membros_equipe").insert({
      nome: novo.nome, email: novo.email || null, cargo: novo.cargo || null,
    });
    if (!error) { toast.success("Membro adicionado!"); setShowNovo(false); setNovo({ nome: "", email: "", cargo: "" }); carregar(); }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await supabase.from("membros_equipe").update({ ativo: !ativo }).eq("id", id);
    carregar();
  };

  const excluir = async (id: string) => {
    await supabase.from("membros_equipe").delete().eq("id", id);
    toast.success("Membro removido"); carregar();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Membros da Equipe</h2>
          <p className="text-sm text-muted-foreground">Cadastro ilimitado de membros na empresa</p>
        </div>
        <Dialog open={showNovo} onOpenChange={setShowNovo}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Novo Membro</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Membro</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome *" value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} />
              <Input placeholder="Email" value={novo.email} onChange={e => setNovo({ ...novo, email: e.target.value })} />
              <Input placeholder="Cargo" value={novo.cargo} onChange={e => setNovo({ ...novo, cargo: e.target.value })} />
              <Button onClick={criar} className="w-full">Adicionar Membro</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {membros.length === 0 && (
          <Card className="border-dashed col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum membro cadastrado</p>
            </CardContent>
          </Card>
        )}
        {membros.map(m => (
          <Card key={m.id} className={`${!m.ativo ? "opacity-60" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                    {m.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{m.nome}</h4>
                    {m.cargo && <p className="text-xs text-muted-foreground">{m.cargo}</p>}
                    {m.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-2.5 w-2.5" />{m.email}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={m.ativo} onCheckedChange={() => toggleAtivo(m.id, m.ativo)} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => excluir(m.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
