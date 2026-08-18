"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Coins, Dices } from "lucide-react";
import { spinWheel } from "@/app/(app)/rewards/actions";
import { getItemEffectIcon } from "@/lib/item-effects";
import { MAX_SPINS_PER_DAY } from "@/lib/lucky-wheel";
import { Confetti } from "@/components/ui/confetti";

export type WheelSlotData = {
  id: string;
  weight: number;
  item: { id: string; name: string; effectType: string; effectValue: number; imageUrl: string | null };
};

// On-brand alternation, not a rainbow — the site's own primary/crimson red
// scale (see globals.css), enough to tell adjacent slices apart without
// introducing hues that don't belong to the palette anywhere else.
const SLICE_GRADIENTS = ["url(#sliceGradA)", "url(#sliceGradB)"];

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 130;

// Angles are "degrees clockwise from the top" (where the fixed pointer sits),
// not the standard "degrees from 3 o'clock" SVG/math convention — this
// helper does the conversion once so every other calculation below can stay
// in the more intuitive "from the top" frame.
// Math.cos/Math.sin aren't guaranteed bit-identical across JS engines, so
// server (Node) and client (browser) can disagree in the last bit and break
// hydration on these coordinates — rounding collapses that noise away.
function pointOnCircle(cx: number, cy: number, r: number, angleFromTopDeg: number) {
  const rad = ((angleFromTopDeg - 90) * Math.PI) / 180;
  return {
    x: Math.round((cx + r * Math.cos(rad)) * 1000) / 1000,
    y: Math.round((cy + r * Math.sin(rad)) * 1000) / 1000,
  };
}

// The wheel always shows exactly 10 equal slices, regardless of how many
// slots are actually configured or how their weight/percentage compares —
// fewer than 10 configured items round-robin to fill the rest (e.g. 3 items
// -> 4/3/3 across the 10 slices), 10+ just fills all 10 in order. Each
// display slice remembers which raw `slots` index it came from (sourceIndex)
// so handleSpin can find a slice to land on for whichever item the server
// actually picked — spinWheel/pickWeightedSlotIndex still choose the real
// winner by weight; this is purely how the wheel is drawn.
const DISPLAY_SLOT_COUNT = 10;

function buildDisplaySlots(slots: WheelSlotData[]) {
  if (slots.length === 0) return [];
  return Array.from({ length: DISPLAY_SLOT_COUNT }, (_, i) => {
    const sourceIndex = i % slots.length;
    return { ...slots[sourceIndex], sourceIndex, displayId: `${slots[sourceIndex].id}-${i}` };
  });
}

// 10 slices at 36° each leaves no room for a straight text label without it
// running into neighboring slices (a name like "500 CC Voucher" is far wider
// than the arc it'd have to fit in) — so slices show only the item's image.
const SLICE_IMAGE_SIZE = 28;

function buildSlices(displaySlots: ReturnType<typeof buildDisplaySlots>) {
  const angle = displaySlots.length > 0 ? 360 / displaySlots.length : 0;

  return displaySlots.map((slot, i) => {
    const start = i * angle;
    const end = start + angle;
    const mid = (start + end) / 2;
    const p1 = pointOnCircle(CENTER, CENTER, RADIUS, start);
    const p2 = pointOnCircle(CENTER, CENTER, RADIUS, end);
    const largeArc = angle > 180 ? 1 : 0;
    const path = `M ${CENTER},${CENTER} L ${p1.x},${p1.y} A ${RADIUS},${RADIUS} 0 ${largeArc} 1 ${p2.x},${p2.y} Z`;
    const imagePos = pointOnCircle(CENTER, CENTER, RADIUS * 0.74, mid);
    return {
      ...slot,
      mid,
      path,
      imagePos,
      imageSize: SLICE_IMAGE_SIZE,
      gradient: SLICE_GRADIENTS[i % SLICE_GRADIENTS.length],
    };
  });
}

const SPIN_DURATION_MS = 4200;

// Red is the "free spin" color; once that first spin is used up the wheel
// itself becomes the tell that further spins cost real currency, animated
// via a stop-color transition on the same gradient defs rather than
// swapping which gradient a slice points at (a url() reference can't
// transition — the colors inside it can). Built from the site's existing
// yellow-400/amber "gold" tier used for badges (see lib/badges.ts) rather
// than an invented hue.
const RED_SLICE_STOPS = [
  { from: "var(--primary-glow)", to: "var(--primary)" },
  { from: "var(--crimson)", to: "#6e0016" },
];
const GOLD_SLICE_STOPS = [
  { from: "#fde047", to: "#eab308" },
  { from: "#d97706", to: "#92400e" },
];
const RED_HUB_STOPS = { from: "var(--primary-glow)", to: "var(--crimson)" };
const GOLD_HUB_STOPS = { from: "#fde047", to: "#a16207" };
const RED_RIM = "var(--crimson)";
const GOLD_RIM = "#d97706";
const COLOR_TRANSITION = "stop-color 900ms ease, stroke 900ms ease";

function SpinConfirmModal({
  cost,
  ccCoins,
  onConfirm,
  onCancel,
}: {
  cost: number;
  ccCoins: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const canAfford = ccCoins >= cost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Cancel" onClick={onCancel} className="fixed inset-0 bg-black/70" />

      <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface-raised p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/15">
          <Coins size={22} className="text-yellow-400" />
        </div>
        <h3 className="mt-3 font-display text-base font-bold text-foreground">This spin isn&apos;t free</h3>
        <p className="mt-1 text-sm text-muted">
          It costs <span className="font-semibold text-yellow-400">{cost.toLocaleString("en-US")} cc</span>. You
          have {ccCoins.toLocaleString("en-US")} cc.
        </p>
        {!canAfford && <p className="mt-2 text-xs text-primary-glow">Not enough cc for this spin.</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-md border border-border py-2 text-sm font-medium text-foreground transition hover:border-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canAfford}
            className="btn-neon flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
          >
            Spin for {cost} cc
          </button>
        </div>
      </div>
    </div>
  );
}

export function LuckyWheel({
  slots,
  canSpin,
  nextSpinAtLabel,
  spinsUsedToday,
  nextSpinCost,
  ccCoins,
  isGuest = false,
}: {
  slots: WheelSlotData[];
  canSpin: boolean;
  nextSpinAtLabel: string | null;
  spinsUsedToday: number;
  nextSpinCost: number;
  ccCoins: number;
  isGuest?: boolean;
}) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confettiBurst, setConfettiBurst] = useState(0);
  // Only the very first spin of the day is ever free, so once *any* spin has
  // completed the wheel is permanently in "paid" territory until the daily
  // reset — the initial value covers a page reload after the free spin was
  // already used earlier in the day.
  const [goldMode, setGoldMode] = useState(spinsUsedToday >= 1);

  const slices = useMemo(() => buildSlices(buildDisplaySlots(slots)), [slots]);

  // Called directly from the button's click handler (not a useActionState
  // form + effect) so landing the wheel on the winning slice is a normal
  // event-driven side effect, not state-syncing inside a render effect.
  function handleSpin() {
    startTransition(async () => {
      const res = await spinWheel({}, new FormData());
      if (!res.success || res.slotIndex === undefined) {
        setError(res.error ?? "Something went wrong — try again.");
        return;
      }
      // The won item may appear on several of the 10 displayed slices (see
      // buildDisplaySlots) — pick one of its on-wheel spots at random so the
      // animation doesn't always land in the same place for the same prize.
      const matches = slices.filter((s) => s.sourceIndex === res.slotIndex);
      const won = matches[Math.floor(Math.random() * matches.length)];
      if (!won) return;

      setError(null);
      setResult(null);
      setSpinning(true);
      const extraSpins = 5 + Math.floor(Math.random() * 3);
      setRotation((prev) => {
        const prevMod = ((prev % 360) + 360) % 360;
        const target = prev - prevMod + extraSpins * 360 - won.mid;
        return target > prev ? target : target + 360;
      });

      setTimeout(() => {
        setSpinning(false);
        setResult(res.wonItemName ?? won.item.name);
        setGoldMode(true);
        setConfettiBurst((b) => b + 1);
      }, SPIN_DURATION_MS);
    });
  }

  // Free spins go straight to spinning; anything with a cc cost stops for an
  // explicit "this isn't free" confirmation first.
  function handleSpinClick() {
    if (nextSpinCost > 0) {
      setConfirmOpen(true);
    } else {
      handleSpin();
    }
  }

  function handleConfirmSpin() {
    setConfirmOpen(false);
    handleSpin();
  }

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface-raised p-6">
      <Confetti burst={confettiBurst} />
      <div className="flex w-full items-center gap-2">
        <Dices size={18} className="text-primary" />
        <h2 className="font-display text-lg font-bold text-foreground">Lucky Wheel</h2>
      </div>
      <p className="-mt-4 w-full text-sm text-muted">
        Up to {MAX_SPINS_PER_DAY} spins a day — the first one&apos;s free!
      </p>

      {slices.length === 0 ? (
        <p className="text-sm text-muted">The wheel isn&apos;t set up yet — check back soon.</p>
      ) : (
        <>
          <div className="relative" style={{ width: SIZE, height: SIZE }}>
            <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2">
              <div className="h-0 w-0 border-x-10 border-t-16 border-x-transparent border-t-primary drop-shadow-[0_0_8px_rgba(255,30,60,0.8)]" />
              <div className="mx-auto -mt-1 h-2 w-2 rounded-full bg-primary-glow shadow-[0_0_6px_rgba(255,51,90,0.9)]" />
            </div>

            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)` : "none",
                filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.5))",
              }}
              className="rounded-full"
            >
              <defs>
                <linearGradient id="sliceGradA" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop
                    offset="0%"
                    stopColor={goldMode ? GOLD_SLICE_STOPS[0].from : RED_SLICE_STOPS[0].from}
                    stopOpacity={0.9}
                    style={{ transition: COLOR_TRANSITION }}
                  />
                  <stop
                    offset="100%"
                    stopColor={goldMode ? GOLD_SLICE_STOPS[0].to : RED_SLICE_STOPS[0].to}
                    stopOpacity={0.82}
                    style={{ transition: COLOR_TRANSITION }}
                  />
                </linearGradient>
                <linearGradient id="sliceGradB" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop
                    offset="0%"
                    stopColor={goldMode ? GOLD_SLICE_STOPS[1].from : RED_SLICE_STOPS[1].from}
                    stopOpacity={0.92}
                    style={{ transition: COLOR_TRANSITION }}
                  />
                  <stop
                    offset="100%"
                    stopColor={goldMode ? GOLD_SLICE_STOPS[1].to : RED_SLICE_STOPS[1].to}
                    stopOpacity={0.85}
                    style={{ transition: COLOR_TRANSITION }}
                  />
                </linearGradient>
                <radialGradient id="hubGrad" cx="35%" cy="30%" r="75%">
                  <stop
                    offset="0%"
                    stopColor={goldMode ? GOLD_HUB_STOPS.from : RED_HUB_STOPS.from}
                    style={{ transition: COLOR_TRANSITION }}
                  />
                  <stop
                    offset="100%"
                    stopColor={goldMode ? GOLD_HUB_STOPS.to : RED_HUB_STOPS.to}
                    style={{ transition: COLOR_TRANSITION }}
                  />
                </radialGradient>
              </defs>

              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS + 3}
                fill="none"
                stroke={goldMode ? GOLD_RIM : RED_RIM}
                strokeWidth={3}
                style={{ transition: COLOR_TRANSITION }}
              />
              <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="var(--surface)" stroke="var(--border-color)" strokeWidth={1.5} />
              {slices.map((slice) => {
                // Always the effect-type icon, never the item's own artwork —
                // real images come in whatever aspect ratio the admin
                // uploaded (or the stock fallback happens to be), which made
                // slices look mismatched in size. A vector icon is identical
                // geometry at every slice regardless of item.
                const Icon = getItemEffectIcon(slice.item.effectType);
                return (
                  <g key={slice.displayId}>
                    <path d={slice.path} fill={slice.gradient} stroke="var(--surface-raised)" strokeWidth={1.5} />
                    {Icon && (
                      <Icon
                        x={slice.imagePos.x - slice.imageSize / 2}
                        y={slice.imagePos.y - slice.imageSize / 2}
                        width={slice.imageSize}
                        height={slice.imageSize}
                        transform={`rotate(${slice.mid}, ${slice.imagePos.x}, ${slice.imagePos.y})`}
                        color="#fff"
                        strokeWidth={1.75}
                        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
                      />
                    )}
                  </g>
                );
              })}

              <circle cx={CENTER} cy={CENTER} r={30} fill="url(#hubGrad)" stroke="var(--surface-raised)" strokeWidth={4} />
            </svg>

            {/* The center hub *is* the spin trigger — no separate button
                below. It sits outside the rotating <svg> (fixed overlay on
                top of that svg's own decorative hub circle), so the icon
                stays put while the wheel spins under it. Guests get the
                same circle, styled the same, but as a link to /login
                instead of a spin trigger — the wheel itself stays static. */}
            {isGuest ? (
              <Link
                href="/login"
                aria-label="Sign in to spin the wheel"
                title="Sign in to spin the wheel"
                className="btn-neon absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ring-2 ring-white/15 transition hover:scale-105 active:scale-95"
              >
                <Dices size={20} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleSpinClick}
                disabled={!canSpin || isPending || spinning}
                aria-label={canSpin && nextSpinCost > 0 ? `Spin the wheel — costs ${nextSpinCost} cc` : "Spin the wheel"}
                title={canSpin && nextSpinCost > 0 ? `Spin the wheel — costs ${nextSpinCost} cc` : "Spin the wheel"}
                className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ring-2 ring-white/15 transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                <Dices
                  size={20}
                  className={`text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] ${
                    isPending || spinning ? "animate-spin" : ""
                  }`}
                />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            {isGuest ? (
              <p className="text-xs text-muted">Sign in to spin — first spin&apos;s free.</p>
            ) : isPending || spinning ? (
              <p className="text-xs text-muted">Spinning…</p>
            ) : canSpin && !error ? (
              <>
                <p className="text-xs text-muted">
                  Spin {spinsUsedToday + 1} of {MAX_SPINS_PER_DAY} —{" "}
                  {nextSpinCost === 0 ? (
                    "free"
                  ) : (
                    <span className="font-medium text-yellow-400">
                      {nextSpinCost.toLocaleString("en-US")} cc
                    </span>
                  )}
                </p>
                {nextSpinCost > ccCoins && (
                  <p className="text-xs text-primary-glow">
                    You have {ccCoins.toLocaleString("en-US")} cc — not enough for this spin.
                  </p>
                )}
              </>
            ) : null}
            {!isGuest && error && <p className="text-xs text-primary-glow">{error}</p>}
            {!isGuest && !canSpin && !error && !spinning && (
              <p className="text-xs text-muted">
                {nextSpinAtLabel
                  ? `Come back after ${nextSpinAtLabel} for another spin.`
                  : "Come back tomorrow for another spin."}
              </p>
            )}
          </div>

          {result && (
            <p className="rounded-md bg-success/15 px-4 py-2 text-sm font-medium text-success">
              🎉 You won: {result}!
            </p>
          )}

          {confirmOpen && (
            <SpinConfirmModal
              cost={nextSpinCost}
              ccCoins={ccCoins}
              onConfirm={handleConfirmSpin}
              onCancel={() => setConfirmOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
