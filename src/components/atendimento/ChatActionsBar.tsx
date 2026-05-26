import { Sparkles, Package, Link2, Calendar, Bookmark, Flame, UserPlus, GitBranch, Repeat, BarChart3, Loader2 } from "lucide-react";

interface Action {
  id: string;
  label: string;
  icon: any;
  color: string;
  onClick: () => void;
  loading?: boolean;
}

interface Props {
  onSugerirIA: () => void;
  onCatalogo: () => void;
  onCobrar: () => void;
  onNovoEvento: () => void;
  onFollowUp: () => void;
  onMarcarQuente: () => void;
  onVincularLead: () => void;
  onFluxo: () => void;
  onCadencia: () => void;
  onAnalisar: () => void;
  carregandoIA?: boolean;
  carregandoAnalise?: boolean;
}

export default function ChatActionsBar(props: Props) {
  const actions: Action[] = [
    { id: "ia", label: "Sugerir Resposta IA", icon: props.carregandoIA ? Loader2 : Sparkles, color: "text-green-600", onClick: props.onSugerirIA, loading: props.carregandoIA },
    { id: "cat", label: "Catálogo", icon: Package, color: "text-blue-600", onClick: props.onCatalogo },
    { id: "cob", label: "Cobrar", icon: Link2, color: "text-emerald-600", onClick: props.onCobrar },
    { id: "evt", label: "Novo Evento", icon: Calendar, color: "text-purple-600", onClick: props.onNovoEvento },
    { id: "fup", label: "Follow-up", icon: Bookmark, color: "text-amber-600", onClick: props.onFollowUp },
    { id: "quente", label: "Quente", icon: Flame, color: "text-orange-600", onClick: props.onMarcarQuente },
    { id: "lead", label: "Vincular Lead", icon: UserPlus, color: "text-cyan-600", onClick: props.onVincularLead },
    { id: "flx", label: "Fluxo", icon: GitBranch, color: "text-indigo-600", onClick: props.onFluxo },
    { id: "cad", label: "Cadência", icon: Repeat, color: "text-pink-600", onClick: props.onCadencia },
    { id: "ana", label: "Analisar", icon: props.carregandoAnalise ? Loader2 : BarChart3, color: "text-violet-600", onClick: props.onAnalisar, loading: props.carregandoAnalise },
  ];

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-t border-border bg-sidebar overflow-x-auto scrollbar-none">
      {actions.map(a => {
        const Ic = a.icon;
        return (
          <button key={a.id} onClick={a.onClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-md hover:bg-accent transition-colors whitespace-nowrap text-foreground">
            <Ic className={`h-3.5 w-3.5 ${a.color} ${a.loading ? "animate-spin" : ""}`} />
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
