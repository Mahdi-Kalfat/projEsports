import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PaymentMethodRow } from "@/components/payment-methods/payment-method-row";
import { AddPaymentMethodForm } from "@/components/payment-methods/add-payment-method-form";

export const metadata: Metadata = {
  title: "Payment methods — Back Office",
};

export default async function PaymentMethodsPage() {
  const methods = await prisma.paymentMethod.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Wallet size={22} />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Payment methods</h2>
          <p className="max-w-xl text-sm text-muted">
            Listed automatically in the message a player gets when they request to buy a real-money (DT) shop
            item, so they know where to send payment before you confirm receipt and approve.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-raised p-4">
        {methods.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            No payment methods yet — add one below so buyers know where to send payment.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {methods.map((method) => (
              <PaymentMethodRow key={method.id} id={method.id} name={method.name} details={method.details} />
            ))}
          </div>
        )}

        <div className="mt-3">
          <AddPaymentMethodForm />
        </div>
      </div>
    </div>
  );
}
