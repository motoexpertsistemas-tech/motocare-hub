import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, History, ArrowRight, MapPin, Tag, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/contexts/RoleContext";

interface Props {
  productId: string;
}

const fmtBRL = (v: any) =>
  v == null ? "—" : `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

export function ProductHistoryWidget({ productId }: Props) {
  const role = useRole();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"preco" | "loc">("preco");

  const isAdmin = role === "ADMIN";

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ["produto-historico", productId],
    enabled: isAdmin && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("log_auditoria" as any)
        .select("*")
        .eq("entidade", "produtos_catalogo")
        .eq("entidade_id", productId)
        .in("acao", ["historico_preco", "historico_localizacao"])
        .order("criado_em", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  if (!isAdmin) return null;

  const precos = registros.filter((r) => r.acao === "historico_preco");
  const locs = registros.filter((r) => r.acao === "historico_localizacao");

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-secondary/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-foreground">
          <History className="h-3.5 w-3.5 text-primary" />
          Histórico de Alterações
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-500/40 text-amber-500">ADMIN</Badge>
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-3 space-y-3 border-t border-border">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={tab === "preco" ? "default" : "outline"}
              onClick={() => setTab("preco")}
              className="h-7 text-xs gap-1.5 flex-1"
            >
              <Tag className="h-3 w-3" /> Preços ({precos.length})
            </Button>
            <Button
              size="sm"
              variant={tab === "loc" ? "default" : "outline"}
              onClick={() => setTab("loc")}
              className="h-7 text-xs gap-1.5 flex-1"
            >
              <MapPin className="h-3 w-3" /> Localização ({locs.length})
            </Button>
          </div>

          {isLoading && <p className="text-xs text-muted-foreground italic text-center py-3">Carregando...</p>}

          {!isLoading && tab === "preco" && (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {precos.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-3">Sem alterações de preço registradas</p>
              ) : (
                precos.map((r) => {
                  const d = r.detalhes || {};
                  const subiu = Number(d.valor_novo || 0) > Number(d.valor_anterior || 0);
                  return (
                    <div key={r.id} className="rounded-md border border-border bg-background/40 p-2 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[9px] uppercase">
                          {d.tipo === "custo" ? "Custo" : `Venda${d.tabela_preco ? ` · ${d.tabela_preco}` : ""}`}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{fmtDate(r.criado_em)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-muted-foreground">{fmtBRL(d.valor_anterior)}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className={subiu ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>
                          {fmtBRL(d.valor_novo)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <User className="h-2.5 w-2.5" />
                        {d.usuario_nome || "—"}
                      </div>
                      {d.motivo && <p className="text-[11px] text-foreground/80 italic">"{d.motivo}"</p>}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {!isLoading && tab === "loc" && (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {locs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-3">Sem movimentações de localização registradas</p>
              ) : (
                locs.map((r) => {
                  const d = r.detalhes || {};
                  return (
                    <div key={r.id} className="rounded-md border border-border bg-background/40 p-2 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[9px] uppercase">Localização</Badge>
                        <span className="text-[10px] text-muted-foreground">{fmtDate(r.criado_em)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-muted-foreground">{d.localizacao_anterior || "—"}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground font-semibold">{d.localizacao_nova || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <User className="h-2.5 w-2.5" />
                        {d.usuario_nome || "—"}
                      </div>
                      {d.motivo && <p className="text-[11px] text-foreground/80 italic">"{d.motivo}"</p>}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
