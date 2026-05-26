import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar, Phone, Presentation, Bookmark, Pin, Video, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conversaId: string;
  contatoNome: string | null;
  onEnviado?: () => void;
}

const TIPOS = [
  { id: "reuniao", label: "Reunião", icon: Calendar, color: "bg-green-600" },
  { id: "ligacao", label: "Ligação", icon: Phone, color: "bg-blue-600" },
  { id: "demo", label: "Demo", icon: Presentation, color: "bg-purple-600" },
  { id: "followup", label: "Follow-up", icon: Bookmark, color: "bg-orange-600" },
  { id: "outro", label: "Outro", icon: Pin, color: "bg-pink-600" },
];

export default function NovoEventoDialog({ open, onOpenChange, conversaId, contatoNome, onEnviado }: Props) {
  const hoje = new Date().toISOString().split("T")[0];
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("reuniao");
  const [dataInicio, setDataInicio] = useState(hoje);
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [dataFim, setDataFim] = useState(hoje);
  const [horaFim, setHoraFim] = useState("10:00");
  const [diaInteiro, setDiaInteiro] = useState(false);
  const [local, setLocal] = useState("");
  const [criarMeet, setCriarMeet] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (!titulo.trim()) { toast.error("Informe o título"); return; }
    setEnviando(true);

    const tipoLabel = TIPOS.find(t => t.id === tipo)?.label || tipo;
    const dataInicioFmt = new Date(dataInicio + "T" + (diaInteiro ? "00:00" : horaInicio));
    const dataStr = dataInicioFmt.toLocaleDateString("pt-BR");
    const horaStr = diaInteiro ? "Dia inteiro" : `${horaInicio} - ${horaFim}`;

    const linhas = [
      `📅 *${tipoLabel} agendada*`,
      `*${titulo}*`,
      `📆 ${dataStr} • ${horaStr}`,
    ];
    if (local) linhas.push(`📍 ${local}`);
    if (criarMeet) linhas.push(`🎥 Link Google Meet será enviado em breve`);
    if (descricao) linhas.push(`\n${descricao}`);
    if (contatoNome) linhas.push(`\nCom: ${contatoNome}`);

    const { error } = await supabase.from("mensagens").insert({
      conversa_id: conversaId,
      tipo_remetente: "atendente",
      usuario_nome: "Atendente",
      tipo_mensagem: "texto",
      conteudo: linhas.join("\n"),
      status_envio: "enviado",
      metadata: { tipo: "evento", evento_tipo: tipo, data_inicio: dataInicioFmt.toISOString(), local, criar_meet: criarMeet },
    });

    setEnviando(false);
    if (error) { toast.error("Erro ao agendar"); return; }
    toast.success(`${tipoLabel} agendada e enviada!`);
    setTitulo(""); setDescricao(""); setLocal("");
    onEnviado?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Novo Evento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Título *</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Reunião com cliente" />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Tipo de Evento</Label>
            <div className="flex flex-wrap gap-2">
              {TIPOS.map(t => {
                const Ic = t.icon;
                const ativo = tipo === t.id;
                return (
                  <button key={t.id} type="button" onClick={() => setTipo(t.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 border transition-all
                      ${ativo ? `${t.color} text-white border-transparent` : "bg-background border-border text-foreground hover:bg-accent"}`}>
                    <Ic className="h-3.5 w-3.5" /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data Início</Label>
              <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Hora Início</Label>
              <Input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} disabled={diaInteiro} />
            </div>
            <div>
              <Label className="text-xs">Data Fim</Label>
              <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Hora Fim</Label>
              <Input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} disabled={diaInteiro} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={diaInteiro} onCheckedChange={setDiaInteiro} />
            <Label className="text-xs">Dia inteiro</Label>
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> Local / Link da reunião</Label>
            <Input value={local} onChange={e => setLocal(e.target.value)} placeholder="https://meet.google.com/... ou endereço" />
          </div>

          <div className="flex items-start gap-2 p-3 border border-border rounded-md">
            <Video className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="flex-1">
              <Label className="text-xs font-medium">Criar Google Meet</Label>
              <p className="text-[10px] text-muted-foreground">Gera automaticamente um link ao sincronizar</p>
            </div>
            <Switch checked={criarMeet} onCheckedChange={setCriarMeet} />
          </div>

          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={enviar} disabled={enviando} className="gap-1.5">
              <Send className="h-4 w-4" /> {enviando ? "Enviando..." : "Agendar e enviar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
