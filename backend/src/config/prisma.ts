import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient instance across the app (recommended by Prisma docs)
// to avoid exhausting database connections in development with hot-reload.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export default prisma;
