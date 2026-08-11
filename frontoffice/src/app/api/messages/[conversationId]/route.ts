import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMessages, markConversationRead } from "@/lib/messages";

// Polled every ~4s by the open thread (see MessageThread) — a plain Route
// Handler, not a Server Action, for the same reason as /api/posts/[id]/view:
// invoking a Server Action triggers Next's automatic current-route refresh,
// which would refetch this page's whole RSC tree on every poll tick instead
// of just the handful of new messages. Also doubles as the "mark read"
// trigger — see messages/actions.ts's comment on why that isn't a Server
// Action either.
export async function GET(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const viewerId = session.user.id;

  // Captured before the query, not after — using the post-query timestamp as
  // the next poll's "since" bookmark would silently drop any message inserted
  // in the gap between running the query and computing the timestamp.
  const serverTime = new Date();

  const { conversationId } = await params;
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");
  const sinceDate = since && !Number.isNaN(Date.parse(since)) ? new Date(since) : new Date(0);

  const messages = await getMessages(conversationId, viewerId, sinceDate);
  if (messages === null) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Being actively polled implies the thread is open right now — mark
  // everything sent to the viewer as read, not just what's in this response.
  await markConversationRead(conversationId, viewerId);

  return NextResponse.json({ messages, serverTime: serverTime.toISOString() });
}
