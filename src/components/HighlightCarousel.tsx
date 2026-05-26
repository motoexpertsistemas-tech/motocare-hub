import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HighlightProduct {
  id: string;
  nome: string;
  imagem_url: string | null;
  preco: number | null;
  precoPix: number | null;
  fornecedor?: string | null;
  estoque_quantidade?: number;
  parcelas?: { n: number; valor: number } | null;
}

interface HighlightCarouselProps {
  title: string;
  emoji?: string;
  products: HighlightProduct[];
  onProductClick: (p: any) => void;
  onAddToCart: (p: any) => void;
  onBuy: (p: any) => void;
  fmt: (v: number) => string;
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
}

export function HighlightCarousel({ title, emoji = "🔥", products, onProductClick, onAddToCart, onBuy, fmt, isLoggedIn = true, onRequireLogin }: HighlightCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (products.length === 0) return null;

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    setTimeout(checkScroll, 400);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-black text-foreground flex items-center gap-2">
          {emoji} {title}
        </h2>
        <div className="flex items-center gap-1">
          <div className="flex gap-1.5">
            {[0, 1].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background border border-border shadow-lg rounded-full p-2 transition-all"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
        >
          {products.map((p) => {
            const discount = p.preco && p.precoPix ? Math.round(((p.preco - p.precoPix) / p.preco) * 100) : null;

            return (
              <div
                key={p.id}
                className="shrink-0 w-44 md:w-48 bg-background rounded-lg border border-border overflow-hidden group hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex flex-col cursor-pointer"
                onClick={() => {
                  if (!isLoggedIn) {
                    onRequireLogin?.();
                    return;
                  }
                  onProductClick(p);
                }}
              >
                <div className="relative flex items-center justify-center h-36 bg-white p-2">
                  {p.imagem_url ? (
                    <img
                      src={p.imagem_url}
                      alt={p.nome}
                      className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <Package className="h-10 w-10 text-muted-foreground/30" />
                  )}
                  {discount && discount > 0 && (
                    <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md">
                      -{discount}%
                    </span>
                  )}
                  {p.fornecedor && (
                    <span className="absolute top-2 right-2 bg-foreground/80 text-white text-[9px] font-medium px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {p.fornecedor}
                    </span>
                  )}
                </div>
                <div className="p-2.5 flex flex-col flex-1">
                  <h3 className="text-[11px] font-semibold leading-tight line-clamp-2 min-h-[2rem] group-hover:text-primary transition-colors">
                    {p.nome}
                  </h3>
                  <div className="mt-auto pt-2">
                    {!isLoggedIn ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRequireLogin?.(); }}
                        className="w-full text-[10px] font-semibold text-primary border border-dashed border-primary/40 rounded px-1.5 py-1 hover:bg-primary/10 transition-colors"
                      >
                        🔒 Entrar p/ ver preço
                      </button>
                    ) : p.preco ? (
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground/70 line-through">
                          R$ {fmt(p.preco)}
                        </p>
                        <p className="text-sm font-black text-primary">
                          R$ {fmt(p.precoPix!)}
                        </p>
                        {p.parcelas && p.parcelas.n > 1 && (
                          <p className="text-[10px] text-muted-foreground">
                            ou {p.parcelas.n}x de R$ {fmt(p.parcelas.valor)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Consulte</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background border border-border shadow-lg rounded-full p-2 transition-all"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
