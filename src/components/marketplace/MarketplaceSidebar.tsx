import { useNavigate } from "react-router-dom";

interface MarketplaceInfo {
  slug: string;
  nome: string;
  logo: string;
  cor: string;
}

interface MarketplaceSidebarProps {
  marketplaces: MarketplaceInfo[];
  currentSlug: string;
  title: string;
}

export default function MarketplaceSidebar({
  marketplaces,
  currentSlug,
  title,
}: MarketplaceSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="w-48 shrink-0 border-r border-border bg-card hidden lg:block">
      <div className="p-4 border-b border-border">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <nav className="p-2 space-y-0.5">
        {marketplaces.map((mk) => (
          <button
            key={mk.slug}
            onClick={() => navigate(`/marketplaces/${mk.slug}`)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              mk.slug === currentSlug
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {mk.nome}
          </button>
        ))}
      </nav>
    </aside>
  );
}
