import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { startVersionCheck } from "./lib/versionCheck";

// Force light mode to prevent black screen in iframe previews
document.documentElement.classList.remove("dark");
document.documentElement.style.colorScheme = "light";

// Cleanup legacy service workers and caches on first load
const cleanupOnce = async () => {
  if (sessionStorage.getItem("sw-cleaned") === "1") return;
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
    console.warn("Cache cleanup failed:", e);
  }
  sessionStorage.setItem("sw-cleaned", "1");
};

cleanupOnce();
startVersionCheck();

createRoot(document.getElementById("root")!).render(<App />);
