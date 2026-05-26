import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Cake, UserCog } from "lucide-react";

const reports = [
  {
    label: "Clientes",
    desc: "Relatório de clientes. Filtro por tipo, situação, nome, telefone, e-mail, cidade, estado, vendedor e período de cadastro.",
    path: "/relatorios/clientes/clientes",
    icon: Users,
    color: "bg-green-600",
  },
  {
    label: "Aniversariantes",
    desc: "Relatório de aniversariantes. Filtro por mês, cidade, estado e situação cadastral.",
    path: "/relatorios/clientes/aniversariantes",
    icon: Cake,
    color: "bg-emerald-800",
  },
  {
    label: "Funcionários",
    desc: "Relatório de funcionários. Filtro por nome, telefone/celular, e-mail, cidade, estado e período de cadastro.",
    path: "/relatorios/clientes/funcionarios",
    icon: UserCog,
    color: "bg-orange-500",
  },
];

export default function RelatoriosCadastros() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Users className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Relatórios de cadastros</h1>
        </div>
        <p className="text-xs text-muted-foreground">Início &gt; Relatórios de cadastros &gt; Listar</p>
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
