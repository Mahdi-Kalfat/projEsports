import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// A plain Route Handler, not a Server Action — PostViewTracker fires this via
// fetch() on mount so a view doesn't trigger Next's automatic current-route
// refresh that Server Actions cause (see the create-clan redirect bug), which
// would otherwise re-fetch the whole profile page's RSC tree per post shown.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const { id } = await params;
  await prisma.post.updateMany({ where: { id }, data: { views: { increment: 1 } } });

  return NextResponse.json({ ok: true });
}
