"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { buscarCep, geocodeEndereco, maskCep } from "@/lib/utils";
import { Search, Map, CheckCircle, AlertTriangle } from "lucide-react";

export interface OrigemValues {
  origemCep: string;
  origemNumero: string;
  origemComplemento: string;
  origemEndereco: string;
  origemLat: string;
  origemLon: string;
  origemCidade: string;
  origemUF: string;
}

interface OrigemPanelProps {
  values: OrigemValues;
  onChange: (v: Partial<OrigemValues>) => void;
  hint?: string;
}

type GeoStatus =
  | { type: "idle" }
  | { type: "loading"; message: string }
  | { type: "ok"; message: string; precise: boolean }
  | { type: "warn"; message: string }
  | { type: "error"; message: string };

export function OrigemPanel({ values, onChange, hint }: OrigemPanelProps) {
  const [cepInput, setCepInput] = useState(
    values.origemCep
      ? values.origemCep.replace(/(\d{5})(\d{3})/, "$1-$2")
      : ""
  );
  const [status, setStatus] = useState<GeoStatus>({ type: "idle" });
  const [loadingCep, setLoadingCep] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const hasCoords = !!(values.origemLat && values.origemLon);

  const handleBuscarCep = useCallback(async () => {
    const raw = cepInput.replace(/\D/g, "");
    if (raw.length !== 8) {
      setStatus({ type: "error", message: "Digite um CEP válido com 8 dígitos." });
      return;
    }

    setLoadingCep(true);
    setStatus({ type: "loading", message: "Consultando ViaCEP…" });

    try {
      const cepData = await buscarCep(raw);

      const numero = values.origemNumero || "";
      const compl = values.origemComplemento || "";
      const endCompleto = [
        cepData.logradouro,
        numero && `, ${numero}`,
        compl && ` — ${compl}`,
        cepData.bairro && `, ${cepData.bairro}`,
        `, ${cepData.localidade}/${cepData.uf}`,
      ]
        .filter(Boolean)
        .join("")
        .replace(/^,\s*/, "");

      onChange({
        origemCep: raw,
        origemEndereco: endCompleto,
        origemCidade: cepData.localidade,
        origemUF: cepData.uf,
      });

      setStatus({ type: "loading", message: `${cepData.localidade}/${cepData.uf} — geocodificando…` });

      // Geocoding
      const geo = await geocodeEndereco(
        cepData.logradouro,
        numero,
        cepData.localidade,
        cepData.uf
      );

      if (geo) {
        const lat = parseFloat(geo.lat).toFixed(6);
        const lon = parseFloat(geo.lon).toFixed(6);
        onChange({ origemLat: lat, origemLon: lon });

        if (geo.preciso) {
          setStatus({
            type: "ok",
            message: `Endereço localizado. Confirme no mapa se quiser ajustar.`,
            precise: true,
          });
        } else {
          setStatus({
            type: "warn",
            message: `Centralizado em ${cepData.localidade}. Arraste o pin para o local exato.`,
          });
          setMapOpen(true);
        }
      } else {
        onChange({ origemLat: "-15.780148", origemLon: "-47.929198" });
        setStatus({
          type: "warn",
          message: "Não foi possível detectar as coordenadas. Use o mapa para marcar.",
        });
        setMapOpen(true);
      }
    } catch (err: unknown) {
      setStatus({
        type: "error",
        message: (err as Error).message || "Erro ao buscar CEP.",
      });
    } finally {
      setLoadingCep(false);
    }
  }, [cepInput, values.origemNumero, values.origemComplemento, onChange]);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 sm:p-5 flex flex-col gap-4">
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
        Endereço de Origem
      </p>

      {hint && <p className="text-[0.78rem] text-[var(--text-dim)]">{hint}</p>}

      {/* CEP row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            label="CEP *"
            placeholder="00000-000"
            value={cepInput}
            maxLength={9}
            onChange={(e) => setCepInput(maskCep(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && handleBuscarCep()}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBuscarCep}
          loading={loadingCep}
          className="sm:self-end sm:h-[38px]"
        >
          <Search size={14} />
          Buscar CEP
        </Button>
      </div>

      {/* Número + Complemento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Número"
          placeholder="110"
          value={values.origemNumero}
          onChange={(e) => onChange({ origemNumero: e.target.value })}
        />
        <Input
          label="Complemento"
          placeholder="Sala 2, Fundos…"
          value={values.origemComplemento}
          onChange={(e) => onChange({ origemComplemento: e.target.value })}
        />
      </div>

      {/* Endereço completo (readonly) */}
      <Input
        label="Endereço completo (preenchido pelo CEP)"
        value={values.origemEndereco}
        readOnly
        className="opacity-70 cursor-default"
        placeholder="Busque o CEP acima"
      />

      {/* Lat / Lon (readonly) */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Latitude (auto)"
          value={values.origemLat}
          readOnly
          className="opacity-70 cursor-default font-mono text-xs"
          placeholder="Detectada"
        />
        <Input
          label="Longitude (auto)"
          value={values.origemLon}
          readOnly
          className="opacity-70 cursor-default font-mono text-xs"
          placeholder="Detectada"
        />
      </div>

      {/* Status */}
      {status.type !== "idle" && (
        <div
          className={`flex items-start gap-2 text-[0.82rem] ${
            status.type === "ok"
              ? "text-[var(--success)]"
              : status.type === "warn"
              ? "text-[var(--warning)]"
              : status.type === "error"
              ? "text-[var(--danger)]"
              : "text-[var(--text-muted)]"
          }`}
        >
          {status.type === "ok" && <CheckCircle size={14} className="shrink-0 mt-[1px]" />}
          {(status.type === "warn" || status.type === "error") && (
            <AlertTriangle size={14} className="shrink-0 mt-[1px]" />
          )}
          {status.message}
        </div>
      )}

      {/* Map button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMapOpen(true)}
        className="self-start"
      >
        <Map size={14} />
        {hasCoords ? "Confirmar posição no mapa" : "Marcar posição no mapa"}
      </Button>

      {/* Map modal */}
      {mapOpen && (
        <MapModal
          lat={parseFloat(values.origemLat) || -15.78}
          lon={parseFloat(values.origemLon) || -47.93}
          zoom={hasCoords ? 17 : 13}
          endereco={values.origemEndereco}
          onConfirm={(lat, lon) => {
            onChange({ origemLat: lat.toFixed(6), origemLon: lon.toFixed(6) });
            setStatus({ type: "ok", message: `Posição ajustada: ${lat.toFixed(5)}, ${lon.toFixed(5)}`, precise: true });
            setMapOpen(false);
          }}
          onClose={() => setMapOpen(false)}
        />
      )}
    </div>
  );
}

// ── Leaflet map modal ────────────────────────────────────────────────────────
interface MapModalProps {
  lat: number;
  lon: number;
  zoom: number;
  endereco: string;
  onConfirm: (lat: number, lon: number) => void;
  onClose: () => void;
}

function MapModal({ lat, lon, zoom, endereco, onConfirm, onClose }: MapModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const coordsRef = useRef({ lat, lon });

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      // Dynamically import Leaflet to avoid SSR issues
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!mounted || !containerRef.current) return;

      // Fix default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current).setView([lat, lon], zoom);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        html: `<div style="background:var(--accent,#7c3aed);width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        className: "",
      });

      const marker = L.marker([lat, lon], { draggable: true, icon }).addTo(map);
      markerRef.current = marker;
      marker.bindPopup("📍 Arraste para ajustar").openPopup();

      marker.on("drag", (e: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pos = (e as any).target.getLatLng();
        coordsRef.current = { lat: pos.lat, lon: pos.lng };
      });
    };

    // Small delay for DOM to render
    const timer = setTimeout(initMap, 80);
    return () => {
      mounted = false;
      clearTimeout(timer);
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = () => {
    onConfirm(coordsRef.current.lat, coordsRef.current.lon);
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-[4px] z-[500] flex items-center justify-center p-3">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] w-full max-w-[640px] flex flex-col shadow-[var(--shadow-lg)] max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <h3 className="font-bold flex items-center gap-2">
            <Map size={18} />
            Confirmar posição no mapa
          </h3>
          <button onClick={onClose} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--surface-hover)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Hint */}
        <div className="px-5 py-3 bg-[var(--bg)] border-b border-[var(--border)] text-[0.85rem] text-[var(--text-muted)]">
          📍 <strong className="text-[var(--text)]">{endereco || "Endereço"}</strong>
          <br />
          <span className="text-[0.78rem]">Arraste o marcador para a posição exata.</span>
        </div>

        {/* Map */}
        <div ref={containerRef} className="h-[320px] sm:h-[380px] w-full" />

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--border)] shrink-0">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm}>Confirmar posição</Button>
        </div>
      </div>
    </div>
  );
}
