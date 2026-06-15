interface LogoIconProps {
  size?: number;
  className?: string;
}

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
      {/* Lid */}
      <rect x="5" y="7" width="26" height="6" rx="2.5" fill="white" fillOpacity="0.95"/>
      {/* Lid handle */}
      <rect x="14" y="4" width="8" height="4" rx="2" fill="white" fillOpacity="0.7"/>
      {/* Body */}
      <path
        d="M7 13h22l-2 16a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2L7 13z"
        fill="white"
        fillOpacity="0.25"
      />
      <path
        d="M7 13h22l-2 16a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2L7 13z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fillOpacity="0"
      />
      {/* Shine line on body */}
      <path
        d="M11.5 17 L10.5 24"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />
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
          borderRadius: "10px",
          background: "linear-gradient(135deg, var(--accent) 0%, #5b21b6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
        }}
      >
        <LogoIcon size={size * 0.78} />
      </div>
      <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "-0.01em" }}>
        Tupper<strong style={{ color: "var(--text)", fontWeight: 700 }}>Store</strong>
      </span>
    </div>
  );
}

// Standalone SVG string for favicon generation
export const LOGO_SVG_STRING = `<svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="36" height="36" rx="9" fill="#7c3aed"/>
  <rect x="5" y="7" width="26" height="6" rx="2.5" fill="white" fill-opacity="0.95"/>
  <rect x="14" y="4" width="8" height="4" rx="2" fill="white" fill-opacity="0.7"/>
  <path d="M7 13h22l-2 16a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2L7 13z" fill="white" fill-opacity="0.25"/>
  <path d="M7 13h22l-2 16a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2L7 13z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M11.5 17 L10.5 24" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.4"/>
</svg>`;
