"use client";
import { useToast } from "@/contexts/ToastContext";

const META = {
  success: { cls: "toast-success", title: "Sucesso",    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg> },
  error:   { cls: "toast-error",   title: "Erro",       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> },
  warning: { cls: "toast-warning", title: "Atenção",    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  info:    { cls: "toast-info",    title: "Informação", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
} as const;

export function ToastContainer() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="toast-container">
      {toasts.map((t) => {
        const m = META[t.type];
        return (
          <div key={t.id} className={`toast ${m.cls}`}>
            <div className="toast-icon">{m.icon}</div>
            <div className="toast-body">
              <div className="toast-title">{m.title}</div>
              <div className="toast-msg">{t.message}</div>
            </div>
            <button className="toast-close" onClick={() => dismiss(t.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
