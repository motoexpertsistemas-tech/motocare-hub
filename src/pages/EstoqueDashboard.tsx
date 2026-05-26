import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeftRight,
  SlidersHorizontal,
  FileText,
  ShoppingBag,
  RefreshCw,
  ClipboardList,
  Mail,
  Settings,
  Warehouse,
} from "lucide-react";

const links = [
  { label: "Movimentações", desc: "Entradas, saídas e histórico de movimentação", path: "/estoque/movimentacoes", icon: ArrowLeftRight },
  { label: "Ajustes", desc: "Correções e inventários parciais de estoque", path: "/estoque/ajustes", icon: SlidersHorizontal },
  { label: "Transferências", desc: "Transfira entre filiais e depósitos", path: "/estoque/transferencias", icon: ArrowLeftRight },
  { label: "Cotações", desc: "Solicite e compare preços de fornecedores", path: "/estoque/cotacoes", icon: FileText },
  { label: "Compras", desc: "Pedidos de compra e recebimento", path: "/estoque/compras", icon: ShoppingBag },
  { label: "Trocas e devoluções", desc: "Registre trocas e devoluções com rastreio", path: "/estoque/trocas", icon: RefreshCw },
  { label: "Situações de compras", desc: "Status: Pendente, Aprovado, Recebido", path: "/estoque/situacoes-compras", icon: ClipboardList },
  { label: "Modelo de e-mail", desc: "Templates para cotações e pedidos", path: "/estoque/modelo-email", icon: Mail },
  { label: "Configurações", desc: "Parâmetros e regras do estoque", path: "/estoque/configuracoes", icon: Settings },
];

export default function EstoqueDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Warehouse className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
        </div>
        <p className="text-sm text-muted-foreground">Controle movimentações, compras, ajustes e configurações do estoque</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <Link key={item.path} to={item.path}>
            <Card className="glass-panel hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer group h-full">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
