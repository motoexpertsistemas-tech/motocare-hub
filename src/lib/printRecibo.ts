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
};

async function getLojaConfig(): Promise<LojaConfig | null> {
  const { data } = await supabase
    .from("configuracoes_loja")
    .select("*")
    .limit(1)
    .single();
  return data as LojaConfig | null;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface ReciboData {
  tipo: "pagamento" | "recebimento";
  numero: number;
  descricao: string;
  entidade: string;
  entidadeCnpjCpf?: string;
  entidadeEndereco?: string;
  entidadeCidade?: string;
  entidadeEmail?: string;
  entidadeTelefone?: string;
  formaPagamento: string;
  contaBancaria: string;
  valor: number;
  valorBruto: number;
  desconto: number;
  juros: number;
  dataVencimento: string;
  dataConfirmacao: string;
  confirmadoPor: string;
  cadastradoPor: string;
  parcelas?: { descricao: string; emissao: string; parcela: string; valor: number }[];
}

export async function printRecibo(recibo: ReciboData) {
  const loja = await getLojaConfig();
  if (!loja) return;

  const endereco = [loja.logradouro, loja.numero, loja.bairro].filter(Boolean).join(", ");
  const cidadeEstado = [loja.cidade, loja.estado].filter(Boolean).join(" - ");
  const cepStr = loja.cep ? `CEP: ${loja.cep}` : "";
  const telefones = [loja.telefone, loja.telefone2].filter(Boolean).join(" / ");

  const tipoLabel = recibo.tipo === "pagamento" ? "PAGAMENTO" : "RECEBIMENTO";
  const viaLabel1 = recibo.tipo === "pagamento" ? "VIA DO FORNECEDOR" : "VIA DO CLIENTE";
  const viaLabel2 = "VIA DA EMPRESA";

  const totalPagamento = formatBRL(recibo.valor);

  const titulosRows = (recibo.parcelas && recibo.parcelas.length > 0)
    ? recibo.parcelas.map(p =>
        `<tr>
          <td>${p.descricao}</td>
          <td class="center">${p.emissao}</td>
          <td class="center">${p.parcela}</td>
          <td class="right">R$ ${formatBRL(p.valor)}</td>
        </tr>`
      ).join("")
    : `<tr>
        <td>${recibo.descricao}</td>
        <td class="center">${recibo.dataVencimento}</td>
        <td class="center">1/1</td>
        <td class="right">R$ ${formatBRL(recibo.valor)}</td>
      </tr>`;

  const totalTitulos = recibo.parcelas && recibo.parcelas.length > 0
    ? recibo.parcelas.reduce((s, p) => s + p.valor, 0)
    : recibo.valor;

  const buildVia = (viaLabel: string) => `
    <div class="via">
      <div class="header-box">
        <div class="company-info">
          <div class="company-name">${loja.razao_social}</div>
          <div>CNPJ: ${loja.cnpj}</div>
          <div>${endereco}</div>
          <div>${cidadeEstado} ${cepStr}</div>
          <div>Tel: ${telefones}</div>
          ${loja.email ? `<div>E-mail: ${loja.email}</div>` : ""}
        </div>
        <div class="doc-badge">
          <div class="via-label">${viaLabel}</div><br>
          <div class="doc-title">${tipoLabel} Nº ${String(recibo.numero).padStart(5, "0")}</div>
        </div>
      </div>

      <div class="section-title">FORNECEDOR / CLIENTE</div>
      <div class="entity-box">
        <div class="entity-row">
          <span><strong>Nome:</strong> ${recibo.entidade}</span>
          ${recibo.entidadeCnpjCpf ? `<span><strong>CNPJ/CPF:</strong> ${recibo.entidadeCnpjCpf}</span>` : ""}
        </div>
        ${recibo.entidadeEndereco ? `<div class="entity-row"><span><strong>Endereço:</strong> ${recibo.entidadeEndereco}</span></div>` : ""}
        <div class="entity-row">
          ${recibo.entidadeCidade ? `<span><strong>Cidade:</strong> ${recibo.entidadeCidade}</span>` : ""}
          ${recibo.entidadeEmail ? `<span><strong>E-mail:</strong> ${recibo.entidadeEmail}</span>` : ""}
          ${recibo.entidadeTelefone ? `<span><strong>Tel:</strong> ${recibo.entidadeTelefone}</span>` : ""}
        </div>
      </div>

      <div class="section-title">FORMAS DE PAGAMENTO</div>
      <table class="payment-table">
        <thead>
          <tr><th>Forma</th><th class="right">Valor</th><th class="center">Data</th><th>Conta</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>${recibo.formaPagamento}</td>
            <td class="right">R$ ${totalPagamento}</td>
            <td class="center">${recibo.dataConfirmacao || recibo.dataVencimento}</td>
            <td>${recibo.contaBancaria}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr><td colspan="3" class="right"><strong>Total do Pagamento:</strong></td><td class="right"><strong>R$ ${totalPagamento}</strong></td></tr>
        </tfoot>
      </table>

      <div class="section-title">TÍTULOS PAGOS</div>
      <table class="titles-table">
        <thead>
          <tr><th>Descrição</th><th class="center">Emissão</th><th class="center">Parcela</th><th class="right">Valor</th></tr>
        </thead>
        <tbody>
          ${titulosRows}
        </tbody>
        <tfoot>
          <tr><td colspan="3" class="right"><strong>Total de Títulos:</strong></td><td class="right"><strong>R$ ${formatBRL(totalTitulos)}</strong></td></tr>
        </tfoot>
      </table>

      <div class="signatures">
        <div class="sig-block">
          <div class="sig-label">${[loja.cidade, loja.estado].filter(Boolean).join("/")}, ${new Date().toLocaleDateString("pt-BR")}</div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-label">${recibo.entidade}</div>
          <div class="sig-sub">Assinatura do ${recibo.tipo === "pagamento" ? "Fornecedor" : "Cliente"}</div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-label">${loja.razao_social}</div>
          <div class="sig-sub">Assinatura da Empresa</div>
        </div>
      </div>

      <div class="footer-info">
        <span>Emitido em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} | Página 1 de 1</span>
        <span>Confirmado por: ${recibo.confirmadoPor || "—"} | Cadastrado por: ${recibo.cadastradoPor || "—"}</span>
      </div>
    </div>
  `;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { margin: 8mm 10mm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; line-height: 1.4; }

  .via { border: 2px solid #000; padding: 12px 14px; margin-bottom: 6px; position: relative; page-break-inside: avoid; }

  .header-box { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 3px solid #000; }
  .company-info { font-size: 10px; line-height: 1.6; }
  .company-name { font-size: 16px; font-weight: bold; margin-bottom: 3px; letter-spacing: 0.3px; }
  .doc-badge { text-align: right; }
  .via-label { display: inline-block; font-size: 10px; font-weight: bold; background: #4CAF50; color: #fff; padding: 4px 12px; border: 2px solid #2E7D32; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .doc-title { font-size: 13px; font-weight: bold; background: #4CAF50; color: #fff; padding: 4px 12px; border: 2px solid #2E7D32; display: inline-block; }

  .section-title { background: #222; color: #fff; font-weight: bold; font-size: 10px; padding: 4px 10px; margin: 8px 0 6px; text-transform: uppercase; letter-spacing: 0.8px; }

  .entity-box { font-size: 11px; line-height: 1.8; padding: 6px 0; border-bottom: 1px solid #999; }
  .entity-row { display: flex; gap: 24px; flex-wrap: wrap; }

  table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 6px; }
  th { background: #e0e0e0; border: 1px solid #888; padding: 5px 8px; font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
  td { border: 1px solid #bbb; padding: 5px 8px; }
  tfoot td { border: none; padding: 5px 8px; font-size: 10px; background: #f5f5f5; }
  .right { text-align: right; }
  .center { text-align: center; }

  .signatures { display: flex; justify-content: space-between; margin-top: 30px; gap: 20px; }
  .sig-block { flex: 1; text-align: center; }
  .sig-line { border-top: 1px solid #000; margin: 0 10px; padding-top: 6px; }
  .sig-label { font-size: 9px; font-weight: bold; margin-top: 3px; }
  .sig-sub { font-size: 8px; color: #444; margin-top: 1px; }

  .footer-info { display: flex; justify-content: space-between; font-size: 8px; color: #555; margin-top: 10px; padding-top: 6px; border-top: 1px dotted #aaa; }

  .cut-line { border: none; border-top: 2px dashed #999; margin: 6px 0; position: relative; }
  .cut-label { position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background: #fff; padding: 0 10px; font-size: 8px; color: #999; }
</style></head><body>

  ${buildVia(viaLabel1)}

  <div style="position:relative; margin: 6px 0;">
    <hr class="cut-line">
    <span class="cut-label">✂ CORTE AQUI</span>
  </div>

  ${buildVia(viaLabel2)}

</body></html>`;

  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}
