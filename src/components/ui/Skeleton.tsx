export function SkeletonRows({ rows=5, cols=4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} style={{ padding: "0.85rem 1rem" }}>
              <div className="skeleton-line" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
export function SkeletonCard() {
  return (
    <div className="overview-card">
      <div className="skeleton-thumb" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div className="skeleton-line w50" />
        <div className="skeleton-line w35" />
      </div>
    </div>
  );
}
