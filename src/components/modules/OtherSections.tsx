"use client";
import { useEffect, useState, useCallback } from "react";
import { API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency, isThisMonth } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { SkeletonRows } from "@/components/ui/Skeleton";
import type { Cupom, ConfigVendas, Pedido, Usuario } from "@/types";

// ══ CUPONS ═══════════════════════════════════════════════════════════════════
export function CuponsSection() {
  const { isAdmin, canEdit } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [codigo, setCodigo] = useState(""); const [desconto, setDesconto] = useState(""); const [usos, setUsos] = useState("");
  const [saving, setSaving] = useState(false);
  const podeEditar = isAdmin() || canEdit("cupons");

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await API.getCupons(); setData(Array.isArray(r) ? r : []); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [showToast]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!codigo.trim() || !desconto.trim() || !usos) { showToast("Preencha todos os campos.", "warning"); return; }
    const usosN = parseInt(usos); if (isNaN(usosN) || usosN < 1) { showToast("Usos inválido.", "warning"); return; }
    setSaving(true);
    try {
      const n = await API.createCupom({ cupom: codigo.toUpperCase(), desconto: parseFloat(desconto) || 0, quantidadeUsos: usosN });
      setData((p) => [n, ...p]); showToast(`Cupom criado!`, "success");
      setNewOpen(false); setCodigo(""); setDesconto(""); setUsos("");
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!deleteId) return; setDeleting(true);
    try { await API.deleteCupom(deleteId); setData((p) => p.filter((c) => c.id !== deleteId)); showToast("Cupom excluído.", "success"); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setDeleting(false); setDeleteId(null); }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-actions">
          {podeEditar && <button className="btn btn-primary btn-sm" onClick={() => setNewOpen(true)}>+ Novo Cupom</button>}
          <button className="btn-icon" onClick={load}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.8"/></svg></button>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr>{["Código","Desconto","Usos","Ação"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <SkeletonRows rows={4} cols={4} /> :
             data.length === 0 ? <tr><td colSpan={4} className="empty-state">Nenhum cupom cadastrado.</td></tr> :
             data.map((c) => {
               const cod = c.cupom || c.codigo || "—";
               const u = parseInt(String(c.quantidadeUsos ?? c.usosRestantes)) || 0;
               return (
                 <tr key={c.id} className="table-row">
                   <td><code className="code-badge">{cod}</code></td>
                   <td className="td-muted">{c.desconto}</td>
                   <td><Badge variant={u <= 0 ? "red" : "green"}>{u <= 0 ? "Esgotado" : `${u} uso(s)`}</Badge></td>
                   <td>{podeEditar ? <button className="btn-icon btn-danger-icon" onClick={() => setDeleteId(c.id)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button> : <span className="td-muted">—</span>}</td>
                 </tr>
               );
             })}
          </tbody>
        </table>
      </div>
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Novo Cupom"
        footer={<><button className="btn btn-ghost" onClick={() => setNewOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={create} disabled={saving}>{saving ? "Criando…" : "Criar Cupom"}</button></>}>
        <div className="form-group"><label>Código *</label><input className="input-field" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="EX: DESCONTO10" /></div>
        <div className="form-group"><label>Desconto *</label><input className="input-field" value={desconto} onChange={(e) => setDesconto(e.target.value)} placeholder='Ex: "10" para 10% ou "frete grátis"' /></div>
        <div className="form-group"><label>Quantidade de Usos *</label><input className="input-field" type="number" min="1" value={usos} onChange={(e) => setUsos(e.target.value)} placeholder="Ex: 100" /></div>
      </Modal>
      <ConfirmModal open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={del} loading={deleting}
        message={`Excluir o cupom <strong>${data.find((c) => c.id === deleteId)?.cupom || deleteId}</strong>?`} />
    </div>
  );
}

// ══ CONFIG ════════════════════════════════════════════════════════════════════
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
    try { const r = await API.getConfigVendas(); setCfg(r || {}); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [showToast]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([
        API.updateConfigVendas({ pix: form.pix || "", whatsapp: form.whatsapp || "" }),
        API.setConfigKey("WHATSAPP_ATIVO",     form.WHATSAPP_ATIVO    || "true"),
        API.setConfigKey("PAGAMENTO_PIX",      form.PAGAMENTO_PIX     || "true"),
        API.setConfigKey("PAGAMENTO_CREDITO",  form.PAGAMENTO_CREDITO || "true"),
        API.setConfigKey("PAGAMENTO_DINHEIRO", form.PAGAMENTO_DINHEIRO|| "true"),
      ]);
      setCfg({ ...cfg, ...form }); showToast("Configurações salvas!", "success"); setEditing(false);
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="skeleton-line" style={{ height: "80px", borderRadius: "var(--radius-lg)" }} />;

  const Toggle = ({ field }: { field: string }) => (
    <label className="cfg-toggle">
      <input type="checkbox" checked={form[field] !== "false"} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.checked ? "true" : "false" }))} />
      <div className="cfg-toggle-track"><div className="cfg-toggle-thumb" /></div>
    </label>
  );

  return (
    <div style={{ maxWidth: "620px", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {!editing ? (
        <>
          <div className="pix-card"><div className="pix-icon">💳</div><div><span className="pix-label">Chave PIX</span><span className="pix-value">{cfg.pix || "Não configurada"}</span></div></div>
          <div className="pix-card"><div className="pix-icon">💬</div><div><span className="pix-label">WhatsApp</span><span className="pix-value">{cfg.whatsapp || "Não configurado"}</span></div></div>
          <div className="pix-card" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
            <span className="pix-label" style={{ display: "block", width: "100%" }}>Métodos de Pagamento</span>
            <Badge variant={cfg.PAGAMENTO_PIX !== "false" ? "green" : "gray"}>PIX</Badge>
            <Badge variant={cfg.PAGAMENTO_CREDITO !== "false" ? "green" : "gray"}>Crédito</Badge>
            <Badge variant={cfg.PAGAMENTO_DINHEIRO !== "false" ? "green" : "gray"}>Dinheiro</Badge>
          </div>
          {podeEditar && <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => { setForm({ ...cfg }); setEditing(true); }}>Editar Configurações</button>}
        </>
      ) : (
        <>
          <div className="pix-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "1rem" }}>
            <div className="form-group"><label>Chave PIX</label><input className="input-field" value={form.pix || ""} onChange={(e) => setForm((p) => ({ ...p, pix: e.target.value }))} placeholder="CPF, e-mail, telefone ou chave aleatória" /></div>
            <div className="form-group"><label>WhatsApp (só números)</label><input className="input-field" value={form.whatsapp || ""} onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value.replace(/\D/g,"") }))} placeholder="5588999990000" /></div>
          </div>
          <div className="pix-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.75rem" }}>
            <span className="cfg-section-label">Métodos de Pagamento</span>
            {[["PAGAMENTO_PIX","PIX"],["PAGAMENTO_CREDITO","Cartão de Crédito"],["PAGAMENTO_DINHEIRO","Dinheiro"]].map(([f,l]) => (
              <div key={f} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.875rem" }}>{l}</span><Toggle field={f} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</button>
          </div>
        </>
      )}
    </div>
  );
}

// ══ DESCONTOS ════════════════════════════════════════════════════════════════
const LINHAS_D = ["FREEZER","AQUECER","CONSERVAR","PREPARAR","SERVIR","ARMAZENAR"];
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
    try { const r = await API.getConfigVendas(); setCfg(r || {}); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [showToast]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try { await Promise.all(Object.entries(form).map(([k,v]) => API.setConfigKey(k,v))); setCfg((p) => ({ ...p, ...form })); showToast("Descontos salvos!", "success"); setEditing(false); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="skeleton-line" style={{ height: "80px", borderRadius: "var(--radius-lg)" }} />;

  return (
    <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="pix-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="card-icon icon-purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>
          <div>
            <span className="card-label">Desconto Global</span>
            <div style={{ fontWeight: 600 }}>{parseInt(String(cfg.DESCONTO_GLOBAL)) > 0 ? `${cfg.DESCONTO_GLOBAL}% em toda a loja` : "Sem desconto global"}</div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
          {LINHAS_D.map((l) => {
            const v = parseInt(String(cfg[`DESCONTO_LINHA_${l}`])) || 0;
            return <div key={l} className="frete-row-view"><span>{l}</span><Badge variant={v > 0 ? "purple" : "gray"}>{v > 0 ? `${v}%` : "Sem desconto"}</Badge></div>;
          })}
        </div>
      </div>
      {podeEditar && !editing && <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => { const f: Record<string,string> = { DESCONTO_GLOBAL: String(cfg.DESCONTO_GLOBAL || "0") }; LINHAS_D.forEach((l) => { f[`DESCONTO_LINHA_${l}`] = String(cfg[`DESCONTO_LINHA_${l}`] || "0"); }); setForm(f); setEditing(true); }}>Editar Descontos</button>}
      {editing && (
        <div className="pix-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input type="number" min="0" max="100" value={form.DESCONTO_GLOBAL} onChange={(e) => setForm((p) => ({ ...p, DESCONTO_GLOBAL: e.target.value }))} className="input-field" style={{ maxWidth: "80px", textAlign: "right" }} />
            <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>% — Desconto global</span>
          </div>
          {LINHAS_D.map((l) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500 }}>{l}</span>
              <input type="number" min="0" max="100" value={form[`DESCONTO_LINHA_${l}`] || "0"} onChange={(e) => setForm((p) => ({ ...p, [`DESCONTO_LINHA_${l}`]: e.target.value }))} className="input-field" style={{ maxWidth: "80px", textAlign: "right" }} />
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>%</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══ RELATÓRIO ════════════════════════════════════════════════════════════════
export function RelatorioSection() {
  const { showToast } = useToast();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await API.getPedidos(); setPedidos(Array.isArray(r) ? r : []); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [showToast]);
  useEffect(() => { load(); }, [load]);

  const pagos = pedidos.filter((p) => p.pagamento === "REALIZADO");
  const total = pagos.reduce((s,p) => s + (parseFloat(String(p.totalVenda)) || 0), 0);
  const totalMs = pagos.filter((p) => isThisMonth(p.dataCompra)).reduce((s,p) => s + (parseFloat(String(p.totalVenda)) || 0), 0);
  const ticket = pagos.length ? total / pagos.length : 0;

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return { key: d.toISOString().slice(0,10), label: `${d.getDate()}/${d.getMonth()+1}`, total: 0 };
  });
  pagos.forEach((p) => { const k = new Date(p.dataCompra).toISOString().slice(0,10); const d = days.find((x) => x.key === k); if (d) d.total += parseFloat(String(p.totalVenda)) || 0; });
  const max = Math.max(...days.map((d) => d.total), 100);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button className="btn-icon" onClick={load}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.8"/></svg></button>
      </div>
      <div className="relatorio-cards">
        {loading ? [1,2,3].map((i) => <div key={i} className="skeleton-line" style={{ height: "88px", borderRadius: "var(--radius-lg)" }} />) : (
          <>
            {[
              { cls: "icon-green", label: "Lucro Total",   value: formatCurrency(total),   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
              { cls: "icon-purple",label: "Lucro do Mês",  value: formatCurrency(totalMs), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
              { cls: "icon-blue",  label: "Ticket Médio",  value: formatCurrency(ticket),  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
            ].map((s) => (
              <div key={s.label} className="overview-card">
                <div className={`card-icon ${s.cls}`}>{s.icon}</div>
                <div className="card-info"><span className="card-label">{s.label}</span><div className="card-value">{s.value}</div></div>
              </div>
            ))}
          </>
        )}
      </div>
      {!loading && (
        <div className="chart-card">
          <div className="chart-header"><div className="chart-title">Vendas — Últimos 14 Dias</div></div>
          <div className="chart-wrapper">
            <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "120px" }}>
              {days.map((d, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
                  <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                    <div title={`${d.label}: ${d.total > 0 ? `R$ ${d.total.toFixed(2)}` : "—"}`} style={{ width: "100%", height: `${Math.max(2, (d.total / max) * 100)}%`, background: d.total > 0 ? "var(--accent)" : "var(--border)", borderRadius: "3px 3px 0 0", transition: "height .3s" }} />
                  </div>
                  <span style={{ fontSize: "0.58rem", color: "var(--text-dim)", whiteSpace: "nowrap" }}>{i % 2 === 0 ? d.label : ""}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══ USUÁRIOS ═════════════════════════════════════════════════════════════════
const SECOES = [{ key: "estoque", label: "Estoque" },{ key: "pedidos", label: "Pedidos" },{ key: "cupons", label: "Cupons" },{ key: "config", label: "Config" },{ key: "usuarios", label: "Usuários" }];

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
    try { const r = await API.getUsuarios(); setData(Array.isArray(r) ? r : []); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [isAdmin, showToast]);
  useEffect(() => { load(); }, [load]);

  if (!isAdmin()) return <p className="td-muted">Acesso restrito a administradores.</p>;

  const deactivate = async () => {
    if (!deactivateId) return; setDeactivating(true);
    try { await API.deleteUsuario(deactivateId); setData((p) => p.map((u) => u.id === deactivateId ? { ...u, ativo: false } : u)); showToast("Usuário desativado.", "success"); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setDeactivating(false); setDeactivateId(null); }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setEditUser(null)}>+ Novo Usuário</button>
          <button className="btn-icon" onClick={load}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.8"/></svg></button>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr>{["Usuário","E-mail","Papel","Status","Ações"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <SkeletonRows rows={3} cols={5} /> :
             data.map((u) => {
               const initials = (u.nome || "?").split(" ").map((p) => p[0]).join("").slice(0,2).toUpperCase();
               return (
                 <tr key={u.id} className="table-row">
                   <td>
                     <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                       <div className="sidebar-user-avatar" style={{ width: "32px", height: "32px", fontSize: "0.7rem" }}>
                         {u.foto ? <img src={u.foto} alt="" /> : initials}
                       </div>
                       <div><div className="font-medium" style={{ fontSize: "0.875rem" }}>{u.nome}</div><div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>@{u.apelido}</div></div>
                     </div>
                   </td>
                   <td className="td-muted">{u.email}</td>
                   <td><Badge variant={u.isAdmin ? "purple" : "gray"}>{u.isAdmin ? "Admin" : "Usuário"}</Badge></td>
                   <td><Badge variant={u.ativo ? "green" : "red"}>{u.ativo ? "Ativo" : "Inativo"}</Badge></td>
                   <td>
                     {!u.isAdmin ? (
                       <div className="actions-cell">
                         <button className="btn-icon" onClick={() => setEditUser(u)} title="Permissões"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></button>
                         {me?.id !== u.id && <button className="btn-icon btn-danger-icon" onClick={() => setDeactivateId(u.id)} title="Desativar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>}
                       </div>
                     ) : <span className="td-muted">—</span>}
                   </td>
                 </tr>
               );
             })}
          </tbody>
        </table>
      </div>
      {editUser !== undefined && (
        <UsuarioModal user={editUser} onClose={() => setEditUser(undefined)}
          onSaved={(saved, isNew) => { if (isNew) setData((p) => [saved, ...p]); else setData((p) => p.map((u) => u.id === saved.id ? saved : u)); if (me?.id === saved.id) setUser(saved); setEditUser(undefined); }}
          showToast={showToast} />
      )}
      <ConfirmModal open={deactivateId !== null} onClose={() => setDeactivateId(null)} onConfirm={deactivate} loading={deactivating}
        message={`Desativar <strong>${data.find((u) => u.id === deactivateId)?.nome}</strong>? Ele não conseguirá mais fazer login.`} />
    </div>
  );
}

function UsuarioModal({ user, onClose, onSaved, showToast }: { user: Usuario | null; onClose: () => void; onSaved: (u: Usuario, isNew: boolean) => void; showToast: (m: string, t?: "success"|"error"|"warning"|"info") => void }) {
  const isNew = !user;
  const [nome, setNome] = useState(user?.nome || "");
  const [apelido, setApelido] = useState(user?.apelido || "");
  const [email, setEmail] = useState(user?.email || "");
  const [senha, setSenha] = useState("");
  const [ativo, setAtivo] = useState(user?.ativo ?? true);
  const [foto, setFoto] = useState(user?.foto || "");
  const [uploading, setUploading] = useState(false);
  const [perms, setPerms] = useState<Record<string,{ver:boolean,editar:boolean}>>(
    Object.fromEntries(SECOES.map((s) => [s.key, user?.permissoes?.[s.key as keyof typeof user.permissoes] || { ver:false, editar:false }]))
  );
  const [saving, setSaving] = useState(false);

  const handlePhoto = async (file: File) => {
    setUploading(true);
    try { const fd = new FormData(); fd.append("file", file); const r = await API.uploadImagem(fd); if (r?.url) setFoto(r.url); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
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
        showToast(`Usuário criado!`, "success"); onSaved(novo, true);
      } else {
        const dados: Parameters<typeof API.updateUsuario>[1] = { nome, apelido, foto: foto || null, permissoes, ativo };
        if (senha && senha.length >= 8) dados.senha = senha;
        const updated = await API.updateUsuario(user!.id, dados);
        showToast("Usuário atualizado!", "success"); onSaved({ ...user!, ...updated }, false);
      }
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={isNew ? "Novo Usuário" : "Editar Usuário"}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Salvando…" : (isNew ? "Criar Usuário" : "Salvar")}</button></>}>
      <div className="form-grid-2">
        <div className="form-group"><label>Nome completo *</label><input className="input-field" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="João Silva" /></div>
        <div className="form-group"><label>Apelido *</label><input className="input-field" value={apelido} onChange={(e) => setApelido(e.target.value)} placeholder="joao" /></div>
      </div>
      <div className="form-group"><label>E-mail *</label><input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={!isNew} /></div>
      <div className="form-group"><label>{isNew ? "Senha *" : "Nova Senha (deixe em branco para manter)"}</label><input className="input-field" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder={isNew ? "Mínimo 8 caracteres" : "••••••"} /></div>

      {/* Foto — câmera + galeria, sem campo de URL */}
      <div className="form-group">
        <label>Foto do Usuário</label>
        {foto && <img src={foto} alt="" style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--accent)", marginBottom: "0.5rem" }} />}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            📷 Câmera<input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            🖼️ {uploading ? "Enviando…" : "Galeria"}<input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
          </label>
          {foto && <button type="button" onClick={() => setFoto("")} style={{ padding: "0.4rem 0.75rem", borderRadius: "var(--radius-sm)", border: "none", background: "var(--danger-soft)", color: "var(--danger)", cursor: "pointer", fontSize: "0.82rem" }}>Remover</button>}
        </div>
      </div>

      {/* Permissões */}
      <div className="form-group">
        <label>Permissões de Acesso</label>
        <table className="perm-table">
          <thead><tr><th style={{ textAlign: "left" }}>Seção</th><th>Ver</th><th>Editar</th></tr></thead>
          <tbody>
            {SECOES.map((s) => (
              <tr key={s.key}>
                <td>{s.label}</td>
                <td style={{ textAlign: "center" }}>
                  <input type="checkbox" className="perm-check" checked={perms[s.key]?.ver || false}
                    onChange={(e) => { const v = e.target.checked; setPerms((p) => ({ ...p, [s.key]: { ...p[s.key], ver: v, editar: v ? p[s.key]?.editar : false } })); }} />
                </td>
                <td style={{ textAlign: "center" }}>
                  <input type="checkbox" className="perm-check" checked={perms[s.key]?.editar || false}
                    onChange={(e) => { const v = e.target.checked; setPerms((p) => ({ ...p, [s.key]: { ver: v ? true : p[s.key]?.ver, editar: v } })); }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isNew && (
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "var(--accent)" }} />
          Usuário ativo
        </label>
      )}
    </Modal>
  );
}
