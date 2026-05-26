import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Package, FileText, ClipboardList, ArrowLeftRight, ShoppingBag, Wrench } from "lucide-react";

const reports = [
  { label: "Cotações", desc: "Relatório de cotações. Filtro por loja, tipo, período, fornecedor, funcionário e situação.", path: "/relatorios/estoque/cotacoes", icon: FileText, color: "bg-amber-500" },
  { label: "Compras", desc: "Relatório de compras. Filtro por loja, tipo, período, fornecedor, funcionário e situação.", path: "/relatorios/estoque/compras", icon: ShoppingBag, color: "bg-blue-600" },
  { label: "Inventário", desc: "Inventário de estoque. Filtro por loja, tipo, grupo, fornecedor e situação.", path: "/relatorios/estoque/inventario", icon: ClipboardList, color: "bg-cyan-500" },
  { label: "Estoque", desc: "Relatório de estoque. Filtro por loja, tipo, grupo, fornecedor e situação.", path: "/relatorios/estoque/estoque", icon: ArrowLeftRight, color: "bg-green-600" },
  { label: "Produtos comprados", desc: "Filtro por loja, fornecedor, produto, tipo, período, grupo e situação.", path: "/relatorios/estoque/produtos-comprados", icon: Package, color: "bg-indigo-600" },
  
];

export default function RelatoriosEstoque() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Package className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Relatórios de estoque</h1>
        </div>
        <p className="text-xs text-muted-foreground">Início &gt; Relatórios de estoque &gt; Listar</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((item) => (
          <Link key={item.path} to={item.path}>
            <Card className={`${item.color} text-white hover:opacity-90 transition-opacity cursor-pointer h-full border-0`}>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-3">
                  <item.icon className="h-8 w-8 opacity-80" />
                  <h3 className="text-lg font-bold">{item.label}</h3>
                </div>
                <p className="text-sm opacity-90">{item.desc}</p>
                <p className="text-xs font-medium opacity-80">Clique aqui ➜</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
