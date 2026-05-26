import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Target as TargetIcon, Pencil, Loader2, Medal } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BRLInput } from "@/components/BRLInput";
import { toast } from "sonner";

interface Usuario { id: string; nome_completo: string; email: string; }
interface Meta {
  id?: string; usuario_id: string; mes: number; ano: number;
  meta_valor: number; meta_os: number;
}
interface Realizado { usuario_id: string; valor: number; os: number; }

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function MetasPanel() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [realizado, setRealizado] = useState<Record<string, Realizado>>({});
  const [loading, setLoading] = useState(true);

  // Editor
  const [open, setOpen] = useState(false);
  const [editUsuario, setEditUsuario] = useState<Usuario | null>(null);
  const [valorMeta, setValorMeta] = useState(0);
  const [osMeta, setOsMeta] = useState(0);

  const carregar = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: u } = await supabase.from("usuarios").select("empresa_id").eq("auth_user_id", user!.id).maybeSingle();
    if (!u) { setLoading(false); return; }

    const [uRes, mRes, osRes] = await Promise.all([
      supabase.from("usuarios").select("id, nome_completo, email").eq("empresa_id", u.empresa_id),
      supabase.from("metas_vendedores" as any).select("*").eq("ano", ano).eq("mes", mes),
      supabase.from("ordem_servico").select("vendedor_id, valor_total, status, data_entrada")
        .gte("data_entrada", `${ano}-${String(mes).padStart(2,"0")}-01`)
        .lt("data_entrada", `${ano}-${String(mes+1).padStart(2,"0")}-01`)
        .in("status", ["Finalizada", "Entregue", "Pago"]),
    ]);

    setUsuarios((uRes.data as any) || []);
    setMetas((mRes.data as any) || []);

    const real: Record<string, Realizado> = {};
    (osRes.data || []).forEach((os: any) => {
      const id = os.vendedor_id || "sem";
      if (!real[id]) real[id] = { usuario_id: id, valor: 0, os: 0 };
      real[id].valor += Number(os.valor_total || 0);
      real[id].os += 1;
    });
    setRealizado(real);
    setLoading(false);
  };
  useEffect(() => { carregar(); }, [mes, ano]);

  const abrirEditor = (u: Usuario) => {
    const m = metas.find(x => x.usuario_id === u.id);
    setEditUsuario(u);
    setValorMeta(m?.meta_valor || 0);
    setOsMeta(m?.meta_os || 0);
    setOpen(true);
  };

  const salvarMeta = async () => {
    if (!editUsuario) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: u } = await supabase.from("usuarios").select("empresa_id").eq("auth_user_id", user!.id).maybeSingle();
    await supabase.from("metas_vendedores" as any).upsert({
      empresa_id: u!.empresa_id, usuario_id: editUsuario.id, mes, ano,
      meta_valor: valorMeta, meta_os: osMeta,
    }, { onConflict: "empresa_id,usuario_id,mes,ano" });
    toast.success("Meta salva"); setOpen(false); carregar();
  };

  const ranking = usuarios.map(u => {
    const m = metas.find(x => x.usuario_id === u.id);
    const r = realizado[u.id] || { valor: 0, os: 0 };
    const pct = m && m.meta_valor > 0 ? Math.min(100, (r.valor / m.meta_valor) * 100) : 0;
    return { usuario: u, meta: m, real: r, pct };
  }).sort((a, b) => b.real.valor - a.real.valor);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Trophy className="h-5 w-5" /> Metas & Ranking</h2>
          <p className="text-xs text-muted-foreground">Acompanhe metas mensais por vendedor</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(mes)} onValueChange={v => setMes(parseInt(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{MESES.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(ano)} onValueChange={v => setAno(parseInt(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[ano-1, ano, ano+1].map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto mt-10" /> : (
        <div className="grid gap-3">
          {ranking.map((r, i) => (
            <Card key={r.usuario.id}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-700" :
                        i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>
                      {i < 3 ? <Medal className="h-4 w-4" /> : i + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{r.usuario.nome_completo}</div>
                      <div className="text-xs text-muted-foreground">{r.usuario.email}</div>
                    </div>
                  </div>
                  <Button size="icon" variant="outline" className="text-green-600 h-8 w-8" onClick={() => abrirEditor(r.usuario)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Realizado</div>
                    <div className="font-bold text-green-600">R$ {r.real.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Meta</div>
                    <div className="font-bold">R$ {(r.meta?.meta_valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">OSs</div>
                    <div className="font-bold">{r.real.os}{r.meta?.meta_os ? ` / ${r.meta.meta_os}` : ""}</div>
                  </div>
                </div>
                <Progress value={r.pct} className="h-2" />
                <div className="text-right text-xs text-muted-foreground">{r.pct.toFixed(1)}% da meta</div>
              </CardContent>
            </Card>
          ))}
          {ranking.length === 0 && (
            <Card><CardContent className="pt-10 pb-10 text-center text-sm text-muted-foreground">
              Sem usuários cadastrados.
            </CardContent></Card>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Meta de {editUsuario?.nome_completo}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">Período: {MESES[mes-1]}/{ano}</div>
            <div>
              <Label>Meta de faturamento (R$)</Label>
              <BRLInput value={valorMeta} onChange={(v) => setValorMeta(parseFloat(v) || 0)} />
            </div>
            <div>
              <Label>Meta de OSs fechadas</Label>
              <Input type="number" value={osMeta} onChange={e => setOsMeta(parseInt(e.target.value) || 0)} />
            </div>
            <Button className="w-full" onClick={salvarMeta}>Salvar Meta</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
