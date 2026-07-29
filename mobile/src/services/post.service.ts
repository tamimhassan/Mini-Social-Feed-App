import { apiClient } from './api';
import { TPostCard, TComment, TPostDetail } from '../types/models';

export class PostError extends Error {}

interface PostsResponse {
  posts: TPostCard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

interface CommentsResponse {
  comments: TComment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedPosts {
  posts: TPostCard[];
  nextCursor: string | null;
}

const PAGE_SIZE = 10;

export async function getPosts(
  cursor: string | null = null,
  username?: string,
): Promise<PaginatedPosts> {
  const page = cursor ? parseInt(cursor, 10) : 1;
  try {
    const { data } = await apiClient.get<PostsResponse>('/posts', {
      params: { page, limit: PAGE_SIZE, username: username || undefined },
    });
    return {
      posts: data.posts,
      nextCursor: data.pagination.hasNextPage ? String(page + 1) : null,
    };
  } catch (err) {
    throw new PostError(
      err instanceof Error ? err.message : 'Failed to load posts',
    );
  }
}

export async function createPost(
  text: string,
  _authorId: string,
  _username: string,
): Promise<TPostCard> {
  try {
    const { data } = await apiClient.post<{ post: TPostCard }>('/posts', {
      content: text,
    });
    return data.post;
  } catch (err) {
    throw new PostError(
      err instanceof Error ? err.message : 'Failed to create post',
    );
  }
}

export async function toggleLike(
  postId: string,
): Promise<{ likeCount: number; likedByMe: boolean }> {
  try {
    const { data } = await apiClient.post<{
      liked: boolean;
      likeCount: number;
    }>(`/posts/${postId}/like`);
    return { likeCount: data.likeCount, likedByMe: data.liked };
  } catch (err) {
    throw new PostError(
      err instanceof Error ? err.message : 'Failed to update like',
    );
  }
}

export async function addComment(
  postId: string,
  text: string,
  _userId: string,
  _username: string,
): Promise<TComment> {
  try {
    const { data } = await apiClient.post<{ comment: TComment }>(
      `/posts/${postId}/comment`,
      {
        content: text,
      },
    );
    return data.comment;
  } catch (err) {
    throw new PostError(
      err instanceof Error ? err.message : 'Failed to add comment',
    );
  }
}

export async function getPostById(postId: string): Promise<TPostDetail> {
  try {
    const { data } = await apiClient.get<{ post: TPostCard }>(
      `/posts/${postId}`,
    );
    const post: TPostDetail = { ...data.post, comments: [] };
    // Post detail needs the actual comment list, not just commentCount — fetch it separately
    post.comments = await getComments(postId);
    return post;
  } catch (err) {
    throw new PostError(err instanceof Error ? err.message : 'Post not found');
  }
}

export async function getComments(postId: string): Promise<TComment[]> {
  try {
    const { data } = await apiClient.get<CommentsResponse>(
      `/posts/${postId}/comments`,
      {
        params: { limit: 100 },
      },
    );
    return data.comments;
  } catch (err) {
    throw new PostError(
      err instanceof Error ? err.message : 'Failed to load comments',
    );
  }
}
