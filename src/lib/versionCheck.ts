// Verifica periodicamente se há uma nova build do front-end disponível
// comparando o buildId atual com o /version.json servido pelo hosting.
// Em caso de divergência, limpa caches/SW e recarrega a página.

declare const __APP_BUILD_ID__: string;

const CHECK_INTERVAL_MS = 60_000; // 1 minuto
const RELOAD_FLAG = "app-reloaded-at";

async function clearAllCaches() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {
    console.warn("[versionCheck] cache cleanup failed:", e);
  }
}

function forceReload() {
  // Evita loop: só recarrega no máximo uma vez a cada 30s
  const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
  if (Date.now() - last < 30_000) return;
  sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));

  const url = new URL(window.location.href);
  url.searchParams.set("v", Date.now().toString());
  window.location.replace(url.toString());
}

async function checkVersion() {
  try {
    const res = await fetch(`/version.json?ts=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return;
    const { buildId } = (await res.json()) as { buildId: string };
    if (!buildId) return;

    const current = __APP_BUILD_ID__;
    if (buildId !== current) {
      console.info("[versionCheck] nova versão detectada", { current, buildId });
      await clearAllCaches();
      forceReload();
    }
  } catch {
    // silencioso - rede instável não deve quebrar o app
  }
}

export function startVersionCheck() {
  // Checa imediatamente após 5s e depois periodicamente
  setTimeout(checkVersion, 5_000);
  setInterval(checkVersion, CHECK_INTERVAL_MS);

  // Re-checa quando a aba volta a ficar visível
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkVersion();
  });

  // Re-checa ao reconectar
  window.addEventListener("online", checkVersion);
}
