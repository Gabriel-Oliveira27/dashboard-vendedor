"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export interface OrigemValues {
  origemCep: string; origemNumero: string; origemComplemento: string;
  origemEndereco: string; origemLat: string; origemLon: string;
  origemCidade: string; origemUF: string;
}

interface Props { values: OrigemValues; onChange: (v: Partial<OrigemValues>) => void; hint?: string; }

function maskCep(v: string) {
  let s = v.replace(/\D/g, "");
  if (s.length > 5) s = s.slice(0, 5) + "-" + s.slice(5, 8);
  return s;
}

export function OrigemPanel({ values, onChange, hint }: Props) {
  const [cepInput, setCepInput] = useState(values.origemCep ? values.origemCep.replace(/(\d{5})(\d{3})/, "$1-$2") : "");
  const [status, setStatus] = useState<{ type: "idle"|"loading"|"ok"|"warn"|"error"; msg: string }>({ type: "idle", msg: "" });
  const [loadingCep, setLoadingCep] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const buscar = useCallback(async () => {
    const raw = cepInput.replace(/\D/g, "");
    if (raw.length !== 8) { setStatus({ type: "error", msg: "CEP deve ter 8 dígitos." }); return; }
    setLoadingCep(true);
    setStatus({ type: "loading", msg: "Consultando ViaCEP…" });
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const d = await res.json();
      if (d.erro) throw new Error("CEP não encontrado.");
      const numero = values.origemNumero || "";
      const endCompleto = [d.logradouro, numero && `, ${numero}`, d.bairro && `, ${d.bairro}`, `, ${d.localidade}/${d.uf}`].filter(Boolean).join("").replace(/^,\s*/, "");
      onChange({ origemCep: raw, origemEndereco: endCompleto, origemCidade: d.localidade, origemUF: d.uf });
      setStatus({ type: "loading", msg: `${d.localidade}/${d.uf} — geocodificando…` });

      // Geocoding
      try {
        const q1 = `${d.logradouro}${numero ? " " + numero : ""}, ${d.localidade}, ${d.uf}, Brasil`;
        const r1 = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q1)}&format=json&limit=1&countrycodes=br`, { headers: { "Accept-Language": "pt-BR", "User-Agent": "TupperStore/2.0" } });
        const j1 = await r1.json();
        if (j1?.length) {
          onChange({ origemLat: parseFloat(j1[0].lat).toFixed(6), origemLon: parseFloat(j1[0].lon).toFixed(6) });
          setStatus({ type: "ok", msg: "Endereço localizado com precisão. Confirme no mapa." });
        } else {
          const q2 = `${d.localidade}, ${d.uf}, Brasil`;
          const r2 = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q2)}&format=json&limit=1&countrycodes=br`, { headers: { "Accept-Language": "pt-BR", "User-Agent": "TupperStore/2.0" } });
          const j2 = await r2.json();
          if (j2?.length) {
            onChange({ origemLat: parseFloat(j2[0].lat).toFixed(6), origemLon: parseFloat(j2[0].lon).toFixed(6) });
            setStatus({ type: "warn", msg: `Centralizado em ${d.localidade}. Ajuste o pin no mapa.` });
            setMapOpen(true);
          } else {
            setStatus({ type: "warn", msg: "Coordenadas não encontradas. Use o mapa para marcar." });
            setMapOpen(true);
          }
        }
      } catch { setStatus({ type: "warn", msg: "Erro no geocoding. Use o mapa para marcar a posição." }); setMapOpen(true); }
    } catch (e: unknown) {
      setStatus({ type: "error", msg: (e as Error).message });
    } finally { setLoadingCep(false); }
  }, [cepInput, values.origemNumero, onChange]);

  const statusColor = { idle: "var(--text-muted)", loading: "var(--text-muted)", ok: "var(--success)", warn: "var(--warning)", error: "var(--danger)" }[status.type];

  return (
    <div className="pix-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "1rem" }}>
      <div className="section-subtitle" style={{ margin: 0 }}>Endereço de Origem / Retirada</div>
      {hint && <p style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{hint}</p>}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <div className="form-group" style={{ flex: 1, minWidth: "160px" }}>
          <label>CEP *</label>
          <input className="input-field" placeholder="00000-000" value={cepInput} maxLength={9}
            onChange={(e) => setCepInput(maskCep(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && buscar()} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button className="btn btn-ghost" onClick={buscar} disabled={loadingCep}>
            {loadingCep ? "Buscando…" : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Buscar CEP</>
            )}
          </button>
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-group">
          <label>Número</label>
          <input className="input-field" placeholder="110" value={values.origemNumero} onChange={(e) => onChange({ origemNumero: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Complemento</label>
          <input className="input-field" placeholder="Sala 2, Fundos…" value={values.origemComplemento} onChange={(e) => onChange({ origemComplemento: e.target.value })} />
        </div>
      </div>

      <div className="form-group">
        <label>Endereço completo (preenchido pelo CEP)</label>
        <input className="input-field" value={values.origemEndereco} readOnly style={{ opacity: .7, cursor: "default" }} placeholder="Busque o CEP acima" />
      </div>

      <div className="form-grid-2">
        <div className="form-group">
          <label>Latitude (auto)</label>
          <input className="input-field" value={values.origemLat} readOnly style={{ opacity: .7, cursor: "default", fontFamily: "monospace", fontSize: "0.8rem" }} placeholder="Detectada" />
        </div>
        <div className="form-group">
          <label>Longitude (auto)</label>
          <input className="input-field" value={values.origemLon} readOnly style={{ opacity: .7, cursor: "default", fontFamily: "monospace", fontSize: "0.8rem" }} placeholder="Detectada" />
        </div>
      </div>

      {status.type !== "idle" && (
        <p style={{ fontSize: "0.82rem", color: statusColor }}>{status.msg}</p>
      )}

      <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setMapOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
        {values.origemLat ? "Confirmar no mapa" : "Marcar no mapa"}
      </button>

      {mapOpen && (
        <MapModal
          lat={parseFloat(values.origemLat) || -15.78}
          lon={parseFloat(values.origemLon) || -47.93}
          zoom={values.origemLat ? 17 : 13}
          endereco={values.origemEndereco}
          onConfirm={(lat, lon) => {
            onChange({ origemLat: lat.toFixed(6), origemLon: lon.toFixed(6) });
            setStatus({ type: "ok", msg: `Posição ajustada: ${lat.toFixed(5)}, ${lon.toFixed(5)}` });
            setMapOpen(false);
          }}
          onClose={() => setMapOpen(false)}
        />
      )}
    </div>
  );
}

function MapModal({ lat, lon, zoom, endereco, onConfirm, onClose }: { lat: number; lon: number; zoom: number; endereco: string; onConfirm: (lat: number, lon: number) => void; onClose: () => void; }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const coordsRef = useRef({ lat, lon });

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (!mounted || !containerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      const map = L.map(containerRef.current).setView([lat, lon], zoom);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OSM", maxZoom: 19 }).addTo(map);
      const icon = L.divIcon({ html: `<div style="background:var(--accent,#7c3aed);width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`, iconSize: [18,18], iconAnchor: [9,9], className: "" });
      const marker = L.marker([lat, lon], { draggable: true, icon }).addTo(map);
      marker.bindPopup("📍 Arraste para ajustar").openPopup();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marker.on("drag", (e: any) => { const p = e.target.getLatLng(); coordsRef.current = { lat: p.lat, lon: p.lng }; });
    };
    const t = setTimeout(init, 80);
    return () => { mounted = false; clearTimeout(t); if (mapRef.current) { (mapRef.current as any).remove(); mapRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="modal-overlay visible" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ maxWidth: "640px" }}>
        <div className="modal-header">
          <h3>Confirmar posição no mapa</h3>
          <button className="btn-icon" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div style={{ padding: "0.75rem 1.25rem", background: "var(--bg)", borderBottom: "1px solid var(--border)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          📍 <strong style={{ color: "var(--text)" }}>{endereco || "Endereço"}</strong><br />
          <span style={{ fontSize: "0.78rem" }}>Arraste o marcador para a posição exata.</span>
        </div>
        <div ref={containerRef} style={{ height: "360px", width: "100%" }} />
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => onConfirm(coordsRef.current.lat, coordsRef.current.lon)}>Confirmar posição</button>
        </div>
      </div>
    </div>
  );
}
