export function formatCurrency(value: number | string | null | undefined): string {
  return (parseFloat(String(value ?? 0)) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return (
    dt.toLocaleDateString("pt-BR") +
    " " +
    dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

export function isToday(d: string | Date): boolean {
  const a = new Date(d);
  const n = new Date();
  return (
    a.getDate() === n.getDate() &&
    a.getMonth() === n.getMonth() &&
    a.getFullYear() === n.getFullYear()
  );
}

export function isThisMonth(d: string | Date): boolean {
  const a = new Date(d);
  const n = new Date();
  return a.getMonth() === n.getMonth() && a.getFullYear() === n.getFullYear();
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function maskCep(value: string): string {
  let v = value.replace(/\D/g, "");
  if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
  return v;
}

// ── CEP lookup via ViaCEP ──────────────────────────────────────────────────
export interface CepResult {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  enderecoCompleto: string;
}

export async function buscarCep(cep: string): Promise<CepResult> {
  const raw = cep.replace(/\D/g, "");
  if (raw.length !== 8) throw new Error("CEP deve ter 8 dígitos.");

  const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
  const data = await res.json();
  if (data.erro) throw new Error("CEP não encontrado nos Correios.");

  const enderecoCompleto = [
    data.logradouro,
    data.bairro && `, ${data.bairro}`,
    `, ${data.localidade}/${data.uf}`,
  ]
    .filter(Boolean)
    .join("")
    .replace(/^,\s*/, "");

  return {
    logradouro: data.logradouro || "",
    bairro: data.bairro || "",
    localidade: data.localidade || "",
    uf: data.uf || "",
    enderecoCompleto,
  };
}

// ── Geocoding via Nominatim ────────────────────────────────────────────────
export interface GeoResult {
  lat: string;
  lon: string;
  preciso: boolean;
}

async function nominatimSearch(q: string): Promise<{ lat: string; lon: string }[]> {
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=br`;
  const res = await fetch(url, {
    headers: {
      "Accept-Language": "pt-BR",
      "User-Agent": "TupperStoreDashboard/2.0",
    },
  });
  return res.json();
}

export async function geocodeEndereco(
  logradouro: string,
  numero: string,
  cidade: string,
  uf: string
): Promise<GeoResult | null> {
  // 1st try: full address
  try {
    const q1 = `${logradouro}${numero ? " " + numero : ""}, ${cidade}, ${uf}, Brasil`;
    const r1 = await nominatimSearch(q1);
    if (r1?.length) return { lat: r1[0].lat, lon: r1[0].lon, preciso: true };
  } catch {}

  // 2nd try: city only
  try {
    const q2 = `${cidade}, ${uf}, Brasil`;
    const r2 = await nominatimSearch(q2);
    if (r2?.length) return { lat: r2[0].lat, lon: r2[0].lon, preciso: false };
  } catch {}

  return null;
}
