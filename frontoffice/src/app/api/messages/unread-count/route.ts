import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { countUnreadMessages } from "@/lib/messages";

// Polled every ~25s by the navbar badge (Navbar is already a client component).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const count = await countUnreadMessages(session.user.id);
  return NextResponse.json({ count });
}
