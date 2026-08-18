"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

const COLORS = ["var(--primary)", "var(--primary-glow)", "var(--crimson)", "var(--accent)", "#fde047", "#eab308"];
const PARTICLE_COUNT = 140;
const DURATION_MS = 3200;

type Particle = {
  id: number;
  left: number;
  color: string;
  width: number;
  height: number;
  duration: number;
  delay: number;
  drift: number;
  rotate: number;
};

function buildParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const size = 5 + Math.random() * 6;
    return {
      id: i,
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      width: size,
      height: size * (0.4 + Math.random() * 0.5),
      duration: 2.4 + Math.random() * 1.4,
      delay: Math.random() * 0.35,
      drift: (Math.random() - 0.5) * 220,
      rotate: 360 + Math.random() * 540,
    };
  });
}

// Rendered via a portal to document.body (not just `fixed inset-0` in place)
// because several ancestors in this tree are <Reveal> motion.divs — motion
// leaves a resting `transform` on those even at y:0, and any transformed
// ancestor becomes the containing block for fixed-position descendants,
// which would trap the confetti inside that card instead of the full page.
export function Confetti({ burst }: { burst: number }) {
  const [active, setActive] = useState(false);
  const particles = useMemo(() => buildParticles(), [burst]);

  useEffect(() => {
    if (burst === 0) return;
    setActive(true);
    const timer = setTimeout(() => setActive(false), DURATION_MS);
    return () => clearTimeout(timer);
  }, [burst]);

  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-8vh] rounded-[1px]"
          style={
            {
              left: `${p.left}vw`,
              width: p.width,
              height: p.height,
              backgroundColor: p.color,
              animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
              "--confetti-drift": `${p.drift}px`,
              "--confetti-rotate": `${p.rotate}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  );
}
