"use client";

import { LogoIcon } from "@/components/ui/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, THEMES } from "@/contexts/ThemeContext";
import { API } from "@/lib/api";
import type { Section, Theme } from "@/types";
import { useState, useEffect, useRef } from "react";

const NAV_ITEMS: { section: Section; label: string; icon: React.ReactNode; permKey?: string; adminOnly?: boolean }[] = [
  { section: "overview",  label: "Visão Geral",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { section: "estoque",   label: "Estoque",       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>, permKey: "estoque" },
  { section: "pedidos",   label: "Pedidos",       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, permKey: "pedidos" },
  { section: "cupons",    label: "Cupons",        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>, permKey: "cupons" },
  { section: "config",    label: "Configurações", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, permKey: "config" },
  { section: "descontos", label: "Descontos",     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>, permKey: "config" },
  { section: "frete",     label: "Frete",         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, permKey: "config" },
  { section: "relatorio", label: "Relatório",     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { section: "usuarios",  label: "Usuários",      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, adminOnly: true },
];

const THEME_ICONS: Record<Theme, React.ReactNode> = {
  dark:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  light:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>,
  violet:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  midnight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  forest:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M12 22V12"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><path d="M8 6h.01"/><path d="M12 2a4 4 0 0 1 4 4c0 1.5-.5 3-2 4H10c-1.5-1-2-2.5-2-4a4 4 0 0 1 4-4z"/></svg>,
  rose:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M12 22s8-4.5 8-11.8A8 8 0 0 0 4 9.3C4 16.5 12 22 12 22z"/></svg>,
};

interface SidebarProps {
  active: Section;
  onNavigate: (s: Section) => void;
  open: boolean;
}

export function Sidebar({ active, onNavigate, open }: SidebarProps) {
  const { user, logout, isAdmin, canView, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const initials = (user?.nome || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  const visible = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin();
    if (item.permKey) return isAdmin() || canView(item.permKey);
    return true;
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleTheme = async (t: Theme) => {
    setTheme(t);
    if (user) {
      try { await API.updateUsuario(user.id, { tema: t }); } catch {}
    }
  };

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo-icon"><LogoIcon size={22} /></div>
        <span className="sidebar-logo-text">Tupper<strong>Store</strong></span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {visible.map((item, idx) => {
          const prev = visible[idx - 1];
          const showDivider =
            (item.section === "config" && prev?.section !== "config" && prev?.section !== "descontos" && prev?.section !== "frete") ||
            (item.section === "relatorio");
          return (
            <div key={item.section}>
              {showDivider && <div className="nav-divider" />}
              <button
                className={`nav-item ${active === item.section ? "active" : ""}`}
                onClick={() => onNavigate(item.section)}
              >
                {item.icon}
                {item.label}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Profile footer */}
      <div ref={profileRef} style={{ position: "relative" }}>
        {/* Profile panel */}
        <div className={`profile-panel ${profileOpen ? "open" : ""}`}>
          <div className="profile-panel-header">
            <div className="profile-panel-avatar">
              {user?.foto
                ? <img src={user.foto} alt="" />
                : initials}
            </div>
            <div>
              <div className="profile-panel-name">{user?.nome}</div>
              <div className="profile-panel-role">{user?.isAdmin ? "Administrador" : "Usuário"}</div>
            </div>
          </div>

          <div className="profile-panel-sep" />
          <div className="profile-panel-section-label">Aparência</div>

          {(Object.keys(THEMES) as Theme[]).map((t) => (
            <button
              key={t}
              className={`panel-item ${theme === t ? "panel-item-active" : ""}`}
              onClick={() => handleTheme(t)}
            >
              <span className="panel-item-icon">{THEME_ICONS[t]}</span>
              {THEMES[t].label}
              {theme === t && (
                <span className="panel-item-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
            </button>
          ))}

          <div className="profile-panel-sep" />
          <div className="profile-panel-section-label">Foto do perfil</div>
          <PhotoUploadItem user={user} setUser={setUser} />

          <div className="profile-panel-sep" />
          <button className="panel-item panel-item-danger" onClick={logout}>
            <span className="panel-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            Sair da conta
          </button>
        </div>

        {/* Footer trigger */}
        <button
          className="sidebar-footer"
          style={{ width: "100%", border: "none" }}
          onClick={() => setProfileOpen(!profileOpen)}
        >
          <div className="sidebar-user-avatar">
            {user?.foto ? <img src={user.foto} alt="" /> : initials}
          </div>
          <span className="sidebar-user-name">{user?.nome || "Usuário"}</span>
          <span
            style={{ marginLeft: "auto", color: "var(--text-dim)", lineHeight: 0, padding: "4px", borderRadius: "6px" }}
            onClick={(e) => { e.stopPropagation(); logout(); }}
            title="Sair"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
        </button>
      </div>
    </aside>
  );
}

function PhotoUploadItem({ user, setUser }: { user: ReturnType<typeof useAuth>["user"]; setUser: ReturnType<typeof useAuth>["setUser"] }) {
  const [uploading, setUploading] = useState(false);

  const handle = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await API.uploadImagem(fd);
      if (res?.url && user) {
        await API.updateUsuario(user.id, { foto: res.url });
        setUser({ ...user, foto: res.url });
      }
    } catch {}
    finally { setUploading(false); }
  };

  return (
    <div style={{ padding: "0.4rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {uploading
        ? <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "0.3rem 0.25rem" }}>Enviando…</span>
        : (
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <label style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.6rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Câmera
              <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
            </label>
            <label style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.6rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Galeria
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
            </label>
          </div>
        )}
    </div>
  );
}
