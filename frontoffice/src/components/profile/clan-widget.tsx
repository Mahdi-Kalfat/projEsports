import Image from "next/image";
import Link from "next/link";
import { Shield } from "lucide-react";

export type ClanWidgetData = {
  id: string;
  name: string;
  tag: string;
  logoUrl: string | null;
  role: string;
} | null;

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export function ClanWidget({ clan, isSelf }: { clan: ClanWidgetData; isSelf: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-primary" />
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">Clan</h3>
      </div>

      {clan ? (
        <Link
          href={`/clans/${clan.id}`}
          className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition hover:border-primary/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/15 font-display text-xs font-bold text-primary">
            {clan.logoUrl ? (
              <Image src={clan.logoUrl} alt="" width={40} height={40} unoptimized className="object-contain" />
            ) : (
              clan.tag.slice(0, 2)
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              [{clan.tag}] {clan.name}
            </p>
            <p className="text-xs text-muted">{ROLE_LABEL[clan.role] ?? clan.role}</p>
          </div>
        </Link>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-muted">{isSelf ? "You're not in a clan yet." : "Not in a clan."}</p>
          {isSelf && (
            <Link href="/clans" className="mt-2 inline-block text-xs font-medium text-accent transition hover:text-foreground">
              Browse clans →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
