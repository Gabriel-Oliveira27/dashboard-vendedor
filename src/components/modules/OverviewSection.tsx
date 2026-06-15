"use client";
import { useEffect, useState, useCallback } from "react";
import { API } from "@/lib/api";
import { formatCurrency, isToday, isThisMonth } from "@/lib/utils";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import type { Pedido, Produto } from "@/types";

export function OverviewSection() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [estoque, setEstoque] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, e] = await Promise.all([API.getPedidos(), API.getEstoque()]);
      setPedidos(Array.isArray(p) ? p : []);
      setEstoque(Array.isArray(e) ? e : []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hoje      = pedidos.filter((p) => isToday(p.dataCompra));
  const pendentes = pedidos.filter((p) => p.pagamento !== "REALIZADO" && p.etapa !== "CANCELADO");
  const tHoje     = hoje.reduce((s, p) => s + (parseFloat(String(p.totalVenda)) || 0), 0);
  const tMes      = pedidos.filter((p) => isThisMonth(p.dataCompra)).reduce((s, p) => s + (parseFloat(String(p.totalVenda)) || 0), 0);
  const baixo     = estoque.filter((e) => (parseInt(String(e.qtd)) || 0) < 5);

  return (
    <div>
      <div className="overview-cards">
        {loading ? [1,2,3,4].map((i) => <SkeletonCard key={i} />) : (
          <>
            <div className="overview-card">
              <div className="card-icon icon-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
              <div className="card-info"><span className="card-label">Pedidos Hoje</span><div className="card-value">{hoje.length}</div></div>
            </div>
            <div className="overview-card">
              <div className="card-icon icon-red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
              <div className="card-info"><span className="card-label">Pagtos. Pendentes</span><div className="card-value">{pendentes.length}{pendentes.length > 0 && <Badge variant="red" pulse>!</Badge>}</div></div>
            </div>
            <div className="overview-card">
              <div className="card-icon icon-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
              <div className="card-info"><span className="card-label">Vendas Hoje</span><div className="card-value">{formatCurrency(tHoje)}</div></div>
            </div>
            <div className="overview-card">
              <div className="card-icon icon-purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
              <div className="card-info"><span className="card-label">Vendas no Mês</span><div className="card-value">{formatCurrency(tMes)}</div></div>
            </div>
          </>
        )}
      </div>

      <div className="low-stock-section">
        <div className="section-subtitle">Estoque Baixo (menos de 5 unidades)</div>
        {loading ? <div className="skeleton-line w60" style={{marginTop:"0.75rem"}} /> :
         baixo.length === 0 ? <p className="empty-state-small">✓ Todos os produtos com estoque adequado.</p> : (
          <div className="low-stock-list">
            {baixo.map((p) => (
              <div key={p.id} className="low-stock-item">
                <span className="low-stock-name">{p.produto || p.nome || "—"}</span>
                <Badge variant="red">{p.qtd} un</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
