import { ArrowUp, ArrowDown } from "lucide-react";
import { formatCompactNumber } from "@/lib/format";

function sparklinePath(values: number[], width: number, height: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  return values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function StatTile({
  label,
  value,
  formattedValue,
  deltaPct,
  sparkline,
}: {
  label: string;
  value: number;
  formattedValue?: string;
  deltaPct?: number;
  sparkline?: number[];
}) {
  const isUp = (deltaPct ?? 0) >= 0;
  const deltaColorClass = isUp ? "text-success" : "text-primary-glow";
  const width = 96;
  const height = 28;

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>

      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="font-display text-2xl font-bold text-foreground">
          {formattedValue ?? formatCompactNumber(value)}
        </p>

        {deltaPct !== undefined && (
          <span className={`flex items-center gap-0.5 text-sm font-medium ${deltaColorClass}`}>
            {isUp ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {Math.abs(deltaPct).toFixed(1)}%
          </span>
        )}
      </div>

      {sparkline && sparkline.length > 1 && (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="mt-3 w-full"
          preserveAspectRatio="none"
          role="presentation"
        >
          <path
            d={sparklinePath(sparkline, width, height)}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {(() => {
            const min = Math.min(...sparkline);
            const max = Math.max(...sparkline);
            const range = max - min || 1;
            const lastIndex = sparkline.length - 1;
            const cx = lastIndex * (width / lastIndex);
            const cy = height - ((sparkline[lastIndex] - min) / range) * height;
            return (
              <circle
                cx={cx}
                cy={cy}
                r={3}
                fill={isUp ? "var(--success)" : "var(--primary-glow)"}
                stroke="var(--surface-raised)"
                strokeWidth={2}
              />
            );
          })()}
        </svg>
      )}
    </div>
  );
}
