import express, { Router } from "express";
import { body, param, query } from "express-validator";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { createPost, getPosts, getPostById } from "../controllers/posts.controller";
import { toggleLike } from "../controllers/likes.controller";
import { addComment, getComments } from "../controllers/comments.controller";

const router: Router = express.Router();

// All post routes require authentication.
router.use(requireAuth);

router.post(
  "/",
  [
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Post content is required.")
      .isLength({ max: 2000 })
      .withMessage("Post content must be 2000 characters or fewer."),
  ],
  validate,
  asyncHandler(createPost)
);

router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer."),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("limit must be 1-50."),
    query("username").optional().trim().isLength({ min: 1, max: 20 }),
  ],
  validate,
  asyncHandler(getPosts)
);

router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid post id.")],
  validate,
  asyncHandler(getPostById)
);

router.post(
  "/:id/like",
  [param("id").isUUID().withMessage("Invalid post id.")],
  validate,
  asyncHandler(toggleLike)
);

router.post(
  "/:id/comment",
  [
    param("id").isUUID().withMessage("Invalid post id."),
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Comment content is required.")
      .isLength({ max: 1000 })
      .withMessage("Comment must be 1000 characters or fewer."),
  ],
  validate,
  asyncHandler(addComment)
);

router.get(
  "/:id/comments",
  [param("id").isUUID().withMessage("Invalid post id.")],
  validate,
  asyncHandler(getComments)
);

export default router;
