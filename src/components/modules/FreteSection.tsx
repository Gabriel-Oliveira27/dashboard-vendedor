"use client";
import { useEffect, useState, useCallback } from "react";
import { API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { OrigemPanel, type OrigemValues } from "./OrigemPanel";
import type { FreteConfig, FreteModelo, TierValor, CidadeEspecial } from "@/types";

const MODELO_LABEL: Record<FreteModelo, string> = {
  VALOR: "Por valor da compra", KM: "Por distância (km)", FIXO: "Valor fixo", CIDADE: "Fixo por cidade",
};

const DEFAULT_TIERS: TierValor[] = [
  { ate: 129, taxa: 0 },{ ate: 200, taxa: 1.5 },{ ate: 270, taxa: 3 },
  { ate: 349, taxa: 5 },{ ate: 419, taxa: 7 },{ ate: null, taxa: 10 },
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
    try { const d = await API.getFreteConfig(); setCfg(d); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="skeleton-line" style={{ height: "100px", borderRadius: "var(--radius-lg)" }} />;

  return editing
    ? <FreteEdit cfg={cfg} onSaved={(s) => { setCfg(s); setEditing(false); }} onCancel={() => setEditing(false)} showToast={showToast} />
    : <FreteView cfg={cfg} podeEditar={podeEditar} onEdit={() => setEditing(true)} />;
}

function FreteView({ cfg, podeEditar, onEdit }: { cfg: FreteConfig | null; podeEditar: boolean; onEdit: () => void }) {
  const modelo = cfg?.modelo || "VALOR";
  return (
    <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="pix-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="card-icon icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <div>
            <span className="card-label">Modelo de Frete</span>
            <div style={{ fontWeight: 600, fontSize: "1rem" }}>{MODELO_LABEL[modelo]}</div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
          {modelo === "VALOR" && (cfg?.tiersValor || []).map((t, i) => (
            <div key={i} className="frete-row-view">
              <span>{t.ate != null ? `Até R$ ${Number(t.ate).toFixed(2)}` : "Acima disso"}</span>
              <Badge variant={Number(t.taxa) === 0 ? "green" : "blue"}>{Number(t.taxa) === 0 ? "Grátis" : `R$ ${Number(t.taxa).toFixed(2)}`}</Badge>
            </div>
          ))}
          {modelo === "KM" && <>
            <div className="frete-row-view"><span>Custo por km</span><Badge variant="blue">R$ {Number(cfg?.custoKm || 1.5).toFixed(2)}/km</Badge></div>
            {Number(cfg?.freteGratisAteKm) > 0 && <div className="frete-row-view"><span>Frete grátis até</span><Badge variant="green">{cfg?.freteGratisAteKm} km</Badge></div>}
          </>}
          {modelo === "FIXO" && <div className="frete-row-view"><span>Valor único</span><Badge variant={Number(cfg?.valorFixo) === 0 ? "green" : "blue"}>{Number(cfg?.valorFixo) === 0 ? "Grátis" : `R$ ${Number(cfg?.valorFixo).toFixed(2)}`}</Badge></div>}
          {modelo === "CIDADE" && <>
            <div className="frete-row-view"><span>{cfg?.origemCidade || "Cidade de origem"}</span><Badge variant="blue">R$ {Number(cfg?.valorCidadeOrigem || 0).toFixed(2)}</Badge></div>
            <div className="frete-row-view"><span>Outras cidades</span><Badge variant="orange">R$ {Number(cfg?.valorDemais || 0).toFixed(2)}</Badge></div>
            {(cfg?.cidadesEspeciais || []).map((c, i) => <div key={i} className="frete-row-view" style={{ paddingLeft: "1rem" }}><span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{c.nome}</span><Badge variant="purple">R$ {Number(c.valor).toFixed(2)}</Badge></div>)}
          </>}
        </div>
      </div>
      {podeEditar ? <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={onEdit}>Editar Configuração de Frete</button>
                  : <p className="field-hint">Acesso somente de visualização.</p>}
    </div>
  );
}

function FreteEdit({ cfg, onSaved, onCancel, showToast }: { cfg: FreteConfig | null; onSaved: (c: FreteConfig) => void; onCancel: () => void; showToast: (m: string, t?: "success"|"error"|"warning"|"info") => void }) {
  const [modelo, setModelo] = useState<FreteModelo>(cfg?.modelo || "VALOR");
  const [tiers, setTiers] = useState<TierValor[]>(cfg?.tiersValor?.length ? cfg.tiersValor : DEFAULT_TIERS);
  const [custoKm, setCustoKm] = useState(String(cfg?.custoKm || 1.5));
  const [gratisKm, setGratisKm] = useState(String(cfg?.freteGratisAteKm || 0));
  const [valorFixo, setValorFixo] = useState(String(cfg?.valorFixo || 0));
  const [valorOrigem, setValorOrigem] = useState(String(cfg?.valorCidadeOrigem || 0));
  const [valorDemais, setValorDemais] = useState(String(cfg?.valorDemais || 0));
  const [cidades, setCidades] = useState<CidadeEspecial[]>(cfg?.cidadesEspeciais || []);
  const [origem, setOrigem] = useState<OrigemValues>({
    origemCep: cfg?.origemCep || "", origemNumero: cfg?.origemNumero || "",
    origemComplemento: cfg?.origemComplemento || "", origemEndereco: cfg?.origemEndereco || "",
    origemLat: cfg?.origemLat || "", origemLon: cfg?.origemLon || "",
    origemCidade: cfg?.origemCidade || "", origemUF: cfg?.origemUF || "",
  });
  const [saving, setSaving] = useState(false);
  const needsOrigem = modelo === "KM" || modelo === "CIDADE";

  const save = async () => {
    if (modelo === "KM" && (!origem.origemLat || !origem.origemLon)) {
      showToast("Busque o CEP e confirme as coordenadas antes de salvar.", "warning"); return;
    }
    const payload: FreteConfig = {
      modelo, ...origem,
      ...(modelo === "VALOR" && { tiersValor: tiers }),
      ...(modelo === "KM" && { custoKm: parseFloat(custoKm) || 1.5, freteGratisAteKm: parseFloat(gratisKm) || 0 }),
      ...(modelo === "FIXO" && { valorFixo: parseFloat(valorFixo) || 0 }),
      ...(modelo === "CIDADE" && { valorCidadeOrigem: parseFloat(valorOrigem) || 0, valorDemais: parseFloat(valorDemais) || 0, cidadesEspeciais: cidades }),
    };
    setSaving(true);
    try { const saved = await API.saveFreteConfig(payload); showToast("Frete salvo!", "success"); onSaved(saved); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Modelo */}
      <div className="pix-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.75rem" }}>
        <span className="section-subtitle" style={{ margin: 0 }}>Modelo de Frete</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          {(Object.keys(MODELO_LABEL) as FreteModelo[]).map((k) => (
            <label key={k} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.65rem 0.85rem", borderRadius: "10px", border: `1px solid ${modelo === k ? "var(--accent)" : "var(--border)"}`, background: modelo === k ? "var(--accent-soft)" : "var(--bg)", cursor: "pointer", transition: "all .15s" }}>
              <input type="radio" name="modelo" value={k} checked={modelo === k} onChange={() => setModelo(k)} style={{ accentColor: "var(--accent)" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: modelo === k ? 600 : 400, color: modelo === k ? "var(--accent)" : "var(--text)" }}>{MODELO_LABEL[k]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Panels */}
      {modelo === "VALOR" && <TiersPanel tiers={tiers} onChange={setTiers} />}
      {modelo === "KM" && (
        <div className="pix-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "1rem" }}>
          <span className="section-subtitle" style={{ margin: 0 }}>Parâmetros por km</span>
          <div className="form-grid-2">
            <div className="form-group"><label>Custo por km (R$)</label><input className="input-field" type="number" min="0" step="0.10" value={custoKm} onChange={(e) => setCustoKm(e.target.value)} /></div>
            <div className="form-group"><label>Frete grátis até (km)</label><input className="input-field" type="number" min="0" step="1" value={gratisKm} onChange={(e) => setGratisKm(e.target.value)} /><span className="field-hint">0 = nunca grátis</span></div>
          </div>
        </div>
      )}
      {modelo === "FIXO" && (
        <div className="pix-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.75rem" }}>
          <span className="section-subtitle" style={{ margin: 0 }}>Valor fixo</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input className="input-field" type="number" min="0" step="0.01" value={valorFixo} onChange={(e) => setValorFixo(e.target.value)} style={{ maxWidth: "120px", textAlign: "right" }} />
            <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>R$ — 0 = frete grátis</span>
          </div>
        </div>
      )}
      {modelo === "CIDADE" && <CidadePanel valorOrigem={valorOrigem} valorDemais={valorDemais} cidades={cidades} onChangeOrigem={setValorOrigem} onChangeDemais={setValorDemais} onChangeCidades={setCidades} />}
      {needsOrigem && <OrigemPanel values={origem} onChange={(v) => setOrigem((p) => ({ ...p, ...v }))} />}

      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar Configuração"}</button>
      </div>
    </div>
  );
}

function TiersPanel({ tiers, onChange }: { tiers: TierValor[]; onChange: (t: TierValor[]) => void }) {
  const upd = (i: number, f: keyof TierValor, v: string) => {
    const n = [...tiers];
    if (f === "ate") n[i] = { ...n[i], ate: v === "" ? null : parseFloat(v) || 0 };
    else n[i] = { ...n[i], taxa: parseFloat(v) || 0 };
    onChange(n);
  };
  return (
    <div className="pix-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="section-subtitle" style={{ margin: 0 }}>Faixas por valor do carrinho</span>
        <button className="btn btn-ghost btn-sm" onClick={() => onChange([...tiers, { ate: null, taxa: 0 }])}>+ Faixa</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-dim)" }}>Até (R$)</span>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-dim)" }}>Taxa (R$)</span>
        <span />
        {tiers.map((t, i) => (
          <div key={i} style={{ display: "contents" }}>
            <input type="number" value={t.ate ?? ""} min="0" step="0.01" placeholder="∞" onChange={(e) => upd(i, "ate", e.target.value)}
              className="input-field" style={{ height: "36px", textAlign: "right", fontSize: "0.85rem" }} />
            <input type="number" value={t.taxa} min="0" step="0.01" onChange={(e) => upd(i, "taxa", e.target.value)}
              className="input-field" style={{ height: "36px", textAlign: "right", fontSize: "0.85rem" }} />
            <button className="btn-icon btn-danger-icon" onClick={() => { if (tiers.length > 1) onChange(tiers.filter((_, j) => j !== i)); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        ))}
      </div>
      <span className="field-hint">Taxa 0 = frete grátis. Última faixa: deixe "Até" vazio.</span>
    </div>
  );
}

function CidadePanel({ valorOrigem, valorDemais, cidades, onChangeOrigem, onChangeDemais, onChangeCidades }: { valorOrigem: string; valorDemais: string; cidades: CidadeEspecial[]; onChangeOrigem: (v: string) => void; onChangeDemais: (v: string) => void; onChangeCidades: (c: CidadeEspecial[]) => void }) {
  return (
    <div className="pix-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "1rem" }}>
      <span className="section-subtitle" style={{ margin: 0 }}>Valores por cidade</span>
      <div className="form-grid-2">
        <div className="form-group"><label>Cidade de origem (R$)</label><input className="input-field" type="number" min="0" step="0.01" value={valorOrigem} onChange={(e) => onChangeOrigem(e.target.value)} /></div>
        <div className="form-group"><label>Outras cidades (R$)</label><input className="input-field" type="number" min="0" step="0.01" value={valorDemais} onChange={(e) => onChangeDemais(e.target.value)} /></div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)" }}>Cidades com valor especial</span>
          <button className="btn btn-ghost btn-sm" onClick={() => onChangeCidades([...cidades, { nome: "", valor: 0 }])}>+ Cidade</button>
        </div>
        {cidades.map((c, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: "0.5rem", marginBottom: "0.4rem", alignItems: "center" }}>
            <input className="input-field" value={c.nome} placeholder="Nome da cidade" style={{ height: "36px", fontSize: "0.85rem" }} onChange={(e) => onChangeCidades(cidades.map((x, j) => j === i ? { ...x, nome: e.target.value } : x))} />
            <input className="input-field" type="number" value={c.valor} min="0" step="0.01" style={{ height: "36px", fontSize: "0.85rem", textAlign: "right" }} onChange={(e) => onChangeCidades(cidades.map((x, j) => j === i ? { ...x, valor: parseFloat(e.target.value) || 0 } : x))} />
            <button className="btn-icon btn-danger-icon" onClick={() => onChangeCidades(cidades.filter((_, j) => j !== i))}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
