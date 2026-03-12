---
title: "Phase 01 - Turborepo pnpm Monorepo Setup"
status: pending
priority: P1
effort: 1.5h
---

# Phase 01: Turborepo pnpm Monorepo Setup

## Context Links
- Parent: [plan.md](./plan.md)
- Research: [Stack Research](./research/stack-research-turborepo-next-nestjs-supabase-integration.md)
- Dependencies: None (first phase)

## Overview
Initialize Turborepo monorepo with pnpm workspaces containing Next.js 15 frontend, NestJS backend, and shared packages. Set up local dev environment with Docker Compose.

## Key Insights
- Turborepo `pipeline` config enables parallel dev and cached builds
- pnpm workspaces for efficient dependency management
- Shared `packages/types` eliminates DTO duplication between frontend and backend
- Next.js 15 standalone output mode needed for Railway deployment

## Requirements

### Functional
- `turbo dev` starts both apps concurrently
- `turbo build` builds both apps with dependency ordering
- `turbo lint` lints all packages
- Shared types importable from both apps

### Non-functional
- pnpm for package management (faster, disk-efficient)
- Node.js 20+ required
- TypeScript strict mode in all packages

## Architecture

```
meal-share/
├── apps/
│   ├── web/          # Next.js 15 App Router
│   └── api/          # NestJS
├── packages/
│   ├── types/        # Shared TS interfaces & DTOs
│   ├── utils/        # Shared utility functions
│   └── config/       # Shared ESLint, tsconfig base
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
├── docker-compose.yml
├── .env.example
└── .gitignore
```

## Related Code Files

### Files to Create
- `package.json` — root workspace config
- `pnpm-workspace.yaml` — workspace paths
- `turbo.json` — pipeline config
- `.gitignore` — Node + Next.js + NestJS ignores
- `.env.example` — all env vars template
- `docker-compose.yml` — local PostgreSQL
- `apps/web/` — Next.js 15 app (via `create-next-app`)
- `apps/api/` — NestJS app (via `@nestjs/cli`)
- `packages/types/package.json` — shared types package
- `packages/types/tsconfig.json`
- `packages/types/src/index.ts` — barrel export
- `packages/utils/package.json` — shared utils package
- `packages/utils/src/index.ts`
- `packages/config/tsconfig.base.json` — shared tsconfig
- `packages/config/eslint.config.mjs` — shared eslint

## Implementation Steps

1. **Initialize root workspace**
   ```bash
   mkdir meal-share && cd meal-share
   pnpm init
   ```
   Edit `package.json`: set `"private": true`, add scripts `"dev": "turbo dev"`, `"build": "turbo build"`, `"lint": "turbo lint"`

2. **Create pnpm-workspace.yaml**
   ```yaml
   packages:
     - "apps/*"
     - "packages/*"
   ```

3. **Install Turborepo**
   ```bash
   pnpm add -D turbo -w
   ```

4. **Create turbo.json**
   ```json
   {
     "$schema": "https://turbo.build/schema.json",
     "pipeline": {
       "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
       "dev": { "cache": false, "persistent": true },
       "lint": {},
       "test": { "dependsOn": ["build"] }
     }
   }
   ```

5. **Create Next.js 15 app**
   ```bash
   cd apps
   pnpm create next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
   ```
   - Install shadcn/ui: `pnpm dlx shadcn@latest init` inside `apps/web`
   - Enable standalone output in `next.config.ts`: `output: 'standalone'`
   - Update `apps/web/package.json` name to `@meal-share/web`

6. **Create NestJS app**
   ```bash
   cd apps
   pnpm dlx @nestjs/cli new api --package-manager pnpm --strict
   ```
   - Update `apps/api/package.json` name to `@meal-share/api`
   - Install core deps: `pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt @prisma/client class-validator class-transformer @nestjs/schedule @nestjs/config`
   - Install dev deps: `pnpm add -D prisma @types/passport-jwt`

7. **Create packages/types**
   - `package.json` with name `@meal-share/types`, main `./dist/index.js`, types `./dist/index.d.ts`
   - `tsconfig.json` extending `packages/config/tsconfig.base.json`
   - `src/index.ts` — initial exports (User, Group, Role enums)
   - Build script: `tsc`

8. **Create packages/utils**
   - Same pattern as types
   - `src/index.ts` — export shared utilities (date helpers, formatters)

9. **Create packages/config**
   - `tsconfig.base.json` with strict mode, target ES2022, module NodeNext
   - `eslint.config.mjs` with TypeScript + Prettier rules

10. **Add workspace dependencies**
    - In `apps/web/package.json`: `"@meal-share/types": "workspace:*"`, `"@meal-share/utils": "workspace:*"`
    - In `apps/api/package.json`: same workspace deps
    - Run `pnpm install`

11. **Create docker-compose.yml**
    ```yaml
    services:
      db:
        image: postgres:16
        ports: ["5432:5432"]
        environment:
          POSTGRES_USER: mealshare
          POSTGRES_PASSWORD: mealshare
          POSTGRES_DB: mealshare
        volumes:
          - pgdata:/var/lib/postgresql/data
    volumes:
      pgdata:
    ```

12. **Create .env.example**
    ```
    DATABASE_URL=postgresql://mealshare:mealshare@localhost:5432/mealshare
    SUPABASE_URL=
    SUPABASE_SERVICE_ROLE_KEY=
    SUPABASE_ANON_KEY=
    JWT_SECRET=
    JWT_REFRESH_SECRET=
    GOOGLE_CLIENT_ID=
    GOOGLE_CLIENT_SECRET=
    FIREBASE_SERVICE_ACCOUNT_JSON=
    NEXT_PUBLIC_API_URL=http://localhost:3001
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    ```

13. **Create .gitignore** — include node_modules, .next, dist, .env, .turbo

14. **Verify setup**
    ```bash
    docker compose up -d
    pnpm install
    turbo build
    turbo dev
    ```

## Todo List
- [ ] Init root workspace with pnpm
- [ ] Create pnpm-workspace.yaml
- [ ] Install and configure Turborepo
- [ ] Create Next.js 15 app with shadcn/ui
- [ ] Create NestJS app with core dependencies
- [ ] Create packages/types with initial type exports
- [ ] Create packages/utils
- [ ] Create packages/config with shared tsconfig + eslint
- [ ] Wire workspace dependencies between apps and packages
- [ ] Create docker-compose.yml for local PostgreSQL
- [ ] Create .env.example and .gitignore
- [ ] Verify `turbo dev` runs both apps
- [ ] Verify `turbo build` succeeds

## Success Criteria
- `turbo dev` starts Next.js on :3000, NestJS on :3001
- `turbo build` succeeds with no errors
- `import { ... } from '@meal-share/types'` works in both apps
- Docker Compose starts PostgreSQL on :5432
- TypeScript strict mode enabled everywhere

## Risk Assessment
- **pnpm version mismatch**: Pin pnpm version in `packageManager` field
- **Turbo cache issues**: `turbo clean` if builds behave unexpectedly
- **Port conflicts**: Ensure 3000, 3001, 5432 available locally

## Security Considerations
- `.env` files in `.gitignore` (never commit secrets)
- Service role key only used server-side in NestJS

## Next Steps
- Phase 02: Database Schema & Supabase setup
