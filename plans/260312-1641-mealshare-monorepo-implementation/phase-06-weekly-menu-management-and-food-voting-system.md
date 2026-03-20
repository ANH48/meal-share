---
title: "Phase 06 - Weekly Menu Management and Food Voting System"
status: done
priority: P1
effort: 2.5h
---

# Phase 06: Weekly Menu Management and Food Voting System

## Context Links
- Parent: [plan.md](./plan.md)
- Research: [Realtime Research](./research/researcher-02-realtime-chat-financial-voting-deployment.md)
- Dependencies: Phase 04 (menu items catalog), Phase 05 (group management)

## Overview
Implement weekly menu management (leader creates draft, adds dishes with prices, confirms) and voting system (leader creates vote session, participants vote, auto-close by deadline). Monday-based weekly cycle.

## Key Insights
- Weekly cycle is Monday-based; `getWeekStart()` utility needed in shared utils
- Weekly menu states: draft → confirmed (one confirmed per group per week)
- Vote states: open → closed → results (auto-close via cron every 5 min)
- Duplicate vote prevention: unique constraint `(vote_id, user_id)`
- Leader uses vote results to inform menu selection (not auto-applied)

## Requirements

### Functional
- Leader creates weekly menu (draft) for a specific week
- Leader adds/removes menu items to weekly menu with prices
- Leader confirms weekly menu (status: draft → confirmed)
- Leader creates vote session with menu item options and deadline
- Participants submit one vote per session
- Vote auto-closes when deadline passes (cron)
- View vote results (percentages, counts)

### Non-functional
- Only one confirmed menu per (group, week)
- Votes immutable after submission (no change vote)
- Auto-close cron runs every 5 minutes

## Architecture

### Weekly Menu Flow
```
Leader → POST /weekly-menus (draft) → Add items with prices → PATCH /weekly-menus/:id/confirm
Participant → GET /weekly-menus?groupId=X&week=Y → sees confirmed menu for the week
```

### Voting Flow
```
Leader → POST /votes (open, with options and deadline)
Participant → POST /votes/:id/respond (select one option)
Cron → every 5min → close expired votes
Leader → GET /votes/:id/results → view results
```

## Related Code Files

### Files to Create (Backend)
- `apps/api/src/modules/weekly-menus/weekly-menus.module.ts`
- `apps/api/src/modules/weekly-menus/weekly-menus.controller.ts`
- `apps/api/src/modules/weekly-menus/weekly-menus.service.ts`
- `apps/api/src/modules/weekly-menus/dto/create-weekly-menu.dto.ts`
- `apps/api/src/modules/weekly-menus/dto/add-menu-item.dto.ts`
- `apps/api/src/modules/votes/votes.module.ts`
- `apps/api/src/modules/votes/votes.controller.ts`
- `apps/api/src/modules/votes/votes.service.ts`
- `apps/api/src/modules/votes/dto/create-vote.dto.ts`
- `apps/api/src/modules/votes/dto/submit-vote.dto.ts`

### Files to Create (Frontend)
- `apps/web/src/app/(dashboard)/groups/[groupId]/menu/page.tsx`
- `apps/web/src/app/(dashboard)/groups/[groupId]/vote/page.tsx`
- `apps/web/src/components/menu/weekly-menu-builder.tsx`
- `apps/web/src/components/menu/weekly-menu-view.tsx`
- `apps/web/src/components/vote/create-vote-form.tsx`
- `apps/web/src/components/vote/vote-card.tsx`
- `apps/web/src/components/vote/vote-results.tsx`
- `apps/web/src/lib/api/weekly-menus.ts`
- `apps/web/src/lib/api/votes.ts`

### Files to Create (Shared)
- `packages/utils/src/date-helpers.ts`

### Files to Modify
- `apps/api/src/app.module.ts` — import WeeklyMenusModule, VotesModule

## Implementation Steps

### Shared Utils

1. **Create date helpers** (`packages/utils/src/date-helpers.ts`)
   ```typescript
   export function getWeekStart(date: Date = new Date()): Date {
     const d = new Date(date);
     const day = d.getDay();
     const diff = d.getDate() - day + (day === 0 ? -6 : 1);
     d.setDate(diff);
     d.setHours(0, 0, 0, 0);
     return d;
   }
   export function formatWeekLabel(weekStart: Date): string {
     // e.g., "Mar 10 - Mar 16, 2026"
   }
   ```

### Backend - Weekly Menus

2. **Create WeeklyMenusModule** — import PrismaModule, GroupsModule

3. **Create DTOs**
   ```typescript
   export class CreateWeeklyMenuDto {
     @IsUUID() groupId: string;
     @IsDateString() weekStartDate: string;
   }
   export class AddMenuItemDto {
     @IsUUID() menuItemId: string;
     @IsNumber() @Min(0) price: number;
   }
   ```

4. **Implement WeeklyMenusService**
   - `create(dto, userId)`: verify leader → check no existing menu for that week → create draft
   - `addItem(menuId, dto)`: add WeeklyMenuItem with price
   - `removeItem(menuId, itemId)`: remove WeeklyMenuItem
   - `updateItemPrice(menuId, itemId, price)`: update price
   - `confirm(menuId, userId)`: verify leader → check no other confirmed for same week → update status
   - `findByGroupAndWeek(groupId, weekStart)`: return confirmed menu with items
   - `findDraft(groupId, weekStart)`: return draft menu for editing

5. **Implement WeeklyMenusController**
   - `POST /weekly-menus` — create draft (leader, GroupMemberGuard)
   - `GET /weekly-menus?groupId=X&weekStart=Y` — get menu for week (member)
   - `GET /weekly-menus/:id` — menu detail with items (member)
   - `POST /weekly-menus/:id/items` — add item (leader)
   - `DELETE /weekly-menus/:id/items/:itemId` — remove item (leader)
   - `PATCH /weekly-menus/:id/items/:itemId` — update price (leader)
   - `PATCH /weekly-menus/:id/confirm` — confirm menu (leader)

### Backend - Votes

6. **Create VotesModule** — import PrismaModule, GroupsModule, ScheduleModule

7. **Create DTOs**
   ```typescript
   export class CreateVoteDto {
     @IsUUID() groupId: string;
     @IsString() title: string;
     @IsDateString() weekStartDate: string;
     @IsDateString() endsAt: string;
     @IsArray() @IsUUID(undefined, { each: true }) menuItemIds: string[];
   }
   export class SubmitVoteDto {
     @IsUUID() voteOptionId: string;
   }
   ```

8. **Implement VotesService**
   - `create(dto, userId)`: verify leader → create vote + vote_options → return
   - `submitResponse(voteId, dto, userId)`: verify member + vote open + not voted → insert
   - `getResults(voteId)`: aggregate counts per option, percentages
   - `findByGroup(groupId)`: list votes for group
   - `closeExpiredVotes()`: find open votes where `ends_at < now()` → set status='closed'

9. **Register cron** in VotesService
   ```typescript
   @Cron(CronExpression.EVERY_5_MINUTES)
   async handleVoteAutoClose() {
     await this.closeExpiredVotes();
   }
   ```

10. **Implement VotesController**
    - `POST /votes` — create vote (leader, GroupMemberGuard)
    - `GET /votes?groupId=X` — list votes (member)
    - `GET /votes/:id` — vote detail with options (member)
    - `POST /votes/:id/respond` — submit response (member)
    - `GET /votes/:id/results` — results (member)

### Frontend - Weekly Menu

11. **Build Menu Page** — week selector, conditional render builder vs view

12. **Build WeeklyMenuBuilder** (leader) — select dishes, set prices, confirm button

13. **Build WeeklyMenuView** (all members) — table with dish name, category, price

### Frontend - Voting

14. **Build Vote Page** — list sessions, create button for leader

15. **Build CreateVoteForm** — title, deadline, select menu items

16. **Build VoteCard** — radio options, submit, disabled after voting

17. **Build VoteResults** — bar chart with counts and percentages

## Todo List
- [ ] Create date helper utils (getWeekStart, formatWeekLabel)
- [ ] Create WeeklyMenusModule, Service, Controller
- [ ] Create weekly menu DTOs
- [ ] Implement draft → confirm workflow
- [ ] Implement add/remove/update menu items in weekly menu
- [ ] Create VotesModule, Service, Controller
- [ ] Create vote DTOs
- [ ] Implement vote creation with options
- [ ] Implement vote response submission (duplicate prevention)
- [ ] Implement vote auto-close cron (every 5 min)
- [ ] Implement vote results aggregation
- [ ] Build weekly menu page with week selector
- [ ] Build WeeklyMenuBuilder for leader
- [ ] Build WeeklyMenuView for all members
- [ ] Build vote list page
- [ ] Build CreateVoteForm, VoteCard, VoteResults components
- [ ] Test: create draft → add items → confirm → create vote → vote → auto-close → results

## Success Criteria
- Leader creates draft, adds items with prices, confirms
- Only one confirmed menu per group per week
- Vote creation with deadline works
- Participants can vote once (duplicate blocked)
- Auto-close cron closes expired votes
- Vote results show accurate counts and percentages

## Risk Assessment
- **Week boundary edge cases**: Always normalize to Monday using getWeekStart
- **Concurrent confirm**: Use DB unique constraint + transaction
- **Vote after close**: Check status in service before accepting

## Security Considerations
- Leader-only operations verified via GroupMemberGuard + role check
- Vote response uniqueness enforced at DB level
- Menu confirmation idempotent

## Next Steps
- Phase 07: Daily Food Ordering
