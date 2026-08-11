import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock, Package } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getInventory, canViewInventory } from "@/lib/inventory";
import { InventoryItemCard } from "@/components/inventory/inventory-item-card";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";

export async function generateMetadata(props: PageProps<"/inventory/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  return { title: `${username}'s Inventory — Esports Tournament Platform` };
}

export default async function InventoryPage(props: PageProps<"/inventory/[username]">) {
  const { username } = await props.params;
  const session = await auth();
  const viewerId = session!.user.id;

  const profile = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, inventoryPublic: true },
  });
  if (!profile) notFound();

  const isSelf = profile.id === viewerId;
  const canView = canViewInventory(isSelf, profile.inventoryPublic);
  const items = canView ? await getInventory(profile.id) : [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Collection"
        title={isSelf ? "My" : `${profile.username}'s`}
        accentWord="Inventory"
        subtitle={
          canView
            ? "Avatars, badges, boosts, and other items this player has picked up."
            : "This player has chosen to keep their inventory private."
        }
      />

      {!canView ? (
        <Reveal>
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised text-center text-sm text-muted">
            <Lock size={28} className="text-muted/50" />
            This inventory is private.
          </div>
        </Reveal>
      ) : items.length === 0 ? (
        <Reveal>
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised text-center text-sm text-muted">
            <Package size={28} className="text-muted/50" />
            {isSelf ? "You don't own any items yet." : `${profile.username} doesn't own any items yet.`}
          </div>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((entry, i) => (
            <Reveal key={entry.id} delay={Math.min(i * 0.05, 0.3)}>
              <InventoryItemCard item={entry} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
