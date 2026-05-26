import { useNavigate } from "react-router-dom";
import { FileText, ShoppingCart, Package, RotateCcw, Users, DollarSign, BarChart3, ArrowRight } from "lucide-react";

const relatorios = [
  { titulo: "Relatório de orçamentos", descricao: "Filtro por loja, tipo, período, cliente, vendedor e situação.", cor: "from-blue-600 to-blue-700", icon: FileText, path: "/relatorios/vendas/orcamentos" },
  { titulo: "Relatório de vendas", descricao: "Filtro por loja, tipo, período, cliente, vendedor e situação.", cor: "from-indigo-600 to-indigo-700", icon: ShoppingCart, path: "/relatorios/vendas/vendas" },
  { titulo: "Produtos vendidos", descricao: "Filtro por loja, cliente, produto, tipo, período, grupo, vendedor e situação.", cor: "from-slate-700 to-slate-800", icon: Package, path: "/relatorios/vendas/produtos-vendidos" },
  { titulo: "Relatório de devoluções", descricao: "Filtro por loja, venda, período, cliente, e valor.", cor: "from-green-600 to-green-700", icon: RotateCcw, path: "/relatorios/vendas/devolucoes" },
  { titulo: "Produtos devolvidos", descricao: "Filtro por loja, cliente, grupo, produto e período.", cor: "from-purple-600 to-purple-700", icon: Package, path: "/relatorios/vendas/produtos-devolvidos" },
  { titulo: "Serviços prestados", descricao: "Filtro por loja, cliente, serviço, tipo, período, vendedor e situação.", cor: "from-orange-500 to-orange-600", icon: FileText, path: "/relatorios/vendas/servicos-prestados" },
  { titulo: "Clientes que mais compram", descricao: "Filtro por loja, tipo, período, cliente, vendedor e situação.", cor: "from-emerald-600 to-emerald-700", icon: Users, path: "/relatorios/vendas/clientes-mais-compram" },
  { titulo: "Comissão por venda", descricao: "Relatório de comissão de vendedores por venda. Filtro por loja, vendedor, período e situação.", cor: "from-violet-600 to-violet-700", icon: DollarSign, path: "/relatorios/vendas/comissao-venda" },
  { titulo: "Comissão por produto", descricao: "Relatório de comissão de vendedores por produto. Filtro por loja, vendedor, período e situação.", cor: "from-orange-600 to-orange-700", icon: DollarSign, path: "/relatorios/vendas/comissao-produto" },
  { titulo: "Comissão por serviço", descricao: "Relatório de comissão de vendedores por serviço. Filtro por loja, vendedor, período e situação.", cor: "from-slate-600 to-slate-700", icon: DollarSign, path: "/relatorios/vendas/comissao-servico" },
  { titulo: "Curva ABC de produtos", descricao: "Relatório de curva ABC de produtos. Filtro por loja, período, tipo, situação, canal e classe ABC.", cor: "from-cyan-600 to-cyan-700", icon: BarChart3, path: "/relatorios/vendas/curva-abc?tipo=produtos" },
  { titulo: "Curva ABC de clientes", descricao: "Relatório de curva ABC de clientes. Filtro por loja, período, clientes, vendedor, situação e classe ABC.", cor: "from-sky-500 to-sky-600", icon: BarChart3, path: "/relatorios/vendas/curva-abc?tipo=clientes" },
];

export default function RelatoriosVendas() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios de vendas</h1>
        <p className="text-sm text-muted-foreground">Selecione o relatório desejado</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relatorios.map((r) => (
          <button
            key={r.titulo}
            onClick={() => "path" in r && r.path && navigate(r.path)}
            className={`group relative flex flex-col justify-between rounded-xl bg-gradient-to-br ${r.cor} p-5 text-left text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg min-h-[140px]`}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <r.icon className="h-5 w-5 opacity-80" />
                <h3 className="text-base font-bold leading-tight">{r.titulo}</h3>
              </div>
              <p className="text-xs leading-relaxed opacity-80">{r.descricao}</p>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs font-medium opacity-70 group-hover:opacity-100 transition-opacity">
              Clique aqui <ArrowRight className="h-3 w-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
