import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';

const AUTHOR_SELECT = { id: true, username: true } as const;

const postWithRelations = Prisma.validator<Prisma.PostDefaultArgs>()({
  include: {
    author: { select: AUTHOR_SELECT },
    likes: { select: { userId: true } },
    _count: { select: { likes: true, comments: true } },
  },
});
type PostWithRelations = Prisma.PostGetPayload<typeof postWithRelations>;

interface SerializedPost {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; username: string };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

function serializePost(
  post: PostWithRelations,
  currentUserId: string,
): SerializedPost {
  return {
    id: post.id,
    content: post.content,
    createdAt: post.createdAt,
    author: post.author,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByMe: post.likes.some(
      (l: { userId: string }) => l.userId === currentUserId,
    ),
  };
}

interface CreatePostBody {
  content: string;
}

async function createPost(
  req: Request<unknown, unknown, CreatePostBody>,
  res: Response,
): Promise<void> {
  const { content } = req.body;
  const userId = req.user!.id;

  const post = await prisma.post.create({
    data: { content, authorId: userId },
    include: {
      author: { select: AUTHOR_SELECT },
      likes: { where: { userId }, select: { userId: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  res.status(201).json({ post: serializePost(post, userId) });
}

interface GetPostsQuery {
  page?: string;
  limit?: string;
  username?: string;
}

/**
 * GET /posts?page=1&limit=10&username=alice
 * Returns newest-first, paginated. Optional username filter for the feed.
 */
async function getPosts(
  req: Request<unknown, unknown, unknown, GetPostsQuery>,
  res: Response,
): Promise<void> {
  const userId = req.user!.id;
  const page = Math.max(parseInt(req.query.page ?? '1', 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit ?? '10', 10) || 10, 1),
    50,
  );
  const { username } = req.query;

  const where: Prisma.PostWhereInput = username
    ? { author: { username: { equals: username, mode: 'insensitive' } } }
    : {};

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: AUTHOR_SELECT },
        likes: { where: { userId }, select: { userId: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  res.json({
    posts: posts.map((p: PostWithRelations) => serializePost(p, userId)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
    },
  });
}

async function getPostById(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const userId = req.user!.id;
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      author: { select: AUTHOR_SELECT },
      likes: { where: { userId }, select: { userId: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });
  if (!post) {
    res.status(404).json({ error: 'Post not found.' });
    return;
  }
  res.json({ post: serializePost(post, userId) });
}

export { createPost, getPosts, getPostById };
