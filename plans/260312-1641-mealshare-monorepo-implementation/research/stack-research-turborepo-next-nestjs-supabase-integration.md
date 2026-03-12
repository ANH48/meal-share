
---
title: Researcher 01 - Monorepo + NestJS + Supabase Stack
date: 2026-03-12
---

## 1. Turborepo Monorepo: Next.js 15 + NestJS

### Recommended Structure
```
meal-share/
├── apps/
│   ├── web/          # Next.js 15 (App Router)
│   └── api/          # NestJS
├── packages/
│   ├── types/        # Shared TypeScript interfaces/DTOs
│   ├── utils/        # Shared utility functions
│   └── config/       # ESLint, tsconfig base
├── turbo.json
├── package.json      # Root workspace (pnpm recommended)
└── docker-compose.yml
```

### turbo.json Pipeline
```json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "test": { "dependsOn": ["build"] }
  }
}
```

### Key Points
- Use `pnpm workspaces` for package management
- `packages/types` exports shared DTOs used by both apps (no duplication)
- `turbo dev` runs both concurrently

---

## 2. Supabase with NestJS

### ORM: Prisma (recommended)
- Connects directly to Supabase PostgreSQL connection string
- Full type safety, migrations via `prisma migrate`

### Auth Strategy: Custom JWT in NestJS
- Full RBAC control (admin/leaderGroup/participant)
- `@nestjs/jwt` + `passport-jwt`
- For Google OAuth: Supabase Auth OAuth flow → exchange for custom JWT

### Supabase Realtime for GroupChat
- `supabase-js` in Next.js frontend subscribes to `group_messages` Postgres Changes
- NestJS writes messages to DB → Realtime broadcasts to frontend subscribers
- RLS: `SELECT` only if user is in active `group_members`

### RLS Considerations
- `group_messages`: policy checks `group_members.status = 'active'`
- `daily_orders`: user reads own records only
- NestJS uses service role key (bypasses RLS for admin operations)

---

## 3. NestJS RBAC Pattern

```typescript
// Decorator
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// Guard checks global role OR group-scoped role
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Post('menu')
createMenu() {}
```

### Group-Level Role Design
- Global: `users.role = 'admin' | 'user'`
- Group-scoped: `group_members.role = 'leader' | 'participant'`
- LeaderGroup = user with `group_members.role = 'leader'` for that group

---

## 4. Firebase FCM with NestJS

```typescript
@Injectable()
export class FirebaseService {
  async sendToUser(fcmToken: string, payload: Message) {
    await getMessaging(this.app).send({ token: fcmToken, ...payload });
  }
  async sendToGroup(tokens: string[], notification: MulticastMessage) {
    await getMessaging(this.app).sendEachForMulticast({ tokens, ...notification });
  }
}
```

- Store `fcm_token` in `users` table, updated on each login
- Clear token on `messaging/registration-token-not-registered` error

---

## Key Recommendations

1. **Prisma** for DB operations in NestJS (type-safe, migrations)
2. **Custom JWT** in NestJS; Supabase for DB + Realtime + Storage only
3. **Supabase Realtime** on frontend for chat (NestJS = write API only)
4. **pnpm + Turborepo** for monorepo
5. Group roles stored in `group_members.role`, not global `users.role`

## Unresolved Questions

- Google OAuth: Supabase Auth flow vs Passport-Google in NestJS?
- Menu item images: Supabase Storage vs external CDN?
- Chat: Supabase Realtime vs NestJS WebSocket Gateway?
