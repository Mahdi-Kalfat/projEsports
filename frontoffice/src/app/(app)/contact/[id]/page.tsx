import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedContactRequest, getContactMessages } from "@/lib/contact";
import { CONTACT_TYPE_LABELS } from "@/lib/contact-types";
import { ContactThread } from "@/components/contact/contact-thread";
import { BackLink } from "@/components/ui/back-link";

export async function generateMetadata(props: PageProps<"/contact/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const session = await auth();
  const report = session?.user?.id ? await getOwnedContactRequest(id, session.user.id) : null;
  return { title: report ? `${report.subject} — Contact` : "Contact" };
}

export default async function ContactDetailPage(props: PageProps<"/contact/[id]">) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const report = await getOwnedContactRequest(id, userId);
  if (!report) notFound();

  const messages = await getContactMessages(id);

  // Only worth walking the buyer through attaching proof when there's
  // actually a real-money payment to prove — and only until they've sent one
  // (see ContactThread, which also self-hides once a reply carries an image).
  let showProofTutorial = false;
  if (report.status === "OPEN" && report.shopItemId) {
    const alreadySentProof = messages.some((m) => !m.isAdmin && m.imageUrl);
    if (!alreadySentProof) {
      const shopItem = await prisma.shopItem.findUnique({
        where: { id: report.shopItemId },
        select: { priceType: true },
      });
      showProofTutorial = shopItem?.priceType === "MONEY";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/contact" label="All tickets" />

      <div>
        <h1 className="font-display text-lg font-bold text-foreground">{report.subject}</h1>
        <p className="text-xs text-muted">
          {CONTACT_TYPE_LABELS[report.type]} · {report.status === "OPEN" ? "Open" : "Closed"}
        </p>
      </div>

      <ContactThread
        reportId={report.id}
        status={report.status}
        initialMessages={messages}
        showProofTutorial={showProofTutorial}
      />
    </div>
  );
}
