export function printEtiquetaEnvio(pedidos: any[]) {
  const pages = pedidos
    .map((p) => {
      const marketplace = (p.marketplace || "").replace(/_/g, " ").toUpperCase();
      const rastreio = p.codigo_rastreio || "";
      const numeroPedido = p.numero_pedido || "";
      let rawItens = p.itens;
      if (typeof rawItens === "string") {
        try { rawItens = JSON.parse(rawItens); } catch { rawItens = []; }
      }
      const itens: { nome: string; quantidade: number; preco_unitario: number; valor_unitario?: number; codigo?: string; sku?: string; variacao?: string }[] =
        Array.isArray(rawItens) ? rawItens : [];
      const emptyRows = Math.max(0, 3 - itens.length);
      const emptyRowsHtml = Array(emptyRows).fill(`<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>`).join("");

      // PAGE 1: Etiqueta de Envio
      const etiqueta = `
      <div class="page etiqueta">
        <div class="top-bar">
          <div class="top-left">
            <span class="label-small">REMETENTE</span>
            <span class="nome-rem">${p.remetente_nome || "MINHA LOJA LTDA"}</span>
            <span class="end-rem">${p.remetente_logradouro || ""}, ${p.remetente_numero || "S/N"}</span>
            <span class="end-rem">${p.remetente_bairro || ""} – ${p.remetente_cidade || ""}/${p.remetente_estado || ""}</span>
            <span class="end-rem">CEP: ${p.remetente_cep || ""}</span>
          </div>
          <div class="top-right">
            <span class="marketplace-badge">${marketplace}</span>
          </div>
        </div>
        <div class="dest-section">
          <div class="label-tag">DESTINATÁRIO</div>
          <div class="dest-nome">${p.cliente_nome || ""}</div>
          <div class="dest-end">${p.logradouro || ""}, ${p.numero || "S/N"}${p.complemento ? " – " + p.complemento : ""}</div>
          <div class="dest-end"><strong>Bairro:</strong> ${p.bairro || ""}</div>
          <div class="dest-end"><strong>CEP:</strong> ${p.cep || ""}</div>
          ${p.cliente_telefone ? `<div class="dest-end"><strong>Tel:</strong> ${p.cliente_telefone}</div>` : ""}
        </div>
        <div class="codes-area">
          <div class="code-big-row">
            <div class="code-box">
              <span class="code-big">${rastreio || "---"}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-col"><span class="label-small">PEDIDO</span><span class="info-value">${numeroPedido}</span></div>
            <div class="info-col"><span class="label-small">CIDADE</span><span class="info-value">${p.cidade || ""}</span></div>
            <div class="info-col agencia-col"><span class="label-small">AGÊNCIA</span><span class="info-value">${p.agencia || ""}</span></div>
          </div>
        </div>
        <div class="bottom-bar">
          <div class="bottom-col"><span class="label-small">RASTREIO / ENVIO</span><span class="bottom-value">${rastreio}</span></div>
          <div class="bottom-col"><span class="label-small">TRANSPORTADORA</span><span class="bottom-value">${p.transportadora || "CORREIOS"}</span></div>
          <div class="bottom-col last"><span class="label-small">VALOR</span><span class="bottom-value">R$ ${(p.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
        </div>
        <div class="footer-line"><span>DANFE SIMPLIFICADO - ETIQUETA</span></div>
      </div>`;

      // PAGE 2: Declaração de Conteúdo
      const declaracao = `
      <div class="page declaracao">
        <div class="dc-header">
          <div class="dc-header-left">
            <span class="dc-pedido">${numeroPedido}</span>
            <span class="dc-date">${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div class="dc-header-right">1/1</div>
        </div>
        <div class="dc-title"><span>DECLARAÇÃO DE CONTEÚDO</span></div>
        ${rastreio ? `<div class="dc-rastreio"><span class="label-small">Código de Rastreamento:</span> <strong>${rastreio}</strong></div>` : ""}
        <div class="dc-parties">
          <div class="dc-party dc-rem">
            <div class="dc-row"><span class="label-small">NOME:</span> <span class="dc-val">${p.remetente_nome || "MINHA LOJA LTDA"}</span></div>
            <div class="dc-row"><span class="label-small">CNPJ/CPF:</span> <span class="dc-val">${p.remetente_cpf_cnpj || ""}</span></div>
            <div class="dc-row"><span class="label-small">END:</span> <span class="dc-val">${p.remetente_logradouro || ""}, ${p.remetente_numero || "S/N"} – ${p.remetente_bairro || ""}</span></div>
            <div class="dc-row"><span class="label-small">CEP:</span> <span class="dc-val">${p.remetente_cep || ""}</span> <span class="label-small" style="margin-left:3mm;">CIDADE:</span> <span class="dc-val">${p.remetente_cidade || ""}/${p.remetente_estado || ""}</span></div>
          </div>
          <div class="dc-party">
            <div class="dc-row"><span class="label-small">DEST.:</span> <span class="dc-val">${p.cliente_nome || ""}</span> <span class="label-small" style="margin-left:2mm;">CPF/CNPJ:</span> <span class="dc-val">${p.cliente_cpf_cnpj || ""}</span></div>
            <div class="dc-row"><span class="label-small">END:</span> <span class="dc-val">${p.logradouro || ""}, ${p.numero || "S/N"}${p.complemento ? " – " + p.complemento : ""} – ${p.bairro || ""}</span></div>
            <div class="dc-row"><span class="label-small">CEP:</span> <span class="dc-val">${p.cep || ""}</span> <span class="label-small" style="margin-left:3mm;">CIDADE:</span> <span class="dc-val">${p.cidade || ""}/${p.estado || ""}</span></div>
          </div>
        </div>
        <div class="dc-items">
          <div class="dc-items-title">IDENTIFICAÇÃO DOS BENS</div>
          <table>
            <thead><tr>
              <th style="width:8%;">#</th><th style="width:18%;">COD.</th><th style="width:34%;">DESCRIÇÃO</th>
              <th style="width:10%;">QTD</th><th style="width:15%;">VALOR</th><th style="width:15%;">VARIAÇÃO</th>
            </tr></thead>
            <tbody>
              ${itens.map((item: any, i: number) => {
                const preco = item.preco_unitario || item.valor_unitario || item.preco || item.valor || 0;
                const cod = item.codigo || item.sku || item.codigo_fornecedor || "";
                return `<tr>
                <td style="text-align:center;">${i + 1}</td>
                <td>${cod}</td>
                <td>${item.nome || item.titulo || item.descricao || ""}</td>
                <td style="text-align:center;">${item.quantidade || item.qty || 1}</td>
                <td style="text-align:right;">R$ ${Number(preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                <td>${item.variacao || item.variante || ""}</td>
              </tr>`;
              }).join("")}
              ${emptyRowsHtml}
            </tbody>
            <tfoot><tr>
              <td colspan="4" style="text-align:right;font-weight:700;">TOTAL:</td>
              <td colspan="2" style="font-weight:700;">R$ ${(p.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
            </tr></tfoot>
          </table>
        </div>
        <div class="dc-obs">
          Declaro que não me enquadro no conceito de contribuinte previsto no art. 4º da LC nº 87/1996,
          uma vez que não realizo, com habitualidade ou em volume que caracterize intuito comercial,
          operações de circulação de mercadoria, responsabilizando-me pela exatidão das informações.
        </div>
        <div class="dc-sign">
          <div class="dc-sign-left"><div class="dc-sign-line"></div><span class="dc-sign-label">Assinatura do Declarante</span></div>
          <div class="dc-sign-date">${new Date().toLocaleDateString("pt-BR")}</div>
        </div>
      </div>`;

      return etiqueta + declaracao;
    })
    .join("");

  const html = `<!DOCTYPE html><html><head><title>Etiqueta + Declaração</title>
<style>
  @page { margin: 0; size: 100mm 150mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #000; }
  .page {
    width: 100mm; height: 150mm;
    page-break-after: always;
    display: flex; flex-direction: column;
    border: 1px solid #000;
  }

  /* ===== ETIQUETA ===== */
  .top-bar { display: flex; justify-content: space-between; align-items: flex-start; padding: 2.5mm 3mm; border-bottom: 1.5px solid #000; background: #f5f5f5; }
  .top-left { display: flex; flex-direction: column; gap: 0.3mm; }
  .label-small { font-size: 6px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  .nome-rem { font-size: 9px; font-weight: 700; }
  .end-rem { font-size: 7.5px; color: #333; }
  .marketplace-badge { display: inline-block; background: #EE4D2D; color: #fff; font-size: 8px; font-weight: 700; padding: 1.5mm 3mm; border-radius: 1mm; }
  .dest-section { padding: 2.5mm 3mm; border-bottom: 1.5px solid #000; }
  .label-tag { font-size: 7px; font-weight: 700; color: #fff; background: #333; display: inline-block; padding: 0.5mm 2mm; margin-bottom: 1.5mm; }
  .dest-nome { font-size: 11px; font-weight: 700; margin-bottom: 1mm; }
  .dest-end { font-size: 8.5px; line-height: 1.5; }
  .codes-area { flex: 1; display: flex; flex-direction: column; border-bottom: 1.5px solid #000; }
  .code-big-row { display: flex; justify-content: center; align-items: center; padding: 3mm; flex: 1; }
  .code-box { border: 2px solid #000; padding: 2mm 5mm; text-align: center; background: #fff; }
  .code-big { font-size: 22px; font-weight: 900; letter-spacing: 1px; }
  .info-row { display: flex; border-top: 1px solid #000; }
  .info-col { flex: 1; padding: 1.5mm 3mm; display: flex; flex-direction: column; border-right: 1px solid #ccc; }
  .info-col:last-child { border-right: none; }
  .agencia-col { background: #f0f0f0; }
  .info-value { font-size: 9px; font-weight: 700; }
  .bottom-bar { display: flex; border-bottom: 1px solid #000; }
  .bottom-col { flex: 1; padding: 1.5mm 3mm; display: flex; flex-direction: column; border-right: 1px solid #ccc; }
  .bottom-col.last { border-right: none; }
  .bottom-value { font-size: 8px; font-weight: 700; }
  .footer-line { padding: 1mm 3mm; text-align: center; font-size: 6px; color: #888; }

  /* ===== DECLARAÇÃO ===== */
  .dc-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5mm 3mm; border-bottom: 1px solid #000; font-size: 7px; color: #555; }
  .dc-header-left { display: flex; flex-direction: column; }
  .dc-pedido { font-weight: 700; font-size: 7.5px; color: #000; }
  .dc-date { font-size: 6.5px; }
  .dc-title { padding: 2mm 3mm; border-bottom: 1.5px solid #000; text-align: center; background: #f5f5f5; font-size: 11px; font-weight: 900; letter-spacing: 1.5px; }
  .dc-rastreio { padding: 1.5mm 3mm; border-bottom: 1px solid #000; font-size: 7px; }
  .dc-parties { border-bottom: 1px solid #000; }
  .dc-party { padding: 1.5mm 3mm; font-size: 7px; line-height: 1.6; }
  .dc-rem { border-bottom: 1px dashed #999; }
  .dc-row { display: flex; flex-wrap: wrap; gap: 0.5mm; align-items: baseline; }
  .dc-val { font-size: 7.5px; font-weight: 600; }
  .dc-items { flex: 1; display: flex; flex-direction: column; border-bottom: 1px solid #000; }
  .dc-items-title { padding: 1mm 3mm; font-size: 7px; font-weight: 700; border-bottom: 1px solid #000; background: #f0f0f0; }
  table { width: 100%; border-collapse: collapse; font-size: 7px; }
  th { padding: 1mm 1.5mm; font-size: 6px; font-weight: 700; text-transform: uppercase; text-align: left; border-bottom: 1px solid #000; background: #f8f8f8; border-right: 0.5px solid #ddd; }
  th:last-child { border-right: none; }
  td { padding: 1mm 1.5mm; font-size: 7px; border-bottom: 0.5px solid #eee; border-right: 0.5px solid #eee; }
  td:last-child { border-right: none; }
  tfoot td { border-top: 1px solid #000; border-bottom: none; padding: 1.5mm 1.5mm; font-size: 8px; background: #f5f5f5; }
  .dc-obs { padding: 1.5mm 3mm; font-size: 5.5px; line-height: 1.4; color: #555; border-bottom: 1px solid #000; }
  .dc-sign { display: flex; justify-content: space-between; align-items: flex-end; padding: 2mm 3mm; }
  .dc-sign-left { display: flex; flex-direction: column; }
  .dc-sign-line { border-bottom: 1px solid #000; width: 40mm; margin-bottom: 0.5mm; }
  .dc-sign-label { font-size: 5.5px; color: #888; }
  .dc-sign-date { font-size: 7px; font-weight: 600; }
</style></head><body>${pages}</body></html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
  }
}
