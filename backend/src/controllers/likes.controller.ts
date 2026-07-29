import { Request, Response } from "express";
import prisma from "../config/prisma";
import { sendPushNotification } from "../utils/notify";

/**
 * POST /posts/:id/like
 * Toggles a like: if the user already liked the post, this unlikes it;
 * otherwise it creates the like and notifies the post author (unless they're
 * liking their own post).
 */
async function toggleLike(req: Request<{ id: string }>, res: Response): Promise<void> {
  const postId = req.params.id;
  const userId = req.user!.id;
  const username = req.user!.username;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: { select: { id: true, username: true, fcmToken: true } } },
  });
  if (!post) {
    res.status(404).json({ error: "Post not found." });
    return;
  }

  const existingLike = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  let liked: boolean;
  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } });
    liked = false;
  } else {
    await prisma.like.create({ data: { postId, userId } });
    liked = true;
  }

  const likeCount = await prisma.like.count({ where: { postId } });

  if (liked && post.authorId !== userId) {
    sendPushNotification({
      token: post.author.fcmToken,
      title: "New like",
      body: `${username} liked your post.`,
      data: { type: "like", postId },
    }).catch((err: unknown) => console.error("Push notification error:", err));
  }

  res.json({ liked, likeCount });
}

export { toggleLike };
