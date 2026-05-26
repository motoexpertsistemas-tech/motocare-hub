import { useEffect, useState } from "react";

/**
 * Tracks the on-screen keyboard inset on mobile using the VisualViewport API.
 * Returns the number of pixels the keyboard is covering at the bottom of the layout viewport.
 * Returns 0 when no keyboard is shown or the API is unavailable.
 */
export function useKeyboardInset(enabled: boolean = true): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setInset(0);
      return;
    }
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;

    const update = () => {
      // How much the visual viewport is shorter than the layout viewport (i.e. keyboard).
      const diff = window.innerHeight - vv.height - vv.offsetTop;
      setInset(diff > 80 ? diff : 0);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [enabled]);

  return inset;
}
