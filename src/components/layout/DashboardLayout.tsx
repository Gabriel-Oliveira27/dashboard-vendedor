"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import type { Section } from "@/types";

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

const BOTTOM_NAV_ITEMS: { section: Section; label: string; icon: React.ReactNode }[] = [
  { section: "overview",  label: "Início",    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { section: "estoque",   label: "Estoque",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
  { section: "pedidos",   label: "Pedidos",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { section: "descontos", label: "Descontos", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg> },
  { section: "relatorio", label: "Relatório", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  active: Section;
  onNavigate: (s: Section) => void;
}

export function DashboardLayout({ children, active, onNavigate }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { cycleTheme } = useTheme();

  return (
    <div className="dashboard-body">
      {/* Sidebar overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        active={active}
        onNavigate={(s) => { onNavigate(s); setSidebarOpen(false); }}
        open={sidebarOpen}
      />

      <div className="main-content">
        {/* Header */}
        <header className="main-header">
          <button className="hamburger" onClick={() => setSidebarOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <h1 className="page-title">{SECTION_TITLES[active]}</h1>
          <button className="theme-toggle-btn" onClick={cycleTheme} title="Alternar tema">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            </svg>
          </button>
        </header>

        {/* Main content */}
        <div className="content-section section-animate">
          {children}
        </div>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <button
            key={item.section}
            className={`bottom-nav-item ${active === item.section ? "active" : ""}`}
            onClick={() => onNavigate(item.section)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
