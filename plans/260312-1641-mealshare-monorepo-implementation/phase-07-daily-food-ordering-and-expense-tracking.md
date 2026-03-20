---
title: "Phase 07 - Daily Food Ordering and Expense Tracking"
status: done
priority: P1
effort: 1.5h
---

# Phase 07: Daily Food Ordering and Expense Tracking

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: Phase 06 (confirmed weekly menu required)

## Overview
Implement daily food ordering where participants select dishes from the confirmed weekly menu for each day. Track quantity and calculate total price. Orders drive the financial dashboard data.

## Key Insights
- Orders only allowed from confirmed weekly menu items
- One order per user per dish per day (unique constraint), but user can order multiple dishes
- `total_price = quantity * weekly_menu_item.price`
- Orders are the source of truth for financial calculations

## Requirements

### Functional
- Participant selects dishes from confirmed weekly menu for today
- Set quantity per dish (default 1)
- total_price auto-calculated from quantity * price
- Edit order (change quantity or remove dish) before cutoff
- View own orders for the week
- Leader can view all group orders for a day/week

### Non-functional
- Unique constraint: `(user_id, group_id, date, weekly_menu_item_id)`
- MVP: no order cutoff time

## Architecture

### Order Flow
```
Participant → GET confirmed menu for this week
→ POST /orders { date, weeklyMenuItemId, quantity }
→ NestJS calculates total_price from weekly_menu_item.price * quantity
→ Response with order details
```

## Related Code Files

### Files to Create (Backend)
- `apps/api/src/modules/orders/orders.module.ts`
- `apps/api/src/modules/orders/orders.controller.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/orders/dto/create-order.dto.ts`
- `apps/api/src/modules/orders/dto/update-order.dto.ts`

### Files to Create (Frontend)
- `apps/web/src/app/(dashboard)/groups/[groupId]/orders/page.tsx`
- `apps/web/src/components/orders/daily-order-form.tsx`
- `apps/web/src/components/orders/order-summary.tsx`
- `apps/web/src/components/orders/group-orders-table.tsx`
- `apps/web/src/lib/api/orders.ts`

### Files to Modify
- `apps/api/src/app.module.ts` — import OrdersModule

## Implementation Steps

1. **Create OrdersModule** — import PrismaModule, GroupsModule, WeeklyMenusModule

2. **Create DTOs**
   ```typescript
   export class CreateOrderDto {
     @IsUUID() groupId: string;
     @IsDateString() date: string;
     @IsUUID() weeklyMenuItemId: string;
     @IsInt() @Min(1) @Max(10) quantity: number = 1;
   }
   export class UpdateOrderDto {
     @IsInt() @Min(0) @Max(10) quantity: number;
   }
   ```

3. **Implement OrdersService**
   - `create(dto, userId)`: verify active member → verify menu confirmed + item available → calc total_price → upsert
   - `update(orderId, dto, userId)`: verify ownership → if quantity=0 delete, else update
   - `findUserDailyOrders(userId, groupId, date)`: user's orders for a day
   - `findUserWeeklyOrders(userId, groupId, weekStart)`: user's orders for the week
   - `findGroupDailyOrders(groupId, date)`: all orders for group (leader view)
   - `findGroupWeeklySummary(groupId, weekStart)`: aggregated per user
   - `getDailySummary(groupId, date)`: formatted summary for system message

4. **Implement OrdersController**
   - `POST /orders` — create order (GroupMemberGuard)
   - `PATCH /orders/:id` — update quantity (owner only)
   - `DELETE /orders/:id` — delete order (owner only)
   - `GET /orders/my?groupId=X&date=Y` — my daily orders
   - `GET /orders/my/week?groupId=X&weekStart=Y` — my weekly orders
   - `GET /orders/group?groupId=X&date=Y` — group daily orders (leader)
   - `GET /orders/group/week?groupId=X&weekStart=Y` — group weekly summary (leader)

5. **Build Orders Page** — date selector, participant form + summary, leader table

6. **Build DailyOrderForm** — list menu items, quantity stepper, save button, day total

7. **Build OrderSummary** — personal weekly table with totals

8. **Build GroupOrdersTable** — leader view: all member orders, group total

## Todo List
- [ ] Create OrdersModule, Service, Controller
- [ ] Create DTOs with validation
- [ ] Implement order creation with price calculation
- [ ] Implement order update/delete (owner only)
- [ ] Implement user daily/weekly order queries
- [ ] Implement group daily/weekly summary queries (leader)
- [ ] Build orders page with date selector
- [ ] Build DailyOrderForm component
- [ ] Build personal OrderSummary component
- [ ] Build GroupOrdersTable for leader
- [ ] Test: place order → update → view summary → leader views group

## Success Criteria
- Orders from confirmed menu items only
- Total price calculated correctly
- Duplicate prevented by unique constraint
- Personal and group summaries accurate
- Leader sees all group member orders

## Risk Assessment
- **No confirmed menu**: Show empty state with message
- **Price changes after order**: total_price snapshot at order time
- **Late orders**: No cutoff in MVP

## Security Considerations
- GroupMemberGuard on all endpoints
- Order ownership verified for edit/delete
- Leader-only access for group-wide views

## Next Steps
- Phase 08: GroupChat with Real-time
