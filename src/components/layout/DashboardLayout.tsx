"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import type { Section } from "@/types";
import { Menu } from "lucide-react";

const SECTION_TITLES: Record<Section, string> = {
  overview:  "Visão Geral",
  estoque:   "Estoque",
  pedidos:   "Pedidos",
  cupons:    "Cupons",
  config:    "Configurações",
  descontos: "Descontos",
  frete:     "Modelo de Frete",
  relatorio: "Relatório",
  usuarios:  "Usuários",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  active: Section;
  onNavigate: (s: Section) => void;
}

export function DashboardLayout({
  children,
  active,
  onNavigate,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { cycleTheme } = useTheme();

  return (
    <div className="flex min-h-dvh bg-[var(--bg)]">
      <Sidebar
        active={active}
        onNavigate={onNavigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-64 pb-16 lg:pb-0 min-h-dvh">
        {/* Header */}
        <header className="h-[60px] bg-[var(--surface)] border-b border-[var(--border)] flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-[100]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Menu size={22} />
          </button>

          <h1 className="flex-1 text-[1.1rem] font-bold tracking-tight text-[var(--text)]">
            {SECTION_TITLES[active]}
          </h1>

          <button
            onClick={cycleTheme}
            className="p-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
            title="Alternar tema"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
            </svg>
          </button>
        </header>

        {/* Content */}
        <main
          className={cn(
            "flex-1 flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 section-enter"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
