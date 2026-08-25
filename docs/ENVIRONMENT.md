# Full-Stack Environment Configuration

PowerChain Copilot Mobile **1.0.0** separates environment values by trust boundary.

## Files

```text
.env.example
frontend/.env.example
frontend/.env.production.example
server/.env.example
server/.env.production.example
```

## Trust boundary

### Root `.env`

Used for local orchestration and Prisma.

Typical values:

```text
DATABASE_URL
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
service ports
```

### Frontend `.env`

Only public client configuration.

Every `EXPO_PUBLIC_*` variable is readable by the installed application.

Allowed examples:

```text
API URL
Solana network
Solana RPC URL
public token mint addresses
Sui network
feature presentation flags
```

Forbidden:

```text
OPENAI_API_KEY
PYTH_API_KEY
BIRDEYE_API_KEY
DATABASE_URL
private keys
seed phrases
wallet secrets
server credentials
```

### Server `.env`

Private backend configuration.

Contains:

```text
PostgreSQL
CORS
session policy
AI limits
OpenAI key/model
Solana RPC
Sui RPC
Pyth
Birdeye
market cache policy
```

## Initialize

```bash
npm run env:init
```

Existing `.env` files are never overwritten.

Then edit:

```text
.env
frontend/.env
server/.env
```

## Validate examples

```bash
npm run env:check
```

Validate the actual API environment:

```bash
cd server
npm run env:check
```

## Local PostgreSQL

```bash
npm run db:up
npm run db:logs
```

Then:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Start full stack

```bash
npm run dev:stack
```

The launcher starts:

```text
server/    Fastify API
frontend/  Expo / Metro
```

PostgreSQL remains controlled through Docker Compose.

## Public runtime configuration

The API provides:

```text
GET /api/v1/config
```

It returns only non-secret runtime metadata:

```text
release
environment
Solana network / commitment
Token-2022 program
configured public asset mints
Sui network
provider configured/unconfigured flags
message character limit
```

Provider keys and database credentials are never returned.

## Health

```text
GET /api/v1/health
GET /api/v1/health/live
GET /api/v1/health/ready

GET /health/live
GET /health/ready
```

`ready` checks PostgreSQL.

## Production

Use:

```text
frontend/.env.production.example
server/.env.production.example
```

Production rules include:

```text
no localhost frontend API URL
no wildcard CORS
mainnet network values must be explicit
all secrets remain server-side
```


## CORS and mobile API namespace

The Expo client defaults to `http://localhost:3001/api/v1/capilot-mobile`.
The corrected `/api/v1/copilot-mobile` alias is also supported.

Development CORS:

```env
CORS_ORIGIN=http://localhost:8081,http://localhost:19006,http://localhost:3000
CORS_ALLOW_LOCALHOST=true
CORS_CREDENTIALS=false
CORS_MAX_AGE_SECONDS=86400
```

Each configured value must be a bare `http://` or `https://` origin. Paths, query
strings, fragments and embedded credentials are rejected during environment
validation. Production rejects wildcard and localhost origins.

See `API-NAMESPACE-CORS.md`.
