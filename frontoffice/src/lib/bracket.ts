// Single-elimination bracket sizing/layout for TEAM tournaments — see
// TournamentRegistration.bracketSlot (schema) for where a team's first-round
// position is assigned (backoffice's approveTournamentRegistration).

// Smallest power of two that fits `teamCount` slots (minimum 2, so a single
// registered team still draws a bracket with one bye slot instead of nothing).
export function bracketSize(teamCount: number): number {
  const n = Math.max(teamCount, 2);
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

export type BracketTeam = {
  id: string;
  name: string;
  tag: string;
  logoUrl: string | null;
};

export type BracketMatch = {
  round: number;
  index: number;
  top: BracketTeam | null;
  bottom: BracketTeam | null;
};

// Round 0 is seeded from `slots` (index = bracketSlot); every later round is
// left empty (TBD) since there's no match-result/advancement system yet —
// this only draws the bracket shape and the random first-round placement.
export function buildBracketRounds(size: number, slots: (BracketTeam | null)[]): BracketMatch[][] {
  const roundCount = Math.log2(size);
  const rounds: BracketMatch[][] = [];

  const firstRound: BracketMatch[] = [];
  for (let i = 0; i < size / 2; i++) {
    firstRound.push({ round: 0, index: i, top: slots[i * 2] ?? null, bottom: slots[i * 2 + 1] ?? null });
  }
  rounds.push(firstRound);

  for (let r = 1; r < roundCount; r++) {
    const matchCount = size / Math.pow(2, r + 1);
    const round: BracketMatch[] = [];
    for (let i = 0; i < matchCount; i++) {
      round.push({ round: r, index: i, top: null, bottom: null });
    }
    rounds.push(round);
  }

  return rounds;
}

export type BracketDimensions = {
  slotWidth: number;
  matchHeight: number;
  round1Gap: number;
  roundGapX: number;
};

const DEFAULT_DIMENSIONS: BracketDimensions = { slotWidth: 176, matchHeight: 56, round1Gap: 16, roundGapX: 48 };
const MIN_SLOT_WIDTH = 108;
const MIN_MATCH_HEIGHT = 40;

// How much horizontal room the "Winner" trophy marker needs past the final
// match — kept in sync with the fixed offset TournamentBracket renders it at.
export const WINNER_MARKER_WIDTH = 84;

// The page's content column tops out around this width (see (app)/layout.tsx's
// max-w-6xl) — brackets with more rounds shrink their box/gap sizes to fit
// inside it instead of overflowing into a horizontal scrollbar.
const MAX_TOTAL_WIDTH = 1000;

export function pickBracketDimensions(roundCount: number): BracketDimensions {
  const { slotWidth, matchHeight, round1Gap, roundGapX } = DEFAULT_DIMENSIONS;
  const naturalWidth = roundCount * slotWidth + (roundCount - 1) * roundGapX + WINNER_MARKER_WIDTH;
  if (naturalWidth <= MAX_TOTAL_WIDTH) return DEFAULT_DIMENSIONS;

  const gapRatio = roundGapX / slotWidth;
  const denom = roundCount + (roundCount - 1) * gapRatio;
  const scaledSlotWidth = Math.max(MIN_SLOT_WIDTH, Math.floor((MAX_TOTAL_WIDTH - WINNER_MARKER_WIDTH) / denom));
  const scale = scaledSlotWidth / slotWidth;

  return {
    slotWidth: scaledSlotWidth,
    matchHeight: Math.max(MIN_MATCH_HEIGHT, Math.round(matchHeight * scale)),
    round1Gap: Math.max(8, Math.round(round1Gap * scale)),
    roundGapX: Math.max(24, Math.round(roundGapX * scale)),
  };
}

export type BracketLine = { x1: number; y1: number; x2: number; y2: number };
export type BracketMatchBox = { match: BracketMatch; x: number; y: number };

export type BracketLayout = {
  totalWidth: number;
  totalHeight: number;
  matches: BracketMatchBox[];
  lines: BracketLine[];
  slotWidth: number;
  matchHeight: number;
};

// Positions every match box and connector line segment in plain px
// coordinates so the component can render them without any client-side
// layout math (or JS at all — this runs server-side). Round r+1's matches
// are defined as the vertical midpoint of their two round-r parents, which
// is what makes the connector lines meet up exactly with no manual tuning.
export function computeBracketLayout(rounds: BracketMatch[][], dims: BracketDimensions = DEFAULT_DIMENSIONS): BracketLayout {
  const { slotWidth, matchHeight, round1Gap, roundGapX } = dims;
  const n1 = rounds[0].length;
  const round1Unit = matchHeight + round1Gap;

  const roundYCenters: number[][] = [rounds[0].map((_, i) => i * round1Unit + matchHeight / 2)];
  for (let r = 1; r < rounds.length; r++) {
    const prev = roundYCenters[r - 1];
    roundYCenters.push(rounds[r].map((_, i) => (prev[i * 2] + prev[i * 2 + 1]) / 2));
  }

  const totalHeight = (n1 - 1) * round1Unit + matchHeight;
  const totalWidth = rounds.length * slotWidth + (rounds.length - 1) * roundGapX;

  const matches: BracketMatchBox[] = rounds.flatMap((round, r) =>
    round.map((match, i) => ({
      match,
      x: r * (slotWidth + roundGapX),
      y: roundYCenters[r][i] - matchHeight / 2,
    })),
  );

  const lines: BracketLine[] = [];
  for (let r = 0; r < rounds.length - 1; r++) {
    const ys = roundYCenters[r];
    const xRight = r * (slotWidth + roundGapX) + slotWidth;
    const xMid = xRight + roundGapX / 2;
    const xNext = (r + 1) * (slotWidth + roundGapX);

    for (let i = 0; i < ys.length; i++) {
      lines.push({ x1: xRight, y1: ys[i], x2: xMid, y2: ys[i] });
    }
    for (let i = 0; i < ys.length; i += 2) {
      lines.push({ x1: xMid, y1: ys[i], x2: xMid, y2: ys[i + 1] });
      const yMid = (ys[i] + ys[i + 1]) / 2;
      lines.push({ x1: xMid, y1: yMid, x2: xNext, y2: yMid });
    }
  }

  return { totalWidth, totalHeight, matches, lines, slotWidth, matchHeight };
}
