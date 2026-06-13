"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  footer?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-[560px]",
  footer,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-[4px] z-[400] flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          "bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)]",
          "w-full flex flex-col shadow-[var(--shadow-lg)]",
          "max-h-[90dvh] sm:max-h-[90vh]",
          "animate-[modal-in_0.25s_cubic-bezier(0.16,1,0.3,1)]",
          // Mobile: bottom sheet
          "sm:rounded-[var(--radius-lg)]",
          maxWidth
        )}
        style={{
          animation: "modal-in 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
            <h3 className="text-[1.05rem] font-bold tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--border)] shrink-0">
            {footer}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.96) translateY(-12px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  message,
  confirmLabel = "Confirmar",
  loading,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirmar"
      maxWidth="max-w-[400px]"
      footer={
        <>
          <button
            onClick={onClose}
            className="h-[38px] px-4 rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-[38px] px-4 rounded-[var(--radius-md)] bg-[var(--danger-soft)] text-[var(--danger)] border border-[rgba(239,68,68,0.25)] hover:bg-[var(--danger)] hover:text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Aguarde…" : confirmLabel}
          </button>
        </>
      }
    >
      <p
        className="text-[0.95rem] text-[var(--text-muted)] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: message }}
      />
    </Modal>
  );
}
