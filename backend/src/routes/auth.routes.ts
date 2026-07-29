import express, { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { signup, login, registerFcmToken, me } from "../controllers/auth.controller";

const router: Router = express.Router();

router.post(
  "/signup",
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be 3-20 characters.")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username may only contain letters, numbers, and underscores."),
    body("email").trim().isEmail().withMessage("A valid email is required.").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  validate,
  asyncHandler(signup)
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("A valid email is required.").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required."),
    body("fcmToken").optional().isString(),
  ],
  validate,
  asyncHandler(login)
);

router.post(
  "/fcm-token",
  requireAuth,
  [body("fcmToken").notEmpty().withMessage("fcmToken is required.")],
  validate,
  asyncHandler(registerFcmToken)
);

router.get("/me", requireAuth, asyncHandler(me));

export default router;
