export type PostAuthor = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

export type PostCommentData = {
  id: string;
  body: string;
  createdAt: Date;
  author: PostAuthor;
};

export type RepostTarget = {
  id: string;
  body: string | null;
  mediaType: string;
  mediaUrl: string | null;
  createdAt: Date;
  author: PostAuthor;
};

export type PostData = {
  id: string;
  body: string | null;
  mediaType: string;
  mediaUrl: string | null;
  createdAt: Date;
  author: PostAuthor;
  likeCount: number;
  likedByViewer: boolean;
  views: number;
  comments: PostCommentData[];
  // repostOfId set but repostOf null means the original was since deleted —
  // the two are distinguished on purpose so the UI can show a placeholder
  // instead of silently rendering as a normal post.
  repostOfId: string | null;
  repostOf: RepostTarget | null;
  repostCount: number;
  repostedByViewer: boolean;
};
