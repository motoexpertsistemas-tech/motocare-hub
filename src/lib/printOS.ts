import { supabase } from "@/integrations/supabase/client";

interface OSPrintData {
  id: string;
  numero_os: string;
  status: string;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  placa: string | null;
  veiculo_marca: string | null;
  veiculo_modelo: string | null;
  veiculo_ano: string | null;
  veiculo_cor: string | null;
  veiculo_chassi: string | null;
  km_entrada: number | null;
  km_ultima_revisao: number | null;
  nivel_combustivel: string | null;
  oleo_recomendado: string | null;
  ultima_troca_oleo: string | null;
  defeito_relatado: string | null;
  condicoes: string | null;
  acessorios: string | null;
  solucao: string | null;
  observacoes: string | null;
  observacoes_internas: string | null;
  canal_venda: string | null;
  centro_custo: string | null;
  vendedor: string | null;
  tecnico_responsavel: string | null;
  prioridade: string;
  data_entrada: string;
  data_prevista_conclusao: string | null;
  valor_total_pecas: number | null;
  valor_total_servicos: number | null;
  valor_frete: number | null;
  valor_desconto: number | null;
  valor_outros: number | null;
  valor_total: number | null;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  atendimento: "ATENDIMENTO", em_execucao: "EM EXECUÇÃO", aguardando_pecas: "AGUARDANDO PEÇAS",
  pronta: "PRONTA", entregue: "ENTREGUE", agendada: "AGENDADA", agendamento: "AGENDAMENTO",
  AGENDAMENTO: "AGENDAMENTO", cancelada: "CANCELADA",
};

function fmtBRL(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export async function printOS(osId: string) {
  // Fetch OS data
  const { data: osData } = await supabase.from("ordem_servico").select("*").eq("id", osId).maybeSingle();
  if (!osData) return;
  const os = osData as unknown as OSPrintData;

  // Fetch items
  const { data: itensData } = await supabase.from("os_itens").select("*").eq("os_id", osId).order("created_at");
  const itens = (itensData || []) as any[];

  // Fetch company info
  const { data: loja } = await supabase.from("configuracoes_loja").select("*").limit(1).maybeSingle();

  const pecas = itens.filter((i: any) => i.tipo === "peca" || i.tipo === "produto");
  const servicos = itens.filter((i: any) => i.tipo === "servico");

  const w = window.open("", "_blank");
  if (!w) return;

  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>OS ${os.numero_os}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;padding:25px 30px;color:#222;font-size:12px;line-height:1.5}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #DC2626;padding-bottom:12px;margin-bottom:15px}
  .header h1{font-size:18px;color:#DC2626;margin-bottom:2px}
  .header .empresa{font-size:11px;color:#555}
  .header .os-num{font-size:22px;font-weight:bold;color:#DC2626;text-align:right}
  .header .os-status{display:inline-block;background:#DC2626;color:#fff;padding:3px 12px;border-radius:4px;font-size:11px;font-weight:bold;margin-top:4px}
  .section{margin-bottom:14px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden}
  .section-title{background:#f8f9fa;padding:7px 12px;font-weight:bold;font-size:12px;color:#DC2626;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:6px}
  .section-body{padding:10px 12px}
  .grid{display:grid;gap:6px 20px}
  .grid-2{grid-template-columns:1fr 1fr}
  .grid-3{grid-template-columns:1fr 1fr 1fr}
  .grid-4{grid-template-columns:1fr 1fr 1fr 1fr}
  .grid-6{grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr}
  .field label{font-size:10px;color:#888;text-transform:uppercase;font-weight:600;letter-spacing:0.3px}
  .field p{font-size:12px;font-weight:500;margin-top:1px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#f8f9fa;padding:6px 8px;text-align:left;font-weight:600;border-bottom:2px solid #e5e7eb;font-size:10px;text-transform:uppercase;color:#666}
  td{padding:5px 8px;border-bottom:1px solid #f0f0f0}
  tr:last-child td{border-bottom:none}
  .text-right{text-align:right}
  .total-row{background:#fff7ed;font-weight:bold}
  .total-box{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;text-align:center}
  .total-box .item{border:1px solid #e5e7eb;border-radius:4px;padding:6px}
  .total-box .item label{font-size:9px;color:#888;text-transform:uppercase;display:block}
  .total-box .item p{font-size:13px;font-weight:bold;margin-top:2px}
  .total-box .item.destaque{background:#DC2626;color:#fff;border-color:#DC2626}
  .total-box .item.destaque label{color:#fff9}
  .obs-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .obs-box{border:1px solid #e5e7eb;border-radius:4px;padding:8px}
  .obs-box h4{font-size:10px;color:#888;text-transform:uppercase;margin-bottom:4px}
  .obs-box p{font-size:11px;min-height:40px}
  .footer{margin-top:20px;border-top:2px solid #e5e7eb;padding-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:40px;text-align:center}
  .footer .sig{border-top:1px solid #333;padding-top:4px;margin-top:40px;font-size:11px}
  @media print{body{padding:15px 20px}@page{margin:10mm}}
  .badge-status{font-size:10px;padding:2px 8px;border-radius:3px;font-weight:600}
  .badge-concluido{background:#dcfce7;color:#16a34a}
  .badge-pendente{background:#fef3c7;color:#d97706}
</style></head><body>

<!-- HEADER -->
<div class="header">
  <div>
    <h1>${loja?.nome_fantasia || "EMPRESA"}</h1>
    <div class="empresa">
      ${loja?.razao_social ? `${loja.razao_social}<br>` : ""}
      ${loja?.cnpj ? `CNPJ: ${loja.cnpj}` : ""}
      ${loja?.telefone ? ` | Tel: ${loja.telefone}` : ""}
      ${loja?.email ? ` | ${loja.email}` : ""}<br>
      ${[loja?.logradouro, loja?.numero, loja?.bairro, loja?.cidade, loja?.estado, loja?.cep].filter(Boolean).join(", ")}
    </div>
  </div>
  <div style="text-align:right">
    <div class="os-num">${os.numero_os}</div>
    <div class="os-status">${statusLabels[os.status] || os.status?.toUpperCase()}</div>
  </div>
</div>

<!-- DADOS GERAIS -->
<div class="section">
  <div class="section-title">📋 Dados Gerais</div>
  <div class="section-body">
    <div class="grid grid-4">
      <div class="field"><label>Cliente</label><p>${os.cliente_nome || "—"}</p></div>
      <div class="field"><label>Telefone</label><p>${os.cliente_telefone || "—"}</p></div>
      <div class="field"><label>Canal de Venda</label><p>${os.canal_venda || "—"}</p></div>
      <div class="field"><label>Prioridade</label><p>${os.prioridade || "Normal"}</p></div>
    </div>
    <div class="grid grid-4" style="margin-top:6px">
      <div class="field"><label>Entrada</label><p>${fmtDate(os.data_entrada)}</p></div>
      <div class="field"><label>Previsão Saída</label><p>${fmtDate(os.data_prevista_conclusao)}</p></div>
      <div class="field"><label>Centro de Custo</label><p>${os.centro_custo || "—"}</p></div>
      <div class="field"><label>Criado em</label><p>${fmtDate(os.created_at)}</p></div>
    </div>
  </div>
</div>

<!-- RESPONSÁVEIS -->
<div class="section">
  <div class="section-title">👥 Responsáveis</div>
  <div class="section-body">
    <div class="grid grid-2">
      <div class="field"><label>Vendedor / Responsável</label><p>${os.vendedor || "—"}</p></div>
      <div class="field"><label>Técnico</label><p>${os.tecnico_responsavel || "—"}</p></div>
    </div>
  </div>
</div>

<!-- EQUIPAMENTO -->
<div class="section">
  <div class="section-title">🏍️ Equipamento</div>
  <div class="section-body">
    <div class="grid grid-4">
      <div class="field"><label>Equipamento</label><p>${[os.veiculo_marca, os.veiculo_modelo, os.veiculo_cor].filter(Boolean).join(" ") || "—"}</p></div>
      <div class="field"><label>Placa</label><p>${os.placa || "—"}</p></div>
      <div class="field"><label>Ano</label><p>${os.veiculo_ano || "—"}</p></div>
      <div class="field"><label>Chassi</label><p>${os.veiculo_chassi || "—"}</p></div>
    </div>
    <div class="grid grid-4" style="margin-top:6px">
      <div class="field"><label>KM Atual</label><p>${os.km_entrada ?? "—"}</p></div>
      <div class="field"><label>KM Última Revisão</label><p>${os.km_ultima_revisao ?? "—"}</p></div>
      <div class="field"><label>Nível Combustível</label><p>${os.nivel_combustivel || "—"}</p></div>
      <div class="field"><label>Óleo Recomendado</label><p>${os.oleo_recomendado || "—"}</p></div>
    </div>
    <div class="grid grid-3" style="margin-top:6px">
      <div class="field"><label>Condições</label><p>${os.condicoes || "—"}</p></div>
      <div class="field"><label>Defeitos</label><p>${os.defeito_relatado || "—"}</p></div>
      <div class="field"><label>Acessórios</label><p>${os.acessorios || "—"}</p></div>
    </div>
    ${os.solucao ? `<div style="margin-top:6px"><div class="field"><label>Solução</label><p>${os.solucao}</p></div></div>` : ""}
    ${os.ultima_troca_oleo ? `<div style="margin-top:6px"><div class="field"><label>Última Troca de Óleo</label><p>${os.ultima_troca_oleo}</p></div></div>` : ""}
  </div>
</div>

<!-- PEÇAS -->
<div class="section">
  <div class="section-title">📦 Produtos/Peças</div>
  <div class="section-body" style="padding:0">
    <table>
      <thead><tr><th>#</th><th>Produto</th><th>Det.</th><th class="text-right">Qtd</th><th class="text-right">Valor</th><th class="text-right">Desc.</th><th class="text-right">Subtotal</th><th>Status</th><th>Vendedor</th><th>Mecânico</th></tr></thead>
      <tbody>
        ${pecas.length === 0 ? '<tr><td colspan="10" style="text-align:center;color:#999;padding:12px">Nenhuma peça adicionada</td></tr>' :
          pecas.map((p: any, i: number) => {
            let vend = "—";
            let tec = "—";
            const val = p.tecnico || "";
            if (val.includes(" / ")) {
              const parts = val.split(" / ");
              vend = parts[0] || "—";
              tec = parts[1] || "—";
            } else if (val) {
              vend = val;
            }
            return `<tr>
              <td>${i + 1}</td>
              <td>${p.descricao}</td>
              <td>${p.detalhes || "—"}</td>
              <td class="text-right">${p.quantidade}</td>
              <td class="text-right">R$ ${fmtBRL(p.valor_unitario)}</td>
              <td class="text-right">${p.desconto ? `R$ ${fmtBRL(p.desconto)}` : "—"}</td>
              <td class="text-right">R$ ${fmtBRL(p.subtotal)}</td>
              <td><span class="badge-status ${p.status === 'concluido' ? 'badge-concluido' : 'badge-pendente'}">${p.status === 'concluido' ? 'Concluído' : 'Pendente'}</span></td>
              <td>${vend}</td>
              <td>${tec}</td>
            </tr>`;
          }).join("")}
        ${pecas.length > 0 ? `<tr class="total-row"><td colspan="6" class="text-right"><strong>Total Peças:</strong></td><td class="text-right"><strong>R$ ${fmtBRL(os.valor_total_pecas)}</strong></td><td colspan="3"></td></tr>` : ""}
      </tbody>
    </table>
  </div>
</div>

<!-- SERVIÇOS -->
<div class="section">
  <div class="section-title">🔧 Serviços/Mão de Obra</div>
  <div class="section-body" style="padding:0">
    <table>
      <thead><tr><th>#</th><th>Serviço</th><th>Det.</th><th class="text-right">Qtd</th><th class="text-right">Valor</th><th class="text-right">Desc.</th><th class="text-right">Subtotal</th><th>Status</th><th>Técnico</th></tr></thead>
      <tbody>
        ${servicos.length === 0 ? '<tr><td colspan="9" style="text-align:center;color:#999;padding:12px">Nenhum serviço adicionado</td></tr>' :
          servicos.map((s: any, i: number) => `<tr>
            <td>${i + 1}</td>
            <td>${s.descricao}</td>
            <td>${s.detalhes || "—"}</td>
            <td class="text-right">${s.quantidade}</td>
            <td class="text-right">R$ ${fmtBRL(s.valor_unitario)}</td>
            <td class="text-right">${s.desconto ? `R$ ${fmtBRL(s.desconto)}` : "—"}</td>
            <td class="text-right">R$ ${fmtBRL(s.subtotal)}</td>
            <td><span class="badge-status ${s.status === 'concluido' ? 'badge-concluido' : 'badge-pendente'}">${s.status === 'concluido' ? 'Concluído' : 'Pendente'}</span></td>
            <td>${s.tecnico || "—"}</td>
          </tr>`).join("")}
        ${servicos.length > 0 ? `<tr class="total-row"><td colspan="6" class="text-right"><strong>Total Serviços:</strong></td><td class="text-right"><strong>R$ ${fmtBRL(os.valor_total_servicos)}</strong></td><td colspan="2"></td></tr>` : ""}
      </tbody>
    </table>
  </div>
</div>

<!-- TOTAL -->
<div class="section">
  <div class="section-title">💰 Total</div>
  <div class="section-body">
    <div class="total-box">
      <div class="item"><label>Mão de Obra</label><p>R$ ${fmtBRL(os.valor_total_servicos)}</p></div>
      <div class="item"><label>Peças</label><p>R$ ${fmtBRL(os.valor_total_pecas)}</p></div>
      <div class="item"><label>Frete</label><p>R$ ${fmtBRL(os.valor_frete)}</p></div>
      <div class="item"><label>Outros</label><p>R$ ${fmtBRL(os.valor_outros)}</p></div>
      <div class="item"><label>Desconto</label><p>R$ ${fmtBRL(os.valor_desconto)}</p></div>
      <div class="item destaque"><label>Valor Total</label><p>R$ ${fmtBRL(os.valor_total)}</p></div>
    </div>
  </div>
</div>

<!-- CHECK DO VEÍCULO -->
${(() => {
  try {
    const clRaw = (os as any).checklist_revisao;
    const obsCheckin = (os as any).observacoes_checkin;
    if (!clRaw && !obsCheckin) return "";
    const cl = clRaw ? JSON.parse(clRaw) : [];
    const hasItems = cl.some((c: any) => c.itens?.some((i: any) => i.estado !== ""));
    if (!hasItems && !obsCheckin) return "";
    const totalBom = cl.reduce((s: number, c: any) => s + (c.itens?.filter((i: any) => i.estado === "bom").length || 0), 0);
    const totalSub = cl.reduce((s: number, c: any) => s + (c.itens?.filter((i: any) => i.estado === "substituir").length || 0), 0);
    let html = `<div class="section" style="page-break-inside:avoid">
      <div class="section-title">🔧 Check do Veículo
        <span style="margin-left:auto;font-weight:normal;font-size:10px;color:#555">
          ✓ Bom: ${totalBom} &nbsp;|&nbsp; ⚠ Substituir: ${totalSub}
        </span>
      </div>
      <div class="section-body">`;
    if (obsCheckin) {
      html += `<div style="margin-bottom:10px;padding:8px;background:#f8f9fa;border-radius:4px;border:1px solid #e5e7eb">
        <div style="font-size:10px;font-weight:600;color:#888;text-transform:uppercase;margin-bottom:3px">Observações do Check-in</div>
        <div style="font-size:11px">${obsCheckin}</div>
      </div>`;
    }
    if (hasItems) {
      html += `<table><thead><tr><th>Categoria</th><th>Item</th><th style="text-align:center">Estado</th></tr></thead><tbody>`;
      cl.forEach((cat: any) => {
        const filled = cat.itens?.filter((i: any) => i.estado !== "") || [];
        filled.forEach((item: any, idx: number) => {
          const badge = item.estado === "bom"
            ? '<span class="badge-status badge-concluido">Bom</span>'
            : '<span class="badge-status badge-pendente" style="background:#fee2e2;color:#dc2626">Substituir</span>';
          html += `<tr><td>${idx === 0 ? `<strong>${cat.categoria}</strong>` : ""}</td><td>${item.label}</td><td style="text-align:center">${badge}</td></tr>`;
        });
      });
      html += `</tbody></table>`;
    }
    html += `</div></div>`;
    return html;
  } catch { return ""; }
})()}

<!-- OBSERVAÇÕES -->
<div class="obs-grid">
  <div class="obs-box">
    <h4>📝 Observações</h4>
    <p>${os.observacoes || "—"}</p>
  </div>
  <div class="obs-box">
    <h4>🔒 Observações Internas</h4>
    <p>${os.observacoes_internas || "—"}</p>
  </div>
</div>

<!-- ASSINATURAS -->
<div class="footer">
  <div>
    <div class="sig">Responsável da Oficina</div>
    <p style="font-size:10px;color:#888;margin-top:2px">${loja?.cidade || ""}${loja?.estado ? `/${loja.estado}` : ""}, ${new Date().toLocaleDateString("pt-BR")}</p>
  </div>
  <div>
    <div class="sig">Cliente: ${os.cliente_nome || "________________"}</div>
  </div>
</div>

</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 300);
}
