import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, Check, X, ArrowLeft, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function RelOrdensServico() {
  const navigate = useNavigate();
  const [loja, setLoja] = useState("todas");
  const [dataEntradaInicio, setDataEntradaInicio] = useState("2025-12-01");
  const [dataEntradaFim, setDataEntradaFim] = useState("2026-02-28");
  const [dataSaidaInicio, setDataSaidaInicio] = useState("");
  const [dataSaidaFim, setDataSaidaFim] = useState("");
  const [canal, setCanal] = useState("todos");
  const [cliente, setCliente] = useState("");
  const [vendedor, setVendedor] = useState("todos");
  const [tecnico, setTecnico] = useState("todos");
  const [equipamento, setEquipamento] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [produto, setProduto] = useState("");
  const [servico, setServico] = useState("");
  const [situacao, setSituacao] = useState("todos");
  const [formaPagamento, setFormaPagamento] = useState("todos");
  const [transportadora, setTransportadora] = useState("");
  const [centroCusto, setCentroCusto] = useState("todos");
  const [detalhado, setDetalhado] = useState(false);

  const [openCliente, setOpenCliente] = useState(false);
  const [openProduto, setOpenProduto] = useState(false);
  const [openServico, setOpenServico] = useState(false);

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes_rel_os"],
    queryFn: async () => {
      const { data } = await supabase.from("clientes").select("id, nome_completo, nome_fantasia").eq("ativo", true).order("nome_completo");
      return data || [];
    },
  });

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios_rel_os"],
    queryFn: async () => {
      const { data } = await supabase.from("funcionarios").select("id, nome").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  const { data: situacoes = [] } = useQuery({
    queryKey: ["situacoes_os_rel"],
    queryFn: async () => {
      const { data } = await supabase.from("situacoes_os").select("id, nome").order("ordem");
      return data || [];
    },
  });

  const { data: formasPgto = [] } = useQuery({
    queryKey: ["formas_pagamento_rel_os"],
    queryFn: async () => {
      const { data } = await supabase.from("formas_pagamento").select("id, nome").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  const { data: servicos = [] } = useQuery({
    queryKey: ["servicos_rel_os"],
    queryFn: async () => {
      const { data } = await supabase.from("servicos").select("id, nome").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos_rel_os"],
    queryFn: async () => {
      const { data } = await supabase.from("produtos_catalogo").select("id, nome").order("nome").limit(2000);
      return data || [];
    },
  });

  const limpar = () => {
    setLoja("todas"); setDataEntradaInicio("2025-12-01"); setDataEntradaFim("2026-02-28");
    setDataSaidaInicio(""); setDataSaidaFim(""); setCanal("todos"); setCliente("");
    setVendedor("todos"); setTecnico("todos"); setEquipamento(""); setMarca("");
    setModelo(""); setSerie(""); setProduto(""); setServico(""); setSituacao("todos");
    setFormaPagamento("todos"); setTransportadora(""); setCentroCusto("todos"); setDetalhado(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios/os")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Wrench className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Relatório de ordens de serviços</h1>
          <p className="text-xs text-muted-foreground">Serviços / OS &gt; Relatórios &gt; Ordens de serviços</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Loja, Data entrada, Data saída */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Loja</Label>
              <Select value={loja} onValueChange={setLoja}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todas">DKA GERENCIAL</SelectItem></SelectContent>
              </Select>
            </div>
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
          </div>

          {/* Canal, Cliente, Vendedor, Técnico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Canal</Label>
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos</SelectItem></SelectContent>
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
                        {clientes.map((c) => {
                          const display = c.nome_fantasia ? `${c.nome_completo} (${c.nome_fantasia})` : (c.nome_completo || "");
                          return (
                            <CommandItem key={c.id} value={`${c.nome_completo || ""} ${c.nome_fantasia || ""}`} onSelect={() => { setCliente(display); setOpenCliente(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", cliente === display ? "opacity-100" : "opacity-0")} />
                              {display}
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
              <Label>Vendedor</Label>
              <Select value={vendedor} onValueChange={setVendedor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Técnico</Label>
              <Select value={tecnico} onValueChange={setTecnico}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Equipamento, Marca, Modelo, Série */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Equipamento</Label>
              <Input value={equipamento} onChange={(e) => setEquipamento(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Input value={marca} onChange={(e) => setMarca(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Input value={modelo} onChange={(e) => setModelo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Série</Label>
              <Input value={serie} onChange={(e) => setSerie(e.target.value)} />
            </div>
          </div>

          {/* Produto, Serviço, Situação, Forma pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Produto</Label>
              <Popover open={openProduto} onOpenChange={setOpenProduto}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-10">
                    <span className="truncate">{produto || "Buscar produto..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar produto..." />
                    <CommandList>
                      <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                      <CommandGroup>
                        {produtos.map((p) => (
                          <CommandItem key={p.id} value={p.nome} onSelect={() => { setProduto(p.nome); setOpenProduto(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", produto === p.nome ? "opacity-100" : "opacity-0")} />
                            {p.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Serviço</Label>
              <Popover open={openServico} onOpenChange={setOpenServico}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-10">
                    <span className="truncate">{servico || "Buscar serviço..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar serviço..." />
                    <CommandList>
                      <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                      <CommandGroup>
                        {servicos.map((s) => (
                          <CommandItem key={s.id} value={s.nome} onSelect={() => { setServico(s.nome); setOpenServico(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", servico === s.nome ? "opacity-100" : "opacity-0")} />
                            {s.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select value={situacao} onValueChange={setSituacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {situacoes.map((s) => (
                    <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Forma de pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {formasPgto.map((f) => (
                    <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transportadora, Centro de custo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={detalhado} onCheckedChange={(v) => setDetalhado(!!v)} />
              Exibir relatório detalhado
            </label>
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
