"use client";

import { useEffect, useState, useCallback } from "react";
import { API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, isToday, isThisMonth } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { SkeletonRows } from "@/components/ui/Skeleton";
import type { Cupom, ConfigVendas, Pedido, Produto, Usuario } from "@/types";
import { Plus, Trash2, RefreshCw, Save, Tag, Percent, TrendingUp, Calendar, Target } from "lucide-react";

// ══════════════════════════════════════════════════════════════════════════════
// CUPONS
// ══════════════════════════════════════════════════════════════════════════════
export function CuponsSection() {
  const { isAdmin, canEdit } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [desconto, setDesconto] = useState("");
  const [usos, setUsos] = useState("");
  const [saving, setSaving] = useState(false);

  const podeEditar = isAdmin() || canEdit("cupons");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.getCupons();
      setData(Array.isArray(res) ? res : []);
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const createCupom = async () => {
    if (!codigo.trim() || !desconto.trim() || !usos) { showToast("Preencha todos os campos.", "warning"); return; }
    const usosN = parseInt(usos);
    if (isNaN(usosN) || usosN < 1) { showToast("Quantidade de usos inválida.", "warning"); return; }
    setSaving(true);
    try {
      const novo = await API.createCupom({ cupom: codigo.toUpperCase(), desconto: parseFloat(desconto) || 0, quantidadeUsos: usosN });
      setData((prev) => [novo, ...prev]);
      showToast(`Cupom "${codigo}" criado!`, "success");
      setNewOpen(false); setCodigo(""); setDesconto(""); setUsos("");
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  const deleteCupom = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await API.deleteCupom(deleteId);
      setData((prev) => prev.filter((c) => c.id !== deleteId));
      showToast("Cupom excluído.", "success");
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setDeleting(false); setDeleteId(null); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        {podeEditar && <Button size="sm" onClick={() => setNewOpen(true)}><Plus size={14} /> Novo Cupom</Button>}
        <button onClick={load} className="p-2 rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors"><RefreshCw size={14} /></button>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse min-w-[400px]">
          <thead><tr className="border-b border-[var(--border)]">
            {["Código","Desconto","Usos","Ação"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-[0.07em] text-[var(--text-muted)]">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <SkeletonRows rows={4} cols={4} /> :
             data.length === 0 ? (
               <tr><td colSpan={4} className="text-center py-12 text-[var(--text-dim)] text-[0.9rem]">Nenhum cupom cadastrado.</td></tr>
             ) : data.map((c) => {
               const cod = c.cupom || c.codigo || "—";
               const usos = parseInt(String(c.quantidadeUsos ?? c.usosRestantes)) || 0;
               return (
                 <tr key={c.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors">
                   <td className="px-4 py-3"><code className="font-mono text-[0.8rem] bg-[var(--bg)] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--accent)]">{cod}</code></td>
                   <td className="px-4 py-3 text-[0.875rem]">{c.desconto}</td>
                   <td className="px-4 py-3"><Badge variant={usos <= 0 ? "red" : "green"}>{usos <= 0 ? "Esgotado" : `${usos} uso(s)`}</Badge></td>
                   <td className="px-4 py-3">
                     {podeEditar ? (
                       <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] transition-colors"><Trash2 size={15} /></button>
                     ) : <span className="text-[var(--text-muted)] text-[0.78rem]">—</span>}
                   </td>
                 </tr>
               );
             })}
          </tbody>
        </table>
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Novo Cupom"
        footer={<><Button variant="ghost" onClick={() => setNewOpen(false)}>Cancelar</Button><Button onClick={createCupom} loading={saving}>Criar Cupom</Button></>}>
        <Input label="Código *" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="EX: DESCONTO10" />
        <Input label="Desconto *" value={desconto} onChange={(e) => setDesconto(e.target.value)} placeholder='Ex: "10" para 10% ou "frete grátis"' />
        <Input label="Quantidade de Usos *" type="number" min="1" value={usos} onChange={(e) => setUsos(e.target.value)} placeholder="Ex: 100" />
      </Modal>

      <ConfirmModal open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={deleteCupom} loading={deleting}
        message={`Excluir o cupom <strong>${data.find((c) => c.id === deleteId)?.cupom || deleteId}</strong>? Esta ação não pode ser desfeita.`} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════════════════════════════════
export function ConfigSection() {
  const { isAdmin, canEdit } = useAuth();
  const { showToast } = useToast();
  const [cfg, setCfg] = useState<ConfigVendas>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ConfigVendas>({});

  const podeEditar = isAdmin() || canEdit("config");

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await API.getConfigVendas(); setCfg(res || {}); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const startEdit = () => { setForm({ ...cfg }); setEditing(true); };

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([
        API.updateConfigVendas({ pix: form.pix || "", whatsapp: form.whatsapp || "" }),
        API.setConfigKey("WHATSAPP_ATIVO",    form.WHATSAPP_ATIVO    || "true"),
        API.setConfigKey("PAGAMENTO_PIX",     form.PAGAMENTO_PIX     || "true"),
        API.setConfigKey("PAGAMENTO_CREDITO", form.PAGAMENTO_CREDITO || "true"),
        API.setConfigKey("PAGAMENTO_DINHEIRO",form.PAGAMENTO_DINHEIRO|| "true"),
        API.setConfigKey("ORIGEM_ENDERECO",   form.ORIGEM_ENDERECO   || ""),
        API.setConfigKey("ORIGEM_CEP",        form.ORIGEM_CEP        || ""),
        API.setConfigKey("ORIGEM_LAT",        form.ORIGEM_LAT        || ""),
        API.setConfigKey("ORIGEM_LON",        form.ORIGEM_LON        || ""),
      ]);
      setCfg({ ...cfg, ...form });
      showToast("Configurações salvas!", "success");
      setEditing(false);
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="skeleton h-[200px] rounded-[var(--radius-lg)]" />;

  const Toggle = ({ field }: { field: string }) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <div className="relative">
        <input type="checkbox" className="sr-only"
          checked={form[field] !== "false"}
          onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.checked ? "true" : "false" }))} />
        <div className={`w-11 h-6 rounded-full transition-colors ${form[field] !== "false" ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`} />
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form[field] !== "false" ? "translate-x-5" : ""}`} />
      </div>
    </label>
  );

  return (
    <div className="flex flex-col gap-4 max-w-[620px]">
      {!editing ? (
        <>
          <Card icon="💳" label="Chave PIX" value={cfg.pix || "Não configurada"} />
          <Card icon="💬" label="WhatsApp"  value={cfg.whatsapp || "Não configurado"} />
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 flex flex-wrap gap-2 items-center">
            <span className="text-[0.75rem] font-bold uppercase tracking-wide text-[var(--text-muted)] mr-2">Métodos de Pagamento</span>
            <Badge variant={cfg.PAGAMENTO_PIX !== "false" ? "green" : "gray"}>PIX</Badge>
            <Badge variant={cfg.PAGAMENTO_CREDITO !== "false" ? "green" : "gray"}>Crédito</Badge>
            <Badge variant={cfg.PAGAMENTO_DINHEIRO !== "false" ? "green" : "gray"}>Dinheiro</Badge>
          </div>
          {podeEditar && <Button onClick={startEdit} className="self-start"><Save size={16} /> Editar Configurações</Button>}
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 sm:p-5 flex flex-col gap-4">
            <Input label="Chave PIX" value={form.pix || ""} onChange={(e) => setForm((p) => ({ ...p, pix: e.target.value }))} placeholder="CPF, e-mail, telefone ou chave aleatória" />
            <Input label="WhatsApp (só números)" value={form.whatsapp || ""} onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value.replace(/\D/g,"") }))} placeholder="5588999990000" />
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 flex flex-col gap-3">
            <p className="text-[0.75rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">Métodos de Pagamento</p>
            {["PAGAMENTO_PIX","PAGAMENTO_CREDITO","PAGAMENTO_DINHEIRO"].map((f) => (
              <div key={f} className="flex items-center justify-between">
                <span className="text-[0.875rem]">{f.replace("PAGAMENTO_","").replace("PIX","PIX").replace("CREDITO","Cartão de Crédito").replace("DINHEIRO","Dinheiro")}</span>
                <Toggle field={f} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button onClick={save} loading={saving}><Save size={16} /> Salvar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 flex items-center gap-4">
      <span className="text-2xl">{icon}</span>
      <div><p className="text-[0.72rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">{label}</p><p className="font-semibold text-[1rem]">{value}</p></div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DESCONTOS
// ══════════════════════════════════════════════════════════════════════════════
const LINHAS_DESCONTO = ["FREEZER","AQUECER","CONSERVAR","PREPARAR","SERVIR","ARMAZENAR"];

export function DescontosSection() {
  const { isAdmin, canEdit } = useAuth();
  const { showToast } = useToast();
  const [cfg, setCfg] = useState<ConfigVendas>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string,string>>({});
  const [saving, setSaving] = useState(false);

  const podeEditar = isAdmin() || canEdit("config");

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await API.getConfigVendas(); setCfg(res || {}); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const startEdit = () => {
    const f: Record<string,string> = { DESCONTO_GLOBAL: String(cfg.DESCONTO_GLOBAL || "0") };
    LINHAS_DESCONTO.forEach((l) => { f[`DESCONTO_LINHA_${l}`] = String(cfg[`DESCONTO_LINHA_${l}`] || "0"); });
    setForm(f); setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all(Object.entries(form).map(([k,v]) => API.setConfigKey(k, v)));
      setCfg((prev) => ({ ...prev, ...form }));
      showToast("Descontos salvos!", "success");
      setEditing(false);
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="skeleton h-[200px] rounded-[var(--radius-lg)]" />;

  return (
    <div className="flex flex-col gap-4 max-w-[560px]">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0"><Percent size={20} /></div>
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">Desconto Global</p>
            <p className="font-semibold text-[1rem]">{parseInt(String(cfg.DESCONTO_GLOBAL)) > 0 ? `${cfg.DESCONTO_GLOBAL}% em toda a loja` : "Sem desconto global"}</p>
          </div>
        </div>
        <div className="border-t border-[var(--border)] pt-3 flex flex-col divide-y divide-[var(--border)]">
          {LINHAS_DESCONTO.map((l) => {
            const v = parseInt(String(cfg[`DESCONTO_LINHA_${l}`])) || 0;
            return (
              <div key={l} className="flex items-center justify-between py-2">
                <span className="text-[0.875rem] font-medium">{l}</span>
                <Badge variant={v > 0 ? "purple" : "gray"}>{v > 0 ? `${v}%` : "Sem desconto"}</Badge>
              </div>
            );
          })}
        </div>
      </div>

      {podeEditar && !editing && <Button onClick={startEdit} className="self-start"><Percent size={16} /> Editar Descontos</Button>}

      {editing && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <input type="number" min="0" max="100" value={form.DESCONTO_GLOBAL}
              onChange={(e) => setForm((p) => ({ ...p, DESCONTO_GLOBAL: e.target.value }))}
              className="h-[36px] w-20 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] px-3 text-[0.875rem] text-right focus:outline-none focus:border-[var(--accent)]" />
            <span className="text-[var(--text-muted)]">% — Desconto global</span>
          </div>
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {LINHAS_DESCONTO.map((l) => (
              <div key={l} className="flex items-center gap-3 py-2">
                <span className="flex-1 text-[0.875rem] font-medium">{l}</span>
                <input type="number" min="0" max="100" value={form[`DESCONTO_LINHA_${l}`] || "0"}
                  onChange={(e) => setForm((p) => ({ ...p, [`DESCONTO_LINHA_${l}`]: e.target.value }))}
                  className="h-[36px] w-20 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] px-3 text-[0.875rem] text-right focus:outline-none focus:border-[var(--accent)]" />
                <span className="text-[var(--text-muted)] text-[0.85rem]">%</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button onClick={save} loading={saving}><Save size={16} /> Salvar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RELATÓRIO
// ══════════════════════════════════════════════════════════════════════════════
export function RelatorioSection() {
  const { showToast } = useToast();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await API.getPedidos(); setPedidos(Array.isArray(res) ? res : []); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const pagos   = pedidos.filter((p) => p.pagamento === "REALIZADO");
  const total   = pagos.reduce((s,p) => s + (parseFloat(String(p.totalVenda)) || 0), 0);
  const totalMs = pagos.filter((p) => isThisMonth(p.dataCompra)).reduce((s,p) => s + (parseFloat(String(p.totalVenda)) || 0), 0);
  const ticket  = pagos.length ? total / pagos.length : 0;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex justify-end">
        <button onClick={load} className="p-2 rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors"><RefreshCw size={14} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {loading ? [1,2,3].map((i) => <div key={i} className="skeleton h-[88px] rounded-[var(--radius-lg)]" />) : (
          <>
            <StatR icon={<TrendingUp size={22} />} cls="bg-[var(--success-soft)] text-[var(--success)]" label="Lucro Total"   value={formatCurrency(total)} />
            <StatR icon={<Calendar size={22} />}   cls="bg-[var(--purple-soft)] text-[var(--accent)]"   label="Lucro do Mês" value={formatCurrency(totalMs)} />
            <StatR icon={<Target size={22} />}     cls="bg-[var(--info-soft)] text-[var(--info)]"       label="Ticket Médio" value={formatCurrency(ticket)} />
          </>
        )}
      </div>
      {!loading && <MiniChart pedidos={pagos} />}
    </div>
  );
}

function StatR({ icon, cls, label, value }: { icon: React.ReactNode; cls: string; label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 sm:p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>{icon}</div>
      <div><p className="text-[0.72rem] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1">{label}</p><p className="text-[1.4rem] font-bold tracking-tight">{value}</p></div>
    </div>
  );
}

function MiniChart({ pedidos }: { pedidos: Pedido[] }) {
  const days: { key: string; label: string; total: number }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    days.push({ key: d.toISOString().slice(0,10), label: `${d.getDate()}/${d.getMonth()+1}`, total: 0 });
  }
  pedidos.forEach((p) => {
    const k = new Date(p.dataCompra).toISOString().slice(0,10);
    const d = days.find((x) => x.key === k);
    if (d) d.total += parseFloat(String(p.totalVenda)) || 0;
  });
  const max = Math.max(...days.map((d) => d.total), 100);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <h3 className="text-[0.9rem] font-bold text-[var(--text-muted)] uppercase tracking-[0.05em]">Vendas — Últimos 14 Dias</h3>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-end gap-1 sm:gap-1.5 h-28">
          {days.map((d,i) => {
            const h = Math.max(2, (d.total / max) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  title={`${d.label}: ${d.total > 0 ? `R$ ${d.total.toFixed(2)}` : "—"}`}
                  className="w-full rounded-t-sm transition-all"
                  style={{ height: `${h}%`, background: d.total > 0 ? "var(--accent)" : "var(--border)" }}
                />
                <span className="text-[0.58rem] text-[var(--text-dim)] hidden sm:block">{i % 2 === 0 ? d.label : ""}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// USUÁRIOS
// ══════════════════════════════════════════════════════════════════════════════
const SECOES = [
  { key: "estoque",  label: "Estoque"  },
  { key: "pedidos",  label: "Pedidos"  },
  { key: "cupons",   label: "Cupons"   },
  { key: "config",   label: "Config"   },
  { key: "usuarios", label: "Usuários" },
];

export function UsuariosSection() {
  const { isAdmin, user: me, setUser } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<Usuario | null | undefined>(undefined);
  const [deactivateId, setDeactivateId] = useState<number | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const load = useCallback(async () => {
    if (!isAdmin()) return;
    setLoading(true);
    try { const res = await API.getUsuarios(); setData(Array.isArray(res) ? res : []); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [isAdmin, showToast]);

  useEffect(() => { load(); }, [load]);

  const deactivate = async () => {
    if (!deactivateId) return;
    setDeactivating(true);
    try {
      await API.deleteUsuario(deactivateId);
      setData((prev) => prev.map((u) => u.id === deactivateId ? { ...u, ativo: false } : u));
      showToast("Usuário desativado.", "success");
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setDeactivating(false); setDeactivateId(null); }
  };

  if (!isAdmin()) return <p className="text-[var(--text-muted)]">Acesso restrito a administradores.</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" onClick={() => setEditUser(null)}><Plus size={14} /> Novo Usuário</Button>
        <button onClick={load} className="p-2 rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors"><RefreshCw size={14} /></button>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <thead><tr className="border-b border-[var(--border)]">
            {["Usuário","E-mail","Papel","Status","Ações"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-[0.07em] text-[var(--text-muted)]">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <SkeletonRows rows={3} cols={5} /> :
             data.map((u) => {
               const initials = (u.nome || "?").split(" ").map((p) => p[0]).join("").slice(0,2).toUpperCase();
               return (
                 <tr key={u.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors">
                   <td className="px-4 py-3">
                     <div className="flex items-center gap-2.5">
                       <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--accent-soft)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] text-[0.7rem] font-bold shrink-0">
                         {u.foto ? <img src={u.foto} alt="" className="w-full h-full object-cover" /> : initials}
                       </div>
                       <div>
                         <p className="font-semibold text-[0.875rem]">{u.nome}</p>
                         <p className="text-[0.75rem] text-[var(--text-muted)]">@{u.apelido}</p>
                       </div>
                     </div>
                   </td>
                   <td className="px-4 py-3 text-[var(--text-muted)] text-[0.875rem]">{u.email}</td>
                   <td className="px-4 py-3"><Badge variant={u.isAdmin ? "purple" : "gray"}>{u.isAdmin ? "Admin" : "Usuário"}</Badge></td>
                   <td className="px-4 py-3"><Badge variant={u.ativo ? "green" : "red"}>{u.ativo ? "Ativo" : "Inativo"}</Badge></td>
                   <td className="px-4 py-3">
                     {!u.isAdmin ? (
                       <div className="flex items-center gap-1">
                         <button onClick={() => setEditUser(u)} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors"><Tag size={14} /></button>
                         {me?.id !== u.id && <button onClick={() => setDeactivateId(u.id)} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] transition-colors"><Trash2 size={14} /></button>}
                       </div>
                     ) : <span className="text-[var(--text-muted)] text-[0.78rem]">—</span>}
                   </td>
                 </tr>
               );
             })}
          </tbody>
        </table>
      </div>

      {editUser !== undefined && (
        <UsuarioModal user={editUser} onClose={() => setEditUser(undefined)}
          onSaved={(saved, isNew) => {
            if (isNew) { setData((prev) => [saved, ...prev]); }
            else { setData((prev) => prev.map((u) => u.id === saved.id ? saved : u)); }
            if (me?.id === saved.id) setUser(saved);
            setEditUser(undefined);
          }}
          showToast={showToast} />
      )}

      <ConfirmModal open={deactivateId !== null} onClose={() => setDeactivateId(null)} onConfirm={deactivate} loading={deactivating}
        message={`Desativar o usuário <strong>${data.find((u) => u.id === deactivateId)?.nome}</strong>? Ele não conseguirá mais fazer login.`} />
    </div>
  );
}

function UsuarioModal({ user, onClose, onSaved, showToast }: {
  user: Usuario | null;
  onClose: () => void;
  onSaved: (u: Usuario, isNew: boolean) => void;
  showToast: (msg: string, t?: "success"|"error"|"warning"|"info") => void;
}) {
  const isNew = !user;
  const [nome, setNome] = useState(user?.nome || "");
  const [apelido, setApelido] = useState(user?.apelido || "");
  const [email, setEmail] = useState(user?.email || "");
  const [senha, setSenha] = useState("");
  const [ativo, setAtivo] = useState(user?.ativo ?? true);
  const [foto, setFoto] = useState(user?.foto || "");
  const [uploading, setUploading] = useState(false);
  const [perms, setPerms] = useState<Record<string,{ver:boolean,editar:boolean}>>(
    user?.permissoes
      ? Object.fromEntries(SECOES.map((s) => [s.key, user.permissoes[s.key as keyof typeof user.permissoes] || { ver:false, editar:false }]))
      : Object.fromEntries(SECOES.map((s) => [s.key, { ver:false, editar:false }]))
  );
  const [saving, setSaving] = useState(false);

  const handlePhotoFile = async (file: File, isCamera: boolean) => {
    void isCamera;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await API.uploadImagem(fd);
      if (res?.url) setFoto(res.url);
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!nome || !apelido || !email) { showToast("Preencha nome, apelido e e-mail.", "warning"); return; }
    if (isNew && senha.length < 8) { showToast("Senha deve ter ao menos 8 caracteres.", "warning"); return; }
    setSaving(true);
    try {
      const permissoes = Object.fromEntries(SECOES.map((s) => [s.key, perms[s.key]])) as unknown as Usuario["permissoes"];
      if (isNew) {
        const novo = await API.createUsuario({ nome, apelido, email, senha, foto: foto || null, permissoes, ativo: true });
        showToast(`Usuário "${nome}" criado!`, "success");
        onSaved(novo, true);
      } else {
        const dados: Parameters<typeof API.updateUsuario>[1] = { nome, apelido, foto: foto || null, permissoes, ativo };
        if (senha && senha.length >= 8) dados.senha = senha;
        const updated = await API.updateUsuario(user!.id, dados);
        showToast("Usuário atualizado!", "success");
        onSaved({ ...user!, ...updated }, false);
      }
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={isNew ? "Novo Usuário" : "Editar Usuário"} maxWidth="max-w-[500px]"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save} loading={saving}>{isNew ? "Criar Usuário" : "Salvar Alterações"}</Button></>}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Nome completo *" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="João Silva" />
        <Input label="Apelido *" value={apelido} onChange={(e) => setApelido(e.target.value)} placeholder="joao" />
      </div>
      <Input label="E-mail *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={!isNew} />
      <Input label={isNew ? "Senha *" : "Nova Senha (deixe em branco para manter)"} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder={isNew ? "Mínimo 8 caracteres" : "••••••"} />

      {/* Photo: camera + upload, NO URL field */}
      <div className="flex flex-col gap-2">
        <label className="text-[0.78rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">Foto do Usuário</label>
        {foto && <img src={foto} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-[var(--accent)]" />}
        <div className="flex gap-2 flex-wrap">
          <label className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--bg)] border border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition-colors text-[0.82rem] text-[var(--text-muted)]">
            📷 Câmera
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhotoFile(e.target.files[0], true)} />
          </label>
          <label className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--bg)] border border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition-colors text-[0.82rem] text-[var(--text-muted)]">
            🖼️ {uploading ? "Enviando…" : "Galeria"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhotoFile(e.target.files[0], false)} />
          </label>
          {foto && <button onClick={() => setFoto("")} className="px-3 py-2 text-[0.82rem] text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded transition-colors">Remover</button>}
        </div>
      </div>

      {/* Permissions */}
      <div>
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)] mb-2">Permissões de Acesso</p>
        <div className="border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_80px] bg-[var(--bg)] border-b border-[var(--border)] px-4 py-2 text-[0.7rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
            <span>Seção</span><span className="text-center">Ver</span><span className="text-center">Editar</span>
          </div>
          {SECOES.map((s) => (
            <div key={s.key} className="grid grid-cols-[1fr_80px_80px] items-center px-4 py-2.5 border-b border-[var(--border)] last:border-0">
              <span className="text-[0.875rem] font-medium">{s.label}</span>
              <div className="flex justify-center">
                <input type="checkbox" checked={perms[s.key]?.ver || false}
                  onChange={(e) => { const v = e.target.checked; setPerms((p) => ({ ...p, [s.key]: { ...p[s.key], ver: v, editar: v ? p[s.key]?.editar : false } })); }}
                  className="w-4 h-4 accent-[var(--accent)] cursor-pointer" />
              </div>
              <div className="flex justify-center">
                <input type="checkbox" checked={perms[s.key]?.editar || false}
                  onChange={(e) => { const v = e.target.checked; setPerms((p) => ({ ...p, [s.key]: { ver: v ? true : p[s.key]?.ver, editar: v } })); }}
                  className="w-4 h-4 accent-[var(--accent)] cursor-pointer" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {!isNew && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
          <span className="text-[0.875rem]">Usuário ativo</span>
        </label>
      )}
    </Modal>
  );
}
