import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * Teste de regressão: garante que os cards de resumo da tela
 * "Contas a Pagar" exibem 0,00 quando não houver lançamentos
 * (estado inicial / sem dados). Evita que valores fixos do
 * sistema de teste retornem ao código.
 */
describe("ContasPagar - cards de resumo (regressão)", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../ContasPagar.tsx"),
    "utf-8"
  );

  const labels = ["Vencidos", "Vencem hoje", "A vencer", "Pagos", "Total"];

  it("contém os 5 cards de resumo esperados", () => {
    for (const label of labels) {
      expect(source).toContain(label);
    }
  });

  it("exibe 0,00 em cada card de resumo (sem valores hardcoded)", () => {
    // Bloco de cards de resumo
    const start = source.indexOf("{/* Summary Cards */}");
    const end = source.indexOf("{/* Table */}", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);

    const block = source.slice(start, end);

    // Deve haver exatamente 5 ocorrências de "0,00" (uma por card)
    const matches = block.match(/>0,00</g) ?? [];
    expect(matches.length).toBe(5);

    // Não pode haver nenhum outro número monetário hardcoded
    // (formato pt-BR: 1.234,56 ou 123,45 com dígitos diferentes de 0,00)
    const hardcoded = block.match(/>(?!0,00<)\d[\d.]*,\d{2}</g);
    expect(hardcoded).toBeNull();
  });
});
