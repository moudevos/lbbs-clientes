"use client";

import { useEffect, useState } from "react";

export function PwaInstaller() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const handler = (event: Event) => { event.preventDefault(); setPrompt(event as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!prompt) return null;
  return <button className="customer-install" type="button" onClick={async () => { await prompt.prompt(); setPrompt(null); }}>Instalar app</button>;
}

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };
