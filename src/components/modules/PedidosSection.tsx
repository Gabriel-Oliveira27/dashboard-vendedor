"use client";
import { useEffect, useState, useCallback } from "react";
import { API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { ConfirmModal } from "@/components/ui/Modal";
import type { Pedido, EtapaPedido } from "@/types";

type PagFilter = "" | "PENDENTE" | "REALIZADO";

const ETAPA_SEQ: EtapaPedido[] = ["RESERVADO","CONFIRMADO","EM_PREPARO","SAIU_PARA_ENTREGA","ENTREGUE","CANCELADO"];
const ETAPA_META: Record<EtapaPedido, { label: string; variant: "yellow"|"blue"|"orange"|"purple"|"green"|"red" }> = {
  RESERVADO:         { label: "Reservado",       variant: "yellow"  },
  CONFIRMADO:        { label: "Confirmado",       variant: "blue"    },
  EM_PREPARO:        { label: "Em Preparo",       variant: "orange"  },
  SAIU_PARA_ENTREGA: { label: "Saiu p/ Entrega", variant: "purple"  },
  ENTREGUE:          { label: "Entregue",         variant: "green"   },
  CANCELADO:         { label: "Cancelado",        variant: "red"     },
};
const nextEtapa = (e: EtapaPedido): EtapaPedido | null => {
  const i = ETAPA_SEQ.indexOf(e);
  return i === -1 || i >= ETAPA_SEQ.length - 2 ? null : ETAPA_SEQ[i + 1];
};

export function PedidosSection() {
  const { isAdmin, canEdit } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [etapaFilter, setEtapaFilter] = useState("");
  const [pagFilter, setPagFilter] = useState<PagFilter>("");
  const [selected, setSelected] = useState<Pedido | null>(null);
  const [precos, setPrecos] = useState<Record<string, number>>({});
  const [confirm, setConfirm] = useState<{ msg: string; action: () => Promise<void> } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const podeEditar = isAdmin() || canEdit("pedidos");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pedidos, estoque] = await Promise.all([API.getPedidos(), API.getEstoque()]);
      setData(Array.isArray(pedidos) ? pedidos : []);
      const pc: Record<string, number> = {};
      if (Array.isArray(estoque)) estoque.forEach((p) => { pc[String(p.id)] = parseFloat(String(p.valor)) || 0; });
      setPrecos(pc);
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = data.filter((p) => (!etapaFilter || p.etapa === etapaFilter) && (!pagFilter || p.pagamento === pagFilter));

  const updatePedido = (id: number, patch: Partial<Pedido>) => {
    setData((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p));
    setSelected((prev) => prev?.id === id ? { ...prev, ...patch } : prev);
  };

  const advanceEtapa = async (pedido: Pedido) => {
    const next = nextEtapa(pedido.etapa); if (!next) return;
    if (next === "CANCELADO") {
      setConfirm({ msg: "Tem certeza que deseja <strong>cancelar</strong> este pedido?", action: async () => {
        await API.updateEtapa(pedido.id, next); updatePedido(pedido.id, { etapa: next });
        showToast(`Etapa: ${ETAPA_META[next].label}`, "success");
      }});
    } else {
      await API.updateEtapa(pedido.id, next); updatePedido(pedido.id, { etapa: next });
      showToast(`Etapa: ${ETAPA_META[next].label}`, "success");
    }
  };

  const markPaid = async (pedido: Pedido) => {
    await API.updatePagamento(pedido.id); updatePedido(pedido.id, { pagamento: "REALIZADO" });
    showToast("Pagamento confirmado!", "success");
  };

  const devolucao = (pedido: Pedido) => {
    const itens = Array.isArray(pedido.pedido) ? pedido.pedido : [];
    const lista = itens.map((i) => `<li>${i.descricao} — x${i.qty}</li>`).join("");
    setConfirm({ msg: `Registrar <strong>devolução</strong>? O estoque será restaurado.${lista ? `<ul style="margin:.6rem 0 0;padding-left:1.25rem;font-size:.85rem">${lista}</ul>` : ""}`, action: async () => {
      await API.devolucao(pedido.id); updatePedido(pedido.id, { etapa: "CANCELADO" });
      showToast("Devolução registrada.", "success");
    }});
  };

  return (
    <div>
      {/* Filters */}
      <div className="section-header">
        <div className="section-actions">
          <select className="input-select" style={{ width: "auto", minWidth: "160px" }} value={etapaFilter} onChange={(e) => setEtapaFilter(e.target.value)}>
            <option value="">Todas as Etapas</option>
            {ETAPA_SEQ.map((e) => <option key={e} value={e}>{ETAPA_META[e].label}</option>)}
          </select>
          <select className="input-select" style={{ width: "auto", minWidth: "150px" }} value={pagFilter} onChange={(e) => setPagFilter(e.target.value as PagFilter)}>
            <option value="">Todo Pagamento</option>
            <option value="PENDENTE">Pendente</option>
            <option value="REALIZADO">Realizado</option>
          </select>
          <button className="btn-icon" onClick={load} title="Atualizar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.8"/></svg>
          </button>
        </div>
      </div>

      {/* Table — desktop */}
      <div className="table-wrapper desktop-table">
        <table className="data-table">
          <thead>
            <tr>
              {["Rastreio","Cliente","Total","Método","Etapa","Pagamento","Data"].map((h) => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows rows={6} cols={7} /> :
             filtered.length === 0 ? <tr><td colSpan={7} className="empty-state">Nenhum pedido encontrado.</td></tr> :
             filtered.map((p) => {
               const et = ETAPA_META[p.etapa] || { label: p.etapa, variant: "gray" as const };
               const pago = p.pagamento === "REALIZADO";
               return (
                 <tr key={p.id} className="table-row clickable-row" onClick={() => setSelected(p)}>
                   <td><code className="code-badge">{p.idRastreio || String(p.id)}</code></td>
                   <td className="font-medium">{p.nome}</td>
                   <td className="font-medium">{formatCurrency(p.totalVenda)}</td>
                   <td className="td-muted">{p.metodoPagamento}</td>
                   <td><Badge variant={et.variant}>{et.label}</Badge></td>
                   <td><Badge variant={pago ? "green" : "yellow"}>{pago ? "Realizado" : "Pendente"}</Badge></td>
                   <td className="td-muted td-date">{formatDate(p.dataCompra)}</td>
                 </tr>
               );
             })}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="mobile-card-list">
        {loading ? (
          <div className="skeleton-line" style={{ height: "80px", borderRadius: "var(--radius-md)" }} />
        ) : filtered.length === 0 ? (
          <p className="empty-state">Nenhum pedido encontrado.</p>
        ) : filtered.map((p) => {
          const et = ETAPA_META[p.etapa] || { label: p.etapa, variant: "gray" as const };
          const pago = p.pagamento === "REALIZADO";
          return (
            <div key={p.id} className="mobile-card" onClick={() => setSelected(p)} style={{ cursor: "pointer" }}>
              <div className="mobile-card-row">
                <span className="font-medium">{p.nome}</span>
                <code className="code-badge">{p.idRastreio || String(p.id)}</code>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Total</span>
                <span className="font-medium">{formatCurrency(p.totalVenda)}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Etapa</span>
                <Badge variant={et.variant}>{et.label}</Badge>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Pagamento</span>
                <Badge variant={pago ? "green" : "yellow"}>{pago ? "Realizado" : "Pendente"}</Badge>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Data</span>
                <span className="td-muted" style={{ fontSize: "0.8rem" }}>{formatDate(p.dataCompra)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <>
          <div className="panel-overlay visible" onClick={() => setSelected(null)} />
          <DetailPanel pedido={selected} precos={precos} podeEditar={podeEditar}
            onClose={() => setSelected(null)} onAdvance={advanceEtapa} onMarkPaid={markPaid} onDevolucao={devolucao} />
        </>
      )}

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={async () => { setConfirming(true); try { await confirm?.action(); } finally { setConfirming(false); setConfirm(null); } }}
        loading={confirming} message={confirm?.msg || ""} />
    </div>
  );
}

function DetailPanel({ pedido: p, precos, podeEditar, onClose, onAdvance, onMarkPaid, onDevolucao }: {
  pedido: Pedido; precos: Record<string, number>; podeEditar: boolean;
  onClose: () => void; onAdvance: (p: Pedido) => Promise<void>; onMarkPaid: (p: Pedido) => Promise<void>; onDevolucao: (p: Pedido) => void;
}) {
  const et = ETAPA_META[p.etapa] || { label: p.etapa, variant: "gray" as const };
  const pago = p.pagamento === "REALIZADO";
  const cancelado = p.etapa === "CANCELADO";
  const next = nextEtapa(p.etapa);
  const itens = Array.isArray(p.pedido) ? p.pedido : [];
  const [working, setWorking] = useState(false);
  const wrap = async (fn: (p: Pedido) => Promise<void>) => { setWorking(true); try { await fn(p); } finally { setWorking(false); } };

  return (
    <aside className="detail-panel open">
      <div className="panel-header">
        <h3>Detalhes do Pedido</h3>
        <button className="btn-icon" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="panel-body">
        <div className="panel-section">
          <h4>Cliente</h4>
          <div className="detail-grid">
            {p.nome && <div className="detail-row"><span>Nome</span><strong>{p.nome}</strong></div>}
            {p.contato && <div className="detail-row"><span>Contato</span><strong>{p.contato}</strong></div>}
            {p.endereco && <div className="detail-row"><span>Endereço</span><strong>{p.endereco}</strong></div>}
          </div>
        </div>

        <div className="panel-section">
          <h4>Pedido {p.idRastreio || p.id}</h4>
          {itens.length > 0 && (
            <ul className="order-items">
              {itens.map((item, i) => {
                const price = precos[String(item.id)] || 0;
                return (
                  <li key={i} className="order-item">
                    <span className="item-name">{item.descricao}</span>
                    {item.cores && <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{item.cores}</span>}
                    <span className="item-qty">x{item.qty}</span>
                    <span className="item-price">{price > 0 ? formatCurrency(price * item.qty) : "—"}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="detail-grid" style={{ marginTop: "0.5rem" }}>
            {p.subtotal != null && <div className="detail-row"><span>Subtotal</span><strong>{formatCurrency(p.subtotal)}</strong></div>}
            {p.frete != null && <div className="detail-row"><span>Frete</span><strong>{formatCurrency(p.frete)}</strong></div>}
            {p.cupom && <div className="detail-row"><span>Cupom</span><strong>{p.cupom}</strong></div>}
            {p.parcelas && p.parcelas > 1 && <div className="detail-row"><span>Parcelas</span><strong>{p.parcelas}x</strong></div>}
            {p.trocoPara && <div className="detail-row"><span>Troco p/</span><strong>{formatCurrency(p.trocoPara)}</strong></div>}
            <div className="detail-row total-row"><span>Total</span><strong>{formatCurrency(p.totalVenda)}</strong></div>
          </div>
        </div>

        <div className="panel-section">
          <h4>Status</h4>
          <div className="detail-grid">
            <div className="detail-row"><span>Etapa</span><strong><Badge variant={et.variant}>{et.label}</Badge></strong></div>
            <div className="detail-row"><span>Pagamento</span><strong><Badge variant={pago ? "green" : "yellow"}>{pago ? "Realizado" : "Pendente"}</Badge></strong></div>
            <div className="detail-row"><span>Método</span><strong>{p.metodoPagamento}</strong></div>
            <div className="detail-row"><span>Data</span><strong>{formatDate(p.dataCompra)}</strong></div>
          </div>
        </div>

        <div className="panel-actions">
          {cancelado ? <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-dim)" }}>Pedido cancelado — nenhuma ação disponível.</p> :
           podeEditar ? (
            <>
              {next ? <button className="btn btn-primary btn-full" disabled={working} onClick={() => wrap(onAdvance)}>Avançar para {ETAPA_META[next].label}</button>
                     : <button className="btn btn-ghost btn-full" disabled>Etapa final</button>}
              {!pago
                ? <button className="btn btn-success btn-full" disabled={working} onClick={() => wrap(onMarkPaid)}>Marcar como Pago</button>
                : <button className="btn btn-ghost btn-full" disabled>Pagamento Confirmado</button>}
              <button className="btn btn-danger btn-full" onClick={() => onDevolucao(p)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.8"/></svg>
                Registrar Devolução
              </button>
            </>
           ) : <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-dim)" }}>Acesso somente de visualização.</p>}
        </div>
      </div>
    </aside>
  );
}
