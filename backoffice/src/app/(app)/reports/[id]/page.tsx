import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CONTACT_TYPE_LABELS } from "@/lib/contact-types";
import {
  ReportChatLog,
  ReportReplyForm,
  ReportTypeSelect,
  ReportStatusButton,
  AddCcCoinsForm,
  ShopPurchasePanel,
} from "@/components/reports/report-panel";

export async function generateMetadata(props: PageProps<"/reports/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const report = await prisma.contactRequest.findUnique({ where: { id }, select: { subject: true } });
  return { title: report ? `${report.subject} — Reports` : "Report" };
}

export default async function ReportDetailPage(props: PageProps<"/reports/[id]">) {
  const { id } = await props.params;

  const report = await prisma.contactRequest.findUnique({
    where: { id },
    include: {
      user: { select: { username: true, ccCoins: true } },
      shopItem: { include: { grantsItem: { select: { name: true } } } },
      messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { username: true } } } },
    },
  });
  if (!report) notFound();

  const messages = report.messages.map((m) => ({
    id: m.id,
    body: m.body,
    imageUrl: m.imageUrl,
    isAdmin: m.isAdmin,
    authorUsername: m.author.username,
    createdAt: m.createdAt,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/reports"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted transition hover:text-primary"
      >
        <ArrowLeft size={14} />
        All reports
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-raised p-5">
          <div className="border-b border-border pb-3">
            <h1 className="font-display text-base font-bold text-foreground">{report.subject}</h1>
            <p className="text-xs text-muted">
              <Link href={`/users?userId=${report.userId}`} className="hover:text-primary">
                {report.user.username}
              </Link>
              {" · "}
              {CONTACT_TYPE_LABELS[report.type]}
              {" · "}
              {report.status === "OPEN" ? "Open" : "Closed"}
            </p>
          </div>

          <ReportChatLog messages={messages} />

          {report.status === "OPEN" ? (
            <ReportReplyForm reportId={report.id} />
          ) : (
            <p className="border-t border-border pt-3 text-center text-xs text-muted">
              This report is closed. Reopen it to keep replying.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">User balance</p>
            <p className="mt-1 font-display text-lg font-bold text-foreground">{report.user.ccCoins} cc</p>
          </div>

          {report.shopItem ? (
            report.status === "OPEN" ? (
              <ShopPurchasePanel
                reportId={report.id}
                shopItemTitle={report.shopItem.title}
                grantsItemName={report.shopItem.grantsItem?.name ?? null}
              />
            ) : (
              <div className="rounded-xl border border-border bg-surface-raised p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Shop purchase</p>
                <p className="mt-1 text-sm text-foreground">{report.shopItem.title}</p>
                <p className="mt-1 text-xs text-muted">Already decided.</p>
              </div>
            )
          ) : (
            <div className="rounded-xl border border-border bg-surface-raised p-4">
              <ReportTypeSelect reportId={report.id} type={report.type} />
              <div className="mt-3">
                <ReportStatusButton reportId={report.id} status={report.status} />
              </div>

              {report.type === "DEPOSIT_REQUEST" && report.status === "OPEN" && (
                <AddCcCoinsForm reportId={report.id} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
