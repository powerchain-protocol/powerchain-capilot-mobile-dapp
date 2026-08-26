import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";

function base64url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(unsigned: string) {
  if (!env.JWT_SECRET) throw new Error("JWT_SECRET is not configured.");
  return createHmac("sha256", env.JWT_SECRET)
    .update(unsigned)
    .digest("base64url");
}

export function createSessionJwt(input: {
  userId: string;
  expiresAt: Date;
  jti: string;
}) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      sub: input.userId,
      jti: input.jti,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(input.expiresAt.getTime() / 1000),
      iss: "powerchain-copilot-mobile",
      aud: "powerchain-api",
    }),
  );
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function verifySessionJwt(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const unsigned = `${header}.${payload}`;
  const expected = Buffer.from(sign(unsigned));
  const actual = Buffer.from(signature || "");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload!, "base64url").toString("utf8")) as {
      sub?: string;
      exp?: number;
      iss?: string;
      aud?: string;
    };
    if (!decoded.sub || !decoded.exp) return null;
    if (decoded.iss !== "powerchain-copilot-mobile" || decoded.aud !== "powerchain-api") return null;
    if (decoded.exp <= Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}
