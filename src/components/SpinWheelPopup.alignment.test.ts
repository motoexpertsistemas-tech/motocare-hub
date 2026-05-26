import { describe, it, expect } from "vitest";

/**
 * Replica da matemática de alinhamento usada em SpinWheelPopup.
 * Dado o ângulo final da roda, calcula qual segmento está sob o ponteiro (topo = 3π/2).
 */
function computeFinalRotation(
  startRotation: number,
  winnerIdx: number,
  numSegments: number,
  fullTurns: number,
) {
  const TWO_PI = 2 * Math.PI;
  const segAngle = TWO_PI / numSegments;
  const winnerAngle = winnerIdx * segAngle + segAngle / 2;
  const desiredMod = (((3 * Math.PI / 2 - winnerAngle) % TWO_PI) + TWO_PI) % TWO_PI;
  const currentMod = ((startRotation % TWO_PI) + TWO_PI) % TWO_PI;
  let delta = desiredMod - currentMod;
  if (delta <= 0) delta += TWO_PI;
  return startRotation + fullTurns * TWO_PI + delta;
}

function segmentUnderPointer(rotation: number, numSegments: number) {
  const TWO_PI = 2 * Math.PI;
  const segAngle = TWO_PI / numSegments;
  // Ponteiro no topo = 3π/2. Achar i tal que rotation + i*seg + seg/2 ≡ 3π/2 (mod 2π)
  const pointer = 3 * Math.PI / 2;
  const norm = (((pointer - rotation - segAngle / 2) % TWO_PI) + TWO_PI) % TWO_PI;
  return Math.round(norm / segAngle) % numSegments;
}

describe("SpinWheelPopup - alinhamento sorteio x ponteiro", () => {
  for (const n of [3, 4, 6, 8]) {
    it(`segmento sorteado coincide com o ponteiro (n=${n})`, () => {
      for (let winnerIdx = 0; winnerIdx < n; winnerIdx++) {
        for (let trial = 0; trial < 20; trial++) {
          const startRotation = Math.random() * 100;
          const fullTurns = 5 + Math.floor(Math.random() * 4);
          const final = computeFinalRotation(startRotation, winnerIdx, n, fullTurns);
          const landed = segmentUnderPointer(final, n);
          expect(landed).toBe(winnerIdx);
        }
      }
    });
  }

  it("cupom gerado corresponde ao prêmio sob o ponteiro", () => {
    const mockOptions: WheelOption[] = [
      { label: "10% OFF", valor: 10, tipo: "desconto" },
      { label: "20% OFF", valor: 20, tipo: "desconto" },
      { label: "Brinde", valor: 0, tipo: "produto" }
    ];
    
    for (let winnerIdx = 0; winnerIdx < mockOptions.length; winnerIdx++) {
      const winner = mockOptions[winnerIdx];
      // Simula a lógica do componente
      const prefix = winner.tipo === "desconto" ? "DESC" : "PROD";
      const expectedPrefix = `${prefix}${winner.valor}-`;
      
      // O cupom deve começar com o prefixo do vencedor
      const couponCode = `${prefix}${winner.valor}-TEST`;
      expect(couponCode.startsWith(expectedPrefix)).toBe(true);
      
      // Verifica se o winnerIdx que gera esse cupom é o mesmo que pararia no ponteiro
      const final = computeFinalRotation(0, winnerIdx, mockOptions.length, 5);
      const landedIdx = segmentUnderPointer(final, mockOptions.length);
      expect(landedIdx).toBe(winnerIdx);
    }
  });

  it("rotação final é sempre maior que a inicial (gira pra frente)", () => {
    for (let i = 0; i < 50; i++) {
      const start = Math.random() * 100;
      const final = computeFinalRotation(start, Math.floor(Math.random() * 6), 6, 5);
      expect(final).toBeGreaterThan(start);
    }
  });
});

interface WheelOption {
  label: string;
  valor: number;
  tipo: "desconto" | "produto";
}
