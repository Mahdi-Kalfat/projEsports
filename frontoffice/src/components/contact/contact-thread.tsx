"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { Paperclip, X } from "lucide-react";
import { sendContactMessage, type ContactMessageActionState } from "@/app/(app)/contact/actions";
import { linkifyText } from "@/lib/linkify";

const POLL_INTERVAL_MS = 4000;

type ContactMessageView = { id: string; body: string; imageUrl: string | null; isAdmin: boolean; createdAt: Date };

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function SendSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "…" : "Send"}
    </button>
  );
}

// One-off coachmark pointing at the attach button — a pulsing ring plus a
// hand-drawn-style arrow and label. Purely visual; the parent owns whether
// it's shown at all and clears it the moment the button actually gets used.
function AttachTutorial() {
  return (
    <div className="pointer-events-none absolute -top-14 right-0 z-10 flex flex-col items-end">
      <div className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-[0_0_16px_rgba(255,30,60,0.5)]">
        Press this to send your proof
      </div>
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="mr-4 text-primary">
        <path
          d="M6 4 C 6 18, 24 14, 26 30"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="1 5"
        />
        <path
          d="M19 26 L26 30 L28 22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

const initialState: ContactMessageActionState = {};

// Lets a buyer reply with a screenshot (e.g. proof of payment for a
// MONEY-priced purchase) alongside or instead of text — see buyShopItem's
// auto-generated message, which now asks for exactly that.
function SendForm({
  reportId,
  showProofTutorial,
  onSent,
}: {
  reportId: string;
  showProofTutorial: boolean;
  onSent: () => void;
}) {
  const boundAction = sendContactMessage.bind(null, reportId);
  const [state, formAction] = useActionState(boundAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [tutorialDismissed, setTutorialDismissed] = useState(false);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setFileName(null);
      onSent();
    }
  }, [state, onSent]);

  const tutorialVisible = showProofTutorial && !tutorialDismissed;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 border-t border-border pt-3">
      {fileName && (
        <div className="flex items-center gap-1.5 self-start rounded-md bg-surface px-2.5 py-1 text-xs text-muted">
          <Paperclip size={12} />
          {fileName}
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.value = "";
              setFileName(null);
            }}
            aria-label="Remove attachment"
            className="text-muted transition hover:text-primary"
          >
            <X size={12} />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          name="body"
          maxLength={2000}
          placeholder="Message…"
          autoComplete="off"
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
        <input
          ref={fileInputRef}
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
          className="hidden"
          id={`attach-${reportId}`}
        />
        <div className="relative">
          {tutorialVisible && (
            <>
              <span className="absolute inset-0 -m-1 animate-ping rounded-md bg-primary/50" />
              <AttachTutorial />
            </>
          )}
          <label
            htmlFor={`attach-${reportId}`}
            title="Attach a screenshot"
            onClick={() => setTutorialDismissed(true)}
            className={`relative flex cursor-pointer items-center rounded-md border p-2.5 text-muted transition hover:border-primary hover:text-primary ${
              tutorialVisible ? "border-primary text-primary" : "border-border"
            }`}
          >
            <Paperclip size={16} />
          </label>
        </div>
        <SendSubmitButton />
      </div>
      {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
    </form>
  );
}

export function ContactThread({
  reportId,
  status,
  initialMessages,
  showProofTutorial = false,
}: {
  reportId: string;
  status: "OPEN" | "CLOSED";
  initialMessages: ContactMessageView[];
  showProofTutorial?: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const pollNowRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    let sinceIso = messages.at(-1)?.createdAt.toISOString() ?? new Date(0).toISOString();

    async function poll() {
      try {
        const res = await fetch(`/api/contact/${reportId}?since=${encodeURIComponent(sinceIso)}`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data: {
          messages: Array<Omit<ContactMessageView, "createdAt"> & { createdAt: string }>;
          serverTime: string;
        } = await res.json();

        if (data.messages.length > 0) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const fresh = data.messages
              .filter((m) => !seen.has(m.id))
              .map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        }
        sinceIso = data.serverTime;
      } catch {
        // Background poll — a network hiccup just waits for the next tick.
      }
    }

    pollNowRef.current = poll;
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-raised p-5">
      <ul className="flex min-h-[30vh] flex-col gap-2">
        {messages.length === 0 && <p className="text-sm text-muted">No messages yet.</p>}
        {messages.map((m) => (
          <li key={m.id} className={`flex ${m.isAdmin ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[75%] rounded-md px-3 py-2 text-sm ${
                m.isAdmin ? "bg-surface text-foreground" : "bg-primary text-white"
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
              <p className={`mt-1 text-[10px] ${m.isAdmin ? "text-muted" : "text-white/70"}`}>
                {m.isAdmin ? "Admin" : "You"} · {formatDateTime(m.createdAt)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {status === "OPEN" ? (
        <SendForm reportId={reportId} showProofTutorial={showProofTutorial} onSent={() => pollNowRef.current()} />
      ) : (
        <p className="border-t border-border pt-3 text-center text-xs text-muted">This ticket is closed.</p>
      )}
    </div>
  );
}
