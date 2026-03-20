---
title: "MealShare Monorepo Implementation"
description: "Full-stack meal-sharing money management app with Next.js 15, NestJS, Supabase, Firebase"
status: pending
priority: P1
effort: 22h
branch: main
tags: [nextjs, nestjs, supabase, firebase, turborepo, postgresql, prisma]
created: 2026-03-12
---

# MealShare - Implementation Plan

## Overview
Meal-sharing money management web app. Groups order food weekly, track expenses, chat in real-time, vote on menus.

## Architecture
- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Next.js 15 (App Router) + shadcn/ui
- **Backend**: NestJS + Prisma ORM + custom JWT auth
- **Database**: PostgreSQL on Supabase (Realtime for chat, Storage for images)
- **Notifications**: Firebase Cloud Messaging
- **Deploy**: Railway (2 services)

## Research Reports
- [Stack Research](./research/stack-research-turborepo-next-nestjs-supabase-integration.md)
- [Realtime + Financial + Deploy](./research/researcher-02-realtime-chat-financial-voting-deployment.md)

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 01 | Turborepo pnpm Monorepo Setup | 1.5h | pending | [phase-01](./phase-01-turborepo-pnpm-monorepo-setup.md) |
| 02 | Database Schema & Supabase | 2h | pending | [phase-02](./phase-02-database-schema-supabase.md) |
| 03 | JWT RBAC Authentication System | 2.5h | complete | [phase-03](./phase-03-jwt-rbac-authentication-system.md) |
| 04 | Admin Menu Catalog | 1.5h | pending | [phase-04](./phase-04-admin-menu-catalog.md) |
| 05 | Group Management | 2h | pending | [phase-05](./phase-05-group-management.md) |
| 06 | Weekly Menu & Food Voting System | 2.5h | pending | [phase-06](./phase-06-weekly-menu-management-and-food-voting-system.md) |
| 07 | Daily Food Ordering & Expense Tracking | 1.5h | pending | [phase-07](./phase-07-daily-food-ordering-and-expense-tracking.md) |
| 08 | GroupChat Real-time | 2h | complete | [phase-08](./phase-08-groupchat-realtime.md) |
| 09 | Analytics Dashboard & Daily Summary Cron | 2.5h | complete | [phase-09](./phase-09-analytics-dashboard-and-daily-summary-cron.md) |
| 10 | Firebase Notifications | 1.5h | pending | [phase-10](./phase-10-firebase-notifications.md) |
| 11 | Testing & Deployment | 3h | pending | [phase-11](./phase-11-testing-deployment.md) |

## Key Dependencies
- Phase 01 must complete first (all phases depend on monorepo)
- Phase 02 before any feature phases (03-10)
- Phase 03 before phases 04-10 (auth required)
- Phase 05 before phases 06-09 (groups required)
- Phase 06 before phase 07 (weekly menu required for orders)

## Unresolved Questions
- Google OAuth: Supabase Auth flow vs Passport-Google in NestJS? (recommend Supabase Auth)
- Invite code: reusable (simpler) vs one-time? (recommend reusable, leader can regenerate)
- Timezone: UTC for weekly cycle, display in user's local timezone
- Weekly menu: same dishes all week (MVP), per-day is future enhancement
- PWA: not in scope for MVP
