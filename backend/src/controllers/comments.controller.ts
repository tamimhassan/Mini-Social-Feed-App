import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendPushNotification } from '../utils/notify';

interface AddCommentBody {
  content: string;
}

/** POST /posts/:id/comment */
async function addComment(
  req: Request<{ id: string }, unknown, AddCommentBody>,
  res: Response,
): Promise<void> {
  const postId = req.params.id;
  const { content } = req.body;
  const userId = req.user!.id;
  const username = req.user!.username;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, username: true, fcmToken: true } },
    },
  });
  if (!post) {
    res.status(404).json({ error: 'Post not found.' });
    return;
  }

  const comment = await prisma.comment.create({
    data: { postId, userId, content },
    include: { user: { select: { id: true, username: true } } },
  });

  // notifies the post author (unless they're commenting their own post)
  if (post.authorId !== userId) {
    sendPushNotification({
      token: post.author.fcmToken,
      title: 'New comment',
      body: `${username} commented on your post: "${content.slice(0, 60)}"`,
      data: { type: 'comment', postId },
    }).catch((err: unknown) => console.error('Push notification error:', err));
  }

  res.status(201).json({
    comment: {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: comment.user,
    },
  });
}

interface GetCommentsQuery {
  page?: string;
  limit?: string;
}

/** GET /posts/:id/comments?page=&limit= */
async function getComments(
  req: Request<{ id: string }, unknown, unknown, GetCommentsQuery>,
  res: Response,
): Promise<void> {
  const postId = req.params.id;
  const page = Math.max(parseInt(req.query.page ?? '1', 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit ?? '20', 10) || 20, 1),
    100,
  );

  const postExists = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!postExists) {
    res.status(404).json({ error: 'Post not found.' });
    return;
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, username: true } } },
    }),
    prisma.comment.count({ where: { postId } }),
  ]);

  res.json({
    comments,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export { addComment, getComments };
