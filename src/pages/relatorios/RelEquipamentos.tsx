import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Monitor, Check, X, ArrowLeft, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function RelEquipamentos() {
  const navigate = useNavigate();
  const [loja, setLoja] = useState("todas");
  const [cliente, setCliente] = useState("");
  const [vendedor, setVendedor] = useState("todos");
  const [tecnico, setTecnico] = useState("todos");
  const [dataEntradaInicio, setDataEntradaInicio] = useState("2026-02-01");
  const [dataEntradaFim, setDataEntradaFim] = useState("2026-02-28");
  const [dataSaidaInicio, setDataSaidaInicio] = useState("");
  const [dataSaidaFim, setDataSaidaFim] = useState("");
  const [canal, setCanal] = useState("todos");
  const [situacao, setSituacao] = useState("todos");
  const [centroCusto, setCentroCusto] = useState("todos");
  const [equipamento, setEquipamento] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [openCliente, setOpenCliente] = useState(false);

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes_rel_equip"],
    queryFn: async () => {
      const { data } = await supabase.from("clientes").select("id, nome_completo, nome_fantasia").eq("ativo", true).order("nome_completo");
      return data || [];
    },
  });

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios_rel_equip"],
    queryFn: async () => {
      const { data } = await supabase.from("funcionarios").select("id, nome").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  const { data: situacoes = [] } = useQuery({
    queryKey: ["situacoes_os_rel_equip"],
    queryFn: async () => {
      const { data } = await supabase.from("situacoes_os").select("id, nome").order("ordem");
      return data || [];
    },
  });

  const limpar = () => {
    setLoja("todas"); setCliente(""); setVendedor("todos"); setTecnico("todos");
    setDataEntradaInicio("2026-02-01"); setDataEntradaFim("2026-02-28");
    setDataSaidaInicio(""); setDataSaidaFim(""); setCanal("todos");
    setSituacao("todos"); setCentroCusto("todos"); setEquipamento("");
    setMarca(""); setModelo(""); setSerie("");
  };

  const clienteSelecionado = clientes.find(c => c.id === cliente);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios/os")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Monitor className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Relatório de equipamentos</h1>
          <p className="text-xs text-muted-foreground">Serviços / OS &gt; Relatórios &gt; Equipamentos</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Loja, Cliente, Vendedor, Técnico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Loja</Label>
              <Select value={loja} onValueChange={setLoja}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todas">DKA GERENCIAL</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Popover open={openCliente} onOpenChange={setOpenCliente}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className={cn("w-full justify-between font-normal", !cliente && "text-muted-foreground")}>
                    {clienteSelecionado ? (clienteSelecionado.nome_fantasia || clienteSelecionado.nome_completo) : "Todos"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="todos" onSelect={() => { setCliente(""); setOpenCliente(false); }}>Todos</CommandItem>
                        {clientes.map(c => (
                          <CommandItem key={c.id} value={c.nome_completo || ""} onSelect={() => { setCliente(c.id); setOpenCliente(false); }}>
                            {c.nome_fantasia || c.nome_completo}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Vendedor</Label>
              <Select value={vendedor} onValueChange={setVendedor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Técnico</Label>
              <Select value={tecnico} onValueChange={setTecnico}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data entrada, Data saída, Canal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Data de entrada</Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={dataEntradaInicio} onChange={(e) => setDataEntradaInicio(e.target.value)} />
                <span className="text-xs text-muted-foreground">a</span>
                <Input type="date" value={dataEntradaFim} onChange={(e) => setDataEntradaFim(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Data de saída</Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={dataSaidaInicio} onChange={(e) => setDataSaidaInicio(e.target.value)} />
                <span className="text-xs text-muted-foreground">a</span>
                <Input type="date" value={dataSaidaFim} onChange={(e) => setDataSaidaFim(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Canal</Label>
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="balcao">Balcão</SelectItem>
                  <SelectItem value="os">Ordem de Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Situação, Centro de custo, Equipamento, Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select value={situacao} onValueChange={setSituacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {situacoes.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Centro de custo</Label>
              <Select value={centroCusto} onValueChange={setCentroCusto}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Equipamento</Label>
              <Input value={equipamento} onChange={(e) => setEquipamento(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Input value={marca} onChange={(e) => setMarca(e.target.value)} />
            </div>
          </div>

          {/* Modelo, Série */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Input value={modelo} onChange={(e) => setModelo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Série</Label>
              <Input value={serie} onChange={(e) => setSerie(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="bg-green-600 hover:bg-green-700"><Check className="h-4 w-4 mr-1" />Gerar</Button>
            <Button variant="destructive" onClick={limpar}><X className="h-4 w-4 mr-1" />Limpar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
