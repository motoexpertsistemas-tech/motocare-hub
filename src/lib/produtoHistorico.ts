import { supabase } from "@/integrations/supabase/client";

/**
 * Histórico de alterações em produtos (preço e localização).
 * Persistido em `log_auditoria` com `acao = historico_preco | historico_localizacao`,
 * `entidade = produtos_catalogo`, `entidade_id = productId`, dados em `detalhes` JSONB.
 */

export type TipoPreco = "custo" | "venda";

interface UsuarioInfo {
  id: string | null;
  nome: string;
  email: string | null;
}

let _cachedUser: UsuarioInfo | null = null;

async function getUsuarioAtual(): Promise<UsuarioInfo> {
  if (_cachedUser) return _cachedUser;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    _cachedUser = { id: null, nome: "Sistema", email: null };
    return _cachedUser;
  }
  const { data } = await supabase
    .from("usuarios")
    .select("id, nome_completo, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  _cachedUser = {
    id: data?.id ?? null,
    nome: data?.nome_completo || user.email || "Usuário",
    email: data?.email || user.email || null,
  };
  return _cachedUser;
}

export interface HistoricoPrecoEntry {
  produtoId: string;
  produtoNome?: string;
  tipo: TipoPreco;
  tabelaPreco?: string | null;
  valorAnterior: number | null;
  valorNovo: number | null;
  motivo?: string | null;
}

export async function registrarHistoricoPreco(entry: HistoricoPrecoEntry) {
  return registrarHistoricoPrecoLote([entry]);
}

export async function registrarHistoricoPrecoLote(entries: HistoricoPrecoEntry[]) {
  if (!entries.length) return;
  const u = await getUsuarioAtual();
  const rows = entries.map((e) => ({
    acao: "historico_preco",
    entidade: "produtos_catalogo",
    entidade_id: e.produtoId,
    detalhes: {
      produto_nome: e.produtoNome ?? null,
      tipo: e.tipo,
      tabela_preco: e.tabelaPreco ?? null,
      valor_anterior: e.valorAnterior,
      valor_novo: e.valorNovo,
      motivo: (e.motivo || "").trim() || null,
      usuario_id: u.id,
      usuario_nome: u.nome,
      usuario_email: u.email,
    },
  }));
  await supabase.from("log_auditoria" as any).insert(rows as any);
}

export interface HistoricoLocalizacaoEntry {
  produtoId: string;
  produtoNome?: string;
  localizacaoAnterior: string | null;
  localizacaoNova: string | null;
  motivo?: string | null;
}

export async function registrarHistoricoLocalizacao(entry: HistoricoLocalizacaoEntry) {
  const u = await getUsuarioAtual();
  await supabase.from("log_auditoria" as any).insert({
    acao: "historico_localizacao",
    entidade: "produtos_catalogo",
    entidade_id: entry.produtoId,
    detalhes: {
      produto_nome: entry.produtoNome ?? null,
      localizacao_anterior: entry.localizacaoAnterior,
      localizacao_nova: entry.localizacaoNova,
      motivo: (entry.motivo || "").trim() || null,
      usuario_id: u.id,
      usuario_nome: u.nome,
      usuario_email: u.email,
    },
  } as any);
}
