import type { FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { randomToken, sha256 } from "./crypto.js";
import { createSessionJwt, verifySessionJwt } from "./jwt.js";

export async function createSession(
  userId: string,
  request?: FastifyRequest,
) {
  const expiresAt = new Date(
    Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  const jti = randomToken();
  const rawToken =
    env.AUTH_TOKEN_MODE === "jwt"
      ? createSessionJwt({ userId, expiresAt, jti })
      : jti;
  const tokenHash = sha256(rawToken);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: request?.ip,
      userAgent:
        typeof request?.headers["user-agent"] === "string"
          ? request.headers["user-agent"]
          : null,
    },
  });

  return rawToken;
}

export async function authenticate(request: FastifyRequest) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Authentication required."), {
      statusCode: 401,
    });
  }

  const raw = authorization.slice("Bearer ".length);
  const jwtPayload =
    env.AUTH_TOKEN_MODE === "jwt" ? verifySessionJwt(raw) : null;
  if (env.AUTH_TOKEN_MODE === "jwt" && !jwtPayload) {
    throw Object.assign(new Error("JWT is invalid or expired."), {
      statusCode: 401,
    });
  }

  const tokenHash = sha256(raw);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          profile: true,
          wallets: true,
        },
      },
    },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    session.user.status !== "ACTIVE" ||
    (jwtPayload && jwtPayload.sub !== session.userId)
  ) {
    throw Object.assign(new Error("Session is invalid or expired."), {
      statusCode: 401,
    });
  }

  return { session, user: session.user };
}

export async function revokeCurrentSession(request: FastifyRequest) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return;

  const tokenHash = sha256(authorization.slice("Bearer ".length));

  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
