import { supabase } from "@/integrations/supabase/client";

type LojaConfig = {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  telefone: string;
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

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  // handle dd/mm/yyyy or yyyy-mm-dd
  if (dateStr.includes("/")) return dateStr;
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export interface BoletoData {
  numeroBoleto: string;
  descricao: string;
  valor: number;
  vencimento: string;
  entidadeNome: string;
  entidadeCpfCnpj?: string;
  entidadeEndereco?: string;
  entidadeCidade?: string;
  entidadeEstado?: string;
  entidadeCep?: string;
  formaPagamento: string;
  contaBancaria: string;
  nossoNumero?: string;
  linhaDigitavel?: string;
  codigoBarras?: string;
  dataEmissao?: string;
  dataProcessamento?: string;
  instrucoes?: string[];
}

export async function printBoleto(boleto: BoletoData) {
  const loja = await getLojaConfig();
  if (!loja) return;

  const enderecoLoja = [loja.logradouro, loja.numero, loja.bairro].filter(Boolean).join(", ");
  const cidadeEstadoLoja = [loja.cidade, loja.estado].filter(Boolean).join(" - ");
  const cepLoja = loja.cep || "";

  const enderecoSacado = boleto.entidadeEndereco || "";
  const cidadeEstadoSacado = [boleto.entidadeCidade, boleto.entidadeEstado].filter(Boolean).join(" - ");
  const cepSacado = boleto.entidadeCep || "";

  const dataEmissao = formatDate(boleto.dataEmissao || new Date().toISOString().slice(0, 10));
  const dataProcessamento = formatDate(boleto.dataProcessamento || new Date().toISOString().slice(0, 10));
  const vencimento = formatDate(boleto.vencimento);

  const nossoNumero = boleto.nossoNumero || boleto.numeroBoleto;
  const linhaDigitavel = boleto.linhaDigitavel || "";
  const codigoBarras = boleto.codigoBarras || "";

  const instrucoes = boleto.instrucoes || [
    "PROTESTAR APÓS 7 DIAS DO VENCIMENTO.",
    `Data limite para pagamento: ${vencimento}`
  ];

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { margin: 8mm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #000; }

  .boleto-container { border: 2px solid #000; padding: 0; margin-bottom: 10px; }
  
  /* ====== RECIBO DO PAGADOR (topo) ====== */
  .recibo-pagador { border-bottom: 2px dashed #000; padding: 10px; position: relative; }
  .recibo-pagador::after { content: "✂"; position: absolute; bottom: -10px; left: 50%; font-size: 14px; color: #999; }
  
  .recibo-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 2px solid #000; padding-bottom: 6px; }
  .recibo-header .banco-info { display: flex; align-items: center; gap: 10px; }
  .banco-codigo { font-size: 20px; font-weight: bold; border-left: 2px solid #000; border-right: 2px solid #000; padding: 2px 10px; margin: 0 10px; }
  .recibo-title { font-size: 12px; font-weight: bold; }
  
  .recibo-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0; border: 1px solid #000; }
  .recibo-grid .field { border: 1px solid #000; padding: 2px 4px; }
  .recibo-grid .field-label { font-size: 6px; color: #333; text-transform: uppercase; display: block; }
  .recibo-grid .field-value { font-size: 9px; font-weight: bold; display: block; min-height: 12px; }
  .field-wide { grid-column: span 2; }
  .field-full { grid-column: span 4; }
  .field-3 { grid-column: span 3; }
  
  /* ====== FICHA DE COMPENSAÇÃO ====== */
  .ficha-compensacao { padding: 10px; }
  .ficha-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 0; }
  .ficha-header .banco-logo { font-size: 16px; font-weight: bold; }
  .linha-digitavel { font-size: 11px; font-weight: bold; letter-spacing: 1px; text-align: right; flex: 1; margin-left: 15px; }
  
  .ficha-body { display: grid; grid-template-columns: 3fr 1fr; gap: 0; }
  .ficha-left { border-right: 2px solid #000; }
  
  .ficha-field { border: 1px solid #000; padding: 2px 4px; }
  .ficha-field-label { font-size: 6px; color: #333; text-transform: uppercase; display: block; }
  .ficha-field-value { font-size: 9px; font-weight: bold; display: block; min-height: 12px; }
  
  .ficha-left-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0; }
  .ficha-left-wide { grid-column: span 2; }
  .ficha-left-full { grid-column: span 4; }
  .ficha-left-3 { grid-column: span 3; }
  
  .instrucoes-box { min-height: 60px; padding: 4px; }
  .instrucoes-box p { font-size: 8px; margin-bottom: 2px; }
  
  .sacado-section { border: 1px solid #000; padding: 4px; }
  .sacado-section .field-label { font-size: 6px; }
  .sacado-section .field-value { font-size: 9px; font-weight: bold; }
  
  .codigo-barras { margin-top: 6px; padding: 4px 0; text-align: center; }
  .codigo-barras-text { font-family: 'Libre Barcode 128', monospace; font-size: 40px; letter-spacing: 0; }
  .codigo-barras-fallback { border: 2px solid #000; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; letter-spacing: 2px; background: repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 5px, #fff 5px, #fff 8px); }
  
  .autenticacao { text-align: right; font-size: 7px; color: #333; margin-top: 4px; padding-top: 2px; border-top: 1px solid #ccc; }
  .ficha-de-compensacao-label { text-align: right; font-size: 8px; font-weight: bold; margin-top: 2px; }
  
  .beneficiario-line { display: flex; gap: 4px; align-items: baseline; }
  .beneficiario-line .cnpj { font-size: 8px; color: #333; }
</style></head><body>

<div class="boleto-container">
  
  <!-- ======= RECIBO DO PAGADOR ======= -->
  <div class="recibo-pagador">
    <div class="recibo-header">
      <div class="banco-info">
        <span class="recibo-title">${boleto.contaBancaria.toUpperCase()}</span>
      </div>
      <span class="banco-codigo">077-9</span>
      <span style="font-size:8px;flex:1;text-align:right;">Recibo do Pagador</span>
    </div>
    
    <div class="recibo-grid">
      <div class="field field-3">
        <span class="field-label">Beneficiário</span>
        <span class="field-value">
          <span class="beneficiario-line">
            ${loja.razao_social}
            <span class="cnpj">CNPJ/CPF: ${loja.cnpj}</span>
          </span>
        </span>
      </div>
      <div class="field">
        <span class="field-label">Nº Documento</span>
        <span class="field-value">${nossoNumero}</span>
      </div>
      
      <div class="field field-full">
        <span class="field-label">Endereço do Beneficiário</span>
        <span class="field-value">${enderecoLoja}, ${cidadeEstadoLoja} ${cepLoja ? '- CEP: ' + cepLoja : ''}</span>
      </div>
      
      <div class="field">
        <span class="field-label">Nosso Número</span>
        <span class="field-value">${nossoNumero}</span>
      </div>
      <div class="field">
        <span class="field-label">Nº do Documento</span>
        <span class="field-value">${nossoNumero}</span>
      </div>
      <div class="field">
        <span class="field-label">Vencimento</span>
        <span class="field-value">${vencimento}</span>
      </div>
      <div class="field">
        <span class="field-label">Valor do Documento</span>
        <span class="field-value">R$ ${formatBRL(boleto.valor)}</span>
      </div>
      
      <div class="field field-wide">
        <span class="field-label">Pagador</span>
        <span class="field-value">${boleto.entidadeNome}</span>
      </div>
      <div class="field">
        <span class="field-label">CPF/CNPJ</span>
        <span class="field-value">${boleto.entidadeCpfCnpj || ""}</span>
      </div>
      <div class="field">
        <span class="field-label">Valor Pago</span>
        <span class="field-value"></span>
      </div>
      
      <div class="field field-full" style="font-size:7px;text-align:center;padding:4px;">
        Autenticação Mecânica &nbsp;&nbsp;&nbsp; Ficha de Compensação
      </div>
    </div>
  </div>
  
  <!-- ======= FICHA DE COMPENSAÇÃO ======= -->
  <div class="ficha-compensacao">
    <div class="ficha-header">
      <span class="ficha-header banco-logo">${boleto.contaBancaria.toUpperCase()}</span>
      <span class="banco-codigo">077-9</span>
      <span class="linha-digitavel">${linhaDigitavel || nossoNumero}</span>
    </div>
    
    <div class="ficha-body">
      <!-- Left side -->
      <div class="ficha-left">
        <div class="ficha-left-grid">
          <div class="ficha-field ficha-left-full">
            <span class="ficha-field-label">Local de pagamento</span>
            <span class="ficha-field-value">PAGÁVEL EM QUALQUER BANCO</span>
          </div>
          
          <div class="ficha-field ficha-left-full">
            <span class="ficha-field-label">Beneficiário</span>
            <span class="ficha-field-value">${loja.razao_social} — CNPJ: ${loja.cnpj}</span>
          </div>
          
          <div class="ficha-field">
            <span class="ficha-field-label">Data do Documento</span>
            <span class="ficha-field-value">${dataEmissao}</span>
          </div>
          <div class="ficha-field">
            <span class="ficha-field-label">Nº do Documento</span>
            <span class="ficha-field-value">${nossoNumero}</span>
          </div>
          <div class="ficha-field">
            <span class="ficha-field-label">Espécie Doc.</span>
            <span class="ficha-field-value">DM</span>
          </div>
          <div class="ficha-field">
            <span class="ficha-field-label">Aceite</span>
            <span class="ficha-field-value">NÃO</span>
          </div>
          
          <div class="ficha-field">
            <span class="ficha-field-label">Data de Processamento</span>
            <span class="ficha-field-value">${dataProcessamento}</span>
          </div>
          <div class="ficha-field ficha-left-3">
            <span class="ficha-field-label">Agência / Código do Beneficiário</span>
            <span class="ficha-field-value"></span>
          </div>
          
          <div class="ficha-field">
            <span class="ficha-field-label">Uso do Banco</span>
            <span class="ficha-field-value"></span>
          </div>
          <div class="ficha-field">
            <span class="ficha-field-label">Carteira</span>
            <span class="ficha-field-value">112</span>
          </div>
          <div class="ficha-field">
            <span class="ficha-field-label">Espécie Moeda</span>
            <span class="ficha-field-value">R$</span>
          </div>
          <div class="ficha-field">
            <span class="ficha-field-label">Quantidade Moeda</span>
            <span class="ficha-field-value"></span>
          </div>
          
          <div class="ficha-field ficha-left-full instrucoes-box">
            <span class="ficha-field-label">Instruções de responsabilidade do beneficiário</span>
            ${instrucoes.map(i => `<p>${i}</p>`).join("")}
          </div>
        </div>
        
        <div class="sacado-section">
          <span class="field-label">Pagador</span>
          <div class="field-value" style="display:flex;justify-content:space-between;">
            <span>${boleto.entidadeNome}</span>
            <span>CPF/CNPJ: ${boleto.entidadeCpfCnpj || ""}</span>
          </div>
          ${enderecoSacado ? `<div style="font-size:8px;">${enderecoSacado}</div>` : ""}
          ${cidadeEstadoSacado ? `<div style="font-size:8px;">${cidadeEstadoSacado} ${cepSacado ? '- CEP: ' + cepSacado : ''}</div>` : ""}
        </div>
        
        <div class="sacado-section" style="min-height:18px;">
          <span class="field-label">Beneficiário Final</span>
          <span class="field-value">${loja.razao_social}</span>
          <span style="font-size:8px;margin-left:20px;">CNPJ/CPF: ${loja.cnpj}</span>
        </div>
      </div>
      
      <!-- Right side -->
      <div>
        <div class="ficha-field">
          <span class="ficha-field-label">Vencimento</span>
          <span class="ficha-field-value" style="text-align:right;">${vencimento}</span>
        </div>
        <div class="ficha-field">
          <span class="ficha-field-label">Agência / Código Cedente</span>
          <span class="ficha-field-value" style="text-align:right;"></span>
        </div>
        <div class="ficha-field">
          <span class="ficha-field-label">Nosso Número</span>
          <span class="ficha-field-value" style="text-align:right;">${nossoNumero}</span>
        </div>
        <div class="ficha-field">
          <span class="ficha-field-label">(=) Valor do Documento</span>
          <span class="ficha-field-value" style="text-align:right;">R$ ${formatBRL(boleto.valor)}</span>
        </div>
        <div class="ficha-field">
          <span class="ficha-field-label">(-) Desconto / Abatimento</span>
          <span class="ficha-field-value" style="text-align:right;"></span>
        </div>
        <div class="ficha-field">
          <span class="ficha-field-label">(+) Mora / Multa</span>
          <span class="ficha-field-value" style="text-align:right;"></span>
        </div>
        <div class="ficha-field">
          <span class="ficha-field-label">(+) Outros Acréscimos</span>
          <span class="ficha-field-value" style="text-align:right;"></span>
        </div>
        <div class="ficha-field">
          <span class="ficha-field-label">(=) Valor Cobrado</span>
          <span class="ficha-field-value" style="text-align:right;"></span>
        </div>
      </div>
    </div>
    
    <!-- Código de barras -->
    <div class="codigo-barras">
      <div class="codigo-barras-fallback">${codigoBarras || linhaDigitavel || nossoNumero}</div>
    </div>
    
    <div class="autenticacao">Autenticação Mecânica &nbsp;&nbsp;&nbsp;&nbsp; Ficha de Compensação</div>
  </div>
  
</div>

</body></html>`;

  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}
