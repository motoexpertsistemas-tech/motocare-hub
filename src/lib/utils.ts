import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number to BR currency display (comma as decimal, 2 places, dot as thousands) */
export function toBRL(val: string | number): string {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "0,00";
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Parse BR formatted value back to dot-based number string */
export function fromBRL(val: string): string {
  return val.replace(/\./g, "").replace(",", ".");
}
