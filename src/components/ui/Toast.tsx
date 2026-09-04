import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons = { success: CheckCircle2, error: XCircle, warning: AlertCircle, info: Info };
const colors = {
  success: "border-l-emerald-500 bg-white",
  error: "border-l-red-500 bg-white",
  warning: "border-l-amber-500 bg-white",
  info: "border-l-blue-500 bg-white",
};
const iconColors = { success: "text-emerald-500", error: "text-red-500", warning: "text-amber-500", info: "text-blue-500" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { ...opts, id }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) => toast({ type: "success", title, message }), [toast]);
  const error = useCallback((title: string, message?: string) => toast({ type: "error", title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: "warning", title, message }), [toast]);
  const info = useCallback((title: string, message?: string) => toast({ type: "info", title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
        {toasts.map(t => {
          const Icon = icons[t.type];
          return (
            <div key={t.id} className={`flex items-start gap-3 p-4 rounded-xl border-l-4 shadow-lg ${colors[t.type]} animate-in slide-in-from-right-2`}>
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColors[t.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">{t.title}</p>
                {t.message && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{t.message}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="p-0.5 hover:bg-gray-100 rounded">
                <X className="w-4 h-4 text-[var(--muted-foreground)]" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
