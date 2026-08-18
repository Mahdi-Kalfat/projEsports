import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOwnedContactRequest, getContactMessages } from "@/lib/contact";

// Polled every ~4s by the open thread (see ContactThread) — mirrors
// /api/messages/[conversationId]'s Route Handler + since/serverTime contract.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const serverTime = new Date();
  const { id } = await params;

  const report = await getOwnedContactRequest(id, session.user.id);
  if (!report) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");
  const sinceDate = since && !Number.isNaN(Date.parse(since)) ? new Date(since) : new Date(0);

  const messages = await getContactMessages(id, sinceDate);

  return NextResponse.json({ messages, serverTime: serverTime.toISOString() });
}
