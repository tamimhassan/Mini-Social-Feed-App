import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

/**
 * Runs after express-validator check(...) chains.
 * If any validation failed, responds with 422 and a structured error list.
 */
function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      error: "Validation failed.",
      details: errors.array().map((e) => ({
        field: "path" in e ? e.path : e.type,
        message: e.msg as string,
      })),
    });
    return;
  }
  next();
}

export { validate };
