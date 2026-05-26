import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useBranch, Branch } from "@/contexts/BranchContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ottoLogoDark from "@/assets/otto-tech-dark.png";
import {
  LayoutDashboard,
  Wrench,
  ShoppingCart,
  Package,
  DollarSign,
  Store,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bike,
  Shield,
  Monitor,
  Heart,
  BarChart3,
  Fingerprint,
  Leaf,
  Search,
  Bell,
  ExternalLink,
  Tag,
  Layers,
  Ruler,
  Grid3X3,
  ListPlus,
  ClipboardList,
  ArrowLeftRight,
  SlidersHorizontal,
  FileText,
  ShoppingBag,
  RefreshCw,
  Mail,
  Warehouse,
  Users,
  Truck,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  CalendarDays,
  ClipboardCheck,
  UserCheck,
  Clock,
  User,
  Calendar,
  Crown,
  Calculator,
  HelpCircle,
  Lightbulb,
  Megaphone,
  LogOut,
  Sparkles,
  MessageCircle,
  Building2,
  Check,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { roles, type Role, RoleProvider } from "@/contexts/RoleContext";
import { planos, planoLabels, type Plano, PlanoProvider } from "@/contexts/PlanoContext";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import ChatWidget from "@/components/chat/ChatWidget";

interface NavChild {
  label: string;
  path: string;
  icon: any;
}



interface NavItem {
  icon: any;
  label: string;
  path: string;
  roles: Role[];
  children?: NavChild[];
  planos?: Plano[];
  section?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard & Analytics", path: "/", roles: ["ADMIN", "GERENTE", "VENDEDOR", "MECÂNICO"] },
  {
    icon: Wrench, label: "Ordens de serviços", path: "/os", roles: ["ADMIN", "GERENTE", "MECÂNICO"],
    children: [
      { label: "Gerenciar O.S.", path: "/os", icon: ClipboardList },
      { label: "Situações", path: "/os/situacoes", icon: Settings },
    ],
  },
  { icon: CalendarDays, label: "Agenda OS", path: "/os/agenda", roles: ["ADMIN", "GERENTE", "MECÂNICO"] },
  { icon: CalendarDays, label: "Revisões Agendadas", path: "/os/revisoes-agendadas", roles: ["ADMIN", "GERENTE", "MECÂNICO"] },
  {
    icon: Wrench, label: "Serviços / Mão de obra", path: "/servicos", roles: ["ADMIN", "GERENTE", "MECÂNICO"],
    children: [
      { label: "Tabela de Preços", path: "/servicos", icon: ClipboardList },
      { label: "Custo de Homem/Hora", path: "/servicos/custo-homem-hora", icon: Clock },
    ],
  },
  {
    icon: Package, label: "Produtos", path: "/produtos", roles: ["ADMIN", "GERENTE", "VENDEDOR"],
    children: [
      { label: "Gerenciar produtos", path: "/estoque", icon: ClipboardList },
      { label: "Valores de venda", path: "/estoque/valores-venda", icon: DollarSign },
      { label: "Etiquetas", path: "/estoque/etiquetas", icon: Tag },
      { label: "Grupos de produtos", path: "/estoque/grupos", icon: Layers },
      { label: "Relatório de estoque", path: "/relatorios/estoque/produtos", icon: BarChart3 },
    ],
  },
  {
    icon: Warehouse, label: "Estoque", path: "/estoque-hub", roles: ["ADMIN", "GERENTE", "VENDEDOR"],
    children: [
      { label: "Movimentações", path: "/estoque/movimentacoes", icon: ArrowLeftRight },
      { label: "Ajustes", path: "/estoque/ajustes", icon: SlidersHorizontal },
      { label: "Transferências", path: "/estoque/transferencias", icon: ArrowLeftRight },
      { label: "Cotações", path: "/estoque/cotacoes", icon: FileText },
      { label: "Compras", path: "/estoque/compras", icon: ShoppingBag },
      { label: "Trocas e devoluções", path: "/estoque/trocas", icon: RefreshCw },
      { label: "Situações de compras", path: "/estoque/situacoes-compras", icon: ClipboardList },
      { label: "Configurações", path: "/estoque/configuracoes", icon: Settings },
    ],
  },
  {
    icon: FileText, label: "Orçamentos", path: "/orcamentos", roles: ["ADMIN", "GERENTE", "VENDEDOR"],
    children: [
      { label: "Orçamentos de produtos", path: "/orcamentos/produtos", icon: ClipboardList },
    ],
  },
  {
    icon: ShoppingCart, label: "PDV (Vendas)", path: "/pdv", roles: ["ADMIN", "GERENTE", "VENDEDOR"],
    children: [
      { label: "Vendas Balcão", path: "/vendas-balcao", icon: ShoppingCart },
      { label: "Venda Atacado", path: "/venda-atacado", icon: ShoppingBag },
    ],
  },
  {
    icon: Bike, label: "Atendimento Express", path: "/atendimento-express", roles: ["ADMIN", "GERENTE", "VENDEDOR"],
    children: [
      { label: "Atendimento", path: "/atendimento-express", icon: MessageCircle },
      { label: "Criativos", path: "/atendimento-express?tab=criativos", icon: Sparkles },
    ],
  },
  {
    icon: ClipboardCheck, label: "Cadastros", path: "/cadastros", roles: ["ADMIN", "GERENTE", "VENDEDOR"],
    children: [
      { label: "Clientes", path: "/clientes", icon: Users },
      { label: "Fornecedores", path: "/fornecedores", icon: Truck },
      { label: "Funcionários", path: "/cadastros/funcionarios", icon: UserCheck },
      { label: "Transportadoras", path: "/cadastros/transportadoras", icon: Truck },
      { label: "Categorias", path: "/cadastros/categorias", icon: Layers },
    ],
  },
  {
    icon: DollarSign, label: "Financeiro", path: "/financeiro", roles: ["ADMIN", "GERENTE"],
    children: [
      { label: "Fluxo de caixa", path: "/financeiro/fluxo-caixa", icon: BarChart3 },
      { label: "Contas a pagar", path: "/financeiro/contas-pagar", icon: ArrowDownRight },
      { label: "Contas a receber", path: "/financeiro/contas-receber", icon: ArrowUpRight },
      { label: "Boletos bancários", path: "/financeiro/boletos", icon: FileText },
      { label: "Caixas", path: "/financeiro/caixas", icon: DollarSign },
      { label: "Contas bancárias", path: "/financeiro/contas-bancarias", icon: CreditCard },
      { label: "Formas de pagamento", path: "/financeiro/formas-pagamento", icon: CreditCard },
      { label: "Situações", path: "/financeiro/situacoes", icon: ClipboardList },
      { label: "Conciliação bancária", path: "/financeiro/conciliacao", icon: ArrowLeftRight },
      { label: "Transferências", path: "/financeiro/transferencias", icon: ArrowLeftRight },
      
      { label: "Comissões", path: "/financeiro/comissoes", icon: Grid3X3 },
      { label: "Plano de contas", path: "/financeiro/plano-contas", icon: FileText },
    ],
  },
  {
    icon: FileText, label: "Fiscal", path: "/fiscal", roles: ["ADMIN", "GERENTE"],
    children: [
      { label: "Configuração", path: "/fiscal/configuracao", icon: Settings },
      { label: "Emissões", path: "/fiscal/emissoes", icon: FileText },
      { label: "NF-e de devolução", path: "/fiscal/nfe-devolucao", icon: FileText },
      { label: "NF-e de ajuste", path: "/fiscal/nfe-ajuste", icon: FileText },
      { label: "Calculadoras de Impostos", path: "/fiscal/calculadoras", icon: Calculator },
    ],
  },
  {
    icon: FileText, label: "Relatórios", path: "/relatorios", roles: ["ADMIN", "GERENTE"],
    children: [
      { label: "DRE Gerencial", path: "/relatorios/dre", icon: BarChart3 },
      { label: "Vendas", path: "/relatorios/vendas", icon: ShoppingCart },
      { label: "Estoque", path: "/relatorios/estoque", icon: Package },
      { label: "Financeiro", path: "/relatorios/financeiro", icon: DollarSign },
      { label: "Clientes", path: "/relatorios/clientes", icon: Users },
      { label: "Serviços / OS", path: "/relatorios/os", icon: Wrench },
      { label: "Comissões", path: "/relatorios/comissoes", icon: Grid3X3 },
      { label: "Fidelidade", path: "/fidelidade", icon: Heart },
    ],
  },
  {
    icon: Store, label: "E-commerce", path: "/ecommerce", roles: ["ADMIN", "GERENTE", "VENDEDOR", "CLIENTE"], planos: ["platina"],
    children: [
      { label: "Vitrine", path: "/ecommerce", icon: Store },
      { label: "Produtos Vitrine", path: "/ecommerce/produtos-vitrine", icon: Package },
      { label: "Configurações da Loja", path: "/ecommerce/config", icon: Settings },
    ],
  },
  {
    icon: ShoppingBag, label: "Marketplaces", path: "/marketplaces", roles: ["ADMIN", "GERENTE"], planos: ["platina"],
    children: [
      { label: "Dashboard", path: "/marketplaces", icon: BarChart3 },
      { label: "Pedidos", path: "/marketplaces/pedidos", icon: ClipboardList },
      { label: "Calculadora de Lucro", path: "/marketplaces/calculadora", icon: DollarSign },
      { label: "Meus Produtos", path: "/marketplaces/meus-produtos", icon: Package },
      { label: "Mercado Livre", path: "/marketplaces/mercado-livre", icon: ShoppingCart },
      { label: "Shopee", path: "/marketplaces/shopee", icon: ShoppingBag },
      { label: "Amazon", path: "/marketplaces/amazon", icon: Package },
      { label: "TikTok Shop", path: "/marketplaces/tiktok-shop", icon: ShoppingCart },
      { label: "Shein", path: "/marketplaces/shein", icon: ShoppingBag },
    ],
  },
  
  {
    icon: ClipboardCheck, label: "Gestão Operacional", path: "/gestao-operacional", roles: ["ADMIN", "GERENTE"],
    children: [
      { label: "Setores e Tarefas", path: "/gestao-operacional", icon: ClipboardList },
      { label: "Relatório Mensal", path: "/gestao-operacional/relatorio", icon: BarChart3 },
    ],
  },
  {
    icon: Building2, label: "Filiais", path: "/filiais", roles: ["ADMIN", "GERENTE"],
    children: [
      { label: "Minhas Filiais", path: "/filiais", icon: Building2 },
      { label: "Estoque por Filial", path: "/filiais/estoque", icon: Package },
      { label: "Visão Consolidada", path: "/filiais/estoque/consolidado", icon: BarChart3 },
    ],
  },
  { icon: Shield, label: "Auditoria", path: "/auditoria", roles: ["ADMIN"] },
  { icon: Fingerprint, label: "LGPD & Segurança", path: "/lgpd", roles: ["ADMIN"] },
  { icon: Monitor, label: "Quiosque", path: "/quiosque", roles: ["ADMIN", "MECÂNICO"] },
  { icon: Settings, label: "Configurações", path: "/config", roles: ["ADMIN"] },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<Role>("ADMIN");
  const { activeBranch, branches, setActiveBranch } = useBranch();
  const { empresaId } = useEmpresa();
  const [activePlano, setActivePlano] = useState<Plano>("platina");
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [pendingBranch, setPendingBranch] = useState<Branch | null>(null);
  const [userData, setUserData] = useState<{ nome: string; email: string }>({ nome: "", email: "" });
  const location = useLocation();
  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.search]);
  const navigate = useNavigate();

  const filteredNavItems = useMemo(() => {
    const getSectionForItem = (item: NavItem): string => {
      const p = item.path;
      if (p === "/") return "Geral";
      if (p.startsWith("/os") || p.startsWith("/servicos")) return "Serviços & O.S.";
      if (p.startsWith("/produtos") || p.startsWith("/estoque") || p.startsWith("/estoque-hub")) return "Estoque & Catálogo";
      if (p.startsWith("/orcamentos") || p.startsWith("/pdv") || p.startsWith("/vendas-balcao") || p.startsWith("/atendimento-express")) return "Vendas & PDV";
      if (p.startsWith("/clientes") || p.startsWith("/fornecedores") || p.startsWith("/cadastros")) return "Cadastros";
      if (p.startsWith("/financeiro") || p.startsWith("/fiscal") || p.startsWith("/relatorios")) return "Financeiro & Fiscal";
      if (p.startsWith("/ecommerce") || p.startsWith("/marketplaces")) return "Integrações & Canais";
      if (p.startsWith("/gestao-operacional") || p.startsWith("/filiais")) return "Administração & Filiais";
      return "Segurança & Configurações";
    };

    return navItems
      .filter(
        (item) =>
          item.roles.includes(activeRole) &&
          (!item.planos || item.planos.includes(activePlano))
      )
      .map(item => ({
        ...item,
        section: getSectionForItem(item)
      }));
  }, [activeRole, activePlano]);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUserData(prev => ({ ...prev, email: session.user.email || "" }));
      if (empresaId) {
        const { data } = await supabase
          .from("empresas" as any)
          .select("nome_fantasia, nome")
          .eq("id", empresaId)
          .maybeSingle() as any;
        if (data) {
          setUserData(prev => ({ ...prev, nome: data.nome_fantasia || data.nome || "" }));
        }
      }
    };
    loadUser();
  }, [empresaId]);

  const userInitials = useMemo(() => {
    if (!userData.nome) return "U";
    return userData.nome.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  }, [userData.nome]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleBranchSelect = (b: Branch) => {
    if (b.id === activeBranch?.id) return;
    setPendingBranch(b);
  };

  const confirmBranchSwitch = () => {
    if (pendingBranch) {
      setActiveBranch(pendingBranch);
      setPendingBranch(null);
    }
  };

  const toggleMenu = (path: string) => {
    setExpandedMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isChildActive = (item: NavItem) =>
    item.children?.some((c) => {
      if (c.path.includes("?")) {
        const [base, query] = c.path.split("?");
        return location.pathname === base && location.search === `?${query}`;
      }
      return location.pathname === c.path;
    }) || location.pathname.startsWith(item.path + "/");

  // CLIENTE role: full-screen without sidebar/topbar, redirect to ecommerce
  if (activeRole === "CLIENTE") {
    return (
      <RoleProvider value={activeRole}>
        <PlanoProvider value={activePlano}>
        <div className="h-screen overflow-auto bg-background">
          {/* Minimal top bar with role switcher for demo */}
          <div className="flex items-center justify-end gap-1 px-3 py-1.5 bg-sidebar border-b border-border">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[11px] font-bold tracking-wide transition-all duration-200 whitespace-nowrap shrink-0",
                  activeRole === role
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {role}
              </button>
            ))}
          </div>
          {children}
        </div>
        <ChatWidget />
        </PlanoProvider>
      </RoleProvider>
    );
  }

  const shouldShowChat = useMemo(() => {
    const path = location.pathname;
    return (
      path.startsWith("/ecommerce") ||
      path.startsWith("/os") ||
      path.startsWith("/atendimento-express")
    );
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300",
          "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div
          className="flex h-16 items-center justify-center border-b border-sidebar-border bg-black cursor-pointer overflow-hidden transition-all duration-300"
          onClick={() => navigate("/")}
        >
          <img src={ottoLogoDark} alt="Otto Tech Sistemas" className={collapsed ? "h-8 w-8 object-contain" : "h-11 object-contain"} />
        </div>

        {/* Branch Selector (Sidebar) */}
        <div className="p-3 border-b border-sidebar-border/50">
          <Popover>
            <PopoverTrigger asChild>
              {collapsed ? (
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white hover:bg-slate-950 transition-all duration-200 shadow-md mx-auto cursor-pointer"
                  title={activeBranch?.nome || "Selecionar loja"}
                >
                  <Building2 className="h-5 w-5 shrink-0" />
                </button>
              ) : (
                <button
                  className="flex w-full items-center gap-3 rounded-xl bg-black hover:bg-slate-950 text-white p-3 transition-all duration-200 text-left shadow-lg cursor-pointer border border-black hover:scale-[1.02] group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-primary shrink-0 transition-colors group-hover:bg-slate-800">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-normal text-white uppercase tracking-wide break-words">
                      {activeBranch?.nome || "Selecionar loja"}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5 font-mono">
                      {activeBranch?.cnpj || "CNPJ não cadastrado"}
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 group-hover:text-white transition-colors" />
                </button>
              )}
            </PopoverTrigger>
            <PopoverContent align={collapsed ? "center" : "start"} side={collapsed ? "right" : "bottom"} className="w-72 p-0 shadow-2xl border border-border">
              <div className="px-3 py-2 border-b border-border bg-slate-50 dark:bg-slate-900">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Selecionar loja</p>
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {(branches || []).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleBranchSelect(b)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-secondary transition-colors",
                      activeBranch?.id === b.id && "bg-secondary/80 font-semibold"
                    )}
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-xs truncate uppercase">{b.nome}</p>
                      {b.cnpj && <p className="text-[10px] text-muted-foreground font-mono truncate">{b.cnpj}</p>}
                    </div>
                    {activeBranch?.id === b.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-border px-3 py-2 bg-slate-50 dark:bg-slate-900">
                <button
                  onClick={() => navigate("/filiais")}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold text-primary hover:bg-secondary transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Gerenciar todas as lojas
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 scrollbar-thin">
          {filteredNavItems.map((item, index) => {
            const active = location.pathname === item.path && !item.children;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus.includes(item.path) || isChildActive(item);

            const showSectionHeader = !collapsed && (index === 0 || filteredNavItems[index - 1]?.section !== item.section);

            return (
              <div key={item.path} className="space-y-0.5">
                {showSectionHeader && (
                  <div className="text-[10px] font-bold text-slate-800 dark:text-slate-350 tracking-wider uppercase px-3 pt-3.5 pb-1.5 transition-all duration-300">
                    {item.section}
                  </div>
                )}

                {hasChildren ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.path)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                        "relative overflow-hidden",
                        isChildActive(item)
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-md before:bg-primary"
                          : "text-slate-800 dark:text-slate-200 hover:bg-sidebar-accent hover:text-slate-950 dark:hover:text-white hover:pl-3.5"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", isChildActive(item) ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-slate-400")} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200", isExpanded && "rotate-180")} />
                        </>
                      )}
                    </button>
                    {!collapsed && isExpanded && (
                      <div className="ml-5 mt-1 space-y-0.5 border-l border-sidebar-border/40 pl-3">
                        {item.children!.map((child) => {
                          const childActive = child.path.includes("?")
                            ? location.pathname === child.path.split("?")[0] && location.search === `?${child.path.split("?")[1]}`
                            : location.pathname === child.path;
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={cn(
                                "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-200",
                                "hover:pl-3.5",
                                childActive
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white"
                                  : "text-slate-700 dark:text-slate-350 hover:bg-sidebar-accent hover:text-slate-950 dark:hover:text-white"
                              )}
                            >
                              <child.icon className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110", childActive ? "text-slate-950 dark:text-white" : "text-slate-400 dark:text-slate-500")} />
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      "relative overflow-hidden",
                      active
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-md before:bg-primary"
                        : "text-slate-800 dark:text-slate-200 hover:bg-sidebar-accent hover:text-slate-950 dark:hover:text-white hover:pl-3.5"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", active ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-slate-400")} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-12 items-center justify-center border-t border-sidebar-border text-sidebar-foreground hover:text-primary transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Right section */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-sidebar px-3 overflow-x-auto">
          {/* Hamburger (mobile) */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Busca Inteligente (Ctrl + K)..."
              className="h-9 w-full rounded-lg border border-border bg-secondary/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Role filters */}
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[11px] font-bold tracking-wide transition-all duration-200 whitespace-nowrap shrink-0",
                  activeRole === role
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {role}
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-border shrink-0" />
            <Select value={activePlano} onValueChange={(val: any) => setActivePlano(val)}>
              <SelectTrigger className="h-8 w-[110px] text-[11px] font-bold">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                {planos.map((pl) => (
                  <SelectItem key={pl} value={pl} className="text-[11px] font-bold">
                    {planoLabels[pl]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0">
              <ExternalLink className="h-4 w-4" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0">
                  <Bell className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h4 className="text-sm font-semibold">Notificações</h4>
                  <button className="text-xs text-primary hover:underline" onClick={() => navigate("/financeiro/contas-pagar")}>Ver todas</button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  <div className="px-4 py-8 text-center">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">Nenhuma notificação no momento</p>
                  </div>
                </div>
                <div className="border-t border-border px-4 py-2.5 text-center">
                  <button className="text-xs text-primary hover:underline" onClick={() => navigate("/financeiro/contas-pagar")}>Ver todas as notificações</button>
                </div>
              </PopoverContent>
            </Popover>



            {/* User Menu */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 ml-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 shrink-0 hover:bg-secondary transition-colors cursor-pointer">
                  <div className="text-right">
                    <p className="text-xs font-semibold leading-tight whitespace-nowrap">{activeBranch?.nome || "OFICINA CENTRAL"}</p>
                    <p className="text-[10px] text-primary font-bold">★ {activeRole}</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">
                    {userInitials}
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-0">
                <div className="flex flex-col items-center gap-1 border-b border-border px-4 py-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground">
                    {userInitials}
                  </div>
                  <p className="text-sm font-bold mt-1">{userData.nome || activeBranch?.nome || "Minha Empresa"}</p>
                  <p className="text-xs text-muted-foreground">{userData.email}</p>
                  <button
                    onClick={() => navigate("/config")}
                    className="mt-2 flex items-center gap-2 rounded-md border border-border px-4 py-1.5 text-xs font-medium hover:bg-secondary transition-colors"
                  >
                    <User className="h-3.5 w-3.5" />
                    Meus dados
                  </button>
                </div>

                <div className="px-2 py-2 border-b border-border">
                  <p className="px-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tarefas</p>
                  <button onClick={() => navigate("/os/agenda")} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-secondary transition-colors">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Agenda
                  </button>
                </div>

                <div className="px-2 py-2 border-b border-border">
                  <p className="px-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Conta</p>
                  <button onClick={() => navigate("/meu-plano")} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-secondary transition-colors">
                    <Crown className="h-4 w-4 text-muted-foreground" />
                    Meu plano
                  </button>
                  <button onClick={() => navigate("/financeiro")} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-secondary transition-colors">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    Meu contador
                  </button>
                </div>

                <div className="px-2 py-2 border-b border-border">
                  <p className="px-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ajuda</p>
                  <button onClick={() => navigate("/central-ajuda")} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-secondary transition-colors">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    Central de ajuda
                  </button>
                  <button className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-secondary transition-colors">
                    <Lightbulb className="h-4 w-4 text-muted-foreground" />
                    Portal de ideias
                  </button>
                  <button className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-secondary transition-colors">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                    Atualizações
                  </button>
                </div>

                <div className="px-2 py-2">
                  <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <RoleProvider value={activeRole}>
              <PlanoProvider value={activePlano}>
                {children}
              </PlanoProvider>
            </RoleProvider>
          </div>
        </main>
      </div>

      {/* Chat Widget do Site */}
      {shouldShowChat && <ChatWidget />}

      {/* Branch Switch Confirmation Dialog */}
      <AlertDialog open={!!pendingBranch} onOpenChange={(open) => !open && setPendingBranch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-2">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
            <AlertDialogTitle className="text-center">
              Deseja logar na loja {pendingBranch?.nome}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Ao trocar de loja, os dados exibidos serão da unidade selecionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3">
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBranchSwitch}>Sim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
