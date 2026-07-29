/** Shape of the payload we sign into every JWT (and read back off req.user). */
export interface JwtUserPayload {
  id: string;
  username: string;
}

// Augment Express's Request type so `req.user` is known everywhere without
// casting, once the requireAuth middleware has run.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

export {};
