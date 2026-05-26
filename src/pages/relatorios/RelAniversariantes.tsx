import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

async function fetchAniversariantes(filters: any) {
  const PAGE = 1000;
  const all: any[] = [];
  let from = 0;
  while (true) {
    let q = supabase.from("clientes").select("codigo,nome_completo,telefone,whatsapp,email,cidade,estado,data_nascimento,ativo").not("data_nascimento","is",null).range(from, from + PAGE - 1);

    if (filters.situacao === "ativo") q = q.eq("ativo", true);
    if (filters.situacao === "inativo") q = q.eq("ativo", false);
    if (filters.cidade) q = q.ilike("cidade", `%${filters.cidade}%`);
    if (filters.estado) q = q.ilike("estado", `%${filters.estado}%`);

    q = q.order("data_nascimento", { ascending: true });

    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  let result = all;
  if (filters.mes && filters.mes !== "todos") {
    const mesNum = parseInt(filters.mes);
    result = result.filter((c: any) => {
      if (!c.data_nascimento) return false;
      const m = new Date(c.data_nascimento + "T00:00:00").getMonth() + 1;
      return m === mesNum;
    });
  }
  return result;
}

function gerarRelatorio(resultados: any[]) {
  const w = window.open("", "_blank");
  if (!w) { toast.error("Popup bloqueado"); return; }

  const now = new Date().toLocaleString("pt-BR");
  const rows = resultados.map((c: any, i: number) => {
    const nasc = c.data_nascimento ? new Date(c.data_nascimento + "T00:00:00").toLocaleDateString("pt-BR") : "-----";
    return `<tr class="${i % 2 ? "row-alt" : ""}">
      <td style="text-align:center">${c.codigo || ""}</td>
      <td>${c.nome_completo || "-----"}</td>
      <td>${nasc}</td>
      <td>${c.telefone || "-----"}</td>
      <td>${c.email || "-----"}</td>
      <td>${c.cidade || "-----"}</td>
      <td>${c.estado || "-----"}</td>
      <td style="text-align:center">${c.ativo ? "Ativo" : "Inativo"}</td>
    </tr>`;
  }).join("");

  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório de Aniversariantes</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#333;padding:15px}
.header{display:flex;align-items:center;gap:15px;margin-bottom:5px}.header h1{font-size:18px;font-weight:bold}.header .date{font-size:10px;color:#888}
.toolbar{display:flex;gap:10px;margin:10px 0 15px}.toolbar button{padding:8px 18px;border:1px solid #ccc;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600}
.btn-print{background:#2563eb;color:#fff;border-color:#2563eb}.btn-excel{background:#16a34a;color:#fff;border-color:#16a34a}
table{width:100%;border-collapse:collapse;margin-top:5px}th{background:#3b3b3b;color:#fff;padding:5px 6px;font-size:10px;text-align:left;white-space:nowrap}
td{padding:4px 6px;border-bottom:1px solid #ddd;font-size:10px;white-space:nowrap}tr.row-alt{background:#f8f8f8}
.total{margin-top:8px;font-size:11px;color:#666}
@media print{.toolbar{display:none!important}body{padding:0}}
</style></head><body>
<div class="header"><div><h1>Relatório de Aniversariantes</h1><div class="date">Gerado em: ${now}</div></div></div>
<div class="toolbar">
<button class="btn-excel" onclick="exportExcel()">📊 Exportar Excel</button>
<button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
</div>
<table><thead><tr><th>Código</th><th>Nome</th><th>Nascimento</th><th>Telefone</th><th>E-mail</th><th>Cidade</th><th>UF</th><th>Situação</th></tr></thead>
<tbody>${rows}</tbody></table>
<p class="total">Total de registros: ${resultados.length}</p>
<script>
function exportExcel(){
var h=["Código","Nome","Nascimento","Telefone","E-mail","Cidade","UF","Situação"];
var lines=[h.join(";")];
document.querySelectorAll("tbody tr").forEach(function(tr){
var cols=[];tr.querySelectorAll("td").forEach(function(td){cols.push('"'+td.textContent.replace(/"/g,'""')+'"')});
lines.push(cols.join(";"));
});
var blob=new Blob(["\\uFEFF"+lines.join("\\n")],{type:"text/csv;charset=utf-8"});
var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="relatorio_aniversariantes.csv";a.click();
}
</script></body></html>`);
  w.document.close();
}

export default function RelAniversariantes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mes, setMes] = useState("todos");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [situacao, setSituacao] = useState("todas");

  const limpar = () => { setMes("todos"); setCidade(""); setEstado(""); setSituacao("todas"); };

  const gerar = async () => {
    setLoading(true);
    try {
      const data = await fetchAniversariantes({ mes, cidade, estado, situacao });
      if (data.length === 0) { toast.warning("Nenhum registro encontrado"); return; }
      gerarRelatorio(data);
      toast.success(`${data.length} registros encontrados`);
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios/clientes")}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório de Aniversariantes</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Relatórios &gt; Cadastros &gt; Aniversariantes</p>
        </div>
      </div>

      <Card><CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Mês</Label>
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {meses.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Cidade</Label><Input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" /></div>
          <div><Label>Estado</Label><Input value={estado} onChange={e => setEstado(e.target.value)} placeholder="UF" /></div>
          <div><Label>Situação</Label>
            <Select value={situacao} onValueChange={setSituacao}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={gerar} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />} Gerar relatório
          </Button>
          <Button variant="outline" onClick={limpar}><X className="h-4 w-4 mr-2" /> Limpar filtros</Button>
        </div>
      </CardContent></Card>
    </div>
  );
}
