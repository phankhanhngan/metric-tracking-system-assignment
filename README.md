## Tech Stack

- **Runtime:** Node.js 23, TypeScript, Express 5
- **Database:** TimescaleDB (PostgreSQL) with Prisma migrations + Kysely query builder
- **Cache:** Redis (10min TTL for recent, 1 week for historical)
- **Queue:** AWS SQS (LocalStack for local dev)
- **Validation:** Zod + OpenAPI/Swagger docs
- **Testing:** Vitest + Supertest

## Prerequisites

- Node.js >= 23
- pnpm >= 10
- Docker & Docker Compose

## Quick Start (Docker Compose)

This spins up all three services plus Postgres, Redis, and LocalStack:

```bash
docker compose up --build
```

Services will be available at:
- Collector: http://localhost:8081
- Query: http://localhost:8082
- Consumer: http://localhost:8083


## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up postgres redis localstack
```

### 3. Set up the database

```bash
cp .env.template .env
pnpm prisma:migrate
```

## Database

Uses TimescaleDB hypertables with:
- 1-month chunk intervals for time-series partitioning
- Composite index on `(user_id, type, date DESC)`
- Automatic retention: drops data older than 1 year

```bash
pnpm prisma:migrate       # Run migrations (dev)
pnpm prisma:migrate:prod  # Run migrations (production)
pnpm prisma:reset          # Reset database
```

## Unit Conversion

All values are stored in base units (meter for distance, Celsius for temperature). Original values and units are preserved.

**Distance:** meter, centimeter, inch, feet, yard
**Temperature:** Celsius, Fahrenheit, Kelvin

## Testing

```bash
pnpm test          # Run all tests
pnpm test:cov      # Run with coverage
```

## Scripts Reference

| Script                         | Description                                                |
|--------------------------------|------------------------------------------------------------|
| `pnpm build`                   | TypeScript compile + bundle with tsup                     |
| `pnpm start:dev:*`             | Hot-reload dev server (tsx --watch)                       |
| `pnpm start:*`                 | Production server from dist/                              |
| `pnpm test`                    | Run tests with Vitest                                     |
| `pnpm test:cov`                | Tests with coverage report                                |
| `pnpm prisma:migrate`          | Run database migrations                                   |
| `pnpm dev:metrics:generator`   | Generate metrics (default 1k every 5 minutes via SQS)     |
| `pnpm dev:sqs:buffer`          | Buffer SQS messages then batch-insert metrics into Postgres |
