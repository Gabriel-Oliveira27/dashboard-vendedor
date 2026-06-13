"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { SkeletonRows } from "@/components/ui/Skeleton";
import type { Produto } from "@/types";
import { Plus, Edit2, Trash2, Eye, Search, Package, RefreshCw, Bold, Italic, List } from "lucide-react";

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
      setData(list);
      setFiltered(list);
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
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
      setData(next);
      setFiltered(next);
      showToast("Produto excluído.", "success");
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleSaved = (saved: Produto, isNew: boolean) => {
    const next = isNew
      ? [saved, ...data]
      : data.map((p) => (p.id === saved.id ? { ...p, ...saved } : p));
    setData(next);
    setFiltered(next);
    setEditingProduct(undefined);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar produto…"
            className="w-full h-[38px] bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] pl-8 pr-3 text-[0.875rem] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
        {podeEditar && (
          <Button onClick={() => setEditingProduct(null)} size="sm">
            <Plus size={14} /> Produto
          </Button>
        )}
        <button onClick={load} className="p-2 rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {["Foto","Produto","Linha","Litros","Cores","Qtd","Valor","Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-[0.07em] text-[var(--text-muted)] whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={8} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-[var(--text-dim)] text-[0.9rem]">Nenhum produto encontrado.</td></tr>
            ) : (
              filtered.map((p) => (
                <EstoqueRow
                  key={p.id}
                  product={p}
                  podeEditar={podeEditar}
                  onEdit={() => setEditingProduct(p)}
                  onDelete={() => setDeleteId(p.id)}
                  onPreview={() => setPreviewProduct(p)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Create modal */}
      {editingProduct !== undefined && (
        <ProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(undefined)}
          onSaved={handleSaved}
          showToast={showToast}
        />
      )}

      {/* Preview modal */}
      {previewProduct && (
        <PreviewModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
        />
      )}

      {/* Delete confirm */}
      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Excluir <strong>${data.find((p) => p.id === deleteId)?.produto || "este produto"}</strong>? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}

function EstoqueRow({ product: p, podeEditar, onEdit, onDelete, onPreview }: {
  product: Produto;
  podeEditar: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const nome = p.produto || p.nome || "—";
  const qtd  = parseInt(String(p.qtd)) || 0;
  const baixo = qtd < 5;

  return (
    <tr className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors">
      <td className="px-4 py-3 w-[52px]">
        {p.imagem ? (
          <img src={p.imagem} alt={nome} className="w-10 h-10 rounded-lg object-cover border border-[var(--border)]" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-dim)]">
            <Package size={18} />
          </div>
        )}
      </td>
      <td className="px-4 py-3 font-semibold text-[0.9rem]">{nome}</td>
      <td className="px-4 py-3 text-[var(--text-muted)] text-[0.875rem]">{p.linha}</td>
      <td className="px-4 py-3 text-[var(--text-muted)] text-[0.875rem]">{p.litros || "—"}</td>
      <td className="px-4 py-3 text-[var(--text-muted)] text-[0.875rem]">{p.cores || "—"}</td>
      <td className="px-4 py-3">
        <Badge variant={baixo ? "red" : "green"}>{qtd}</Badge>
      </td>
      <td className="px-4 py-3 font-semibold text-[0.875rem]">{formatCurrency(p.valor)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <IconBtn onClick={onPreview} title="Preview"><Eye size={15} /></IconBtn>
          {podeEditar && <>
            <IconBtn onClick={onEdit} title="Editar"><Edit2 size={15} /></IconBtn>
            <IconBtn onClick={onDelete} title="Excluir" danger><Trash2 size={15} /></IconBtn>
          </>}
        </div>
      </td>
    </tr>
  );
}

function IconBtn({ children, onClick, title, danger }: {
  children: React.ReactNode; onClick: () => void; title?: string; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors text-[var(--text-muted)] ${
        danger
          ? "hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
          : "hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
      }`}
    >
      {children}
    </button>
  );
}

// ── Product Create/Edit Modal ─────────────────────────────────────────────────
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
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    const sel = v.slice(s, e) || "texto";
    const map: Record<string, string> = { bold: `**${sel}**`, italic: `_${sel}_`, list: `\n- ${sel}` };
    const rep = map[type] || sel;
    const next = v.slice(0, s) + rep + v.slice(e);
    setDetalhes(next);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + rep.length, s + rep.length); }, 0);
  };

  const handleFileChange = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (isNew && !nome.trim()) { showToast("Nome é obrigatório.", "warning"); return; }
    const qtdN = parseInt(qtd);
    const valorN = parseFloat(valor);
    if (isNaN(qtdN) || qtdN < 0) { showToast("Quantidade inválida.", "warning"); return; }
    if (isNaN(valorN) || valorN < 0) { showToast("Valor inválido.", "warning"); return; }

    setSaving(true);
    let imagemUrl: string | null = null;
    if (imageFile) {
      try {
        const fd = new FormData();
        fd.append("file", imageFile);
        const res = await API.uploadImagem(fd);
        imagemUrl = res?.url || null;
        if (!imagemUrl) throw new Error("URL não retornada.");
      } catch (e: unknown) {
        showToast("Erro no upload: " + (e as Error).message, "error");
        setSaving(false);
        return;
      }
    }

    try {
      if (isNew) {
        const dados = { produto: nome, linha, litros, cores, qtd: qtdN, valor: valorN, imagem: imagemUrl || "", detalhes };
        const novo = await API.createEstoque(dados);
        showToast(`Produto "${nome}" criado!`, "success");
        onSaved(novo, true);
      } else {
        const dados: Partial<Produto> = { qtd: qtdN, valor: valorN, detalhes };
        if (imagemUrl) dados.imagem = imagemUrl;
        const updated = await API.updateEstoque(product!.id, dados);
        showToast("Produto atualizado!", "success");
        onSaved({ ...product!, ...dados, ...(updated || {}) }, false);
      }
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Novo Produto" : "Editar Produto"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={saving}>
            {isNew ? "Criar Produto" : "Salvar Alterações"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Produto *" value={nome} onChange={(e) => setNome(e.target.value)} readOnly={!isNew} placeholder="Nome do produto" />
        {isNew ? (
          <Select label="Linha *" value={linha} onChange={(e) => setLinha(e.target.value)}>
            {LINHAS.map((l) => <option key={l} value={l}>{l}</option>)}
          </Select>
        ) : (
          <Input label="Linha" value={product?.linha || ""} readOnly />
        )}
        <Input label="Litros" value={litros} onChange={(e) => setLitros(e.target.value)} readOnly={!isNew} placeholder="Ex: 1.5L" />
        <Input label="Cores" value={cores} onChange={(e) => setCores(e.target.value)} readOnly={!isNew} placeholder="Azul, Rosa" />
        <Input label="Quantidade *" type="number" min="0" value={qtd} onChange={(e) => setQtd(e.target.value)} />
        <Input label="Valor (R$) *" type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
      </div>

      {/* Image */}
      <div className="flex flex-col gap-2">
        <label className="text-[0.78rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">Imagem</label>
        {imagePreview && (
          <img src={imagePreview} alt="" className="h-20 object-contain rounded-lg border border-[var(--border)] self-start" />
        )}
        <label className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg)] border border-dashed border-[var(--border)] rounded-[var(--radius-md)] cursor-pointer hover:border-[var(--accent)] transition-colors text-[0.875rem] text-[var(--text-muted)]">
          <Package size={16} />
          {imagePreview ? "Trocar imagem" : "Selecionar imagem"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])} />
        </label>
      </div>

      {/* Description with Markdown toolbar */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[0.78rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">Descrição / Características</label>
        <div className="flex gap-1 flex-wrap mb-1">
          {[
            { type: "bold",   icon: <Bold size={12} />,   label: "Negrito" },
            { type: "italic", icon: <Italic size={12} />, label: "Itálico" },
            { type: "list",   icon: <List size={12} />,   label: "Lista"   },
          ].map((btn) => (
            <button
              key={btn.type}
              type="button"
              onClick={() => applyMd(btn.type)}
              title={btn.label}
              className="h-7 px-2.5 rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] text-[0.78rem] font-semibold hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors flex items-center gap-1"
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>
        <Textarea
          ref={taRef}
          value={detalhes}
          onChange={(e) => setDetalhes(e.target.value)}
          rows={5}
          placeholder="Suporta **negrito**, _itálico_, - listas..."
          hint="Markdown suportado."
        />
      </div>
      {!isNew && <p className="text-[0.78rem] text-[var(--text-dim)]">Somente Quantidade, Valor, Imagem e Detalhes podem ser editados.</p>}
    </Modal>
  );
}

// ── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({ product: p, onClose }: { product: Produto; onClose: () => void }) {
  const nome = p.produto || p.nome || "—";
  const preco = parseFloat(String(p.valor)) || 0;
  const qtd = parseInt(String(p.qtd)) || 0;
  const sub = [p.linha, p.litros].filter(Boolean).join(" · ");

  return (
    <Modal open onClose={onClose} title="Preview — Card da Loja" maxWidth="max-w-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-60 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[16px] overflow-hidden">
          <div className="relative">
            {p.imagem ? (
              <img src={p.imagem} alt={nome} className="w-full aspect-square object-cover" />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-[var(--bg)] text-[var(--text-dim)]">
                <Package size={40} />
              </div>
            )}
            {qtd <= 5 && (
              <span className="absolute top-2 left-2 bg-[var(--danger)] text-white text-[0.6rem] font-bold px-2 py-0.5 rounded-full">
                Últimas unidades
              </span>
            )}
          </div>
          <div className="p-3">
            <p className="font-semibold text-[0.9rem] leading-snug mb-1">{nome}</p>
            {sub && <p className="text-[0.75rem] text-[var(--text-muted)] mb-1.5">{sub}</p>}
            <p className="text-[var(--accent)] font-bold text-[1.05rem] mb-1">R$ {preco.toFixed(2)}</p>
            <p className="text-[0.75rem] text-[var(--text-muted)] mb-2">{qtd} em estoque</p>
            <div className="bg-[var(--accent)] opacity-50 text-white text-center text-[0.82rem] font-semibold py-1.5 rounded-lg cursor-not-allowed">
              Adicionar ao Carrinho
            </div>
          </div>
        </div>
        <p className="text-[0.72rem] text-[var(--text-dim)]">Visualização aproximada.</p>
      </div>
    </Modal>
  );
}
