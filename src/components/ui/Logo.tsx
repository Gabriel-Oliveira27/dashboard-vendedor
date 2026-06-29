interface LogoIconProps {
  size?: number;
  className?: string;
}

/** Marca "containers empilhados" — remete a estoque/inventário.
 *  Desenhada em branco para uso sobre o tile com gradiente da marca. */
export function LogoIcon({ size = 36, className }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* container de cima (menor) */}
      <rect x="11" y="6"  width="14" height="6" rx="3" fill="white" fillOpacity="0.40"/>
      {/* container do meio */}
      <rect x="9"  y="14" width="18" height="7" rx="3" fill="white" fillOpacity="0.65"/>
      {/* container da base (maior) */}
      <rect x="7"  y="23" width="22" height="7" rx="3" fill="white" fillOpacity="0.95"/>
      {/* brilho sutil na base */}
      <rect x="10" y="25.5" width="5" height="2" rx="1" fill="#7c3aed" fillOpacity="0.55"/>
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
export const LOGO_SVG_STRING = `<svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tsg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
      <stop stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#5b21b6"/>
    </linearGradient>
  </defs>
  <rect width="36" height="36" rx="10" fill="url(#tsg)"/>
  <rect x="11" y="6"  width="14" height="6" rx="3" fill="white" fill-opacity="0.40"/>
  <rect x="9"  y="14" width="18" height="7" rx="3" fill="white" fill-opacity="0.65"/>
  <rect x="7"  y="23" width="22" height="7" rx="3" fill="white" fill-opacity="0.95"/>
</svg>`;
