import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://qrwminvkdcjaqpiptxlr.supabase.co";

export default function AgendarPublico() {
  const { slug } = useParams();
  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState({
    nome_cliente: "", telefone: "", veiculo: "", servico: "",
    data_agendada: "", observacoes: "",
  });

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/agendar-publico?slug=${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(setEmpresa)
      .catch(() => toast.error("Empresa não encontrada"))
      .finally(() => setLoading(false));
  }, [slug]);

  const enviar = async () => {
    if (!form.nome_cliente || !form.telefone || !form.data_agendada) {
      toast.error("Preencha nome, telefone e data");
      return;
    }
    setEnviando(true);
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/agendar-publico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...form }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setEnviado(true);
    } catch (e: any) {
      toast.error(e.message || "Erro ao agendar");
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!empresa) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Empresa não encontrada</div>;

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          {empresa.logo_url && <img src={empresa.logo_url} alt={empresa.nome} className="h-16 mx-auto mb-3" />}
          <h1 className="text-2xl font-bold text-foreground">{empresa.nome}</h1>
          <p className="text-sm text-muted-foreground">Agende seu serviço online</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Novo Agendamento</CardTitle></CardHeader>
          <CardContent>
            {enviado ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="h-14 w-14 mx-auto text-green-500" />
                <h3 className="text-lg font-bold text-foreground">Agendamento enviado!</h3>
                <p className="text-sm text-muted-foreground">Em breve entraremos em contato para confirmar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div><Label>Nome *</Label><Input value={form.nome_cliente} onChange={e => setForm({ ...form, nome_cliente: e.target.value })} /></div>
                <div><Label>Telefone *</Label><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" /></div>
                <div><Label>Veículo</Label><Input value={form.veiculo} onChange={e => setForm({ ...form, veiculo: e.target.value })} placeholder="Modelo / Placa" /></div>
                <div><Label>Serviço desejado</Label><Input value={form.servico} onChange={e => setForm({ ...form, servico: e.target.value })} placeholder="Ex: Troca de óleo" /></div>
                <div><Label>Data e hora *</Label><Input type="datetime-local" value={form.data_agendada} onChange={e => setForm({ ...form, data_agendada: e.target.value })} /></div>
                <div><Label>Observações</Label><Textarea rows={3} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
                <Button className="w-full" onClick={enviar} disabled={enviando}>
                  {enviando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Solicitar Agendamento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">Powered by Otto Tech Sistemas</p>
      </div>
    </div>
  );
}
