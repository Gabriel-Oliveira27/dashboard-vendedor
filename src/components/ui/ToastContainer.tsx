"use client";

import { useToast } from "@/contexts/ToastContext";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const META = {
  success: { Icon: CheckCircle, color: "var(--success)", bg: "var(--success-soft)", title: "Sucesso",    border: "var(--success)" },
  error:   { Icon: XCircle,     color: "var(--danger)",  bg: "var(--danger-soft)",  title: "Erro",       border: "var(--danger)"  },
  warning: { Icon: AlertTriangle,color:"var(--warning)", bg: "var(--warning-soft)", title: "Atenção",    border: "var(--warning)" },
  info:    { Icon: Info,        color: "var(--info)",    bg: "var(--info-soft)",    title: "Informação", border: "var(--info)"    },
} as const;

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[600] flex flex-col gap-2.5 pointer-events-none w-[calc(100%-2rem)] max-w-[360px]">
      {toasts.map((toast) => {
        const m = META[toast.type];
        return (
          <div
            key={toast.id}
            className="flex items-start gap-3 px-4 py-3.5 rounded-[var(--radius-md)] pointer-events-auto toast-enter"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderLeft: `3px solid ${m.border}`,
              boxShadow: "0 4px 24px rgba(0,0,0,.25), 0 1px 4px rgba(0,0,0,.1)",
            }}
          >
            <div
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 mt-[1px]"
              style={{ background: m.bg, color: m.color }}
            >
              <m.Icon size={13} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[0.78rem] font-bold text-[var(--text)] uppercase tracking-[0.04em] mb-0.5">
                {m.title}
              </p>
              <p className="text-[0.875rem] text-[var(--text-muted)] leading-snug break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
