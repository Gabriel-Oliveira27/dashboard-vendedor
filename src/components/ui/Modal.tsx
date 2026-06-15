"use client";
import { useEffect } from "react";

interface ModalProps { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; maxWidth?: string; footer?: React.ReactNode; }
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && open) onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-overlay visible" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        {title && (
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="btn-icon" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

interface ConfirmModalProps { open: boolean; onClose: () => void; onConfirm: () => void; message: string; confirmLabel?: string; loading?: boolean; }
export function ConfirmModal({ open, onClose, onConfirm, message, confirmLabel = "Confirmar", loading }: ConfirmModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="modal-overlay visible" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card confirm-card">
        <div className="modal-header">
          <h3>Confirmar</h3>
          <button className="btn-icon" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="modal-body">
          <p className="confirm-msg" dangerouslySetInnerHTML={{ __html: message }} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>{loading ? "Aguarde…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
