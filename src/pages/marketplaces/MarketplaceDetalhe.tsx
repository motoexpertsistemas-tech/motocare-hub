import { useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { usePlano } from "@/contexts/PlanoContext";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

import logoMercadoLivre from "@/assets/logo-mercadolivre.png";
import logoAmazon from "@/assets/logo-amazon.png";
import logoShopee from "@/assets/logo-shopee.png";
import logoTikTok from "@/assets/logo-tiktok.png";
import logoShein from "@/assets/logo-shein.png";
import logoMagalu from "@/assets/logo-magalu.png";
import logoKwaiShop from "@/assets/logo-kwaishop.png";

import MarketplaceSidebar from "@/components/marketplace/MarketplaceSidebar";
import MarketplaceProductTable from "@/components/marketplace/MarketplaceProductTable";
import MigracaoLojaDialog from "@/components/marketplace/MigracaoLojaDialog";

// ── Marketplace registry ──
interface MarketplaceInfo {
  slug: string;
  nome: string;
  logo: string;
  cor: string;
}

const ALL_MARKETPLACES: MarketplaceInfo[] = [
  { slug: "shopee", nome: "Shopee", logo: logoShopee, cor: "#EE4D2D" },
  { slug: "mercado-livre", nome: "Mercado Libre", logo: logoMercadoLivre, cor: "#FFE600" },
  { slug: "amazon", nome: "Amazon", logo: logoAmazon, cor: "#FF9900" },
  { slug: "shein", nome: "Shein", logo: logoShein, cor: "#000000" },
  { slug: "tiktok-shop", nome: "TikTok Shop", logo: logoTikTok, cor: "#000000" },
  { slug: "kwai-shop", nome: "Kwai", logo: logoKwaiShop, cor: "#FF6600" },
  { slug: "magalu", nome: "Magalu", logo: logoMagalu, cor: "#0086ff" },
];

export default function MarketplaceDetalhe() {
  const { slug } = useParams<{ slug: string }>();
  const role = useRole();
  const plano = usePlano();
  const [migracaoOpen, setMigracaoOpen] = useState(false);

  const currentMk = ALL_MARKETPLACES.find((m) => m.slug === slug);

  if (role !== "ADMIN" && role !== "GERENTE") return <Navigate to="/" replace />;
  if (plano !== "platina") return <Navigate to="/" replace />;
  if (!currentMk) return <Navigate to="/marketplaces" replace />;

  return (
    <div className="min-h-[calc(100vh-80px)]">
      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 p-4 md:p-6 space-y-4 overflow-auto">
        {/* Header with marketplace logo */}
        <div className="flex items-center gap-3">
          <img
            src={currentMk.logo}
            alt={currentMk.nome}
            className="h-8 w-auto object-contain"
            loading="lazy"
          />
          <h1 className="text-lg font-bold text-foreground">
            {currentMk.nome} — Migração de Produtos
          </h1>
        </div>

        {/* Product table with filters, tabs, pagination */}
        <MarketplaceProductTable
          slug={slug || ""}
          marketplaceNome={currentMk.nome}
          onMigracaoClick={() => setMigracaoOpen(true)}
        />
      </main>

      {/* Migration dialog */}
      <MigracaoLojaDialog
        open={migracaoOpen}
        onOpenChange={setMigracaoOpen}
        marketplaces={ALL_MARKETPLACES.map((m) => ({ slug: m.slug, nome: m.nome }))}
        currentSlug={slug || ""}
        onConfirm={(config) => {
          toast.success(
            `Migração configurada: ${config.lojaOrigem} → ${config.plataformaDestino}`
          );
        }}
      />
    </div>
  );
}
