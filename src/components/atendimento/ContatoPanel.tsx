import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Eye, History, Tag as TagIcon, Route, Sparkles, X,
  Star, AlertTriangle, RefreshCw, Loader2,
} from "lucide-react";

interface Conversa {
  id: string; contato_nome: string | null;
  contato_externo_id: string; canal_tipo: string;
  tags: string[] | null;
}

interface Analise {
  nota?: number; tom?: string;
  pontos_fortes?: string[]; a_melhorar?: string[];
  resumo?: string; intencao_cliente?: string;
}

interface Props {
  conversa: Conversa;
  onClose?: () => void;
  analise?: Analise | null;
  onAnalisar?: () => void;
  analisando?: boolean;
}

const TABS = [
  { id: "visao", label: "Visão", icon: Eye },
  { id: "historico", label: "Histórico", icon: History },
  { id: "etiquetas", label: "Etiquetas", icon: TagIcon },
  { id: "jornada", label: "Jornada", icon: Route },
  { id: "resumo", label: "Resumo", icon: Sparkles },
];

export default function ContatoPanel({ conversa, onClose, analise, onAnalisar, analisando }: Props) {
  const [tab, setTab] = useState("resumo");
  const [stats, setStats] = useState<{ total_gasto: number; total_os: number; ultima: string | null } | null>(null);
  const [historico, setHistorico] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const tel = conversa.contato_externo_id;
      const { data: cli } = await supabase.from("clientes")
        .select("total_gasto, total_os, ultima_compra")
        .or(`telefone.eq.${tel},whatsapp.eq.${tel}`).maybeSingle();
      if (cli) {
        setStats({ total_gasto: cli.total_gasto || 0, total_os: cli.total_os || 0, ultima: cli.ultima_compra });
      } else {
        setStats({ total_gasto: 0, total_os: 0, ultima: null });
      }
      const { data: os } = await supabase.from("ordem_servico")
        .select("numero_os, status, valor_total, data_entrada")
        .eq("cliente_telefone", tel).order("data_entrada", { ascending: false }).limit(10);
      setHistorico(os || []);
    })();
  }, [conversa.id, conversa.contato_externo_id]);

  const nota = analise?.nota ?? null;
  const notaCor = nota === null ? "text-muted-foreground"
    : nota >= 8 ? "text-green-600" : nota >= 5 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="w-[320px] border-l border-border bg-sidebar flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-bold text-sm text-foreground">Dados do Contato</h3>
        {onClose && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex border-b border-border overflow-x-auto scrollbar-none">
        {TABS.map(t => {
          const Ic = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 min-w-fit px-3 py-2 text-[11px] font-medium flex items-center justify-center gap-1 border-b-2 transition-colors whitespace-nowrap
                ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Ic className="h-3 w-3" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tab === "visao" && (
          <>
            <Card>
              <CardContent className="pt-5 text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center text-2xl">👤</div>
                <h4 className="font-semibold text-sm text-foreground">{conversa.contato_nome || "Sem nome"}</h4>
                <p className="text-xs text-muted-foreground">{conversa.contato_externo_id}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Histórico de Compras</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Gasto:</span>
                  <span className="font-semibold">R$ {(stats?.total_gasto || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Última Compra:</span>
                  <span>{stats?.ultima ? new Date(stats.ultima).toLocaleDateString("pt-BR") : "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total de OSs:</span>
                  <span>{stats?.total_os || 0}</span></div>
              </CardContent>
            </Card>
          </>
        )}

        {tab === "historico" && (
          <Card><CardContent className="pt-4 space-y-2">
            {historico.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-6">
                <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Nenhuma OS encontrada
              </div>
            ) : historico.map((os: any) => (
              <div key={os.numero_os} className="flex justify-between items-center text-xs p-2 rounded border border-border">
                <div>
                  <div className="font-medium text-foreground">OS {os.numero_os}</div>
                  <div className="text-muted-foreground">{new Date(os.data_entrada).toLocaleDateString("pt-BR")}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">R$ {(os.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                  <div className="text-muted-foreground">{os.status}</div>
                </div>
              </div>
            ))}
          </CardContent></Card>
        )}

        {tab === "etiquetas" && (
          <Card><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-2">Etiquetas do contato</p>
            <div className="flex flex-wrap gap-1.5">
              {(conversa.tags || []).map(t => (
                <span key={t} className="px-2 py-0.5 bg-secondary text-xs rounded-full">{t}</span>
              ))}
              {(conversa.tags || []).length === 0 && (
                <span className="text-xs text-muted-foreground">Sem etiquetas</span>
              )}
            </div>
          </CardContent></Card>
        )}

        {tab === "jornada" && (
          <Card><CardContent className="pt-5 text-center text-xs text-muted-foreground py-8">
            <Route className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Jornada do cliente em breve
          </CardContent></Card>
        )}

        {tab === "resumo" && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> RESUMO DA IA
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onAnalisar} disabled={analisando}>
                {analisando ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              </Button>
            </div>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Nota geral</span>
                  <span className={`text-2xl font-bold ${notaCor}`}>
                    {nota !== null ? nota : "—"}<span className="text-sm text-muted-foreground">/10</span>
                  </span>
                </div>
                <div className="h-1 rounded-full bg-muted mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                    style={{ width: nota !== null ? `${nota * 10}%` : "0%" }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Tom da conversa</CardTitle></CardHeader>
              <CardContent className="text-xs text-foreground">
                {analise?.tom ? (
                  <>
                    <span className="font-medium capitalize">{analise.tom}</span>
                    {analise.resumo && <p className="text-muted-foreground mt-1">{analise.resumo}</p>}
                    {analise.intencao_cliente && <p className="text-muted-foreground mt-1"><strong>Intenção:</strong> {analise.intencao_cliente}</p>}
                  </>
                ) : (
                  <span className="text-muted-foreground">Use "Analisar" na barra para gerar.</span>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex-row items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-green-600" />
                <CardTitle className="text-xs">PONTOS FORTES</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                {(analise?.pontos_fortes || []).length > 0
                  ? analise!.pontos_fortes!.map((p, i) => <div key={i}>• {p}</div>)
                  : "—"}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex-row items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                <CardTitle className="text-xs">A MELHORAR</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                {(analise?.a_melhorar || []).length > 0
                  ? analise!.a_melhorar!.map((p, i) => <div key={i}>• {p}</div>)
                  : "—"}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
