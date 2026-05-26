import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Minus, Trash2, CreditCard, QrCode, Banknote, Receipt, User, Clock, ArrowLeft, MoreHorizontal, AlertCircle, CheckCircle2 } from "lucide-react";
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

type ProdutoPDV = { id: string; sku: string; nome: string; preco: number; img: string; imagem_url?: string; estoque: number; localizacao?: string; aplicacoes?: string[]; marca?: string; descricao?: string };
type CartItem = { id: string; nome: string; sku: string; preco: number; qty: number };
type PagamentoItem = { forma: string; conta: string; valor: number; parcelas?: number; detalhes?: string };

function getPrecoVenda(produto: any): number {
  if (produto.precos_venda && Array.isArray(produto.precos_venda) && produto.precos_venda.length > 0) {
    // Try VAREJO first
    const varejo = produto.precos_venda.find((pv: any) => {
      const nome = (pv?.nome || pv?.tipo || "").toUpperCase();
      return nome === "VAREJO";
    });
    if (varejo) {
      const preco = Number(varejo?.preco ?? varejo?.valor_venda_utilizado);
      if (preco > 0) return preco;
    }
    // Fallback to first valid entry
    for (const pv of produto.precos_venda) {
      const preco = Number(pv?.preco ?? pv?.valor_venda_utilizado);
      if (preco > 0) return preco;
    }
  }
  return Number(produto.preco_custo) || 0;
}

function getEmojiCategoria(categoria?: string | null): string {
  if (!categoria) return "📦";
  const cat = categoria.toLowerCase();
  if (cat.includes("oleo") || cat.includes("óleo") || cat.includes("lubri")) return "🛢️";
  if (cat.includes("freio") || cat.includes("pastilha")) return "🔧";
  if (cat.includes("filtro")) return "⚙️";
  if (cat.includes("corrente") || cat.includes("relação")) return "⛓️";
  if (cat.includes("pneu")) return "🔴";
  if (cat.includes("vela") || cat.includes("ignição")) return "⚡";
  if (cat.includes("retentor") || cat.includes("rolamento")) return "🔩";
  if (cat.includes("cabo")) return "🔌";
  if (cat.includes("lamp") || cat.includes("farol")) return "💡";
  if (cat.includes("kit")) return "🧰";
  return "📦";
}

export default function PDV() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clienteNome, setClienteNome] = useState("");
  const [vendedorNome, setVendedorNome] = useState("");
  const [status, setStatus] = useState<"em_andamento" | "aguardando">("em_andamento");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Multi-payment state
  const [showPagamentoDialog, setShowPagamentoDialog] = useState(false);
  const [pagamentos, setPagamentos] = useState<PagamentoItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Current payment form state
  const [curForma, setCurForma] = useState("");
  const [curConta, setCurConta] = useState("");
  const [curValor, setCurValor] = useState("");
  const [curParcelas, setCurParcelas] = useState("1");

  // Global Discount States
  const [descontoReais, setDescontoReais] = useState<number>(0);
  const [descontoPct, setDescontoPct] = useState<number>(0);
  const [descontoReaisStr, setDescontoReaisStr] = useState("");
  const [descontoPctStr, setDescontoPctStr] = useState("");

  // Valor recebido específico para o carrinho (dinheiro/troco)
  const [valorRecebidoCarrinho, setValorRecebidoCarrinho] = useState("");

  const { data: contasBancarias = [] } = useQuery({
    queryKey: ["contas_bancarias_pdv"],
    queryFn: async () => {
      const { data } = await supabase.from("contas_bancarias").select("*").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  const { data: formasPagamento = [] } = useQuery({
    queryKey: ["formas_pagamento_pdv"],
    queryFn: async () => {
      const { data } = await supabase.from("formas_pagamento").select("*").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  const { data: clientes } = useQuery({
    queryKey: ["clientes-pdv"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clientes")
        .select("id, nome_completo, nome_fantasia, telefone")
        .eq("ativo", true)
        .order("nome_completo")
        .limit(200);
      return data || [];
    },
  });

  const { data: produtosBanco = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ["produtos-pdv", debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from("produtos_catalogo")
        .select("id, nome, codigo_cpl, preco_custo, precos_venda, categoria, estoque_quantidade, localizacao, aplicacoes, marca, descricao, imagem_url");
      if (debouncedSearch.trim()) {
        const words = debouncedSearch.trim().split(/\s+/).filter(Boolean);
        for (const word of words) {
          const term = `%${word}%`;
          query = query.or(`nome.ilike.${term},codigo_cpl.ilike.${term},marca.ilike.${term},descricao.ilike.${term},aplicacoes.cs.{"${word}"}`);
        }
      }
      const { data } = await query.order("nome").limit(100);
      return (data || []).map((p): ProdutoPDV => ({
        id: p.id, sku: p.codigo_cpl, nome: p.nome, preco: getPrecoVenda(p),
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

  const subtotal = cart.reduce((sum, i) => sum + (i.preco || 0) * (i.qty || 0), 0);
  const totalItems = cart.reduce((sum, i) => sum + (i.qty || 0), 0);
  const totalPago = pagamentos.reduce((sum, p) => sum + (p.valor || 0), 0);
  const total = Math.max(0, subtotal - (descontoReais || 0));
  const pendente = Math.max(0, total - totalPago);

  // Capture keyboard shortcuts inside finalization modal
  useEffect(() => {
    if (!showPagamentoDialog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        const trigger = document.getElementById("forma-pagamento-trigger");
        if (trigger) {
          (trigger as HTMLElement).click();
          setTimeout(() => {
            const dropdown = document.querySelector('[role="listbox"]');
            if (dropdown) (dropdown as HTMLElement).focus();
          }, 100);
        }
      }
      if (e.key === "F3") {
        e.preventDefault();
        adicionarPagamento();
      }
      if (e.key === "F4") {
        e.preventDefault();
        document.getElementById("desconto-reais-input")?.focus();
      }
      if (e.key === "F6") {
        e.preventDefault();
        if ((pagamentos || []).length > 0 && pendente <= 0.01 && !saving) {
          finalizarVendaMulti();
        } else {
          toast.error("Adicione os pagamentos antes de finalizar");
        }
      }
      if (e.key === "F8") {
        e.preventDefault();
        setShowPagamentoDialog(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPagamentoDialog, curForma, curValor, pagamentos, totalPago, descontoReais, saving, pendente]);

  // Capture keyboard shortcuts inside PDV page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Se o modal de pagamento não estiver aberto, captura atalhos para fechar direto pelo carrinho
      if (!showPagamentoDialog) {
        if (e.key === "F2") {
          e.preventDefault();
          document.getElementById("carrinho-valor-recebido")?.focus();
        }
        if (e.key === "F4") {
          e.preventDefault();
          document.getElementById("carrinho-desconto-reais")?.focus();
        }
        if (e.key === "F6") {
          e.preventDefault();
          if (cart.length > 0 && !saving) {
            // Clicar no primeiro botão de forma de pagamento rápida (geralmente Dinheiro)
            const firstQuickBtn = document.querySelector(".quick-pay-btn") as HTMLElement;
            if (firstQuickBtn) {
              firstQuickBtn.click();
            } else {
              toast.error("Nenhuma forma de pagamento rápida disponível");
            }
          } else if (cart.length === 0) {
            toast.error("Adicione produtos ao carrinho");
          }
        }
        if (e.key === "F8") {
          e.preventDefault();
          if (cart.length > 0) {
            setCurValor(total.toFixed(2));
            setPagamentos([]);
            setShowPagamentoDialog(true);
          } else {
            toast.error("Adicione produtos ao carrinho");
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPagamentoDialog, cart, total, descontoReais, subtotal, saving]);

  const handleDescontoReaisChange = (valStr: string) => {
    // Converte pontos em vírgulas na hora e permite apenas números e vírgula
    const withComma = valStr.replace(/\./g, ",");
    const sanitized = withComma.replace(/[^0-9,]/g, "");
    
    // Evita mais de uma vírgula
    const parts = sanitized.split(",");
    const cleaned = parts[0] + (parts.length > 1 ? "," + parts.slice(1).join("").replace(/,/g, "") : "");
    
    setDescontoReaisStr(cleaned);

    const normalized = cleaned.replace(",", ".");
    const val = parseFloat(normalized) || 0;
    
    setDescontoReais(val);
    if (subtotal > 0) {
      const pct = (val / subtotal) * 100;
      setDescontoPct(parseFloat(pct.toFixed(2)));
      setDescontoPctStr(pct > 0 ? pct.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "");
    } else {
      setDescontoPct(0);
      setDescontoPctStr("");
    }
    const novoTotal = Math.max(0, subtotal - val);
    const novoPendente = Math.max(0, novoTotal - totalPago);
    setCurValor(novoPendente.toFixed(2));
  };

  const handleDescontoPctChange = (valStr: string) => {
    // Converte pontos em vírgulas na hora e permite apenas números e vírgula
    const withComma = valStr.replace(/\./g, ",");
    const sanitized = withComma.replace(/[^0-9,]/g, "");
    
    // Evita mais de uma vírgula
    const parts = sanitized.split(",");
    const cleaned = parts[0] + (parts.length > 1 ? "," + parts.slice(1).join("").replace(/,/g, "") : "");
    
    setDescontoPctStr(cleaned);

    const normalized = cleaned.replace(",", ".");
    const pct = parseFloat(normalized) || 0;

    setDescontoPct(pct);
    if (subtotal > 0) {
      const val = (pct / 100) * subtotal;
      setDescontoReais(parseFloat(val.toFixed(2)));
      setDescontoReaisStr(val > 0 ? val.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "");
      
      const novoTotal = Math.max(0, subtotal - val);
      const novoPendente = Math.max(0, novoTotal - totalPago);
      setCurValor(novoPendente.toFixed(2));
    } else {
      setDescontoReais(0);
      setDescontoReaisStr("");
      setCurValor("0.00");
    }
  };

  const formaOptions = (formasPagamento || [])
    .filter(f => f?.disponivel_pdv !== false)
    .map(f => ({ value: f?.nome, label: f?.nome, conta: f?.conta_bancaria || "" }));

  const formaAtual = (formasPagamento || []).find(f => f?.nome === curForma);
  const maxParcelasForma = formaAtual?.max_parcelas || 1;
  const permiteParcelamento = maxParcelasForma > 1;

  const openPagamentoDialog = () => {
    setPagamentos([]);
    setCurForma("");
    setCurConta("");
    setDescontoReais(0);
    setDescontoPct(0);
    setDescontoReaisStr("");
    setDescontoPctStr("");
    setCurValor(subtotal.toFixed(2));
    setCurParcelas("1");
    setShowPagamentoDialog(true);
  };

  const adicionarPagamento = () => {
    if (!curForma) { toast.error("Selecione a forma de pagamento"); return; }
    const valor = Number(curValor.replace(",", "."));
    if (!valor || valor <= 0) { toast.error("Informe um valor válido"); return; }

    // Auto-resolve conta from formas_pagamento
    const formaMatch = formasPagamento.find(f => f.nome === curForma);
    const contaResolvida = formaMatch?.conta_bancaria || "";

    const novoPag: PagamentoItem = {
      forma: curForma,
      conta: contaResolvida,
      valor,
      parcelas: permiteParcelamento ? Number(curParcelas) : undefined,
      detalhes: permiteParcelamento && Number(curParcelas) > 1 ? `${contaResolvida} - ${curParcelas}x` : contaResolvida || undefined,
    };
    setPagamentos(prev => [...prev, novoPag]);
    
    // Reset form and set remaining value
    setCurForma("");
    setCurConta("");
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

  const finalizarVendaMulti = async () => {
    if (pagamentos.length === 0) { toast.error("Adicione pelo menos uma forma de pagamento"); return; }
    if (pendente > 0.01) { toast.error(`Ainda falta R$ ${pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} a ser informado`); return; }

    setSaving(true);

    const now = new Date();
    const vendaNumero = Math.floor(Math.random() * 90000) + 10000;
    const formasResumo = pagamentos.map(p => `${p.forma} R$${p.valor.toFixed(2)}`).join(" / ");

    // Save sale as "Em andamento" to localStorage (no caixa registration yet)
    const novaVenda = {
      id: crypto.randomUUID(),
      numero: vendaNumero,
      cliente: clienteNome || "Consumidor",
      data: now.toLocaleDateString("pt-BR"),
      situacao: "Em andamento",
      valor: total,
      vendedor: vendedorNome || "Vendedor Padrão",
      forma_pagamento: formasResumo,
      pagamentos: pagamentos,
      itens: cart.map(i => ({ codigo: i.sku, nome: i.nome, quantidade: i.qty, valor_unitario: i.preco, desconto: 0, subtotal: i.preco * i.qty })),
      historico: [{ data: now.toLocaleString("pt-BR"), observacao: `Venda cadastrada - ${formasResumo}`, situacao: "Em andamento", funcionario: vendedorNome || "Vendedor Padrão" }],
    };
    const vendasSalvas = JSON.parse(localStorage.getItem("vendas_balcao") || "[]");
    vendasSalvas.unshift(novaVenda);
    localStorage.setItem("vendas_balcao", JSON.stringify(vendasSalvas));

    toast.success(`Venda #${vendaNumero} registrada! ${formasResumo}`);

    // Auto-print cupom
    printCupom({
      numero: vendaNumero,
      data: now.toLocaleDateString("pt-BR"),
      hora: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      cliente: clienteNome || "Consumidor",
      itens: novaVenda.itens,
      total,
      forma_pagamento: formasResumo,
      pagamentos: pagamentos.map(p => ({ forma: p.forma, valor: p.valor, parcelas: p.parcelas })),
      vendedor: vendedorNome || "Vendedor Padrão",
    });

    setCart([]);
    setPagamentos([]);
    setDescontoReais(0);
    setDescontoPct(0);
    setDescontoReaisStr("");
    setDescontoPctStr("");
    setSaving(false);
    setShowPagamentoDialog(false);
  };

  const finalizarVendaRapida = async (formaPagamento: string) => {
    setSaving(true);

    const now = new Date();
    const vendaNumero = Math.floor(Math.random() * 90000) + 10000;

    // Save sale as "Em andamento" to localStorage (no caixa registration yet)
    const novaVenda = {
      id: crypto.randomUUID(),
      numero: vendaNumero,
      cliente: clienteNome || "Consumidor",
      data: now.toLocaleDateString("pt-BR"),
      situacao: "Em andamento",
      valor: total,
      vendedor: vendedorNome || "Vendedor Padrão",
      forma_pagamento: formaPagamento,
      pagamentos: [{ forma: formaPagamento, conta: "", valor: total }],
      itens: cart.map(i => ({ codigo: i.sku, nome: i.nome, quantidade: i.qty, valor_unitario: i.preco, desconto: 0, subtotal: i.preco * i.qty })),
      historico: [{ data: now.toLocaleString("pt-BR"), observacao: `Venda cadastrada - ${formaPagamento}`, situacao: "Em andamento", funcionario: vendedorNome || "Vendedor Padrão" }],
    };
    const vendasSalvas = JSON.parse(localStorage.getItem("vendas_balcao") || "[]");
    vendasSalvas.unshift(novaVenda);
    localStorage.setItem("vendas_balcao", JSON.stringify(vendasSalvas));

    toast.success(`Venda #${vendaNumero} registrada via ${formaPagamento}!`);

    // Auto-print cupom
    printCupom({
      numero: vendaNumero,
      data: now.toLocaleDateString("pt-BR"),
      hora: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      cliente: clienteNome || "Consumidor",
      itens: novaVenda.itens,
      total,
      forma_pagamento: formaPagamento,
      vendedor: vendedorNome || "Vendedor Padrão",
    });

    setCart([]);
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] gap-2 select-none relative">
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Lado Esquerdo */}
        <div className="flex-1 space-y-4 overflow-auto pr-1">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/vendas-balcao")} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Cancelar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Vendas Balcão</h1>
              <p className="text-sm text-muted-foreground"></p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou SKU... (ou use o leitor de código de barras)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/50"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(produtosBanco || []).map((product) => (
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
                  {product.localizacao && (
                    <p className="text-[10px] text-emerald-600 font-mono font-semibold">📍 {product.localizacao}</p>
                  )}
                  {product.aplicacoes && product.aplicacoes.length > 0 && (
                    <p className="text-[10px] text-muted-foreground truncate" title={product.aplicacoes.join(", ")}>
                      🏍️ {product.aplicacoes.slice(0, 2).join(", ")}{product.aplicacoes.length > 2 ? "…" : ""}
                    </p>
                  )}
                  <p className="text-lg font-bold text-primary">
                    R$ {product.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      {/* Cart */}
      {!showPagamentoDialog ? (
        <Card className="w-[420px] shrink-0 flex flex-col glass-panel">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Carrinho</span>
            <span className="text-xs font-normal text-muted-foreground">{totalItems} itens</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-y-auto p-4 pt-0 gap-3 scrollbar-thin">
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <User className="h-3 w-3" /> Cliente
              </label>
              <Input placeholder="Nome do cliente..." value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} className="h-8 text-xs" list="clientes-list" />
              <datalist id="clientes-list">
                {(clientes || [])?.map((c) => (<option key={c?.id} value={c?.nome_completo || c?.nome_fantasia || ""} />))}
              </datalist>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Vendedor</label>
                <Input value={vendedorNome} onChange={(e) => setVendedorNome(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Status
                </label>
                <Select value={status} onValueChange={(v: "em_andamento" | "aguardando") => setStatus(v)}>
                  <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_andamento">🟢 Em andamento</SelectItem>
                    <SelectItem value="aguardando">🟡 Aguardando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex-1 space-y-2 min-h-[150px]">
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

          <Separator className="my-2" />

          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-border/80 shadow-sm mt-0.5 shrink-0 select-none">
            {/* Totais Básicos */}
            <div className="space-y-1 text-xs text-slate-650 dark:text-slate-400">
              <div className="flex justify-between items-center">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Inputs de Desconto Integrados */}
              <div className="pt-1.5 pb-0.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 mb-1">
                  🎯 Conceder Desconto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center rounded-lg border border-border bg-white dark:bg-slate-950 overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                    <span className="bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-450 px-2 py-1 border-r border-border select-none shrink-0">R$</span>
                    <input
                      type="text"
                      className="w-full bg-transparent text-xs font-mono font-bold px-1.5 py-1 focus:outline-none"
                      placeholder="0,00"
                      value={descontoReaisStr}
                      onChange={(e) => handleDescontoReaisChange(e.target.value)}
                      id="carrinho-desconto-reais"
                      disabled={cart.length === 0}
                    />
                  </div>
                  <div className="flex items-center rounded-lg border border-border bg-white dark:bg-slate-950 overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                    <span className="bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-450 px-2.5 py-1 border-r border-border select-none shrink-0">%</span>
                    <input
                      type="text"
                      className="w-full bg-transparent text-xs font-mono font-bold px-1.5 py-1 focus:outline-none"
                      placeholder="0,00"
                      value={descontoPctStr}
                      onChange={(e) => handleDescontoPctChange(e.target.value)}
                      id="carrinho-desconto-pct"
                      disabled={cart.length === 0}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Valor Recebido e Troco para Dinheiro */}
            <div className="border-t border-border/60 pt-2 space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    💵 Valor Recebido (Dinheiro) <span className="text-[8px] text-slate-400 font-mono">(F2)</span>
                  </label>
                  <BRLInput
                    className="h-8 text-xs font-mono font-bold bg-white dark:bg-slate-950"
                    placeholder="0,00"
                    prefix="R$"
                    value={valorRecebidoCarrinho}
                    onChange={(v) => setValorRecebidoCarrinho(v)}
                    disabled={cart.length === 0}
                    id="carrinho-valor-recebido"
                  />
                </div>
              </div>

              {/* Linha de Troco se for Dinheiro */}
              {(() => {
                const valorDigitado = parseFloat(valorRecebidoCarrinho) || 0;
                const troco = valorDigitado > total ? valorDigitado - total : 0;
                return troco > 0 ? (
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 mt-0.5 font-mono select-none">
                    <span>TROCO:</span>
                    <span>R$ {troco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Total e Botões de Fechamento */}
            <div className="border-t border-border/60 pt-2 space-y-2">
              <div className="flex justify-between items-center select-none py-0.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Total a Pagar:</span>
                <span className="text-xl font-black text-orange-600 dark:text-orange-400 font-mono">
                  R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-2 pt-0.5">
                {/* Grade de Botões de Forma de Pagamento Rápida */}
                <div className="grid grid-cols-2 gap-2">
                  {(formasPagamento || [])
                    .filter(f => f?.disponivel_pdv !== false)
                    .map((forma) => {
                      const nome = forma.nome || "";
                      const nomeLower = nome.toLowerCase();
                      
                      // Definir ícone baseado no nome da forma de pagamento
                      let IconComponent = CreditCard;
                      if (nomeLower.includes("dinheiro") || nomeLower.includes("money") || nomeLower.includes("especie") || nomeLower.includes("espécie")) {
                        IconComponent = Banknote;
                      } else if (nomeLower.includes("pix")) {
                        IconComponent = QrCode;
                      } else if (nomeLower.includes("boleto")) {
                        IconComponent = Receipt;
                      }

                      return (
                        <Button
                          key={forma.id}
                          className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold h-10 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.98] border border-border/50 disabled:opacity-50 disabled:cursor-not-allowed quick-pay-btn"
                          disabled={cart.length === 0 || saving}
                          onClick={async () => {
                            const valorDigitado = parseFloat(valorRecebidoCarrinho) || 0;
                            if (valorDigitado > 0 && valorDigitado < total) {
                              const contaResolvida = forma?.conta_bancaria || "";
                              const novoPag: PagamentoItem = {
                                forma: nome,
                                conta: contaResolvida,
                                valor: valorDigitado,
                              };
                              setPagamentos([novoPag]);
                              
                              const restante = total - valorDigitado;
                              setCurValor(restante.toFixed(2));
                              setValorRecebidoCarrinho("");
                              setShowPagamentoDialog(true);
                              
                              toast.info(`Lançado R$ ${valorDigitado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em ${nome}. Escolha a forma de pagamento do restante R$ ${restante.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`);
                              return;
                            }

                            setSaving(true);
                            const now = new Date();
                            const vendaNumero = Math.floor(Math.random() * 90000) + 10000;
                            const formasResumo = `${nome} R$${total.toFixed(2)}`;
                            
                            const trocoCalculado = (nomeLower.includes("dinheiro") && valorDigitado > total) ? (valorDigitado - total) : 0;
                            const contaResolvida = forma?.conta_bancaria || "";

                            const unicoPag: PagamentoItem = {
                              forma: nome,
                              conta: contaResolvida,
                              valor: total,
                            };

                            const novaVenda = {
                              id: crypto.randomUUID(),
                              numero: vendaNumero,
                              cliente: clienteNome || "Consumidor",
                              data: now.toLocaleDateString("pt-BR"),
                              situacao: "Em andamento",
                              valor: total,
                              vendedor: vendedorNome || "Vendedor Padrão",
                              forma_pagamento: formasResumo,
                              pagamentos: [unicoPag],
                              itens: cart.map(i => ({ codigo: i.sku, nome: i.nome, quantidade: i.qty, valor_unitario: i.preco, desconto: 0, subtotal: i.preco * i.qty })),
                              historico: [{ data: now.toLocaleString("pt-BR"), observacao: `Venda cadastrada - ${formasResumo}`, situacao: "Em andamento", funcionario: vendedorNome || "Vendedor Padrão" }],
                            };

                            const vendasSalvas = JSON.parse(localStorage.getItem("vendas_balcao") || "[]");
                            vendasSalvas.unshift(novaVenda);
                            localStorage.setItem("vendas_balcao", JSON.stringify(vendasSalvas));

                            toast.success(`Venda #${vendaNumero} registrada com sucesso via ${nome}!`);

                            printCupom({
                              numero: vendaNumero,
                              data: now.toLocaleDateString("pt-BR"),
                              hora: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                              cliente: clienteNome || "Consumidor",
                              itens: novaVenda.itens,
                              total,
                              forma_pagamento: formasResumo,
                              pagamentos: [{ forma: nome, valor: total }],
                              vendedor: vendedorNome || "Vendedor Padrão",
                              troco: trocoCalculado > 0 ? trocoCalculado : undefined,
                              valorRecebido: valorDigitado > 0 ? valorDigitado : undefined,
                            });

                             setCart([]);
                             setPagamentos([]);
                             setCurForma("");
                             setCurConta("");
                             setCurValor("");
                             setValorRecebidoCarrinho("");
                             setDescontoReais(0);
                             setDescontoPct(0);
                             setDescontoReaisStr("");
                             setDescontoPctStr("");
                             setSaving(false);
                          }}
                        >
                          <IconComponent className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
                          <span className="truncate">{nome}</span>
                        </Button>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  className="w-full text-slate-650 hover:text-slate-800 dark:text-slate-350 dark:hover:text-slate-100 border-dashed border-slate-300 hover:border-slate-450 bg-transparent h-9 text-xs rounded-xl flex items-center justify-center gap-1.5 uppercase transition-all duration-200 active:scale-[0.98]"
                  disabled={cart.length === 0}
                  onClick={() => {
                    setCurValor(total.toFixed(2));
                    setPagamentos([]);
                    setShowPagamentoDialog(true);
                  }}
                >
                  ➕ Dividir em Várias Formas (F8)
                </Button>
              </div>
            </div>
            
            {/* Barra de atalhos compacta do Carrinho Normal */}
            <div className="bg-slate-100 dark:bg-slate-900 border border-border/60 text-[9px] text-slate-500 font-semibold p-2 rounded-xl select-none uppercase tracking-wide grid grid-cols-2 gap-1.5 mt-2 shrink-0">
              <div className="flex items-center gap-1"><span className="bg-slate-200 dark:bg-slate-800 border border-border/80 text-slate-700 dark:text-slate-350 rounded px-1.5 py-0.5 font-bold font-mono text-[9px]">F2</span> Valor Rec.</div>
              <div className="flex items-center gap-1"><span className="bg-slate-200 dark:bg-slate-800 border border-border/80 text-slate-700 dark:text-slate-350 rounded px-1.5 py-0.5 font-bold font-mono text-[9px]">F4</span> Desconto</div>
              <div className="flex items-center gap-1"><span className="bg-slate-200 dark:bg-slate-800 border border-border/80 text-slate-700 dark:text-slate-350 rounded px-1.5 py-0.5 font-bold font-mono text-[9px]">F6</span> Pagar Ráp.</div>
              <div className="flex items-center gap-1"><span className="bg-slate-200 dark:bg-slate-800 border border-border/80 text-slate-700 dark:text-slate-350 rounded px-1.5 py-0.5 font-bold font-mono text-[9px]">F8</span> Fechamento</div>
            </div>
          </div>
        </CardContent>
      </Card>
    ) : (
        /* CONTEÚDO 2: Fechamento Avançado - Barra Lateral do Carrinho */
        <Card className="w-[420px] shrink-0 flex flex-col glass-panel p-4 overflow-y-auto">
          <CardHeader className="pb-2 p-0 mb-3 select-none flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              🎯 Finalizar Venda
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 py-1 px-2.5 rounded-lg active:scale-95 transition-all"
              onClick={() => setShowPagamentoDialog(false)}
            >
              ← Voltar (F8)
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 gap-3.5">
            {/* Lançamento de Pagamento */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-border/80 space-y-3 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-350">💳 Forma de Pagamento (F2)</Label>
                  <Select value={curForma} onValueChange={setCurForma}>
                    <SelectTrigger id="forma-pagamento-trigger" className="h-8 text-xs bg-white dark:bg-slate-950 border-border/80"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {(formaOptions || []).map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {permiteParcelamento ? (
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-350">Parcelas</Label>
                    <Select value={curParcelas} onValueChange={setCurParcelas}>
                      <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-950 border-border/80"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: maxParcelasForma }, (_, i) => i + 1).map(n => (
                          <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase">Valor do Lançamento</Label>
                  <BRLInput
                    className="h-8 text-xs font-mono font-bold bg-white dark:bg-slate-950"
                    placeholder="0,00"
                    prefix="R$"
                    value={curValor}
                    onChange={(v) => setCurValor(v)}
                    id="pagamento-valor-input"
                  />
                </div>
                <Button
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-8 px-3 gap-1 cursor-pointer uppercase text-[10px] shadow-sm border border-slate-800 active:scale-95 transition-all shrink-0"
                  onClick={adicionarPagamento}
                >
                  » Confirmar (F3)
                </Button>
              </div>
            </div>

            {/* % DESCONTOS */}
            <div className="space-y-1.5 shrink-0">
              <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                🎯 % DESCONTOS (F4)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center rounded-lg border border-border bg-white dark:bg-slate-950 overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                  <span className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 px-2 py-1 border-r border-border select-none shrink-0">R$</span>
                  <input
                    type="text"
                    className="w-full bg-transparent text-xs font-mono font-bold px-1.5 py-1 focus:outline-none"
                    placeholder="0,00"
                    value={descontoReaisStr}
                    onChange={(e) => handleDescontoReaisChange(e.target.value)}
                    id="desconto-reais-input"
                  />
                </div>
                <div className="flex items-center rounded-lg border border-border bg-white dark:bg-slate-950 overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                  <span className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 px-2.5 py-1 border-r border-border select-none shrink-0">%</span>
                  <input
                    type="text"
                    className="w-full bg-transparent text-xs font-mono font-bold px-1.5 py-1 focus:outline-none"
                    placeholder="0,00"
                    value={descontoPctStr}
                    onChange={(e) => handleDescontoPctChange(e.target.value)}
                    id="desconto-pct-input"
                  />
                </div>
              </div>
            </div>

            {/* PAGAMENTOS ADICIONADOS */}
            <div className="space-y-1.5 shrink-0">
              <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-350">💵 PAGAMENTOS ADICIONADOS</Label>
              <div className="border border-border/80 rounded-xl p-2.5 bg-white dark:bg-slate-950 min-h-[75px] max-h-[110px] overflow-y-auto space-y-1.5 shadow-sm flex flex-col justify-center select-none">
                {(pagamentos || []).length === 0 ? (
                  <p className="text-center text-[10px] text-muted-foreground italic select-none">Nenhum pagamento adicionado</p>
                ) : (
                  <div className="space-y-1.5 w-full">
                    {(pagamentos || []).map((pag, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900 border border-border/60 rounded-lg px-2 py-1 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-850 dark:text-slate-200 text-[11px]">{pag.forma}</p>
                          {pag.parcelas && pag.parcelas > 1 && <p className="text-[9px] text-muted-foreground">{pag.parcelas}x</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px]">R$ {pag.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          <button
                            onClick={() => removerPagamento(idx)}
                            className="text-red-500 hover:text-red-650 w-4 h-4 rounded-full hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer text-[10px]"
                            title="Remover"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* TOTAL (Resumo) */}
            <div className="bg-white dark:bg-slate-950 border border-border/85 rounded-xl p-3.5 space-y-2 shadow-sm mt-auto select-none shrink-0">
              <div className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-400">
                <span>SUBTOTAL:</span>
                <span className="font-mono font-semibold">R$ {(subtotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-red-500 font-semibold">
                <span>DESCONTOS:</span>
                <span className="font-mono">R$ {(descontoReais || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-blue-500 font-semibold border-b border-border/55 pb-1.5">
                <span>PAGAMENTOS:</span>
                <span className="font-mono">R$ {(totalPago || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>

              {pendente > 0.01 ? (
                <div className="flex justify-between items-center text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-500/20 rounded-lg px-2.5 py-1.5 font-mono select-none">
                  <span>RESTANTE PENDENTE:</span>
                  <span>R$ {pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              ) : null}

              {(() => {
                const isDinheiro = (curForma || "").toLowerCase().includes("dinheiro") || (pagamentos || []).some(p => (p.forma || "").toLowerCase().includes("dinheiro"));
                const troco = isDinheiro && totalPago > total ? totalPago - total : 0;
                return troco > 0 ? (
                  <div className="flex justify-between items-center text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 font-mono select-none">
                    <span>TROCO:</span>
                    <span>R$ {troco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                ) : null;
              })()}

              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">TOTAL A PAGAR:</span>
                <span className="text-base font-black text-orange-600 dark:text-orange-400 font-mono">
                  R$ {(total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="pt-1 mt-auto shrink-0">
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 rounded-xl text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5 uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={(pagamentos || []).length === 0 || saving || pendente > 0.01}
                onClick={finalizarVendaMulti}
                id="finalizar-venda-btn"
              >
                {saving ? "Finalizando..." : "✓ Finalizar Venda (F6)"}
              </Button>
            </div>

            {/* Barra de atalhos no rodapé lateral */}
            <div className="bg-[#161d2a] border border-slate-800 text-[9px] text-slate-400 font-semibold p-2.5 rounded-xl select-none uppercase tracking-wide grid grid-cols-2 gap-2 mt-1 shrink-0">
              <div className="flex items-center gap-1"><span className="bg-slate-800 border border-slate-700 text-white rounded px-1.5 py-0.5 font-bold font-mono text-[9px]">F2</span> Forma Pagt.</div>
              <div className="flex items-center gap-1"><span className="bg-slate-800 border border-slate-700 text-white rounded px-1.5 py-0.5 font-bold font-mono text-[9px]">F3</span> Confirmar</div>
              <div className="flex items-center gap-1"><span className="bg-slate-800 border border-slate-700 text-white rounded px-1.5 py-0.5 font-bold font-mono text-[9px]">F4</span> Desconto</div>
              <div className="flex items-center gap-1"><span className="bg-slate-800 border border-slate-700 text-white rounded px-1.5 py-0.5 font-bold font-mono text-[9px]">F6</span> Finalizar</div>
              <div className="flex items-center gap-1 col-span-2 justify-center border-t border-slate-800 pt-1.5"><span className="bg-slate-800 border border-slate-700 text-white rounded px-1.5 py-0.5 font-bold font-mono text-[9px]">F8</span> Voltar para Vendas</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  </div>
);
}
