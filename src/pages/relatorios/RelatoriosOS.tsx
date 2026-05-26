import { useNavigate } from "react-router-dom";
import { Wrench, Monitor, Clock, Percent, UserCog, ArrowRight } from "lucide-react";

const relatorios = [
  { titulo: "Ordens de serviços", descricao: "Filtro por loja, tipo, período, cliente, vendedor e situação.", cor: "from-purple-600 to-purple-700", icon: Wrench, path: "/relatorios/os/ordens" },
  { titulo: "Equipamentos", descricao: "Filtro por loja, tipo, período, cliente, vendedor e situação.", cor: "from-cyan-600 to-cyan-700", icon: Monitor, path: "/relatorios/os/equipamentos" },
  { titulo: "Situação X Tempo", descricao: "Filtro por loja, tipo, período, cliente, vendedor e situação.", cor: "from-orange-500 to-orange-600", icon: Clock, path: "/relatorios/os/situacao-tempo" },
  { titulo: "Comissão de vendedores", descricao: "Relatório de comissão de vendedores. Filtro por loja, vendedor, período e situação.", cor: "from-green-600 to-green-700", icon: Percent, path: "/relatorios/os/comissao-vendedores" },
  { titulo: "Comissão de técnicos", descricao: "Relatório de comissão de técnicos. Filtro por loja, técnico, período e situação.", cor: "from-blue-600 to-blue-700", icon: UserCog, path: "/relatorios/os/comissao-tecnicos" },
];

export default function RelatoriosOS() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios de ordens de serviços</h1>
        <p className="text-sm text-muted-foreground">Selecione o relatório desejado</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relatorios.map((r) => (
          <button
            key={r.titulo}
            onClick={() => navigate(r.path)}
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
