import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const password = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { username: "alice", email: "alice@example.com", password },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: { username: "bob", email: "bob@example.com", password },
  });

  const post = await prisma.post.create({
    data: { content: "Hello world! This is my first post 👋", authorId: alice.id },
  });

  await prisma.comment.create({
    data: { postId: post.id, userId: bob.id, content: "Welcome!" },
  });

  await prisma.like.create({
    data: { postId: post.id, userId: bob.id },
  });

  console.log("Seed complete. Test accounts: alice@example.com / bob@example.com (password: password123)");
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
