import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const STATUS_OPTIONS = [
  { value: "revisao", label: "Revisão" },
  { value: "atendimento", label: "Atendimento" },
  { value: "em_execucao", label: "Em Execução" },
  { value: "aguardando", label: "Aguardando Peças" },
  { value: "aguardando_pagamento", label: "Aguardando Pagamento" },
  { value: "concretizada", label: "Concretizada" },
  { value: "agendamento", label: "Agendamento" },
  { value: "agendada", label: "Agendada" },
  { value: "pronta", label: "Pronta" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelada", label: "Cancelada" },
  { value: "expresso", label: "Expresso" },
];

export const CANAL_OPTIONS = [
  { value: "balcao", label: "Balcão" },
  { value: "atacado", label: "Atacado" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "os", label: "Ordem de Serviço" },
  { value: "marketplaces", label: "Marketplaces" },
];

export function useFuncionariosRelatorio() {
  return useQuery({
    queryKey: ["funcionarios_relatorio_vendas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useFormasPagamentoRelatorio() {
  return useQuery({
    queryKey: ["formas_pagamento_relatorio_vendas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formas_pagamento")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useClientesRelatorio() {
  return useQuery({
    queryKey: ["clientes_relatorio_vendas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome_completo, nome_fantasia, telefone")
        .eq("ativo", true)
        .order("nome_completo");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useServicosRelatorio() {
  return useQuery({
    queryKey: ["servicos_relatorio_vendas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSituacoesOSRelatorio() {
  return useQuery({
    queryKey: ["situacoes_os_relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("situacoes_os")
        .select("id, nome, cor")
        .order("ordem");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCategoriasClienteRelatorio() {
  return useQuery({
    queryKey: ["categorias_cliente_relatorio"],
    queryFn: async () => {
      const [vv, cl] = await Promise.all([
        supabase.from("valores_venda" as any).select("nome").order("nome"),
        supabase.from("clientes").select("categoria_cliente").not("categoria_cliente", "is", null).neq("categoria_cliente", ""),
      ]);
      const fromVV = ((vv.data as any[]) || []).map((v: any) => (v.nome as string).toUpperCase());
      const fromCL = (cl.data || []).map((c: any) => (c.categoria_cliente as string).toUpperCase()).filter(Boolean);
      const unique = [...new Set([...fromVV, ...fromCL])].sort();
      return unique;
    },
  });
}

export function getDefaultDates() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { firstDay, lastDay };
}
