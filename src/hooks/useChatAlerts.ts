import { useCallback } from "react";

/**
 * Hook reutilizável para tocar alertas sonoros sintéticos (Web Audio API)
 * usados nos fluxos do chat / atendimento:
 *  - playEstoquistaAlert: "ding-dong" (880Hz → 660Hz) quando o bot chama o estoquista.
 *  - playTransferenciaAlert: bipe ascendente (Dó 523Hz → Sol 784Hz) quando o bot
 *    transfere a conversa para um atendente humano.
 *
 * Não depende de assets externos. Falha silenciosamente em navegadores que
 * bloqueiam o AudioContext sem gesto do usuário.
 */
export function useChatAlerts() {
  const tocarSequencia = useCallback(
    (notas: Array<{ freq: number; start: number; dur: number }>, fechaEm = 900) => {
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        notas.forEach(({ freq, start, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + dur + 0.02);
        });
        setTimeout(() => ctx.close().catch(() => {}), fechaEm);
      } catch (e) {
        console.warn("Não foi possível tocar alerta sonoro:", e);
      }
    },
    []
  );

  const playEstoquistaAlert = useCallback(() => {
    tocarSequencia(
      [
        { freq: 880, start: 0, dur: 0.25 },
        { freq: 660, start: 0.28, dur: 0.35 },
      ],
      900
    );
  }, [tocarSequencia]);

  const playTransferenciaAlert = useCallback(() => {
    tocarSequencia(
      [
        { freq: 523, start: 0, dur: 0.22 },
        { freq: 784, start: 0.22, dur: 0.35 },
      ],
      800
    );
  }, [tocarSequencia]);

  return { playEstoquistaAlert, playTransferenciaAlert };
}
