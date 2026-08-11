export function Meter({
  label,
  ratio,
  description,
}: {
  label: string;
  ratio: number;
  description?: string;
}) {
  const pct = Math.round(ratio * 100);

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="font-display text-lg font-bold text-foreground">{pct}%</p>
      </div>

      <div
        role="meter"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-3 h-2 w-full overflow-hidden rounded-full"
        style={{ background: "var(--border-color)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: "var(--accent)" }}
        />
      </div>

      {description && <p className="mt-2 text-xs text-muted">{description}</p>}
    </div>
  );
}
