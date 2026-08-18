"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { linkifyText } from "@/lib/linkify";
import {
  replyToReport,
  setReportType,
  closeReport,
  reopenReport,
  addCcCoins,
  approveShopPurchase,
  rejectShopPurchase,
  type ReplyActionState,
  type DepositActionState,
  type ShopPurchaseActionState,
} from "@/app/(app)/reports/actions";
import { CONTACT_TYPES, CONTACT_TYPE_LABELS } from "@/lib/contact-types";
import type { ContactType } from "@/generated/prisma";

export type ReportMessage = {
  id: string;
  body: string;
  imageUrl: string | null;
  isAdmin: boolean;
  authorUsername: string;
  createdAt: Date;
};

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function ReportChatLog({ messages }: { messages: ReportMessage[] }) {
  return (
    <ul className="flex min-h-[30vh] flex-col gap-2">
      {messages.length === 0 && <p className="text-sm text-muted">No messages yet.</p>}
      {messages.map((m) => (
        <li key={m.id} className={`flex ${m.isAdmin ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[75%] rounded-md px-3 py-2 text-sm ${
              m.isAdmin ? "bg-primary text-white" : "bg-surface text-foreground"
            }`}
          >
            {m.body && <p className="whitespace-pre-wrap">{linkifyText(m.body)}</p>}
            {m.imageUrl && (
              <a
                href={m.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative mt-1.5 block h-48 w-48 overflow-hidden rounded-md bg-black/20"
              >
                <Image src={m.imageUrl} alt="Attached proof" fill unoptimized className="object-contain" />
              </a>
            )}
            <p className={`mt-1 text-[10px] ${m.isAdmin ? "text-white/70" : "text-muted"}`}>
              {m.isAdmin ? "Admin" : m.authorUsername} · {formatDateTime(m.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "…" : "Reply"}
    </button>
  );
}

const initialReplyState: ReplyActionState = {};

export function ReportReplyForm({ reportId }: { reportId: string }) {
  const boundAction = replyToReport.bind(null, reportId);
  const [state, formAction] = useActionState(boundAction, initialReplyState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex items-start gap-2 border-t border-border pt-3">
      <textarea
        name="body"
        rows={2}
        maxLength={2000}
        placeholder="Reply…"
        className="flex-1 resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
      <SendButton />
      {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
    </form>
  );
}

export function ReportTypeSelect({ reportId, type }: { reportId: string; type: ContactType }) {
  return (
    <form action={setReportType.bind(null, reportId)}>
      <label className="text-xs text-muted">
        Contact type
        <select
          key={type}
          name="type"
          defaultValue={type}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
        >
          {CONTACT_TYPES.map((t) => (
            <option key={t} value={t}>
              {CONTACT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}

function ToggleButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}

export function ReportStatusButton({ reportId, status }: { reportId: string; status: "OPEN" | "CLOSED" }) {
  if (status === "OPEN") {
    return (
      <form action={closeReport.bind(null, reportId)}>
        <ToggleButton label="Close report" />
      </form>
    );
  }
  return (
    <form action={reopenReport.bind(null, reportId)}>
      <ToggleButton label="Reopen report" />
    </form>
  );
}

function GrantButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon mt-3 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Adding…" : "Add CC coins"}
    </button>
  );
}

const initialDepositState: DepositActionState = {};

export function AddCcCoinsForm({ reportId }: { reportId: string }) {
  const boundAction = addCcCoins.bind(null, reportId);
  const [state, formAction] = useActionState(boundAction, initialDepositState);

  return (
    <form action={formAction} className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-primary">Add CC coins</p>
      <p className="mt-1 text-[11px] text-muted">1 cc = 1 DT — credited straight to the user&apos;s balance.</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          name="amount"
          min={1}
          max={100000}
          defaultValue={10}
          className="w-28 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
        />
        <GrantButton />
      </div>
      {state.error && <p className="mt-2 text-xs text-primary-glow">{state.error}</p>}
      {state.success && <p className="mt-2 text-xs text-success">Added.</p>}
    </form>
  );
}

function ApproveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon flex-1 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Approving…" : "Approve"}
    </button>
  );
}

function RejectButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 rounded-md border border-border px-4 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Declining…" : "Decline"}
    </button>
  );
}

const initialShopPurchaseState: ShopPurchaseActionState = {};

// Shown instead of the generic type-select + Add CC Coins panel whenever the
// report was auto-opened by a shop cc-bundle purchase (report.shopItemId set)
// — approving grants the linked catalog item, declining just closes it out.
export function ShopPurchasePanel({
  reportId,
  shopItemTitle,
  grantsItemName,
}: {
  reportId: string;
  shopItemTitle: string;
  grantsItemName: string | null;
}) {
  const [approveState, approveAction] = useActionState(
    approveShopPurchase.bind(null, reportId),
    initialShopPurchaseState,
  );
  const [rejectState, rejectAction] = useActionState(
    rejectShopPurchase.bind(null, reportId),
    initialShopPurchaseState,
  );

  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-primary">Shop purchase</p>
      <p className="mt-1 text-sm text-foreground">{shopItemTitle}</p>
      <p className="text-[11px] text-muted">
        {grantsItemName ? `Approving grants "${grantsItemName}" to their inventory.` : "This item has no linked reward — check the shop catalog."}
      </p>

      <div className="mt-3 flex gap-2">
        <form action={approveAction} className="flex-1">
          <ApproveButton />
        </form>
        <form action={rejectAction} className="flex-1">
          <RejectButton />
        </form>
      </div>
      {approveState.error && <p className="mt-2 text-xs text-primary-glow">{approveState.error}</p>}
      {rejectState.error && <p className="mt-2 text-xs text-primary-glow">{rejectState.error}</p>}
    </div>
  );
}
