import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Settings2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Situacao {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
}

export default function SituacoesOS() {
  const [situacoes, setSituacoes] = useState<Situacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#3b82f6");
  const [editId, setEditId] = useState<string | null>(null);

  const DEFAULTS = [
    { nome: "Agendada", cor: "#3b82f6", ordem: 1 },
    { nome: "Atendimento", cor: "#f97316", ordem: 2 },
    { nome: "Em Execução", cor: "#ef4444", ordem: 3 },
    { nome: "Aguardando Peças", cor: "#f59e0b", ordem: 4 },
    { nome: "Pronta", cor: "#22c55e", ordem: 5 },
    { nome: "Entregue", cor: "#6b7280", ordem: 6 },
  ];

  const fetchSituacoes = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    let { data } = await supabase
      .from("situacoes_os")
      .select("*")
      .order("ordem", { ascending: true });

    if ((!data || data.length === 0) && session?.user) {
      const { data: u } = await supabase
        .from("usuarios").select("empresa_id")
        .eq("auth_user_id", session.user.id).maybeSingle();
      if (u?.empresa_id) {
        await supabase.from("situacoes_os").insert(
          DEFAULTS.map(d => ({ ...d, empresa_id: u.empresa_id })) as any
        );
        const res = await supabase.from("situacoes_os").select("*").order("ordem", { ascending: true });
        data = res.data;
      }
    }
    if (data) setSituacoes(data);
    setLoading(false);
  };

  useEffect(() => { fetchSituacoes(); }, []);

  const salvar = async () => {
    if (!nome.trim()) {
      toast({ title: "Informe o nome da situação", variant: "destructive" });
      return;
    }
    try {
      if (editId) {
        const { error } = await supabase
          .from("situacoes_os")
          .update({ nome: nome.trim(), cor } as any)
          .eq("id", editId);
        if (error) {
          console.error("Erro ao atualizar situação:", error);
          toast({ title: "Erro ao atualizar: " + error.message, variant: "destructive" });
          return;
        }
        toast({ title: "Situação atualizada" });
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        let empresa_id: string | null = null;
        if (session?.user) {
          const { data: u } = await supabase.from("usuarios")
            .select("empresa_id").eq("auth_user_id", session.user.id).maybeSingle();
          empresa_id = u?.empresa_id ?? null;
        }
        if (!empresa_id) {
          toast({ title: "Empresa não encontrada para o usuário", variant: "destructive" });
          return;
        }
        const maxOrdem = situacoes.length > 0 ? Math.max(...situacoes.map(s => s.ordem)) : 0;
        const { error } = await supabase
          .from("situacoes_os")
          .insert({ nome: nome.trim(), cor, ordem: maxOrdem + 1, empresa_id } as any);
        if (error) {
          console.error("Erro ao adicionar situação:", error);
          toast({ title: "Erro ao adicionar: " + error.message, variant: "destructive" });
          return;
        }
        toast({ title: "Situação adicionada" });
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      toast({ title: "Erro inesperado ao salvar", variant: "destructive" });
      return;
    }
    setNome("");
    setCor("#3b82f6");
    setEditId(null);
    await fetchSituacoes();
  };

  const editar = (s: Situacao) => {
    setNome(s.nome);
    setCor(s.cor);
    setEditId(s.id);
  };

  const excluir = async (id: string) => {
    const { error } = await supabase.from("situacoes_os").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao remover", variant: "destructive" }); return; }
    toast({ title: "Situação removida" });
    fetchSituacoes();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings2 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Situações de Ordens de Serviço</h1>
          <p className="text-sm text-muted-foreground">Gerencie as situações/status disponíveis para as OS</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editId ? "Editar situação" : "Nova situação"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1.5">
              <Label>Nome</Label>
              <Input placeholder="Ex: Em Análise" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cor</Label>
              <Input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="w-16 h-9 p-1 cursor-pointer" />
            </div>
            <Button onClick={salvar} className="gap-1">
              <Plus className="h-4 w-4" />
              {editId ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cor</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {situacoes.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: s.cor }} />
                  </TableCell>
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => editar(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => excluir(s.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
