export function printNFeMarketplace(pedido: any) {
  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
  const itensHtml = itens
    .map(
      (item: any, i: number) => `
      <tr>
        <td style="padding:3px 6px;border-bottom:1px solid #eee;">${i + 1}</td>
        <td style="padding:3px 6px;border-bottom:1px solid #eee;">${item.nome || item.produto || "-"}</td>
        <td style="padding:3px 6px;border-bottom:1px solid #eee;text-align:center;">${item.quantidade || 1}</td>
        <td style="padding:3px 6px;border-bottom:1px solid #eee;text-align:right;">R$ ${(item.preco_unitario || item.valor || 0).toFixed(2)}</td>
        <td style="padding:3px 6px;border-bottom:1px solid #eee;text-align:right;">R$ ${((item.quantidade || 1) * (item.preco_unitario || item.valor || 0)).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>NF-e ${pedido.numero_pedido}</title>
  <style>
    @page{margin:10mm;size:A4;}
    body{font-family:Arial,sans-serif;font-size:11px;color:#333;margin:0;padding:20px;}
    .header{display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px;}
    .section{margin-bottom:12px;}
    .section-title{font-weight:bold;font-size:12px;border-bottom:1px solid #ccc;padding-bottom:3px;margin-bottom:6px;}
    table{width:100%;border-collapse:collapse;font-size:10px;}
    th{background:#f0f0f0;padding:4px 6px;text-align:left;border-bottom:2px solid #ccc;}
    .total-row{font-weight:bold;font-size:12px;}
  </style></head><body>
    <div class="header">
      <div>
        <h2 style="margin:0;font-size:16px;">NOTA FISCAL ELETRÔNICA</h2>
        <p style="margin:2px 0;font-size:10px;color:#666;">Documento auxiliar - Marketplace</p>
      </div>
      <div style="text-align:right;">
        <p style="margin:0;font-weight:bold;">Pedido: ${pedido.numero_pedido}</p>
        <p style="margin:0;font-size:10px;">${new Date(pedido.data_pedido).toLocaleDateString("pt-BR")}</p>
        <p style="margin:2px 0;font-size:10px;text-transform:capitalize;">${(pedido.marketplace || "").replace("_", " ")}</p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">DESTINATÁRIO</div>
      <p style="margin:2px 0;"><strong>${pedido.cliente_nome || ""}</strong></p>
      <p style="margin:2px 0;">${pedido.cliente_cpf_cnpj ? "CPF/CNPJ: " + pedido.cliente_cpf_cnpj : ""}</p>
      <p style="margin:2px 0;">${pedido.logradouro || ""}, ${pedido.numero || "S/N"}${pedido.complemento ? " - " + pedido.complemento : ""} - ${pedido.bairro || ""}</p>
      <p style="margin:2px 0;">${pedido.cidade || ""} - ${pedido.estado || ""} - CEP: ${pedido.cep || ""}</p>
      ${pedido.cliente_telefone ? `<p style="margin:2px 0;">Tel: ${pedido.cliente_telefone}</p>` : ""}
    </div>

    <div class="section">
      <div class="section-title">ITENS</div>
      <table>
        <thead><tr><th>#</th><th>Produto</th><th style="text-align:center;">Qtd</th><th style="text-align:right;">Unit.</th><th style="text-align:right;">Total</th></tr></thead>
        <tbody>${itensHtml}</tbody>
      </table>
    </div>

    <div class="section" style="text-align:right;">
      <p>Produtos: <strong>R$ ${(pedido.valor_produtos || 0).toFixed(2)}</strong></p>
      <p>Frete: <strong>R$ ${(pedido.valor_frete || 0).toFixed(2)}</strong></p>
      <p>Taxa Marketplace: <strong>R$ ${(pedido.taxa_marketplace || 0).toFixed(2)}</strong></p>
      <p class="total-row" style="font-size:14px;margin-top:6px;">TOTAL: R$ ${(pedido.valor_total || 0).toFixed(2)}</p>
    </div>

    ${pedido.nfe_chave ? `<div class="section"><div class="section-title">CHAVE DE ACESSO</div><p style="font-family:monospace;font-size:10px;word-break:break-all;">${pedido.nfe_chave}</p></div>` : ""}

    <div style="margin-top:20px;text-align:center;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:8px;">
      Documento gerado automaticamente pelo sistema ERP
    </div>
  </body></html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
  }
}
