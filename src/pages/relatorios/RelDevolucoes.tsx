import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Check, X, ArrowLeft, Loader2, SearchX, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  STATUS_OPTIONS, CANAL_OPTIONS,
  useFuncionariosRelatorio, useFormasPagamentoRelatorio, useClientesRelatorio, getDefaultDates,
} from "@/hooks/useRelatorioVendasFilters";

export default function RelDevolucoes() {
  const navigate = useNavigate();
  const { firstDay, lastDay } = getDefaultDates();
  const [loja, setLoja] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [dataVendaInicio, setDataVendaInicio] = useState(firstDay);
  const [dataVendaFim, setDataVendaFim] = useState(lastDay);
  const [canal, setCanal] = useState("todos");
  const [cliente, setCliente] = useState("");
  const [produto, setProduto] = useState("");
  const [vendedor, setVendedor] = useState("todos");
  const [situacao, setSituacao] = useState("todos");
  const [formaPagamento, setFormaPagamento] = useState("todos");
  const [transportadora, setTransportadora] = useState("");
  const [centroCusto, setCentroCusto] = useState("todos");
  const [exibirDetalhado, setExibirDetalhado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [semResultados, setSemResultados] = useState(false);
  const [openCliente, setOpenCliente] = useState(false);

  const { data: funcionarios = [] } = useFuncionariosRelatorio();
  const { data: formasPg = [] } = useFormasPagamentoRelatorio();
  const { data: clientes = [] } = useClientesRelatorio();

  const limpar = () => {
    setLoja("todas"); setTipo("todos"); setDataVendaInicio(firstDay); setDataVendaFim(lastDay);
    setCanal("todos"); setCliente(""); setProduto(""); setVendedor("todos"); setSituacao("todos");
    setFormaPagamento("todos"); setTransportadora(""); setCentroCusto("todos"); setExibirDetalhado(false);
    setSemResultados(false);
  };

  const gerar = async () => {
    setLoading(true);
    setSemResultados(false);
    try {
      const { data, error } = await supabase
        .from("ordem_servico")
        .select("id, numero_os, cliente_nome, data_entrada, status, valor_total, canal_venda, vendedor, criado_por")
        .gte("data_entrada", `${dataVendaInicio}T00:00:00`)
        .lte("data_entrada", `${dataVendaFim}T23:59:59`);
      if (error) throw error;

      let filtered = (data || []).filter((r: any) => (r.status || "").toLowerCase().includes("devol"));
      if (cliente) filtered = filtered.filter((r: any) => (r.cliente_nome || "").toLowerCase().includes(cliente.toLowerCase()));
      if (vendedor !== "todos") filtered = filtered.filter((r: any) => (r.vendedor || r.criado_por || "").toLowerCase().includes(vendedor.toLowerCase()));

      if (filtered.length === 0) { setSemResultados(true); return; }
      toast.success(`${filtered.length} devoluções encontradas!`);
    } catch (err: any) {
      toast.error("Erro: " + (err?.message || "desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios/vendas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <RotateCcw className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Relatório de devoluções</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Relatórios de vendas &gt; Devoluções</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Loja</Label>
              <Select value={loja} onValueChange={setLoja}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todas">Todas</SelectItem><SelectItem value="matriz">Matriz</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <Label>Data da venda</Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={dataVendaInicio} onChange={(e) => setDataVendaInicio(e.target.value)} />
                <span className="text-xs text-muted-foreground">a</span>
                <Input type="date" value={dataVendaFim} onChange={(e) => setDataVendaFim(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Canal</Label>
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {CANAL_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Popover open={openCliente} onOpenChange={setOpenCliente}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-10">
                    <span className="truncate">{cliente || "Digite para buscar"}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { setCliente(""); setOpenCliente(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", !cliente ? "opacity-100" : "opacity-0")} /> Todos
                        </CommandItem>
                        {clientes.map((c) => {
                          const nome = c.nome_completo || c.nome_fantasia || c.telefone || "";
                          return (
                            <CommandItem key={c.id} value={nome} onSelect={() => { setCliente(nome); setOpenCliente(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", cliente === nome ? "opacity-100" : "opacity-0")} /> {nome}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Produto</Label>
              <Input value={produto} onChange={(e) => setProduto(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Vendedor</Label>
              <Select value={vendedor} onValueChange={setVendedor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {funcionarios.map(f => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select value={situacao} onValueChange={setSituacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Forma de pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {formasPg.map(f => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Transportadora</Label>
              <Input placeholder="Digite para buscar" value={transportadora} onChange={(e) => setTransportadora(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Centro de custo</Label>
              <Select value={centroCusto} onValueChange={setCentroCusto}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={exibirDetalhado} onCheckedChange={(v) => setExibirDetalhado(!!v)} />
              Exibir relatório detalhado
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={gerar} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}Gerar
            </Button>
            <Button variant="destructive" onClick={limpar}><X className="h-4 w-4 mr-1" />Limpar</Button>
          </div>
        </CardContent>
      </Card>

      {semResultados && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Nenhuma devolução encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou o período selecionado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
