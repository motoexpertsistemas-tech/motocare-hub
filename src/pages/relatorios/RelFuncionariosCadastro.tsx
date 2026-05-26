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

async function fetchAllFuncionarios(filters: any) {
  const PAGE = 1000;
  const all: any[] = [];
  let from = 0;
  while (true) {
    let q = supabase.from("funcionarios").select("nome,cargo,celular1,telefone,telefone_fixo,email,cidade_uf,cpf,ativo,situacao,criado_em").range(from, from + PAGE - 1);

    if (filters.situacao === "ativo") q = q.eq("ativo", true);
    if (filters.situacao === "inativo") q = q.eq("ativo", false);
    if (filters.dataInicio) q = q.gte("criado_em", filters.dataInicio);
    if (filters.dataFim) q = q.lte("criado_em", filters.dataFim + "T23:59:59");

    q = q.order("nome", { ascending: true });

    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  let result = all;
  if (filters.nome) {
    const term = filters.nome.toLowerCase();
    result = result.filter((f: any) => (f.nome || "").toLowerCase().includes(term));
  }
  if (filters.telefone) {
    const term = filters.telefone.replace(/\D/g, "");
    result = result.filter((f: any) => (f.celular1 || "").replace(/\D/g, "").includes(term) || (f.telefone || "").replace(/\D/g, "").includes(term) || (f.telefone_fixo || "").replace(/\D/g, "").includes(term));
  }
  if (filters.email) {
    const term = filters.email.toLowerCase();
    result = result.filter((f: any) => (f.email || "").toLowerCase().includes(term));
  }
  if (filters.cidadeUf) {
    const term = filters.cidadeUf.toLowerCase();
    result = result.filter((f: any) => (f.cidade_uf || "").toLowerCase().includes(term));
  }
  return result;
}

function gerarRelatorio(resultados: any[]) {
  const w = window.open("", "_blank");
  if (!w) { toast.error("Popup bloqueado"); return; }

  const now = new Date().toLocaleString("pt-BR");
  const rows = resultados.map((f: any, i: number) => {
    const tel = f.celular1 || f.telefone || f.telefone_fixo || "-----";
    return `<tr class="${i % 2 ? "row-alt" : ""}">
      <td>${f.nome || "-----"}</td>
      <td>${f.cargo || "-----"}</td>
      <td>${f.cpf || "-----"}</td>
      <td>${tel}</td>
      <td>${f.email || "-----"}</td>
      <td>${f.cidade_uf || "-----"}</td>
      <td style="text-align:center">${f.ativo ? "Ativo" : "Inativo"}</td>
    </tr>`;
  }).join("");

  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório de Funcionários</title>
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
<div class="header"><div><h1>Relatório de Funcionários</h1><div class="date">Gerado em: ${now}</div></div></div>
<div class="toolbar">
<button class="btn-excel" onclick="exportExcel()">📊 Exportar Excel</button>
<button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
</div>
<table><thead><tr><th>Nome</th><th>Cargo</th><th>CPF</th><th>Telefone</th><th>E-mail</th><th>Cidade/UF</th><th>Situação</th></tr></thead>
<tbody>${rows}</tbody></table>
<p class="total">Total de registros: ${resultados.length}</p>
<script>
function exportExcel(){
var h=["Nome","Cargo","CPF","Telefone","E-mail","Cidade/UF","Situação"];
var lines=[h.join(";")];
document.querySelectorAll("tbody tr").forEach(function(tr){
var cols=[];tr.querySelectorAll("td").forEach(function(td){cols.push('"'+td.textContent.replace(/"/g,'""')+'"')});
lines.push(cols.join(";"));
});
var blob=new Blob(["\\uFEFF"+lines.join("\\n")],{type:"text/csv;charset=utf-8"});
var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="relatorio_funcionarios.csv";a.click();
}
</script></body></html>`);
  w.document.close();
}

export default function RelFuncionariosCadastro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cidadeUf, setCidadeUf] = useState("");
  const [situacao, setSituacao] = useState("todas");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const limpar = () => { setNome(""); setTelefone(""); setEmail(""); setCidadeUf(""); setSituacao("todas"); setDataInicio(""); setDataFim(""); };

  const gerar = async () => {
    setLoading(true);
    try {
      const data = await fetchAllFuncionarios({ nome, telefone, email, cidadeUf, situacao, dataInicio, dataFim });
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
          <h1 className="text-2xl font-bold text-foreground">Relatório de Funcionários</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Relatórios &gt; Cadastros &gt; Funcionários</p>
        </div>
      </div>

      <Card><CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Buscar por nome" /></div>
          <div><Label>Telefone/Celular</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="Buscar por telefone" /></div>
          <div><Label>E-mail</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Buscar por e-mail" /></div>
          <div><Label>Cidade/UF</Label><Input value={cidadeUf} onChange={e => setCidadeUf(e.target.value)} placeholder="Ex: São Paulo - SP" /></div>
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
          <div />
          <div><Label>Cadastrado de</Label><Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
          <div><Label>Cadastrado até</Label><Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
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
