import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

/**
 Verifies the Bearer token in the Authorization header and attaches the decoded payload ({ id, username }) to req.user.
 */
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res
      .status(401)
      .json({ error: 'Missing or malformed Authorization header.' });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export { requireAuth };
