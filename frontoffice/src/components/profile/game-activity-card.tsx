import { Gamepad2 } from "lucide-react";
import { formatDuration } from "@/lib/format";

export type GameActivityEntry = { gameName: string; totalSeconds: number };

export function GameActivityCard({
  isSelf,
  currentGame,
  currentGameElapsedLabel,
  games,
}: {
  isSelf: boolean;
  currentGame: string | null;
  // Pre-formatted by the caller (e.g. "42m") rather than a raw Date — this
  // is a Server Component, and computing an elapsed time from Date.now() at
  // render time would make the render impure.
  currentGameElapsedLabel: string | null;
  games: GameActivityEntry[];
}) {
  const hasData = games.length > 0 || currentGame !== null;

  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <div className="flex items-center gap-2">
        <Gamepad2 size={16} className="text-primary" />
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">Game Activity</h3>
      </div>

      {currentGame && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2">
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-success" />
          <p className="min-w-0 truncate text-xs text-foreground">
            Playing <span className="font-semibold">{currentGame}</span>
            {currentGameElapsedLabel && <span className="text-muted"> — {currentGameElapsedLabel}</span>}
          </p>
        </div>
      )}

      {games.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {games.map((game) => (
            <li key={game.gameName} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-foreground">{game.gameName}</span>
              <span className="shrink-0 text-xs font-medium tabular-nums text-muted">{formatDuration(game.totalSeconds)}</span>
            </li>
          ))}
        </ul>
      ) : (
        !currentGame && (
          <p className="mt-3 text-sm text-muted">
            {isSelf
              ? "Link your Discord and run /trackactivity in our server to track your game activity here."
              : "No tracked activity yet."}
          </p>
        )
      )}

      {isSelf && hasData && (
        <p className="mt-3 text-[11px] text-muted">Run /trackactivity in Discord any time to turn tracking off.</p>
      )}
    </div>
  );
}
