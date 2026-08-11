"use client";

import { useId, useRef, useState } from "react";
import type { SeriesPoint } from "@/lib/dashboard-data";

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 40 };

function niceMax(value: number) {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 2 ? 2.5 : normalized <= 5 ? 5 : 10;
  return Math.ceil(value / (step * magnitude)) * step * magnitude;
}

export function LineChart({
  title,
  data,
  color = "var(--chart-1)",
  valueSuffix = "",
}: {
  title: string;
  data: SeriesPoint[];
  color?: string;
  valueSuffix?: string;
}) {
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;

  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  const xFor = (i: number) => PAD.left + (i / (data.length - 1)) * plotW;
  const yFor = (v: number) => PAD.top + plotH - (v / max) * plotH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${xFor(i).toFixed(1)},${yFor(d.value).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${xFor(data.length - 1).toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${xFor(0).toFixed(1)},${(PAD.top + plotH).toFixed(1)} Z`;

  const lastIndex = data.length - 1;
  const activeIndex = hoverIndex ?? lastIndex;
  const active = data[activeIndex];

  function updateFromClientX(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * WIDTH;
    const ratio = Math.min(1, Math.max(0, (relX - PAD.left) / plotW));
    setHoverIndex(Math.round(ratio * lastIndex));
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
          {title}
        </h3>
        <p className="font-display text-lg font-bold text-foreground">
          {active.value.toLocaleString("en-US")}
          {valueSuffix}
          <span className="ml-1.5 text-xs font-normal text-muted">{active.label}</span>
        </p>
      </div>

      <div className="relative mt-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={`${title} line chart`}
          onPointerMove={(e) => updateFromClientX(e.clientX)}
          onPointerLeave={() => setHoverIndex(null)}
          onFocus={() => setHoverIndex(lastIndex)}
          onBlur={() => setHoverIndex(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setHoverIndex(Math.max(0, activeIndex - 1));
            if (e.key === "ArrowRight") setHoverIndex(Math.min(lastIndex, activeIndex + 1));
          }}
          tabIndex={0}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.1} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={yFor(t)}
                y2={yFor(t)}
                stroke="var(--chart-grid)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={yFor(t)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted"
                fontSize={10}
              >
                {t.toLocaleString("en-US")}
              </text>
            </g>
          ))}

          {data.map((d, i) =>
            i % 2 === 0 ? (
              <text
                key={d.label}
                x={xFor(i)}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-muted"
                fontSize={10}
              >
                {d.label}
              </text>
            ) : null,
          )}

          <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hoverIndex !== null && (
            <line
              x1={xFor(hoverIndex)}
              x2={xFor(hoverIndex)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="var(--muted)"
              strokeWidth={1}
              strokeOpacity={0.5}
            />
          )}

          <circle
            cx={xFor(activeIndex)}
            cy={yFor(active.value)}
            r={4}
            fill={color}
            stroke="var(--surface-raised)"
            strokeWidth={2}
          />
        </svg>

        {hoverIndex !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs shadow-xl"
            style={{
              left: `${(xFor(hoverIndex) / WIDTH) * 100}%`,
              top: `${(yFor(active.value) / HEIGHT) * 100}%`,
            }}
          >
            <p className="font-semibold text-foreground">
              {active.value.toLocaleString("en-US")}
              {valueSuffix}
            </p>
            <p className="text-muted">{active.label}</p>
          </div>
        )}
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
