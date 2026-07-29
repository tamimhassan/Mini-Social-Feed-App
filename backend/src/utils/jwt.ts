import jwt, { SignOptions } from "jsonwebtoken";
import { JwtUserPayload } from "../types/express";

const JWT_SECRET: string | undefined = process.env.JWT_SECRET;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  // Fail fast in any environment - a missing secret is a serious misconfiguration.
  console.error("FATAL: JWT_SECRET is not set in the environment.");
  process.exit(1);
}

// Narrowed to `string` past this point (process.exit above never returns, but
// TypeScript doesn't know that, so we assert once here for the rest of the module).
const secret: string = JWT_SECRET;

function signToken(payload: JwtUserPayload): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, secret, options);
}

function verifyToken(token: string): JwtUserPayload {
  return jwt.verify(token, secret) as JwtUserPayload;
}

export { signToken, verifyToken };
