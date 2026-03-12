---
title: "Phase 11 - Testing & Deployment"
status: pending
priority: P1
effort: 3h
---

# Phase 11: Testing & Deployment

## Context Links
- Parent: [plan.md](./plan.md)
- Research: [Realtime Research](./research/researcher-02-realtime-chat-financial-voting-deployment.md)
- Dependencies: All previous phases (01-10)

## Overview
Write unit tests for critical NestJS services, E2E tests for key user flows, configure Docker for production, deploy to Railway (2 services: web + api), and set up CI/CD with GitHub Actions.

## Key Insights
- Railway supports monorepo deployments with root directory and build command configuration
- Next.js standalone output reduces deployment size
- NestJS compiles to `dist/main.js` for production
- GitHub Actions can run tests + deploy on push to main
- Test database: use Docker PostgreSQL in CI, or Supabase branch (if available)

## Requirements

### Functional
- Unit tests: auth service, groups service, orders service, analytics service
- E2E tests: register → login → create group → invite → order → chat
- Docker production builds for both apps
- Railway deployment with proper env vars
- GitHub Actions CI pipeline

### Non-functional
- Test coverage: >80% for service layer
- CI runs in < 5 minutes
- Zero-downtime deployment on Railway
- Environment separation: staging vs production

## Architecture

### CI/CD Pipeline
```
Push to main → GitHub Actions:
  1. Install deps (pnpm)
  2. Lint (turbo lint)
  3. Build (turbo build)
  4. Test (turbo test)
  5. Deploy to Railway (auto via Railway GitHub integration)
```

### Railway Setup
```
Railway Project:
├── Service: api
│   ├── Root: /
│   ├── Build: turbo build --filter=api
│   ├── Start: node apps/api/dist/main.js
│   └── Env: DATABASE_URL, JWT_SECRET, SUPABASE_*, FIREBASE_*
└── Service: web
    ├── Root: /
    ├── Build: turbo build --filter=web
    ├── Start: node apps/web/.next/standalone/server.js
    └── Env: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_*
```

## Related Code Files

### Files to Create (Tests)
- `apps/api/src/modules/auth/auth.service.spec.ts`
- `apps/api/src/modules/groups/groups.service.spec.ts`
- `apps/api/src/modules/orders/orders.service.spec.ts`
- `apps/api/src/modules/analytics/analytics.service.spec.ts`
- `apps/api/src/modules/messages/messages.service.spec.ts`
- `apps/api/test/auth.e2e-spec.ts`
- `apps/api/test/groups.e2e-spec.ts`
- `apps/api/test/orders.e2e-spec.ts`
- `apps/api/test/app.e2e-spec.ts`

### Files to Create (Deployment)
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `docker-compose.prod.yml`
- `.github/workflows/ci.yml`
- `railway.toml` (optional, Railway can auto-detect)

### Files to Modify
- `apps/api/package.json` — test scripts
- `apps/web/next.config.ts` — ensure standalone output
- `turbo.json` — ensure test pipeline configured

## Implementation Steps

### Unit Tests

1. **Auth Service Tests** (`auth.service.spec.ts`)
   - Test register: creates user with hashed password, returns tokens
   - Test register: rejects duplicate email
   - Test login: correct password returns tokens
   - Test login: wrong password throws UnauthorizedException
   - Test refreshTokens: valid refresh returns new pair
   - Test refreshTokens: invalid/expired refresh throws
   - Mock PrismaService and JwtService

2. **Groups Service Tests** (`groups.service.spec.ts`)
   - Test create: generates invite code, creates group + leader membership
   - Test joinByInviteCode: valid code creates membership
   - Test joinByInviteCode: invalid code throws NotFoundException
   - Test joinByInviteCode: already member throws ConflictException
   - Test removeMember: leader can remove participant
   - Test removeMember: participant cannot remove others

3. **Orders Service Tests** (`orders.service.spec.ts`)
   - Test create: calculates total_price correctly
   - Test create: rejects order from non-confirmed menu
   - Test create: rejects order for unavailable item
   - Test findGroupWeeklySummary: aggregates correctly

4. **Analytics Service Tests** (`analytics.service.spec.ts`)
   - Test getPersonalWeekly: returns correct aggregates
   - Test getGroupWeeklyBreakdown: returns per-member totals
   - Test getDailySummary: formats summary text correctly

5. **Messages Service Tests** (`messages.service.spec.ts`)
   - Test create: inserts user message
   - Test createSystemMessage: inserts system message with null sender
   - Test softDelete: sets deleted_at
   - Test update: only owner can edit

### E2E Tests

6. **Setup test environment**
   - Use `@nestjs/testing` TestingModule
   - Connect to test database (Docker PostgreSQL in CI)
   - Run migrations before tests
   - Clean DB between test suites

7. **Auth E2E** (`auth.e2e-spec.ts`)
   - POST /auth/register → 201 + tokens
   - POST /auth/login → 200 + tokens
   - GET /auth/me with valid token → 200 + user
   - GET /auth/me without token → 401

8. **Groups E2E** (`groups.e2e-spec.ts`)
   - Create group → join via invite → list members → remove member
   - Verify removed member gets 403 on group endpoints

9. **Orders E2E** (`orders.e2e-spec.ts`)
   - Create group → confirm menu → place order → verify summary

### Dockerfiles

10. **NestJS Dockerfile** (`apps/api/Dockerfile`)
    ```dockerfile
    FROM node:20-alpine AS base
    RUN corepack enable && corepack prepare pnpm@latest --activate
    WORKDIR /app
    COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
    COPY apps/api/package.json apps/api/
    COPY packages/types/package.json packages/types/
    COPY packages/utils/package.json packages/utils/
    COPY packages/config/ packages/config/
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm turbo build --filter=api

    FROM node:20-alpine AS runner
    WORKDIR /app
    COPY --from=base /app/apps/api/dist ./dist
    COPY --from=base /app/apps/api/node_modules ./node_modules
    COPY --from=base /app/apps/api/prisma ./prisma
    EXPOSE 3001
    CMD ["node", "dist/main.js"]
    ```

11. **Next.js Dockerfile** (`apps/web/Dockerfile`)
    ```dockerfile
    FROM node:20-alpine AS base
    RUN corepack enable && corepack prepare pnpm@latest --activate
    WORKDIR /app
    COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
    COPY apps/web/package.json apps/web/
    COPY packages/types/package.json packages/types/
    COPY packages/utils/package.json packages/utils/
    COPY packages/config/ packages/config/
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm turbo build --filter=web

    FROM node:20-alpine AS runner
    WORKDIR /app
    COPY --from=base /app/apps/web/.next/standalone ./
    COPY --from=base /app/apps/web/.next/static ./apps/web/.next/static
    COPY --from=base /app/apps/web/public ./apps/web/public
    EXPOSE 3000
    CMD ["node", "apps/web/server.js"]
    ```

### CI/CD

12. **GitHub Actions** (`.github/workflows/ci.yml`)
    ```yaml
    name: CI
    on:
      push: { branches: [main] }
      pull_request: { branches: [main] }
    jobs:
      ci:
        runs-on: ubuntu-latest
        services:
          postgres:
            image: postgres:16
            env:
              POSTGRES_USER: test
              POSTGRES_PASSWORD: test
              POSTGRES_DB: mealshare_test
            ports: ['5432:5432']
            options: >-
              --health-cmd pg_isready
              --health-interval 10s
              --health-timeout 5s
              --health-retries 5
        steps:
          - uses: actions/checkout@v4
          - uses: pnpm/action-setup@v4
          - uses: actions/setup-node@v4
            with: { node-version: 20, cache: pnpm }
          - run: pnpm install --frozen-lockfile
          - run: pnpm turbo lint
          - run: pnpm turbo build
          - run: pnpm turbo test
            env:
              DATABASE_URL: postgresql://test:test@localhost:5432/mealshare_test
              JWT_SECRET: test-secret-min-32-chars-long-here
    ```

### Railway Deployment

13. **Configure Railway**
    - Create Railway project with 2 services
    - Service `api`: root `/`, build `pnpm turbo build --filter=api`, start `node apps/api/dist/main.js`
    - Service `web`: root `/`, build `pnpm turbo build --filter=web`, start `node apps/web/.next/standalone/server.js`
    - Set env vars for each service
    - Enable auto-deploy from GitHub main branch
    - Run `prisma migrate deploy` as part of api build or release command

14. **Production environment setup**
    - Supabase project (production)
    - Firebase project (production)
    - Set all env vars in Railway dashboard
    - Custom domain configuration (if needed)

## Todo List
- [ ] Write auth.service.spec.ts (register, login, refresh)
- [ ] Write groups.service.spec.ts (create, join, remove)
- [ ] Write orders.service.spec.ts (create, summary)
- [ ] Write analytics.service.spec.ts (aggregations)
- [ ] Write messages.service.spec.ts (create, edit, delete)
- [ ] Set up E2E test environment
- [ ] Write auth.e2e-spec.ts
- [ ] Write groups.e2e-spec.ts
- [ ] Write orders.e2e-spec.ts
- [ ] Create Dockerfile for api
- [ ] Create Dockerfile for web
- [ ] Create docker-compose.prod.yml
- [ ] Create GitHub Actions CI workflow
- [ ] Set up Railway project with 2 services
- [ ] Configure env vars in Railway
- [ ] Run first deployment and verify
- [ ] Test production: register → create group → order → chat

## Success Criteria
- All unit tests pass (>80% service coverage)
- E2E tests pass for critical flows
- GitHub Actions CI runs green
- Both services deploy to Railway successfully
- Production app accessible and functional
- Database migrations run on deploy

## Risk Assessment
- **Test database state**: Clean DB between test suites; use transactions for isolation
- **Railway build time**: Turborepo caching may not work in CI; accept longer builds
- **Prisma migration in prod**: Use `prisma migrate deploy` (not `dev`) for production
- **Environment variable mismatch**: Validate all required vars on app startup

## Security Considerations
- Production secrets only in Railway env vars (never in repo)
- Database credentials rotated periodically
- HTTPS enforced on Railway custom domains
- CORS restricted to production frontend URL
- Rate limiting enabled in production

## Next Steps
- Post-launch: monitoring, error tracking (Sentry), performance optimization
- Future features: PWA, per-day menus, order cutoff time, leadership transfer
