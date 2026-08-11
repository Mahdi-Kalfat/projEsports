"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";
import { commentSchema } from "@/lib/validation/post";

export type ProfileCommentActionState = { error?: string; success?: boolean };

export async function addProfileComment(
  profileId: string,
  username: string,
  _prevState: ProfileCommentActionState,
  formData: FormData,
): Promise<ProfileCommentActionState> {
  const session = await requireFrontOfficeSession();

  const parsed = commentSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your comment and try again." };
  }

  await prisma.profileComment.create({
    data: { profileId, authorId: session!.user.id, body: parsed.data.body },
  });

  revalidatePath(`/profile/${username}`);
  return { success: true };
}

export async function deleteProfileComment(commentId: string, username: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const comment = await prisma.profileComment.findUnique({
    where: { id: commentId },
    select: { authorId: true, profileId: true },
  });
  if (!comment) return;

  // The comment's own author or the profile owner (basic moderation of your
  // own wall) can remove it — mirrors deleteComment for post comments.
  if (comment.authorId !== userId && comment.profileId !== userId) return;

  await prisma.profileComment.deleteMany({ where: { id: commentId } });
  revalidatePath(`/profile/${username}`);
}
