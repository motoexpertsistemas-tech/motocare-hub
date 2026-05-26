/**
 * Detects if the current hostname is a client subdomain.
 * 
 * Examples:
 *   dkamotos.ottotechsistemas.com.br → "dkamotos"
 *   ottotechsistemas.com.br          → null
 *   www.ottotechsistemas.com.br      → null
 *   localhost                         → null
 *   moto-fixer-pro.lovable.app       → null
 *   id-preview--xxx.lovable.app      → null
 */

const BASE_DOMAINS = [
  "ottotechsistemas.com.br",
  "lovable.app",
];

const IGNORED_SUBDOMAINS = ["www", "mail", "ftp", "admin", "api"];

export function detectSubdomain(hostname: string): string | null {
  // Ignore localhost and IPs
  if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  for (const base of BASE_DOMAINS) {
    if (hostname.endsWith(`.${base}`)) {
      const sub = hostname.slice(0, hostname.length - base.length - 1);
      
      // Must be a simple subdomain (no dots = direct sub)
      if (!sub || sub.includes(".")) return null;
      
      // Ignore common system subdomains
      if (IGNORED_SUBDOMAINS.includes(sub.toLowerCase())) return null;
      
      // Ignore Lovable preview/project subdomains
      if (base === "lovable.app") return null;
      
      return sub.toLowerCase();
    }
  }

  return null;
}
