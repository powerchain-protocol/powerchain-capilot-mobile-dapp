# Prisma Database

PowerChain Copilot Mobile **1.0.0** uses PostgreSQL and Prisma 7.

## Files

```text
apps/api/prisma.config.ts
apps/api/prisma/schema.prisma
apps/api/prisma/migrations/
```

The generated server client is configured for:

```text
apps/api/src/generated/prisma
```

## Models

```text
User
AccountProfile
Session
Wallet
WalletChallenge
AiConversation
AiMessage
PriceSnapshot
AuditEvent
```

## Commands

From the server package:

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:deploy
```

## Migration policy

- Never edit a migration that has already been deployed to a shared environment.
- Create a new migration for schema changes.
- Validate migrations against staging before production deployment.
- Back up production data before destructive migrations.
- Keep migration execution in release CI/CD, not in the mobile application.
