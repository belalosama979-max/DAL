"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  confirm: (message: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400",
  error:   "bg-red-500/10   border-red-500/30   text-red-600   dark:text-red-400",
  warning: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
  info:    "bg-primary/10   border-primary/30   text-primary",
};

const iconStyles = {
  success: "text-green-500",
  error:   "text-red-500",
  warning: "text-orange-500",
  info:    "text-primary",
};

interface ConfirmDialog {
  message: string;
  resolve: (value: boolean) => void;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<ConfirmDialog | null>(null);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ message, resolve });
    });
  }, []);

  const dismissToast = (id: string) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  const handleConfirm = (value: boolean) => {
    dialog?.resolve(value);
    setDialog(null);
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast Stack */}
      <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 pointer-events-none" dir="rtl">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-xl backdrop-blur-sm min-w-72 max-w-sm animate-[slide-in-up_0.3s_ease-out] ${styles[t.type]}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconStyles[t.type]}`} />
              <p className="text-sm font-semibold flex-1 leading-relaxed">{t.message}</p>
              <button
                onClick={() => dismissToast(t.id)}
                className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm Dialog */}
      {dialog && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
          onClick={(e) => e.target === e.currentTarget && handleConfirm(false)}
        >
          <div
            className="bg-background border border-secondary rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-[slide-in-up_0.25s_ease-out]"
            dir="rtl"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-orange-500" />
              </div>
              <p className="text-foreground font-bold text-lg leading-relaxed">{dialog.message}</p>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => handleConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-bold hover:bg-secondary/80 transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handleConfirm(true)}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
                >
                  تأكيد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
