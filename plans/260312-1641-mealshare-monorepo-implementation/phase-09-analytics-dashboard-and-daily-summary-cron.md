---
title: "Phase 09 - Analytics Dashboard and Daily Summary Cron"
status: pending
priority: P2
effort: 2.5h
---

# Phase 09: Analytics Dashboard and Daily Summary Cron

## Context Links
- Parent: [plan.md](./plan.md)
- Research: [Realtime Research](./research/researcher-02-realtime-chat-financial-voting-deployment.md)
- Dependencies: Phase 07 (orders data), Phase 08 (system messages for chat)

## Overview
Build analytics endpoints aggregating order data into personal and group-level financial summaries. Implement daily cron job (8PM) that auto-sends price summaries to group chat and push notifications. Build dashboard UI with charts (Recharts via shadcn/ui).

## Key Insights
- All financial data derived from `daily_orders` table (single source of truth)
- Aggregation queries: GROUP BY user, date, week for various views
- shadcn/ui includes chart components built on Recharts
- Cron runs at 8PM daily, iterates active groups, sends summary to chat + FCM

## Requirements

### Functional
- Personal analytics: daily/weekly/monthly expense totals, trend chart
- Group analytics: weekly cost breakdown by member
- Daily summary cron (8PM): insert system message in group chat
- Top dishes ranking (most ordered, highest spend)

### Non-functional
- Aggregation queries optimized with proper indexes
- Charts render client-side (Recharts)
- Cron timezone: configurable, default UTC

## Architecture

### Analytics Endpoints
```
GET /analytics/personal?groupId=X&period=weekly
GET /analytics/group?groupId=X&weekStart=Y
GET /analytics/personal/top-dishes?groupId=X
```

### Cron Flow
```
8PM daily → for each active group → query orders → format summary → insert system message → send FCM
```

## Related Code Files

### Files to Create (Backend)
- `apps/api/src/modules/analytics/analytics.module.ts`
- `apps/api/src/modules/analytics/analytics.controller.ts`
- `apps/api/src/modules/analytics/analytics.service.ts`
- `apps/api/src/modules/analytics/cron/daily-summary.cron.ts`

### Files to Create (Frontend)
- `apps/web/src/app/(dashboard)/groups/[groupId]/analytics/page.tsx`
- `apps/web/src/components/analytics/expense-chart.tsx`
- `apps/web/src/components/analytics/group-breakdown.tsx`
- `apps/web/src/components/analytics/personal-summary-card.tsx`
- `apps/web/src/components/analytics/top-dishes.tsx`
- `apps/web/src/lib/api/analytics.ts`

### Files to Modify
- `apps/api/src/app.module.ts` — import AnalyticsModule

## Implementation Steps

### Backend

1. **Create AnalyticsModule** — import PrismaModule, GroupsModule, MessagesModule, NotificationsModule

2. **Implement AnalyticsService**
   - `getPersonalDaily(userId, groupId, dateRange)`: daily totals
   - `getPersonalWeekly(userId, groupId, weeks)`: weekly totals
   - `getPersonalMonthly(userId, groupId)`: monthly totals
   - `getGroupWeeklyBreakdown(groupId, weekStart)`: per-member totals
   - `getTopDishes(userId, groupId, limit=5)`: most ordered dishes
   - `getDailySummary(groupId, date)`: formatted text for system message

3. **Implement AnalyticsController**
   - `GET /analytics/personal?groupId=X&period=daily|weekly|monthly` (member)
   - `GET /analytics/group?groupId=X&weekStart=Y` (member)
   - `GET /analytics/personal/top-dishes?groupId=X` (member)

4. **Implement DailySummaryCron**
   ```typescript
   @Cron('0 20 * * *') // 8PM daily
   async sendDailySummaries() {
     const activeGroups = await this.groups.findAllActive();
     for (const group of activeGroups) {
       const summary = await this.analytics.getDailySummary(group.id, today);
       if (summary) {
         await this.messages.createSystemMessage(group.id, summary);
       }
     }
   }
   ```

### Frontend

5. **Build Analytics Page** — tabs (Personal | Group), period selector

6. **Build ExpenseChart** — line chart for trends, bar chart for weekly comparison (shadcn/ui Chart + Recharts)

7. **Build GroupBreakdown** — table + pie chart showing per-member distribution

8. **Build PersonalSummaryCard** — weekly total, daily average, comparison badge

9. **Build TopDishes** — ranked list with bar chart

## Todo List
- [ ] Create AnalyticsModule, Service, Controller
- [ ] Implement personal analytics queries (daily/weekly/monthly)
- [ ] Implement group weekly breakdown query
- [ ] Implement top dishes query
- [ ] Implement getDailySummary (formatted text)
- [ ] Implement DailySummaryCron (8PM daily)
- [ ] Build analytics page with tabs and period selector
- [ ] Build ExpenseChart (line + bar)
- [ ] Build GroupBreakdown (table + pie)
- [ ] Build PersonalSummaryCard
- [ ] Build TopDishes ranked list
- [ ] Test: orders → view charts → trigger cron → verify system message

## Success Criteria
- Personal analytics accurate for all periods
- Group breakdown per-member totals correct
- Charts render with real data
- Daily cron inserts system message in chat
- No N+1 queries

## Risk Assessment
- **Empty data**: Graceful empty states
- **Performance**: Index on `(user_id, group_id, date)` in daily_orders
- **Cron failure**: Error handling + logging per group

## Security Considerations
- GroupMemberGuard on all endpoints
- Personal data only accessible by owner

## Next Steps
- Phase 10: Firebase Notifications
