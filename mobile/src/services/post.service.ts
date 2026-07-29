import { Post, Comment } from '../types/models';

const USE_MOCK = true;
const MOCK_DELAY = 500;

export class PostError extends Error {}

// in-memory mock "database" — resets on app reload
let mockPosts: Post[] = [
  {
    id: 'p1',
    authorId: 'u1',
    username: 'sarah_dev',
    text: 'Just shipped my first React Native app! 🎉',
    likeCount: 12,
    likedByMe: false,
    comments: [
      {
        id: 'c1',
        userId: 'u2',
        username: 'mike_codes',
        text: 'Congrats!',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'p2',
    authorId: 'u2',
    username: 'mike_codes',
    text: 'Anyone else debugging Reanimated for 3 hours straight?',
    likeCount: 8,
    likedByMe: true,
    comments: [],
    createdAt: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: 'p3',
    authorId: 'u3',
    username: 'jane_ux',
    text: 'Small UI polish makes a huge difference. Details matter.',
    likeCount: 24,
    likedByMe: false,
    comments: [
      {
        id: 'c2',
        userId: 'u1',
        username: 'sarah_dev',
        text: 'So true',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'c3',
        userId: 'u4',
        username: 'alex_pm',
        text: 'Agreed 100%',
        createdAt: new Date(Date.now() - 900000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'p4',
    authorId: 'u4',
    username: 'alex_pm',
    text: 'Sprint planning done. Onwards!',
    likeCount: 3,
    likedByMe: false,
    comments: [],
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

const PAGE_SIZE = 10;

export interface PaginatedPosts {
  posts: Post[];
  nextCursor: string | null;
}

export async function getPosts(
  cursor: string | null = null,
  username?: string,
): Promise<PaginatedPosts> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, MOCK_DELAY));
    let filtered = username
      ? mockPosts.filter((p) =>
          p.username.toLowerCase().includes(username.toLowerCase()),
        )
      : mockPosts;

    const sorted = [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const startIndex = cursor
      ? sorted.findIndex((p) => p.id === cursor) + 1
      : 0;
    const page = sorted.slice(startIndex, startIndex + PAGE_SIZE);
    const nextCursor =
      startIndex + PAGE_SIZE < sorted.length
        ? (page[page.length - 1]?.id ?? null)
        : null;

    return { posts: page, nextCursor };
  }
  // TODO: real call
  // const { data } = await apiClient.get('/posts', { params: { cursor, username } });
  // return data;
  throw new PostError('Not implemented');
}

export async function createPost(
  text: string,
  authorId: string,
  username: string,
): Promise<Post> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, MOCK_DELAY));
    if (!text.trim()) throw new PostError('Post cannot be empty');
    const newPost: Post = {
      id: 'p' + Date.now(),
      authorId,
      username,
      text: text.trim(),
      likeCount: 0,
      likedByMe: false,
      comments: [],
      createdAt: new Date().toISOString(),
    };
    mockPosts = [newPost, ...mockPosts];
    return newPost;
  }
  // TODO: real call to POST /posts
  throw new PostError('Not implemented');
}

export async function toggleLike(
  postId: string,
): Promise<{ likeCount: number; likedByMe: boolean }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 250));
    const post = mockPosts.find((p) => p.id === postId);
    if (!post) throw new PostError('Post not found');
    post.likedByMe = !post.likedByMe;
    post.likeCount += post.likedByMe ? 1 : -1;
    return { likeCount: post.likeCount, likedByMe: post.likedByMe };
  }
  // TODO: real call to POST /posts/:id/like
  throw new PostError('Not implemented');
}

export async function addComment(
  postId: string,
  text: string,
  userId: string,
  username: string,
): Promise<Comment> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, MOCK_DELAY));
    if (!text.trim()) throw new PostError('Comment cannot be empty');
    const post = mockPosts.find((p) => p.id === postId);
    if (!post) throw new PostError('Post not found');
    const newComment: Comment = {
      id: 'c' + Date.now(),
      userId,
      username,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    post.comments = [...post.comments, newComment];
    return newComment;
  }
  // TODO: real call to POST /posts/:id/comment
  throw new PostError('Not implemented');
}

export async function getPostById(postId: string): Promise<Post> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    const post = mockPosts.find((p) => p.id === postId);
    if (!post) throw new PostError('Post not found');
    return post;
  }
  throw new PostError('Not implemented');
}
