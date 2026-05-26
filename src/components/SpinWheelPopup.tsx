import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Gift, Copy, Check, PartyPopper, Clock } from "lucide-react";
import { toast } from "sonner";

interface WheelOption {
  label: string;
  valor: number;
  tipo: "desconto" | "produto";
}

interface SpinWheelPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opcoes: WheelOption[];
  onSpun?: (info: { code: string; label: string; expiresAt: number }) => void;
  lockedUntil?: number | null;
  initialResult?: { label: string; valor: number; tipo: "desconto" | "produto"; code: string } | null;
}

const COLORS = [
  "#DC2626", // vermelho
  "#3b82f6", // azul
  "#f97316", // laranja
  "#0f172a", // preto
  "#10b981", // verde
  "#8b5cf6", // roxo
  "#eab308", // amarelo
  "#ec4899", // rosa
];

// Generate tick/click sound using Web Audio API
function playTickSound(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 1200;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

// Win fanfare sound
function playWinSound(ctx: AudioContext) {
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "triangle";
    const t = ctx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

export function SpinWheelPopup({ open, onOpenChange, opcoes, onSpun, lockedUntil, initialResult }: SpinWheelPopupProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelOption | null>(
    initialResult ? { label: initialResult.label, valor: initialResult.valor, tipo: initialResult.tipo } : null
  );
  const [couponCode, setCouponCode] = useState(initialResult?.code ?? "");
  const [copied, setCopied] = useState(false);
  const rotationRef = useRef(0);
  const animRef = useRef<number>(0);
  const lastSegmentRef = useRef(-1);

  const isLocked = !!(lockedUntil && lockedUntil > Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);
  const targetTs = result ? lockedUntil ?? 0 : lockedUntil ?? 0;
  const msLeft = Math.max(0, targetTs - now);
  const hh = String(Math.floor(msLeft / 3600000)).padStart(2, "0");
  const mm = String(Math.floor((msLeft % 3600000) / 60000)).padStart(2, "0");
  const ss = String(Math.floor((msLeft % 60000) / 1000)).padStart(2, "0");

  const numSegments = opcoes.length;
  const segAngle = (2 * Math.PI) / numSegments;

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  // Draw the wheel
  const drawWheel = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;

    ctx.clearRect(0, 0, size, size);

    // Shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    ctx.restore();

    // Segments
    opcoes.forEach((op, i) => {
      const startAngle = rotation + i * segAngle;
      const endAngle = startAngle + segAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(10, Math.min(14, 200 / numSegments))}px system-ui, sans-serif`;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 3;
      ctx.fillText(op.label, radius * 0.6, 5);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Pointer (triangle at top)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center - 14, 4);
    ctx.lineTo(center + 14, 4);
    ctx.lineTo(center, 28);
    ctx.closePath();
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Outer ring
    ctx.beginPath();
    ctx.arc(center, center, radius + 3, 0, 2 * Math.PI);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Dots around edge
    for (let i = 0; i < 24; i++) {
      const dotAngle = (i / 24) * 2 * Math.PI;
      const dx = center + (radius + 3) * Math.cos(dotAngle);
      const dy = center + (radius + 3) * Math.sin(dotAngle);
      ctx.beginPath();
      ctx.arc(dx, dy, 3, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? "#fbbf24" : "#fff";
      ctx.fill();
    }
  }, [opcoes, numSegments, segAngle]);

  useEffect(() => {
    if (open && !spinning && !result) {
      // Aguarda o canvas montar no DOM antes de desenhar
      const raf = requestAnimationFrame(() => drawWheel(0));
      return () => cancelAnimationFrame(raf);
    }
  }, [open, spinning, result, drawWheel]);

  const spin = () => {
    if (spinning || numSegments === 0) return;
    setSpinning(true);
    setResult(null);
    setCopied(false);

    const ctx = getAudioCtx();

    // Pick random winner
    const winnerIdx = Math.floor(Math.random() * numSegments);
    // Pointer is at top (3π/2). Final rotation R must satisfy:
    //   R + winnerIdx*segAngle + segAngle/2 ≡ 3π/2  (mod 2π)
    const winnerAngle = winnerIdx * segAngle + segAngle / 2;
    const TWO_PI = 2 * Math.PI;
    const startRotation = rotationRef.current;
    const desiredMod = (((3 * Math.PI / 2 - winnerAngle) % TWO_PI) + TWO_PI) % TWO_PI;
    const currentMod = ((startRotation % TWO_PI) + TWO_PI) % TWO_PI;
    let delta = desiredMod - currentMod;
    if (delta <= 0) delta += TWO_PI;
    // Add 5-8 FULL integer turns for the spinning effect
    const fullTurns = 5 + Math.floor(Math.random() * 4);
    const totalRotation = fullTurns * TWO_PI + delta;
    const targetRotation = startRotation + totalRotation;
    const duration = 5000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + totalRotation * ease;
      rotationRef.current = currentRotation;

      // Tick sound on segment change
      const normalizedAngle = ((currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const currentSegment = Math.floor(normalizedAngle / segAngle) % numSegments;
      if (currentSegment !== lastSegmentRef.current) {
        lastSegmentRef.current = currentSegment;
        if (progress < 0.9) {
          playTickSound(ctx);
        }
      }

      drawWheel(currentRotation);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        const winner = opcoes[winnerIdx];
        const code = `${winner.tipo === "desconto" ? "DESC" : "PROD"}${winner.valor}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        setResult(winner);
        setCouponCode(code);
        playWinSound(ctx);
        onSpun?.({ code, label: winner.label, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
      }
    };

    animRef.current = requestAnimationFrame(animate);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    toast.success("Cupom copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    cancelAnimationFrame(animRef.current);
    setSpinning(false);
    // Keep result visible if it came from initialResult (active prize); only clear fresh spins
    if (!initialResult) setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm p-0 border-none bg-gradient-to-b from-[#1a1a2e] to-[#16213e] text-white max-h-[92vh] overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Gire e Ganhe</DialogTitle>
          <DialogDescription>Roleta de prêmios para ganhar um cupom de desconto exclusivo.</DialogDescription>
        </VisuallyHidden>

        <div className="flex flex-col items-center px-4 pt-5 pb-4">
          {/* Header */}
          <div className="text-center mb-2">
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <Gift className="h-5 w-5 text-yellow-400" />
              <h2 className="text-lg font-bold text-yellow-400">GIRE E GANHE!</h2>
              <Gift className="h-5 w-5 text-yellow-400" />
            </div>
            <p className="text-xs text-white/70">
              Tente a sorte e ganhe um desconto exclusivo!
            </p>
          </div>

          {/* Wheel */}
          <div className="relative mb-3">
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className={`w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] transition-all ${isLocked && !result ? "blur-[2px] opacity-50" : ""}`}
            />
            {isLocked && !result && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="bg-black/70 backdrop-blur-md rounded-full w-[140px] h-[140px] flex flex-col items-center justify-center border-2 border-yellow-400 shadow-2xl shadow-yellow-500/40 animate-pulse">
                  <Clock className="h-6 w-6 text-yellow-400 mb-1" />
                  <div className="font-mono text-3xl font-black text-yellow-400 tabular-nums leading-none">
                    {hh}:{mm}:{ss}
                  </div>
                  <div className="text-[10px] text-white/60 mt-1 tracking-widest">PRÓXIMO GIRO</div>
                </div>
              </div>
            )}
          </div>

          {/* Spin button, locked message, or Result */}
          {!result && isLocked ? (
            <p className="text-xs text-white/60 text-center max-w-[280px]">
              Você já girou hoje. Volte quando o tempo zerar para tentar novamente!
            </p>
          ) : !result ? (
            <Button
              onClick={spin}
              disabled={spinning}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold text-lg px-8 py-3 rounded-full shadow-lg shadow-yellow-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {spinning ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🎰</span> Girando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  🎯 GIRAR ROLETA
                </span>
              )}
            </Button>
          ) : (
            <div className="text-center space-y-2 animate-fade-in w-full">
              <div className="flex items-center justify-center gap-2">
                <PartyPopper className="h-5 w-5 text-yellow-400" />
                <span className="text-base font-bold text-yellow-400">PARABÉNS!</span>
                <PartyPopper className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 border border-yellow-500/30">
                <p className="text-[11px] text-white/60">Você ganhou</p>
                <p className="text-xl font-black text-yellow-400 leading-tight">{result.label}</p>
              </div>
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                <span className="text-xs text-white/60">Cupom:</span>
                <code className="text-yellow-400 font-mono font-bold flex-1 text-sm">{couponCode}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="text-white hover:bg-white/10 h-7 w-7 p-0"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {lockedUntil && lockedUntil > now && (
                <div>
                  <p className="text-[10px] text-white/60 tracking-widest mb-1">SEU PRÊMIO EXPIRA EM:</p>
                  <div className="flex items-center justify-center gap-1.5" aria-live="polite">
                    {[hh, mm, ss].map((v, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="bg-black border-2 border-yellow-400 rounded-md px-2 py-1 min-w-[42px] shadow-lg shadow-yellow-500/20">
                          <span className="font-mono text-lg font-black text-yellow-400 tabular-nums">{v}</span>
                        </div>
                        {i < 2 && <span className="text-yellow-400 font-black">:</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
