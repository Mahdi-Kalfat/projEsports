"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";
import { saveUploadedImage, saveUploadedVideo } from "@/lib/uploads";
import { postSchema, commentSchema } from "@/lib/validation/post";

export type PostActionState = { error?: string; success?: boolean };

export async function createPost(
  username: string,
  _prevState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const session = await requireFrontOfficeSession();

  const parsed = postSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your post and try again." };
  }

  const media = formData.get("media");
  let mediaUrl: string | undefined;
  let mediaType: "NONE" | "IMAGE" | "VIDEO" = "NONE";

  if (media instanceof File && media.size > 0) {
    if (media.type.startsWith("video/")) {
      const result = await saveUploadedVideo(media, "posts");
      if (result && "error" in result) return { error: result.error };
      mediaUrl = result?.url;
      mediaType = "VIDEO";
    } else {
      const result = await saveUploadedImage(media, "posts");
      if (result && "error" in result) return { error: result.error };
      mediaUrl = result?.url;
      mediaType = "IMAGE";
    }
  }

  if (!parsed.data.body && !mediaUrl) {
    return { error: "Write something or attach an image/video." };
  }

  await prisma.post.create({
    data: {
      authorId: session!.user.id,
      body: parsed.data.body,
      mediaType,
      mediaUrl,
    },
  });

  revalidatePath(`/profile/${username}`);
  return { success: true };
}

export async function deletePost(postId: string, username: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();

  // Reposts point at this row via repostOfId (onDelete: NoAction — Prisma
  // refuses to delete a Post that's still referenced), and deleting them
  // matches how retweets vanish when the source tweet is deleted, rather than
  // leaving dangling "no longer available" placeholders everywhere.
  const reposts = await prisma.post.findMany({ where: { repostOfId: postId }, select: { id: true } });
  const repostIds = reposts.map((r) => r.id);
  if (repostIds.length > 0) {
    await prisma.postComment.deleteMany({ where: { postId: { in: repostIds } } });
    await prisma.postLike.deleteMany({ where: { postId: { in: repostIds } } });
    await prisma.post.deleteMany({ where: { id: { in: repostIds } } });
  }

  await prisma.postComment.deleteMany({ where: { postId } });
  await prisma.postLike.deleteMany({ where: { postId } });
  await prisma.post.deleteMany({ where: { id: postId, authorId: session!.user.id } });
  revalidatePath(`/profile/${username}`);
}

export async function toggleLike(postId: string, username: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const existing = await prisma.postLike.findUnique({ where: { postId_userId: { postId, userId } } });
  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.postLike.create({ data: { postId, userId } });
  }

  revalidatePath(`/profile/${username}`);
}

// Toggle, mirroring toggleLike — but a repost is a full Post row (authored by
// the reposter) rather than a join-table row, so it shows up in the
// reposter's own feed for free. Reposting a repost flattens to the underlying
// original so chains never nest more than one level deep.
export async function toggleRepost(postId: string, username: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const target = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, repostOfId: true } });
  if (!target) return;
  const targetId = target.repostOfId ?? target.id;

  const existing = await prisma.post.findFirst({ where: { authorId: userId, repostOfId: targetId } });
  if (existing) {
    await prisma.postComment.deleteMany({ where: { postId: existing.id } });
    await prisma.postLike.deleteMany({ where: { postId: existing.id } });
    await prisma.post.delete({ where: { id: existing.id } });
  } else {
    await prisma.post.create({ data: { authorId: userId, repostOfId: targetId, mediaType: "NONE" } });
  }

  revalidatePath(`/profile/${username}`);
  if (session!.user.username !== username) revalidatePath(`/profile/${session!.user.username}`);
}

export async function addComment(
  postId: string,
  username: string,
  _prevState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const session = await requireFrontOfficeSession();

  const parsed = commentSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your comment and try again." };
  }

  await prisma.postComment.create({
    data: { postId, authorId: session!.user.id, body: parsed.data.body },
  });

  revalidatePath(`/profile/${username}`);
  return { success: true };
}

export async function deleteComment(commentId: string, username: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
    include: { post: { select: { authorId: true } } },
  });
  if (!comment) return;

  // The comment's own author or the post's author (basic moderation of your own
  // wall) can remove it — anyone else's delete request is silently ignored.
  if (comment.authorId !== userId && comment.post.authorId !== userId) return;

  await prisma.postComment.deleteMany({ where: { id: commentId } });
  revalidatePath(`/profile/${username}`);
}
