import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Minus, Trash2, CreditCard, QrCode, Banknote, Receipt, User, Clock, ArrowLeft, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRLInput } from "@/components/BRLInput";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { printCupom } from "@/lib/printVenda";

type ProdutoPDV = { id: string; sku: string; nome: string; preco: number; precosVenda: any[]; img: string; imagem_url?: string; estoque: number; localizacao?: string; aplicacoes?: string[]; marca?: string; descricao?: string; precoCusto: number };
type CartItem = { id: string; nome: string; sku: string; preco: number; qty: number };
type PagamentoItem = { forma: string; conta: string; valor: number; parcelas?: number; detalhes?: string };

function getPrecoByTabela(produto: any, tabelaNome?: string): number {
  if (produto.precos_venda && Array.isArray(produto.precos_venda) && produto.precos_venda.length > 0) {
    if (tabelaNome) {
      const match = produto.precos_venda.find((pv: any) => {
        const nome = pv?.nome || pv?.tipo || "";
        return nome.toUpperCase() === tabelaNome.toUpperCase();
      });
      const matchPreco = Number(match?.preco ?? match?.valor_venda_utilizado);
      if (matchPreco > 0) return matchPreco;
    }
    const primeiro = produto.precos_venda[0] as any;
    const primeiroPreco = Number(primeiro?.preco ?? primeiro?.valor_venda_utilizado);
    if (primeiroPreco > 0) return primeiroPreco;
  }
  return Number(produto.preco_custo) || 0;
}

function getEmojiCategoria(categoria?: string | null): string {
  if (!categoria) return "📦";
  const cat = categoria.toLowerCase();
  if (cat.includes("oleo") || cat.includes("óleo") || cat.includes("lubri")) return "🛢️";
  if (cat.includes("freio") || cat.includes("pastilha")) return "🔧";
  if (cat.includes("filtro")) return "⚙️";
  if (cat.includes("pneu")) return "🔴";
  return "📦";
}

const STORAGE_KEY = "vendas_atacado";

export default function PDVAtacado() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTabela, setClienteTabela] = useState("");
  const [vendedorNome, setVendedorNome] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const [showPagamentoDialog, setShowPagamentoDialog] = useState(false);
  const [pagamentos, setPagamentos] = useState<PagamentoItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [curForma, setCurForma] = useState("");
  const [curValor, setCurValor] = useState("");
  const [curParcelas, setCurParcelas] = useState("1");

  const { data: formasPagamento = [] } = useQuery({
    queryKey: ["formas_pagamento_pdv_atacado"],
    queryFn: async () => {
      const { data } = await supabase.from("formas_pagamento").select("*").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-atacado"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clientes")
        .select("id, nome_completo, nome_fantasia, telefone, cnpj, cpf, categoria_cliente")
        .eq("ativo", true)
        .order("nome_completo")
        .limit(500);
      return data || [];
    },
  });

  const { data: produtosBanco = [] } = useQuery({
    queryKey: ["produtos-pdv-atacado", debouncedSearch, clienteTabela],
    queryFn: async () => {
      let query = supabase
        .from("produtos_catalogo")
        .select("id, nome, codigo_cpl, preco_custo, precos_venda, categoria, estoque_quantidade, localizacao, aplicacoes, marca, descricao, imagem_url");
      if (debouncedSearch.trim()) {
        const words = debouncedSearch.trim().split(/\s+/).filter(Boolean);
        for (const word of words) {
          const term = `%${word}%`;
          query = query.or(`nome.ilike.${term},codigo_cpl.ilike.${term},marca.ilike.${term}`);
        }
      }
      const { data } = await query.order("nome").limit(100);
      return (data || []).map((p): ProdutoPDV => ({
        id: p.id, sku: p.codigo_cpl, nome: p.nome, preco: getPrecoByTabela(p, clienteTabela),
        precosVenda: (p.precos_venda as any[]) || [], precoCusto: Number(p.preco_custo) || 0,
        img: getEmojiCategoria(p.categoria), imagem_url: p.imagem_url || undefined,
        estoque: Number(p.estoque_quantidade) || 0, localizacao: p.localizacao || undefined,
        aplicacoes: p.aplicacoes || undefined, marca: p.marca || undefined, descricao: p.descricao || undefined,
      }));
    },
  });

  useEffect(() => { setVendedorNome("Vendedor Padrão"); }, []);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const addToCart = (product: ProdutoPDV) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { id: product.id, nome: product.nome, sku: product.sku, preco: product.preco, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)).filter((i) => i.qty > 0));
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));

  const total = cart.reduce((sum, i) => sum + i.preco * i.qty, 0);
  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalPago = pagamentos.reduce((sum, p) => sum + p.valor, 0);
  const pendente = total - totalPago;

  const formaOptions = formasPagamento
    .filter(f => f.disponivel_pdv !== false)
    .map(f => ({ value: f.nome, label: f.nome }));

  const formaAtual = formasPagamento.find(f => f.nome === curForma);
  const maxParcelasForma = formaAtual?.max_parcelas || 1;
  const permiteParcelamento = maxParcelasForma > 1;

  const clienteSelecionado = !!(clienteId && clienteNome);

  const openPagamentoDialog = () => {
    if (!clienteSelecionado) {
      toast.error("Selecione um cliente parceiro cadastrado para venda atacado!");
      return;
    }
    setPagamentos([]);
    setCurForma("");
    setCurValor(total.toFixed(2));
    setCurParcelas("1");
    setShowPagamentoDialog(true);
  };

  const adicionarPagamento = () => {
    if (!curForma) { toast.error("Selecione a forma de pagamento"); return; }
    const valor = Number(curValor.replace(",", "."));
    if (!valor || valor <= 0) { toast.error("Informe um valor válido"); return; }

    const formaMatch = formasPagamento.find(f => f.nome === curForma);
    const contaResolvida = formaMatch?.conta_bancaria || "";

    const novoPag: PagamentoItem = {
      forma: curForma,
      conta: contaResolvida,
      valor,
      parcelas: permiteParcelamento ? Number(curParcelas) : undefined,
    };
    setPagamentos(prev => [...prev, novoPag]);
    setCurForma("");
    setCurParcelas("1");
    const novoPendente = total - totalPago - valor;
    setCurValor(novoPendente > 0 ? novoPendente.toFixed(2) : "0.00");
  };

  const removerPagamento = (index: number) => {
    setPagamentos(prev => {
      const updated = prev.filter((_, i) => i !== index);
      const novoTotalPago = updated.reduce((s, p) => s + p.valor, 0);
      const novoPendente = total - novoTotalPago;
      setCurValor(novoPendente > 0 ? novoPendente.toFixed(2) : "0.00");
      return updated;
    });
  };

  const getProximoNumeroVendaAtacado = () => {
    try {
      const vendasSalvas = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const numerosValidos = vendasSalvas
        .map((v: any) => Number(v.numero) || 0)
        .filter((num: number) => num < 10000);
      if (numerosValidos.length === 0) {
        return 1;
      }
      return Math.max(...numerosValidos, 0) + 1;
    } catch {
      return 1;
    }
  };

  const finalizarVenda = async (formasResumo: string, pagamentosList: PagamentoItem[]) => {
    setSaving(true);
    const now = new Date();
    const vendaNumero = getProximoNumeroVendaAtacado();

    const novaVenda = {
      id: crypto.randomUUID(),
      numero: vendaNumero,
      cliente: clienteNome,
      clienteId,
      data: now.toLocaleDateString("pt-BR"),
      situacao: "Em andamento",
      valor: total,
      vendedor: vendedorNome || "Vendedor Padrão",
      forma_pagamento: formasResumo,
      pagamentos: pagamentosList,
      itens: cart.map(i => ({ codigo: i.sku, nome: i.nome, quantidade: i.qty, valor_unitario: i.preco, desconto: 0, subtotal: i.preco * i.qty })),
      historico: [{ data: now.toLocaleString("pt-BR"), observacao: `Venda atacado - ${formasResumo}`, situacao: "Em andamento", funcionario: vendedorNome || "Vendedor Padrão" }],
    };
    const vendasSalvas = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    vendasSalvas.unshift(novaVenda);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vendasSalvas));

    toast.success(`Venda Atacado #${vendaNumero} registrada para ${clienteNome}!`);

    printCupom({
      numero: vendaNumero,
      data: now.toLocaleDateString("pt-BR"),
      hora: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      cliente: clienteNome,
      itens: novaVenda.itens,
      total,
      forma_pagamento: formasResumo,
      vendedor: vendedorNome || "Vendedor Padrão",
    });

    setCart([]);
    setPagamentos([]);
    setSaving(false);
    setShowPagamentoDialog(false);
  };

  const finalizarVendaMulti = async () => {
    if (pagamentos.length === 0) { toast.error("Adicione pelo menos uma forma de pagamento"); return; }
    if (pendente > 0.01) { toast.error(`Ainda falta R$ ${pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`); return; }
    const formasResumo = pagamentos.map(p => `${p.forma} R$${p.valor.toFixed(2)}`).join(" / ");
    await finalizarVenda(formasResumo, pagamentos);
  };

  const finalizarVendaRapida = async (formaPagamento: string) => {
    if (!clienteSelecionado) {
      toast.error("Selecione um cliente parceiro cadastrado!");
      return;
    }
    await finalizarVenda(formaPagamento, [{ forma: formaPagamento, conta: "", valor: total }]);
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4">
      {/* Products grid */}
      <div className="flex-1 space-y-4 overflow-auto">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate("/venda-atacado")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Venda Atacado</h1>
            <p className="text-sm text-muted-foreground">Somente para clientes parceiros cadastrados</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/pdv/precos")} className="gap-1.5">
            <Search className="h-4 w-4" /> Pesquisa de Preços
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto por nome ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {produtosBanco.map((product) => (
            <Card key={product.id} onClick={() => addToCart(product)}
              className="glass-panel cursor-pointer hover:border-primary/40 hover:glow-primary transition-all duration-200 active:scale-[0.98]">
              <CardContent className="p-4 text-center space-y-1.5">
                <div className="w-14 h-14 mx-auto rounded-md overflow-hidden bg-secondary/40 flex items-center justify-center">
                  {product.imagem_url ? (
                    <img src={product.imagem_url} alt={product.nome} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-2xl">{product.img}</span>
                  )}
                </div>
                <p className="text-sm font-medium leading-tight">{product.nome}</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">{product.sku}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${product.estoque > 0 ? 'bg-green-500/15 text-green-600' : 'bg-red-500/15 text-red-500'}`}>
                    Est: {product.estoque}
                  </span>
                </div>
                <p className="text-lg font-bold text-primary">
                  R$ {product.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart */}
      <Card className="w-[360px] shrink-0 flex flex-col glass-panel">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Carrinho Atacado</span>
            <span className="text-xs font-normal text-muted-foreground">{totalItems} itens</span>
          </CardTitle>
          {clienteTabela && (
            <p className="text-[11px] font-semibold text-primary mt-1">📊 Tabela: {clienteTabela}</p>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden p-4 pt-0 gap-3">
          {/* Cliente OBRIGATÓRIO */}
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-xs font-bold flex items-center gap-1 text-destructive">
                <User className="h-3 w-3" /> Cliente Parceiro (obrigatório) *
              </label>
              <Select value={clienteId} onValueChange={(val) => {
                setClienteId(val);
                const c = clientes.find(cl => cl.id === val);
                setClienteNome(c?.nome_completo || c?.nome_fantasia || "");
                const tabela = c?.categoria_cliente || "";
                setClienteTabela(tabela);
                // Recalculate cart prices based on client's price table
                if (cart.length > 0) {
                  setCart(prev => prev.map(item => {
                    const prod = produtosBanco.find(p => p.id === item.id);
                    if (prod) {
                      const novoPreco = getPrecoByTabela({ precos_venda: prod.precosVenda, preco_custo: prod.precoCusto }, tabela);
                      return { ...item, preco: novoPreco };
                    }
                    return item;
                  }));
                }
                if (tabela) toast.info(`Tabela de preço: ${tabela}`);
              }}>
                <SelectTrigger className={`h-9 text-xs ${!clienteSelecionado ? 'border-destructive' : 'border-green-500'}`}>
                  <SelectValue placeholder="Selecione um cliente cadastrado..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome_completo || c.nome_fantasia} {c.cnpj ? `(${c.cnpj})` : c.cpf ? `(${c.cpf})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!clienteSelecionado && (
                <p className="text-[10px] text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Venda atacado exige cliente parceiro cadastrado
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Vendedor</label>
              <Input value={vendedorNome} onChange={(e) => setVendedorNome(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
          <Separator />
          <div className="flex-1 space-y-2 overflow-auto">
            {cart.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Adicione produtos ao carrinho</p>
              </div>
            )}
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.nome}</p>
                  <p className="text-xs text-muted-foreground">R$ {item.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQty(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                  <span className="w-6 text-center text-sm font-mono font-bold">{item.qty}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQty(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">Total</span>
              <span className="text-xl font-bold text-primary">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full gap-1.5 text-xs" disabled={cart.length === 0 || !clienteSelecionado} onClick={() => finalizarVendaRapida("DINHEIRO")}>
                <Banknote className="h-3.5 w-3.5" /> Dinheiro
              </Button>
              <Button variant="outline" className="w-full gap-1.5 text-xs" disabled={cart.length === 0 || !clienteSelecionado} onClick={() => finalizarVendaRapida("BOLETO")}>
                <Receipt className="h-3.5 w-3.5" /> Boleto
              </Button>
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" disabled={cart.length === 0 || !clienteSelecionado} onClick={openPagamentoDialog}>
              Finalizar Venda Atacado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Multi-payment Dialog */}
      <Dialog open={showPagamentoDialog} onOpenChange={(o) => !o && setShowPagamentoDialog(false)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-auto" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Pagamento - Venda Atacado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Cliente: <span className="font-semibold text-foreground">{clienteNome}</span></p>

          {pagamentos.length > 0 && (
            <div className="space-y-2">
              {pagamentos.map((pag, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{pag.forma}</p>
                    <p className="text-xs text-muted-foreground">{pag.parcelas && pag.parcelas > 1 ? `${pag.parcelas}x` : "à vista"}</p>
                  </div>
                  <span className="font-mono font-bold text-sm">R$ {pag.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removerPagamento(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Separator />
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
            <Label className="text-xs font-bold">Adicionar Pagamento</Label>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Valor</Label>
              <BRLInput className="h-8 text-xs font-mono" placeholder="0,00" prefix="R$" value={curValor} onChange={(v) => setCurValor(v)} />
            </div>

            {(() => {
              const valorDigitado = parseFloat(curValor.replace(",", ".")) || 0;
              const isDinheiro = curForma.toLowerCase().includes("dinheiro");
              const troco = isDinheiro && valorDigitado > pendente && pendente > 0 ? valorDigitado - pendente : 0;
              return troco > 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                  <span className="text-base">💰</span>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Troco:</span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">R$ {troco.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ) : null;
            })()}

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Forma</Label>
              <Select value={curForma} onValueChange={setCurForma}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {formaOptions.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {permiteParcelamento && (
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Parcelas</Label>
                <Select value={curParcelas} onValueChange={setCurParcelas}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxParcelasForma }, (_, i) => i + 1).map(n => (
                      <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={adicionarPagamento}>
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          </div>

          <div className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 ${
            pendente > 0.01
              ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20"
              : "border-green-500 bg-green-50 dark:bg-green-950/20"
          }`}>
            <div className="flex items-center gap-2">
              {pendente > 0.01 ? (
                <>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-xs font-bold text-orange-700 dark:text-orange-400">Faltam:</p>
                    <p className="text-[11px] text-orange-600 dark:text-orange-400">
                      R$ {pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-xs font-bold text-green-700 dark:text-green-400">Total OK</p>
                </>
              )}
            </div>
            <span className={`font-mono font-bold text-lg ${pendente > 0.01 ? "text-orange-600" : "text-green-600"}`}>
              R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            disabled={pagamentos.length === 0 || saving || pendente > 0.01}
            onClick={finalizarVendaMulti}
          >
            {saving ? "Finalizando..." : "» CONFIRMAR VENDA ATACADO"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
