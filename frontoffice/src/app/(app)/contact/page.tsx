import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getContactRequests } from "@/lib/contact";
import { CONTACT_TYPE_LABELS } from "@/lib/contact-types";
import { NewContactForm } from "@/components/contact/new-contact-form";

export const metadata: Metadata = {
  title: "Contact — Clutcher",
};

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function ContactPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const reports = await getContactRequests(userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Contact an admin</h1>
        <p className="mt-1 text-sm text-muted">
          Open a ticket for deposits, account issues, or anything else — an admin will reply here.
        </p>
      </div>

      <NewContactForm />

      <div className="flex flex-col gap-2">
        {reports.length === 0 ? (
          <p className="text-sm text-muted">You haven&apos;t contacted an admin yet.</p>
        ) : (
          reports.map((r) => (
            <Link
              key={r.id}
              href={`/contact/${r.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3 transition hover:border-primary"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{r.subject}</p>
                <p className="text-xs text-muted">
                  {CONTACT_TYPE_LABELS[r.type]} · {formatDateTime(r.updatedAt)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  r.status === "OPEN" ? "bg-success/15 text-success" : "bg-muted/15 text-muted"
                }`}
              >
                {r.status === "OPEN" ? "Open" : "Closed"}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
