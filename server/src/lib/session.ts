import type { FastifyRequest } from "fastify";
import { env } from "../config/env";
import { prisma } from "./prisma";
import { randomToken, sha256 } from "./crypto";

export async function createSession(
  userId: string,
  request?: FastifyRequest,
) {
  const rawToken = randomToken();
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(
    Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

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
    session.user.status !== "ACTIVE"
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
