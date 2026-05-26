import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import EditFuncionarioDialog, { type FuncionarioData } from "@/components/EditFuncionarioDialog";
import { useEmpresa } from "@/contexts/EmpresaContext";

export default function Funcionarios() {
  const { empresaId } = useEmpresa();
  const [busca, setBusca] = useState("");
  const [funcionarios, setFuncionarios] = useState<FuncionarioData[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFunc, setEditingFunc] = useState<FuncionarioData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFuncionarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("funcionarios" as any)
      .select("*")
      .order("nome");
    if (error) {
      toast({ title: "Erro ao carregar funcionários", description: error.message, variant: "destructive" });
    } else {
      const mapped = (data as any[]).map((f: any) => ({
        id: f.id,
        nome: f.nome || "",
        cpf: f.cpf || "",
        rg: f.rg || "",
        data_nascimento: f.data_nascimento || "",
        sexo: f.sexo || "",
        email: f.email || "",
        comissao: f.comissao != null ? String(f.comissao).replace(".", ",") : "0,00",
        situacao: f.situacao || "Ativo",
        permitir_acesso: f.permitir_acesso ?? true,
        grupo_acesso: f.grupo_acesso || "Administração",
        observacoes: f.observacoes || "",
        desconto_maximo: f.desconto_maximo != null ? String(f.desconto_maximo).replace(".", ",") : "100,00",
        codigo_gerente: f.codigo_gerente || "",
        habilitar_codigo_gerente: f.habilitar_codigo_gerente ?? false,
        hora_entrada: f.hora_entrada || "00:00",
        inicio_almoco: f.inicio_almoco || "12:00",
        fim_almoco: f.fim_almoco || "12:00",
        hora_saida: f.hora_saida || "23:59",
        dias_permitidos: f.dias_permitidos || ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"],
        telefone_fixo: f.telefone_fixo || "",
        celular1: f.celular1 || "",
        celular2: f.celular2 || "",
        cep: f.cep || "",
        logradouro: f.logradouro || "",
        numero: f.numero || "",
        complemento: f.complemento || "",
        bairro: f.bairro || "",
        cidade_uf: f.cidade_uf || "",
        lojas: f.lojas || ["Matriz"],
        cargo: f.cargo || "",
        telefone: f.telefone || "",
        ativo: f.ativo ?? true,
      }));
      setFuncionarios(mapped);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFuncionarios(); }, []);

  const filtrados = funcionarios.filter((f) =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    f.cargo.toLowerCase().includes(busca.toLowerCase())
  );

  const handleEdit = (f: FuncionarioData) => {
    setEditingFunc(f);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingFunc(null);
    setDialogOpen(true);
  };

  const handleSave = async (data: FuncionarioData) => {
    // Validar CPF duplicado
    const cpfLimpo = data.cpf?.replace(/\D/g, "") || "";
    if (cpfLimpo) {
      const { data: existing } = await supabase
        .from("funcionarios" as any)
        .select("id")
        .eq("cpf", data.cpf)
        .maybeSingle() as any;
      if (existing && existing.id !== data.id) {
        toast({ title: "CPF já cadastrado", description: "Já existe um funcionário com este CPF.", variant: "destructive" });
        return false;
      }
    }

    const payload: any = {
      nome: data.nome,
      cpf: data.cpf,
      rg: data.rg,
      data_nascimento: data.data_nascimento || null,
      sexo: data.sexo,
      email: data.email,
      comissao: parseFloat(data.comissao.replace(",", ".")) || 0,
      situacao: data.situacao,
      permitir_acesso: data.permitir_acesso,
      grupo_acesso: data.grupo_acesso,
      observacoes: data.observacoes,
      desconto_maximo: parseFloat(data.desconto_maximo.replace(",", ".")) || 0,
      codigo_gerente: data.codigo_gerente,
      habilitar_codigo_gerente: data.habilitar_codigo_gerente,
      hora_entrada: data.hora_entrada,
      inicio_almoco: data.inicio_almoco,
      fim_almoco: data.fim_almoco,
      hora_saida: data.hora_saida,
      dias_permitidos: data.dias_permitidos,
      telefone_fixo: data.telefone_fixo,
      celular1: data.celular1,
      celular2: data.celular2,
      cep: data.cep,
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade_uf: data.cidade_uf,
      lojas: data.lojas,
      cargo: data.cargo,
      telefone: data.telefone,
      ativo: data.ativo,
      empresa_id: empresaId,
    };

    if (data.id && funcionarios.some((f) => f.id === data.id)) {
      const { error } = await supabase.from("funcionarios" as any).update(payload).eq("id", data.id);
      if (error) { toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" }); return false; }
    } else {
      const { error } = await supabase.from("funcionarios" as any).insert(payload);
      if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); return false; }
    }
    fetchFuncionarios();
    return true;
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("funcionarios" as any).delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Funcionário excluído" });
    fetchFuncionarios();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Funcionários
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie os funcionários da empresa</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Permite acesso</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell>{f.cpf || "-"}</TableCell>
                    <TableCell className="text-primary">{f.email}</TableCell>
                    <TableCell>{f.celular1 || f.telefone}</TableCell>
                    <TableCell>
                      {f.permitir_acesso ? (
                        <span className="text-green-600 font-bold">✔</span>
                      ) : (
                        <span className="text-destructive font-bold">✖</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {f.grupo_acesso}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(f)} title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(f.id)} title="Excluir">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EditFuncionarioDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        funcionario={editingFunc}
        onSave={handleSave}
      />
    </div>
  );
}
