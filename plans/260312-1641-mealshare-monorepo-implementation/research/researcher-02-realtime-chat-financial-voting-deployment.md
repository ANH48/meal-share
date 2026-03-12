---
title: Researcher 02 - Real-time Chat + Financial Features + Deployment
date: 2026-03-12
---

## 1. Real-time GroupChat Architecture

### Decision: Supabase Realtime (recommended over NestJS WebSocket)
- Zero extra infra, built-in RLS, Postgres Changes broadcast
- NestJS REST writes messages → Supabase Realtime broadcasts to frontend
- On member removal: RLS revokes access immediately

### Message Soft-Delete
- `deleted_at: timestamp | null` — null = visible, set = deleted
- Client renders "Message deleted" when deleted_at is set

### RLS Policy for Chat Access
```sql
CREATE POLICY "active_members_only" ON group_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = group_messages.group_id
      AND user_id = auth.uid() AND status = 'active'
  )
);
```

## 2. Weekly Menu & Voting System

### Weekly Cycle (Monday-based)
```typescript
function getWeekStart(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}
```

### Vote State Machine: open → closed → results
- Duplicate prevention: unique constraint `(vote_id, user_id)` in vote_responses
- Auto-close via NestJS cron every 5 min checking `ends_at < now()`

### Weekly Menu States: draft → confirmed
- DB constraint: one confirmed menu per `(group_id, week_start_date)`

## 3. Financial Dashboard

### Aggregation Queries
```sql
-- Per-user weekly totals
SELECT DATE_TRUNC('week', date) as week, SUM(total_price)
FROM daily_orders WHERE user_id=$1 GROUP BY 1;

-- Group weekly summary
SELECT u.name, SUM(o.total_price) as total
FROM daily_orders o JOIN users u ON o.user_id=u.id
WHERE o.group_id=$1 AND o.date BETWEEN $2 AND $3 GROUP BY u.id, u.name;
```

### NestJS Auto-send Cron
```typescript
@Cron('0 20 * * *') // 8PM daily
async sendDailySummary() {
  for (const group of await this.groupsService.findAllActive()) {
    const summary = await this.ordersService.getDailySummary(group.id);
    await this.messagesService.createSystemMessage(group.id, formatSummary(summary));
    await this.firebaseService.sendToGroup(group.memberTokens, summary);
  }
}
```

### Charts: Recharts via shadcn/ui native chart components

## 4. Invite System

### Simple Reusable Code (MVP)
```typescript
const inviteCode = nanoid(10); // stored in groups.invite_code
// URL: /join?code=V1StGXR8_Z
```
- LeaderGroup regenerates anytime
- Join: validate code → insert group_members(status='active')

## 5. Deployment: Railway

### Two Services from Monorepo
- `web`: build `turbo build --filter=web`, start `node apps/web/.next/standalone/server.js`
- `api`: build `turbo build --filter=api`, start `node apps/api/dist/main.js`

### Environment Variables
```
DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
FIREBASE_SERVICE_ACCOUNT_JSON (api only)
NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (web only)
```

## Key Recommendations

1. Supabase Realtime for chat (simpler than NestJS WebSocket)
2. Soft-delete with deleted_at timestamp
3. shadcn/ui Recharts for financial charts
4. nanoid reusable invite codes
5. Railway 2-service monorepo deployment
6. NestJS @Cron for automated price summaries

## Unresolved Questions

- Invite code expiry: reusable vs one-time?
- Timezone: user local vs UTC for weekly cycle?
- Weekly menu: same dishes all week or per-day?
- PWA support needed?
