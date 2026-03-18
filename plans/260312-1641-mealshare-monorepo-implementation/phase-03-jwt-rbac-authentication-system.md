---
title: "Phase 03 - JWT RBAC Authentication System"
status: complete
priority: P1
effort: 2.5h
---

# Phase 03: JWT RBAC Authentication System

## Context Links
- Parent: [plan.md](./plan.md)
- Research: [Stack Research](./research/stack-research-turborepo-next-nestjs-supabase-integration.md)
- Dependencies: Phase 01 (monorepo), Phase 02 (database + Prisma)

## Overview
Implement JWT-based authentication in NestJS with email/password registration, login, refresh tokens, optional Google OAuth, and role-based access control guards. Build login/register pages in Next.js with Zustand auth state management.

## Key Insights
- Custom JWT in NestJS for full RBAC control (not Supabase Auth for session management)
- Refresh token rotation: issue new refresh token on each refresh, invalidate old one
- Group-scoped roles checked by GroupMemberGuard (queries group_members table)
- Google OAuth: use Supabase Auth for OAuth flow, then exchange for custom NestJS JWT

## Requirements

### Functional
- Register with email, name, password
- Login returns access token (15min) + refresh token (7d)
- Refresh token endpoint returns new token pair
- Google OAuth login/register
- `@CurrentUser()` decorator extracts user from JWT
- `@Roles()` decorator for global role checks
- `GroupMemberGuard` for group-scoped role checks
- Logout invalidates refresh token

### Non-functional
- bcrypt for password hashing (12 rounds)
- JWT HS256 (simpler for MVP)
- Rate limiting on auth endpoints (10 req/min)
- Input validation with class-validator

## Architecture

### Auth Flow
```
Register → hash password → insert user → issue tokens
Login → verify password → issue tokens
Refresh → verify refresh token → rotate tokens
Google OAuth → Supabase Auth → callback → upsert user → issue tokens
```

### Token Strategy
- Access token: 15min, contains `{ sub: userId, email, role }`
- Refresh token: 7d, stored hashed in DB or Redis
- Stored in httpOnly cookies (preferred) or localStorage (simpler)

### Guard Chain
```
Request → JwtAuthGuard → RolesGuard → GroupMemberGuard → Controller
```

## Related Code Files

### Files to Create (Backend)
- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/dto/register.dto.ts`
- `apps/api/src/modules/auth/dto/login.dto.ts`
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- `apps/api/src/modules/auth/strategies/jwt-refresh.strategy.ts`
- `apps/api/src/modules/users/users.module.ts`
- `apps/api/src/modules/users/users.service.ts`
- `apps/api/src/modules/users/users.controller.ts`
- `apps/api/src/common/guards/jwt-auth.guard.ts`
- `apps/api/src/common/guards/roles.guard.ts`
- `apps/api/src/common/guards/group-member.guard.ts`
- `apps/api/src/common/decorators/roles.decorator.ts`
- `apps/api/src/common/decorators/current-user.decorator.ts`
- `apps/api/src/common/filters/http-exception.filter.ts`

### Files to Create (Frontend)
- `apps/web/src/lib/api.ts` — axios/fetch wrapper with token interceptor
- `apps/web/src/stores/auth-store.ts` — Zustand auth state
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/register/page.tsx`
- `apps/web/src/app/(auth)/layout.tsx` — redirect if already logged in
- `apps/web/src/components/auth/login-form.tsx`
- `apps/web/src/components/auth/register-form.tsx`
- `apps/web/src/middleware.ts` — Next.js middleware for route protection

### Files to Modify
- `apps/api/src/app.module.ts` — import AuthModule, UsersModule

## Implementation Steps

### Backend

1. **Create AuthModule structure**
   - `auth.module.ts` imports JwtModule, PassportModule, UsersModule
   - Configure JwtModule with secret from env, 15min expiry

2. **Create DTOs with validation**
   ```typescript
   // register.dto.ts
   export class RegisterDto {
     @IsEmail() email: string;
     @IsString() @MinLength(2) name: string;
     @IsString() @MinLength(8) password: string;
   }
   // login.dto.ts
   export class LoginDto {
     @IsEmail() email: string;
     @IsString() password: string;
   }
   ```

3. **Implement AuthService**
   - `register(dto)`: check email unique → bcrypt hash → create user → generate tokens
   - `login(dto)`: find user by email → bcrypt compare → generate tokens
   - `refreshTokens(userId, refreshToken)`: verify → rotate → return new pair
   - `generateTokens(user)`: sign access + refresh JWTs
   - `validateGoogleUser(profile)`: upsert user by googleId → generate tokens

4. **Implement JWT Strategy** (`jwt.strategy.ts`)
   ```typescript
   @Injectable()
   export class JwtStrategy extends PassportStrategy(Strategy) {
     constructor(configService: ConfigService) {
       super({
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
         secretOrKey: configService.get('JWT_SECRET'),
       });
     }
     validate(payload: JwtPayload) {
       return { id: payload.sub, email: payload.email, role: payload.role };
     }
   }
   ```

5. **Implement AuthController**
   - `POST /auth/register` → RegisterDto → tokens
   - `POST /auth/login` → LoginDto → tokens
   - `POST /auth/refresh` → refresh token → new tokens
   - `POST /auth/google` → Google token → tokens
   - `POST /auth/logout` → invalidate refresh token
   - `GET /auth/me` → current user profile (protected)

6. **Create UsersService**
   - `findById(id)`, `findByEmail(email)`, `findByGoogleId(googleId)`
   - `create(data)`, `updateFcmToken(userId, token)`

7. **Implement Guards**
   - `JwtAuthGuard`: extends `AuthGuard('jwt')`, handles missing/invalid token
   - `RolesGuard`: reads `@Roles()` metadata, checks `user.role`
   - `GroupMemberGuard`: extracts `groupId` from params, queries `group_members` to verify membership and role

8. **Implement Decorators**
   ```typescript
   // @CurrentUser()
   export const CurrentUser = createParamDecorator(
     (data: string, ctx: ExecutionContext) => {
       const request = ctx.switchToHttp().getRequest();
       return data ? request.user?.[data] : request.user;
     },
   );
   // @Roles()
   export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
   ```

9. **Create HttpExceptionFilter** — consistent error response format

10. **Enable global validation pipe** in `main.ts`
    ```typescript
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });
    ```

### Frontend

11. **Create API client** (`lib/api.ts`)
    - Axios instance with base URL from env
    - Request interceptor: attach access token from Zustand store
    - Response interceptor: on 401, attempt refresh, retry original request

12. **Create Zustand auth store** (`stores/auth-store.ts`)
    ```typescript
    interface AuthState {
      user: User | null;
      accessToken: string | null;
      isAuthenticated: boolean;
      login: (tokens: TokenPair) => void;
      logout: () => void;
      setUser: (user: User) => void;
    }
    ```
    Persist tokens in localStorage (or cookies via middleware)

13. **Build login page** — shadcn/ui form with email + password fields, Google OAuth button, link to register

14. **Build register page** — form with name + email + password + confirm password

15. **Create Next.js middleware** (`middleware.ts`)
    - Protect `/(dashboard)` routes: redirect to `/login` if no token
    - Redirect `/(auth)` routes to `/` if already authenticated

16. **Create auth layout** (`(auth)/layout.tsx`)
    - Centered card layout for login/register forms

## Todo List
- [ ] Create AuthModule, AuthService, AuthController
- [ ] Create RegisterDto, LoginDto with validation
- [ ] Implement JWT strategy and refresh strategy
- [ ] Implement password hashing with bcrypt
- [ ] Create UsersModule and UsersService
- [ ] Implement JwtAuthGuard
- [ ] Implement RolesGuard with @Roles decorator
- [ ] Implement GroupMemberGuard
- [ ] Create @CurrentUser decorator
- [ ] Create HttpExceptionFilter
- [ ] Enable global ValidationPipe and CORS
- [ ] Create API client with token interceptor
- [ ] Create Zustand auth store
- [ ] Build login page with shadcn/ui
- [ ] Build register page with shadcn/ui
- [ ] Create Next.js middleware for route protection
- [ ] Test: register → login → access protected route → refresh token

## Success Criteria
- Register creates user with hashed password
- Login returns valid JWT tokens
- Protected routes reject requests without valid token
- Refresh token rotation works correctly
- RolesGuard blocks non-admin from admin endpoints
- GroupMemberGuard blocks non-members from group endpoints
- Frontend login/register forms functional with validation
- Middleware redirects unauthenticated users

## Risk Assessment
- **Token storage XSS**: httpOnly cookies preferred; localStorage acceptable for MVP
- **Refresh token leak**: rotate on each use, hash stored token
- **bcrypt timing**: 12 rounds balances security vs response time

## Security Considerations
- bcrypt 12 rounds for password hashing
- JWT secret from environment variable (min 32 chars)
- Rate limiting on auth endpoints
- Input validation/sanitization on all DTOs
- CORS restricted to frontend domain
- Refresh token rotation prevents reuse

## Next Steps
- Phase 04: Admin Features - Menu Catalog
