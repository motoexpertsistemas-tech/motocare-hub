import { supabase } from "@/integrations/supabase/client";

interface ChecklistItem {
  label: string;
  estado: "bom" | "substituir" | "";
}

interface ChecklistCategory {
  categoria: string;
  itens: ChecklistItem[];
}

interface PrintChecklistParams {
  checklist: ChecklistCategory[];
  observacoes?: string;
  placa?: string;
  clienteNome?: string;
  numeroOS?: string;
  fotos?: (File | string | null)[];
  imprimirFotos?: boolean;
}

export async function printChecklist({ 
  checklist, 
  observacoes, 
  placa, 
  clienteNome, 
  numeroOS,
  fotos,
  imprimirFotos = true
}: PrintChecklistParams) {
  // Fetch company info
  const { data: loja } = await supabase.from("configuracoes_loja").select("*").limit(1).maybeSingle();

  const totalBom = checklist.reduce((s, c) => s + c.itens.filter(i => i.estado === "bom").length, 0);
  const totalSubstituir = checklist.reduce((s, c) => s + c.itens.filter(i => i.estado === "substituir").length, 0);

  const w = window.open("", "_blank");
  if (!w) return;

  const categoriasHtml = checklist.map(cat => {
    const itensComEstado = cat.itens.filter(i => i.estado !== "");
    if (itensComEstado.length === 0) return "";
    return `
      <div class="section">
        <div class="section-title">${cat.categoria}</div>
        <div class="section-body">
          <table>
            <thead><tr><th>Item</th><th class="text-right" style="width:120px">Estado</th></tr></thead>
            <tbody>
              ${itensComEstado.map(item => `
                <tr>
                  <td>${item.label}</td>
                  <td class="text-right">
                    <span class="badge-${item.estado}">${item.estado === "bom" ? "✓ Bom" : "⚠ Substituir"}</span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).filter(Boolean).join("");

  let fotosHtml = "";
  if (imprimirFotos !== false && Array.isArray(fotos) && fotos.some(f => f !== null)) {
    const FOTOS_LABELS = ["Frente", "Traseira", "Lateral Esq.", "Lateral Dir.", "Outros 1", "Outros 2", "Outros 3", "Outros 4"];
    fotosHtml = `
      <div class="section" style="page-break-inside:avoid; margin-top:10px">
        <div class="section-title">Fotos do Check-in</div>
        <div class="section-body" style="padding:8px">
          <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px">
            ${fotos.map((f, idx) => {
              if (!f) return "";
              const label = FOTOS_LABELS[idx];
              const isUrl = typeof f === "string";
              const src = isUrl ? (f as string) : URL.createObjectURL(f as File);
              return `
                <div style="text-align:center; border:1px solid #e5e7eb; border-radius:4px; padding:3px; background:#f8f9fa">
                  <img src="${src}" style="width:100%; aspect-ratio:1; object-fit:cover; border-radius:2px" />
                  <div style="font-size:8px; font-weight:600; color:#555; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${label}</div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;
  }

  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Check do Veículo${numeroOS ? ` - OS ${numeroOS}` : ""}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;padding:25px 30px;color:#222;font-size:12px;line-height:1.5}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #DC2626;padding-bottom:12px;margin-bottom:15px}
  .header h1{font-size:18px;color:#DC2626;margin-bottom:2px}
  .header .empresa{font-size:11px;color:#555}
  .header .info{text-align:right}
  .header .info .title{font-size:16px;font-weight:bold;color:#DC2626}
  .header .info .sub{font-size:11px;color:#555;margin-top:2px}
  .section{margin-bottom:10px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden}
  .section-title{background:#f8f9fa;padding:7px 12px;font-weight:bold;font-size:11px;color:#333;border-bottom:1px solid #e5e7eb;text-transform:uppercase;letter-spacing:0.5px}
  .section-body{padding:4px 0}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#f8f9fa;padding:5px 12px;text-align:left;font-weight:600;border-bottom:1px solid #e5e7eb;font-size:10px;text-transform:uppercase;color:#666}
  td{padding:5px 12px;border-bottom:1px solid #f0f0f0}
  tr:last-child td{border-bottom:none}
  .text-right{text-align:right}
  .badge-bom{display:inline-block;background:#dcfce7;color:#16a34a;padding:2px 10px;border-radius:10px;font-size:10px;font-weight:600}
  .badge-substituir{display:inline-block;background:#fee2e2;color:#dc2626;padding:2px 10px;border-radius:10px;font-size:10px;font-weight:600}
  .summary{display:flex;gap:20px;margin-top:12px;padding:10px 0;border-top:2px solid #e5e7eb}
  .summary span{font-size:13px;font-weight:600}
  .summary .bom{color:#16a34a}
  .summary .sub{color:#dc2626}
  .obs{margin-top:10px;border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px}
  .obs h4{font-size:10px;color:#888;text-transform:uppercase;margin-bottom:4px;font-weight:600}
  .obs p{font-size:11px;color:#444}
  .footer{margin-top:20px;border-top:2px solid #e5e7eb;padding-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:40px;text-align:center}
  .footer .sig{border-top:1px solid #333;padding-top:4px;margin-top:40px;font-size:11px}
  @media print{body{padding:15px 20px}@page{margin:10mm}.section{page-break-inside:avoid}}
</style></head><body>

<div class="header">
  <div>
    <h1>${loja?.nome_fantasia || "Empresa"}</h1>
    <div class="empresa">
      ${loja?.cnpj ? `CNPJ: ${loja.cnpj}` : ""}
      ${loja?.telefone ? ` | Tel: ${loja.telefone}` : ""}
      ${loja?.logradouro ? `<br>${loja.logradouro}${loja.numero ? `, ${loja.numero}` : ""}${loja.bairro ? ` - ${loja.bairro}` : ""}` : ""}
      ${loja?.cidade ? ` - ${loja.cidade}/${loja.estado || ""}` : ""}
    </div>
  </div>
  <div class="info">
    <div class="title">CHECK DO VEÍCULO</div>
    ${numeroOS ? `<div class="sub">OS: ${numeroOS}</div>` : ""}
    <div class="sub">${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
  </div>
</div>

${placa || clienteNome ? `
<div class="section">
  <div class="section-body" style="padding:8px 12px">
    <div style="display:flex;gap:30px">
      ${placa ? `<div><strong style="font-size:10px;color:#888;text-transform:uppercase">Placa</strong><p style="font-size:14px;font-weight:bold">${placa}</p></div>` : ""}
      ${clienteNome ? `<div><strong style="font-size:10px;color:#888;text-transform:uppercase">Cliente</strong><p style="font-size:13px;font-weight:500">${clienteNome}</p></div>` : ""}
    </div>
  </div>
</div>
` : ""}

${categoriasHtml}

${observacoes ? `<div class="obs"><h4>Observações do Check-in</h4><p>${observacoes}</p></div>` : ""}

<div class="summary">
  <span class="bom">✓ Bom: ${totalBom}</span>
  <span class="sub">⚠ Substituir: ${totalSubstituir}</span>
</div>

${fotosHtml}

<div class="footer">
  <div><div class="sig">Mecânico Responsável</div></div>
  <div><div class="sig">${clienteNome || "Cliente"}</div></div>
</div>

</body></html>`);

  w.document.close();
  setTimeout(() => w.print(), 400);
}
