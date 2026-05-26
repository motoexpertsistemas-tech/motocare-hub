import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  ClipboardList,
  DollarSign,
  Tag,
  Layers,
  Ruler,
  Grid3X3,
  ListPlus,
  Package,
} from "lucide-react";

const links = [
  { label: "Gerenciar produtos", desc: "Cadastro, edição e consulta de produtos", path: "/estoque", icon: ClipboardList },
  { label: "Valores de venda", desc: "Tabelas de preço e margens de lucro", path: "/estoque/valores-venda", icon: DollarSign },
  { label: "Etiquetas", desc: "Impressão de etiquetas com código de barras", path: "/estoque/etiquetas", icon: Tag },
  { label: "Grupos de produtos", desc: "Categorias e hierarquias do catálogo", path: "/estoque/grupos", icon: Layers },
  { label: "Unidades de produtos", desc: "UN, CX, KG, MT, PC, JG, KIT", path: "/estoque/unidades", icon: Ruler },
  { label: "Grades / Variações", desc: "Tamanho, cor, modelo e variantes", path: "/estoque/grades", icon: Grid3X3 },
  { label: "Campos extras", desc: "Campos personalizados para produtos", path: "/estoque/campos-extras", icon: ListPlus },
];

export default function ProdutosDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Package className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
        </div>
        <p className="text-sm text-muted-foreground">Gerencie o catálogo, preços, categorias e atributos dos seus produtos</p>
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
