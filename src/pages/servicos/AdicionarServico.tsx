import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Wrench, RefreshCw, Check, X, Home, ChevronRight } from "lucide-react";
import { BRLInput } from "@/components/BRLInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useEmpresa } from "@/contexts/EmpresaContext";

function gerarCodigo() {
  return "OS-" + String(Math.floor(1000 + Math.random() * 9000));
}

export default function AdicionarServico() {
  const { empresaId } = useEmpresa();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const qc = useQueryClient();

  const [form, setForm] = useState({
    nome: "",
    codigo_interno: gerarCodigo(),
    valor_custo: "",
    valor_venda: "",
    comissao: "",
    descricao: "",
    tempo_estimado_min: "",
    custo_homem_hora_id: "",
  });

  const { data: custosHH = [] } = useQuery({
    queryKey: ["custo-homem-hora"],
    queryFn: async () => {
      const { data, error } = await supabase.from("custo_homem_hora" as any).select("*").order("nome");
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  useEffect(() => {
    if (id) {
      supabase
        .from("servicos" as any)
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) return;
          const s = data as any;
           setForm({
            nome: s.nome || "",
            codigo_interno: s.codigo_interno || "",
            valor_custo: s.valor_custo ? String(s.valor_custo) : "",
            valor_venda: s.valor_venda ? String(s.valor_venda) : "",
            comissao: s.comissao ? String(s.comissao) : "",
            descricao: s.descricao || "",
            tempo_estimado_min: s.tempo_estimado_min ? String(s.tempo_estimado_min) : "",
            custo_homem_hora_id: s.custo_homem_hora_id || "",
          });
        });
    }
  }, [id]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome,
        codigo_interno: form.codigo_interno,
        valor_custo: Number(form.valor_custo) || 0,
        valor_venda: Number(form.valor_venda) || 0,
        comissao: Number(form.comissao) || 0,
        descricao: form.descricao || null,
        tempo_estimado_min: Number(form.tempo_estimado_min) || null,
        custo_homem_hora_id: form.custo_homem_hora_id && form.custo_homem_hora_id !== "none" ? form.custo_homem_hora_id : null,
      };
      if (isEditing) {
        const { error } = await supabase.from("servicos" as any).update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("servicos" as any).insert({ ...payload, empresa_id: empresaId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
      toast.success(isEditing ? "Serviço atualizado!" : "Serviço cadastrado!");
      navigate("/servicos");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Home className="h-4 w-4" /> Início
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/servicos" className="hover:text-foreground transition-colors">Serviços</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{isEditing ? "Editar" : "Adicionar"}</span>
      </div>

      <div className="flex items-center gap-3">
        <Wrench className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">
          {isEditing ? "Editar serviço" : "Adicionar serviço"}
        </h1>
      </div>

      <Tabs defaultValue="dados-gerais">
        <TabsList>
          <TabsTrigger value="dados-gerais">Dados gerais</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
        </TabsList>

        <TabsContent value="dados-gerais">
          <Card className="glass-panel">
            <CardContent className="p-6 space-y-6">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Nome <span className="text-destructive">*</span></Label>
                  <Input value={form.nome} onChange={(e) => set("nome", e.target.value.toUpperCase())} placeholder="Ex: TROCA DE ÓLEO" className="uppercase" />
                </div>
                <div>
                  <Label>Código interno <span className="text-destructive">*</span></Label>
                  <div className="flex gap-2">
                    <Input value={form.codigo_interno} onChange={(e) => set("codigo_interno", e.target.value)} />
                    <Button variant="outline" size="icon" onClick={() => set("codigo_interno", gerarCodigo())} title="Gerar novo código">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Valor de custo</Label>
                  <BRLInput value={form.valor_custo} onChange={(v) => set("valor_custo", v)} prefix="R$" placeholder="0,00" />
                </div>
                <div>
                  <Label>Valor de venda</Label>
                  <BRLInput value={form.valor_venda} onChange={(v) => set("valor_venda", v)} prefix="R$" placeholder="0,00" />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <Label>Comissão (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" step="0.1" value={form.comissao} onChange={(e) => set("comissao", e.target.value)} placeholder="0" className="max-w-[120px]" />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div>
                  <Label>Tempo estimado (min)</Label>
                  <Input type="number" value={form.tempo_estimado_min} onChange={(e) => set("tempo_estimado_min", e.target.value)} placeholder="Ex: 30" className="max-w-[160px]" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Vincular Mão de Obra</Label>
                  <Select value={form.custo_homem_hora_id} onValueChange={(v) => set("custo_homem_hora_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a mão de obra..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {custosHH.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome} — R$ {Number(c.valor_hora).toFixed(2)}/h
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Detalhes do serviço..." rows={5} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal">
          <Card className="glass-panel">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Configurações fiscais estarão disponíveis em breve.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={() => mutation.mutate()} disabled={!form.nome || mutation.isPending}>
          <Check className="h-4 w-4 mr-1" />
          {mutation.isPending ? "Salvando..." : isEditing ? "Salvar" : "Cadastrar"}
        </Button>
        <Button variant="destructive" onClick={() => navigate("/servicos")}>
          <X className="h-4 w-4 mr-1" /> Cancelar
        </Button>
      </div>
    </div>
  );
}
