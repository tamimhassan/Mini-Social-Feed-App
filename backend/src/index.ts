import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { initFirebase } from "./config/firebase";
import authRoutes from "./routes/auth.routes";
import postsRoutes from "./routes/posts.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

initFirebase();

const app: Application = express();

// --- Security & core middleware ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN === "*" ? true : (process.env.CORS_ORIGIN || "").split(","),
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "", 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || "", 10) || 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- Health check (useful for Render) ---
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);

// --- Error handling (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

const PORT: number = parseInt(process.env.PORT || "4000", 10);
app.listen(PORT, () => {
  console.log(`Mini Social Feed API listening on port ${PORT}`);
});

export default app;
