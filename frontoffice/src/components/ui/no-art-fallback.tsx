import Image from "next/image";
import { Gamepad2 } from "lucide-react";
import { getGameIdentity } from "@/lib/game-identity";

// Design plan §17: most tournaments/events/listings have no uploaded art yet,
// and a flat gradient box reads as broken, not as "no art yet." This fills
// that gap with the game's own accent color and logo instead of more empty
// space — an angular diagonal-stripe texture plus the game's mark, large and
// centered, so "no custom banner" still looks like a deliberate card face.
export function NoArtFallback({ gameName }: { gameName: string | null | undefined }) {
  const identity = getGameIdentity(gameName);

  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${identity.accent}26, var(--surface-raised) 65%)` }}
    >
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `repeating-linear-gradient(115deg, ${identity.accent} 0px, ${identity.accent} 2px, transparent 2px, transparent 34px)`,
        }}
      />
      {identity.logo ? (
        <Image src={identity.logo} alt="" width={68} height={68} unoptimized className="relative object-contain opacity-30" />
      ) : (
        <Gamepad2 size={52} className="relative opacity-25" style={{ color: identity.accent }} />
      )}
    </div>
  );
}
