import type { FastifyInstance } from "fastify";
import { z } from "zod";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { authenticate } from "../lib/session";
import { prisma } from "../lib/prisma";
import { randomToken } from "../lib/crypto";

const addressSchema = z.string().trim().min(32).max(64);

export async function registerWalletRoutes(app: FastifyInstance) {
  app.post("/api/v1/wallets/challenge", async (request) => {
    const { user } = await authenticate(request);
    const { address } = z
      .object({ address: addressSchema })
      .parse(request.body);

    // Validate base58 public key shape.
    const publicKey = bs58.decode(address);
    if (publicKey.length !== 32) {
      throw Object.assign(new Error("Invalid Solana wallet address."), {
        statusCode: 400,
      });
    }

    const nonce = randomToken(24);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const message = [
      "PowerChain wallet verification",
      `Account: ${user.email}`,
      `Wallet: ${address}`,
      `Nonce: ${nonce}`,
      `Expires: ${expiresAt.toISOString()}`,
    ].join("\n");

    const challenge = await prisma.walletChallenge.create({
      data: {
        userId: user.id,
        address,
        nonce,
        message,
        expiresAt,
      },
    });

    return {
      id: challenge.id,
      address,
      message,
      expiresAt: expiresAt.toISOString(),
    };
  });

  app.post("/api/v1/wallets/verify", async (request, reply) => {
    const { user } = await authenticate(request);

    const input = z
      .object({
        challengeId: z.string().min(1),
        address: addressSchema,
        signatureBase58: z.string().min(1),
      })
      .parse(request.body);

    const challenge = await prisma.walletChallenge.findFirst({
      where: {
        id: input.challengeId,
        userId: user.id,
        address: input.address,
      },
    });

    if (
      !challenge ||
      challenge.usedAt ||
      challenge.expiresAt <= new Date()
    ) {
      return reply.code(400).send({
        error: "challenge_invalid",
        message: "Wallet challenge is invalid or expired.",
      });
    }

    let verified = false;
    try {
      verified = nacl.sign.detached.verify(
        new TextEncoder().encode(challenge.message),
        bs58.decode(input.signatureBase58),
        bs58.decode(input.address),
      );
    } catch {
      verified = false;
    }

    if (!verified) {
      return reply.code(400).send({
        error: "signature_invalid",
        message: "Wallet signature could not be verified.",
      });
    }

    const alreadyLinked = await prisma.wallet.findUnique({
      where: { address: input.address },
    });

    if (alreadyLinked && alreadyLinked.userId !== user.id) {
      return reply.code(409).send({
        error: "wallet_already_linked",
        message: "This wallet is already linked to another account.",
      });
    }

    const existingPrimary = await prisma.wallet.findFirst({
      where: { userId: user.id, isPrimary: true },
    });

    const wallet = await prisma.wallet.upsert({
      where: { address: input.address },
      create: {
        userId: user.id,
        address: input.address,
        network: "SOLANA",
        type: "EXTERNAL",
        isPrimary: !existingPrimary,
        verifiedAt: new Date(),
      },
      update: {
        userId: user.id,
        verifiedAt: new Date(),
      },
    });

    await prisma.walletChallenge.update({
      where: { id: challenge.id },
      data: { usedAt: new Date() },
    });

    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        action: "wallet.verified",
        resourceType: "wallet",
        resourceId: wallet.id,
        requestId: request.id,
        metadata: {
          network: "SOLANA",
          address: input.address,
        },
      },
    });

    return {
      id: wallet.id,
      address: wallet.address,
      verifiedAt: wallet.verifiedAt?.toISOString(),
    };
  });
}
