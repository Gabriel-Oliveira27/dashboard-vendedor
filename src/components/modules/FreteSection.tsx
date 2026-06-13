"use client";

import { useEffect, useState, useCallback } from "react";
import { API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { OrigemPanel, type OrigemValues } from "./OrigemPanel";
import type { FreteConfig, FreteModelo, TierValor, CidadeEspecial } from "@/types";
import { Truck, Plus, Trash2, Save } from "lucide-react";

const MODELO_LABEL: Record<FreteModelo, string> = {
  VALOR:  "Por valor da compra",
  KM:     "Por distância (km)",
  FIXO:   "Valor fixo",
  CIDADE: "Fixo por cidade",
};

const DEFAULT_TIERS: TierValor[] = [
  { ate: 129,  taxa: 0 },
  { ate: 200,  taxa: 1.5 },
  { ate: 270,  taxa: 3 },
  { ate: 349,  taxa: 5 },
  { ate: 419,  taxa: 7 },
  { ate: null, taxa: 10 },
];

export function FreteSection() {
  const { isAdmin, canEdit } = useAuth();
  const { showToast } = useToast();
  const [cfg, setCfg] = useState<FreteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const podeEditar = isAdmin() || canEdit("config");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await API.getFreteConfig();
      setCfg(data);
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <FreteSkeletonView />;

  return editing ? (
    <FreteEditForm
      cfg={cfg}
      podeEditar={podeEditar}
      onSaved={(saved) => { setCfg(saved); setEditing(false); }}
      onCancel={() => setEditing(false)}
      showToast={showToast}
    />
  ) : (
    <FreteView
      cfg={cfg}
      podeEditar={podeEditar}
      onEdit={() => setEditing(true)}
    />
  );
}

// ── View ─────────────────────────────────────────────────────────────────────
function FreteView({
  cfg,
  podeEditar,
  onEdit,
}: {
  cfg: FreteConfig | null;
  podeEditar: boolean;
  onEdit: () => void;
}) {
  const modelo = cfg?.modelo || "VALOR";

  const rows: React.ReactNode[] = [];

  if (modelo === "VALOR") {
    (cfg?.tiersValor || []).forEach((t, i) => (
      rows.push(
        <SummaryRow
          key={i}
          label={t.ate != null ? `Até R$ ${Number(t.ate).toFixed(2)}` : "Acima disso"}
          value={
            Number(t.taxa) === 0
              ? <Badge variant="green">Grátis</Badge>
              : <Badge variant="blue">R$ {Number(t.taxa).toFixed(2)}</Badge>
          }
        />
      )
    ));
  } else if (modelo === "KM") {
    rows.push(
      <SummaryRow key="km" label="Custo por km" value={<Badge variant="blue">R$ {Number(cfg?.custoKm || 1.5).toFixed(2)}/km</Badge>} />,
      Number(cfg?.freteGratisAteKm) > 0 && (
        <SummaryRow key="gratis" label="Frete grátis até" value={<Badge variant="green">{cfg?.freteGratisAteKm} km</Badge>} />
      ),
      cfg?.origemEndereco && (
        <div key="end" className="flex items-center justify-between py-2 text-[0.8rem]">
          <span className="text-[var(--text-muted)] truncate mr-2">{cfg.origemEndereco}</span>
          {cfg.origemLat
            ? <span className="text-[var(--success)] shrink-0">📍 OK</span>
            : <span className="text-[var(--danger)] shrink-0">⚠️ Sem coords</span>}
        </div>
      )
    );
  } else if (modelo === "FIXO") {
    rows.push(
      <SummaryRow
        key="fixo"
        label="Valor único"
        value={
          Number(cfg?.valorFixo) === 0
            ? <Badge variant="green">Grátis</Badge>
            : <Badge variant="blue">R$ {Number(cfg?.valorFixo).toFixed(2)}</Badge>
        }
      />
    );
  } else if (modelo === "CIDADE") {
    rows.push(
      <SummaryRow key="orig" label={cfg?.origemCidade || "Cidade de origem"} value={
        Number(cfg?.valorCidadeOrigem) === 0
          ? <Badge variant="green">Grátis</Badge>
          : <Badge variant="blue">R$ {Number(cfg?.valorCidadeOrigem).toFixed(2)}</Badge>
      } />,
      <SummaryRow key="dem" label="Outras cidades" value={<Badge variant="orange">R$ {Number(cfg?.valorDemais || 0).toFixed(2)}</Badge>} />,
      ...(cfg?.cidadesEspeciais || []).map((c, i) => (
        <SummaryRow key={`c${i}`} indent label={c.nome} value={<Badge variant="purple">R$ {Number(c.valor).toFixed(2)}</Badge>} />
      ))
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5 max-w-[580px]">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
            <Truck size={20} />
          </div>
          <div>
            <span className="block text-[0.72rem] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Modelo de Frete</span>
            <span className="text-[1.05rem] font-semibold">{MODELO_LABEL[modelo]}</span>
          </div>
        </div>
        <div className="border-t border-[var(--border)] pt-3">
          {rows.filter(Boolean).length > 0
            ? rows.filter(Boolean)
            : <span className="text-[0.85rem] text-[var(--text-dim)]">Não configurado.</span>}
        </div>
      </div>
      {podeEditar ? (
        <Button onClick={onEdit} className="self-start">
          <Truck size={16} /> Editar Configuração de Frete
        </Button>
      ) : (
        <p className="text-[0.85rem] text-[var(--text-dim)]">Acesso somente de visualização.</p>
      )}
    </div>
  );
}

function SummaryRow({ label, value, indent }: { label: string; value: React.ReactNode; indent?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0 text-[0.875rem] ${indent ? "pl-3 text-[0.82rem] text-[var(--text-muted)]" : ""}`}>
      <span>{label}</span>
      {value}
    </div>
  );
}

// ── Edit form ────────────────────────────────────────────────────────────────
interface EditFormProps {
  cfg: FreteConfig | null;
  podeEditar: boolean;
  onSaved: (cfg: FreteConfig) => void;
  onCancel: () => void;
  showToast: (msg: string, type?: "success" | "error" | "warning" | "info") => void;
}

function FreteEditForm({ cfg, onSaved, onCancel, showToast }: EditFormProps) {
  const [modelo, setModelo] = useState<FreteModelo>(cfg?.modelo || "VALOR");
  const [tiers, setTiers] = useState<TierValor[]>(
    cfg?.tiersValor?.length ? cfg.tiersValor : DEFAULT_TIERS
  );
  const [custoKm, setCustoKm] = useState(String(cfg?.custoKm || 1.5));
  const [gratisKm, setGratisKm] = useState(String(cfg?.freteGratisAteKm || 0));
  const [valorFixo, setValorFixo] = useState(String(cfg?.valorFixo || 0));
  const [valorOrigem, setValorOrigem] = useState(String(cfg?.valorCidadeOrigem || 0));
  const [valorDemais, setValorDemais] = useState(String(cfg?.valorDemais || 0));
  const [cidades, setCidades] = useState<CidadeEspecial[]>(cfg?.cidadesEspeciais || []);
  const [origem, setOrigem] = useState<OrigemValues>({
    origemCep:           cfg?.origemCep || "",
    origemNumero:        cfg?.origemNumero || "",
    origemComplemento:   cfg?.origemComplemento || "",
    origemEndereco:      cfg?.origemEndereco || "",
    origemLat:           cfg?.origemLat || "",
    origemLon:           cfg?.origemLon || "",
    origemCidade:        cfg?.origemCidade || "",
    origemUF:            cfg?.origemUF || "",
  });
  const [saving, setSaving] = useState(false);

  const needsOrigem = modelo === "KM" || modelo === "CIDADE";

  const save = async () => {
    if (modelo === "KM" && (!origem.origemLat || !origem.origemLon)) {
      showToast("Busque o CEP e confirme as coordenadas antes de salvar.", "warning");
      return;
    }

    const payload: FreteConfig = {
      modelo,
      ...origem,
      ...(modelo === "VALOR" && { tiersValor: tiers }),
      ...(modelo === "KM" && {
        custoKm: parseFloat(custoKm) || 1.5,
        freteGratisAteKm: parseFloat(gratisKm) || 0,
      }),
      ...(modelo === "FIXO" && { valorFixo: parseFloat(valorFixo) || 0 }),
      ...(modelo === "CIDADE" && {
        valorCidadeOrigem: parseFloat(valorOrigem) || 0,
        valorDemais: parseFloat(valorDemais) || 0,
        cidadesEspeciais: cidades,
      }),
    };

    setSaving(true);
    try {
      const saved = await API.saveFreteConfig(payload);
      showToast("Configuração de frete salva!", "success");
      onSaved(saved);
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 max-w-[600px]">
      {/* Modelo selector */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
            <Truck size={20} />
          </div>
          <span className="text-[0.75rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">Modelo de Frete</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.keys(MODELO_LABEL) as FreteModelo[]).map((k) => (
            <label
              key={k}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] border cursor-pointer transition-all ${
                modelo === k
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border)] bg-[var(--bg)]"
              }`}
            >
              <input
                type="radio"
                name="freteModelo"
                value={k}
                checked={modelo === k}
                onChange={() => setModelo(k)}
                className="accent-[var(--accent)]"
              />
              <span className={`text-[0.875rem] ${modelo === k ? "font-semibold text-[var(--accent)]" : "text-[var(--text)]"}`}>
                {MODELO_LABEL[k]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Dynamic panel */}
      {modelo === "VALOR" && (
        <TiersPanel tiers={tiers} onChange={setTiers} />
      )}
      {modelo === "KM" && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 sm:p-5 flex flex-col gap-4">
          <p className="text-[0.75rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">Parâmetros por km</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Custo por km (R$)" type="number" min="0" step="0.10" value={custoKm} onChange={(e) => setCustoKm(e.target.value)} />
            <Input label="Frete grátis até (km)" type="number" min="0" step="1" value={gratisKm} onChange={(e) => setGratisKm(e.target.value)} hint="0 = nunca grátis" />
          </div>
        </div>
      )}
      {modelo === "FIXO" && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 sm:p-5 flex flex-col gap-3">
          <p className="text-[0.75rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">Valor fixo de frete</p>
          <div className="flex items-center gap-3 flex-wrap">
            <Input type="number" min="0" step="0.01" value={valorFixo} onChange={(e) => setValorFixo(e.target.value)} className="max-w-[120px] text-right" />
            <span className="text-[var(--text-muted)] text-sm">R$ — 0 = frete grátis</span>
          </div>
          <p className="text-[0.78rem] text-[var(--text-dim)]">Cobrado de qualquer cliente, independente da localização.</p>
        </div>
      )}
      {modelo === "CIDADE" && (
        <CidadePanel
          valorOrigem={valorOrigem}
          valorDemais={valorDemais}
          cidades={cidades}
          onChangeOrigem={setValorOrigem}
          onChangeDemais={setValorDemais}
          onChangeCidades={setCidades}
        />
      )}

      {/* Origem address panel */}
      {needsOrigem && (
        <OrigemPanel
          values={origem}
          onChange={(v) => setOrigem((prev) => ({ ...prev, ...v }))}
          hint={modelo === "CIDADE" ? "Nome da cidade de origem (campo \"Cidade de origem\" acima)" : undefined}
        />
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={save} loading={saving}>
          <Save size={16} /> Salvar
        </Button>
      </div>
    </div>
  );
}

// ── Tiers panel ──────────────────────────────────────────────────────────────
function TiersPanel({ tiers, onChange }: { tiers: TierValor[]; onChange: (t: TierValor[]) => void }) {
  const updateTier = (i: number, field: keyof TierValor, val: string) => {
    const next = [...tiers];
    if (field === "ate") next[i] = { ...next[i], ate: val === "" ? null : parseFloat(val) || 0 };
    else next[i] = { ...next[i], taxa: parseFloat(val) || 0 };
    onChange(next);
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[0.75rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">Faixas por valor do carrinho</p>
        <Button variant="ghost" size="sm" onClick={() => onChange([...tiers, { ate: null, taxa: 0 }])}>
          <Plus size={14} /> Adicionar faixa
        </Button>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--text-dim)]">Até (R$)</span>
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--text-dim)]">Taxa (R$)</span>
        <span />
      </div>

      {tiers.map((t, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <input
            type="number"
            value={t.ate ?? ""}
            min="0"
            step="0.01"
            placeholder="∞"
            onChange={(e) => updateTier(i, "ate", e.target.value)}
            className="h-[36px] bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] px-3 text-[0.85rem] text-[var(--text)] text-right focus:outline-none focus:border-[var(--accent)]"
          />
          <input
            type="number"
            value={t.taxa}
            min="0"
            step="0.01"
            onChange={(e) => updateTier(i, "taxa", e.target.value)}
            className="h-[36px] bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] px-3 text-[0.85rem] text-[var(--text)] text-right focus:outline-none focus:border-[var(--accent)]"
          />
          <button
            onClick={() => {
              if (tiers.length <= 1) return;
              onChange(tiers.filter((_, j) => j !== i));
            }}
            className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <p className="text-[0.78rem] text-[var(--text-dim)]">Taxa 0 = frete grátis. Última faixa deve ter "Até" vazio.</p>
    </div>
  );
}

// ── Cidade panel ─────────────────────────────────────────────────────────────
function CidadePanel({ valorOrigem, valorDemais, cidades, onChangeOrigem, onChangeDemais, onChangeCidades }: {
  valorOrigem: string;
  valorDemais: string;
  cidades: CidadeEspecial[];
  onChangeOrigem: (v: string) => void;
  onChangeDemais: (v: string) => void;
  onChangeCidades: (c: CidadeEspecial[]) => void;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 sm:p-5 flex flex-col gap-4">
      <p className="text-[0.75rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">Valores por cidade</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Cidade de origem (R$)" type="number" min="0" step="0.01" value={valorOrigem} onChange={(e) => onChangeOrigem(e.target.value)} hint="Clientes da cidade configurada abaixo." />
        <Input label="Outras cidades (R$)" type="number" min="0" step="0.01" value={valorDemais} onChange={(e) => onChangeDemais(e.target.value)} hint="Qualquer cidade não listada." />
      </div>

      {/* Special cities */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.78rem] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Cidades com valor especial</span>
          <Button variant="ghost" size="sm" onClick={() => onChangeCidades([...cidades, { nome: "", valor: 0 }])}>
            <Plus size={14} /> Adicionar
          </Button>
        </div>
        {cidades.map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_120px_auto] gap-2 items-center mb-2">
            <input
              type="text"
              value={c.nome}
              placeholder="Nome da cidade"
              onChange={(e) => onChangeCidades(cidades.map((x, j) => j === i ? { ...x, nome: e.target.value } : x))}
              className="h-[36px] bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] px-3 text-[0.85rem] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            />
            <input
              type="number"
              value={c.valor}
              min="0"
              step="0.01"
              onChange={(e) => onChangeCidades(cidades.map((x, j) => j === i ? { ...x, valor: parseFloat(e.target.value) || 0 } : x))}
              className="h-[36px] bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] px-3 text-[0.85rem] text-[var(--text)] text-right focus:outline-none focus:border-[var(--accent)]"
            />
            <button onClick={() => onChangeCidades(cidades.filter((_, j) => j !== i))} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <p className="text-[0.78rem] text-[var(--text-dim)]">Cidades aqui têm prioridade sobre "Outras cidades".</p>
      </div>
    </div>
  );
}

function FreteSkeletonView() {
  return (
    <div className="flex flex-col gap-4 max-w-[580px]">
      <div className="skeleton h-[110px] rounded-[var(--radius-lg)]" />
      <div className="skeleton h-[40px] w-48 rounded-[var(--radius-md)]" />
    </div>
  );
}
