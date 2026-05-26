import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText, Plus, Trash2, ArrowLeft, Save, X, Truck, MapPin,
  CreditCard, Paperclip, MessageSquare, Package, Wrench, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ProdutoItem {
  id: string;
  produto_id: string;
  produto_nome: string;
  detalhes: string;
  quantidade: number;
  valor: number;
  desconto: number;
  subtotal: number;
}

interface ServicoItem {
  id: string;
  servico_nome: string;
  detalhes: string;
  quantidade: number;
  valor: number;
  desconto: number;
  subtotal: number;
}

export default function AdicionarOrcamento() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const isEditing = !!editId;
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Dados gerais
  const [numero, setNumero] = useState("Auto");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [vendedorId, setVendedorId] = useState("");
  const [vendedorNome, setVendedorNome] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [prazoEntrega, setPrazoEntrega] = useState("");
  const [nroPedidoCli, setNroPedidoCli] = useState("");
  const [situacao, setSituacao] = useState("em_aberto");
  const [canalVenda, setCanalVenda] = useState("");
  const [comissao, setComissao] = useState("");
  const [parceiro, setParceiro] = useState("");
  const [comissaoParceiro, setComissaoParceiro] = useState("");
  const [introducao, setIntroducao] = useState("");
  const [openCliente, setOpenCliente] = useState(false);
  const [openProduto, setOpenProduto] = useState<number | null>(null);

  // Produtos
  const [produtos, setProdutos] = useState<ProdutoItem[]>([]);

  // Serviços
  const [servicos, setServicos] = useState<ServicoItem[]>([]);

  // Transporte
  const [valorFrete, setValorFrete] = useState("");
  const [transportadora, setTransportadora] = useState("");

  // Endereço
  const [usarEnderecoEntrega, setUsarEnderecoEntrega] = useState(false);
  const [enderecoEntrega, setEnderecoEntrega] = useState("");

  // Totais
  const [descontoPerc, setDescontoPerc] = useState("");
  const [descontoValor, setDescontoValor] = useState("");

  // Pagamento
  const [formaPagamento, setFormaPagamento] = useState("");
  const [parcelas, setParcelas] = useState("1");

  // Observações
  const [observacoesPadrao, setObservacoesPadrao] = useState("");
  const [observacoesInternas, setObservacoesInternas] = useState("");

  // Queries
  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes_orc_add"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("id, nome_completo, nome_fantasia, telefone").eq("ativo", true).order("nome_completo");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios_orc_add"],
    queryFn: async () => {
      const { data, error } = await supabase.from("funcionarios").select("id, nome").eq("ativo", true).order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: produtosCatalogo = [] } = useQuery({
    queryKey: ["produtos_orc_add"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos_catalogo").select("id, nome, preco_custo, precos_venda, estoque_quantidade, localizacao").order("nome").limit(2000);
      if (error) throw error;
      // Deduplica por nome, mantendo o primeiro de cada
      const seen = new Set<string>();
      return (data || []).filter(p => {
        const key = p.nome?.toUpperCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
  });

  const { data: servicosCatalogo = [] } = useQuery({
    queryKey: ["servicos_orc_add"],
    queryFn: async () => {
      const { data, error } = await supabase.from("servicos").select("id, nome, preco").eq("ativo", true).order("nome");
      if (error) throw error;
      return data || [];
    },
  });
  // Load existing orcamento for edit mode
  const { data: orcamentoExistente } = useQuery({
    queryKey: ["orcamento_edit", editId],
    enabled: isEditing,
    queryFn: async () => {
      const { data, error } = await supabase.from("orcamentos").select("*").eq("id", editId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: itensExistentes } = useQuery({
    queryKey: ["orcamento_itens_edit", editId],
    enabled: isEditing,
    queryFn: async () => {
      const { data, error } = await supabase.from("orcamentos_itens").select("*").eq("orcamento_id", editId!);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: servicosExistentes } = useQuery({
    queryKey: ["orcamento_servicos_edit", editId],
    enabled: isEditing,
    queryFn: async () => {
      const { data, error } = await supabase.from("orcamentos_servicos").select("*").eq("orcamento_id", editId!);
      if (error) throw error;
      return data || [];
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (!isEditing || loaded || !orcamentoExistente) return;
    const o = orcamentoExistente;
    setClienteId(o.cliente_id || "");
    setClienteNome(o.cliente_nome || "");
    setVendedorId(o.vendedor_id || "");
    setVendedorNome(o.vendedor_nome || "");
    setData(o.data_orcamento ? o.data_orcamento.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setPrazoEntrega(o.prazo_entrega || "");
    setNroPedidoCli(o.nro_pedido_cli || "");
    setSituacao(o.situacao || "em_aberto");
    setCanalVenda(o.canal_venda || "");
    setComissao(o.comissao ? String(o.comissao) : "");
    setParceiro(o.parceiro || "");
    setComissaoParceiro(o.comissao_parceiro ? String(o.comissao_parceiro) : "");
    setIntroducao(o.introducao || "");
    setValorFrete(o.valor_frete ? String(o.valor_frete) : "");
    setTransportadora(o.transportadora || "");
    setUsarEnderecoEntrega(!!o.usar_endereco_entrega);
    setEnderecoEntrega(o.endereco_entrega || "");
    setDescontoPerc(o.desconto_percentual ? String(o.desconto_percentual) : "");
    setDescontoValor(o.desconto_valor ? String(o.desconto_valor) : "");
    setFormaPagamento(o.forma_pagamento || "");
    setParcelas(o.parcelas ? String(o.parcelas) : "1");
    setObservacoesPadrao(o.observacoes_padrao || "");
    setObservacoesInternas(o.observacoes_internas || "");
    setNumero(o.numero ? String(o.numero) : "Auto");

    if (itensExistentes && itensExistentes.length > 0) {
      setProdutos(itensExistentes.map((it: any) => ({
        id: it.id,
        produto_id: it.produto_id || "",
        produto_nome: it.produto_nome || "",
        detalhes: it.observacoes || "",
        quantidade: it.quantidade || 1,
        valor: it.valor_unitario || 0,
        desconto: it.desconto || 0,
        subtotal: it.valor_total || 0,
      })));
    }

    if (servicosExistentes && servicosExistentes.length > 0) {
      setServicos(servicosExistentes.map((s: any) => ({
        id: s.id,
        servico_nome: s.servico_nome || "",
        detalhes: s.detalhes || "",
        quantidade: s.quantidade || 1,
        valor: s.valor || 0,
        desconto: s.desconto || 0,
        subtotal: s.subtotal || 0,
      })));
    }

    setLoaded(true);
  }, [isEditing, loaded, orcamentoExistente, itensExistentes, servicosExistentes]);


  const totalProdutos = produtos.reduce((s, p) => s + p.subtotal, 0);
  const totalServicos = servicos.reduce((s, p) => s + p.subtotal, 0);
  const frete = parseFloat(valorFrete) || 0;
  const descP = parseFloat(descontoPerc) || 0;
  const descV = parseFloat(descontoValor) || 0;
  const subtotalBruto = totalProdutos + totalServicos + frete;
  const descontoCalculado = descP > 0 ? subtotalBruto * (descP / 100) : descV;
  const valorTotal = Math.max(0, subtotalBruto - descontoCalculado);

  // Produto helpers
  const getPrecoVenda = (pc: any): number => {
    if (pc.precos_venda && Array.isArray(pc.precos_venda)) {
      const varejo = pc.precos_venda.find((p: any) => (p.tipo || p.nome || "").toUpperCase() === "VAREJO");
      if (varejo) return parseFloat(varejo.valor_venda_utilizado || varejo.valor || varejo.preco || 0);
      if (pc.precos_venda.length > 0) {
        const first = pc.precos_venda[0];
        return parseFloat(first.valor_venda_utilizado || first.valor || first.preco || 0);
      }
    }
    return pc.preco_custo || 0;
  };

  const addProduto = () => {
    setProdutos([...produtos, { id: crypto.randomUUID(), produto_id: "", produto_nome: "", detalhes: "", quantidade: 1, valor: 0, desconto: 0, subtotal: 0 }]);
  };

  const updateProduto = (idx: number, fields: Record<string, any>) => {
    const updated = [...produtos];
    Object.assign(updated[idx], fields);
    updated[idx].subtotal = (updated[idx].quantidade * updated[idx].valor) - updated[idx].desconto;
    setProdutos(updated);
  };

  const removeProduto = (idx: number) => setProdutos(produtos.filter((_, i) => i !== idx));

  // Serviço helpers
  const addServico = () => {
    setServicos([...servicos, { id: crypto.randomUUID(), servico_nome: "", detalhes: "", quantidade: 1, valor: 0, desconto: 0, subtotal: 0 }]);
  };

  const updateServico = (idx: number, field: string, value: any) => {
    const updated = [...servicos];
    (updated[idx] as any)[field] = value;
    updated[idx].subtotal = (updated[idx].quantidade * updated[idx].valor) - updated[idx].desconto;
    setServicos(updated);
  };

  const removeServico = (idx: number) => setServicos(servicos.filter((_, i) => i !== idx));

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const salvar = async () => {
    if (!clienteNome) { toast.error("Selecione um cliente"); return; }
    setSaving(true);
    try {
      const payload = {
        cliente_id: clienteId || null,
        cliente_nome: clienteNome,
        vendedor_id: vendedorId || null,
        vendedor_nome: vendedorNome || null,
        data_orcamento: `${data}T00:00:00`,
        prazo_entrega: prazoEntrega || null,
        nro_pedido_cli: nroPedidoCli || null,
        situacao,
        canal_venda: canalVenda || null,
        comissao: parseFloat(comissao) || 0,
        parceiro: parceiro || null,
        comissao_parceiro: parseFloat(comissaoParceiro) || 0,
        introducao: introducao || null,
        valor_frete: frete,
        transportadora: transportadora || null,
        usar_endereco_entrega: usarEnderecoEntrega,
        endereco_entrega: enderecoEntrega || null,
        valor_produtos: totalProdutos,
        valor_servicos: totalServicos,
        desconto_percentual: descP,
        desconto_valor: descontoCalculado,
        valor_total: valorTotal,
        desconto: descontoCalculado,
        forma_pagamento: formaPagamento || null,
        parcelas: parseInt(parcelas) || 1,
        observacoes_padrao: observacoesPadrao || null,
        observacoes_internas: observacoesInternas || null,
      };

      let orcId: string;

      if (isEditing) {
        const { error } = await supabase.from("orcamentos").update(payload).eq("id", editId!);
        if (error) throw error;
        orcId = editId!;

        // Delete existing items and re-insert
        await supabase.from("orcamentos_itens").delete().eq("orcamento_id", orcId);
        await supabase.from("orcamentos_servicos").delete().eq("orcamento_id", orcId);
      } else {
        const { data: orc, error } = await supabase.from("orcamentos").insert(payload).select().single();
        if (error) throw error;
        orcId = orc.id;
      }

      // Insert product items
      if (produtos.length > 0) {
        const itens = produtos.filter(p => p.produto_nome).map(p => ({
          orcamento_id: orcId,
          produto_id: p.produto_id || null,
          produto_nome: p.produto_nome,
          quantidade: p.quantidade,
          valor_unitario: p.valor,
          valor_total: p.subtotal,
          desconto: p.desconto,
          observacoes: p.detalhes || null,
        }));
        if (itens.length > 0) {
          const { error: e2 } = await supabase.from("orcamentos_itens").insert(itens);
          if (e2) console.error("Erro itens:", e2);
        }
      }

      // Insert service items
      if (servicos.length > 0) {
        const svcs = servicos.filter(s => s.servico_nome).map(s => ({
          orcamento_id: orcId,
          servico_nome: s.servico_nome,
          detalhes: s.detalhes || null,
          quantidade: s.quantidade,
          valor: s.valor,
          desconto: s.desconto,
          subtotal: s.subtotal,
        }));
        if (svcs.length > 0) {
          const { error: e3 } = await supabase.from("orcamentos_servicos").insert(svcs);
          if (e3) console.error("Erro serviços:", e3);
        }
      }

      toast.success(isEditing ? "Orçamento atualizado com sucesso!" : "Orçamento criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      navigate("/orcamentos/produtos");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/orcamentos/produtos")}><ArrowLeft className="h-5 w-5" /></Button>
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{isEditing ? "Editar orçamento" : "Adicionar orçamento"}</h1>
            <p className="text-xs text-muted-foreground">Início &gt; Orçamentos de produtos &gt; {isEditing ? "Editar" : "Adicionar"}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate("/orcamentos/produtos")}>Voltar</Button>
      </div>

      {/* Dados Gerais */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Dados gerais</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Número*</Label><Input value={numero} disabled className="bg-muted" /></div>
            <div>
              <Label>Cliente*</Label>
              <Popover open={openCliente} onOpenChange={setOpenCliente}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal h-10">
                    <span className="truncate">{clienteNome || "Digite para buscar"}</span>
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {clientes.map((c) => {
                          const nome = c.nome_completo || c.nome_fantasia || c.telefone || "";
                          return (
                            <CommandItem key={c.id} value={nome} onSelect={() => { setClienteId(c.id); setClienteNome(nome); setOpenCliente(false); }}>{nome}</CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Vendedor / Responsável</Label>
              <Select value={vendedorId} onValueChange={(v) => { setVendedorId(v); const f = funcionarios.find(x => x.id === v); setVendedorNome(f?.nome || ""); }}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>{funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><Label>Data*</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
            <div><Label>Prazo de entrega</Label><Input type="date" value={prazoEntrega} onChange={e => setPrazoEntrega(e.target.value)} /></div>
            <div><Label>Nro pedido do cli</Label><Input value={nroPedidoCli} onChange={e => setNroPedidoCli(e.target.value)} /></div>
            <div>
              <Label>Situação</Label>
              <Select value={situacao} onValueChange={setSituacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_aberto">Em aberto</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><Label>Canal de venda*</Label>
              <Select value={canalVenda} onValueChange={setCanalVenda}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Comissão (%)</Label><Input type="number" value={comissao} onChange={e => setComissao(e.target.value)} placeholder="0,00" /></div>
            <div><Label>Parceiro</Label><Input value={parceiro} onChange={e => setParceiro(e.target.value)} placeholder="Digite para buscar" /></div>
            <div><Label>Comissão parceiro (%)</Label><Input type="number" value={comissaoParceiro} onChange={e => setComissaoParceiro(e.target.value)} placeholder="Não utilizar" /></div>
          </div>
          <div>
            <Label>Introdução</Label>
            <Textarea value={introducao} onChange={e => setIntroducao(e.target.value)} rows={4} placeholder="Escreva uma introdução para o orçamento..." />
            <p className="text-xs text-amber-600 mt-1">Personalize a introdução do seu orçamento para enviar ao seu cliente. Use as tags de personalização conforme necessário.</p>
          </div>
        </CardContent>
      </Card>

      {/* Produtos */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Produtos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto*</TableHead>
                <TableHead className="w-28">Detalhes</TableHead>
                <TableHead className="w-20">Qtde*</TableHead>
                <TableHead className="w-24">Valor*</TableHead>
                <TableHead className="w-24">Desconto</TableHead>
                <TableHead className="w-24">Subtotal</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((p, idx) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Popover open={openProduto === idx} onOpenChange={(o) => setOpenProduto(o ? idx : null)}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal h-9 text-sm">
                          <span className="truncate">{p.produto_nome || "Digite para buscar"}</span>
                          <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar produto..." />
                          <CommandList>
                            <CommandEmpty>Nenhum produto.</CommandEmpty>
                            <CommandGroup>
                              {produtosCatalogo.map(pc => {
                                const estoque = pc.estoque_quantidade || 0;
                                const precoVenda = getPrecoVenda(pc);
                                return (
                                  <CommandItem key={pc.id} value={pc.nome} onSelect={() => {
                                    updateProduto(idx, { produto_id: pc.id, produto_nome: pc.nome, valor: precoVenda });
                                    setOpenProduto(null);
                                  }}>
                                    <div className="flex items-center justify-between w-full gap-2">
                                      <span className="truncate">{pc.nome}</span>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${estoque > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{estoque}</span>
                                        <span className="text-xs font-medium text-muted-foreground">R$ {precoVenda.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell><Input className="h-9" value={p.detalhes} onChange={e => updateProduto(idx, { detalhes: e.target.value })} /></TableCell>
                  <TableCell><Input type="number" className="h-9" value={p.quantidade} onChange={e => updateProduto(idx, { quantidade: parseFloat(e.target.value) || 0 })} /></TableCell>
                  <TableCell><Input type="number" className="h-9" value={p.valor} onChange={e => updateProduto(idx, { valor: parseFloat(e.target.value) || 0 })} /></TableCell>
                  <TableCell><Input type="number" className="h-9" value={p.desconto} onChange={e => updateProduto(idx, { desconto: parseFloat(e.target.value) || 0 })} /></TableCell>
                  <TableCell className="font-medium text-right">{fmt(p.subtotal)}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeProduto(idx)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="default" size="sm" className="mt-3 gap-1 bg-blue-800 hover:bg-blue-900" onClick={addProduto}><Plus className="h-4 w-4" /> Adicionar produto</Button>
        </CardContent>
      </Card>

      {/* Serviços */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4" /> Serviços</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço*</TableHead>
                <TableHead className="w-28">Detalhes</TableHead>
                <TableHead className="w-20">Qtde*</TableHead>
                <TableHead className="w-24">Valor*</TableHead>
                <TableHead className="w-24">Desconto</TableHead>
                <TableHead className="w-24">Subtotal</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicos.map((s, idx) => (
                <TableRow key={s.id}>
                  <TableCell><Input className="h-9" value={s.servico_nome} onChange={e => updateServico(idx, "servico_nome", e.target.value)} /></TableCell>
                  <TableCell><Input className="h-9" value={s.detalhes} onChange={e => updateServico(idx, "detalhes", e.target.value)} /></TableCell>
                  <TableCell><Input type="number" className="h-9" value={s.quantidade} onChange={e => updateServico(idx, "quantidade", parseFloat(e.target.value) || 0)} /></TableCell>
                  <TableCell><Input type="number" className="h-9" value={s.valor} onChange={e => updateServico(idx, "valor", parseFloat(e.target.value) || 0)} /></TableCell>
                  <TableCell><Input type="number" className="h-9" value={s.desconto} onChange={e => updateServico(idx, "desconto", parseFloat(e.target.value) || 0)} /></TableCell>
                  <TableCell className="font-medium text-right">{fmt(s.subtotal)}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeServico(idx)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="default" size="sm" className="mt-3 gap-1 bg-blue-800 hover:bg-blue-900" onClick={addServico}><Plus className="h-4 w-4" /> Adicionar serviço</Button>
        </CardContent>
      </Card>

      {/* Transporte */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" /> Transporte</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Valor do Frete</Label><Input type="number" value={valorFrete} onChange={e => setValorFrete(e.target.value)} placeholder="0,00" /></div>
            <div><Label>Transportadora</Label><Input value={transportadora} onChange={e => setTransportadora(e.target.value)} placeholder="Digite para buscar" /></div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço de entrega */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Endereço de entrega</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Checkbox checked={usarEnderecoEntrega} onCheckedChange={(v) => setUsarEnderecoEntrega(!!v)} id="usar_end" />
            <Label htmlFor="usar_end" className="text-sm text-blue-600 cursor-pointer">Informar endereço de entrega</Label>
          </div>
          {usarEnderecoEntrega && (
            <Textarea value={enderecoEntrega} onChange={e => setEnderecoEntrega(e.target.value)} placeholder="Endereço completo..." rows={2} />
          )}
        </CardContent>
      </Card>

      {/* Totais */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2">💰 Totais</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Checkbox defaultChecked id="exibir_moeda" />
            <Label htmlFor="exibir_moeda" className="text-sm">Exibir valores na moeda</Label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div><Label>Produtos</Label><Input value={fmt(totalProdutos)} disabled className="bg-muted text-right" /></div>
            <div><Label>Serviços</Label><Input value={fmt(totalServicos)} disabled className="bg-muted text-right" /></div>
            <div><Label>Desconto (%)</Label><Input type="number" value={descontoPerc} onChange={e => { setDescontoPerc(e.target.value); setDescontoValor(""); }} placeholder="0,00" /></div>
            <div><Label>Desconto (R$)</Label><Input type="number" value={descontoValor} onChange={e => { setDescontoValor(e.target.value); setDescontoPerc(""); }} placeholder="0,00" /></div>
            <div><Label>Valor total*</Label><Input value={fmt(valorTotal)} disabled className="bg-muted text-right font-bold" /></div>
          </div>
        </CardContent>
      </Card>

      {/* Pagamento */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Pagamento</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-3">
            <label className="flex items-center gap-1.5 text-sm"><input type="radio" name="tipo_pag" defaultChecked className="accent-primary" /> Avista</label>
            <label className="flex items-center gap-1.5 text-sm"><input type="radio" name="tipo_pag" className="accent-primary" /> Parcelado</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Forma de pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Parcelas</Label><Input type="number" value={parcelas} onChange={e => setParcelas(e.target.value)} min="1" /></div>
          </div>
        </CardContent>
      </Card>

      {/* Anexos */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Paperclip className="h-4 w-4" /> Anexos</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-amber-600 mb-3">Utilize esse campo para incluir imagens e informações no seu orçamento. Tamanho máximo 25Mb.</p>
          <Button variant="default" size="sm" className="gap-1 bg-blue-800 hover:bg-blue-900"><Plus className="h-4 w-4" /> Selecionar arquivos</Button>
        </CardContent>
      </Card>

      {/* Observações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Observações padrão</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">Essa informação é impressa no orçamento.</p>
            <Textarea value={observacoesPadrao} onChange={e => setObservacoesPadrao(e.target.value)} rows={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Observações internas</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">Essa informação NÃO é impressa, somente para controle interno da equipe.</p>
            <Textarea value={observacoesInternas} onChange={e => setObservacoesInternas(e.target.value)} rows={4} />
          </CardContent>
        </Card>
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700 gap-1" onClick={salvar} disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
          </Button>
          <Button variant="destructive" className="gap-1" onClick={() => navigate("/orcamentos/produtos")}>
            <X className="h-4 w-4" /> Cancelar
          </Button>
        </div>
        <Button variant="outline" className="gap-1" onClick={() => window.print()}>🖨️ Salvar</Button>
      </div>
    </div>
  );
}
