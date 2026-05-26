// ── Taxas reais 2026 por marketplace ──
export const MARKETPLACE_FEES: Record<string, {
  comissao: number; // % comissão clássica padrão (categoria "geral")
  taxaFixa: number; // R$ taxa fixa padrão
  taxaTransacao: number; // % taxa de transação
  imposto: number; // % imposto padrão (Simples Nacional)
}> = {
  mercado_livre: { comissao: 11, taxaFixa: 6.5, taxaTransacao: 0, imposto: 6 },
  shopee: { comissao: 14, taxaFixa: 4, taxaTransacao: 2, imposto: 6 },
  amazon: { comissao: 15, taxaFixa: 2, taxaTransacao: 0, imposto: 6 },
  tiktok_shop: { comissao: 6, taxaFixa: 2, taxaTransacao: 0, imposto: 6 },
  shein: { comissao: 10, taxaFixa: 0, taxaTransacao: 0, imposto: 6 },
  magalu: { comissao: 16, taxaFixa: 5, taxaTransacao: 0, imposto: 6 },
};

/**
 * Calcula o preço de venda ideal para um canal, dado o custo e a margem desejada.
 * Fórmula: precoVenda = (custo + taxaFixa) / (1 - (comissao + txTransacao + imposto + margem) / 100)
 */
export function calcularPrecoVenda(
  precoCusto: number,
  margemDesejada: number, // em %
  canalKey: string,
): number {
  const fees = MARKETPLACE_FEES[canalKey];
  if (!fees) {
    // fallback simples
    return precoCusto * (1 + margemDesejada / 100);
  }

  const totalPercentual = (fees.comissao + fees.taxaTransacao + fees.imposto + margemDesejada) / 100;
  if (totalPercentual >= 1) {
    // impossível — retorna fallback
    return precoCusto * (1 + margemDesejada / 100);
  }

  return (precoCusto + fees.taxaFixa) / (1 - totalPercentual);
}
