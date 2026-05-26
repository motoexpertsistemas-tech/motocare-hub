import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── KPIs for selected month ──
export function useDashboardKPIs(mesSelecionado: string) {
  return useQuery({
    queryKey: ["dashboard_kpis", mesSelecionado],
    queryFn: async () => {
      const [ano, mes] = mesSelecionado.split("-").map(Number);
      const inicioMes = new Date(ano, mes - 1, 1).toISOString();
      const fimMes = new Date(ano, mes, 1).toISOString();

      // Previous month for variation
      const prevDate = subMonths(new Date(ano, mes - 1, 1), 1);
      const inicioPrev = startOfMonth(prevDate).toISOString();
      const fimPrev = endOfMonth(prevDate).toISOString();

      // Current month OS
      const { data: osCurrent } = await supabase
        .from("ordem_servico")
        .select("id, valor_total")
        .in("status", ["concluido", "concretizado"])
        .gte("created_at", inicioMes)
        .lt("created_at", fimMes);

      // Previous month OS
      const { data: osPrev } = await supabase
        .from("ordem_servico")
        .select("id, valor_total")
        .in("status", ["concluido", "concretizado"])
        .gte("created_at", inicioPrev)
        .lte("created_at", fimPrev);

      // Current month items sold
      const { data: itensCurrent } = await supabase
        .from("os_itens")
        .select("quantidade, os_id")
        .gte("created_at", inicioMes)
        .lt("created_at", fimMes);

      // Previous month items
      const { data: itensPrev } = await supabase
        .from("os_itens")
        .select("quantidade")
        .gte("created_at", inicioPrev)
        .lte("created_at", fimPrev);

      const pedidos = osCurrent?.length || 0;
      const pedidosPrev = osPrev?.length || 0;
      const faturamento = osCurrent?.reduce((s, o) => s + (o.valor_total || 0), 0) || 0;
      const faturamentoPrev = osPrev?.reduce((s, o) => s + (o.valor_total || 0), 0) || 0;
      const itensVendidos = itensCurrent?.reduce((s, i) => s + (i.quantidade || 0), 0) || 0;
      const itensPrevTotal = itensPrev?.reduce((s, i) => s + (i.quantidade || 0), 0) || 0;
      const ticketMedio = pedidos > 0 ? faturamento / pedidos : 0;
      const ticketMedioPrev = pedidosPrev > 0 ? faturamentoPrev / pedidosPrev : 0;

      const calcVar = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
      };

      return {
        pedidos,
        faturamento,
        itensVendidos,
        ticketMedio,
        varPedidos: calcVar(pedidos, pedidosPrev),
        varFaturamento: calcVar(faturamento, faturamentoPrev),
        varItens: calcVar(itensVendidos, itensPrevTotal),
        varTicket: calcVar(ticketMedio, ticketMedioPrev),
        faturamentoMesAnteriorLabel: format(prevDate, "MMMM 'de' yyyy", { locale: ptBR }),
      };
    },
  });
}

// ── Balanço Financeiro (last 12 months) ──
export function useBalancoFinanceiro() {
  return useQuery({
    queryKey: ["dashboard_balanco"],
    queryFn: async () => {
      const now = new Date();
      const inicio = startOfMonth(subMonths(now, 11)).toISOString();

      const { data } = await supabase
        .from("movimentacoes_financeiras")
        .select("data_movimentacao, tipo, valor")
        .gte("data_movimentacao", inicio)
        .order("data_movimentacao");

      if (!data || data.length === 0) return [];

      const grouped = new Map<string, { recebimentos: number; pagamentos: number }>();
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, "yyyy-MM");
        const label = format(d, "MMM/yyyy", { locale: ptBR });
        grouped.set(key, { recebimentos: 0, pagamentos: 0 });
      }

      for (const row of data) {
        const key = row.data_movimentacao.substring(0, 7);
        const entry = grouped.get(key);
        if (!entry) continue;
        if (row.tipo === "receita") entry.recebimentos += row.valor || 0;
        else entry.pagamentos += row.valor || 0;
      }

      return Array.from(grouped.entries()).map(([key, val]) => {
        const [y, m] = key.split("-").map(Number);
        const label = format(new Date(y, m - 1, 1), "MMM/yyyy", { locale: ptBR });
        return { mes: label.charAt(0).toUpperCase() + label.slice(1), ...val };
      });
    },
  });
}

// ── Operacional Data (last 12 months) ──
export function useOperacionalData() {
  return useQuery({
    queryKey: ["dashboard_operacional"],
    queryFn: async () => {
      const now = new Date();
      const inicio = startOfMonth(subMonths(now, 11)).toISOString();

      // Compras
      const { data: compras } = await supabase
        .from("pedidos_compra")
        .select("created_at, valor_total, valor_frete")
        .gte("created_at", inicio);

      // Vendas
      const { data: vendas } = await supabase
        .from("ordem_servico")
        .select("created_at, valor_total, valor_frete")
        .in("status", ["concluido", "concretizado"])
        .gte("created_at", inicio);

      // Financeiro
      const { data: financeiro } = await supabase
        .from("movimentacoes_financeiras")
        .select("data_movimentacao, tipo, valor")
        .gte("data_movimentacao", inicio);

      const buildMonthly = () => {
        const map = new Map<string, number>();
        for (let i = 11; i >= 0; i--) {
          const d = subMonths(now, i);
          map.set(format(d, "yyyy-MM"), 0);
        }
        return map;
      };

      const toChartData = (map: Map<string, number>) =>
        Array.from(map.entries()).map(([key, valor]) => {
          const [y, m] = key.split("-").map(Number);
          const label = format(new Date(y, m - 1, 1), "MMM/yyyy", { locale: ptBR });
          return { mes: label.charAt(0).toUpperCase() + label.slice(1), valor };
        });

      // Compras
      const comprasMap = buildMonthly();
      let comprasQtd = 0, comprasFrete = 0, comprasTotal = 0;
      for (const c of compras || []) {
        const key = (c.created_at || "").substring(0, 7);
        if (comprasMap.has(key)) comprasMap.set(key, (comprasMap.get(key) || 0) + (c.valor_total || 0));
        comprasQtd++;
        comprasFrete += c.valor_frete || 0;
        comprasTotal += c.valor_total || 0;
      }

      // Vendas
      const vendasMap = buildMonthly();
      let vendasQtd = 0, vendasFrete = 0, vendasTotal = 0;
      for (const v of vendas || []) {
        const key = (v.created_at || "").substring(0, 7);
        if (vendasMap.has(key)) vendasMap.set(key, (vendasMap.get(key) || 0) + (v.valor_total || 0));
        vendasQtd++;
        vendasFrete += v.valor_frete || 0;
        vendasTotal += v.valor_total || 0;
      }

      // Recebimentos / Pagamentos
      const recMap = buildMonthly();
      const pagMap = buildMonthly();
      let recQtd = 0, recTotal = 0, pagQtd = 0, pagTotal = 0;
      for (const f of financeiro || []) {
        const key = (f.data_movimentacao || "").substring(0, 7);
        if (f.tipo === "receita") {
          if (recMap.has(key)) recMap.set(key, (recMap.get(key) || 0) + (f.valor || 0));
          recQtd++;
          recTotal += f.valor || 0;
        } else {
          if (pagMap.has(key)) pagMap.set(key, (pagMap.get(key) || 0) + (f.valor || 0));
          pagQtd++;
          pagTotal += f.valor || 0;
        }
      }

      return {
        compras: { data: toChartData(comprasMap), qtd: comprasQtd, frete: comprasFrete, total: comprasTotal },
        vendas: { data: toChartData(vendasMap), qtd: vendasQtd, frete: vendasFrete, total: vendasTotal },
        recebimentos: { data: toChartData(recMap), qtd: recQtd, frete: 0, total: recTotal },
        pagamentos: { data: toChartData(pagMap), qtd: pagQtd, frete: 0, total: pagTotal },
      };
    },
  });
}

// ── Top Produtos Vendidos (selected month) ──
export function useTopProdutos(mesSelecionado: string) {
  return useQuery({
    queryKey: ["dashboard_top_produtos", mesSelecionado],
    queryFn: async () => {
      const [ano, mes] = mesSelecionado.split("-").map(Number);
      const inicioMes = new Date(ano, mes - 1, 1).toISOString();
      const fimMes = new Date(ano, mes, 1).toISOString();

      const { data } = await supabase
        .from("os_itens")
        .select("descricao, codigo, quantidade, subtotal")
        .eq("tipo", "produto")
        .gte("created_at", inicioMes)
        .lt("created_at", fimMes);

      if (!data || data.length === 0) return [];

      const map = new Map<string, { nome: string; codigo: string; qtd: number; valor: number }>();
      for (const item of data) {
        const key = item.descricao || "Sem nome";
        const entry = map.get(key) || { nome: key, codigo: item.codigo || "", qtd: 0, valor: 0 };
        entry.qtd += item.quantidade || 0;
        entry.valor += item.subtotal || 0;
        map.set(key, entry);
      }

      return Array.from(map.values())
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, 10);
    },
  });
}

// ── Top Serviços Vendidos (selected month) ──
export function useTopServicos(mesSelecionado: string) {
  return useQuery({
    queryKey: ["dashboard_top_servicos", mesSelecionado],
    queryFn: async () => {
      const [ano, mes] = mesSelecionado.split("-").map(Number);
      const inicioMes = new Date(ano, mes - 1, 1).toISOString();
      const fimMes = new Date(ano, mes, 1).toISOString();

      const { data } = await supabase
        .from("os_itens")
        .select("descricao, codigo, quantidade, subtotal")
        .eq("tipo", "servico")
        .gte("created_at", inicioMes)
        .lt("created_at", fimMes);

      if (!data || data.length === 0) return [];

      const map = new Map<string, { nome: string; codigo: string; qtd: number; valor: number }>();
      for (const item of data) {
        const key = item.descricao || "Sem nome";
        const entry = map.get(key) || { nome: key, codigo: item.codigo || "", qtd: 0, valor: 0 };
        entry.qtd += item.quantidade || 0;
        entry.valor += item.subtotal || 0;
        map.set(key, entry);
      }

      return Array.from(map.values())
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, 10);
    },
  });
}

// ── Recent OS ──
export function useRecentOS() {
  return useQuery({
    queryKey: ["dashboard_recent_os"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ordem_servico")
        .select("numero_os, placa, veiculo_modelo, status, tecnico_responsavel, valor_total")
        .order("created_at", { ascending: false })
        .limit(5);

      return (data || []).map((os) => ({
        id: os.numero_os,
        placa: os.placa || "—",
        modelo: os.veiculo_modelo || "—",
        status: os.status || "—",
        mecanico: os.tecnico_responsavel || "—",
        valor: `R$ ${(os.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      }));
    },
  });
}

// ── Low Stock ──
export function useLowStock() {
  return useQuery({
    queryKey: ["dashboard_low_stock"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos_catalogo")
        .select("nome, estoque_quantidade, estoque_minimo")
        .not("estoque_minimo", "is", null)
        .gt("estoque_minimo", 0)
        .order("estoque_quantidade", { ascending: true })
        .limit(20);

      return (data || [])
        .filter((p) => (p.estoque_quantidade || 0) < (p.estoque_minimo || 0))
        .slice(0, 10)
        .map((p) => ({
          nome: p.nome,
          qtd: p.estoque_quantidade || 0,
          min: p.estoque_minimo || 0,
        }));
    },
  });
}
