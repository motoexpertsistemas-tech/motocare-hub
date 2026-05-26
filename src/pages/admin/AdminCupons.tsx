import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminCupons() {
  const navigate = useNavigate();
  const [cupons, setCupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    codigo: "",
    descricao: "",
    tipo_desconto: "percentual",
    valor_desconto: "",
    max_usos: "",
    data_expiracao: "",
    primeiro_mes_apenas: false,
  });

  useEffect(() => {
    carregarCupons();
  }, []);

  const carregarCupons = async () => {
    const { data } = await supabase
      .from("cupons")
      .select("*")
      .order("created_at", { ascending: false });
    setCupons(data || []);
    setLoading(false);
  };

  const criarCupom = async () => {
    if (!form.codigo || !form.valor_desconto) {
      toast.error("Preencha código e valor do desconto");
      return;
    }
    const { error } = await supabase.from("cupons").insert({
      codigo: form.codigo.toUpperCase(),
      descricao: form.descricao,
      tipo_desconto: form.tipo_desconto,
      valor_desconto: Number(form.valor_desconto),
      max_usos: form.max_usos ? Number(form.max_usos) : null,
      data_expiracao: form.data_expiracao || null,
      primeiro_mes_apenas: form.primeiro_mes_apenas,
    });
    if (error) {
      toast.error("Erro ao criar cupom: " + error.message);
    } else {
      toast.success("Cupom criado!");
      setDialogOpen(false);
      setForm({
        codigo: "",
        descricao: "",
        tipo_desconto: "percentual",
        valor_desconto: "",
        max_usos: "",
        data_expiracao: "",
        primeiro_mes_apenas: false,
      });
      carregarCupons();
    }
  };

  const toggleCupom = async (id: string, ativo: boolean) => {
    await supabase.from("cupons").update({ ativo: !ativo }).eq("id", id);
    carregarCupons();
  };

  const deletarCupom = async (id: string) => {
    await supabase.from("cupons").delete().eq("id", id);
    toast.success("Cupom excluído");
    carregarCupons();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cupons de Desconto</h1>
          <p className="text-muted-foreground">{cupons.length} cupom(ns)</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={18} className="mr-2" /> Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Cupom</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Código</Label>
                  <Input
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    placeholder="EX: PROMO20"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={form.tipo_desconto}
                      onValueChange={(v) => setForm({ ...form, tipo_desconto: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentual">Percentual (%)</SelectItem>
                        <SelectItem value="valor_fixo">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      value={form.valor_desconto}
                      onChange={(e) => setForm({ ...form, valor_desconto: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Máx. Usos</Label>
                    <Input
                      type="number"
                      value={form.max_usos}
                      onChange={(e) => setForm({ ...form, max_usos: e.target.value })}
                      placeholder="Ilimitado"
                    />
                  </div>
                  <div>
                    <Label>Expiração</Label>
                    <Input
                      type="date"
                      value={form.data_expiracao}
                      onChange={(e) => setForm({ ...form, data_expiracao: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.primeiro_mes_apenas}
                    onCheckedChange={(v) => setForm({ ...form, primeiro_mes_apenas: v })}
                  />
                  <Label>Apenas primeiro mês</Label>
                </div>
                <Button onClick={criarCupom} className="w-full">
                  Criar Cupom
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            ← Voltar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Expiração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Ticket size={16} className="text-primary" />
                      <span className="font-mono font-bold">{c.codigo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.tipo_desconto === "percentual"
                      ? `${c.valor_desconto}%`
                      : `R$ ${Number(c.valor_desconto).toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    {c.usos_realizados}/{c.max_usos || "∞"}
                  </TableCell>
                  <TableCell>
                    {c.data_expiracao
                      ? new Date(c.data_expiracao).toLocaleDateString("pt-BR")
                      : "Sem limite"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={c.ativo ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleCupom(c.id, c.ativo)}
                    >
                      {c.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletarCupom(c.id)}
                    >
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {cupons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {loading ? "Carregando..." : "Nenhum cupom"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
