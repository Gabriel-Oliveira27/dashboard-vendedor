"use client";

import { useEffect, useState, useCallback } from "react";
import { API } from "@/lib/api";
import { formatCurrency, isToday, isThisMonth } from "@/lib/utils";
import { SkeletonCard, Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import type { Pedido, Produto } from "@/types";
import {
  ClipboardList, AlertCircle, DollarSign, Monitor, RefreshCw,
} from "lucide-react";

interface OverviewData {
  pedidos: Pedido[];
  estoque: Produto[];
}

export function OverviewSection() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pedidos, estoque] = await Promise.all([
        API.getPedidos(),
        API.getEstoque(),
      ]);
      setData({
        pedidos: Array.isArray(pedidos) ? pedidos : [],
        estoque: Array.isArray(estoque) ? estoque : [],
      });
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <OverviewSkeleton />;
  if (error) return <p className="text-[var(--danger)] text-sm">{error}</p>;
  if (!data) return null;

  const hoje      = data.pedidos.filter((p) => isToday(p.dataCompra));
  const pendentes = data.pedidos.filter(
    (p) => p.pagamento !== "REALIZADO" && p.etapa !== "CANCELADO"
  );
  const tHoje = hoje.reduce((s, p) => s + (parseFloat(String(p.totalVenda)) || 0), 0);
  const tMes  = data.pedidos
    .filter((p) => isThisMonth(p.dataCompra))
    .reduce((s, p) => s + (parseFloat(String(p.totalVenda)) || 0), 0);
  const baixo = data.estoque.filter((e) => (parseInt(String(e.qtd)) || 0) < 5);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<ClipboardList size={22} />}
          iconClass="bg-[var(--info-soft)] text-[var(--info)]"
          label="Pedidos Hoje"
          value={String(hoje.length)}
        />
        <StatCard
          icon={<AlertCircle size={22} />}
          iconClass="bg-[var(--danger-soft)] text-[var(--danger)]"
          label="Pagtos. Pendentes"
          value={String(pendentes.length)}
          badge={pendentes.length > 0 ? "!" : undefined}
        />
        <StatCard
          icon={<DollarSign size={22} />}
          iconClass="bg-[var(--success-soft)] text-[var(--success)]"
          label="Vendas Hoje"
          value={formatCurrency(tHoje)}
        />
        <StatCard
          icon={<Monitor size={22} />}
          iconClass="bg-[var(--purple-soft)] text-[var(--accent)]"
          label="Vendas no Mês"
          value={formatCurrency(tMes)}
        />
      </div>

      {/* Low stock */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[0.9rem] font-bold text-[var(--text-muted)] uppercase tracking-wide">
            Estoque Baixo (menos de 5 unidades)
          </h3>
          <button
            onClick={load}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {baixo.length === 0 ? (
          <p className="text-[0.875rem] text-[var(--success)]">
            Todos os produtos com estoque adequado.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {baixo.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-sm)]"
              >
                <span className="text-[0.9rem] font-medium">
                  {p.produto || p.nome || "—"}
                </span>
                <Badge variant="red">{p.qtd} un</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconClass,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 sm:p-5 flex items-center gap-3 sm:gap-4 card-hover">
      <div
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-[0.72rem] sm:text-[0.75rem] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 truncate">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[1.1rem] sm:text-[1.4rem] font-bold text-[var(--text)] tracking-tight leading-none truncate">
            {value}
          </span>
          {badge && (
            <Badge variant="red" pulse>
              {badge}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
        <Skeleton height={12} width="40%" className="mb-3" />
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={38} />
          ))}
        </div>
      </div>
    </div>
  );
}
