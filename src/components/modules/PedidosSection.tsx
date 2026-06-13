"use client";

import { useEffect, useState, useCallback } from "react";
import { API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { ConfirmModal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Input";
import type { Pedido, EtapaPedido } from "@/types";
import { RefreshCw, X, RotateCcw } from "lucide-react";

type PagamentoFilter = "" | "PENDENTE" | "REALIZADO";

const ETAPA_SEQUENCE: EtapaPedido[] = [
  "RESERVADO","CONFIRMADO","EM_PREPARO","SAIU_PARA_ENTREGA","ENTREGUE","CANCELADO",
];

const ETAPA_META: Record<EtapaPedido, { label: string; variant: "yellow"|"blue"|"orange"|"purple"|"green"|"red" }> = {
  RESERVADO:         { label: "Reservado",       variant: "yellow"  },
  CONFIRMADO:        { label: "Confirmado",       variant: "blue"    },
  EM_PREPARO:        { label: "Em Preparo",       variant: "orange"  },
  SAIU_PARA_ENTREGA: { label: "Saiu p/ Entrega", variant: "purple"  },
  ENTREGUE:          { label: "Entregue",         variant: "green"   },
  CANCELADO:         { label: "Cancelado",        variant: "red"     },
};

function getNextEtapa(e: EtapaPedido): EtapaPedido | null {
  const idx = ETAPA_SEQUENCE.indexOf(e);
  if (idx === -1 || idx >= ETAPA_SEQUENCE.length - 2) return null;
  return ETAPA_SEQUENCE[idx + 1];
}

export function PedidosSection() {
  const { isAdmin, canEdit } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [etapaFilter, setEtapaFilter] = useState<string>("");
  const [pagFilter, setPagFilter] = useState<PagamentoFilter>("");
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
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = data.filter((p) =>
    (!etapaFilter || p.etapa === etapaFilter) &&
    (!pagFilter   || p.pagamento === pagFilter)
  );

  const updatePedido = (id: number, patch: Partial<Pedido>) => {
    setData((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p));
    setSelected((prev) => prev?.id === id ? { ...prev, ...patch } : prev);
  };

  const doConfirm = async () => {
    if (!confirm) return;
    setConfirming(true);
    try { await confirm.action(); }
    finally { setConfirming(false); setConfirm(null); }
  };

  const advanceEtapa = async (pedido: Pedido) => {
    const next = getNextEtapa(pedido.etapa);
    if (!next) return;
    const label = ETAPA_META[next].label;

    if (next === "CANCELADO") {
      setConfirm({
        msg: `Tem certeza que deseja <strong>cancelar</strong> este pedido?`,
        action: async () => {
          await API.updateEtapa(pedido.id, next);
          updatePedido(pedido.id, { etapa: next });
          showToast(`Etapa avançada para "${label}".`, "success");
        },
      });
    } else {
      await API.updateEtapa(pedido.id, next);
      updatePedido(pedido.id, { etapa: next });
      showToast(`Etapa avançada para "${label}".`, "success");
    }
  };

  const markPaid = async (pedido: Pedido) => {
    await API.updatePagamento(pedido.id);
    updatePedido(pedido.id, { pagamento: "REALIZADO" });
    showToast("Pagamento confirmado!", "success");
  };

  const devolucao = (pedido: Pedido) => {
    const itens = Array.isArray(pedido.pedido) ? pedido.pedido : [];
    const lista = itens.map((i) => `<li>${i.descricao} — x${i.qty}</li>`).join("");
    setConfirm({
      msg: `Registrar <strong>devolução</strong>? O estoque será restaurado automaticamente.${lista ? `<ul style="margin:.6rem 0 0;padding-left:1.25rem;font-size:.85rem">${lista}</ul>` : ""}`,
      action: async () => {
        await API.devolucao(pedido.id);
        updatePedido(pedido.id, { etapa: "CANCELADO" });
        showToast("Devolução registrada.", "success");
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={etapaFilter} onChange={(e) => setEtapaFilter(e.target.value)} className="w-auto min-w-[160px]">
          <option value="">Todas as Etapas</option>
          {ETAPA_SEQUENCE.map((e) => <option key={e} value={e}>{ETAPA_META[e].label}</option>)}
        </Select>
        <Select value={pagFilter} onChange={(e) => setPagFilter(e.target.value as PagamentoFilter)} className="w-auto min-w-[160px]">
          <option value="">Todo Pagamento</option>
          <option value="PENDENTE">Pendente</option>
          <option value="REALIZADO">Realizado</option>
        </Select>
        <button onClick={load} className="p-2 rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {["Rastreio","Cliente","Total","Método","Etapa","Pagamento","Data"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-[0.07em] text-[var(--text-muted)] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows rows={6} cols={7} /> :
             filtered.length === 0 ? (
               <tr><td colSpan={7} className="text-center py-12 text-[var(--text-dim)] text-[0.9rem]">Nenhum pedido encontrado.</td></tr>
             ) : filtered.map((p) => {
               const et = ETAPA_META[p.etapa] || { label: p.etapa, variant: "gray" as const };
               const pago = p.pagamento === "REALIZADO";
               return (
                 <tr
                   key={p.id}
                   onClick={() => setSelected(p)}
                   className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                 >
                   <td className="px-4 py-3">
                     <code className="font-mono text-[0.8rem] bg-[var(--bg)] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--accent)]">
                       {p.idRastreio || String(p.id)}
                     </code>
                   </td>
                   <td className="px-4 py-3 font-semibold text-[0.9rem]">{p.nome}</td>
                   <td className="px-4 py-3 font-semibold text-[0.875rem]">{formatCurrency(p.totalVenda)}</td>
                   <td className="px-4 py-3 text-[var(--text-muted)] text-[0.875rem]">{p.metodoPagamento}</td>
                   <td className="px-4 py-3"><Badge variant={et.variant}>{et.label}</Badge></td>
                   <td className="px-4 py-3"><Badge variant={pago ? "green" : "yellow"}>{pago ? "Realizado" : "Pendente"}</Badge></td>
                   <td className="px-4 py-3 text-[var(--text-muted)] text-[0.82rem] whitespace-nowrap">{formatDate(p.dataCompra)}</td>
                 </tr>
               );
             })}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          pedido={selected}
          precos={precos}
          podeEditar={podeEditar}
          onClose={() => setSelected(null)}
          onAdvance={advanceEtapa}
          onMarkPaid={markPaid}
          onDevolucao={devolucao}
        />
      )}

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doConfirm}
        loading={confirming}
        message={confirm?.msg || ""}
      />
    </div>
  );
}

function DetailPanel({ pedido: p, precos, podeEditar, onClose, onAdvance, onMarkPaid, onDevolucao }: {
  pedido: Pedido;
  precos: Record<string, number>;
  podeEditar: boolean;
  onClose: () => void;
  onAdvance: (p: Pedido) => Promise<void>;
  onMarkPaid: (p: Pedido) => Promise<void>;
  onDevolucao: (p: Pedido) => void;
}) {
  const et = ETAPA_META[p.etapa] || { label: p.etapa, variant: "gray" as const };
  const pago = p.pagamento === "REALIZADO";
  const cancelado = p.etapa === "CANCELADO";
  const next = getNextEtapa(p.etapa);
  const itens = Array.isArray(p.pedido) ? p.pedido : [];
  const [working, setWorking] = useState(false);

  const wrap = async (fn: (p: Pedido) => Promise<void>) => {
    setWorking(true);
    try { await fn(p); } finally { setWorking(false); }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300]" onClick={onClose} />

      {/* Panel */}
      <aside className="fixed top-0 right-0 w-full sm:w-[420px] h-dvh bg-[var(--surface)] border-l border-[var(--border)] z-[301] flex flex-col shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <h3 className="font-bold">Detalhes do Pedido</h3>
          <button onClick={onClose} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          <Section title="Cliente">
            <Row label="Nome" value={p.nome} />
            <Row label="Contato" value={p.contato} />
            <Row label="Endereço" value={p.endereco} />
          </Section>

          <Section title={`Pedido ${p.idRastreio || p.id}`}>
            {itens.length > 0 && (
              <ul className="flex flex-col divide-y divide-[var(--border)]">
                {itens.map((item, i) => {
                  const price = precos[String(item.id)] || 0;
                  return (
                    <li key={i} className="flex items-center gap-2 py-2 text-[0.875rem]">
                      <span className="flex-1 font-medium">{item.descricao}</span>
                      {item.cores && <span className="text-[var(--text-dim)] text-[0.8rem]">{item.cores}</span>}
                      <span className="text-[var(--text-muted)]">x{item.qty}</span>
                      <span className="font-semibold ml-auto">{price > 0 ? formatCurrency(price * item.qty) : "—"}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-2 flex flex-col divide-y divide-[var(--border)]">
              <Row label="Subtotal" value={formatCurrency(p.subtotal)} />
              <Row label="Frete"    value={formatCurrency(p.frete)} />
              {p.cupom && <Row label="Cupom" value={p.cupom} />}
              {p.parcelas && p.parcelas > 1 && <Row label="Parcelas" value={`${p.parcelas}x`} />}
              {p.trocoPara && <Row label="Troco p/" value={formatCurrency(p.trocoPara)} />}
              <div className="flex justify-between py-2 font-bold">
                <span>Total</span>
                <span className="text-[var(--accent)] text-[1.05rem]">{formatCurrency(p.totalVenda)}</span>
              </div>
            </div>
          </Section>

          <Section title="Status">
            <Row label="Etapa"     value={<Badge variant={et.variant}>{et.label}</Badge>} />
            <Row label="Pagamento" value={<Badge variant={pago ? "green" : "yellow"}>{pago ? "Realizado" : "Pendente"}</Badge>} />
            <Row label="Método"    value={p.metodoPagamento} />
            <Row label="Data"      value={formatDate(p.dataCompra)} />
          </Section>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            {cancelado ? (
              <p className="text-center text-[0.85rem] text-[var(--text-dim)]">Pedido cancelado — nenhuma ação disponível.</p>
            ) : podeEditar ? (
              <>
                {next ? (
                  <Button fullWidth loading={working} onClick={() => wrap(onAdvance)}>
                    Avançar para {ETAPA_META[next].label}
                  </Button>
                ) : (
                  <Button variant="ghost" fullWidth disabled>Etapa final</Button>
                )}
                {!pago ? (
                  <Button variant="success" fullWidth loading={working} onClick={() => wrap(onMarkPaid)}>
                    Marcar como Pago
                  </Button>
                ) : (
                  <Button variant="ghost" fullWidth disabled>Pagamento Confirmado</Button>
                )}
                <Button variant="danger" fullWidth onClick={() => onDevolucao(p)}>
                  <RotateCcw size={16} /> Registrar Devolução
                </Button>
              </>
            ) : (
              <p className="text-center text-[0.85rem] text-[var(--text-dim)]">Acesso somente de visualização.</p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[0.72rem] font-bold uppercase tracking-[0.07em] text-[var(--text-muted)] mb-3">{title}</h4>
      <div className="flex flex-col divide-y divide-[var(--border)]">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-[0.875rem]">
      <span className="text-[var(--text-muted)] shrink-0">{label}</span>
      <strong className="font-medium text-right break-all">{value}</strong>
    </div>
  );
}
