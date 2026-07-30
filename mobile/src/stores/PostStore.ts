import { makeAutoObservable } from 'mobx';
import { TPostCard } from '@/types/models';

class PostStore {
  posts = new Map<string, TPostCard>();

  constructor() {
    makeAutoObservable(this);
  }

  getPost(id: string): TPostCard | undefined {
    return this.posts.get(id);
  }

  upsertPost(post: TPostCard) {
    const existing = this.posts.get(post.id);
    this.posts.set(post.id, existing ? { ...existing, ...post } : post);
  }

  setLike(postId: string, likedByMe: boolean, likeCount: number) {
    const post = this.posts.get(postId);
    if (post) {
      post.likedByMe = likedByMe;
      post.likeCount = likeCount;
    }
  }

  incrementCommentCount(postId: string, by = 1) {
    const post = this.posts.get(postId);
    if (post) post.commentCount += by;
  }
}

export const postStore = new PostStore();
