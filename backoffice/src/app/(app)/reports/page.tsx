import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CONTACT_TYPE_LABELS } from "@/lib/contact-types";
import type { ContactStatus } from "@/generated/prisma";

export const metadata: Metadata = {
  title: "Reports — Back Office",
};

const STATUS_FILTERS: { label: string; value: ContactStatus | "ALL" }[] = [
  { label: "Open", value: "OPEN" },
  { label: "Closed", value: "CLOSED" },
  { label: "All", value: "ALL" },
];

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function ReportsPage(props: PageProps<"/reports">) {
  const searchParams = await props.searchParams;
  const statusParam = typeof searchParams.status === "string" ? searchParams.status : "OPEN";
  const status = STATUS_FILTERS.some((f) => f.value === statusParam) ? (statusParam as ContactStatus | "ALL") : "OPEN";

  const reports = await prisma.contactRequest.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { username: true, avatarUrl: true } } },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/reports?status=${f.value}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              status === f.value
                ? "bg-primary text-white"
                : "border border-border text-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface-raised">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-border/60 last:border-0 hover:bg-surface">
                <td className="px-4 py-3">
                  <Link href={`/reports/${report.id}`} className="font-medium text-foreground hover:text-primary">
                    {report.user.username}
                  </Link>
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-foreground">
                  <Link href={`/reports/${report.id}`} className="hover:text-primary">
                    {report.subject}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{CONTACT_TYPE_LABELS[report.type]}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      report.status === "OPEN" ? "bg-success/15 text-success" : "bg-muted/15 text-muted"
                    }`}
                  >
                    {report.status === "OPEN" ? "Open" : "Closed"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{formatDateTime(report.updatedAt)}</td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No reports found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
