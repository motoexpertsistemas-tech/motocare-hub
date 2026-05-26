import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePlanoContasOptions() {
  return useQuery({
    queryKey: ["plano_contas_relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plano_contas")
        .select("id, classificacao, nome, nivel")
        .eq("ativo", true)
        .order("classificacao");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useContasBancariasOptions() {
  return useQuery({
    queryKey: ["contas_bancarias_relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_bancarias")
        .select("id, nome, banco")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useFormasPagamentoOptions() {
  return useQuery({
    queryKey: ["formas_pagamento_relatorio"],
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

export function useFuncionariosOptions() {
  return useQuery({
    queryKey: ["funcionarios_relatorio"],
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

export const SITUACOES_FINANCEIRO = [
  { value: "todas", label: "Todas" },
  { value: "pago", label: "Pago" },
  { value: "pendente", label: "Pendente" },
  { value: "atrasado", label: "Atrasado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "parcial", label: "Parcialmente pago" },
];
