import { useState, useEffect, useRef, useCallback } from "react";
import { useChatAlerts } from "@/hooks/useChatAlerts";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmpresa } from "@/contexts/EmpresaContext";
import CheckoutDialog from "@/components/CheckoutDialog";
import {
  MessageCircle, X, Send, Loader2, Bot, User, Paperclip, Minimize2, Bike,
  ShoppingCart, Plus, Package, Trash2, CreditCard,
} from "lucide-react";

interface ChatProduct {
  id: string;
  nome: string;
  codigo_cpl?: string | null;
  imagem_url?: string | null;
  preco: number;
  estoque: number;
  categoria?: string | null;
  fornecedor?: string | null;
}

interface CartItem {
  id: string;
  nome: string;
  preco: number;
  imagem_url?: string | null;
  quantidade: number;
}

interface ChatMsg {
  id: string;
  tipo: "usuario" | "bot";
  conteudo: string;
  timestamp: Date;
  produtos?: ChatProduct[];
  anexo_url?: string;
  anexo_tipo?: "imagem" | "pdf";
  anexo_nome?: string;
}

export default function ChatWidget() {
  const { empresaId } = useEmpresa();
  const isMobile = useIsMobile();
  const [aberto, setAberto] = useState(false);
  const keyboardInset = useKeyboardInset(isMobile && aberto);
  const [mensagens, setMensagens] = useState<ChatMsg[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [digitando, setDigitando] = useState(false);
  const [minimizado, setMinimizado] = useState(false);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nomeLoja, setNomeLoja] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const cartCount = cart.reduce((sum, c) => sum + c.quantidade, 0);
  const cartTotal = cart.reduce((sum, c) => sum + c.preco * c.quantidade, 0);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const { playEstoquistaAlert, playTransferenciaAlert } = useChatAlerts();

  useEffect(() => {
    if (!empresaId) return;
    supabase
      .from("empresas")
      .select("nome_fantasia, nome")
      .eq("id", empresaId)
      .maybeSingle()
      .then(({ data }) => {
        const n = ((data as any)?.nome_fantasia || (data as any)?.nome || "").toString().trim();
        if (n) setNomeLoja(n);
      });
  }, [empresaId]);

  const lojaTitulo = nomeLoja || "Otto Tech Sistemas";

  useEffect(() => {
    if (aberto && mensagens.length === 0) {
      setMensagens([{
        id: "welcome",
        tipo: "bot",
        conteudo: `👋 Olá! Sou o assistente virtual da ${lojaTitulo}!\n\nPosso te ajudar com:\n1️⃣ 🔍 Buscar peças e preços\n2️⃣ 💰 Fazer orçamentos na hora\n3️⃣ 📅 Agendar serviços\n4️⃣ 🔧 Tirar dúvidas técnicas\n5️⃣ 💬 Falar com atendente\n\nMe conta: qual sua moto e como posso ajudar? 😊`,
        timestamp: new Date(),
      }]);
    }
  }, [aberto, lojaTitulo]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [mensagens, digitando]);

  const addToCart = useCallback((p: ChatProduct) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === p.id);
      if (existing) {
        return prev.map(c => c.id === p.id ? { ...c, quantidade: c.quantidade + 1 } : c);
      }
      return [...prev, { id: p.id, nome: p.nome, preco: p.preco, imagem_url: p.imagem_url, quantidade: 1 }];
    });
    toast.success(`${p.nome.substring(0, 30)} adicionado!`, { duration: 1500 });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(c => c.id !== id));
  }, []);

  const criarConversa = async () => {
    if (conversaId) return conversaId;
    if (!empresaId) {
      console.error("[ChatWidget] empresaId ausente — não é possível criar conversa");
      return null;
    }

    let { data: canal, error: canalErr } = await supabase
      .from("canais_comunicacao")
      .select("id")
      .eq("tipo", "site")
      .eq("empresa_id", empresaId)
      .limit(1)
      .maybeSingle();

    if (canalErr) console.error("[ChatWidget] canal select:", canalErr);

    if (!canal) {
      const { data: novoCanalData, error: insCanalErr } = await supabase
        .from("canais_comunicacao")
        .insert({ tipo: "site", nome_exibicao: "Chat do Site", configuracao: {}, ativo: true, conectado: true, empresa_id: empresaId })
        .select("id")
        .single();
      if (insCanalErr) console.error("[ChatWidget] canal insert:", insCanalErr);
      canal = novoCanalData;
    }

    if (!canal) return null;

    const { data: conversa, error: convErr } = await supabase
      .from("conversas")
      .insert({
        canal_id: canal.id,
        canal_tipo: "site",
        contato_externo_id: `visitante-${Date.now()}`,
        contato_nome: "Visitante do Site",
        status: "bot",
        empresa_id: empresaId,
      })
      .select("id")
      .single();
    if (convErr) console.error("[ChatWidget] conversa insert:", convErr);

    if (conversa) {
      setConversaId(conversa.id);
      return conversa.id;
    }
    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      toast.error("Envie apenas fotos (JPG, PNG) ou PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 10MB).");
      return;
    }

    setUploading(true);
    try {
      const cId = await criarConversa();
      if (!cId) throw new Error("Não foi possível criar conversa");

      const ext = file.name.split(".").pop() || "bin";
      const filePath = `${empresaId || 'chat'}/chat/${cId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl || "";

      const tipo = isImage ? "imagem" : "pdf";
      const descricao = isImage ? "📷 Foto enviada" : "📄 PDF enviado";

      // Show in chat
      const msgUsuario: ChatMsg = {
        id: Date.now().toString(),
        tipo: "usuario",
        conteudo: descricao,
        timestamp: new Date(),
        anexo_url: publicUrl,
        anexo_tipo: tipo,
        anexo_nome: file.name,
      };
      setMensagens(prev => [...prev, msgUsuario]);

      // Save message with attachment
      await supabase.from("mensagens").insert({
        conversa_id: cId,
        tipo_remetente: "cliente",
        tipo_mensagem: tipo,
        conteudo: `${descricao}: ${publicUrl}`,
        status_envio: "enviado",
        empresa_id: empresaId,
      });

      // Ask AI to analyze
      setDigitando(true);
      const textoIA = isImage
        ? `O cliente enviou uma foto. URL: ${publicUrl} — Analise e pergunte como pode ajudar.`
        : `O cliente enviou um PDF (${file.name}). URL: ${publicUrl} — Pergunte detalhes sobre o que precisa.`;

      const { data, error } = await supabase.functions.invoke("processar-mensagem", {
        body: { conversa_id: cId, mensagem_cliente: textoIA },
      });
      if (error) throw error;

      setMensagens(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        tipo: "bot",
        conteudo: data?.resposta || "Recebi seu arquivo! Como posso ajudar?",
        timestamp: new Date(),
        produtos: data?.produtos || [],
      }]);
    } catch (err) {
      console.error("Erro upload:", err);
      toast.error("Erro ao enviar arquivo.");
    } finally {
      setUploading(false);
      setDigitando(false);
    }
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || digitando) return;
    const texto = novaMensagem.trim();

    const msgUsuario: ChatMsg = {
      id: Date.now().toString(),
      tipo: "usuario",
      conteudo: texto,
      timestamp: new Date(),
    };

    setMensagens(prev => [...prev, msgUsuario]);
    setNovaMensagem("");
    setDigitando(true);

    try {
      const cId = await criarConversa();
      if (!cId) throw new Error("Não foi possível criar a conversa");

      await supabase.from("mensagens").insert({
        conversa_id: cId,
        tipo_remetente: "cliente",
        tipo_mensagem: "texto",
        conteudo: texto,
        status_envio: "enviado",
        empresa_id: empresaId,
      });

      const { data, error } = await supabase.functions.invoke("processar-mensagem", {
        body: { conversa_id: cId, mensagem_cliente: texto },
      });

      if (error) throw error;

      if (data?.ticket_estoquista) {
        playEstoquistaAlert();
        toast.info("🔔 Estoquista chamado — peça não cadastrada no estoque.");
      }

      if (data?.transferir) {
        playTransferenciaAlert();
        toast.warning("🙋 Transferindo para atendente humano…");
      }

      setMensagens(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        tipo: "bot",
        conteudo: data?.resposta || "Desculpe, não consegui processar sua mensagem.",
        timestamp: new Date(),
        produtos: data?.produtos || [],
      }]);
    } catch (err) {
      console.error("Erro chat:", err);
      setMensagens(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        tipo: "bot",
        conteudo: "❌ Desculpe, ocorreu um erro. Tente novamente em instantes.",
        timestamp: new Date(),
      }]);
    } finally {
      setDigitando(false);
    }
  };

  const formatHora = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // ---- Product Card Component ----
  const ProductCard = ({ produto }: { produto: ChatProduct }) => (
    <div className="flex gap-2 p-2 rounded-lg border border-border bg-card mt-1.5">
      <div className="w-14 h-14 rounded bg-white flex items-center justify-center shrink-0 overflow-hidden border border-border">
        {produto.imagem_url ? (
          <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-contain" />
        ) : (
          <Package className="h-6 w-6 text-muted-foreground/30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-foreground leading-tight truncate">{produto.nome}</p>
        {produto.codigo_cpl && (
          <p className="text-[9px] text-muted-foreground font-mono">Cód: {produto.codigo_cpl}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-bold text-primary">R$ {fmt(produto.preco)}</span>
          <Badge variant={produto.estoque > 0 ? "default" : "destructive"} className="text-[8px] px-1 py-0 h-3.5">
            {produto.estoque > 0 ? `${produto.estoque} un` : "Sem estoque"}
          </Badge>
        </div>
      </div>
      {produto.preco > 0 && produto.estoque > 0 && (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 h-8 w-8 p-0 self-center"
          onClick={() => addToCart(produto)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );

  // ---- Cart Panel ----
  const CartPanel = () => (
    <div className="absolute inset-0 bg-background z-10 flex flex-col">
      <div className="bg-primary p-3 flex items-center justify-between">
        <h3 className="font-bold text-primary-foreground text-sm flex items-center gap-2">
          <ShoppingCart size={16} /> Carrinho ({cartCount})
        </h3>
        <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-7 w-7" onClick={() => setShowCart(false)}>
          <X size={14} />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">Carrinho vazio</p>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded bg-white flex items-center justify-center shrink-0 overflow-hidden">
                {item.imagem_url ? (
                  <img src={item.imagem_url} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Package className="h-4 w-4 text-muted-foreground/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate">{item.nome}</p>
                <p className="text-xs text-primary font-bold">R$ {fmt(item.preco)} × {item.quantidade}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeFromCart(item.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
      {cart.length > 0 && (
        <div className="p-3 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold text-foreground">R$ {fmt(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-primary">No PIX (3% off):</span>
            <span className="font-bold text-primary">R$ {fmt(cartTotal * 0.97)}</span>
          </div>
          <Button className="w-full gap-2" size="sm" onClick={() => { setShowCart(false); setCheckoutOpen(true); }}>
            <CreditCard className="h-3.5 w-3.5" /> Enviar Pagamento
          </Button>
          <Button variant="outline" className="w-full" size="sm" onClick={() => {
            // Send quote summary to chat
            const linhas = cart.map(c => `• ${c.nome} — ${c.quantidade}x R$ ${fmt(c.preco)}`).join("\n");
            const total = `\nTotal: R$ ${fmt(cartTotal)}\nPIX (3% off): R$ ${fmt(cartTotal * 0.97)}`;
            setMensagens(prev => [...prev, {
              id: Date.now().toString(),
              tipo: "bot",
              conteudo: `📋 *Orçamento ${lojaTitulo}*\n\n${linhas}${total}\n\nDeseja pagar agora ou precisa de mais alguma coisa? 😊`,
              timestamp: new Date(),
            }]);
            setShowCart(false);
          }}>
            📋 Enviar Orçamento
          </Button>
        </div>
      )}
    </div>
  );

  // ---- Floating button ----
  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-50"
      >
        <Bike size={28} />
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white">
          1
        </span>
      </button>
    );
  }

  // ---- Minimized bar ----
  if (minimizado) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setMinimizado(false)}
          className="bg-card border border-border rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 hover:bg-accent transition-colors"
        >
          <Bot className="text-primary" size={24} />
          <div className="text-left">
            <p className="font-semibold text-foreground text-sm">Assistente {lojaTitulo}</p>
            <p className="text-xs text-muted-foreground">Clique para expandir</p>
          </div>
          {cartCount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-[10px]">{cartCount}</Badge>
          )}
        </button>
      </div>
    );
  }

  // ---- Full chat ----
  return (
    <>
      <div
        style={
          isMobile && keyboardInset > 0
            ? {
                bottom: `calc(env(safe-area-inset-bottom, 0px) + 0.5rem + ${keyboardInset}px)`,
                height: `calc(100dvh - 1rem - env(safe-area-inset-bottom, 0px) - ${keyboardInset}px)`,
              }
            : undefined
        }
        className="fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom,0px)_+_0.5rem)] z-50 flex h-[calc(100dvh_-_1rem_-_env(safe-area-inset-bottom,0px))] max-h-[620px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[580px] sm:w-[400px] sm:max-h-[85dvh]"
      >
        {/* Cart overlay */}
        {showCart && <CartPanel />}

        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between bg-primary p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Bot size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-primary-foreground">Assistente {lojaTitulo}</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-primary-foreground/80">Online agora</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {cartCount > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 relative"
                onClick={() => setShowCart(true)}
              >
                <ShoppingCart size={16} />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                  {cartCount}
                </span>
              </Button>
            )}
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8" onClick={() => setMinimizado(true)}>
              <Minimize2 size={16} />
            </Button>
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8" onClick={() => setAberto(false)}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* MESSAGES */}
        <div ref={messagesContainerRef} className="min-h-0 flex-1 touch-pan-y space-y-3 overflow-y-auto overscroll-contain p-3 sm:space-y-4 sm:p-4">
          {mensagens.map((msg) => (
            <div key={msg.id}>
              <div className={`flex gap-2.5 ${msg.tipo === "usuario" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.tipo === "usuario" ? "bg-accent" : "bg-primary"}`}>
                  {msg.tipo === "usuario" ? (
                    <User size={14} className="text-accent-foreground" />
                  ) : (
                    <Bot size={14} className="text-primary-foreground" />
                  )}
                </div>
                <div className={`max-w-[82%] break-words rounded-2xl px-3 py-2.5 sm:max-w-[75%] sm:px-4 ${
                  msg.tipo === "usuario"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border text-card-foreground rounded-bl-md"
                }`}>
                  {/* Attachment preview */}
                  {msg.anexo_url && msg.anexo_tipo === "imagem" && (
                    <a href={msg.anexo_url} target="_blank" rel="noopener noreferrer">
                      <img src={msg.anexo_url} alt="Foto enviada" className="rounded-lg max-w-full max-h-40 object-contain mt-1 mb-1 cursor-pointer" />
                    </a>
                  )}
                  {msg.anexo_url && msg.anexo_tipo === "pdf" && (
                    <a href={msg.anexo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 mt-1 mb-1 hover:bg-muted transition-colors">
                      <Paperclip size={14} />
                      <span className="text-xs underline truncate">{msg.anexo_nome || "Documento.pdf"}</span>
                    </a>
                  )}
                  {msg.conteudo.split("\n").map((linha, i) => (
                    <p key={i} className="text-sm mb-1 last:mb-0 whitespace-pre-wrap">{linha}</p>
                  ))}
                  <span className="mt-1 block text-right text-[10px] opacity-60">{formatHora(msg.timestamp)}</span>
                </div>
              </div>

              {/* Product cards */}
              {msg.produtos && msg.produtos.length > 0 && (
                <div className="ml-9 mt-1 space-y-1.5">
                  {msg.produtos.map((p) => (
                    <ProductCard key={p.id} produto={p} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {digitando && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Bot size={14} className="text-primary-foreground" />
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3 rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* INPUT */}
        <div className="shrink-0 border-t border-border bg-card p-3 pb-[calc(env(safe-area-inset-bottom,0px)_+_0.75rem)] sm:pb-3">
          <div className="flex min-w-0 gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              size="icon"
              variant="outline"
              className="shrink-0 h-9 w-9"
              disabled={uploading || digitando}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
            </Button>
            <Input
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviarMensagem()}
              placeholder="Digite sua mensagem..."
              className="h-9 min-w-0 flex-1"
              disabled={digitando}
            />
            <Button
              onClick={enviarMensagem}
              disabled={!novaMensagem.trim() || digitando}
              size="icon"
              className="shrink-0 h-9 w-9"
            >
              {digitando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none">
            {["🔍 Buscar peças", "💰 Fazer orçamento", "📅 Agendar serviço", "💬 Falar com atendente"].map((s) => (
              <button
                key={s}
                onClick={() => setNovaMensagem(s)}
                className="px-3 py-1 bg-secondary text-secondary-foreground border border-border rounded-full text-[11px] whitespace-nowrap hover:bg-accent transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Checkout Dialog (Asaas) */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        cart={cart}
        onClearCart={() => setCart([])}
      />
    </>
  );
}
