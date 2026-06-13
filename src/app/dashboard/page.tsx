"use client";

import { useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OverviewSection } from "@/components/modules/OverviewSection";
import { EstoqueSection } from "@/components/modules/EstoqueSection";
import { PedidosSection } from "@/components/modules/PedidosSection";
import { FreteSection } from "@/components/modules/FreteSection";
import {
  CuponsSection,
  ConfigSection,
  DescontosSection,
  RelatorioSection,
  UsuariosSection,
} from "@/components/modules/OtherSections";
import type { Section } from "@/types";

function DashboardContent() {
  const { loading } = useAuth();
  const [section, setSection] = useState<Section>("overview");

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
            style={{ background: "linear-gradient(135deg, var(--accent), #5b21b6)" }}>
            T
          </div>
          <svg className="animate-spin text-[var(--accent)]" viewBox="0 0 24 24" fill="none" width="24" height="24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
              strokeDasharray="31.4 31.4" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  const sectionMap: Record<Section, React.ReactNode> = {
    overview:  <OverviewSection />,
    estoque:   <EstoqueSection />,
    pedidos:   <PedidosSection />,
    cupons:    <CuponsSection />,
    config:    <ConfigSection />,
    descontos: <DescontosSection />,
    frete:     <FreteSection />,
    relatorio: <RelatorioSection />,
    usuarios:  <UsuariosSection />,
  };

  return (
    <DashboardLayout active={section} onNavigate={setSection}>
      {sectionMap[section]}
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DashboardContent />
          <ToastContainer />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
