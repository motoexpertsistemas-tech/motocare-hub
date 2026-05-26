import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Check, X, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFuncionariosRelatorio, useCategoriasClienteRelatorio } from "@/hooks/useRelatorioVendasFilters";

const fmt = (v: string | null) => v || "-----";

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

async function fetchAllClientes(filters: any) {
  const PAGE = 1000;
  const all: any[] = [];
  let from = 0;
  while (true) {
    let q = supabase.from("clientes").select("codigo,nome_completo,nome_fantasia,razao_social,tipo_pessoa,cpf,cnpj,telefone,whatsapp,email,cidade,estado,ativo,cadastrado_por,cadastrado_em,categoria_cliente").range(from, from + PAGE - 1);

    if (filters.tipo && filters.tipo !== "todos") {
      q = q.eq("tipo_pessoa", filters.tipo === "fisica" ? "fisica" : "juridica");
    }
    if (filters.situacao === "ativo") q = q.eq("ativo", true);
    if (filters.situacao === "inativo") q = q.eq("ativo", false);
    if (filters.cidade) q = q.ilike("cidade", `%${filters.cidade}%`);
    if (filters.estado) q = q.ilike("estado", `%${filters.estado}%`);
    if (filters.vendedor) q = q.ilike("cadastrado_por", `%${filters.vendedor}%`);
    if (filters.categoria && filters.categoria !== "todas") q = q.eq("categoria_cliente", filters.categoria);
    if (filters.dataInicio) q = q.gte("cadastrado_em", filters.dataInicio);
    if (filters.dataFim) q = q.lte("cadastrado_em", filters.dataFim + "T23:59:59");

    q = q.order("nome_completo", { ascending: true });

    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // client-side filters
  let result = all;
  if (filters.nome) {
    const term = filters.nome.toLowerCase();
    result = result.filter((c: any) => (c.nome_completo || "").toLowerCase().includes(term) || (c.nome_fantasia || "").toLowerCase().includes(term) || (c.razao_social || "").toLowerCase().includes(term));
  }
  if (filters.telefone) {
    const term = filters.telefone.replace(/\D/g, "");
    result = result.filter((c: any) => (c.telefone || "").replace(/\D/g, "").includes(term) || (c.whatsapp || "").replace(/\D/g, "").includes(term));
  }
  if (filters.email) {
    const term = filters.email.toLowerCase();
    result = result.filter((c: any) => (c.email || "").toLowerCase().includes(term));
  }
  return result;
}

function gerarRelatorio(resultados: any[]) {
  const w = window.open("", "_blank");
  if (!w) { toast.error("Popup bloqueado"); return; }

  const now = new Date().toLocaleString("pt-BR");
  const rows = resultados.map((c: any, i: number) => {
    const nome = c.tipo_pessoa === "juridica" ? (c.razao_social || c.nome_fantasia || c.nome_completo) : c.nome_completo;
    const doc = c.tipo_pessoa === "juridica" ? (c.cnpj || "-----") : (c.cpf || "-----");
    return `<tr class="${i % 2 ? "row-alt" : ""}">
      <td style="text-align:center">${c.codigo || ""}</td>
      <td>${nome || "-----"}</td>
      <td>${doc}</td>
      <td>${fmt(c.telefone)}</td>
      <td>${fmt(c.email)}</td>
      <td>${fmt(c.cidade)}</td>
      <td>${fmt(c.estado)}</td>
      <td>${fmt(c.categoria_cliente)}</td>
      <td style="text-align:center">${c.ativo ? "Ativo" : "Inativo"}</td>
    </tr>`;
  }).join("");

  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório de Clientes</title>
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
<div class="header"><div><h1>Relatório de Clientes</h1><div class="date">Gerado em: ${now}</div></div></div>
<div class="toolbar">
<button class="btn-excel" onclick="exportExcel()">📊 Exportar Excel</button>
<button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
</div>
<table><thead><tr><th>Código</th><th>Nome</th><th>CPF/CNPJ</th><th>Telefone</th><th>E-mail</th><th>Cidade</th><th>UF</th><th>Categoria</th><th>Situação</th></tr></thead>
<tbody>${rows}</tbody></table>
<p class="total">Total de registros: ${resultados.length}</p>
<script>
function exportExcel(){
var h=["Código","Nome","CPF/CNPJ","Telefone","E-mail","Cidade","UF","Categoria","Situação"];
var lines=[h.join(";")];
document.querySelectorAll("tbody tr").forEach(function(tr){
var cols=[];tr.querySelectorAll("td").forEach(function(td){cols.push('"'+td.textContent.replace(/"/g,'""')+'"')});
lines.push(cols.join(";"));
});
var blob=new Blob(["\\uFEFF"+lines.join("\\n")],{type:"text/csv;charset=utf-8"});
var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="relatorio_clientes.csv";a.click();
}
</script></body></html>`);
  w.document.close();
}

export default function RelClientesCadastro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState("todos");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("todos");
  const [situacao, setSituacao] = useState("todas");
  const [vendedor, setVendedor] = useState("todos");
  const [categoria, setCategoria] = useState("todas");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [semResultados, setSemResultados] = useState(false);

  const { data: funcionarios = [] } = useFuncionariosRelatorio();
  const { data: categorias = [] } = useCategoriasClienteRelatorio();

  const limpar = () => {
    setTipo("todos"); setNome(""); setTelefone(""); setEmail("");
    setCidade(""); setEstado("todos"); setSituacao("todas"); setVendedor("todos");
    setCategoria("todas"); setDataInicio(""); setDataFim(""); setSemResultados(false);
  };

  const gerar = async () => {
    setLoading(true);
    setSemResultados(false);
    try {
      const data = await fetchAllClientes({ tipo, nome, telefone, email, cidade, estado: estado === "todos" ? "" : estado, situacao, vendedor: vendedor === "todos" ? "" : vendedor, categoria, dataInicio, dataFim });
      if (data.length === 0) { setSemResultados(true); toast.warning("Nenhum registro encontrado"); return; }
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
          <h1 className="text-2xl font-bold text-foreground">Relatório de Clientes</h1>
          <p className="text-xs text-muted-foreground">Início &gt; Relatórios &gt; Cadastros &gt; Clientes</p>
        </div>
      </div>

      <Card><CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="fisica">Pessoa Física</SelectItem>
                <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Buscar por nome" /></div>
          <div><Label>Telefone/Celular</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="Buscar por telefone" /></div>
          <div><Label>E-mail</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Buscar por e-mail" /></div>
          <div><Label>Cidade</Label><Input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" /></div>
          <div><Label>Estado</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
          <div><Label>Vendedor/Responsável</Label>
            <Select value={vendedor} onValueChange={setVendedor}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {funcionarios.map(f => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {categorias.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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

      {semResultados && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Nenhum registro encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou o período selecionado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
