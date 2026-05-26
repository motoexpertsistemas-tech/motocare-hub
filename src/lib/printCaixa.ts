import { supabase } from "@/integrations/supabase/client";

interface CaixaData {
  id: string;
  funcionario: string;
  aberto_em: string;
  fechado_em: string | null;
  saldo_abertura: number;
  saldo_fechamento: number | null;
  saldo: number;
  loja: string;
  status: string;
}

interface Movimentacao {
  id: string;
  tipo: string;
  valor: number;
  observacoes: string | null;
  criado_em: string;
}

const fmtMoney = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

const fmtDate = (d: string) => {
  try {
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR") + " " + date.toLocaleTimeString("pt-BR");
  } catch {
    return d;
  }
};

export async function printCaixa(caixa: CaixaData, movimentacoes: Movimentacao[]) {
  // Fetch configuracoes_loja
  const { data: config } = await supabase.from("configuracoes_loja").select("*").limit(1).single();

  const nomeEmpresa = config?.nome_fantasia || config?.razao_social || "EMPRESA";
  const cnpj = config?.cnpj || "";
  const telefone = config?.telefone || "";
  const email = config?.email || "";
  const endereco = [config?.logradouro, config?.numero, config?.bairro, config?.cidade, config?.estado]
    .filter(Boolean).join(", ");

  const sangrias = movimentacoes.filter(m => m.tipo === "sangria");
  const reforcos = movimentacoes.filter(m => m.tipo === "reforco");

  const totalSangrias = sangrias.reduce((s, m) => s + m.valor, 0);
  const totalReforcos = reforcos.reduce((s, m) => s + m.valor, 0);

  const movRows = (items: Movimentacao[], label: string) => {
    if (items.length === 0) return "";
    const rows = items.map(m => `
      <tr>
        <td>${m.observacoes || label}</td>
        <td class="money">${fmtMoney(m.valor)}</td>
        <td class="money">${fmtDate(m.criado_em)}</td>
      </tr>
    `).join("");
    const total = items.reduce((s, m) => s + m.valor, 0);
    return rows + `
      <tr class="total-row">
        <td><strong>Total</strong></td>
        <td class="money"><strong>${fmtMoney(total)}</strong></td>
        <td></td>
      </tr>
    `;
  };

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório do Caixa</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 15px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .header-left { font-weight: bold; font-size: 14px; }
    .header-right { text-align: right; font-size: 10px; }
    .info-table { width: 100%; margin-bottom: 15px; border-collapse: collapse; }
    .info-table td { padding: 2px 8px; }
    .info-table td:first-child { font-weight: bold; width: 120px; }
    h3 { font-size: 12px; margin: 12px 0 4px 0; padding-bottom: 2px; border-bottom: 1px solid #999; }
    table.data { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    table.data th { background: #f0f0f0; border: 1px solid #ccc; padding: 3px 6px; text-align: left; font-size: 10px; }
    table.data td { border: 1px solid #ccc; padding: 3px 6px; font-size: 10px; }
    table.data td.money { text-align: right; font-family: monospace; }
    .total-row { background: #f5f5f5; }
    .saldo-final { text-align: right; margin-top: 15px; font-size: 13px; font-weight: bold; border-top: 2px solid #000; padding-top: 6px; }
    @media print {
      body { padding: 0; }
      @page { margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">${nomeEmpresa}</div>
    <div class="header-right">
      ${telefone ? telefone + "<br>" : ""}
      ${email ? email : ""}
    </div>
  </div>

  <table class="info-table">
    <tr><td>Situação</td><td>${caixa.status === "aberto" ? "Aberto" : "Fechado"}</td></tr>
    <tr><td>Aberto em</td><td>${fmtDate(caixa.aberto_em)}</td></tr>
    <tr><td>Fechado em</td><td>${caixa.fechado_em ? fmtDate(caixa.fechado_em) : "—"}</td></tr>
    <tr><td>Saldo total</td><td>R$ ${fmtMoney(caixa.saldo)}</td></tr>
    <tr><td>Funcionário</td><td>${caixa.funcionario}</td></tr>
    <tr><td>Loja</td><td>${caixa.loja}</td></tr>
  </table>

  <h3>Movimentações de caixa</h3>

  ${caixa.saldo_abertura > 0 ? `
  <h4 style="font-size:11px;margin:6px 0 3px;">Abertura de caixa</h4>
  <table class="data">
    <thead><tr><th>Descrição</th><th>Valor</th><th>Data</th></tr></thead>
    <tbody>
      <tr>
        <td>Saldo de abertura</td>
        <td class="money">${fmtMoney(caixa.saldo_abertura)}</td>
        <td class="money">${fmtDate(caixa.aberto_em)}</td>
      </tr>
      <tr class="total-row">
        <td><strong>Total</strong></td>
        <td class="money"><strong>${fmtMoney(caixa.saldo_abertura)}</strong></td>
        <td></td>
      </tr>
    </tbody>
  </table>
  ` : ""}

  ${reforcos.length > 0 ? `
  <h4 style="font-size:11px;margin:6px 0 3px;">Reforços</h4>
  <table class="data">
    <thead><tr><th>Descrição</th><th>Valor</th><th>Data</th></tr></thead>
    <tbody>${movRows(reforcos, "Reforço")}</tbody>
  </table>
  ` : ""}

  ${sangrias.length > 0 ? `
  <h4 style="font-size:11px;margin:6px 0 3px;">Sangrias</h4>
  <table class="data">
    <thead><tr><th>Descrição</th><th>Valor</th><th>Data</th></tr></thead>
    <tbody>${movRows(sangrias, "Sangria")}</tbody>
  </table>
  ` : ""}

  ${movimentacoes.length === 0 && caixa.saldo_abertura === 0 ? `
  <p style="text-align:center;color:#666;padding:10px;">Nenhuma movimentação registrada</p>
  ` : ""}

  <h3>Resumo</h3>
  <table class="data">
    <thead><tr><th>Descrição</th><th>Valor</th></tr></thead>
    <tbody>
      <tr><td>Saldo de abertura</td><td class="money">${fmtMoney(caixa.saldo_abertura)}</td></tr>
      <tr><td>Total reforços (+)</td><td class="money">${fmtMoney(totalReforcos)}</td></tr>
      <tr><td>Total sangrias (−)</td><td class="money">${fmtMoney(totalSangrias)}</td></tr>
      <tr class="total-row">
        <td><strong>Saldo final</strong></td>
        <td class="money"><strong>${fmtMoney(caixa.saldo)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="saldo-final">Saldo real no caixa: R$ ${fmtMoney(caixa.saldo)}</div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
