import Image from "next/image";
import { Trophy } from "lucide-react";
import {
  bracketSize,
  buildBracketRounds,
  computeBracketLayout,
  pickBracketDimensions,
  WINNER_MARKER_WIDTH,
  type BracketTeam,
} from "@/lib/bracket";

export type BracketRegistration = {
  id: string;
  teamName: string;
  teamTag: string;
  teamLogoUrl: string | null;
  bracketSlot: number | null;
};

function TeamSlot({ team, height }: { team: BracketTeam | null; height: number }) {
  return (
    <div
      style={{ height }}
      className={`flex items-center gap-1.5 border-b px-2 first:rounded-t-md last:rounded-b-md last:border-b-0 ${
        team ? "border-border/60 bg-surface" : "border-dashed border-border/40 bg-surface/40"
      }`}
    >
      {team ? (
        <>
          <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-[7px] font-semibold text-primary">
            {team.logoUrl ? (
              <Image src={team.logoUrl} alt="" width={16} height={16} unoptimized className="object-contain" />
            ) : (
              team.tag.slice(0, 2)
            )}
          </span>
          <span className="truncate text-xs font-medium text-foreground">{team.name}</span>
        </>
      ) : (
        <span className="text-[11px] text-muted/70">TBD</span>
      )}
    </div>
  );
}

// Standard bracket-round names where they apply, falling back to a plain
// ordinal for anything bigger than a quarterfinal-sized bracket.
function roundLabel(roundIndex: number, roundCount: number): string {
  const fromEnd = roundCount - 1 - roundIndex;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinals";
  if (fromEnd === 2) return "Quarterfinals";
  return `Round ${roundIndex + 1}`;
}

const HEADER_H = 20;
const THIRD_PLACE_GAP = 32;
const THIRD_PLACE_LABEL_H = 16;

// Draws a single-elimination bracket sized to fit `capacity` (or, when
// unlimited, however many teams are currently registered) with each approved
// team placed at its randomly-assigned first-round slot (see
// TournamentRegistration.bracketSlot). Box/gap sizing shrinks automatically
// for larger brackets (see pickBracketDimensions) so it fits the card width
// without a horizontal scrollbar in the common case. Rounds after the first
// are drawn as empty TBD slots — there's no match-result/advancement system
// yet, so this only draws the shape and the random seeding, not who plays
// whom next.
export function TournamentBracket({
  registrations,
  capacity,
}: {
  registrations: BracketRegistration[];
  capacity: number | null;
}) {
  const size = bracketSize(capacity ?? registrations.length);

  const slots: (BracketTeam | null)[] = Array.from({ length: size }, () => null);
  for (const r of registrations) {
    if (r.bracketSlot !== null && r.bracketSlot < size && !slots[r.bracketSlot]) {
      slots[r.bracketSlot] = { id: r.id, name: r.teamName, tag: r.teamTag, logoUrl: r.teamLogoUrl };
    }
  }

  const rounds = buildBracketRounds(size, slots);
  const dims = pickBracketDimensions(rounds.length);
  const layout = computeBracketLayout(rounds, dims);
  const lastRound = rounds.length - 1;
  const finalBox = layout.matches.find((m) => m.match.round === lastRound);
  const roundXs = rounds.map((_, r) => layout.matches.find((m) => m.match.round === r)!.x);
  const lineLen = Math.min(28, WINNER_MARKER_WIDTH / 3);

  // Only meaningful once there's a semifinal round to draw its losers'
  // playoff from (size >= 4) — drawn as its own standalone box below the
  // main bracket rather than wired to the semifinal, since there's no
  // match-result tracking to actually route a loser into it yet.
  const showThirdPlace = rounds.length >= 2 && !!finalBox;
  const thirdPlaceY = layout.totalHeight + THIRD_PLACE_GAP + THIRD_PLACE_LABEL_H;
  const contentHeight = showThirdPlace ? thirdPlaceY + layout.matchHeight : layout.totalHeight;

  return (
    <div className="overflow-x-auto">
      <div
        className="relative mx-auto"
        style={{ width: layout.totalWidth + WINNER_MARKER_WIDTH, height: contentHeight + HEADER_H }}
      >
        {roundXs.map((x, r) => (
          <div
            key={r}
            className="absolute top-0 text-center text-[10px] font-semibold uppercase tracking-wide text-muted"
            style={{ left: x, width: layout.slotWidth }}
          >
            {roundLabel(r, rounds.length)}
          </div>
        ))}

        <svg
          className="absolute overflow-visible"
          style={{ top: HEADER_H }}
          width={layout.totalWidth}
          height={layout.totalHeight}
        >
          {layout.lines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="currentColor"
              strokeWidth={1.5}
              className="text-border"
            />
          ))}
          {finalBox && (
            <line
              x1={finalBox.x + layout.slotWidth}
              y1={finalBox.y + layout.matchHeight / 2}
              x2={finalBox.x + layout.slotWidth + lineLen}
              y2={finalBox.y + layout.matchHeight / 2}
              stroke="currentColor"
              strokeWidth={1.5}
              className="text-border"
            />
          )}
        </svg>

        {layout.matches.map(({ match, x, y }) => {
          const hasTeam = !!match.top || !!match.bottom;
          return (
            <div
              key={`${match.round}-${match.index}`}
              className={`absolute overflow-hidden rounded-md border ${
                hasTeam ? "border-primary/30" : "border-border"
              }`}
              style={{ left: x, top: y + HEADER_H, width: layout.slotWidth, height: layout.matchHeight }}
            >
              <TeamSlot team={match.top} height={layout.matchHeight / 2} />
              <TeamSlot team={match.bottom} height={layout.matchHeight / 2} />
            </div>
          );
        })}

        {finalBox && (
          <div
            className="absolute flex flex-col items-center gap-0.5 text-accent"
            style={{
              left: finalBox.x + layout.slotWidth + lineLen,
              width: WINNER_MARKER_WIDTH - lineLen,
              top: finalBox.y + HEADER_H + layout.matchHeight / 2 - 14,
            }}
          >
            <Trophy size={22} />
            <span className="text-[9px] font-semibold uppercase tracking-wide">Winner</span>
          </div>
        )}

        {showThirdPlace && finalBox && (
          <>
            <div
              className="absolute text-center text-[10px] font-semibold uppercase tracking-wide text-muted"
              style={{ left: finalBox.x, width: layout.slotWidth, top: layout.totalHeight + HEADER_H + THIRD_PLACE_GAP }}
            >
              3rd Place
            </div>
            <div
              className="absolute overflow-hidden rounded-md border border-border"
              style={{
                left: finalBox.x,
                top: thirdPlaceY + HEADER_H,
                width: layout.slotWidth,
                height: layout.matchHeight,
              }}
            >
              <TeamSlot team={null} height={layout.matchHeight / 2} />
              <TeamSlot team={null} height={layout.matchHeight / 2} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
