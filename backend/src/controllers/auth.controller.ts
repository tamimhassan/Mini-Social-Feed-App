import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma";
import { signToken } from "../utils/jwt";

const PUBLIC_USER_FIELDS = { id: true, username: true, email: true, createdAt: true } as const;

interface SignupBody {
  username: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
  fcmToken?: string;
}

interface FcmTokenBody {
  fcmToken: string;
}

async function signup(req: Request<unknown, unknown, SignupBody>, res: Response): Promise<void> {
  const { username, email, password } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    const field = existing.email === email ? "email" : "username";
    res.status(409).json({ error: `An account with that ${field} already exists.` });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: hashed },
    select: PUBLIC_USER_FIELDS,
  });

  const token = signToken({ id: user.id, username: user.username });
  res.status(201).json({ user, token });
}

async function login(req: Request<unknown, unknown, LoginBody>, res: Response): Promise<void> {
  const { email, password, fcmToken } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  // Opportunistically update the FCM token on login, since the mobile app
  // typically has a fresh token available right after auth.
  if (fcmToken) {
    await prisma.user.update({ where: { id: user.id }, data: { fcmToken } });
  }

  const token = signToken({ id: user.id, username: user.username });
  res.json({
    user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
    token,
  });
}

/** Lets the mobile app register/refresh its FCM device token after login (e.g. on app open). */
async function registerFcmToken(req: Request<unknown, unknown, FcmTokenBody>, res: Response): Promise<void> {
  const { fcmToken } = req.body;
  // requireAuth guarantees req.user is set for this route.
  const userId = req.user!.id;

  await prisma.user.update({
    where: { id: userId },
    data: { fcmToken },
  });
  res.json({ message: "FCM token registered." });
}

async function me(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PUBLIC_USER_FIELDS,
  });
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  res.json({ user });
}

export { signup, login, registerFcmToken, me };
