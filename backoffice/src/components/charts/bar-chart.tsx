"use client";

import { useState } from "react";
import type { GameSlice } from "@/lib/dashboard-data";

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 24, right: 12, bottom: 28, left: 40 };
const BAR_MAX_WIDTH = 56;
const RADIUS = 4;

function niceMax(value: number) {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 2 ? 2.5 : normalized <= 5 ? 5 : 10;
  return Math.ceil(value / (step * magnitude)) * step * magnitude;
}

function roundedTopRectPath(x: number, yTop: number, width: number, yBottom: number, r: number) {
  return `M${x},${yTop + r} Q${x},${yTop} ${x + r},${yTop} L${x + width - r},${yTop} Q${x + width},${yTop} ${x + width},${yTop + r} L${x + width},${yBottom} L${x},${yBottom} Z`;
}

export function BarChart({
  title,
  data,
  colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"],
}: {
  title: string;
  data: GameSlice[];
  colors?: string[];
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  const bandWidth = plotW / data.length;
  const barWidth = Math.min(BAR_MAX_WIDTH, bandWidth * 0.5);
  const baselineY = PAD.top + plotH;

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
        {title}
      </h3>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`${title} bar chart`}
      >
        {ticks.map((t) => {
          const y = PAD.top + plotH - (t / max) * plotH;
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={y}
                y2={y}
                stroke="var(--chart-grid)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted"
                fontSize={10}
              >
                {t.toLocaleString("en-US")}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const bandX = PAD.left + i * bandWidth;
          const barX = bandX + (bandWidth - barWidth) / 2;
          const barTopY = PAD.top + plotH - (d.value / max) * plotH;
          const isHovered = hoverIndex === i;

          return (
            <g key={d.label}>
              <path
                d={roundedTopRectPath(barX, barTopY, barWidth, baselineY, RADIUS)}
                fill={colors[i % colors.length]}
                opacity={isHovered ? 0.85 : 1}
                onPointerEnter={() => setHoverIndex(i)}
                onPointerLeave={() => setHoverIndex(null)}
                style={{ cursor: "pointer" }}
              />
              <text
                x={barX + barWidth / 2}
                y={barTopY - 8}
                textAnchor="middle"
                className="fill-foreground"
                fontSize={12}
                fontWeight={600}
              >
                {d.value.toLocaleString("en-US")}
              </text>
              <text
                x={bandX + bandWidth / 2}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-muted"
                fontSize={11}
              >
                {d.label}
              </text>

              {isHovered && (
                <g>
                  <rect
                    x={barX + barWidth / 2 - 46}
                    y={barTopY - 42}
                    width={92}
                    height={26}
                    rx={4}
                    fill="var(--surface)"
                    stroke="var(--border-color)"
                  />
                  <text
                    x={barX + barWidth / 2}
                    y={barTopY - 27}
                    textAnchor="middle"
                    className="fill-foreground"
                    fontSize={11}
                    fontWeight={600}
                  >
                    {d.label}: {d.value.toLocaleString("en-US")}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: colors[i % colors.length] }}
            />
            {d.label}
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Game</th>
            <th>Registrations</th>
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
