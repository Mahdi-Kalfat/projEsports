import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LuckyWheelSlotRow } from "@/components/lucky-wheel/lucky-wheel-slot-row";
import { AddLuckyWheelSlotForm } from "@/components/lucky-wheel/add-lucky-wheel-slot-form";

export const metadata: Metadata = {
  title: "Lucky Wheel — Back Office",
};

export default async function LuckyWheelPage() {
  const [slots, activeItems] = await Promise.all([
    prisma.luckyWheelSlot.findMany({ orderBy: { createdAt: "asc" }, include: { item: true } }),
    prisma.item.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  const slottedItemIds = new Set(slots.map((slot) => slot.itemId));
  const availableItems = activeItems.filter((item) => !slottedItemIds.has(item.id));
  const totalWeight = slots.reduce((sum, slot) => sum + slot.weight, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-foreground">Wheel slices</h3>
          <span className={`text-xs font-medium ${totalWeight === 100 ? "text-success" : "text-warning"}`}>
            {totalWeight}% total
            {totalWeight !== 100 && " — should add up to 100%"}
          </span>
        </div>

        {slots.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            No slices yet — add the first one below.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {slots.map((slot) => (
              <LuckyWheelSlotRow
                key={slot.id}
                slot={{
                  id: slot.id,
                  weight: slot.weight,
                  item: {
                    id: slot.item.id,
                    name: slot.item.name,
                    effectType: slot.item.effectType,
                    effectValue: slot.item.effectValue,
                  },
                }}
              />
            ))}
          </div>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <AddLuckyWheelSlotForm items={availableItems.map((item) => ({ id: item.id, name: item.name }))} />
        </div>
      </div>
    </div>
  );
}
