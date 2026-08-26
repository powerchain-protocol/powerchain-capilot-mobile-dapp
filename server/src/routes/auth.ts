import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  hashPassword,
  verifyPassword,
} from "../lib/crypto";
import {
  createSession,
  revokeCurrentSession,
} from "../lib/session";
import { accountView } from "../lib/account-view";
import { rateLimit } from "../lib/rate-limit";
import { env } from "../config/env";

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(10).max(128),
  displayName: z.string().trim().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/api/v1/auth/register", { preHandler: rateLimit({ namespace: "auth-register", limit: env.AUTH_RATE_LIMIT, windowMs: env.GLOBAL_RATE_WINDOW_MS }) }, async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const email = input.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({
        error: "account_exists",
        message: "An account already exists for this email.",
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(input.password),
        displayName: input.displayName,
        onboardingStatus: "IN_PROGRESS",
        profile: {
          create: {
            onboardingStep: 2,
            interests: [],
          },
        },
      },
      include: {
        profile: true,
        wallets: true,
      },
    });

    const token = await createSession(user.id, request);

    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        action: "account.registered",
        resourceType: "user",
        resourceId: user.id,
        requestId: request.id,
      },
    });

    return reply.code(201).send({
      token,
      account: accountView(user),
    });
  });

  app.post("/api/v1/auth/login", { preHandler: rateLimit({ namespace: "auth-login", limit: env.AUTH_RATE_LIMIT, windowMs: env.GLOBAL_RATE_WINDOW_MS }) }, async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const email = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true, wallets: true },
    });

    if (
      !user ||
      user.status !== "ACTIVE" ||
      !(await verifyPassword(input.password, user.passwordHash))
    ) {
      return reply.code(401).send({
        error: "invalid_credentials",
        message: "Email or password is incorrect.",
      });
    }

    const token = await createSession(user.id, request);

    return {
      token,
      account: accountView(user),
    };
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    await revokeCurrentSession(request);
    return reply.code(204).send();
  });
}
