"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { SkeletonRows } from "@/components/ui/Skeleton";
import type { Produto } from "@/types";

const LINHAS = ["FREEZER","AQUECER","CONSERVAR","PREPARAR","SERVIR","ARMAZENAR"];

export function EstoqueSection() {
  const { isAdmin, canEdit } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<Produto[]>([]);
  const [filtered, setFiltered] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Produto | null | undefined>(undefined);
  const [previewProduct, setPreviewProduct] = useState<Produto | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const podeEditar = isAdmin() || canEdit("estoque");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.getEstoque();
      const list = Array.isArray(res) ? res : [];
      setData(list); setFiltered(list);
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (q: string) => {
    setSearch(q);
    const s = q.toLowerCase().trim();
    setFiltered(!s ? data : data.filter((p) =>
      [p.produto, p.nome, p.linha, p.cores].some((f) => f?.toLowerCase().includes(s))
    ));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await API.deleteEstoque(deleteId);
      const next = data.filter((p) => p.id !== deleteId);
      setData(next); setFiltered(next);
      showToast("Produto excluído.", "success");
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setDeleting(false); setDeleteId(null); }
  };

  const handleSaved = (saved: Produto, isNew: boolean) => {
    const next = isNew ? [saved, ...data] : data.map((p) => p.id === saved.id ? { ...p, ...saved } : p);
    setData(next); setFiltered(next);
    setEditingProduct(undefined);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="section-header">
        <div className="section-actions" style={{ flex: 1 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)", pointerEvents: "none" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Buscar produto…"
              className="input-search" style={{ paddingLeft: "2rem", width: "100%" }} />
          </div>
          {podeEditar && (
            <button className="btn btn-primary btn-sm" onClick={() => setEditingProduct(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Produto
            </button>
          )}
          <button className="btn-icon" onClick={load} title="Atualizar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.8"/></svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {["Foto","Produto","Linha","Litros","Cores","Qtd","Valor","Ações"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows rows={6} cols={8} /> :
             filtered.length === 0 ? (
               <tr><td colSpan={8} className="empty-state">Nenhum produto encontrado.</td></tr>
             ) : filtered.map((p) => {
               const nome = p.produto || p.nome || "—";
               const qtd = parseInt(String(p.qtd)) || 0;
               return (
                 <tr key={p.id} className="table-row">
                   <td className="td-thumb">
                     {p.imagem
                       ? <img src={p.imagem} alt={nome} className="product-thumb" />
                       : <div className="no-thumb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
                     }
                   </td>
                   <td className="font-medium">{nome}</td>
                   <td className="td-muted">{p.linha}</td>
                   <td className="td-muted">{p.litros || "—"}</td>
                   <td className="td-muted">{p.cores || "—"}</td>
                   <td><Badge variant={qtd < 5 ? "red" : "green"}>{qtd}</Badge></td>
                   <td className="font-medium">{formatCurrency(p.valor)}</td>
                   <td>
                     <div className="actions-cell">
                       <button className="btn-icon" title="Preview" onClick={() => setPreviewProduct(p)}>
                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                       </button>
                       {podeEditar && <>
                         <button className="btn-icon" title="Editar" onClick={() => setEditingProduct(p)}>
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                         </button>
                         <button className="btn-icon btn-danger-icon" title="Excluir" onClick={() => setDeleteId(p.id)}>
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                         </button>
                       </>}
                     </div>
                   </td>
                 </tr>
               );
             })}
          </tbody>
        </table>
      </div>

      {editingProduct !== undefined && (
        <ProductModal product={editingProduct} onClose={() => setEditingProduct(undefined)} onSaved={handleSaved} showToast={showToast} />
      )}
      {previewProduct && <PreviewModal product={previewProduct} onClose={() => setPreviewProduct(null)} />}
      <ConfirmModal
        open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting}
        message={`Excluir <strong>${data.find((p) => p.id === deleteId)?.produto || "este produto"}</strong>? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}

function ProductModal({ product, onClose, onSaved, showToast }: {
  product: Produto | null;
  onClose: () => void;
  onSaved: (p: Produto, isNew: boolean) => void;
  showToast: (msg: string, type?: "success"|"error"|"warning"|"info") => void;
}) {
  const isNew = !product;
  const [nome, setNome] = useState(product?.produto || product?.nome || "");
  const [linha, setLinha] = useState(product?.linha || LINHAS[0]);
  const [litros, setLitros] = useState(product?.litros || "");
  const [cores, setCores] = useState(product?.cores || "");
  const [qtd, setQtd] = useState(String(product?.qtd ?? ""));
  const [valor, setValor] = useState(String(product?.valor ?? ""));
  const [detalhes, setDetalhes] = useState(product?.detalhes || "");
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imagem || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const applyMd = (type: string) => {
    const ta = taRef.current; if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    const sel = v.slice(s, e) || "texto";
    const map: Record<string, string> = { bold: `**${sel}**`, italic: `_${sel}_`, list: `\n- ${sel}` };
    const rep = map[type] || sel;
    const next = v.slice(0, s) + rep + v.slice(e);
    setDetalhes(next);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + rep.length, s + rep.length); }, 0);
  };

  const save = async () => {
    if (isNew && !nome.trim()) { showToast("Nome é obrigatório.", "warning"); return; }
    const qtdN = parseInt(qtd), valorN = parseFloat(valor);
    if (isNaN(qtdN) || qtdN < 0) { showToast("Quantidade inválida.", "warning"); return; }
    if (isNaN(valorN) || valorN < 0) { showToast("Valor inválido.", "warning"); return; }
    setSaving(true);
    let imagemUrl: string | null = null;
    if (imageFile) {
      try {
        const fd = new FormData(); fd.append("file", imageFile);
        const res = await API.uploadImagem(fd);
        imagemUrl = res?.url || null;
        if (!imagemUrl) throw new Error("URL não retornada.");
      } catch (e: unknown) { showToast("Erro no upload: " + (e as Error).message, "error"); setSaving(false); return; }
    }
    try {
      if (isNew) {
        const novo = await API.createEstoque({ produto: nome, linha, litros, cores, qtd: qtdN, valor: valorN, imagem: imagemUrl || "", detalhes });
        showToast(`Produto "${nome}" criado!`, "success"); onSaved(novo, true);
      } else {
        const dados: Partial<Produto> = { qtd: qtdN, valor: valorN, detalhes };
        if (imagemUrl) dados.imagem = imagemUrl;
        const updated = await API.updateEstoque(product!.id, dados);
        showToast("Produto atualizado!", "success"); onSaved({ ...product!, ...dados, ...(updated || {}) }, false);
      }
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={isNew ? "Novo Produto" : "Editar Produto"}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Salvando…" : (isNew ? "Criar Produto" : "Salvar Alterações")}</button></>}>
      <div className="form-grid-2">
        <div className="form-group"><label>Produto *</label><input className="input-field" value={nome} onChange={(e) => setNome(e.target.value)} readOnly={!isNew} placeholder="Nome do produto" /></div>
        {isNew
          ? <div className="form-group"><label>Linha *</label><select className="input-select" value={linha} onChange={(e) => setLinha(e.target.value)}>{LINHAS.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
          : <div className="form-group"><label>Linha</label><input className="input-field" value={product?.linha || ""} readOnly /></div>
        }
        <div className="form-group"><label>Litros</label><input className="input-field" value={litros} onChange={(e) => setLitros(e.target.value)} readOnly={!isNew} placeholder="Ex: 1.5L" /></div>
        <div className="form-group"><label>Cores</label><input className="input-field" value={cores} onChange={(e) => setCores(e.target.value)} readOnly={!isNew} placeholder="Azul, Rosa" /></div>
        <div className="form-group"><label>Quantidade *</label><input className="input-field" type="number" min="0" value={qtd} onChange={(e) => setQtd(e.target.value)} /></div>
        <div className="form-group"><label>Valor (R$) *</label><input className="input-field" type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} /></div>
      </div>

      {/* Image */}
      <div className="form-group">
        <label>Imagem</label>
        {imagePreview && <img src={imagePreview} alt="" style={{ maxHeight: "80px", objectFit: "contain", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "0.5rem" }} />}
        <label className="image-upload-area" style={{ minHeight: "64px" }}>
          <span className="image-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            {imagePreview ? "Trocar imagem" : "Selecionar imagem"}
          </span>
          <input type="file" accept="image/*" className="input-file" onChange={(e) => {
            const f = e.target.files?.[0]; if (!f) return;
            setImageFile(f);
            const r = new FileReader(); r.onload = (ev) => setImagePreview(ev.target?.result as string); r.readAsDataURL(f);
          }} />
        </label>
      </div>

      {/* Description */}
      <div className="form-group">
        <label>Descrição / Características</label>
        <div className="md-toolbar">
          <button type="button" onClick={() => applyMd("bold")}><strong>N</strong></button>
          <button type="button" onClick={() => applyMd("italic")}><em>I</em></button>
          <button type="button" onClick={() => applyMd("list")}>• Lista</button>
        </div>
        <textarea ref={taRef} className="input-field" value={detalhes} onChange={(e) => setDetalhes(e.target.value)}
          rows={5} placeholder="Suporta **negrito**, _itálico_, - listas…" style={{ minHeight: "110px" }} />
        <span className="field-hint">Markdown suportado.</span>
      </div>
      {!isNew && <p className="field-hint">Somente Quantidade, Valor, Imagem e Detalhes podem ser editados.</p>}
    </Modal>
  );
}

function PreviewModal({ product: p, onClose }: { product: Produto; onClose: () => void }) {
  const nome = p.produto || p.nome || "—";
  const preco = parseFloat(String(p.valor)) || 0;
  const qtd = parseInt(String(p.qtd)) || 0;
  return (
    <Modal open onClose={onClose} title="Preview — Card da Loja" maxWidth="max-w-[300px]">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: "240px", background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ position: "relative" }}>
            {p.imagem
              ? <img src={p.imagem} alt={nome} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />
              : <div style={{ width: "100%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--text-dim)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
            }
            {qtd <= 5 && <span style={{ position: "absolute", top: "8px", left: "8px", background: "var(--danger)", color: "#fff", fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: "99px" }}>Últimas unidades</span>}
          </div>
          <div style={{ padding: "0.75rem" }}>
            <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{nome}</p>
            {p.linha && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>{p.linha}{p.litros ? ` · ${p.litros}` : ""}</p>}
            <p style={{ color: "var(--accent)", fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.25rem" }}>R$ {preco.toFixed(2)}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{qtd} em estoque</p>
            <div style={{ background: "var(--accent)", opacity: 0.5, color: "#fff", textAlign: "center", fontSize: "0.82rem", fontWeight: 600, padding: "6px", borderRadius: "8px" }}>Adicionar ao Carrinho</div>
          </div>
        </div>
        <p style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>Visualização aproximada.</p>
      </div>
    </Modal>
  );
}
