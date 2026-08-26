import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../lib/session";
import { prisma } from "../lib/prisma";
import { accountView } from "../lib/account-view";

const progressSchema = z.object({
  step: z.number().int().min(0).max(6),
  profile: z
    .object({
      organization: z.string().max(160).nullable().optional(),
      jobTitle: z.string().max(120).nullable().optional(),
      country: z.string().max(80).nullable().optional(),
      timezone: z.string().max(100).nullable().optional(),
      interests: z.array(z.string().max(50)).max(20).optional(),
    })
    .optional(),
});

export async function registerOnboardingRoutes(app: FastifyInstance) {
  app.patch("/api/v1/onboarding", async (request) => {
    const { user } = await authenticate(request);
    const input = progressSchema.parse(request.body);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingStatus: "IN_PROGRESS",
        profile: {
          upsert: {
            create: {
              onboardingStep: input.step,
              organization: input.profile?.organization,
              jobTitle: input.profile?.jobTitle,
              country: input.profile?.country,
              timezone: input.profile?.timezone,
              interests: input.profile?.interests ?? [],
            },
            update: {
              onboardingStep: input.step,
              organization: input.profile?.organization,
              jobTitle: input.profile?.jobTitle,
              country: input.profile?.country,
              timezone: input.profile?.timezone,
              interests: input.profile?.interests,
            },
          },
        },
      },
      include: { profile: true, wallets: true },
    });

    return accountView(updated);
  });

  app.post("/api/v1/onboarding/complete", async (request) => {
    const { user } = await authenticate(request);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingStatus: "COMPLETE",
        profile: {
          upsert: {
            create: { onboardingStep: 6 },
            update: { onboardingStep: 6 },
          },
        },
      },
      include: { profile: true, wallets: true },
    });

    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        action: "onboarding.completed",
        resourceType: "user",
        resourceId: user.id,
        requestId: request.id,
      },
    });

    return accountView(updated);
  });
}
