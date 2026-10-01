import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) return;
    try { setDismissed(sessionStorage.getItem("renthive-install-dismissed") === "yes"); } catch { /* Storage can be unavailable. */ }
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const beforeInstall = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const installed = () => { setPrompt(null); setIos(false); };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const install = async () => {
    if (ios) { setInstructions(value => !value); return; }
    if (!prompt) return;
    setInstalling(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } finally { setPrompt(null); setInstalling(false); }
  };
  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem("renthive-install-dismissed", "yes"); } catch { /* Optional preference. */ }
  };

  if (dismissed || (!prompt && !ios)) return null;
  return <aside className="install-app" aria-label="Install RentHive">
    <div className="flex items-center gap-3">
      <Download className="w-5 h-5 text-amber-600 shrink-0" />
      <div className="flex-1 min-w-0"><p className="text-sm font-semibold">RentHive on your home screen</p><p className="text-xs text-gray-500">Open your rentals with one tap.</p></div>
      <button type="button" disabled={installing} onClick={() => void install()} className="min-h-11 rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white">{installing ? "Installing…" : "Install"}</button>
      <button type="button" onClick={dismiss} aria-label="Dismiss install message" className="min-h-11 min-w-11 flex items-center justify-center rounded-xl"><X className="w-4 h-4" /></button>
    </div>
    {instructions && <p className="mt-3 text-sm text-gray-600">On your iPhone or iPad, open this site in Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong> and <strong>Add</strong>.</p>}
  </aside>;
}
