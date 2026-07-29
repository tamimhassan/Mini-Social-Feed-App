export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  fcmToken?: string | null;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  username: string;
  text: string;
  likeCount: number;
  likedByMe: boolean;
  comments: Comment[];
  createdAt: string;
}
