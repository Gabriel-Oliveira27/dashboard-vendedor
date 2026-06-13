"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme, THEMES } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { API } from "@/lib/api";
import type { Section, Theme } from "@/types";
import {
  LayoutGrid, Package, ClipboardList, Tag, Settings,
  Percent, Truck, BarChart2, Users, LogOut, Sun, Moon,
  Sparkles, Star, Leaf, Heart, Camera,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

const NAV_ITEMS: {
  section: Section;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  adminOnly?: boolean;
  permKey?: string;
}[] = [
  { section: "overview",  label: "Visão Geral",  Icon: LayoutGrid },
  { section: "estoque",   label: "Estoque",       Icon: Package,       permKey: "estoque" },
  { section: "pedidos",   label: "Pedidos",       Icon: ClipboardList, permKey: "pedidos" },
  { section: "cupons",    label: "Cupons",        Icon: Tag,           permKey: "cupons"  },
  { section: "config",    label: "Configurações", Icon: Settings,      permKey: "config"  },
  { section: "descontos", label: "Descontos",     Icon: Percent,       permKey: "config"  },
  { section: "frete",     label: "Frete",         Icon: Truck,         permKey: "config"  },
  { section: "relatorio", label: "Relatório",     Icon: BarChart2 },
  { section: "usuarios",  label: "Usuários",      Icon: Users,         adminOnly: true    },
];

const BOTTOM_NAV: (typeof NAV_ITEMS[0])[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[5],
  NAV_ITEMS[7],
];

const THEME_ICONS: Record<Theme, React.ComponentType<{ size?: number }>> = {
  dark:     Moon,
  light:    Sun,
  violet:   Sparkles,
  midnight: Star,
  forest:   Leaf,
  rose:     Heart,
};

interface SidebarProps {
  active: Section;
  onNavigate: (s: Section) => void;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ active, onNavigate, open, onClose }: SidebarProps) {
  const { user, logout, isAdmin, canView } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const initials = (user?.nome || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const visible = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin();
    if (item.permKey) return isAdmin() || canView(item.permKey);
    return true;
  });

  // Close profile panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNavigate = (s: Section) => {
    onNavigate(s);
    onClose();
  };

  const handleThemeSelect = async (t: Theme) => {
    setTheme(t);
    if (user) {
      try {
        await API.updateUsuario(user.id, { tema: t });
      } catch {}
    }
  };

  return (
    <>
      {/* Overlay (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[199] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-dvh w-64 flex flex-col z-[200]",
          "bg-[var(--surface)] border-r border-[var(--border)]",
          "transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--border)] shrink-0">
          <div className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-[var(--accent)] to-[#5b21b6] flex items-center justify-center text-white font-bold text-base shadow-[0_4px_12px_rgba(124,58,237,0.35)] shrink-0">
            T
          </div>
          <span className="text-[var(--text-muted)] font-semibold text-[1rem]">
            Tupper<strong className="text-[var(--text)]">Store</strong>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden">
          {visible.map((item, idx) => {
            const prev = visible[idx - 1];
            const showDivider =
              (item.section === "config" && prev?.section !== "config") ||
              (item.section === "relatorio" && prev?.section !== "relatorio");

            return (
              <div key={item.section}>
                {showDivider && (
                  <div className="h-px bg-[var(--border)] mx-3 my-1.5" />
                )}
                <button
                  onClick={() => handleNavigate(item.section)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-[0.7rem] rounded-[var(--radius-md)]",
                    "text-[0.9rem] font-medium transition-all duration-150 mb-0.5",
                    active === item.section
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                  )}
                >
                  <span className="shrink-0 opacity-80"><item.Icon size={18} /></span>
                  {item.label}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Profile footer */}
        <div ref={profileRef} className="shrink-0">
          {/* Profile panel popover */}
          {profileOpen && (
            <div className="absolute bottom-[72px] left-2 w-60 bg-[var(--surface)] border border-[var(--border)] rounded-[14px] shadow-[var(--shadow-lg)] z-10 overflow-hidden">
              {/* User info */}
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[var(--accent-soft)] border-2 border-[var(--accent)] flex items-center justify-center text-[var(--accent)] text-[0.78rem] font-bold shrink-0">
                  {user?.foto ? (
                    <img src={user.foto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[0.875rem] font-semibold text-[var(--text)] truncate">
                    {user?.nome}
                  </p>
                  <p className="text-[0.75rem] text-[var(--text-muted)]">
                    {user?.isAdmin ? "Administrador" : "Usuário"}
                  </p>
                </div>
              </div>

              <div className="h-px bg-[var(--border)]" />

              {/* Themes */}
              <div className="px-4 pt-2 pb-1 text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[var(--text-dim)]">
                Aparência
              </div>
              {(Object.keys(THEMES) as Theme[]).map((t) => {
                const ThemeIcon = THEME_ICONS[t];
                const isActive = theme === t;
                return (
                  <button
                    key={t}
                    onClick={() => handleThemeSelect(t)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-4 py-2.5 text-[0.875rem] font-medium transition-colors",
                      isActive
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                    )}
                  >
                    <ThemeIcon size={16} />
                    <span className="flex-1 text-left">{THEMES[t].label}</span>
                    {isActive && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}

              <div className="h-px bg-[var(--border)]" />

              {/* Change photo */}
              <PhotoMenuItem onClose={() => setProfileOpen(false)} />

              <div className="h-px bg-[var(--border)]" />

              {/* Logout */}
              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors text-[0.875rem] font-medium"
              >
                <LogOut size={16} />
                Sair da conta
              </button>
            </div>
          )}

          {/* Footer button */}
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors text-left"
          >
            <div className="w-[34px] h-[34px] rounded-full overflow-hidden bg-[var(--accent-soft)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] text-[0.8rem] font-bold shrink-0">
              {user?.foto ? (
                <img src={user.foto} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <span className="flex-1 text-[0.875rem] font-semibold text-[var(--text)] truncate">
              {user?.nome || "Usuário"}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); logout(); }}
              className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
            >
              <LogOut size={18} />
            </button>
          </button>
        </div>
      </aside>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-[var(--surface)] border-t border-[var(--border)] z-[150] flex lg:hidden">
        {BOTTOM_NAV.map((item) => (
          <button
            key={item.section}
            onClick={() => handleNavigate(item.section)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.04em] transition-colors",
              active === item.section
                ? "text-[var(--accent)] bg-[var(--accent-soft)]"
                : "text-[var(--text-dim)] hover:text-[var(--text)]"
            )}
          >
            <item.Icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}

// ── Photo menu item with camera + upload ─────────────────────────────────────
function PhotoMenuItem({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await API.uploadImagem(fd);
      const url = res?.url;
      if (!url) throw new Error("URL não retornada");
      if (user) {
        await API.updateUsuario(user.id, { foto: url });
        setUser({ ...user, foto: url });
      }
      setOpen(false);
      onClose();
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors text-[0.875rem] font-medium"
      >
        <Camera size={16} />
        Trocar foto
      </button>
    );
  }

  return (
    <div className="px-3 py-2 flex flex-col gap-1.5">
      <p className="text-[0.72rem] text-[var(--text-muted)] px-1">
        {uploading ? "Enviando…" : "Escolha a origem:"}
      </p>
      {/* Camera capture */}
      <label className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--bg)] border border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition-colors text-[0.82rem] text-[var(--text-muted)]">
        <Camera size={14} />
        Câmera
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </label>
      {/* File upload */}
      <label className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--bg)] border border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition-colors text-[0.82rem] text-[var(--text-muted)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Galeria / Arquivo
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </label>
      <button
        onClick={() => setOpen(false)}
        className="text-[0.75rem] text-[var(--text-dim)] text-center py-1"
      >
        Cancelar
      </button>
    </div>
  );
}
