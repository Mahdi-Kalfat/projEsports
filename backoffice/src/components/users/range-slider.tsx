"use client";

import { useState } from "react";

export function RangeSlider({
  label,
  name,
  min,
  max,
  defaultMin,
  defaultMax,
}: {
  label: string;
  name: string;
  min: number;
  max: number;
  defaultMin: number;
  defaultMax: number;
}) {
  const [minVal, setMinVal] = useState(defaultMin);
  const [maxVal, setMaxVal] = useState(defaultMax);

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        <span className="text-xs text-foreground">
          {minVal.toLocaleString("en-US")} – {maxVal.toLocaleString("en-US")}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="range"
          name={`${name}Min`}
          min={min}
          max={max}
          value={minVal}
          onChange={(event) => setMinVal(Math.min(Number(event.target.value), maxVal))}
          className="range-input w-full"
          aria-label={`${label} minimum`}
        />
        <input
          type="range"
          name={`${name}Max`}
          min={min}
          max={max}
          value={maxVal}
          onChange={(event) => setMaxVal(Math.max(Number(event.target.value), minVal))}
          className="range-input w-full"
          aria-label={`${label} maximum`}
        />
      </div>
    </div>
  );
}
