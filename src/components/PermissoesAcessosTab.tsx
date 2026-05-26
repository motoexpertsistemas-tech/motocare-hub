import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface PermissoesData {
  [category: string]: {
    [permission: string]: boolean;
  };
}

const PERMISSOES_CONFIG: { category: string; icon: string; permissions: string[]; subcategories?: { label: string; permissions: string[] }[] }[] = [
  {
    category: "Dashboard / Gerência",
    icon: "📊",
    permissions: [
      "Visualizar Dashboard", "Indicadores", "DRE", "Resultados",
      "Estatísticas", "Desempenho", "Avaliações", "Exportar Excel",
    ],
  },
  {
    category: "Ordens de Serviço",
    icon: "🔧",
    permissions: [
      "Pesquisar", "Visualizar", "Criar", "Editar", "Inativar", "Excluir",
      "Editar Comissão", "Editar Faturada",
      "Visualizar Finanças", "Visualizar Totais",
      "Resumo", "Agenda",
      "Visualizar Agendamentos", "Criar Agendamentos", "Editar Agendamentos", "Excluir Agendamentos",
      "Comissão gerência e orçamentista", "Exportar Excel",
      "Bloquear alteração de preços", "Esconder preços de custo",
      "Editar OS sem andamento", "Inserir apenas peças do estoque",
      "Bloquear etapas preenchidas", "Bloquear data das etapas",
    ],
    subcategories: [
      {
        label: "Abas dentro da OS",
        permissions: [
          "Visualizar Pagamentos", "Editar Pagamentos",
          "Visualizar Nota Fiscal", "Editar Nota Fiscal",
          "Visualizar Fotos/Vídeos", "Editar Fotos/Vídeos",
          "Visualizar Avaliações", "Editar Avaliações",
          "Bloquear aprovação de mãos de obra",
        ],
      },
      {
        label: "Situações da OS",
        permissions: [
          "Visualizar Situações", "Criar Situações", "Editar Situações", "Excluir Situações",
        ],
      },
    ],
  },
  {
    category: "Serviços / Mão de Obra",
    icon: "⚙️",
    permissions: [
      "Pesquisar", "Visualizar", "Criar", "Editar", "Excluir",
      "Tabela de Preços", "Custo Homem/Hora",
      "Exportar Excel",
    ],
  },
  {
    category: "Vendas",
    icon: "💰",
    permissions: [
      "Pesquisar", "Visualizar", "Criar", "Editar", "Inativar", "Excluir",
      "Editar Comissão", "Editar Faturada", "Resumo",
      "Visualizar Finanças", "Visualizar Totais", "Esconder preços de custo",
      "Histórico", "Exportar Excel",
      "Visualizar Nota Fiscal", "Editar Nota Fiscal",
    ],
    subcategories: [
      {
        label: "PDV / Balcão",
        permissions: [
          "Acesso PDV Balcão", "Acesso PDV Atacado", "Pesquisa de Preços",
          "Abrir Caixa", "Fechar Caixa",
        ],
      },
    ],
  },
  {
    category: "Clientes",
    icon: "👥",
    permissions: [
      "Pesquisar", "Visualizar", "Criar", "Editar", "Inativar", "Excluir",
      "Importar Clientes",
      "Visualizar Totais", "Resumo", "Relacionamento",
      "Categorias de Clientes",
      "Exportar Excel",
    ],
    subcategories: [
      {
        label: "Promoções",
        permissions: [
          "Criar Promoção", "Editar Promoção", "Excluir Promoção", "Enviar Promoção",
        ],
      },
    ],
  },
  {
    category: "Estoque",
    icon: "📦",
    permissions: [
      "Pesquisar", "Visualizar", "Criar", "Editar", "Inativar", "Excluir",
      "Visualizar Totais", "Resumo",
      "Movimentações", "Ajustes de Estoque", "Transferências",
      "Importação", "Importação - Remover itens do XML",
      "Alteração em massa", "Valores de Venda", "Etiquetas",
      "Bloquear alteração valores", "Transferir peça",
      "Exportar Excel",
    ],
    subcategories: [
      {
        label: "Grupos e Unidades",
        permissions: [
          "Visualizar Grupos", "Criar Grupos", "Editar Grupos", "Excluir Grupos",
          "Visualizar Unidades", "Criar Unidades", "Editar Unidades",
          "Grades e Variações", "Campos Extras",
        ],
      },
      {
        label: "Compras de Peças",
        permissions: ["Visualizar Compras", "Adicionar Compras", "Editar Compras", "Excluir Compras"],
      },
      {
        label: "Cotações",
        permissions: ["Visualizar Cotações", "Criar Cotações", "Editar Cotações", "Excluir Cotações"],
      },
      {
        label: "Trocas e Devoluções",
        permissions: ["Visualizar Trocas", "Criar Trocas", "Editar Trocas"],
      },
    ],
  },
  {
    category: "Fornecedores",
    icon: "🏭",
    permissions: [
      "Pesquisar", "Visualizar", "Criar", "Editar", "Inativar", "Excluir",
      "Visualizar Totais", "Resumo", "Exportar Excel",
    ],
  },
  {
    category: "RH / Funcionários",
    icon: "👔",
    permissions: [
      "Pesquisar", "Visualizar", "Criar", "Editar", "Inativar", "Excluir",
      "Editar Acessos e Permissões", "Visualizar Totais", "Resumo",
      "Transportadoras",
      "Exportar Excel",
    ],
  },
  {
    category: "Financeiro",
    icon: "💲",
    permissions: [
      "Visão Geral", "Movimentações",
      "Visualizar", "Criar", "Editar", "Inativar", "Excluir",
      "Exportar Excel",
    ],
    subcategories: [
      {
        label: "Contas a Pagar/Receber",
        permissions: [
          "Visualizar Contas a Pagar", "Criar Contas a Pagar", "Editar Contas a Pagar", "Excluir Contas a Pagar",
          "Visualizar Contas a Receber", "Criar Contas a Receber", "Editar Contas a Receber", "Excluir Contas a Receber",
        ],
      },
      {
        label: "Caixas e Contas Bancárias",
        permissions: [
          "Abrir/Fechar Caixa", "Visualizar Caixas",
          "Criar Contas Bancárias", "Visualizar Contas Bancárias", "Editar Contas Bancárias", "Excluir Contas Bancárias",
          "Conciliação Bancária", "Transferências entre Contas",
        ],
      },
      {
        label: "Plano de Contas e Formas Pgto",
        permissions: [
          "Visualizar Plano Contas", "Editar Plano Contas",
          "Criar Forma de Pagamento", "Visualizar Forma Pagamento", "Editar Forma de Pagamento", "Excluir Forma de Pagamento",
        ],
      },
      {
        label: "Boletos e Comissões",
        permissions: [
          "Boletos Bancários", "Comissões", "Fluxo de Caixa",
        ],
      },
    ],
  },
  {
    category: "Fiscal",
    icon: "📄",
    permissions: [
      "Pesquisar", "Visualizar", "Configurações",
      "Emitir NF-e", "Emitir NFC-e / Cupom", "Emitir NFS-e",
      "Inutilizar NF-e", "NF-e Devolução", "NF-e Ajuste",
      "Resumo", "Exportar Excel",
    ],
  },
  {
    category: "E-commerce",
    icon: "🛒",
    permissions: [
      "Acesso ao Módulo", "Configurações",
      "Visualizar Vitrine", "Editar Vitrine",
      "Gerenciar Produtos Vitrine",
      "Exportar Excel",
    ],
  },
  {
    category: "Marketplaces",
    icon: "🌐",
    permissions: [
      "Acesso ao Módulo", "Configurações",
      "Sincronizar Produtos", "Visualizar Pedidos",
    ],
  },
  {
    category: "Relatórios",
    icon: "📈",
    permissions: [
      "DRE Gerencial",
      "Relatórios de Vendas", "Relatórios de Estoque",
      "Relatórios Financeiros", "Relatórios de OS",
      "Exportar Excel", "Exportar PDF",
    ],
  },
  {
    category: "Fidelidade / CRM",
    icon: "🎯",
    permissions: [
      "Acesso ao Módulo", "Visualizar Pontos", "Gerenciar Programa",
    ],
  },
  {
    category: "Configurações Gerais",
    icon: "🔒",
    permissions: [
      "Visualizar Configurações", "Editar Configurações",
      "Visualizar Mensagens", "Editar Mensagens",
      "Visualizar Checklist", "Editar Checklist",
      "Visualizar Etapas", "Editar Etapas",
      "Gerenciar Arquivos",
      "Auditoria / Logs",
      "LGPD / Privacidade",
    ],
  },
  {
    category: "App Quiosque",
    icon: "📱",
    permissions: [
      "Acesso ao Quiosque",
      "Informações", "Editar Informações",
      "Finanças", "Editar Finanças",
      "Avaliações", "Pagamentos", "Saques", "Realizar Saques",
    ],
  },
];

export function getDefaultPermissoes(): PermissoesData {
  const result: PermissoesData = {};
  PERMISSOES_CONFIG.forEach((cat) => {
    const key = cat.category;
    result[key] = {};
    cat.permissions.forEach((p) => { result[key][p] = false; });
    cat.subcategories?.forEach((sub) => {
      sub.permissions.forEach((p) => { result[key][`${sub.label}::${p}`] = false; });
    });
  });
  return result;
}

interface Props {
  permissoes: PermissoesData;
  onChange: (permissoes: PermissoesData) => void;
}

export default function PermissoesAcessosTab({ permissoes, onChange }: Props) {
  const toggle = (category: string, permission: string) => {
    const updated = { ...permissoes };
    if (!updated[category]) updated[category] = {};
    updated[category] = { ...updated[category], [permission]: !updated[category][permission] };
    onChange(updated);
  };

  const toggleCategory = (category: string, allPerms: string[]) => {
    const updated = { ...permissoes };
    if (!updated[category]) updated[category] = {};
    const allChecked = allPerms.every((p) => updated[category]?.[p]);
    const newVal = !allChecked;
    updated[category] = { ...updated[category] };
    allPerms.forEach((p) => { updated[category][p] = newVal; });
    onChange(updated);
  };

  const allPermissions: { category: string; perms: string[] }[] = PERMISSOES_CONFIG.map((cat) => ({
    category: cat.category,
    perms: [
      ...cat.permissions,
      ...(cat.subcategories?.flatMap((s) => s.permissions.map((p) => `${s.label}::${p}`)) || []),
    ],
  }));

  const totalPerms = allPermissions.reduce((sum, c) => sum + c.perms.length, 0);
  const totalChecked = allPermissions.reduce(
    (sum, c) => sum + c.perms.filter((p) => permissoes[c.category]?.[p]).length,
    0
  );
  const allSelected = totalChecked === totalPerms;

  const toggleAll = () => {
    const updated = { ...permissoes };
    const newVal = !allSelected;
    allPermissions.forEach(({ category, perms }) => {
      updated[category] = { ...(updated[category] || {}) };
      perms.forEach((p) => { updated[category][p] = newVal; });
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-muted-foreground">
          Permissões e acessos <span className="text-xs font-normal">deste usuário</span>
        </h3>
        <button
          type="button"
          onClick={toggleAll}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {allSelected ? "Desmarcar Todos" : "Selecionar Todos"}
          <span className="text-xs opacity-80">({totalChecked}/{totalPerms})</span>
        </button>
      </div>

      {PERMISSOES_CONFIG.map((cat) => {
        const allPerms: string[] = [
          ...cat.permissions,
          ...(cat.subcategories?.flatMap((s) => s.permissions.map((p) => `${s.label}::${p}`)) || []),
        ];
        const catPerms = permissoes[cat.category] || {};
        const allChecked = allPerms.every((p) => catPerms[p]);

        return (
          <div key={cat.category} className="border border-border rounded-lg">
            {/* Category header */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-t-lg border-b border-border">
              <Checkbox
                checked={allChecked}
                onCheckedChange={() => toggleCategory(cat.category, allPerms)}
              />
              <span className="text-sm">{cat.icon}</span>
              <span className="font-semibold text-sm">{cat.category}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {allPerms.filter((p) => catPerms[p]).length}/{allPerms.length}
              </span>
            </div>

            {/* Main permissions */}
            <div className="p-3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                {cat.permissions.map((perm) => (
                  <div key={perm} className="flex items-center gap-2">
                    <Checkbox
                      checked={!!catPerms[perm]}
                      onCheckedChange={() => toggle(cat.category, perm)}
                    />
                    <Label className="font-normal text-xs cursor-pointer">{perm}</Label>
                  </div>
                ))}
              </div>

              {/* Subcategories */}
              {cat.subcategories?.map((sub) => (
                <div key={sub.label} className="mt-4 pt-3 border-t border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">📁 {sub.label}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                    {sub.permissions.map((perm) => {
                      const key = `${sub.label}::${perm}`;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <Checkbox
                            checked={!!catPerms[key]}
                            onCheckedChange={() => toggle(cat.category, key)}
                          />
                          <Label className="font-normal text-xs cursor-pointer">{perm}</Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
