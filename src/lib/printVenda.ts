import { supabase } from "@/integrations/supabase/client";

type LojaConfig = {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  telefone: string;
  telefone2: string | null;
  email: string | null;
  website: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  operador_padrao: string | null;
  mensagem_cupom: string | null;
  prazo_troca_dias: number | null;
};

type VendaItem = {
  codigo: string;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
  subtotal: number;
};

type PagamentoDetalhe = {
  forma: string;
  valor: number;
  parcelas?: number;
};

type VendaData = {
  numero: number;
  data: string;
  hora: string;
  cliente: string;
  cliente_cpf?: string;
  cliente_endereco?: string;
  cliente_cidade?: string;
  cliente_estado?: string;
  cliente_cep?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  itens: VendaItem[];
  total: number;
  forma_pagamento: string;
  pagamentos?: PagamentoDetalhe[];
  vendedor: string;
};

async function getLojaConfig(): Promise<LojaConfig | null> {
  const { data } = await supabase
    .from("configuracoes_loja")
    .select("*")
    .limit(1)
    .single();
  return data as LojaConfig | null;
}

function openPrintWindow(html: string) {
  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// ─── CUPOM (térmica 80mm) ────────────────────────────────
export async function printCupom(venda: VendaData) {
  const loja = await getLojaConfig();
  if (!loja) return;

  const endereco = [loja.logradouro, loja.numero, loja.bairro].filter(Boolean).join(", ");
  const cidadeEstado = [loja.cidade, loja.estado].filter(Boolean).join(" - ");

  const itensRows = venda.itens.map(
    (i) =>
      `<tr>
        <td>${i.codigo}</td>
        <td class="desc-col">${i.nome}</td>
        <td class="right">${Number.isInteger(i.quantidade) ? i.quantidade : formatBRL(i.quantidade)}</td>
        <td class="right">${formatBRL(i.valor_unitario)}</td>
        <td class="right">${i.desconto > 0 ? formatBRL(i.desconto) : "-"}</td>
        <td class="right bold">${formatBRL(i.subtotal)}</td>
      </tr>`
  ).join("");

  const totalItens = venda.itens.reduce((sum, i) => sum + i.quantidade, 0);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { margin: 0; size: 80mm auto; }
  * { box-sizing: border-box; }
  body { font-family: 'Courier New', Consolas, monospace; font-size: 12px; width: 72mm; margin: 4mm auto; color: #000; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .header { text-align: center; padding-bottom: 8px; }
  .header h2 { margin: 0; font-size: 16px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
  .header .fantasia { font-size: 13px; font-weight: bold; margin: 3px 0; }
  .header p { margin: 2px 0; font-size: 10px; color: #000; }
  .divider { border: none; border-top: 1px dashed #000; margin: 8px 0; }
  .divider-double { border: none; border-top: 2px solid #000; margin: 8px 0; }
  .section-title { text-align: center; font-weight: bold; font-size: 12px; margin: 6px 0 4px; letter-spacing: 0.5px; background: #eee; padding: 4px 0; border-top: 1px solid #000; border-bottom: 1px solid #000; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { text-align: left; font-weight: bold; border-bottom: 2px solid #000; padding: 4px 2px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.3px; }
  td { padding: 4px 2px; border-bottom: 1px dotted #999; vertical-align: top; }
  .desc-col { max-width: 120px; word-wrap: break-word; overflow-wrap: break-word; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .total-box { background: #000; color: #fff; padding: 8px 10px; margin: 8px 0; display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 900; letter-spacing: 0.5px; }
  .payment-row { display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0; border-bottom: 1px dotted #999; }
  .footer { text-align: center; font-size: 10px; color: #000; margin-top: 10px; }
  .footer .msg { font-size: 13px; font-weight: 900; color: #000; margin: 8px 0; letter-spacing: 0.5px; }
  .info-row { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
  .items-summary { font-size: 10px; color: #333; margin-top: 4px; padding: 2px 0; border-top: 1px dotted #999; display: flex; justify-content: space-between; }
</style></head><body>

  <div class="header">
    <h2>${loja.razao_social}</h2>
    ${loja.nome_fantasia && loja.nome_fantasia !== loja.razao_social ? `<div class="fantasia">${loja.nome_fantasia}</div>` : ""}
    <p>CNPJ: ${loja.cnpj}</p>
    <p>${endereco}</p>
    <p>${cidadeEstado}${loja.cep ? " - CEP: " + loja.cep : ""}</p>
    <p>Tel: ${loja.telefone}${loja.telefone2 ? " / " + loja.telefone2 : ""}</p>
    ${loja.email ? `<p>${loja.email}</p>` : ""}
  </div>

  <hr class="divider-double">

  <div class="section-title">PEDIDO Nº ${venda.numero}</div>
  <div class="info-row"><span>Data: ${venda.data}</span><span>Hora: ${venda.hora}</span></div>
  <div class="info-row"><span>Cliente: ${venda.cliente}</span></div>
  <div class="info-row"><span>Operador: ${loja.operador_padrao || venda.vendedor}</span></div>

  <hr class="divider">

  <div class="section-title">ITENS DO PEDIDO</div>
  <table>
    <tr><th>CÓD</th><th>DESCRIÇÃO</th><th class="right">QTD</th><th class="right">UNIT</th><th class="right">DESC</th><th class="right">TOTAL</th></tr>
    ${itensRows}
  </table>
  <div class="items-summary">
    <span>Total de itens: ${totalItens}</span>
    <span>Subtotal: R$ ${formatBRL(venda.itens.reduce((s, i) => s + i.subtotal, 0))}</span>
  </div>

  <div class="total-box">
    <span>TOTAL</span>
    <span>R$ ${formatBRL(venda.total)}</span>
  </div>

  <div class="section-title">PAGAMENTO</div>
  ${(venda.pagamentos && venda.pagamentos.length > 0
    ? venda.pagamentos.map(p =>
        `<div class="payment-row">
          <span>${p.forma}${p.parcelas && p.parcelas > 1 ? ` ${p.parcelas}x de R$ ${formatBRL(p.valor / p.parcelas)}` : ""}</span>
          <span class="bold">R$ ${formatBRL(p.valor)}</span>
        </div>`
      ).join("")
    : `<div class="payment-row">
        <span>${venda.forma_pagamento}</span>
        <span class="bold">R$ ${formatBRL(venda.total)}</span>
      </div>`
  )}

  <hr class="divider">

  <div class="footer">
    <p>*** Este cupom não é documento fiscal ***</p>
    <hr class="divider">
    <p class="bold" style="font-size:11px">POLÍTICA DE TROCAS</p>
    <p>Trocas ou devoluções em até <strong>${loja.prazo_troca_dias || 7} dias</strong> corridos<br>após o recebimento do produto.</p>
    <p>Solicitações fora do prazo não serão aceitas.</p>
    <hr class="divider">
    <p class="msg">${loja.mensagem_cupom || "OBRIGADO E VOLTE SEMPRE!"}</p>
  </div>

</body></html>`;

  openPrintWindow(html);
}

// ─── FORMATO A4 ──────────────────────────────────────────
export async function printA4(venda: VendaData) {
  const loja = await getLojaConfig();
  if (!loja) return;

  const endereco = [loja.logradouro, loja.numero, "-", loja.bairro].filter(Boolean).join(" ");
  const cidadeEstado = [loja.cidade, "/", loja.estado, "-", "CEP:", loja.cep].filter(Boolean).join(" ");

  const itensRows = venda.itens.map(
    (i, idx) =>
      `<tr>
        <td>${idx + 1}</td>
        <td>${i.codigo}</td>
        <td>${i.nome}</td>
        <td class="right">${formatBRL(i.quantidade)}</td>
        <td class="right">${formatBRL(i.valor_unitario)}</td>
        <td class="right">${formatBRL(i.subtotal)}</td>
      </tr>`
  ).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { margin: 20mm; size: A4; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; max-width: 700px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
  .header-left { font-size: 11px; }
  .header-right { text-align: right; font-size: 11px; }
  h1 { font-size: 18px; margin: 10px 0; }
  h2 { font-size: 14px; margin: 16px 0 8px; background: #f5f5f5; padding: 4px 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 11px; }
  th { background: #f0f0f0; font-weight: bold; }
  .right { text-align: right; }
  .total-row { font-weight: bold; font-size: 13px; }
  .info-grid { display: grid; grid-template-columns: 100px 1fr; gap: 4px; font-size: 11px; margin-bottom: 12px; }
  .info-label { font-weight: bold; }
  .signature { margin-top: 60px; text-align: center; }
  .signature-line { border-top: 1px solid #000; width: 300px; margin: 0 auto; padding-top: 4px; }
  .big-name { font-size: 22px; font-weight: bold; }
</style></head><body>
  <div class="header">
    <div class="header-left">
      <span class="big-name">${loja.nome_fantasia}</span><br>
      ${loja.razao_social}<br>
      CNPJ: ${loja.cnpj}<br>
      ${endereco}<br>
      ${cidadeEstado}
    </div>
    <div class="header-right">
      ${loja.telefone}${loja.telefone2 ? " - " + loja.telefone2 : ""}<br>
      ${loja.email || ""}<br>
      ${loja.website || ""}<br>
      Vendedor: ${venda.vendedor}
    </div>
  </div>

  <h1>PEDIDO Nº ${venda.numero}</h1>
  <p>Data: ${venda.data} &nbsp;&nbsp; PRAZO DE ENTREGA: ${venda.data}</p>

  <h2>DADOS DO CLIENTE</h2>
  <div class="info-grid">
    <span class="info-label">Cliente:</span><span>${venda.cliente}</span>
    <span class="info-label">CNPJ/CPF:</span><span>${venda.cliente_cpf || ""}</span>
    <span class="info-label">Endereço:</span><span>${venda.cliente_endereco || ""}</span>
    <span class="info-label">CEP:</span><span>${venda.cliente_cep || ""}</span>
    <span class="info-label">Cidade:</span><span>${venda.cliente_cidade || ""}</span>
    <span class="info-label">Estado:</span><span>${venda.cliente_estado || ""}</span>
    <span class="info-label">Telefone:</span><span>${venda.cliente_telefone || ""}</span>
    <span class="info-label">E-mail:</span><span>${venda.cliente_email || ""}</span>
  </div>

  <h2>PRODUTOS</h2>
  <table>
    <tr><th>ITEM</th><th>CÓDIGO</th><th>NOME</th><th class="right">QTD.</th><th class="right">VR. UNIT.</th><th class="right">SUBTOTAL</th></tr>
    ${itensRows}
  </table>
  <table>
    <tr class="total-row"><td colspan="5" class="right">TOTAL:</td><td class="right">R$ ${formatBRL(venda.total)}</td></tr>
  </table>

  <h2>DADOS DO PAGAMENTO</h2>
  <table>
    <tr><th>VENCIMENTO</th><th class="right">VALOR</th><th>FORMA DE PAGAMENTO</th><th>OBSERVAÇÃO</th></tr>
    <tr><td>${venda.data}</td><td class="right">${formatBRL(venda.total)}</td><td>${venda.forma_pagamento}</td><td></td></tr>
  </table>

  <div class="signature">
    <div class="signature-line">Assinatura do cliente</div>
  </div>
  <p style="text-align:center; font-size:9px; color:#999; margin-top:30px">Pedido emitido no sistema</p>
</body></html>`;

  openPrintWindow(html);
}

// ─── CUPOM PRESENTE (sem valores) ────────────────────────
export async function printCupomPresente(venda: VendaData) {
  const loja = await getLojaConfig();
  if (!loja) return;

  const endereco = [loja.logradouro, loja.numero, loja.bairro].filter(Boolean).join(", ");
  const cidadeEstado = [loja.cep, "-", loja.cidade, loja.estado].filter(Boolean).join(" ");

  const itensRows = venda.itens.map(
    (i) => `<tr><td>${i.codigo}</td><td>${i.nome}</td><td class="right">${formatBRL(i.quantidade)}</td></tr>`
  ).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { margin: 0; size: 80mm auto; }
  body { font-family: monospace; font-size: 11px; width: 72mm; margin: 4mm auto; color: #000; }
  h2 { text-align: center; margin: 0; font-size: 14px; }
  .center { text-align: center; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th, td { padding: 2px 0; }
  th { text-align: left; border-bottom: 1px solid #000; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
</style></head><body>
  <h2>${loja.razao_social}</h2>
  <p class="center" style="font-size:10px; margin:2px 0">
    CNPJ: ${loja.cnpj}<br>
    ${endereco}<br>
    ${cidadeEstado}<br>
    ${loja.telefone}${loja.telefone2 ? " - " + loja.telefone2 : ""}
  </p>
  <p class="center" style="font-size:10px">Operador: ${loja.operador_padrao || venda.vendedor}</p>
  <div class="line"></div>
  <p class="center bold">CUPOM DE PRESENTE</p>
  <p>Data: ${venda.data} &nbsp;&nbsp;&nbsp; Hora: ${venda.hora}<br>
  Cliente: ${venda.cliente}<br>
  Pedido nº: ${venda.numero}<br>
  Tipo: Balcão</p>
  <div class="line"></div>
  <p class="center bold">PRODUTOS</p>
  <table>
    <tr><th>CÓD</th><th>NOME</th><th class="right">QTD.</th></tr>
    ${itensRows}
  </table>
  <div class="line"></div>
  <p class="center" style="font-size:10px">*** Este cupom não é documento fiscal ***</p>
  <div class="line"></div>
  <p class="center bold">Prazo de efetivação da troca</p>
  <p class="center" style="font-size:9px">Troca ou reembolso devem ser comunicadas em até ${loja.prazo_troca_dias || 7} (sete) dias corridos após o recebimento do produto.</p>
  <p class="center" style="font-size:9px">Solicitações feitas fora do prazo não serão aceitas.</p>
  <div class="line"></div>
  <p class="center bold">${loja.mensagem_cupom || "OBRIGADO E VOLTE SEMPRE!"}</p>
  <div class="signature" style="margin-top:30px; text-align:center">
    <div style="border-top:1px solid #000; width:60%; margin:0 auto; padding-top:4px; font-size:10px">Assinatura do vendedor</div>
  </div>
  <p class="center" style="font-size:8px; color:#666; margin-top:10px">Software GestãoClick – www.gestaoclick.com.br</p>
</body></html>`;

  openPrintWindow(html);
}
