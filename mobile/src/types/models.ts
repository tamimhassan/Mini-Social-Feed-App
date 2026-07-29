export type User = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  fcmToken?: string | null;
};

export type TComment = {
  id: string;
  user: User;
  content: string;
  createdAt: string;
};

export type TPostCard = {
  id: string;
  content: string;
  createdAt: string;
  author: User;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
};

export type TPostDetail = TPostCard & {
  comments: TComment[];
};
