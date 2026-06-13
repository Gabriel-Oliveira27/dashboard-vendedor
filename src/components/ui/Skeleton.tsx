import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
}

export function Skeleton({ className, height, width }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", className)}
      style={{ height, width }}
    />
  );
}

export function SkeletonRows({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <Skeleton height={12} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 flex items-center gap-4">
      <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton height={10} width="50%" />
        <Skeleton height={20} width="35%" />
      </div>
    </div>
  );
}
