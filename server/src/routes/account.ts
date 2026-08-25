import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../lib/session";
import { prisma } from "../lib/prisma";
import { accountView } from "../lib/account-view";

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
  organization: z.string().trim().max(160).nullable().optional(),
  jobTitle: z.string().trim().max(120).nullable().optional(),
  country: z.string().trim().max(80).nullable().optional(),
  timezone: z.string().trim().max(100).nullable().optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
});

export async function registerAccountRoutes(app: FastifyInstance) {
  app.get("/api/v1/account/me", async (request) => {
    const { user } = await authenticate(request);
    return accountView(user);
  });

  app.patch("/api/v1/account/profile", async (request) => {
    const { user } = await authenticate(request);
    const input = profileSchema.parse(request.body);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(input.displayName
          ? { displayName: input.displayName }
          : {}),
        profile: {
          upsert: {
            create: {
              organization: input.organization,
              jobTitle: input.jobTitle,
              country: input.country,
              timezone: input.timezone,
              interests: input.interests ?? [],
            },
            update: {
              organization: input.organization,
              jobTitle: input.jobTitle,
              country: input.country,
              timezone: input.timezone,
              interests: input.interests,
            },
          },
        },
      },
      include: { profile: true, wallets: true },
    });

    return accountView(updated);
  });
}
