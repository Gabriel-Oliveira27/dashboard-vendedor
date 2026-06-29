interface LogoIconProps {
  size?: number;
  className?: string;
}

/** Marca "potes empilhados" — três recipientes com tampa, em ordem decrescente.
 *  Desenhada em branco para uso sobre o tile com gradiente da marca. */
export function LogoIcon({ size = 36, className }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* pote de cima (menor): tampa + corpo afunilado */}
      <rect x="33" y="20" width="34" height="5.5" rx="2.75" fill="white" />
      <path d="M 37.5 27 L 62.5 27 Q 65.5 27 65.5 30 L 63 32.5 Q 63 37 58.5 37 L 41.5 37 Q 37 37 37 32.5 L 34.5 30 Q 34.5 27 37.5 27 Z" fill="white" />
      {/* pote do meio */}
      <rect x="28" y="41.5" width="44" height="6" rx="3" fill="white" />
      <path d="M 32.5 49 L 67.5 49 Q 70.5 49 70.5 52 L 67.5 54.5 Q 67.5 59.5 62.5 59.5 L 37.5 59.5 Q 32.5 59.5 32.5 54.5 L 29.5 52 Q 29.5 49 32.5 49 Z" fill="white" />
      {/* pote da base (maior) */}
      <rect x="22" y="63" width="56" height="6.5" rx="3.25" fill="white" />
      <path d="M 27.5 71 L 72.5 71 Q 76 71 76 74.5 L 72 77 Q 72 83 66 83 L 34 83 Q 28 83 28 77 L 24 74.5 Q 24 71 27.5 71 Z" fill="white" />
    </svg>
  );
}

export function LogoFull({ size = 36 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "11px",
          background: "linear-gradient(140deg, var(--accent) 0%, #5b21b6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 6px 18px rgba(124,58,237,0.45)",
        }}
      >
        <LogoIcon size={size * 0.74} />
      </div>
      <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "-0.01em" }}>
        Tupper<strong style={{ color: "var(--text)", fontWeight: 700 }}>Store</strong>
      </span>
    </div>
  );
}

// SVG standalone (geração de favicon / ícone) — tile com gradiente embutido
export const LOGO_SVG_STRING = `<svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tsg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#5b21b6"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#tsg)"/>
  <rect x="33" y="20" width="34" height="5.5" rx="2.75" fill="white"/>
  <path d="M 37.5 27 L 62.5 27 Q 65.5 27 65.5 30 L 63 32.5 Q 63 37 58.5 37 L 41.5 37 Q 37 37 37 32.5 L 34.5 30 Q 34.5 27 37.5 27 Z" fill="white"/>
  <rect x="28" y="41.5" width="44" height="6" rx="3" fill="white"/>
  <path d="M 32.5 49 L 67.5 49 Q 70.5 49 70.5 52 L 67.5 54.5 Q 67.5 59.5 62.5 59.5 L 37.5 59.5 Q 32.5 59.5 32.5 54.5 L 29.5 52 Q 29.5 49 32.5 49 Z" fill="white"/>
  <rect x="22" y="63" width="56" height="6.5" rx="3.25" fill="white"/>
  <path d="M 27.5 71 L 72.5 71 Q 76 71 76 74.5 L 72 77 Q 72 83 66 83 L 34 83 Q 28 83 28 77 L 24 74.5 Q 24 71 27.5 71 Z" fill="white"/>
</svg>`;
