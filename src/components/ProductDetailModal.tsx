import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Package, MapPin, Loader2, ChevronLeft, ChevronRight, Heart, Share2, MessageCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { generateProductShareImage } from "@/lib/shareProductImage";
import WhatsAppShareButton from "@/components/WhatsAppShareButton";

interface ProductDetailModalProps {
  product: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getPrecoVenda: (precos: any, precoCusto?: number | null) => number | null;
  pixDiscount: number;
  maxParcelas: number;
  onAddToCart: (item: { id: string; nome: string; preco: number; imagem_url?: string | null }) => void;
  onBuyNow: (item: { id: string; nome: string; preco: number; imagem_url?: string | null }) => void;
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
}

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
  getPrecoVenda,
  pixDiscount,
  maxParcelas,
  onAddToCart,
  onBuyNow,
  isLoggedIn = true,
  onRequireLogin,
}: ProductDetailModalProps) {
  const [cep, setCep] = useState("");
  const [frete, setFrete] = useState<{ valor: string; prazo: string } | null>(null);
  const [loadingFrete, setLoadingFrete] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [sharingWhatsapp, setSharingWhatsapp] = useState(false);

  if (!product) return null;

  const preco = getPrecoVenda(product.precos_venda, product.preco_custo);
  const precoPix = preco ? preco * (1 - pixDiscount) : null;
  const parcela = preco && preco / maxParcelas >= 1 ? { n: maxParcelas, valor: preco / maxParcelas } : preco ? { n: 1, valor: preco } : null;
  const aplicacoes = (product.aplicacoes as string[] | null) || [];
  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const consultarFrete = async () => {
    if (cep.replace(/\D/g, "").length < 8) {
      toast.error("Digite um CEP válido (8 dígitos)");
      return;
    }
    setLoadingFrete(true);
    // Simulated freight calculation
    await new Promise((r) => setTimeout(r, 1200));
    const cepNum = parseInt(cep.replace(/\D/g, "").substring(0, 2));
    const valor = cepNum < 30 ? 18.9 : cepNum < 50 ? 24.9 : cepNum < 70 ? 32.9 : 39.9;
    const prazo = cepNum < 30 ? "3 a 5" : cepNum < 50 ? "5 a 8" : "7 a 12";
    setFrete({ valor: fmt(valor), prazo: `${prazo} dias úteis` });
    setLoadingFrete(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.nome, text: `Confira: ${product.nome}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  const handleShareWhatsapp = async () => {
    setSharingWhatsapp(true);
    try {
      const code = product.codigo_cpl || product.codigo_fornecedor || product.nome;
      let imageUrl: string | null = null;

      if (product.imagem_url) {
        imageUrl = await generateProductShareImage(product.imagem_url, code);
      }

      const precoText = preco ? `R$ ${fmt(preco)}` : "Consulte";
      const pixText = precoPix ? ` | Pix: R$ ${fmt(precoPix)}` : "";
      let msg = `🏍️ *${product.nome}*\n📦 Código: ${code}\n💰 ${precoText}${pixText}`;
      if (product.categoria) msg += `\n📂 ${product.categoria}`;
      if (aplicacoes.length > 0) msg += `\n🔧 ${aplicacoes.slice(0, 3).join(", ")}`;
      if (imageUrl) msg += `\n\n📸 Foto: ${imageUrl}`;

      const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, "_blank");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao compartilhar");
    } finally {
      setSharingWhatsapp(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setFrete(null); setCep(""); setQuantidade(1); } }}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background border-border">
        {/* Top bar */}
        <div className="flex items-start justify-between p-4 pb-0">
          <h1 className="text-base md:text-lg font-bold text-foreground leading-tight pr-4 flex-1">
            {product.nome}
            {aplicacoes.length > 0 && <span className="text-muted-foreground font-normal"> {aplicacoes[0]}</span>}
          </h1>
          {product.fornecedor && (
            <span className="shrink-0 text-xl md:text-2xl font-black uppercase text-primary tracking-tight" style={{ fontStyle: "italic" }}>
              {product.fornecedor}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* LEFT: Image */}
          <div className="p-4">
            <div className="relative bg-white rounded-xl border border-border flex items-center justify-center aspect-square overflow-hidden">
              {product.imagem_url ? (
                <img
                  src={product.imagem_url}
                  alt={product.nome}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <Package className="h-24 w-24 text-muted-foreground/20" />
              )}
              {(product.estoque_quantidade ?? 0) > 0 && (
                <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-md">
                  PRONTA ENTREGA
                </span>
              )}
            </div>
            {/* WhatsApp Share + Copy + Preview */}
            <div className="mt-2">
              <WhatsAppShareButton
                product={{
                  name: product.nome,
                  price: preco ? fmt(preco) : "Consulte",
                  originalPrice: preco ? fmt(preco) : null,
                  discount: preco ? Math.round(pixDiscount * 100) : null,
                  model: aplicacoes.length > 0 ? aplicacoes[0] : null,
                  description: product.descricao || null,
                  imageUrl: product.imagem_url || null,
                  paymentLink: `https://ecommercerf.lovable.app/ecommerce`,
                  productCode: product.codigo_cpl || product.codigo_fornecedor || null,
                  brand: product.fornecedor || product.marca || null,
                }}
              />
            </div>
            {/* SKU */}
            {product.codigo_fornecedor && (
              <p className="text-[11px] text-muted-foreground font-mono mt-2">SKU: {product.codigo_fornecedor}</p>
            )}
          </div>

          {/* RIGHT: Pricing & Actions */}
          <div className="p-4 space-y-4">
            {/* Views badge (simulated) */}
            <div className="flex items-center gap-2 bg-accent/50 rounded-lg p-2.5 border border-border">
              <span className="text-lg">👀</span>
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">+ de {Math.floor(Math.random() * 30) + 5} pessoas</strong> viram esse produto hoje.
              </p>
            </div>

            {!isLoggedIn ? (
              <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Lock className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-wide">Faça login para ver os preços</span>
                </div>
                <p className="text-xs text-muted-foreground">Entre ou cadastre-se para acessar valores, descontos e finalizar a compra.</p>
                <Button
                  className="w-full h-10 gradient-primary text-white font-bold uppercase"
                  onClick={() => { onOpenChange(false); onRequireLogin?.(); }}
                >
                  Entrar / Cadastrar
                </Button>
              </div>
            ) : preco ? (
              <div className="space-y-2">
                {/* Discount badge */}
                <Badge className="bg-destructive text-destructive-foreground text-xs font-bold">
                  {Math.round(pixDiscount * 100)}% OFF NO PIX
                </Badge>

                {/* Original price */}
                <p className="text-sm text-muted-foreground line-through">R$ {fmt(preco)}</p>

                {/* PIX price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-primary">R$ {fmt(precoPix!)}</span>
                  <span className="text-sm text-primary/80 font-medium">no Pix</span>
                </div>

                {/* Installments */}
                <div className="text-sm text-foreground font-bold">
                  <p>R$ {fmt(preco)} em 1x</p>
                  {parcela && parcela.n > 1 && (
                    <p>ou até {parcela.n}x de R$ {fmt(parcela.valor)} sem juros</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-lg text-muted-foreground font-medium">Consulte o preço</p>
            )}

            <Separator />

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Quantidade:</span>
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button
                  className="h-9 w-9 flex items-center justify-center hover:bg-accent transition-colors"
                  onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                >
                  -
                </button>
                <span className="h-9 w-10 flex items-center justify-center text-sm font-bold border-x border-border">
                  {quantidade}
                </span>
                <button
                  className="h-9 w-9 flex items-center justify-center hover:bg-accent transition-colors"
                  onClick={() => setQuantidade(quantidade + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* CEP */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => { setCep(e.target.value); setFrete(null); }}
                  className="flex-1 h-10"
                  maxLength={9}
                  onKeyDown={(e) => e.key === "Enter" && consultarFrete()}
                />
                <Button
                  variant="outline"
                  onClick={consultarFrete}
                  disabled={loadingFrete}
                  className="h-10 px-4 text-sm"
                >
                  {loadingFrete ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                </Button>
              </div>
              <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                Não sei meu CEP
              </a>

              {frete && (
                <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3 border border-primary/10">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p>Insira o CEP acima para ver o <strong className="text-primary">prazo de entrega</strong> e as <strong className="text-primary">melhores opções de frete</strong> para sua região.</p>
                    <p className="mt-1 font-medium text-foreground">
                      Frete: R$ {frete.valor} — Prazo: {frete.prazo}
                    </p>
                  </div>
                </div>
              )}
              {!frete && (
                <div className="flex items-start gap-2 bg-primary/10 rounded-lg p-3 border border-primary/20">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground font-medium">
                    Insira o CEP acima para ver o <strong className="text-primary">prazo de entrega</strong> e as <strong className="text-primary">melhores opções de frete</strong> para sua região.
                  </p>
                </div>
              )}
            </div>

            {/* Buttons */}
            {isLoggedIn && preco && (
              <div className="space-y-2.5 pt-1">
                <Button
                  className="w-full h-12 text-base font-bold uppercase tracking-wide gradient-primary text-white"
                  onClick={() => {
                    for (let i = 0; i < quantidade; i++) {
                      onBuyNow({ id: product.id, nome: product.nome, preco, imagem_url: product.imagem_url });
                    }
                    onOpenChange(false);
                  }}
                >
                  Comprar agora
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 text-sm font-bold uppercase border-primary text-foreground hover:bg-primary/5"
                  onClick={() => {
                    for (let i = 0; i < quantidade; i++) {
                      onAddToCart({ id: product.id, nome: product.nome, preco, imagem_url: product.imagem_url });
                    }
                    onOpenChange(false);
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Adicionar ao carrinho
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Description */}
        <Separator />
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Descrição</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.descricao || `${product.nome} — peça de alta qualidade para sua moto. Produto de procedência garantida, fabricado com materiais de primeira linha.`}
          </p>

          {product.categoria && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">Categoria:</span>
              <Badge variant="secondary" className="text-[10px]">{product.categoria}</Badge>
            </div>
          )}

          {aplicacoes.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">🏍️ Aplicações compatíveis:</p>
              <div className="flex flex-wrap gap-1">
                {aplicacoes.map((app, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{app}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
